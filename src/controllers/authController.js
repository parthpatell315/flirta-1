const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { getDb } = require('../db/database');
const { COPY } = require('../constants/copy');
const { ensureReferralCode, applyReferralCode } = require('../services/accounts');

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

exports.getConfig = (req, res) => {
  return res.json({
    enableDemoLogin: config.ENABLE_DEMO_LOGIN,
    turnstileSiteKey: config.TURNSTILE_SITE_KEY,
    googleClientId: config.GOOGLE_CLIENT_ID
  });
};

exports.register = async (req, res) => {
  try {
    const { email, password, displayName, dob, isAdultConfirmed, city, interests, referralCode, turnstileToken } = req.body;

    if (!email || !password || !displayName || !dob) {
      return res.status(400).json({ error: 'Please provide email, password, display name, and date of birth.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one letter and one number for account security.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    // Bot / Turnstile verification (only enforced if secret configured in production)
    if (config.TURNSTILE_SECRET_KEY && config.NODE_ENV === 'production') {
      const captchaToken = turnstileToken || req.body['cf-turnstile-response'];
      if (!captchaToken) {
        return res.status(400).json({ error: 'Security verification failed. Please complete the captcha.' });
      }
      try {
        const cfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: config.TURNSTILE_SECRET_KEY,
            response: captchaToken,
            remoteip: req.ip
          })
        });
        const cfData = await cfRes.json();
        if (!cfData.success) {
          return res.status(400).json({ error: 'Security verification failed. Please try again.' });
        }
      } catch (cfErr) {
        console.error('Turnstile check error:', cfErr);
      }
    }

    const age = calculateAge(dob);
    if (age < 18) {
      return res.status(403).json({ error: COPY.ageGate });
    }

    if (!isAdultConfirmed) {
      return res.status(400).json({ error: COPY.adultConfirm });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const userResult = db.prepare(`
      INSERT INTO users (email, password_hash, role, status)
      VALUES (?, ?, 'user', 'active')
    `).run(email.toLowerCase().trim(), passwordHash);

    const userId = Number(userResult.lastInsertRowid);

const { sanitizeCity } = require('../config/cities');
    const safeCity = sanitizeCity(city);

    const interestJson = JSON.stringify(Array.isArray(interests) ? interests.slice(0, 8) : []);
    db.prepare(`
      INSERT INTO profiles (
        user_id, display_name, dob, age, city, preferred_language,
        bio, interests, is_discoverable, is_adult_verified, moderation_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 'approved')
    `).run(
      userId,
      displayName.trim(),
      dob,
      age,
      safeCity,
      'English',
      '',
      interestJson
    );
    ensureReferralCode(db, userId);
    applyReferralCode(db, userId, referralCode);

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
      message: COPY.welcome,
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
      user: { id: user.id, email: user.email, role: user.role, phone: user.phone, is_phone_verified: user.is_phone_verified },
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
    const user = db.prepare('SELECT id, email, role, status, phone, is_phone_verified, created_at FROM users WHERE id = ?').get(req.user.id);
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

// Google Authentication Endpoint (GIS Credential Token / Code / Dev Fallback)
exports.googleAuth = async (req, res) => {
  try {
    const { credential, code, mockEmail, mockName } = req.body;
    let googleUser = null;

    if (credential) {
      // 1. Google Identity Services (GIS) ID Token verification
      try {
        const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (tokenInfoRes.ok) {
          const tokenInfo = await tokenInfoRes.json();
          if (tokenInfo.email) {
            googleUser = {
              googleId: tokenInfo.sub,
              email: tokenInfo.email.toLowerCase().trim(),
              name: tokenInfo.name || tokenInfo.email.split('@')[0],
              picture: tokenInfo.picture || null
            };
          }
        }
      } catch (fetchErr) {
        console.error('Google tokeninfo fetch error:', fetchErr);
      }
    }

    if (!googleUser && code && config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
      // 2. Authorization code exchange
      try {
        const redirectUri = `${config.BASE_URL}/api/auth/google/callback`;
        const params = new URLSearchParams({
          code,
          client_id: config.GOOGLE_CLIENT_ID,
          client_secret: config.GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        });
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        });
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
          });
          if (userinfoRes.ok) {
            const userInfo = await userinfoRes.json();
            googleUser = {
              googleId: userInfo.sub,
              email: userInfo.email.toLowerCase().trim(),
              name: userInfo.name || userInfo.email.split('@')[0],
              picture: userInfo.picture || null
            };
          }
        }
      } catch (oauthErr) {
        console.error('Google code exchange error:', oauthErr);
      }
    }

    // 3. Fallback for testing / dev mode if Google API keys not yet configured
    if (!googleUser && (config.NODE_ENV !== 'production' || !config.GOOGLE_CLIENT_ID)) {
      if (mockEmail || req.body.isMock || credential === 'mock_google_token') {
        const email = (mockEmail || 'user.google@flirta.network').toLowerCase().trim();
        googleUser = {
          googleId: 'google_mock_' + crypto.createHash('md5').update(email).digest('hex').slice(0, 16),
          email,
          name: mockName || 'Verified Member',
          picture: null
        };
      }
    }

    if (!googleUser || !googleUser.email) {
      return res.status(400).json({ error: 'Google verification failed. Please try again or sign in with email.' });
    }

    const db = getDb();
    let user = db.prepare('SELECT id, email, role, status, google_id FROM users WHERE google_id = ? OR email = ?').get(googleUser.googleId, googleUser.email);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 12);

      const userResult = db.prepare(`
        INSERT INTO users (email, google_id, auth_provider, password_hash, role, status)
        VALUES (?, ?, 'google', ?, 'user', 'active')
      `).run(googleUser.email, googleUser.googleId, passwordHash);

      const userId = Number(userResult.lastInsertRowid);
      user = { id: userId, email: googleUser.email, role: 'user', status: 'active', google_id: googleUser.googleId };

      db.prepare(`
        INSERT INTO profiles (
          user_id, display_name, dob, age, city, preferred_language,
          bio, interests, is_discoverable, is_adult_verified, moderation_status
        ) VALUES (?, ?, '2000-01-01', 26, 'Ahmedabad', 'English',
          '', '[]', 1, 1, 'approved')
      `).run(userId, googleUser.name);
      ensureReferralCode(db, userId);

      if (googleUser.picture) {
        const profile = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(userId);
        if (profile) {
          db.prepare(`
            INSERT INTO profile_photos (profile_id, photo_url, is_primary)
            VALUES (?, ?, 1)
          `).run(profile.id, googleUser.picture);
        }
      }

      db.prepare('INSERT INTO analytics_events (user_id, event_name, event_payload) VALUES (?, ?, ?)')
        .run(userId, 'registration_completed', JSON.stringify({ provider: 'google', city: 'Ahmedabad' }));
    } else {
      if (user.status === 'suspended') {
        return res.status(403).json({ error: 'This account has been suspended for safety violations.' });
      }
      if (!user.google_id) {
        db.prepare("UPDATE users SET google_id = ?, auth_provider = 'google' WHERE id = ?").run(googleUser.googleId, user.id);
      }
    }

    const token = generateToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(user.id);
    const photos = profile ? db.prepare('SELECT * FROM profile_photos WHERE profile_id = ? ORDER BY is_primary DESC, id ASC').all(profile.id) : [];

    return res.json({
      success: true,
      message: isNewUser ? 'Welcome to Flirta! Your profile is ready.' : 'Welcome back!',
      token,
      user: { id: user.id, email: user.email, role: user.role },
      profile,
      photos
    });
  } catch (err) {
    console.error('Google Auth error:', err);
    return res.status(500).json({ error: 'Google sign-in encountered an internal error.' });
  }
};

// Google OAuth URL redirect
exports.googleOAuthUrl = (req, res) => {
  if (!config.GOOGLE_CLIENT_ID) {
    return res.redirect('/?auth=google_not_configured');
  }
  const redirectUri = encodeURIComponent(`${config.BASE_URL}/api/auth/google/callback`);
  const scope = encodeURIComponent('openid email profile');
  const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${config.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}&prompt=select_account`;
  return res.redirect(googleUrl);
};

// Google OAuth redirect callback
exports.googleOAuthCallback = async (req, res) => {
  const { code, error } = req.query;
  if (error || !code) {
    return res.redirect('/?auth_error=cancelled');
  }
  try {
    const redirectUri = `${config.BASE_URL}/api/auth/google/callback`;
    const params = new URLSearchParams({
      code,
      client_id: config.GOOGLE_CLIENT_ID,
      client_secret: config.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    if (!tokenRes.ok) {
      return res.redirect('/?auth_error=token_failed');
    }
    const tokenData = await tokenRes.json();
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userInfo = await userinfoRes.json();
    const email = userInfo.email.toLowerCase().trim();
    const db = getDb();

    let user = db.prepare('SELECT id, email, role, status, google_id FROM users WHERE google_id = ? OR email = ?').get(userInfo.sub, email);
    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 12);
      const userResult = db.prepare(`
        INSERT INTO users (email, google_id, auth_provider, password_hash, role, status)
        VALUES (?, ?, 'google', ?, 'user', 'active')
      `).run(email, userInfo.sub, passwordHash);
      const userId = Number(userResult.lastInsertRowid);
      user = { id: userId, email, role: 'user', status: 'active' };

      db.prepare(`
        INSERT INTO profiles (
          user_id, display_name, dob, age, city, preferred_language,
          bio, interests, is_discoverable, is_adult_verified, moderation_status
        ) VALUES (?, ?, '2000-01-01', 26, 'Ahmedabad', 'English',
          '', '[]', 1, 1, 'approved')
      `).run(userId, userInfo.name || email.split('@')[0]);
      ensureReferralCode(db, userId);

      if (userInfo.picture) {
        const profile = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(userId);
        if (profile) {
          db.prepare('INSERT INTO profile_photos (profile_id, photo_url, is_primary) VALUES (?, ?, 1)').run(profile.id, userInfo.picture);
        }
      }
    }

    const token = generateToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    return res.redirect('/discover');
  } catch (err) {
    console.error('Google callback error:', err);
    return res.redirect('/?auth_error=server_error');
  }
};
