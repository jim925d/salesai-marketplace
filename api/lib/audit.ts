// Server-side audit logging for API routes
// Writes directly to Supabase audit_logs table via service_role key

import { supabaseAdmin } from './verify-auth'

type AuditAction =
  | 'checkout_created'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'purchase_created'
  | 'purchase_canceled'
  | 'connect_account_created'
  | 'connect_account_updated'
  | 'payout_initiated'
  | 'rate_limit_hit'
  | 'auth_token_invalid'
  | 'suspicious_activity'
  | 'fraud_check_failed'
  | 'webhook_received'
  | 'webhook_error'

export async function auditLog(params: {
  userId?: string | null
  action: AuditAction
  details?: Record<string, unknown>
  ip?: string | null
}) {
  // Redact sensitive fields
  const safeDetails = { ...params.details }
  for (const key of Object.keys(safeDetails)) {
    if (/key|token|secret|password|card|cvc|cvv/i.test(key)) {
      safeDetails[key] = '[REDACTED]'
    }
  }

  try {
    await supabaseAdmin.from('audit_logs').insert({
      user_id: params.userId ?? null,
      action: params.action,
      details: safeDetails,
      ip_address: params.ip ?? null,
    })
  } catch (err) {
    // Never let audit logging failures break the request
    console.error('Audit log error:', err)
  }
}
