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
  max: 15,
  message: { error: 'Too many login attempts. For security, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many registration attempts from this network. Please wait an hour.' },
  standardHeaders: true,
  legacyHeaders: false
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 6,
  message: { error: 'Too many OTP requests. Please wait 10 minutes before requesting again.' },
  standardHeaders: true,
  legacyHeaders: false
});

const actionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Action rate limit reached. Please wait a moment.' }
});

const likeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Like rate limit reached. Please wait a moment.' }
});

const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Message rate limit reached. Please wait a moment before sending more messages.' }
});

module.exports = {
  generalLimiter,
  authLimiter,
  registerLimiter,
  otpLimiter,
  actionLimiter,
  likeLimiter,
  messageLimiter
};
