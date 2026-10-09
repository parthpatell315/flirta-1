const { getDb } = require('../db/database');

exports.listGroups = (req, res) => {
  try {
    const db = getDb();
    const { event_id, q } = req.query;

    let query = `
      SELECT
        g.*,
        e.name as event_name,
        e.city as event_city,
        e.venue_name,
        e.event_date,
        p.display_name as creator_name,
        (SELECT COUNT(*) FROM group_memberships WHERE group_id = g.id AND status = 'active') as active_members_count
      FROM groups g
      LEFT JOIN events e ON g.event_id = e.id
      JOIN profiles p ON g.creator_id = p.user_id
      WHERE g.is_public = 1
    `;
    const params = [];

    if (event_id) {
      query += ` AND g.event_id = ?`;
      params.push(parseInt(event_id, 10));
    }

    if (q && q.trim()) {
      query += ` AND (LOWER(g.name) LIKE ? OR LOWER(g.description) LIKE ?)`;
      const search = `%${q.trim().toLowerCase()}%`;
      params.push(search, search);
    }

    query += ` ORDER BY g.created_at DESC`;

    const groups = db.prepare(query).all(...params);

    // If authenticated, check membership status
    if (req.user) {
      const userMemberships = db.prepare(`
        SELECT group_id, role, status FROM group_memberships WHERE user_id = ?
      `).all(req.user.id);
      const membershipMap = new Map();
      userMemberships.forEach(m => membershipMap.set(m.group_id, m));

      groups.forEach(g => {
        g.user_membership = membershipMap.get(g.id) || null;
      });
    }

    return res.json({ groups });
  } catch (err) {
    console.error('listGroups error:', err);
    return res.status(500).json({ error: 'Failed to retrieve groups.' });
  }
};

exports.getGroupDetails = (req, res) => {
  try {
    const db = getDb();
    const groupId = parseInt(req.params.id, 10);

    const group = db.prepare(`
      SELECT
        g.*,
        e.name as event_name,
        e.city as event_city,
        e.venue_name,
        e.event_date,
        p.display_name as creator_name
      FROM groups g
      LEFT JOIN events e ON g.event_id = e.id
      JOIN profiles p ON g.creator_id = p.user_id
      WHERE g.id = ?
    `).get(groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found.' });
    }

    const members = db.prepare(`
      SELECT
        gm.id as membership_id,
        gm.user_id,
        gm.role,
        gm.status,
        gm.created_at as joined_at,
        p.display_name,
        p.garba_experience,
        p.city,
        (SELECT photo_url FROM profile_photos WHERE profile_id = p.id AND is_primary = 1 LIMIT 1) as primary_photo
      FROM group_memberships gm
      JOIN profiles p ON gm.user_id = p.user_id
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ? AND u.status = 'active'
      ORDER BY gm.role DESC, gm.created_at ASC
    `).all(groupId);

    let userMembership = null;
    if (req.user) {
      userMembership = members.find(m => m.user_id === req.user.id) || null;
    }

    return res.json({ group, members, userMembership });
  } catch (err) {
    console.error('getGroupDetails error:', err);
    return res.status(500).json({ error: 'Failed to retrieve group details.' });
  }
};

exports.createGroup = (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { name, description, eventId, maxMembers, isPublic } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Group name is required.' });
    }

    const max = Math.min(50, Math.max(2, parseInt(maxMembers || 10, 10)));
    const pub = isPublic === false || isPublic === 0 ? 0 : 1;

    db.exec('BEGIN IMMEDIATE');
    let groupId;
    try {
      const resGroup = db.prepare(`
        INSERT INTO groups (creator_id, name, description, event_id, max_members, is_public)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(userId, name.trim(), (description || '').trim(), eventId ? parseInt(eventId, 10) : null, max, pub);

      groupId = Number(resGroup.lastInsertRowid);

      // Creator is automatic admin
      db.prepare(`
        INSERT INTO group_memberships (group_id, user_id, role, status)
        VALUES (?, ?, 'admin', 'active')
      `).run(groupId, userId);

      // Track group created analytics
      db.prepare('INSERT INTO analytics_events (user_id, event_name, event_payload) VALUES (?, ?, ?)')
        .run(userId, 'group_created', JSON.stringify({ groupId, name: name.trim() }));

      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

    const createdGroup = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId);

    return res.status(201).json({
      message: 'Garba group created successfully!',
      group: createdGroup
    });
  } catch (err) {
    console.error('createGroup error:', err);
    return res.status(500).json({ error: 'Failed to create group.' });
  }
};

exports.joinGroup = (req, res) => {
  try {
    const db = getDb();
    const groupId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found.' });
    }

    // Check current member count
    const activeCount = db.prepare(`
      SELECT COUNT(*) as count FROM group_memberships
      WHERE group_id = ? AND status = 'active'
    `).get(groupId).count;

    if (activeCount >= group.max_members) {
      return res.status(400).json({ error: 'Group has already reached its maximum capacity.' });
    }

    const existingMembership = db.prepare(`
      SELECT * FROM group_memberships WHERE group_id = ? AND user_id = ?
    `).get(groupId, userId);

    if (existingMembership) {
      if (existingMembership.status === 'active') {
        return res.status(400).json({ error: 'You are already an active member of this group.' });
      }
      if (existingMembership.status === 'pending') {
        return res.status(400).json({ error: 'Your join request is currently pending approval.' });
      }
    }

    // For public group: direct active join. For invite-only/private group: status = 'pending'
    const status = group.is_public === 1 ? 'active' : 'pending';

    db.prepare(`
      INSERT INTO group_memberships (group_id, user_id, role, status)
      VALUES (?, ?, 'member', ?)
      ON CONFLICT(group_id, user_id) DO UPDATE SET status = excluded.status, role = 'member'
    `).run(groupId, userId, status);

    return res.json({
      message: status === 'active' ? 'Successfully joined the group!' : 'Join request submitted for admin review.',
      status
    });
  } catch (err) {
    console.error('joinGroup error:', err);
    return res.status(500).json({ error: 'Failed to join group.' });
  }
};

exports.leaveGroup = (req, res) => {
  try {
    const db = getDb();
    const groupId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const membership = db.prepare(`
      SELECT * FROM group_memberships WHERE group_id = ? AND user_id = ?
    `).get(groupId, userId);

    if (!membership) {
      return res.status(404).json({ error: 'You are not a member of this group.' });
    }

    // If the creator/sole admin leaves, transfer admin or dissolve
    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId);
    if (group.creator_id === userId) {
      const otherActive = db.prepare(`
        SELECT user_id FROM group_memberships
        WHERE group_id = ? AND user_id != ? AND status = 'active'
        ORDER BY id ASC LIMIT 1
      `).get(groupId, userId);

      if (otherActive) {
        db.prepare('UPDATE groups SET creator_id = ? WHERE id = ?').run(otherActive.user_id, groupId);
        db.prepare("UPDATE group_memberships SET role = 'admin' WHERE group_id = ? AND user_id = ?").run(groupId, otherActive.user_id);
      }
    }

    db.prepare('DELETE FROM group_memberships WHERE group_id = ? AND user_id = ?').run(groupId, userId);

    return res.json({ message: 'Successfully left the group.' });
  } catch (err) {
    console.error('leaveGroup error:', err);
    return res.status(500).json({ error: 'Failed to leave group.' });
  }
};

exports.manageRequest = (req, res) => {
  try {
    const db = getDb();
    const groupId = parseInt(req.params.id, 10);
    const membershipId = parseInt(req.params.membershipId, 10);
    const { action } = req.body; // 'accept' or 'reject'
    const userId = req.user.id;

    // Check if requester is group admin
    const adminCheck = db.prepare(`
      SELECT role FROM group_memberships WHERE group_id = ? AND user_id = ?
    `).get(groupId, userId);

    if (!adminCheck || adminCheck.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Only group administrators can manage join requests.' });
    }

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: "Action must be 'accept' or 'reject'." });
    }

    const newStatus = action === 'accept' ? 'active' : 'rejected';
    db.prepare(`
      UPDATE group_memberships SET status = ? WHERE id = ? AND group_id = ?
    `).run(newStatus, membershipId, groupId);

    return res.json({ message: `Membership request ${action}ed successfully.` });
  } catch (err) {
    console.error('manageRequest error:', err);
    return res.status(500).json({ error: 'Failed to manage membership request.' });
  }
};

exports.removeMember = (req, res) => {
  try {
    const db = getDb();
    const groupId = parseInt(req.params.id, 10);
    const targetUserId = parseInt(req.params.userId, 10);
    const currentUserId = req.user.id;

    // Only group admin can remove members
    const adminCheck = db.prepare(`
      SELECT role FROM group_memberships WHERE group_id = ? AND user_id = ?
    `).get(groupId, currentUserId);

    if (!adminCheck || adminCheck.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Only group administrators can remove members.' });
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'To leave the group, please use the Leave action.' });
    }

    db.prepare(`
      DELETE FROM group_memberships WHERE group_id = ? AND user_id = ?
    `).run(groupId, targetUserId);

    return res.json({ message: 'Member removed from group successfully.' });
  } catch (err) {
    console.error('removeMember error:', err);
    return res.status(500).json({ error: 'Failed to remove member.' });
  }
};
