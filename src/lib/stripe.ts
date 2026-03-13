import { loadStripe } from '@stripe/stripe-js'
import { getAuth } from 'firebase/auth'

export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
)

/**
 * Create a checkout session and redirect to Stripe Checkout.
 * Calls /api/create-checkout with auth token.
 */
export async function createCheckout(appId: string): Promise<{ sessionUrl?: string; free?: boolean; error?: string }> {
  const user = getAuth().currentUser
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const token = await user.getIdToken(true)

  const res = await fetch('/api/create-checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ appId }),
  })

  const data = await res.json()

  if (!res.ok) {
    return { error: data.error || 'Checkout failed' }
  }

  return data
}

/**
 * Create a Stripe Connect onboarding link for developers.
 * Calls /api/create-connect-account with auth token.
 */
export async function createConnectAccount(companyName: string): Promise<{ onboardingUrl?: string; error?: string }> {
  const user = getAuth().currentUser
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const token = await user.getIdToken(true)

  const res = await fetch('/api/create-connect-account', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ companyName }),
  })

  const data = await res.json()

  if (!res.ok) {
    return { error: data.error || 'Connect account creation failed' }
  }

  return data
}
