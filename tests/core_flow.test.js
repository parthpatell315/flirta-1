const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { getDb } = require('../src/db/database');
const { seed } = require('../src/db/seed');

async function register(tag) {
  const email = `${tag}_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;
  const res = await request(app).post('/api/auth/register').send({
    email,
    password: 'password123',
    displayName: tag,
    dob: '1996-04-04',
    isAdultConfirmed: true,
    city: 'Mumbai'
  });
  assert.equal(res.status, 201);
  return { token: res.body.token, id: res.body.user.id, email };
}

test('Core dating flow: signup, match, and chat', async (t) => {
  getDb();

  await t.test('email signup rejects missing adult confirmation', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: `noconsent_${Date.now()}@example.com`,
      password: 'password123',
      displayName: 'No Consent',
      dob: '1995-01-01',
      isAdultConfirmed: false,
      city: 'Pune'
    });
    assert.equal(res.status, 400);
  });

  await t.test('phone OTP signup and login', async () => {
    const phone = `9${String(Date.now()).slice(-9)}`;
    const otpRes = await request(app).post('/api/auth/otp/request').send({ phone });
    assert.equal(otpRes.status, 200);
    assert.equal(otpRes.body.devOtp.length, 6);

    const verifyRes = await request(app).post('/api/auth/otp/verify').send({
      phone,
      otp: otpRes.body.devOtp,
      displayName: 'Phone User',
      dob: '1994-02-02',
      city: 'Delhi',
      isAdultConfirmed: true
    });
    assert.equal(verifyRes.status, 201);
    assert.ok(verifyRes.body.token);
    assert.equal(verifyRes.body.user.is_phone_verified, 1);
  });

  await t.test('mutual like creates a match and both people can chat', async () => {
    const a = await register('chata');
    const b = await register('chatb');

    const like = await request(app)
      .post('/api/match/like')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ receiverId: b.id, action: 'like' });
    assert.equal(like.status, 200);
    assert.equal(like.body.isMatch, false);

    const back = await request(app)
      .post('/api/match/like')
      .set('Authorization', `Bearer ${b.token}`)
      .send({ receiverId: a.id, action: 'like' });
    assert.equal(back.status, 200);
    assert.equal(back.body.isMatch, true);

    const conv = await request(app)
      .get('/api/messages/conversations')
      .set('Authorization', `Bearer ${a.token}`);
    assert.equal(conv.status, 200);
    assert.equal(conv.body.conversations.length, 1);

    const sent = await request(app)
      .post(`/api/messages/conversations/${conv.body.conversations[0].conversation_id}/messages`)
      .set('Authorization', `Bearer ${a.token}`)
      .send({ content: 'Hello from the match chat.' });
    assert.equal(sent.status, 201);

    const read = await request(app)
      .get(`/api/messages/conversations/${conv.body.conversations[0].conversation_id}/messages`)
      .set('Authorization', `Bearer ${b.token}`);
    assert.equal(read.status, 200);
    assert.equal(read.body.messages[0].content, 'Hello from the match chat.');
  });

  await t.test('unauthenticated discovery is rejected', async () => {
    const res = await request(app).get('/api/discovery');
    assert.equal(res.status, 401);
  });
});

test('Referral reward and host ledger use recorded transactions only', async (t) => {
  getDb();
  await seed();
  const referrer = await register('referrer');
  const code = (await request(app).get('/api/referrals/me').set('Authorization', `Bearer ${referrer.token}`)).body.code;

  const phone = `8${String(Date.now()).slice(-9)}`;
  const otpRes = await request(app).post('/api/auth/otp/request').send({ phone });
  const referred = await request(app).post('/api/auth/otp/verify').send({
    phone,
    otp: otpRes.body.devOtp,
    displayName: 'Referred',
    dob: '1993-03-03',
    city: 'Jaipur',
    isAdultConfirmed: true,
    referralCode: code
  });
  assert.equal(referred.status, 201);

  const admin = await request(app).post('/api/auth/login').send({
    email: 'admin@garbajodi.com',
    password: 'AdminGarba2026!'
  });
  assert.equal(admin.status, 200);

  const db = getDb();
  const selfie = db.prepare(`
    INSERT INTO verification_requests (user_id, selfie_url, status)
    VALUES (?, '/uploads/avatars/test-selfie.jpg', 'pending')
  `).run(referred.body.user.id);

  const review = await request(app)
    .patch(`/api/admin/verifications/${Number(selfie.lastInsertRowid)}`)
    .set('Authorization', `Bearer ${admin.body.token}`)
    .send({ status: 'approved' });
  assert.equal(review.status, 200);

  const mine = await request(app).get('/api/referrals/me').set('Authorization', `Bearer ${referrer.token}`);
  assert.equal(mine.body.totals.rewards, 1);
  assert.equal(mine.body.totals.premium_days, mine.body.rules.premiumDays);
  assert.equal(mine.body.rewards[0].reward_type, 'premium_days');

  const hostUser = await register('hostperson');
  const payer = await register('payer');
  await request(app).post('/api/hosts/apply').set('Authorization', `Bearer ${hostUser.token}`).send({
    pitch: 'I host small group conversations in public cafes.'
  });
  const hostReview = await request(app)
    .patch(`/api/hosts/admin/${hostUser.id}`)
    .set('Authorization', `Bearer ${admin.body.token}`)
    .send({ status: 'verified' });
  assert.equal(hostReview.status, 200);

  const order = await request(app)
    .post(`/api/hosts/${hostUser.id}/gifts/order`)
    .set('Authorization', `Bearer ${payer.token}`)
    .send({ amountInr: 100 });
  assert.equal(order.status, 201);
  assert.equal(order.body.platformFeeInr, 20);
  assert.equal(order.body.hostEarningInr, 80);

  const before = await request(app).get('/api/hosts/me/earnings').set('Authorization', `Bearer ${hostUser.token}`);
  assert.equal(before.body.captured.earned_inr, 0);

  const paid = await request(app)
    .post('/api/hosts/orders/verify')
    .set('Authorization', `Bearer ${payer.token}`)
    .send({ orderId: order.body.orderId });
  assert.equal(paid.status, 200);

  const after = await request(app).get('/api/hosts/me/earnings').set('Authorization', `Bearer ${hostUser.token}`);
  assert.equal(after.body.captured.earned_inr, 80);
  assert.equal(after.body.captured.fees_inr, 20);
  assert.equal(after.body.availableInr, 80);
  assert.equal(Object.prototype.hasOwnProperty.call(after.body, 'projected'), false);
});
