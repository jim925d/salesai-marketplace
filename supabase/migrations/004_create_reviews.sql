-- 004: App reviews (user ratings)

CREATE TABLE app_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(app_id, user_id)
);

CREATE INDEX idx_app_reviews_app_id ON app_reviews(app_id);

-- RLS
ALTER TABLE app_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews for approved apps
CREATE POLICY "reviews_public_read" ON app_reviews
  FOR SELECT USING (
    app_id IN (SELECT id FROM apps WHERE status = 'approved')
  );

-- Users can insert reviews for apps they own
CREATE POLICY "reviews_insert_own" ON app_reviews
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid())
    AND app_id IN (
      SELECT app_id FROM purchases
      WHERE user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid())
      AND status = 'active'
    )
  );

-- Users can update their own reviews
CREATE POLICY "reviews_update_own" ON app_reviews
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid())
  );

-- Users can delete their own reviews
CREATE POLICY "reviews_delete_own" ON app_reviews
  FOR DELETE USING (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid())
  );
