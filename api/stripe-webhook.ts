// POST /api/stripe-webhook
// Handles Stripe webhook events with signature verification
// Events: checkout.session.completed, invoice.payment_succeeded,
//         customer.subscription.deleted, account.updated

import Stripe from 'stripe'
import { supabaseAdmin } from './lib/verify-auth'
import { auditLog } from './lib/audit'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export const config = {
  // Vercel: don't parse body — we need the raw string for signature verification
  api: { bodyParser: false },
}

export default async function handler(req: Request) {
  // 1. Method check
  if (req.method !== 'POST') {
    return new Response('', { status: 405 })
  }

  // 2. Read raw body for signature verification
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 3. Verify webhook signature — proves request came from Stripe
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null

  // 4. Log webhook receipt
  await auditLog({
    action: 'webhook_received',
    details: { eventType: event.type, eventId: event.id },
    ip,
  })

  // 5. Process event — always return 200 to Stripe to prevent retries
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object as Stripe.Subscription)
        break

      case 'account.updated':
        await handleConnectAccountUpdate(event.data.object as Stripe.Account)
        break

      default:
        // Unhandled event type — log but don't error
        console.log(`Unhandled webhook event: ${event.type}`)
    }
  } catch (err) {
    console.error(`Webhook processing error for ${event.type}:`, err)
    await auditLog({
      action: 'webhook_error',
      details: { eventType: event.type, eventId: event.id, error: String(err) },
      ip,
    })
    // Still return 200 — log the error, fix later, don't block Stripe
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

// ── Event Handlers ──

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const appId = session.metadata?.app_id
  const buyerSupabaseId = session.metadata?.buyer_supabase_id
  const developerId = session.metadata?.developer_id

  if (!appId || !buyerSupabaseId) {
    console.error('Missing metadata on checkout session:', session.id)
    return
  }

  // Create purchase record
  const { error: purchaseError } = await supabaseAdmin.from('purchases').upsert(
    {
      user_id: buyerSupabaseId,
      app_id: appId,
      stripe_subscription_id: session.subscription as string,
      stripe_customer_id: session.customer as string,
      status: 'trialing', // 14-day trial
      trial_ends_at: new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000
      ).toISOString(),
    },
    { onConflict: 'user_id,app_id' }
  )

  if (purchaseError) {
    console.error('Failed to create purchase:', purchaseError)
    throw purchaseError
  }

  // Increment app install count
  const { data: app } = await supabaseAdmin
    .from('apps')
    .select('total_installs')
    .eq('id', appId)
    .single()

  if (app) {
    await supabaseAdmin
      .from('apps')
      .update({ total_installs: app.total_installs + 1 })
      .eq('id', appId)
  }

  await auditLog({
    userId: buyerSupabaseId,
    action: 'purchase_created',
    details: {
      appId,
      developerId,
      subscriptionId: session.subscription,
      trial: true,
    },
  })
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Stripe types vary by version — safely extract subscription ID
  const invoiceAny = invoice as unknown as Record<string, unknown>
  const sub = invoiceAny.subscription
  const subscriptionId =
    typeof sub === 'string' ? sub : (sub as { id?: string })?.id ?? null

  if (!subscriptionId) return

  // Find the purchase by subscription ID
  const { data: purchase } = await supabaseAdmin
    .from('purchases')
    .select('id, user_id, app_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (!purchase) return

  // Update purchase status to active (trial ended)
  await supabaseAdmin
    .from('purchases')
    .update({
      status: 'active',
      current_period_end: invoice.lines?.data?.[0]?.period?.end
        ? new Date(invoice.lines.data[0].period.end * 1000).toISOString()
        : null,
    })
    .eq('id', purchase.id)

  // Get app details for developer info
  const { data: app } = await supabaseAdmin
    .from('apps')
    .select('developer_id, price_cents')
    .eq('id', purchase.app_id)
    .single()

  if (app) {
    const amountCents = invoice.amount_paid || app.price_cents
    const platformFeeCents = Math.round(amountCents * 0.2) // 20% platform fee
    const developerPayoutCents = amountCents - platformFeeCents // 80% to developer

    // Create transaction record
    await supabaseAdmin.from('transactions').insert({
      purchase_id: purchase.id,
      app_id: purchase.app_id,
      buyer_id: purchase.user_id,
      developer_id: app.developer_id,
      amount_cents: amountCents,
      platform_fee_cents: platformFeeCents,
      developer_payout_cents: developerPayoutCents,
      stripe_payment_intent_id:
        typeof invoiceAny.payment_intent === 'string'
          ? invoiceAny.payment_intent
          : (invoiceAny.payment_intent as { id?: string })?.id || null,
      status: 'completed',
    })

    // Update app revenue total
    const { data: currentApp } = await supabaseAdmin
      .from('apps')
      .select('total_revenue_cents')
      .eq('id', purchase.app_id)
      .single()

    if (currentApp) {
      await supabaseAdmin
        .from('apps')
        .update({
          total_revenue_cents: currentApp.total_revenue_cents + amountCents,
        })
        .eq('id', purchase.app_id)
    }
  }

  await auditLog({
    userId: purchase.user_id,
    action: 'payment_succeeded',
    details: {
      purchaseId: purchase.id,
      appId: purchase.app_id,
      amountCents: invoice.amount_paid,
      subscriptionId,
    },
  })
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const { data: purchase } = await supabaseAdmin
    .from('purchases')
    .select('id, user_id, app_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (!purchase) return

  await supabaseAdmin
    .from('purchases')
    .update({ status: 'canceled' })
    .eq('id', purchase.id)

  await auditLog({
    userId: purchase.user_id,
    action: 'purchase_canceled',
    details: {
      purchaseId: purchase.id,
      appId: purchase.app_id,
      subscriptionId: subscription.id,
    },
  })
}

async function handleConnectAccountUpdate(account: Stripe.Account) {
  // Update developer profile when Stripe Connect onboarding completes
  const isOnboarded =
    account.charges_enabled && account.payouts_enabled && account.details_submitted

  const { error } = await supabaseAdmin
    .from('developer_profiles')
    .update({ stripe_onboarded: isOnboarded })
    .eq('stripe_connect_id', account.id)

  if (error) {
    console.error('Failed to update developer onboarding status:', error)
  }

  await auditLog({
    action: 'connect_account_updated',
    details: {
      connectAccountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      onboarded: isOnboarded,
    },
  })
}
