const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { getDb } = require('../src/db/database');

async function createTestUser(suffix) {
  const email = `safety_user_${suffix}_${Date.now()}@example.com`;
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password: 'password123',
      displayName: `Safety User ${suffix}`,
      dob: '1995-10-10',
      isAdultConfirmed: true,
      city: 'Surat'
    });
  return { id: res.body.user.id, token: res.body.token, email };
}

test('GarbaJodi Safety & Admin Test Suite', async (t) => {
  getDb();
  const reporter = await createTestUser('reporter');
  const offender = await createTestUser('offender');

  // Admin login
  const adminLoginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin@garbajodi.com',
      password: 'AdminGarba2026!'
    });

  assert.equal(adminLoginRes.status, 200);
  const adminToken = adminLoginRes.body.token;

  let reportId = null;

  await t.test('User can submit a moderation report', async () => {
    const reportRes = await request(app)
      .post('/api/safety/report')
      .set('Authorization', `Bearer ${reporter.token}`)
      .send({
        targetType: 'user',
        targetId: offender.id,
        reason: 'Inappropriate behavior',
        details: 'Not following Garba partner code of conduct'
      });

    assert.equal(reportRes.status, 201);
    assert.ok(reportRes.body.reportId);
    reportId = reportRes.body.reportId;
  });

  await t.test('Admin can view reports and resolve them', async () => {
    const listRes = await request(app)
      .get('/api/admin/reports?status=pending')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(listRes.status, 200);
    assert.ok(listRes.body.reports.length >= 1);

    // Resolve report
    const resolveRes = await request(app)
      .patch(`/api/admin/reports/${reportId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'resolved',
        actionTaken: 'Warned user and logged audit record',
        notes: 'Reviewed by admin team'
      });

    assert.equal(resolveRes.status, 200);
    assert.match(resolveRes.body.message, /resolved/i);
  });

  await t.test('Admin can suspend user account, and suspended user is blocked from acting', async () => {
    const suspendRes = await request(app)
      .patch(`/api/admin/users/${offender.id}/suspend`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'suspended',
        reason: 'Multiple verified conduct violations'
      });

    assert.equal(suspendRes.status, 200);

    // Offender tries to fetch profile
    const profileRes = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${offender.token}`);

    assert.equal(profileRes.status, 403);
    assert.match(profileRes.body.error, /suspended/i);

    // Offender tries to login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: offender.email,
        password: 'password123'
      });

    assert.equal(loginRes.status, 403);
    assert.match(loginRes.body.error, /suspended/i);
  });

  await t.test('Admin can create new events and fetch genuine metrics', async () => {
    const eventRes = await request(app)
      .post('/api/admin/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Sardar Patel Stadium Mega Raas 2026',
        organizer: 'Ahmedabad Cultural Trust',
        venueName: 'Sardar Patel Stadium Ground',
        address: 'Navrangpura, Ahmedabad',
        city: 'Ahmedabad',
        eventDate: '2026-10-16',
        startTime: '19:30',
        endTime: '01:00',
        description: 'Authentic 9-night celebration',
        isPublished: 1,
        capacity: 20000
      });

    assert.equal(eventRes.status, 201);
    assert.equal(eventRes.body.event.name, 'Sardar Patel Stadium Mega Raas 2026');

    // Fetch real metrics
    const metricsRes = await request(app)
      .get('/api/admin/metrics')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(metricsRes.status, 200);
    assert.ok(metricsRes.body.metrics.users.total > 0);
    assert.ok(metricsRes.body.metrics.events.total > 0);
    assert.ok(Array.isArray(metricsRes.body.auditLog));
  });

  await t.test('Statutory grievance lifecycle (IT Rules 2021)', async () => {
    // 1. Submit official statutory grievance
    const submitRes = await request(app)
      .post('/api/safety/grievance')
      .send({
        name: 'Pooja Shah',
        email: 'pooja.shah@example.com',
        phone: '9876543210',
        category: 'Impersonation or Fake Profile',
        subject: 'Fake photo of myself posted without consent',
        description: 'Someone is using my traditional chaniya choli pictures without permission.',
        reportedTarget: 'User #99'
      });

    assert.equal(submitRes.status, 201);
    assert.ok(submitRes.body.ticketId);
    assert.match(submitRes.body.ticketId, /^GRV-/);

    // 2. Admin retrieves grievances
    const listRes = await request(app)
      .get('/api/admin/grievances')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(listRes.status, 200);
    assert.ok(listRes.body.grievances.length >= 1);
    const targetGrievance = listRes.body.grievances.find(g => g.ticket_id === submitRes.body.ticketId);
    assert.ok(targetGrievance);
    assert.equal(targetGrievance.status, 'acknowledged');

    // 3. Admin updates resolution
    const resolveRes = await request(app)
      .patch(`/api/admin/grievances/${targetGrievance.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'resolved',
        resolutionNotes: 'Profile investigated and offending images taken down within statutory 24-hour mandate.'
      });

    assert.equal(resolveRes.status, 200);
    assert.match(resolveRes.body.message, /resolved/i);
  });

  await t.test('DPDP Act 2023 Right to Erasure: user can permanently delete account and data', async () => {
    const deleteRes = await request(app)
      .delete('/api/profile/account')
      .set('Authorization', `Bearer ${reporter.token}`);

    assert.equal(deleteRes.status, 200);
    assert.match(deleteRes.body.message, /permanently erased/i);

    // Verify user no longer exists
    const checkRes = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${reporter.token}`);

    assert.equal(checkRes.status, 401);
  });
});
