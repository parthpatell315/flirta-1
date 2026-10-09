const { getDb } = require('../db/database');

// Event management
exports.getAllEvents = (req, res) => {
  try {
    const db = getDb();
    const events = db.prepare(`
      SELECT e.*,
        (SELECT COUNT(*) FROM event_attendances WHERE event_id = e.id AND status = 'attending') as attending_count,
        (SELECT COUNT(*) FROM event_attendances WHERE event_id = e.id AND status = 'interested') as interested_count
      FROM events e
      ORDER BY e.event_date ASC
    `).all();
    return res.json({ events });
  } catch (err) {
    console.error('admin getAllEvents error:', err);
    return res.status(500).json({ error: 'Failed to fetch events.' });
  }
};

exports.createEvent = (req, res) => {
  try {
    const db = getDb();
    const {
      name, organizer, venueName, address, city, eventDate,
      startTime, endTime, description, isPublished, ticketUrl, capacity
    } = req.body;

    if (!name || !organizer || !venueName || !address || !city || !eventDate || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required event fields.' });
    }

    const insertRes = db.prepare(`
      INSERT INTO events (
        name, organizer, venue_name, address, city, event_date,
        start_time, end_time, description, is_published, ticket_url, capacity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(), organizer.trim(), venueName.trim(), address.trim(), city.trim(),
      eventDate.trim(), startTime.trim(), endTime.trim(), (description || '').trim(),
      isPublished === 0 || isPublished === false ? 0 : 1, (ticketUrl || '').trim(),
      parseInt(capacity || 1000, 10)
    );

    const eventId = Number(insertRes.lastInsertRowid);
    const created = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);

    return res.status(201).json({ message: 'Event created successfully.', event: created });
  } catch (err) {
    console.error('admin createEvent error:', err);
    return res.status(500).json({ error: 'Failed to create event.' });
  }
};

exports.updateEvent = (req, res) => {
  try {
    const db = getDb();
    const eventId = parseInt(req.params.id, 10);
    const {
      name, organizer, venueName, address, city, eventDate,
      startTime, endTime, description, isPublished, ticketUrl, capacity
    } = req.body;

    const existing = db.prepare('SELECT id FROM events WHERE id = ?').get(eventId);
    if (!existing) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    db.prepare(`
      UPDATE events
      SET name = COALESCE(?, name),
          organizer = COALESCE(?, organizer),
          venue_name = COALESCE(?, venue_name),
          address = COALESCE(?, address),
          city = COALESCE(?, city),
          event_date = COALESCE(?, event_date),
          start_time = COALESCE(?, start_time),
          end_time = COALESCE(?, end_time),
          description = COALESCE(?, description),
          is_published = COALESCE(?, is_published),
          ticket_url = COALESCE(?, ticket_url),
          capacity = COALESCE(?, capacity)
      WHERE id = ?
    `).run(
      name, organizer, venueName, address, city, eventDate,
      startTime, endTime, description, isPublished, ticketUrl, capacity,
      eventId
    );

    const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
    return res.json({ message: 'Event updated successfully.', event: updated });
  } catch (err) {
    console.error('admin updateEvent error:', err);
    return res.status(500).json({ error: 'Failed to update event.' });
  }
};

// Moderation & Reports
exports.getReports = (req, res) => {
  try {
    const db = getDb();
    const { status } = req.query;

    let query = `
      SELECT r.*,
        u.email as reporter_email,
        p.display_name as reporter_name
      FROM moderation_reports r
      JOIN users u ON r.reporter_id = u.id
      JOIN profiles p ON u.id = p.user_id
    `;
    const params = [];

    if (status && ['pending', 'resolved', 'dismissed'].includes(status)) {
      query += ` WHERE r.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY r.created_at DESC`;
    const reports = db.prepare(query).all(...params);

    // Enrich with target preview data
    const enriched = reports.map(rep => {
      let targetPreview = null;
      if (rep.target_type === 'user') {
        targetPreview = db.prepare(`
          SELECT u.id, u.email, u.status, p.display_name, p.city, p.bio
          FROM users u
          JOIN profiles p ON u.id = p.user_id
          WHERE u.id = ?
        `).get(rep.target_id);
      } else if (rep.target_type === 'message') {
        targetPreview = db.prepare(`
          SELECT m.id, m.content, m.sender_id, p.display_name as sender_name
          FROM messages m
          JOIN profiles p ON m.sender_id = p.user_id
          WHERE m.id = ?
        `).get(rep.target_id);
      } else if (rep.target_type === 'group') {
        targetPreview = db.prepare(`
          SELECT g.id, g.name, g.description, p.display_name as creator_name
          FROM groups g
          JOIN profiles p ON g.creator_id = p.user_id
          WHERE g.id = ?
        `).get(rep.target_id);
      }
      return { ...rep, target_preview: targetPreview };
    });

    return res.json({ reports: enriched });
  } catch (err) {
    console.error('admin getReports error:', err);
    return res.status(500).json({ error: 'Failed to retrieve reports.' });
  }
};

exports.resolveReport = (req, res) => {
  try {
    const db = getDb();
    const reportId = parseInt(req.params.id, 10);
    const { status, actionTaken, notes } = req.body;

    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'resolved' or 'dismissed'." });
    }

    const report = db.prepare('SELECT * FROM moderation_reports WHERE id = ?').get(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    db.prepare('UPDATE moderation_reports SET status = ? WHERE id = ?').run(status, reportId);

    // Record audit action
    db.prepare(`
      INSERT INTO moderation_actions (admin_id, report_id, action_taken, notes)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, reportId, actionTaken || `Marked as ${status}`, notes || '');

    return res.json({ message: `Report marked as ${status}.` });
  } catch (err) {
    console.error('admin resolveReport error:', err);
    return res.status(500).json({ error: 'Failed to resolve report.' });
  }
};

// Account suspension & restoration
exports.setUserSuspension = (req, res) => {
  try {
    const db = getDb();
    const targetUserId = parseInt(req.params.id, 10);
    const { status, reason } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'active' or 'suspended'." });
    }

    const targetUser = db.prepare('SELECT id, role FROM users WHERE id = ?').get(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (targetUser.role === 'admin') {
      return res.status(403).json({ error: 'Cannot suspend administrator accounts.' });
    }

    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, targetUserId);

    // Record audit
    db.prepare(`
      INSERT INTO moderation_actions (admin_id, action_taken, notes)
      VALUES (?, ?, ?)
    `).run(req.user.id, `User ${targetUserId} status set to ${status}`, reason || 'Administrative action');

    return res.json({ message: `User status changed to ${status}.` });
  } catch (err) {
    console.error('admin setUserSuspension error:', err);
    return res.status(500).json({ error: 'Failed to update user suspension status.' });
  }
};

// Metrics endpoint
exports.getMetrics = (req, res) => {
  try {
    const db = getDb();

    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get().count;
    const activeUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user' AND status = 'active'").get().count;
    const suspendedUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'suspended'").get().count;
    const completedProfiles = db.prepare("SELECT COUNT(*) as count FROM profiles WHERE bio IS NOT NULL AND bio != ''").get().count;

    const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
    const publishedEvents = db.prepare('SELECT COUNT(*) as count FROM events WHERE is_published = 1').get().count;

    const totalLikes = db.prepare("SELECT COUNT(*) as count FROM likes WHERE action = 'like'").get().count;
    const totalPasses = db.prepare("SELECT COUNT(*) as count FROM likes WHERE action = 'pass'").get().count;
    const totalMatches = db.prepare("SELECT COUNT(*) as count FROM matches WHERE status = 'matched'").get().count;
    const totalMessages = db.prepare('SELECT COUNT(*) as count FROM messages').get().count;

    const totalGroups = db.prepare('SELECT COUNT(*) as count FROM groups').get().count;
    const pendingReports = db.prepare("SELECT COUNT(*) as count FROM moderation_reports WHERE status = 'pending'").get().count;

    const recentAudit = db.prepare(`
      SELECT ma.*, u.email as admin_email
      FROM moderation_actions ma
      JOIN users u ON ma.admin_id = u.id
      ORDER BY ma.created_at DESC
      LIMIT 10
    `).all();

    return res.json({
      metrics: {
        users: { total: totalUsers, active: activeUsers, suspended: suspendedUsers, completedProfiles },
        events: { total: totalEvents, published: publishedEvents },
        matching: { likes: totalLikes, passes: totalPasses, matches: totalMatches, messages: totalMessages },
        community: { groups: totalGroups, pendingReports }
      },
      auditLog: recentAudit
    });
  } catch (err) {
    console.error('admin getMetrics error:', err);
    return res.status(500).json({ error: 'Failed to retrieve metrics.' });
  }
};
