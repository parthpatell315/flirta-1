const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const config = require('../config/config');
const { getDb } = require('../db/database');
const { COPY } = require('../constants/copy');
const { sanitizeCity } = require('../config/cities');
const { ensureReferralCode, applyReferralCode } = require('../services/accounts');

function calculateAge(dobString) {
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return -1;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

function normalizePhone(input) {
  const digits = String(input || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  if (digits.length === 10 && /^[6-9]/.test(digits)) return digits;
  return null;
}

function hashOtp(phone, otp) {
  return crypto.createHash('sha256').update(`${phone}:${otp}:${config.JWT_SECRET}`).digest('hex');
}

function issueSession(res, user) {
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.cookie('token', token, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  });
  return token;
}

exports.requestOtp = (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    if (!phone) {
      return res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number.' });
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    const db = getDb();
    db.prepare('DELETE FROM phone_otps WHERE phone = ? AND is_verified = 0').run(phone);
    db.prepare(`
      INSERT INTO phone_otps (phone, otp_hash, expires_at, attempts, is_verified)
      VALUES (?, ?, datetime('now', '+10 minutes'), 0, 0)
    `).run(phone, hashOtp(phone, otp));

    if (config.NODE_ENV === 'production') {
      return res.status(503).json({
        error: 'Phone OTP is stored, but no SMS provider is configured for production. Use email signup until an SMS provider is added.'
      });
    }

    return res.json({
      message: 'OTP created. It expires in 10 minutes.',
      phone,
      devOtp: otp
    });
  } catch (err) {
    console.error('requestOtp error:', err);
    return res.status(500).json({ error: 'Could not create OTP.' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const otp = String(req.body.otp || '').trim();
    if (!phone || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ error: 'Phone number and a 6-digit OTP are required.' });
    }

    const db = getDb();
    const row = db.prepare(`
      SELECT * FROM phone_otps
      WHERE phone = ? AND is_verified = 0
      ORDER BY id DESC LIMIT 1
    `).get(phone);

    if (!row) return res.status(400).json({ error: 'Request a new OTP first.' });
    if (row.attempts >= 5) return res.status(429).json({ error: 'Too many incorrect OTP attempts. Request a new code.' });
    const expired = db.prepare(`SELECT 1 AS ok WHERE datetime(?) <= datetime('now')`).get(row.expires_at);
    if (expired) return res.status(400).json({ error: 'This OTP has expired. Request a new one.' });

    if (hashOtp(phone, otp) !== row.otp_hash) {
      db.prepare('UPDATE phone_otps SET attempts = attempts + 1 WHERE id = ?').run(row.id);
      return res.status(400).json({ error: 'Incorrect OTP.' });
    }

    db.prepare('UPDATE phone_otps SET is_verified = 1 WHERE id = ?').run(row.id);

    let user = db.prepare('SELECT id, email, role, status FROM users WHERE phone = ?').get(phone);
    let isNewUser = false;

    if (!user) {
      const { displayName, dob, city, isAdultConfirmed, referralCode, interests } = req.body;
      if (!displayName || !dob) {
        return res.status(400).json({ error: 'New accounts need a display name and date of birth.' });
      }
      if (!isAdultConfirmed) {
        return res.status(400).json({ error: COPY.adultConfirm });
      }
      const age = calculateAge(dob);
      if (age < 18) {
        return res.status(403).json({ error: COPY.ageGate });
      }

      isNewUser = true;
      const email = `phone${phone}@members.flirta.app`;
      const passwordHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 12);
      const userResult = db.prepare(`
        INSERT INTO users (email, phone, is_phone_verified, password_hash, role, status)
        VALUES (?, ?, 1, ?, 'user', 'active')
      `).run(email, phone, passwordHash);
      const userId = Number(userResult.lastInsertRowid);
      user = { id: userId, email, role: 'user', status: 'active' };

      let interestJson = '[]';
      if (Array.isArray(interests)) {
        interestJson = JSON.stringify(interests.map(i => String(i).trim()).filter(Boolean).slice(0, 8));
      }

      db.prepare(`
        INSERT INTO profiles (
          user_id, display_name, dob, age, city, preferred_language,
          bio, interests, is_discoverable, is_adult_verified, is_phone_verified, moderation_status
        ) VALUES (?, ?, ?, ?, ?, 'English', '', ?, 1, 1, 1, 'approved')
      `).run(userId, String(displayName).trim(), dob, age, sanitizeCity(city), interestJson);

      ensureReferralCode(db, userId);
      applyReferralCode(db, userId, referralCode);
    } else if (user.status === 'suspended') {
      return res.status(403).json({ error: 'This account has been suspended for safety violations.' });
    } else {
      db.prepare('UPDATE users SET is_phone_verified = 1 WHERE id = ?').run(user.id);
      db.prepare('UPDATE profiles SET is_phone_verified = 1 WHERE user_id = ?').run(user.id);
    }

    ensureReferralCode(db, user.id);
    const token = issueSession(res, user);
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(user.id);
    const photos = profile
      ? db.prepare('SELECT * FROM profile_photos WHERE profile_id = ? ORDER BY is_primary DESC').all(profile.id)
      : [];

    return res.status(isNewUser ? 201 : 200).json({
      message: isNewUser ? COPY.welcome : 'Logged in successfully.',
      token,
      user: { id: user.id, email: user.email, role: user.role, phone, is_phone_verified: 1 },
      profile,
      photos
    });
  } catch (err) {
    console.error('verifyOtp error:', err);
    return res.status(500).json({ error: 'Could not verify OTP.' });
  }
};
