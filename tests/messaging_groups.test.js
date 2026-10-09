const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { getDb } = require('../src/db/database');

async function createTestUser(suffix) {
  const email = `msg_user_${suffix}_${Date.now()}@example.com`;
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password: 'password123',
      displayName: `MsgUser ${suffix}`,
      dob: '1999-07-22',
      isAdultConfirmed: true,
      city: 'Vadodara',
      garbaExperience: 'intermediate'
    });
  return { id: res.body.user.id, token: res.body.token, email };
}

test('GarbaJodi Messaging & Group Test Suite', async (t) => {
  getDb();
  const user1 = await createTestUser('1');
  const user2 = await createTestUser('2');
  const user3 = await createTestUser('3');

  // Match user1 & user2
  await request(app)
    .post('/api/match/like')
    .set('Authorization', `Bearer ${user1.token}`)
    .send({ receiverId: user2.id, action: 'like' });

  const matchRes = await request(app)
    .post('/api/match/like')
    .set('Authorization', `Bearer ${user2.token}`)
    .send({ receiverId: user1.id, action: 'like' });

  assert.equal(matchRes.body.isMatch, true);

  // Get conversation id
  const convsRes = await request(app)
    .get('/api/messages/conversations')
    .set('Authorization', `Bearer ${user1.token}`);

  assert.equal(convsRes.status, 200);
  assert.equal(convsRes.body.conversations.length, 1);
  const conversationId = convsRes.body.conversations[0].conversation_id;

  await t.test('Matched users can exchange messages', async () => {
    // User 1 sends message
    const sendRes = await request(app)
      .post(`/api/messages/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${user1.token}`)
      .send({ content: 'Kem chho! Excited for United Way Garba?' });

    assert.equal(sendRes.status, 201);
    assert.equal(sendRes.body.data.content, 'Kem chho! Excited for United Way Garba?');

    // User 2 retrieves messages
    const getRes = await request(app)
      .get(`/api/messages/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${user2.token}`);

    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.messages.length, 1);
    assert.equal(getRes.body.messages[0].content, 'Kem chho! Excited for United Way Garba?');
  });

  await t.test('Non-participant user cannot read or send messages to another match', async () => {
    // User 3 tries to send message
    const sendRes = await request(app)
      .post(`/api/messages/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${user3.token}`)
      .send({ content: 'Intruding into chat' });

    assert.equal(sendRes.status, 403);
    assert.match(sendRes.body.error, /Access denied/i);

    // User 3 tries to read messages
    const readRes = await request(app)
      .get(`/api/messages/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${user3.token}`);

    assert.equal(readRes.status, 403);
  });

  await t.test('Group creation and joining lifecycle', async () => {
    // User 1 creates group
    const groupRes = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${user1.token}`)
      .send({
        name: 'Vadodara Dodhiya Enthusiasts',
        description: 'Traditional steps circle for Navratri nights',
        maxMembers: 8,
        isPublic: true
      });

    assert.equal(groupRes.status, 201);
    assert.equal(groupRes.body.group.name, 'Vadodara Dodhiya Enthusiasts');
    const groupId = groupRes.body.group.id;

    // User 2 joins group
    const joinRes = await request(app)
      .post(`/api/groups/${groupId}/join`)
      .set('Authorization', `Bearer ${user2.token}`);

    assert.equal(joinRes.status, 200);
    assert.equal(joinRes.body.status, 'active');

    // Group details verify member list
    const detailsRes = await request(app)
      .get(`/api/groups/${groupId}`)
      .set('Authorization', `Bearer ${user1.token}`);

    assert.equal(detailsRes.status, 200);
    assert.equal(detailsRes.body.members.length, 2);
  });
});
