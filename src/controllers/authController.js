const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { getDb } = require('../db/database');

function calculateAge(dobString) {
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return -1;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

exports.register = async (req, res) => {
  try {
    const { email, password, displayName, dob, isAdultConfirmed, city, garbaExperience } = req.body;

    if (!email || !password || !displayName || !dob) {
      return res.status(400).json({ error: 'Please provide email, password, display name, and date of birth.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const age = calculateAge(dob);
    if (age < 18) {
      return res.status(403).json({ error: 'Eligibility requirement failed. You must be at least 18 years old to use GarbaJodi.' });
    }

    if (!isAdultConfirmed) {
      return res.status(400).json({ error: 'You must confirm that you are at least 18 years old and eligible to register.' });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = db.prepare(`
      INSERT INTO users (email, password_hash, role, status)
      VALUES (?, ?, 'user', 'active')
    `).run(email.toLowerCase().trim(), passwordHash);

    const userId = Number(userResult.lastInsertRowid);

const { sanitizeCity } = require('../config/cities');
    const safeCity = sanitizeCity(city);

    db.prepare(`
      INSERT INTO profiles (
        user_id, display_name, dob, age, city, preferred_language,
        bio, garba_experience, is_discoverable, is_adult_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
    `).run(
      userId,
      displayName.trim(),
      dob,
      age,
      safeCity,
      'Gujarati, Hindi',
      'Excited for Navratri 2026! Looking forward to energetic Raas and traditional Garba.',
      ['beginner', 'intermediate', 'advanced'].includes(garbaExperience) ? garbaExperience : 'intermediate'
    );

    const user = { id: userId, email: email.toLowerCase().trim(), role: 'user' };
    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);

    // Track registration event
    db.prepare('INSERT INTO analytics_events (user_id, event_name, event_payload) VALUES (?, ?, ?)')
      .run(userId, 'registration_completed', JSON.stringify({ city: profile.city, age }));

    return res.status(201).json({
      message: 'Account created successfully. Welcome to GarbaJodi!',
      token,
      user,
      profile
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const db = getDb();
    const user = db.prepare('SELECT id, email, password_hash, role, status FROM users WHERE email = ?').get(email.toLowerCase().trim());

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'This account has been suspended for safety violations.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(user.id);
    const photos = profile ? db.prepare('SELECT * FROM profile_photos WHERE profile_id = ?').all(profile.id) : [];

    return res.json({
      message: 'Logged in successfully.',
      token,
      user: { id: user.id, email: user.email, role: user.role },
      profile,
      photos
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
};

exports.me = (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT id, email, role, status, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
    const photos = profile ? db.prepare('SELECT * FROM profile_photos WHERE profile_id = ? ORDER BY is_primary DESC, id ASC').all(profile.id) : [];

    // Calculate match & unread counts
    const matchesCount = db.prepare(`
      SELECT COUNT(*) as count FROM matches
      WHERE (user1_id = ? OR user2_id = ?) AND status = 'matched'
    `).get(req.user.id, req.user.id).count;

    const unreadMessagesCount = db.prepare(`
      SELECT COUNT(*) as count FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      JOIN matches mat ON c.match_id = mat.id
      WHERE (mat.user1_id = ? OR mat.user2_id = ?)
        AND m.sender_id != ?
        AND m.is_read = 0
        AND mat.status = 'matched'
    `).get(req.user.id, req.user.id, req.user.id).count;

    return res.json({
      user,
      profile,
      photos,
      matchesCount,
      unreadMessagesCount
    });
  } catch (err) {
    console.error('Me endpoint error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out successfully.' });
};

exports.deleteAccount = (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
    res.clearCookie('token');
    return res.json({ message: 'Account and all associated records have been permanently deleted.' });
  } catch (err) {
    console.error('Delete account error:', err);
    return res.status(500).json({ error: 'Could not delete account.' });
  }
};
