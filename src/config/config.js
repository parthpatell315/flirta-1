const path = require('node:path');

module.exports = {
  PORT: process.env.PORT || 3030,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'garbajodi_navratri_secret_key_2026_festive',
  DB_PATH: process.env.DB_PATH || path.join(__dirname, '../../garbajodi.db'),
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.join(__dirname, '../../public/uploads/avatars'),
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 mins
  RATE_LIMIT_MAX: 300 // 300 requests per window
};
