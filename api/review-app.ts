// POST /api/review-app
// Admin approve/reject flow with email notifications
// Security pattern: method check → rate limit → auth → validate → authorize → business logic → audit

import { z } from 'zod'
import { verifyAuth, AuthError, supabaseAdmin } from './lib/verify-auth'
import { rateLimit } from './lib/rate-limit'
import { auditLog } from './lib/audit'
import { sendAppApprovedEmail, sendAppRejectedEmail } from './lib/email'

// Rate limit: 30 reviews per hour per IP
const limiter = rateLimit({ windowMs: 3_600_000, max: 30 })

export default async function handler(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null

  // 1. Method check
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { Allow: 'POST', 'Content-Type': 'application/json' },
    })
  }

  try {
    // 2. Rate limit
    const rateLimitResult = limiter.check(req)
    if (!rateLimitResult.allowed) {
      await auditLog({
        action: 'rate_limit_hit',
        details: { endpoint: 'review-app', ip },
        ip,
      })
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.retryAfter),
          'Content-Type': 'application/json',
        },
      })
    }

    // 3. Authentication
    const auth = await verifyAuth(req)

    // 4. Authorization — admin only
    if (auth.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 5. Validate input
    const body = await req.json()
    const inputSchema = z.object({
      appId: z.string().uuid(),
      action: z.enum(['approve', 'reject']),
      reason: z.string().max(500).optional(),
    })

    const input = inputSchema.parse(body)

    // 6. Reject must include reason
    if (input.action === 'reject' && !input.reason?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Rejection reason is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 7. Get app with developer info
    const { data: app, error: appError } = await supabaseAdmin
      .from('apps')
      .select(`
        id, name, slug, status, file_path,
        developer_profiles!inner(id, users!inner(email))
      `)
      .eq('id', input.appId)
      .single()

    if (appError || !app) {
      return new Response(
        JSON.stringify({ error: 'App not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 8. Verify app is in reviewable state
    const appRecord = app as unknown as {
      id: string
      name: string
      slug: string
      status: string
      file_path: string
      developer_profiles: {
        id: string
        users: { email: string }
      }
    }

    if (!['pending_review', 'in_review'].includes(appRecord.status)) {
      return new Response(
        JSON.stringify({ error: 'App is not in a reviewable state' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const developerEmail = appRecord.developer_profiles.users.email

    // 9. Process review action
    if (input.action === 'approve') {
      // Update app status to approved
      const { error: updateError } = await supabaseAdmin
        .from('apps')
        .update({
          status: 'approved',
          rejection_reason: null,
        })
        .eq('id', input.appId)

      if (updateError) {
        console.error('Failed to approve app:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update app status' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Update the latest app_version status
      await supabaseAdmin
        .from('app_versions')
        .update({ status: 'approved' })
        .eq('app_id', input.appId)
        .eq('status', 'pending_review')

      // Send approval email (non-blocking)
      sendAppApprovedEmail({
        to: developerEmail,
        appName: appRecord.name,
        slug: appRecord.slug,
      }).catch((err) => console.error('Approval email error:', err))
    } else {
      // Reject
      const { error: updateError } = await supabaseAdmin
        .from('apps')
        .update({
          status: 'rejected',
          rejection_reason: input.reason!,
        })
        .eq('id', input.appId)

      if (updateError) {
        console.error('Failed to reject app:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update app status' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Update the latest app_version status
      await supabaseAdmin
        .from('app_versions')
        .update({ status: 'rejected' })
        .eq('app_id', input.appId)
        .eq('status', 'pending_review')

      // Send rejection email (non-blocking)
      sendAppRejectedEmail({
        to: developerEmail,
        appName: appRecord.name,
        reason: input.reason!,
      }).catch((err) => console.error('Rejection email error:', err))
    }

    // 10. Audit log
    await auditLog({
      userId: auth.supabaseId,
      action: input.action === 'approve' ? 'app_approved' : 'app_rejected',
      details: {
        appId: input.appId,
        appName: appRecord.name,
        action: input.action,
        reason: input.reason || null,
      },
      ip,
    })

    // 11. Return result
    return new Response(
      JSON.stringify({
        appId: input.appId,
        status: input.action === 'approve' ? 'approved' : 'rejected',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Invalid input',
          details: error.issues.map((e: { message: string }) => e.message),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    if (error instanceof AuthError) {
      await auditLog({
        action: 'auth_token_invalid',
        details: { endpoint: 'review-app' },
        ip,
      })
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: error.status, headers: { 'Content-Type': 'application/json' } }
      )
    }
    console.error('Review app error:', error)
    return new Response(
      JSON.stringify({ error: 'Something went wrong' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
