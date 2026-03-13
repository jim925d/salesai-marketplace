// POST /api/create-connect-account
// Creates a Stripe Connect onboarding link for developer accounts
// Security pattern: method check → rate limit → auth → validate → authorize → business logic → audit

import Stripe from 'stripe'
import { z } from 'zod'
import { verifyAuth, AuthError, supabaseAdmin } from './lib/verify-auth'
import { rateLimit } from './lib/rate-limit'
import { auditLog } from './lib/audit'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// 1. Input validation schema
const ConnectSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(200),
})

// 2. Rate limit: 5 connect attempts per 10 minutes per IP
const limiter = rateLimit({ windowMs: 600_000, max: 5 })

export default async function handler(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null

  // 3. Method check
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { Allow: 'POST', 'Content-Type': 'application/json' },
    })
  }

  try {
    // 4. Rate limit check
    const rateLimitResult = limiter.check(req)
    if (!rateLimitResult.allowed) {
      await auditLog({
        action: 'rate_limit_hit',
        details: { endpoint: 'create-connect-account', ip },
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

    // 5. Authentication
    const auth = await verifyAuth(req)

    // 6. Authorization — only developers can create Connect accounts
    if (auth.role !== 'developer') {
      return new Response(
        JSON.stringify({ error: 'Only developer accounts can connect with Stripe' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 7. Input validation
    const body = await req.json()
    const input = ConnectSchema.parse(body)

    // 8. Check if developer already has a Connect account
    const { data: devProfile } = await supabaseAdmin
      .from('developer_profiles')
      .select('id, stripe_connect_id, stripe_onboarded')
      .eq('user_id', auth.supabaseId)
      .single()

    if (!devProfile) {
      return new Response(
        JSON.stringify({ error: 'Developer profile not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // If already onboarded, return early
    if (devProfile.stripe_connect_id && devProfile.stripe_onboarded) {
      return new Response(
        JSON.stringify({ error: 'Stripe account already connected', alreadyOnboarded: true }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let connectAccountId = devProfile.stripe_connect_id

    // 9. Create Stripe Connect account if one doesn't exist
    if (!connectAccountId) {
      const account = await stripe.accounts.create({
        type: 'standard',
        email: auth.email,
        business_profile: {
          name: input.companyName,
          product_description: 'AI sales tool developer on SalesAI Marketplace',
        },
        metadata: {
          supabase_user_id: auth.supabaseId,
          developer_profile_id: devProfile.id,
        },
      })

      connectAccountId = account.id

      // Store Connect account ID in developer_profiles
      await supabaseAdmin
        .from('developer_profiles')
        .update({ stripe_connect_id: connectAccountId })
        .eq('id', devProfile.id)
    }

    // 10. Create Account Link for onboarding/re-onboarding
    const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173'

    const accountLink = await stripe.accountLinks.create({
      account: connectAccountId,
      refresh_url: `${appUrl}/dev?stripe=refresh`,
      return_url: `${appUrl}/dev?stripe=success`,
      type: 'account_onboarding',
    })

    // 11. Audit log
    await auditLog({
      userId: auth.supabaseId,
      action: 'connect_account_created',
      details: {
        connectAccountId,
        companyName: input.companyName,
        isNewAccount: !devProfile.stripe_connect_id,
      },
      ip,
    })

    // 12. Return onboarding URL
    return new Response(
      JSON.stringify({ onboardingUrl: accountLink.url }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: error.issues.map((e: { message: string }) => e.message) }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    if (error instanceof AuthError) {
      await auditLog({ action: 'auth_token_invalid', details: { endpoint: 'create-connect-account' }, ip })
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: error.status, headers: { 'Content-Type': 'application/json' } }
      )
    }
    console.error('Connect account error:', error)
    return new Response(
      JSON.stringify({ error: 'Something went wrong' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
