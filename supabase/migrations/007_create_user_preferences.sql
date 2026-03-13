-- 007: User preferences
-- Dashboard layout, app order, pinned apps, quick launch, custom groups

CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  dashboard_layout TEXT DEFAULT 'grid' CHECK (dashboard_layout IN ('grid', 'compact', 'list')),
  app_order JSONB DEFAULT '[]',
  pinned_apps JSONB DEFAULT '[]',
  quick_launch JSONB DEFAULT '[]',
  custom_groups JSONB DEFAULT '[]',
  launcher_mode TEXT DEFAULT 'modal' CHECK (launcher_mode IN ('modal', 'panel', 'tab', 'window')),
  theme JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_prefs_user_id ON user_preferences(user_id);

-- RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only access their own preferences
CREATE POLICY "prefs_select_own" ON user_preferences
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid())
  );

CREATE POLICY "prefs_insert_own" ON user_preferences
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid())
  );

CREATE POLICY "prefs_update_own" ON user_preferences
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid())
  );
