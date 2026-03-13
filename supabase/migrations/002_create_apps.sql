-- 002: Developer profiles and Apps tables

CREATE TABLE developer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  stripe_connect_id TEXT,
  stripe_onboarded BOOLEAN DEFAULT false,
  website_url TEXT,
  support_email TEXT,
  bio TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_dev_profiles_user_id ON developer_profiles(user_id);

CREATE TABLE apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES developer_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Outreach', 'Prospecting', 'Meeting Prep', 'Productivity')),
  price_cents INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  long_description TEXT,
  features JSONB DEFAULT '[]',
  file_path TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'in_review', 'approved', 'rejected', 'suspended')),
  security_score INTEGER,
  version TEXT DEFAULT '1.0.0',
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  total_installs INTEGER DEFAULT 0,
  total_revenue_cents INTEGER DEFAULT 0,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  rejection_reason TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_apps_developer_id ON apps(developer_id);
CREATE INDEX idx_apps_status ON apps(status);
CREATE INDEX idx_apps_category ON apps(category);
CREATE INDEX idx_apps_slug ON apps(slug);

CREATE TABLE app_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  file_path TEXT NOT NULL,
  changelog TEXT,
  security_score INTEGER,
  status TEXT DEFAULT 'pending_review',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_app_versions_app_id ON app_versions(app_id);

-- RLS for developer_profiles
ALTER TABLE developer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dev_profiles_select_own" ON developer_profiles
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid())
  );

CREATE POLICY "dev_profiles_insert_own" ON developer_profiles
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid())
  );

CREATE POLICY "dev_profiles_update_own" ON developer_profiles
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid())
  );

-- RLS for apps
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved apps
CREATE POLICY "apps_public_read" ON apps
  FOR SELECT USING (status = 'approved');

-- Developers can read their own apps (any status)
CREATE POLICY "apps_dev_read_own" ON apps
  FOR SELECT USING (
    developer_id IN (
      SELECT id FROM developer_profiles
      WHERE user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid())
    )
  );

-- Developers can insert their own apps
CREATE POLICY "apps_dev_insert" ON apps
  FOR INSERT WITH CHECK (
    developer_id IN (
      SELECT id FROM developer_profiles
      WHERE user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid())
    )
  );

-- Developers can update their own apps (not live/suspended)
CREATE POLICY "apps_dev_update" ON apps
  FOR UPDATE USING (
    developer_id IN (
      SELECT id FROM developer_profiles
      WHERE user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid())
    )
    AND status NOT IN ('approved', 'suspended')
  );

-- Admins have full access to apps
CREATE POLICY "admin_full_apps" ON apps
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE firebase_uid = auth.uid() AND role = 'admin')
  );

-- RLS for app_versions
ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_versions_dev_read" ON app_versions
  FOR SELECT USING (
    app_id IN (
      SELECT a.id FROM apps a
      JOIN developer_profiles dp ON a.developer_id = dp.id
      JOIN users u ON dp.user_id = u.id
      WHERE u.firebase_uid = auth.uid()
    )
  );

CREATE POLICY "admin_full_app_versions" ON app_versions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE firebase_uid = auth.uid() AND role = 'admin')
  );
