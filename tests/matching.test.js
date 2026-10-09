const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { getDb } = require('../src/db/database');

async function createTestUser(suffix, city = 'Ahmedabad') {
  const email = `matcher_${suffix}_${Date.now()}@example.com`;
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password: 'password123',
      displayName: `User ${suffix}`,
      dob: '1998-05-12',
      isAdultConfirmed: true,
      city,
      garbaExperience: 'intermediate'
    });
  return { id: res.body.user.id, token: res.body.token, email };
}

test('GarbaJodi Matching Engine Test Suite', async (t) => {
  getDb();
  const userA = await createTestUser('A');
  const userB = await createTestUser('B');
  const userC = await createTestUser('C');

  await t.test('User cannot like themselves', async () => {
    const res = await request(app)
      .post('/api/match/like')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ receiverId: userA.id, action: 'like' });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /cannot like or pass yourself/i);
  });

  await t.test('One-sided like persists but does not create a match', async () => {
    const res = await request(app)
      .post('/api/match/like')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ receiverId: userB.id, action: 'like' });

    assert.equal(res.status, 200);
    assert.equal(res.body.isMatch, false);

    // Verify userA has 0 matches
    const matchesRes = await request(app)
      .get('/api/match')
      .set('Authorization', `Bearer ${userA.token}`);

    assert.equal(matchesRes.status, 200);
    assert.equal(matchesRes.body.matches.length, 0);
  });

  await t.test('Duplicate like is idempotent and does not create duplicate entries', async () => {
    const res = await request(app)
      .post('/api/match/like')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ receiverId: userB.id, action: 'like' });

    assert.equal(res.status, 200);
    assert.equal(res.body.isMatch, false);

    const db = getDb();
    const count = db.prepare('SELECT COUNT(*) as count FROM likes WHERE sender_id = ? AND receiver_id = ?').get(userA.id, userB.id).count;
    assert.equal(count, 1);
  });

  await t.test('Mutual like triggers match creation and establishes a conversation', async () => {
    const res = await request(app)
      .post('/api/match/like')
      .set('Authorization', `Bearer ${userB.token}`)
      .send({ receiverId: userA.id, action: 'like' });

    assert.equal(res.status, 200);
    assert.equal(res.body.isMatch, true);
    assert.ok(res.body.matchId);

    // Check matches for User A
    const matchesA = await request(app)
      .get('/api/match')
      .set('Authorization', `Bearer ${userA.token}`);

    assert.equal(matchesA.status, 200);
    assert.equal(matchesA.body.matches.length, 1);
    assert.equal(matchesA.body.matches[0].matched_user_id, userB.id);

    // Check matches for User B
    const matchesB = await request(app)
      .get('/api/match')
      .set('Authorization', `Bearer ${userB.token}`);

    assert.equal(matchesB.status, 200);
    assert.equal(matchesB.body.matches.length, 1);
    assert.equal(matchesB.body.matches[0].matched_user_id, userA.id);
  });

  await t.test('Unmatching severs active match status', async () => {
    // Get match id
    const matchesA = await request(app)
      .get('/api/match')
      .set('Authorization', `Bearer ${userA.token}`);
    const matchId = matchesA.body.matches[0].match_id;

    const unmatchRes = await request(app)
      .post(`/api/match/${matchId}/unmatch`)
      .set('Authorization', `Bearer ${userA.token}`);

    assert.equal(unmatchRes.status, 200);

    // Verify User A now has 0 active matches
    const postMatches = await request(app)
      .get('/api/match')
      .set('Authorization', `Bearer ${userA.token}`);
    assert.equal(postMatches.body.matches.length, 0);
  });

  await t.test('Blocked users cannot interact or match', async () => {
    // User A blocks User C
    const blockRes = await request(app)
      .post('/api/safety/block')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ targetUserId: userC.id });

    assert.equal(blockRes.status, 200);

    // User C tries to like User A
    const likeRes = await request(app)
      .post('/api/match/like')
      .set('Authorization', `Bearer ${userC.token}`)
      .send({ receiverId: userA.id, action: 'like' });

    assert.equal(likeRes.status, 403);
    assert.match(likeRes.body.error, /Interaction not permitted/i);
  });
});
