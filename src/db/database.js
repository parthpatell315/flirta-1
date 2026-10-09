const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const config = require('../config/config');

// Ensure database directory exists
const dbDir = path.dirname(config.DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Ensure upload directory exists
if (!fs.existsSync(config.UPLOAD_DIR)) {
  fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
}

let dbInstance = null;

function getDb(customPath = null) {
  if (dbInstance && !customPath) {
    return dbInstance;
  }

  const targetPath = customPath || config.DB_PATH;
  const db = new DatabaseSync(targetPath);

  // Enable WAL mode, busy timeout & foreign keys for high performance and concurrency
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');

  // Run schema migration
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
  }

  // Safe column migration for profiles.boosted_until
  try {
    db.exec('ALTER TABLE profiles ADD COLUMN boosted_until DATETIME;');
  } catch {
    // Column already exists
  }

  // Safe column migration for subscription_plans photo access
  try {
    db.exec('ALTER TABLE subscription_plans ADD COLUMN can_see_photo INTEGER NOT NULL DEFAULT 0;');
  } catch {}
  try {
    db.exec('ALTER TABLE subscription_plans ADD COLUMN can_see_all_photos INTEGER NOT NULL DEFAULT 0;');
  } catch {}
  try {
    db.exec('UPDATE subscription_plans SET can_see_photo = 1 WHERE price_inr >= 249;');
    db.exec('UPDATE subscription_plans SET can_see_all_photos = 1 WHERE price_inr >= 549;');
  } catch {}

  if (!customPath) {
    dbInstance = db;
  }
  return db;
}

module.exports = {
  getDb
};
