-- 001: Users table
-- Links Firebase Auth UIDs to marketplace user profiles

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'developer', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast Firebase UID lookups during auth
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (firebase_uid = auth.uid()::text);

-- Users can update their own data but NOT change their role
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (firebase_uid = auth.uid()::text)
  WITH CHECK (
    firebase_uid = auth.uid()::text
    AND role = (SELECT role FROM users WHERE firebase_uid = auth.uid()::text)
  );

-- Allow inserts from authenticated users (for initial profile creation)
CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (firebase_uid = auth.uid()::text);

-- Admins can read all users
CREATE POLICY "admin_read_users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE firebase_uid = auth.uid()::text AND role = 'admin')
  );
