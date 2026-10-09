const { getDb } = require('../db/database');

exports.sendInteraction = (req, res) => {
  const db = getDb();
  try {
    const senderId = req.user.id;
    const { receiverId, action } = req.body;

    if (!receiverId || !['like', 'pass'].includes(action)) {
      return res.status(400).json({ error: "Invalid request. 'receiverId' and action ('like' or 'pass') are required." });
    }

    const targetUserId = parseInt(receiverId, 10);
    if (senderId === targetUserId) {
      return res.status(400).json({ error: 'You cannot like or pass yourself.' });
    }

    // Verify receiver exists, is active, and adult verified
    const receiver = db.prepare(`
      SELECT u.id, u.status, p.display_name
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      WHERE u.id = ?
    `).get(targetUserId);

    if (!receiver || receiver.status !== 'active') {
      return res.status(404).json({ error: 'Target profile is not available or has been suspended.' });
    }

    // Check if blocked in either direction
    const isBlocked = db.prepare(`
      SELECT id FROM blocks
      WHERE (blocker_id = ? AND blocked_id = ?)
         OR (blocker_id = ? AND blocked_id = ?)
    `).get(senderId, targetUserId, targetUserId, senderId);

    if (isBlocked) {
      return res.status(403).json({ error: 'Interaction not permitted between these accounts.' });
    }

    // Enforce Daily Likes Allowance
    if (action === 'like') {
      const { getUserActiveSubscription } = require('./subscriptionController');
      const activeSub = getUserActiveSubscription(db, senderId);
      const dailyLimit = activeSub ? activeSub.daily_likes_limit : 5; // Default free: 5 likes/day

      if (dailyLimit !== -1) {
        const existingLike = db.prepare("SELECT id FROM likes WHERE sender_id = ? AND receiver_id = ? AND action = 'like'").get(senderId, targetUserId);
        if (!existingLike) {
          const todayLikes = db.prepare(`
            SELECT COUNT(*) as count FROM likes
            WHERE sender_id = ? AND action = 'like' AND DATE(created_at) = DATE('now')
          `).get(senderId).count;

          if (todayLikes >= dailyLimit) {
            return res.status(403).json({
              error: `You have reached your daily interest allowance of ${dailyLimit} likes for today. Upgrade your Flirta plan to send more interest expressions!`,
              limitReached: true,
              upgradeRequired: true,
              dailyLimit
            });
          }
        }
      }
    }

    // Wrap critical interaction and match logic inside a transaction
    db.exec('BEGIN IMMEDIATE');

    let isMatch = false;
    let matchId = null;

    try {
      // Upsert like/pass
      db.prepare(`
        INSERT INTO likes (sender_id, receiver_id, action)
        VALUES (?, ?, ?)
        ON CONFLICT(sender_id, receiver_id) DO UPDATE SET action = excluded.action, created_at = CURRENT_TIMESTAMP
      `).run(senderId, targetUserId, action);

      // Track like analytics
      if (action === 'like') {
        db.prepare('INSERT INTO analytics_events (user_id, event_name, event_payload) VALUES (?, ?, ?)')
          .run(senderId, 'like_sent', JSON.stringify({ receiverId: targetUserId }));
      }

      // If action is like, check if other user already liked sender
      if (action === 'like') {
        const reverseLike = db.prepare(`
          SELECT id FROM likes
          WHERE sender_id = ? AND receiver_id = ? AND action = 'like'
        `).get(targetUserId, senderId);

        if (reverseLike) {
          // Both liked each other! Create or reactivate match
          const u1 = Math.min(senderId, targetUserId);
          const u2 = Math.max(senderId, targetUserId);

          const existingMatch = db.prepare('SELECT id, status FROM matches WHERE user1_id = ? AND user2_id = ?').get(u1, u2);

          if (!existingMatch) {
            const matchRes = db.prepare(`
              INSERT INTO matches (user1_id, user2_id, status)
              VALUES (?, ?, 'matched')
            `).run(u1, u2);
            matchId = Number(matchRes.lastInsertRowid);

            // Automatically create 1:1 conversation
            db.prepare(`INSERT INTO conversations (match_id) VALUES (?)`).run(matchId);

            isMatch = true;

            // Track match created analytics
            db.prepare('INSERT INTO analytics_events (user_id, event_name, event_payload) VALUES (?, ?, ?)')
              .run(senderId, 'match_created', JSON.stringify({ matchId, withUser: targetUserId }));
          } else if (existingMatch.status === 'unmatched') {
            db.prepare(`
              UPDATE matches
              SET status = 'matched', matched_at = CURRENT_TIMESTAMP, unmatched_at = NULL
              WHERE id = ?
            `).run(existingMatch.id);
            matchId = existingMatch.id;
            isMatch = true;
          } else {
            matchId = existingMatch.id;
            isMatch = true;
          }
        }
      }

      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    return res.json({
      success: true,
      action,
      isMatch,
      matchId,
      message: isMatch
        ? `It's a Garba Jodi match with ${receiver.display_name}! You can now dance together and chat.`
        : (action === 'like' ? 'Interest sent!' : 'Profile passed.')
    });
  } catch (err) {
    console.error('sendInteraction error:', err);
    return res.status(500).json({ error: 'Failed to record interaction.' });
  }
};

exports.getMatches = (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;

    const matches = db.prepare(`
      SELECT
        m.id as match_id,
        m.matched_at,
        c.id as conversation_id,
        CASE WHEN m.user1_id = ? THEN m.user2_id ELSE m.user1_id END as matched_user_id,
        p.display_name,
        p.age,
        p.city,
        p.garba_experience,
        p.bio,
        (SELECT photo_url FROM profile_photos WHERE profile_id = p.id AND is_primary = 1 LIMIT 1) as primary_photo,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) as unread_count
      FROM matches m
      JOIN conversations c ON m.id = c.match_id
      JOIN users u ON (CASE WHEN m.user1_id = ? THEN m.user2_id ELSE m.user1_id END) = u.id
      JOIN profiles p ON u.id = p.user_id
      WHERE (m.user1_id = ? OR m.user2_id = ?)
        AND m.status = 'matched'
        AND u.status = 'active'
        -- Exclude blocked users
        AND u.id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ?)
        AND u.id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = ?)
      ORDER BY COALESCE(c.updated_at, m.matched_at) DESC
    `).all(userId, userId, userId, userId, userId, userId, userId);

    return res.json({ matches });
  } catch (err) {
    console.error('getMatches error:', err);
    return res.status(500).json({ error: 'Failed to retrieve matches.' });
  }
};

exports.unmatch = (req, res) => {
  try {
    const db = getDb();
    const matchId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const match = db.prepare(`
      SELECT id, user1_id, user2_id, status FROM matches WHERE id = ?
    `).get(matchId);

    if (!match || (match.user1_id !== userId && match.user2_id !== userId)) {
      return res.status(404).json({ error: 'Match record not found or unauthorized.' });
    }

    db.prepare(`
      UPDATE matches
      SET status = 'unmatched', unmatched_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(matchId);

    return res.json({ message: 'Successfully unmatched.' });
  } catch (err) {
    console.error('unmatch error:', err);
    return res.status(500).json({ error: 'Failed to unmatch.' });
  }
};
