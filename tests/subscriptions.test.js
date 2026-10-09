const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { getDb } = require('../src/db/database');
const { seed } = require('../src/db/seed');

async function createSubscriberUser(suffix) {
  const email = `sub_user_${suffix}_${Date.now()}@example.com`;
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password: 'password123',
      displayName: `Sub User ${suffix}`,
      dob: '2000-02-14',
      isAdultConfirmed: true,
      city: 'Ahmedabad',
      garbaExperience: 'advanced'
    });
  return { id: res.body.user.id, token: res.body.token, email };
}

test('Flirta Subscription & Monetization Test Suite', async (t) => {
  getDb();
  await seed();

  const user = await createSubscriberUser('1');
  const admirer = await createSubscriberUser('admirer');

  // Admin token
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@garbajodi.com', password: 'AdminGarba2026!' });
  const adminToken = adminLogin.body.token;

  await t.test('Public plans endpoint returns Spark (₹249), Chemistry (₹549), Attraction (₹749), Dream Match (₹949)', async () => {
    const res = await request(app).get('/api/subscriptions/plans');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.plans));
    assert.equal(res.body.plans.length, 4);

    const codes = res.body.plans.map(p => p.code);
    assert.ok(codes.includes('spark'));
    assert.ok(codes.includes('chemistry'));
    assert.ok(codes.includes('attraction'));
    assert.ok(codes.includes('dream_match'));

    const chemistry = res.body.plans.find(p => p.code === 'chemistry');
    assert.equal(chemistry.price_inr, 549);
    assert.equal(chemistry.is_popular, 1);
  });

  await t.test('Unsubscribed user receives locked status for incoming likes', async () => {
    // Admirer likes user
    await request(app)
      .post('/api/match/like')
      .set('Authorization', `Bearer ${admirer.token}`)
      .send({ receiverId: user.id, action: 'like' });

    // User checks who liked them without a subscription
    const res = await request(app)
      .get('/api/subscriptions/likes-received')
      .set('Authorization', `Bearer ${user.token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.canSeeLikes, false);
    assert.equal(res.body.totalCount, 1);
    assert.equal(res.body.requiresPlan, 'chemistry');
  });

  let createdOrderId = null;
  await t.test('User can create payment order for Chemistry (₹549)', async () => {
    const res = await request(app)
      .post('/api/subscriptions/create-order')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ planCode: 'chemistry' });

    assert.equal(res.status, 201);
    assert.ok(res.body.orderId);
    assert.equal(res.body.amountInr, 549);
    assert.equal(res.body.currency, 'INR');
    createdOrderId = res.body.orderId;
  });

  await t.test('Server payment verification activates Chemistry subscription and unlocks "Who Liked Me"', async () => {
    const verifyRes = await request(app)
      .post('/api/subscriptions/verify-payment')
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        orderId: createdOrderId,
        paymentMethod: 'UPI'
      });

    assert.equal(verifyRes.status, 200);
    assert.equal(verifyRes.body.success, true);
    assert.match(verifyRes.body.message, /Chemistry/i);

    // Now check who liked me - should be unlocked!
    const likesRes = await request(app)
      .get('/api/subscriptions/likes-received')
      .set('Authorization', `Bearer ${user.token}`);

    assert.equal(likesRes.status, 200);
    assert.equal(likesRes.body.canSeeLikes, true);
    assert.equal(likesRes.body.totalCount, 1);
    assert.equal(likesRes.body.likers[0].user_id, admirer.id);
  });

  await t.test('User with Chemistry plan has 1 boost credit and can activate it', async () => {
    const boostRes = await request(app)
      .post('/api/subscriptions/boost')
      .set('Authorization', `Bearer ${user.token}`);

    assert.equal(boostRes.status, 200);
    assert.equal(boostRes.body.success, true);
    assert.equal(boostRes.body.remainingBoosts, 0);
    assert.ok(boostRes.body.boostedUntil);

    // Activating again should fail because 0 credits remain
    const secondBoost = await request(app)
      .post('/api/subscriptions/boost')
      .set('Authorization', `Bearer ${user.token}`);

    assert.equal(secondBoost.status, 403);
    assert.match(secondBoost.body.error, /No profile boost credits remaining/i);
  });

  await t.test('Admin can view financial telemetry, conversion rate, and transaction history', async () => {
    const metricsRes = await request(app)
      .get('/api/admin/metrics')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(metricsRes.status, 200);
    assert.ok(metricsRes.body.metrics.revenue.totalRevenueInr >= 549);
    assert.ok(metricsRes.body.metrics.revenue.payingSubscribers >= 1);
    assert.ok(metricsRes.body.metrics.revenue.conversionRate > 0);

    // Check transactions list
    const txRes = await request(app)
      .get('/api/admin/transactions')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(txRes.status, 200);
    assert.ok(txRes.body.transactions.length >= 1);
    assert.equal(txRes.body.transactions[0].status, 'captured');
  });

  await t.test('Admin can update plan price or configuration dynamically', async () => {
    const plansRes = await request(app)
      .get('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`);

    const sparkPlan = plansRes.body.plans.find(p => p.code === 'spark');

    const updateRes = await request(app)
      .put(`/api/admin/plans/${sparkPlan.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ priceInr: 299 });

    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.plan.price_inr, 299);

    // Restore to 249
    await request(app)
      .put(`/api/admin/plans/${sparkPlan.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ priceInr: 249 });
  });

  await t.test('Free user has photos locked in discovery feed (photo_locked: true, primary_photo: null)', async () => {
    const freeUser = await createSubscriberUser('free_explorer');
    const res = await request(app)
      .get('/api/discovery')
      .set('Authorization', `Bearer ${freeUser.token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.user_subscription.can_see_primary_photo, false);
    assert.equal(res.body.user_subscription.can_see_all_photos, false);
    assert.ok(res.body.profiles.length > 0);
    const first = res.body.profiles[0];
    assert.equal(first.photo_locked, true);
    assert.equal(first.primary_photo, null);
    assert.deepEqual(first.photos, []);
  });

  await t.test('Spark plan (₹249) unlocks 1 primary photo but locks multi-photo gallery exploration', async () => {
    const sparkUser = await createSubscriberUser('spark_user');
    const orderRes = await request(app)
      .post('/api/subscriptions/create-order')
      .set('Authorization', `Bearer ${sparkUser.token}`)
      .send({ planCode: 'spark' });

    assert.equal(orderRes.status, 201);

    const verifyRes = await request(app)
      .post('/api/subscriptions/verify-payment')
      .set('Authorization', `Bearer ${sparkUser.token}`)
      .send({
        orderId: orderRes.body.orderId,
        paymentMethod: 'UPI'
      });

    assert.equal(verifyRes.status, 200);

    const discRes = await request(app)
      .get('/api/discovery')
      .set('Authorization', `Bearer ${sparkUser.token}`);

    assert.equal(discRes.status, 200);
    assert.equal(discRes.body.user_subscription.can_see_primary_photo, true);
    assert.equal(discRes.body.user_subscription.can_see_all_photos, false);
    assert.ok(discRes.body.profiles.length > 0);
    const profileWithMultiple = discRes.body.profiles.find(p => p.total_photos_count > 1);
    if (profileWithMultiple) {
      assert.equal(profileWithMultiple.photo_locked, false);
      assert.ok(profileWithMultiple.primary_photo !== null);
      assert.equal(profileWithMultiple.photos.length, 1);
      assert.equal(profileWithMultiple.explore_photos_locked, true);
    }
  });

  await t.test('Chemistry plan (₹549) unlocks all photos and full gallery exploration', async () => {
    const chemUser = await createSubscriberUser('chem_user');
    const orderRes = await request(app)
      .post('/api/subscriptions/create-order')
      .set('Authorization', `Bearer ${chemUser.token}`)
      .send({ planCode: 'chemistry' });

    assert.equal(orderRes.status, 201);

    const verifyRes = await request(app)
      .post('/api/subscriptions/verify-payment')
      .set('Authorization', `Bearer ${chemUser.token}`)
      .send({
        orderId: orderRes.body.orderId,
        paymentMethod: 'UPI'
      });

    assert.equal(verifyRes.status, 200);

    const discRes = await request(app)
      .get('/api/discovery')
      .set('Authorization', `Bearer ${chemUser.token}`);

    assert.equal(discRes.status, 200);
    assert.equal(discRes.body.user_subscription.can_see_primary_photo, true);
    assert.equal(discRes.body.user_subscription.can_see_all_photos, true);
    const profileWithMultiple = discRes.body.profiles.find(p => p.total_photos_count > 1);
    if (profileWithMultiple) {
      assert.equal(profileWithMultiple.photo_locked, false);
      assert.equal(profileWithMultiple.explore_photos_locked, false);
      assert.ok(profileWithMultiple.photos.length > 1);
    }
  });
});
