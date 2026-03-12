// Audit log helper — logs security-relevant actions
// Used for compliance and incident investigation

import { supabase } from './supabase'

type AuditAction =
  | 'user_signup' | 'user_login' | 'user_logout' | 'user_login_failed'
  | 'key_saved' | 'key_deleted' | 'key_delivered_to_app'
  | 'app_purchased' | 'app_canceled' | 'app_launched'
  | 'checkout_created' | 'payment_succeeded' | 'payment_failed'
  | 'developer_signup' | 'connect_account_created' | 'payout_initiated'
  | 'app_submitted' | 'app_approved' | 'app_rejected' | 'app_suspended'
  | 'settings_changed' | 'role_changed'
  | 'rate_limit_hit' | 'auth_token_invalid' | 'suspicious_activity'

export async function auditLog(params: {
  userId: string
  action: AuditAction
  details?: Record<string, unknown>
}) {
  const safeDetails = { ...params.details }
  for (const key of Object.keys(safeDetails)) {
    if (/key|token|secret|password|card/i.test(key)) {
      safeDetails[key] = '[REDACTED]'
    }
  }

  await supabase.from('audit_logs').insert({
    user_id: params.userId,
    action: params.action,
    details: safeDetails,
  })
}
