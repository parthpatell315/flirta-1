const { getDb } = require('../db/database');

exports.blockUser = (req, res) => {
  try {
    const db = getDb();
    const blockerId = req.user.id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID is required.' });
    }

    const blockedId = parseInt(targetUserId, 10);
    if (blockerId === blockedId) {
      return res.status(400).json({ error: 'You cannot block yourself.' });
    }

    // Insert block record
    db.prepare(`
      INSERT INTO blocks (blocker_id, blocked_id)
      VALUES (?, ?)
      ON CONFLICT(blocker_id, blocked_id) DO NOTHING
    `).run(blockerId, blockedId);

    // Immediately sever any active matches
    const u1 = Math.min(blockerId, blockedId);
    const u2 = Math.max(blockerId, blockedId);
    db.prepare(`
      UPDATE matches
      SET status = 'unmatched', unmatched_at = CURRENT_TIMESTAMP
      WHERE user1_id = ? AND user2_id = ?
    `).run(u1, u2);

    return res.json({ message: 'User has been blocked. They can no longer see your profile or send messages.' });
  } catch (err) {
    console.error('blockUser error:', err);
    return res.status(500).json({ error: 'Failed to block user.' });
  }
};

exports.unblockUser = (req, res) => {
  try {
    const db = getDb();
    const blockerId = req.user.id;
    const targetUserId = parseInt(req.params.userId, 10);

    db.prepare('DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?').run(blockerId, targetUserId);
    return res.json({ message: 'User has been unblocked.' });
  } catch (err) {
    console.error('unblockUser error:', err);
    return res.status(500).json({ error: 'Failed to unblock user.' });
  }
};

exports.getBlockedUsers = (req, res) => {
  try {
    const db = getDb();
    const blockerId = req.user.id;

    const blocked = db.prepare(`
      SELECT b.id as block_id, b.blocked_id, b.created_at, p.display_name, p.city
      FROM blocks b
      JOIN profiles p ON b.blocked_id = p.user_id
      WHERE b.blocker_id = ?
      ORDER BY b.created_at DESC
    `).all(blockerId);

    return res.json({ blocked });
  } catch (err) {
    console.error('getBlockedUsers error:', err);
    return res.status(500).json({ error: 'Failed to retrieve blocked users.' });
  }
};

exports.submitReport = (req, res) => {
  try {
    const db = getDb();
    const reporterId = req.user.id;
    const { targetType, targetId, reason, details } = req.body;

    if (!targetType || !['user', 'message', 'group'].includes(targetType)) {
      return res.status(400).json({ error: "Invalid target type. Must be 'user', 'message', or 'group'." });
    }

    if (!targetId || !reason || !reason.trim()) {
      return res.status(400).json({ error: 'Target ID and report reason are required.' });
    }

    const result = db.prepare(`
      INSERT INTO moderation_reports (reporter_id, target_type, target_id, reason, details, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(reporterId, targetType, parseInt(targetId, 10), reason.trim(), (details || '').trim());

    // Track report analytics
    db.prepare('INSERT INTO analytics_events (user_id, event_name, event_payload) VALUES (?, ?, ?)')
      .run(reporterId, 'report_submitted', JSON.stringify({ targetType, targetId }));

    return res.status(201).json({
      message: 'Report submitted. Our safety team will review it promptly.',
      reportId: Number(result.lastInsertRowid)
    });
  } catch (err) {
    console.error('submitReport error:', err);
    return res.status(500).json({ error: 'Failed to submit report.' });
  }
};
