const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { getDb } = require('../db/database');

function requireAuth(req, res, next) {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const db = getDb();
    const user = db.prepare('SELECT id, email, role, status FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account has been suspended for safety violations.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

function optionalAuth(req, res, next) {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const db = getDb();
    const user = db.prepare('SELECT id, email, role, status FROM users WHERE id = ?').get(decoded.id);
    if (user && user.status !== 'suspended') {
      req.user = user;
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }
  next();
}

module.exports = {
  requireAuth,
  optionalAuth
};
