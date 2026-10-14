const fs = require('node:fs');
const path = require('node:path');
const { getDb } = require('../db/database');
const { RULES } = require('../constants/copy');

exports.getProfile = (req, res) => {
  try {
    const db = getDb();
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    const photos = db.prepare('SELECT * FROM profile_photos WHERE profile_id = ? ORDER BY is_primary DESC, id ASC').all(profile.id);

    // Parse connection_types if stored as JSON string
    let connectionTypes = [];
    try {
      connectionTypes = profile.connection_types ? JSON.parse(profile.connection_types) : [];
    } catch {
      connectionTypes = ['partner'];
    }

    const user = db.prepare('SELECT phone, is_phone_verified FROM users WHERE id = ?').get(req.user.id);

    let interests = [];
    try { interests = JSON.parse(profile.interests || '[]'); } catch { interests = []; }

    return res.json({
      ...profile,
      phone: user?.phone || profile.phone || '',
      is_phone_verified: (user?.is_phone_verified || profile.is_phone_verified) ? 1 : 0,
      connection_types: connectionTypes,
      interests,
      photos
    });
  } catch (err) {
    console.error('getProfile error:', err);
    return res.status(500).json({ error: 'Failed to fetch profile.' });
  }
};

exports.updateProfile = (req, res) => {
  try {
    const db = getDb();
    const profile = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.user.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    const {
      displayName,
      city,
      preferredLanguage,
      bio,
      interests,
      hobbies,
      connectionTypes,
      preferredDates,
      availability,
      isDiscoverable
    } = req.body;

    if (!displayName || !displayName.trim()) {
      return res.status(400).json({ error: 'Display name cannot be blank.' });
    }

    let interestJson = null;
    if (Array.isArray(interests)) {
      const allowed = new Set(RULES.interests.map(i => i.toLowerCase()));
      const filtered = interests
        .map(i => String(i).trim())
        .filter(i => allowed.has(i.toLowerCase()))
        .slice(0, 8);
      interestJson = JSON.stringify(filtered);
    }

    let connTypesString = '["dating"]';
    if (Array.isArray(connectionTypes)) {
      const allowed = ['dating', 'friendship', 'partner'];
      const filtered = connectionTypes.filter(c => allowed.includes(c));
      connTypesString = JSON.stringify(filtered.length ? filtered : ['partner']);
    }

    const { sanitizeCity } = require('../config/cities');
    const safeCity = sanitizeCity(city);

    db.prepare(`
      UPDATE profiles
      SET display_name = ?,
          city = ?,
          preferred_language = ?,
          bio = ?,
          interests = COALESCE(?, interests),
          hobbies = ?,
          connection_types = ?,
          preferred_dates = ?,
          availability = ?,
          is_discoverable = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      displayName.trim(),
      safeCity,
      (preferredLanguage || 'English').trim(),
      (bio || '').trim(),
      interestJson,
      (hobbies || '').trim(),
      connTypesString,
      (preferredDates || '').trim(),
      (availability || '').trim(),
      isDiscoverable === 0 || isDiscoverable === false ? 0 : 1,
      profile.id
    );

    // Track profile completion analytics
    db.prepare('INSERT INTO analytics_events (user_id, event_name, event_payload) VALUES (?, ?, ?)')
      .run(req.user.id, 'profile_completed', JSON.stringify({ city }));

    const updated = db.prepare('SELECT * FROM profiles WHERE id = ?').get(profile.id);
    const photos = db.prepare('SELECT * FROM profile_photos WHERE profile_id = ? ORDER BY is_primary DESC, id ASC').all(profile.id);

    return res.json({
      message: 'Profile updated successfully.',
      profile: {
        ...updated,
        connection_types: JSON.parse(updated.connection_types || '["partner"]'),
        photos
      }
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
};

exports.requestVerification = (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Upload a clear selfie to request photo verification.' });
    const db = getDb();
    const pending = db.prepare(`
      SELECT id FROM verification_requests WHERE user_id = ? AND status = 'pending'
    `).get(req.user.id);
    if (pending) return res.status(409).json({ error: 'A verification request is already waiting for review.' });

    const selfieUrl = `/uploads/avatars/${req.file.filename}`;
    const result = db.prepare(`
      INSERT INTO verification_requests (user_id, selfie_url, status)
      VALUES (?, ?, 'pending')
    `).run(req.user.id, selfieUrl);
    return res.status(201).json({
      message: 'Selfie submitted. A moderator will review it.',
      requestId: Number(result.lastInsertRowid),
      status: 'pending'
    });
  } catch (err) {
    console.error('requestVerification error:', err);
    return res.status(500).json({ error: 'Could not submit verification.' });
  }
};

exports.getVerification = (req, res) => {
  try {
    const db = getDb();
    const latest = db.prepare(`
      SELECT id, status, created_at, reviewed_at FROM verification_requests
      WHERE user_id = ? ORDER BY id DESC LIMIT 1
    `).get(req.user.id);
    const profile = db.prepare('SELECT is_photo_verified FROM profiles WHERE user_id = ?').get(req.user.id);
    return res.json({
      isPhotoVerified: profile ? profile.is_photo_verified === 1 : false,
      request: latest || null
    });
  } catch (err) {
    console.error('getVerification error:', err);
    return res.status(500).json({ error: 'Could not load verification status.' });
  }
};

exports.uploadPhoto = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const db = getDb();
    const profile = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.user.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    const existingPhotos = db.prepare('SELECT COUNT(*) as count FROM profile_photos WHERE profile_id = ?').get(profile.id).count;
    const isPrimary = existingPhotos === 0 ? 1 : 0;
    const photoUrl = `/uploads/avatars/${req.file.filename}`;

    const insertResult = db.prepare(`
      INSERT INTO profile_photos (profile_id, photo_url, is_primary)
      VALUES (?, ?, ?)
    `).run(profile.id, photoUrl, isPrimary);

    return res.status(201).json({
      message: 'Photo uploaded successfully.',
      photo: {
        id: Number(insertResult.lastInsertRowid),
        profile_id: profile.id,
        photo_url: photoUrl,
        is_primary: isPrimary
      }
    });
  } catch (err) {
    console.error('uploadPhoto error:', err);
    return res.status(500).json({ error: 'Failed to upload photo.' });
  }
};

exports.deletePhoto = (req, res) => {
  try {
    const photoId = Number(req.params.id);
    const db = getDb();
    const profile = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.user.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    const photo = db.prepare('SELECT * FROM profile_photos WHERE id = ? AND profile_id = ?').get(photoId, profile.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found or does not belong to you.' });
    }

    // Remove file from disk if exists
    try {
      const filename = path.basename(photo.photo_url);
      const filePath = path.join(__dirname, '../../public/uploads/avatars', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.warn('Disk removal error for photo:', e.message);
    }

    db.prepare('DELETE FROM profile_photos WHERE id = ?').run(photoId);

    // If deleted photo was primary, assign primary to next remaining photo
    if (photo.is_primary === 1) {
      const nextPhoto = db.prepare('SELECT id FROM profile_photos WHERE profile_id = ? ORDER BY id ASC LIMIT 1').get(profile.id);
      if (nextPhoto) {
        db.prepare('UPDATE profile_photos SET is_primary = 1 WHERE id = ?').run(nextPhoto.id);
      }
    }

    return res.json({ message: 'Photo deleted successfully.' });
  } catch (err) {
    console.error('deletePhoto error:', err);
    return res.status(500).json({ error: 'Failed to delete photo.' });
  }
};

exports.setPrimaryPhoto = (req, res) => {
  try {
    const photoId = Number(req.params.id);
    const db = getDb();
    const profile = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.user.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    const photo = db.prepare('SELECT * FROM profile_photos WHERE id = ? AND profile_id = ?').get(photoId, profile.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found.' });
    }

    db.prepare('UPDATE profile_photos SET is_primary = 0 WHERE profile_id = ?').run(profile.id);
    db.prepare('UPDATE profile_photos SET is_primary = 1 WHERE id = ?').run(photoId);

    return res.json({ message: 'Primary photo updated.' });
  } catch (err) {
    console.error('setPrimaryPhoto error:', err);
    return res.status(500).json({ error: 'Failed to update primary photo.' });
  }
};

// DPDP Act 2023 Statutory Right to Erasure / Account Deletion
exports.deleteAccount = (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDb();

    // 1. Find profile photos to clean disk storage
    const profile = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(userId);
    if (profile) {
      const photos = db.prepare('SELECT photo_url FROM profile_photos WHERE profile_id = ?').all(profile.id);
      for (const ph of photos) {
        try {
          const filename = path.basename(ph.photo_url);
          const filePath = path.join(__dirname, '../../public/uploads/avatars', filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (e) {
          console.warn('Could not remove avatar on user deletion:', e.message);
        }
      }
    }

    // 2. Cascade delete user and all associated records
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    // 3. Clear auth session cookie
    res.clearCookie('token');

    return res.json({
      success: true,
      message: 'Your account and personal data have been permanently erased in compliance with DPDP Act 2023 regulations.'
    });
  } catch (err) {
    console.error('deleteAccount error:', err);
    return res.status(500).json({ error: 'Failed to delete account.' });
  }
};
