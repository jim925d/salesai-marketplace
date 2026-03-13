// Transactional email via Resend
// Used for: welcome, purchase confirmation, app approval, app rejection, payout notification

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'SalesAI Marketplace <notifications@salesai.app>'

interface EmailResult {
  success: boolean
  error?: string
}

// ── Welcome ──

export async function sendWelcomeEmail(params: {
  to: string
  name: string
}): Promise<EmailResult> {
  return send({
    to: params.to,
    subject: 'Welcome to SalesAI Marketplace',
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #e6edf3;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">Welcome, ${esc(params.name)}!</h1>
        <p style="color: #8b949e; line-height: 1.6;">
          Your SalesAI Marketplace account is ready. Browse AI-powered sales tools,
          install them to your dashboard, and start closing more deals.
        </p>
        <a href="${baseUrl()}/store"
           style="display: inline-block; margin-top: 20px; padding: 10px 24px; background: #58a6ff; color: #0d1117; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Browse the Store
        </a>
        <p style="color: #484f58; font-size: 12px; margin-top: 32px;">
          SalesAI Marketplace &middot; AI tools for modern sales teams
        </p>
      </div>
    `,
  })
}

// ── Purchase Confirmation ──

export async function sendPurchaseConfirmation(params: {
  to: string
  appName: string
  priceCents: number
}): Promise<EmailResult> {
  const price =
    params.priceCents === 0
      ? 'Free'
      : `$${(params.priceCents / 100).toFixed(2)}/mo`

  return send({
    to: params.to,
    subject: `Purchase confirmed: ${params.appName}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #e6edf3;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">Purchase Confirmed</h1>
        <p style="color: #8b949e; line-height: 1.6;">
          You've successfully purchased <strong>${esc(params.appName)}</strong> (${price}).
          It's now available on your dashboard.
        </p>
        <a href="${baseUrl()}/dashboard"
           style="display: inline-block; margin-top: 20px; padding: 10px 24px; background: #58a6ff; color: #0d1117; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Open Dashboard
        </a>
        <p style="color: #484f58; font-size: 12px; margin-top: 32px;">
          SalesAI Marketplace &middot; AI tools for modern sales teams
        </p>
      </div>
    `,
  })
}

// ── App Approved ──

export async function sendAppApprovedEmail(params: {
  to: string
  appName: string
  slug: string
}): Promise<EmailResult> {
  return send({
    to: params.to,
    subject: `Your app "${params.appName}" has been approved!`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #e6edf3;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">App Approved</h1>
        <p style="color: #8b949e; line-height: 1.6;">
          Great news! <strong>${esc(params.appName)}</strong> has passed review
          and is now live on the SalesAI Marketplace.
        </p>
        <a href="${baseUrl()}/store"
           style="display: inline-block; margin-top: 20px; padding: 10px 24px; background: #3fb950; color: #0d1117; text-decoration: none; border-radius: 8px; font-weight: bold;">
          View in Store
        </a>
        <p style="color: #484f58; font-size: 12px; margin-top: 32px;">
          SalesAI Marketplace &middot; AI tools for modern sales teams
        </p>
      </div>
    `,
  })
}

// ── App Rejected ──

export async function sendAppRejectedEmail(params: {
  to: string
  appName: string
  reason: string
}): Promise<EmailResult> {
  return send({
    to: params.to,
    subject: `Your app "${params.appName}" requires changes`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #e6edf3;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">App Review Update</h1>
        <p style="color: #8b949e; line-height: 1.6;">
          <strong>${esc(params.appName)}</strong> was not approved. Here's the feedback:
        </p>
        <div style="margin: 16px 0; padding: 12px 16px; background: rgba(248,81,73,0.1); border-left: 3px solid #f85149; border-radius: 4px;">
          <p style="color: #e6edf3; margin: 0;">${esc(params.reason)}</p>
        </div>
        <p style="color: #8b949e; line-height: 1.6;">
          Please address the issues and resubmit your app through the Developer Portal.
        </p>
        <a href="${baseUrl()}/dev"
           style="display: inline-block; margin-top: 20px; padding: 10px 24px; background: #58a6ff; color: #0d1117; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Developer Portal
        </a>
        <p style="color: #484f58; font-size: 12px; margin-top: 32px;">
          SalesAI Marketplace &middot; AI tools for modern sales teams
        </p>
      </div>
    `,
  })
}

// ── Payout Notification ──

export async function sendPayoutNotification(params: {
  to: string
  amountCents: number
  periodStart: string
  periodEnd: string
}): Promise<EmailResult> {
  const amount = `$${(params.amountCents / 100).toFixed(2)}`

  return send({
    to: params.to,
    subject: `Payout of ${amount} initiated`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #e6edf3;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">Payout Initiated</h1>
        <p style="color: #8b949e; line-height: 1.6;">
          A payout of <strong>${amount}</strong> for the period
          ${params.periodStart} &ndash; ${params.periodEnd} has been initiated
          to your connected Stripe account.
        </p>
        <p style="color: #8b949e; line-height: 1.6;">
          Funds typically arrive within 2-3 business days.
        </p>
        <a href="${baseUrl()}/dev"
           style="display: inline-block; margin-top: 20px; padding: 10px 24px; background: #3fb950; color: #0d1117; text-decoration: none; border-radius: 8px; font-weight: bold;">
          View Payouts
        </a>
        <p style="color: #484f58; font-size: 12px; margin-top: 32px;">
          SalesAI Marketplace &middot; AI tools for modern sales teams
        </p>
      </div>
    `,
  })
}

// ── Helpers ──

function baseUrl(): string {
  return process.env.VITE_APP_URL || 'https://salesai.app'
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function send(params: {
  to: string
  subject: string
  html: string
}): Promise<EmailResult> {
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    // Never let email failures break the request
    console.error('Email error:', err)
    return { success: false, error: 'Failed to send email' }
  }
}
