-- 005: Transactions and Payouts

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id),
  app_id UUID REFERENCES apps(id),
  buyer_id UUID REFERENCES users(id),
  developer_id UUID REFERENCES developer_profiles(id),
  amount_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL,
  developer_payout_cents INTEGER NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  status TEXT DEFAULT 'succeeded',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transactions_app_id ON transactions(app_id);
CREATE INDEX idx_transactions_developer_id ON transactions(developer_id);
CREATE INDEX idx_transactions_buyer_id ON transactions(buyer_id);

CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES developer_profiles(id),
  amount_cents INTEGER NOT NULL,
  stripe_payout_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payouts_developer_id ON payouts(developer_id);

-- RLS for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Buyers can see their own transactions
CREATE POLICY "transactions_buyer_read" ON transactions
  FOR SELECT USING (
    buyer_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
  );

-- Developers can see transactions for their apps
CREATE POLICY "transactions_dev_read" ON transactions
  FOR SELECT USING (
    developer_id IN (
      SELECT id FROM developer_profiles
      WHERE user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
    )
  );

-- RLS for payouts
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Developers can read their own payouts
CREATE POLICY "payouts_dev_read" ON payouts
  FOR SELECT USING (
    developer_id IN (
      SELECT id FROM developer_profiles
      WHERE user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
    )
  );
