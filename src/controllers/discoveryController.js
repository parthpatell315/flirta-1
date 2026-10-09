const { getDb } = require('../db/database');

exports.discoverProfiles = (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;

    const {
      city,
      event_id,
      connection_type,
      experience,
      language,
      min_age,
      max_age,
      page = 1,
      limit = 20
    } = req.query;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(50, Math.max(1, parseInt(limit, 10)));
    const pageLimit = Math.min(50, Math.max(1, parseInt(limit, 10)));

    let whereClause = `
      WHERE u.id != ?
        AND u.status = 'active'
        AND p.is_discoverable = 1
        -- Exclude already swiped (liked or passed)
        AND u.id NOT IN (SELECT receiver_id FROM likes WHERE sender_id = ?)
        -- Exclude blocked users (bidirectional)
        AND u.id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ?)
        AND u.id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = ?)
        -- Exclude already active matches
        AND u.id NOT IN (
          SELECT CASE WHEN user1_id = ? THEN user2_id ELSE user1_id END
          FROM matches
          WHERE (user1_id = ? OR user2_id = ?) AND status = 'matched'
        )
    `;

    const params = [userId, userId, userId, userId, userId, userId, userId];

    if (city && city.trim()) {
      whereClause += ` AND LOWER(p.city) = LOWER(?)`;
      params.push(city.trim());
    }

    if (experience && ['beginner', 'intermediate', 'advanced'].includes(experience)) {
      whereClause += ` AND p.garba_experience = ?`;
      params.push(experience);
    }

    if (connection_type && connection_type.trim()) {
      whereClause += ` AND p.connection_types LIKE ?`;
      params.push(`%"${connection_type.trim()}"%`);
    }

    if (language && language.trim()) {
      whereClause += ` AND LOWER(p.preferred_language) LIKE LOWER(?)`;
      params.push(`%${language.trim()}%`);
    }

    if (min_age) {
      whereClause += ` AND p.age >= ?`;
      params.push(parseInt(min_age, 10));
    }

    if (max_age) {
      whereClause += ` AND p.age <= ?`;
      params.push(parseInt(max_age, 10));
    }

    if (event_id) {
      whereClause += ` AND u.id IN (SELECT user_id FROM event_attendances WHERE event_id = ?)`;
      params.push(parseInt(event_id, 10));
    }

    const countQuery = `
      SELECT COUNT(*) as total
      FROM profiles p
      JOIN users u ON p.user_id = u.id
      ${whereClause}
    `;

    const totalCount = db.prepare(countQuery).get(...params).total;

    const dataQuery = `
      SELECT
        p.id as profile_id,
        p.user_id,
        p.display_name,
        p.age,
        p.city,
        p.preferred_language,
        p.bio,
        p.garba_experience,
        p.dance_style,
        p.hobbies,
        p.connection_types,
        p.preferred_dates,
        p.availability,
        (SELECT photo_url FROM profile_photos WHERE profile_id = p.id AND is_primary = 1 LIMIT 1) as primary_photo
      FROM profiles p
      JOIN users u ON p.user_id = u.id
      ${whereClause}
      ORDER BY CASE WHEN p.boosted_until > CURRENT_TIMESTAMP THEN 1 ELSE 0 END DESC, p.updated_at DESC
      LIMIT ? OFFSET ?
    `;

    const rawProfiles = db.prepare(dataQuery).all(...params, pageLimit, offset);

    // Enrich each profile with secondary photos and attending events (strictly non-sensitive)
    const profiles = rawProfiles.map(prof => {
      const allPhotos = db.prepare('SELECT photo_url FROM profile_photos WHERE profile_id = ? ORDER BY is_primary DESC, id ASC').all(prof.profile_id);

      const attendingEvents = db.prepare(`
        SELECT e.id, e.name, e.city, e.event_date, e.venue_name
        FROM event_attendances ea
        JOIN events e ON ea.event_id = e.id
        WHERE ea.user_id = ? AND e.is_published = 1
        ORDER BY e.event_date ASC
        LIMIT 4
      `).all(prof.user_id);

      let parsedConnTypes = [];
      try {
        parsedConnTypes = JSON.parse(prof.connection_types || '[]');
      } catch {
        parsedConnTypes = ['partner'];
      }

      return {
        profile_id: prof.profile_id,
        user_id: prof.user_id,
        display_name: prof.display_name,
        age: prof.age,
        city: prof.city,
        preferred_language: prof.preferred_language,
        bio: prof.bio,
        garba_experience: prof.garba_experience,
        dance_style: prof.dance_style,
        hobbies: prof.hobbies,
        connection_types: parsedConnTypes,
        preferred_dates: prof.preferred_dates,
        availability: prof.availability,
        photos: allPhotos.map(p => p.photo_url),
        primary_photo: prof.primary_photo || (allPhotos[0] ? allPhotos[0].photo_url : null),
        attending_events: attendingEvents
      };
    });

    return res.json({
      profiles,
      pagination: {
        total: totalCount,
        page: parseInt(page, 10),
        limit: pageLimit,
        pages: Math.ceil(totalCount / pageLimit)
      }
    });
  } catch (err) {
    console.error('discoverProfiles error:', err);
    return res.status(500).json({ error: 'Failed to discover profiles.' });
  }
};
