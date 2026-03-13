-- 006: Audit logs
-- Insert-only from client, read-only via service_role key (admin)

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert audit logs
CREATE POLICY "audit_insert" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- No SELECT policy for regular users — audit logs are admin-read via service_role
-- Admins can read via service_role key which bypasses RLS
