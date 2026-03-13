// POST /api/create-checkout
// Creates a Stripe Checkout session for app purchase
// Security pattern: method check → rate limit → auth → validate → authorize → business logic → audit

import Stripe from 'stripe'
import { z } from 'zod'
import { verifyAuth, AuthError, supabaseAdmin } from './lib/verify-auth'
import { rateLimit } from './lib/rate-limit'
import { auditLog } from './lib/audit'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// 1. Input validation schema
const CheckoutSchema = z.object({
  appId: z.string().uuid('Invalid app ID'),
})

// 2. Rate limit: 10 checkout attempts per minute per IP
const limiter = rateLimit({ windowMs: 60_000, max: 10 })

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
        details: { endpoint: 'create-checkout', ip },
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

    // 6. Input validation
    const body = await req.json()
    const input = CheckoutSchema.parse(body)

    // 7. Fraud prevention checks
    await validatePurchase(auth.supabaseId, input.appId)

    // 8. Fetch app with developer's Stripe Connect info
    const { data: app, error: appError } = await supabaseAdmin
      .from('apps')
      .select(`
        id, name, slug, price_cents, stripe_price_id, status,
        developer_id
      `)
      .eq('id', input.appId)
      .single()

    if (appError || !app) {
      return new Response(JSON.stringify({ error: 'App not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (app.status !== 'approved') {
      return new Response(JSON.stringify({ error: 'App is not available' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Free apps — create purchase directly without Stripe
    if (app.price_cents === 0) {
      await supabaseAdmin.from('purchases').insert({
        user_id: auth.supabaseId,
        app_id: input.appId,
        status: 'active',
      })

      // Increment install count
      const { data: currentApp } = await supabaseAdmin
        .from('apps')
        .select('total_installs')
        .eq('id', input.appId)
        .single()

      if (currentApp) {
        await supabaseAdmin
          .from('apps')
          .update({ total_installs: currentApp.total_installs + 1 })
          .eq('id', input.appId)
      }

      await auditLog({
        userId: auth.supabaseId,
        action: 'purchase_created',
        details: { appId: input.appId, appName: app.name, free: true },
        ip,
      })

      return new Response(
        JSON.stringify({ success: true, free: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 9. Get developer's Stripe Connect ID for payment splitting
    const { data: devProfile } = await supabaseAdmin
      .from('developer_profiles')
      .select('stripe_connect_id, stripe_onboarded')
      .eq('id', app.developer_id)
      .single()

    if (!devProfile?.stripe_connect_id || !devProfile.stripe_onboarded) {
      return new Response(
        JSON.stringify({ error: 'Developer has not completed payment setup' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 10. Create Stripe Checkout Session with 80/20 split
    const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173'

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [
        {
          price: app.stripe_price_id!,
          quantity: 1,
        },
      ],
      subscription_data: {
        application_fee_percent: 20, // Platform keeps 20%, developer gets 80%
        transfer_data: {
          destination: devProfile.stripe_connect_id,
        },
        trial_period_days: 14,
        metadata: {
          app_id: input.appId,
          app_name: app.name,
          buyer_supabase_id: auth.supabaseId,
        },
      },
      metadata: {
        app_id: input.appId,
        buyer_supabase_id: auth.supabaseId,
        developer_id: app.developer_id,
      },
      success_url: `${appUrl}/dashboard?checkout=success&app=${app.slug}`,
      cancel_url: `${appUrl}/store?checkout=canceled`,
      customer_email: auth.email,
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    // 11. Audit log
    await auditLog({
      userId: auth.supabaseId,
      action: 'checkout_created',
      details: {
        appId: input.appId,
        appName: app.name,
        priceCents: app.price_cents,
        stripeSessionId: session.id,
      },
      ip,
    })

    // 12. Return session URL
    return new Response(
      JSON.stringify({ sessionUrl: session.url }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    // Safe error responses — never leak internals
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: error.issues.map((e: { message: string }) => e.message) }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    if (error instanceof AuthError) {
      await auditLog({ action: 'auth_token_invalid', details: { endpoint: 'create-checkout' }, ip })
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: error.status, headers: { 'Content-Type': 'application/json' } }
      )
    }
    if (error instanceof FraudError) {
      await auditLog({
        action: 'fraud_check_failed',
        details: { endpoint: 'create-checkout', reason: error.message },
        ip,
      })
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    console.error('Checkout error:', error)
    return new Response(
      JSON.stringify({ error: 'Something went wrong' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// ── Fraud prevention checks ──

class FraudError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FraudError'
  }
}

async function validatePurchase(userId: string, appId: string): Promise<void> {
  // 1. Check for existing active purchase (no duplicate purchases)
  const { data: existing } = await supabaseAdmin
    .from('purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('app_id', appId)
    .in('status', ['active', 'trialing'])
    .limit(1)

  if (existing && existing.length > 0) {
    throw new FraudError('You already own this app')
  }

  // 2. App must be approved and published
  const { data: app } = await supabaseAdmin
    .from('apps')
    .select('status')
    .eq('id', appId)
    .single()

  if (!app || app.status !== 'approved') {
    throw new FraudError('App is not available for purchase')
  }

  // 3. Rate check — max 5 purchases per hour per user (anti-fraud)
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString()
  const { data: recentPurchases } = await supabaseAdmin
    .from('purchases')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', oneHourAgo)

  if (recentPurchases && recentPurchases.length >= 5) {
    throw new FraudError('Purchase rate limit exceeded. Try again later.')
  }
}
