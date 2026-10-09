const { getDb } = require('../db/database');

const ALLOWED_EVENTS = [
  'landing_page_visited',
  'registration_started',
  'registration_completed',
  'profile_completed',
  'event_selected',
  'like_sent',
  'match_created',
  'first_message_sent',
  'group_created',
  'report_submitted'
];

exports.trackEvent = (req, res) => {
  try {
    const { eventName, payload } = req.body;
    if (!eventName || !ALLOWED_EVENTS.includes(eventName)) {
      return res.status(400).json({ error: 'Invalid or disallowed event name.' });
    }

    const userId = req.user ? req.user.id : null;
    const sanitizedPayload = typeof payload === 'object' ? JSON.stringify(payload) : null;

    const db = getDb();
    db.prepare(`
      INSERT INTO analytics_events (user_id, event_name, event_payload)
      VALUES (?, ?, ?)
    `).run(userId, eventName, sanitizedPayload);

    return res.json({ success: true });
  } catch (err) {
    console.error('analytics trackEvent error:', err);
    return res.status(500).json({ error: 'Failed to record event.' });
  }
};
