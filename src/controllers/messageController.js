const { getDb } = require('../db/database');

const liveStreams = new Map();

function publishMessage(conversationId, message) {
  const set = liveStreams.get(conversationId);
  if (!set) return;
  const payload = `data: ${JSON.stringify({ type: 'message', message })}\n\n`;
  for (const client of set) {
    try { client.write(payload); } catch {}
  }
}

// Helper to verify that user is an authorized participant in active match
function verifyConversationAccess(db, conversationId, userId) {
  const conv = db.prepare(`
    SELECT c.id as conversation_id, c.match_id, m.user1_id, m.user2_id, m.status as match_status
    FROM conversations c
    JOIN matches m ON c.match_id = m.id
    WHERE c.id = ?
  `).get(conversationId);

  if (!conv) {
    return { error: 'Conversation not found.', status: 404 };
  }

  if (conv.user1_id !== userId && conv.user2_id !== userId) {
    return { error: 'Access denied. You are not a participant in this conversation.', status: 403 };
  }

  if (conv.match_status !== 'matched') {
    return { error: 'This match is no longer active.', status: 403 };
  }

  const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;

  // Check if blocked in either direction
  const isBlocked = db.prepare(`
    SELECT id FROM blocks
    WHERE (blocker_id = ? AND blocked_id = ?)
       OR (blocker_id = ? AND blocked_id = ?)
  `).get(userId, otherUserId, otherUserId, userId);

  if (isBlocked) {
    return { error: 'Communication blocked between these accounts.', status: 403 };
  }

  // Check if other user is suspended
  const otherUser = db.prepare('SELECT status FROM users WHERE id = ?').get(otherUserId);
  if (!otherUser || otherUser.status !== 'active') {
    return { error: 'The other user account is suspended or unavailable.', status: 403 };
  }

  return { conv, otherUserId };
}

exports.getConversations = (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;

    const conversations = db.prepare(`
      SELECT
        c.id as conversation_id,
        c.updated_at,
        m.id as match_id,
        CASE WHEN m.user1_id = ? THEN m.user2_id ELSE m.user1_id END as other_user_id,
        p.display_name,
        (SELECT photo_url FROM profile_photos WHERE profile_id = p.id AND is_primary = 1 LIMIT 1) as primary_photo,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) as unread_count
      FROM conversations c
      JOIN matches m ON c.match_id = m.id
      JOIN users u ON (CASE WHEN m.user1_id = ? THEN m.user2_id ELSE m.user1_id END) = u.id
      JOIN profiles p ON u.id = p.user_id
      WHERE (m.user1_id = ? OR m.user2_id = ?)
        AND m.status = 'matched'
        AND u.status = 'active'
        AND u.id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ?)
        AND u.id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = ?)
      ORDER BY COALESCE(
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1),
        c.created_at
      ) DESC
    `).all(userId, userId, userId, userId, userId, userId, userId);

    return res.json({ conversations });
  } catch (err) {
    console.error('getConversations error:', err);
    return res.status(500).json({ error: 'Failed to retrieve conversations.' });
  }
};

exports.getMessages = (req, res) => {
  try {
    const db = getDb();
    const conversationId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const access = verifyConversationAccess(db, conversationId, userId);
    if (access.error) {
      return res.status(access.status).json({ error: access.error });
    }

    const { after, limit = 50 } = req.query;
    let query = `
      SELECT id, conversation_id, sender_id, content, is_read, created_at
      FROM messages
      WHERE conversation_id = ?
    `;
    const params = [conversationId];

    if (after) {
      query += ` AND id > ?`;
      params.push(parseInt(after, 10));
    }

    query += ` ORDER BY id ASC LIMIT ?`;
    params.push(Math.min(100, Math.max(1, parseInt(limit, 10))));

    const messages = db.prepare(query).all(...params);

    // Mark received messages as read
    db.prepare(`
      UPDATE messages
      SET is_read = 1
      WHERE conversation_id = ? AND sender_id != ? AND is_read = 0
    `).run(conversationId, userId);

    const otherUserProfile = db.prepare(`
      SELECT p.user_id, p.display_name, p.city, p.garba_experience,
             (SELECT photo_url FROM profile_photos WHERE profile_id = p.id AND is_primary = 1 LIMIT 1) as primary_photo
      FROM profiles p WHERE p.user_id = ?
    `).get(access.otherUserId);

    return res.json({
      messages,
      otherUser: otherUserProfile,
      matchId: access.conv.match_id
    });
  } catch (err) {
    console.error('getMessages error:', err);
    return res.status(500).json({ error: 'Failed to retrieve messages.' });
  }
};

exports.sendMessage = (req, res) => {
  try {
    const db = getDb();
    const conversationId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content cannot be blank.' });
    }

    if (content.length > 2000) {
      return res.status(400).json({ error: 'Message cannot exceed 2000 characters.' });
    }

    const access = verifyConversationAccess(db, conversationId, userId);
    if (access.error) {
      return res.status(access.status).json({ error: access.error });
    }

    const insertResult = db.prepare(`
      INSERT INTO messages (conversation_id, sender_id, content, is_read)
      VALUES (?, ?, ?, 0)
    `).run(conversationId, userId, content.trim());

    const messageId = Number(insertResult.lastInsertRowid);

    // Update conversation timestamp
    db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(conversationId);

    // Check if this is the first message in this conversation for analytics
    const totalMsgCount = db.prepare('SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?').get(conversationId).count;
    if (totalMsgCount === 1) {
      db.prepare('INSERT INTO analytics_events (user_id, event_name, event_payload) VALUES (?, ?, ?)')
        .run(userId, 'first_message_sent', JSON.stringify({ conversationId, toUser: access.otherUserId }));
    }

    const createdMsg = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);
    publishMessage(conversationId, createdMsg);

    return res.status(201).json({
      message: 'Message sent successfully.',
      data: createdMsg
    });
  } catch (err) {
    console.error('sendMessage error:', err);
    return res.status(500).json({ error: 'Failed to send message.' });
  }
};

exports.streamMessages = (req, res) => {
  const db = getDb();
  const conversationId = parseInt(req.params.id, 10);
  const access = verifyConversationAccess(db, conversationId, req.user.id);
  if (access.error) {
    return res.status(access.status).json({ error: access.error });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  res.write(`data: ${JSON.stringify({ type: 'ready', conversationId })}\n\n`);

  if (!liveStreams.has(conversationId)) liveStreams.set(conversationId, new Set());
  liveStreams.get(conversationId).add(res);

  const heartbeat = setInterval(() => {
    try { res.write(': ping\n\n'); } catch {}
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const set = liveStreams.get(conversationId);
    if (set) {
      set.delete(res);
      if (set.size === 0) liveStreams.delete(conversationId);
    }
  });
};
