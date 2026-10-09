-- GarbaJodi Relational Schema
PRAGMA foreign_keys = ON;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  dob DATE NOT NULL,
  age INTEGER NOT NULL,
  city TEXT NOT NULL,
  preferred_language TEXT DEFAULT 'Gujarati',
  bio TEXT,
  garba_experience TEXT CHECK(garba_experience IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'intermediate',
  dance_style TEXT,
  hobbies TEXT,
  connection_types TEXT DEFAULT '["partner"]',
  preferred_dates TEXT,
  availability TEXT,
  is_discoverable INTEGER DEFAULT 1,
  is_adult_verified INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Profile Photos
CREATE TABLE IF NOT EXISTS profile_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  is_primary INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Garba Events
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  organizer TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  description TEXT,
  is_published INTEGER DEFAULT 1,
  ticket_url TEXT,
  capacity INTEGER DEFAULT 1500,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Event Attendances
CREATE TABLE IF NOT EXISTS event_attendances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  status TEXT CHECK(status IN ('attending', 'interested')) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, event_id)
);

-- Likes / Passes
CREATE TABLE IF NOT EXISTS likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT CHECK(action IN ('like', 'pass')) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sender_id, receiver_id)
);

-- Mutual Matches (user1_id < user2_id canonical ordering)
CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT CHECK(status IN ('matched', 'unmatched')) DEFAULT 'matched',
  matched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  unmatched_at DATETIME,
  UNIQUE(user1_id, user2_id),
  CHECK(user1_id < user2_id)
);

-- Conversations (1:1 with match)
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER UNIQUE NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Groups
CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
  max_members INTEGER DEFAULT 12,
  is_public INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Group Memberships
CREATE TABLE IF NOT EXISTS group_memberships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK(role IN ('admin', 'member')) DEFAULT 'member',
  status TEXT CHECK(status IN ('active', 'pending', 'rejected')) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, user_id)
);

-- User Blocks
CREATE TABLE IF NOT EXISTS blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(blocker_id, blocked_id)
);

-- Moderation Reports
CREATE TABLE IF NOT EXISTS moderation_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT CHECK(target_type IN ('user', 'message', 'group')) NOT NULL,
  target_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT CHECK(status IN ('pending', 'resolved', 'dismissed')) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Moderation Actions Audit
CREATE TABLE IF NOT EXISTS moderation_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_id INTEGER REFERENCES moderation_reports(id) ON DELETE SET NULL,
  action_taken TEXT NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- IT Rules 2021 Statutory Grievances Audit Table
CREATE TABLE IF NOT EXISTS statutory_grievances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT UNIQUE NOT NULL,
  complainant_name TEXT NOT NULL,
  complainant_email TEXT NOT NULL,
  complainant_phone TEXT,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  reported_target TEXT,
  status TEXT DEFAULT 'acknowledged' CHECK(status IN ('acknowledged', 'under_investigation', 'resolved', 'rejected')),
  resolution_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME
);

-- Subscription Plans Table (Spark, Chemistry, Attraction, Dream Match)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price_inr INTEGER NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  daily_likes_limit INTEGER NOT NULL DEFAULT 25,
  boost_credits INTEGER NOT NULL DEFAULT 0,
  can_see_likes INTEGER NOT NULL DEFAULT 0,
  priority_level INTEGER NOT NULL DEFAULT 1,
  features_json TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_popular INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User Active Subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  status TEXT CHECK(status IN ('active', 'expired', 'cancelled')) DEFAULT 'active',
  start_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_date DATETIME NOT NULL,
  remaining_boosts INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Payment Transactions Audit
CREATE TABLE IF NOT EXISTS payment_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  order_id TEXT UNIQUE NOT NULL,
  payment_id TEXT UNIQUE,
  amount_inr INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT CHECK(status IN ('created', 'captured', 'failed', 'refunded')) DEFAULT 'created',
  payment_method TEXT,
  signature TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User Profile Boost Records
CREATE TABLE IF NOT EXISTS user_boosts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  boosted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Product Analytics Events
CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_payload TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
CREATE INDEX IF NOT EXISTS idx_likes_sender ON likes(sender_id);
CREATE INDEX IF NOT EXISTS idx_likes_receiver ON likes(receiver_id);
CREATE INDEX IF NOT EXISTS idx_matches_users ON matches(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_blocks_lookup ON blocks(blocker_id, blocked_id);
CREATE INDEX IF NOT EXISTS idx_subs_user ON user_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payment_transactions(order_id);
