-- 003: Purchases table
-- Tracks which users own which apps (via Stripe subscriptions)

CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, app_id)
);

CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_app_id ON purchases(app_id);
CREATE INDEX idx_purchases_status ON purchases(status);

-- RLS: users can only read their own purchases
-- Inserts/updates are server-side only (via service_role key from webhook)
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchases_read_own" ON purchases
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid())
  );
