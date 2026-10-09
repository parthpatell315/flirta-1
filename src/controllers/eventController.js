const { getDb } = require('../db/database');

exports.listEvents = (req, res) => {
  try {
    const { city, date, q } = req.query;
    const db = getDb();

    let query = `
      SELECT e.*,
        (SELECT COUNT(*) FROM event_attendances WHERE event_id = e.id AND status = 'attending') as attending_count,
        (SELECT COUNT(*) FROM event_attendances WHERE event_id = e.id AND status = 'interested') as interested_count
      FROM events e
      WHERE e.is_published = 1
    `;
    const params = [];

    if (city && city.trim()) {
      query += ` AND LOWER(e.city) = LOWER(?)`;
      params.push(city.trim());
    }

    if (date && date.trim()) {
      query += ` AND e.event_date = ?`;
      params.push(date.trim());
    }

    if (q && q.trim()) {
      query += ` AND (LOWER(e.name) LIKE ? OR LOWER(e.venue_name) LIKE ? OR LOWER(e.organizer) LIKE ?)`;
      const searchPattern = `%${q.trim().toLowerCase()}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY e.event_date ASC, e.start_time ASC`;

    const events = db.prepare(query).all(...params);

    // If user is authenticated, check their individual attendance status
    if (req.user) {
      const userAttendances = db.prepare(`
        SELECT event_id, status FROM event_attendances WHERE user_id = ?
      `).all(req.user.id);
      const statusMap = new Map();
      userAttendances.forEach(a => statusMap.set(a.event_id, a.status));

      events.forEach(e => {
        e.user_status = statusMap.get(e.id) || null;
      });
    }

    return res.json({ events });
  } catch (err) {
    console.error('listEvents error:', err);
    return res.status(500).json({ error: 'Failed to retrieve events.' });
  }
};

exports.getEventDetails = (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const db = getDb();

    const event = db.prepare(`
      SELECT e.*,
        (SELECT COUNT(*) FROM event_attendances WHERE event_id = e.id AND status = 'attending') as attending_count,
        (SELECT COUNT(*) FROM event_attendances WHERE event_id = e.id AND status = 'interested') as interested_count
      FROM events e
      WHERE e.id = ? AND e.is_published = 1
    `).get(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found or not published.' });
    }

    if (req.user) {
      const att = db.prepare('SELECT status FROM event_attendances WHERE user_id = ? AND event_id = ?').get(req.user.id, eventId);
      event.user_status = att ? att.status : null;
    }

    // Attendees consenting to discovery
    const attendees = db.prepare(`
      SELECT p.id as profile_id, p.user_id, p.display_name, p.age, p.city, p.garba_experience,
             ea.status as attendance_status,
             (SELECT photo_url FROM profile_photos WHERE profile_id = p.id AND is_primary = 1 LIMIT 1) as primary_photo
      FROM event_attendances ea
      JOIN profiles p ON ea.user_id = p.user_id
      JOIN users u ON ea.user_id = u.id
      WHERE ea.event_id = ?
        AND p.is_discoverable = 1
        AND u.status = 'active'
        ${req.user ? `AND ea.user_id != ${req.user.id}` : ''}
      LIMIT 50
    `).all(eventId);

    return res.json({ event, attendees });
  } catch (err) {
    console.error('getEventDetails error:', err);
    return res.status(500).json({ error: 'Failed to retrieve event details.' });
  }
};

exports.setAttendance = (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const { status } = req.body;

    if (!['attending', 'interested'].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be 'attending' or 'interested'." });
    }

    const db = getDb();
    const event = db.prepare('SELECT id, name FROM events WHERE id = ? AND is_published = 1').get(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    // Upsert attendance record
    db.prepare(`
      INSERT INTO event_attendances (user_id, event_id, status)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, event_id) DO UPDATE SET status = excluded.status, created_at = CURRENT_TIMESTAMP
    `).run(req.user.id, eventId, status);

    // Track event selection analytics
    db.prepare('INSERT INTO analytics_events (user_id, event_name, event_payload) VALUES (?, ?, ?)')
      .run(req.user.id, 'event_selected', JSON.stringify({ eventId, eventName: event.name, status }));

    return res.json({ message: `Marked as ${status} for ${event.name}.`, status });
  } catch (err) {
    console.error('setAttendance error:', err);
    return res.status(500).json({ error: 'Failed to update event attendance.' });
  }
};

exports.removeAttendance = (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const db = getDb();

    db.prepare('DELETE FROM event_attendances WHERE user_id = ? AND event_id = ?').run(req.user.id, eventId);
    return res.json({ message: 'Attendance removed successfully.' });
  } catch (err) {
    console.error('removeAttendance error:', err);
    return res.status(500).json({ error: 'Failed to remove event attendance.' });
  }
};
