require('dotenv').config();
const path = require('node:path');

module.exports = {
  PORT: process.env.PORT || 3030,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'garbajodi_navratri_secret_key_2026_festive',
  DB_PATH: process.env.DB_PATH || (process.env.NODE_ENV === 'test'
    ? path.join(__dirname, '../../garbajodi_test.db')
    : path.join(__dirname, '../../garbajodi.db')),
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.join(__dirname, '../../public/uploads/avatars'),
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 mins
  RATE_LIMIT_MAX: 300, // 300 requests per window
  // PayU India Payment Gateway Configuration
  PAYU_MERCHANT_KEY: (process.env.PAYU_MERCHANT_KEY || 'h2QwsE').trim(),
  PAYU_MERCHANT_SALT: (process.env.PAYU_MERCHANT_SALT || 'gvFFAuFL5rJBZpJHFGV3RcZOZJG7XylY')
    .trim()
    .replace(/XyIY$/, 'XylY'), // Resilience against common OCR/visual typo ('I' vs 'l')
  PAYU_ENV: (process.env.PAYU_ENV || 'live').trim().toLowerCase().startsWith('live') ? 'live' : 'test',
  BASE_URL: (process.env.BASE_URL || 'https://flirta.network').trim().replace(/\/+$/, ''),

  // Demo Login Guard: strictly disabled in production
  ENABLE_DEMO_LOGIN: process.env.ENABLE_DEMO_LOGIN === 'true' && process.env.NODE_ENV !== 'production',

  // Cloudflare Turnstile / Bot Verification
  TURNSTILE_SITE_KEY: process.env.TURNSTILE_SITE_KEY || '',
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY || '',

  // Google OAuth & Google Identity Services (GIS)
  GOOGLE_CLIENT_ID: (process.env.GOOGLE_CLIENT_ID || '').trim(),
  GOOGLE_CLIENT_SECRET: (process.env.GOOGLE_CLIENT_SECRET || '').trim()
};
