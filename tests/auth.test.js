const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { getDb } = require('../src/db/database');

test('GarbaJodi Auth & Eligibility Test Suite', async (t) => {
  // Setup DB
  getDb();

  await t.test('Anonymous users cannot access protected profile route', async () => {
    const res = await request(app).get('/api/profile');
    assert.equal(res.status, 401);
    assert.match(res.body.error, /Authentication required/i);
  });

  await t.test('Underage registration (< 18) must be rejected', async () => {
    const underageDob = '2015-05-10'; // 11 years old
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'teen@example.com',
        password: 'password123',
        displayName: 'Teen Dancer',
        dob: underageDob,
        isAdultConfirmed: true,
        city: 'Ahmedabad'
      });

    assert.equal(res.status, 403);
    assert.match(res.body.error, /18 years old/i);
  });

  await t.test('Registration without explicit adult eligibility confirmation is rejected', async () => {
    const adultDob = '2000-01-01'; // 26 years old
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'no_consent@example.com',
        password: 'password123',
        displayName: 'Adult Dancer',
        dob: adultDob,
        isAdultConfirmed: false,
        city: 'Ahmedabad'
      });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /confirm that you are at least 18/i);
  });

  await t.test('Successful 18+ registration creates user and returns token', async () => {
    const testEmail = `dancer_${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: 'password123',
        displayName: 'Aarav Patel',
        dob: '2001-03-15',
        isAdultConfirmed: true,
        city: 'Ahmedabad',
        garbaExperience: 'advanced'
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, testEmail);
    assert.equal(res.body.profile.display_name, 'Aarav Patel');
    assert.equal(res.body.profile.is_adult_verified, 1);
  });

  await t.test('User login with valid credentials succeeds and me endpoint returns profile', async () => {
    const testEmail = `login_test_${Date.now()}@example.com`;
    // Register
    await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: 'mypassword123',
        displayName: 'Pooja Shah',
        dob: '2000-08-20',
        isAdultConfirmed: true,
        city: 'Vadodara'
      });

    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'mypassword123'
      });

    assert.equal(loginRes.status, 200);
    assert.ok(loginRes.body.token);

    // Call /me
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.profile.display_name, 'Pooja Shah');
    assert.equal(meRes.body.profile.city, 'Vadodara');
  });

  await t.test('Unauthorized user cannot access admin routes', async () => {
    const testEmail = `non_admin_${Date.now()}@example.com`;
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: 'password123',
        displayName: 'Regular User',
        dob: '2000-01-01',
        isAdultConfirmed: true,
        city: 'Surat'
      });

    const adminRes = await request(app)
      .get('/api/admin/metrics')
      .set('Authorization', `Bearer ${regRes.body.token}`);

    assert.equal(adminRes.status, 403);
    assert.match(adminRes.body.error, /Administrator privileges required/i);
  });
});
