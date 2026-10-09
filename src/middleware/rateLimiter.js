const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many authentication attempts, please try again in 15 minutes.' }
});

const actionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Action rate limit reached. Please wait a moment.' }
});

module.exports = {
  generalLimiter,
  authLimiter,
  actionLimiter
};
