# SalesAI Marketplace — Security Audit & Hardening Specification

## CURRENT STATE ASSESSMENT

### What's Already Strong ✅
1. **API keys never touch the server** — AES-256-GCM client-side encryption via Web Crypto API is best-in-class. Keys encrypted at rest, decrypted only in memory for iframe delivery.
2. **Iframe sandboxing** — `sandbox="allow-scripts allow-same-origin"` blocks navigation, popups, forms, modals. Separate CSP for /apps/ path.
3. **Stripe handles payment splitting** — We never touch raw card numbers. Stripe's `application_fee_percent` on Connect does the 80/20 split server-side.
4. **Row Level Security on Supabase** — Database-level enforcement, not just application-level.
5. **Security headers specified** — HSTS, CSP, X-Frame-Options, Referrer-Policy.

### What Has Gaps ⚠️
1. No server-side request validation beyond Stripe webhook signature
2. No rate limiting on serverless API routes
3. No CSRF protection on state-changing API calls
4. Supabase anon key exposed to frontend (by design, but needs RLS hardening)
5. No input validation schema on API routes
6. No audit trail for payment-related actions
7. No fraud detection on purchases
8. Developer file uploads need deeper sandboxing
9. No penetration testing plan
10. Session management relies entirely on Firebase — no server-side session layer

---

## SECURITY ARCHITECTURE (HARDENED)

### Layer 1: Network Edge (Cloudflare)

```
Internet → Cloudflare WAF → Vercel Edge → Application
```

**Cloudflare Configuration:**
- WAF managed rules: OWASP Core Ruleset enabled
- Rate limiting rules:
  - `/api/create-checkout`: 10 requests/minute per IP
  - `/api/create-connect-account`: 3 requests/minute per IP
  - `/api/submit-app`: 5 requests/hour per IP
  - `/api/stripe-webhook`: exempt (Stripe's IPs whitelisted)
  - Global: 100 requests/minute per IP
- Bot protection: Challenge mode for suspicious traffic
- DDoS: automatic L3/L4/L7 mitigation
- SSL: Full (Strict) — origin cert pinned
- Always HTTPS: enabled
- Minimum TLS: 1.2
- Geographic restrictions: optional (block high-fraud regions if needed)

### Layer 2: Transport Security (Vercel)

**vercel.json security headers (updated and hardened):**

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
        },
        {
          "key": "X-DNS-Prefetch-Control",
          "value": "off"
        },
        {
          "key": "X-Permitted-Cross-Domain-Policies",
          "value": "none"
        },
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        },
        {
          "key": "Cross-Origin-Resource-Policy",
          "value": "same-origin"
        },
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "credentialless"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://api.stripe.com https://api.resend.com; img-src 'self' data: https:; frame-src 'self' https://js.stripe.com https://hooks.stripe.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self' https://checkout.stripe.com; upgrade-insecure-requests"
        }
      ]
    },
    {
      "source": "/apps/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src https://api.openai.com https://api.anthropic.com; img-src 'self' data:; frame-ancestors 'self'; base-uri 'none'; form-action 'none'"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        }
      ]
    }
  ]
}
```

### Layer 3: Authentication (Firebase + Custom Middleware)

**Firebase Auth hardening:**
```typescript
// lib/firebase.ts

// Force token refresh on critical actions
async function getVerifiedToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  // Force refresh — don't use cached token for payment operations
  return user.getIdToken(true);
}

// Session management
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
let activityTimer: NodeJS.Timeout;

function resetActivityTimer() {
  clearTimeout(activityTimer);
  activityTimer = setTimeout(() => {
    auth.signOut();
    // Clear all in-memory state
    useAuthStore.getState().logout();
    // Redirect to sign-in
    window.location.href = '/';
  }, SESSION_TIMEOUT_MS);
}

// Track user activity
['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
  document.addEventListener(event, resetActivityTimer, { passive: true });
});
```

**Server-side token verification (every API route):**
```typescript
// lib/verify-auth.ts — used in every /api/ function

import { getAuth } from 'firebase-admin/auth';
import { initializeApp, cert } from 'firebase-admin/app';

// Initialize Firebase Admin (once)
const app = initializeApp({
  credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY!))
});

export async function verifyAuth(req: Request): Promise<{
  uid: string;
  email: string;
  role: string;
}> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing authentication token');
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // Verify token with Firebase Admin — checks signature, expiry, issuer
    const decoded = await getAuth(app).verifyIdToken(token, true); // true = check revocation

    // Get user role from Supabase
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('firebase_uid', decoded.uid)
      .single();

    return {
      uid: decoded.uid,
      email: decoded.email || '',
      role: user?.role || 'buyer'
    };
  } catch (error) {
    throw new Error('Invalid or expired authentication token');
  }
}
```

### Layer 4: API Route Security

**Every API route MUST implement these checks:**

```typescript
// Example: /api/create-checkout.ts

import { verifyAuth } from '../lib/verify-auth';
import { rateLimit } from '../lib/rate-limit';
import { validateInput } from '../lib/validate';
import { auditLog } from '../lib/audit';
import { z } from 'zod';

// 1. Input validation schema
const CheckoutSchema = z.object({
  appId: z.string().uuid(),
});

// 2. Rate limit config
const limiter = rateLimit({
  windowMs: 60 * 1000,    // 1 minute window
  max: 10,                  // max 10 requests per window
  keyGenerator: (req) => req.headers.get('x-forwarded-for') || 'unknown',
});

export default async function handler(req: Request) {
  // 3. Method check
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // 4. Rate limit check
    const rateLimitResult = await limiter.check(req);
    if (!rateLimitResult.allowed) {
      return new Response('Too many requests', {
        status: 429,
        headers: { 'Retry-After': String(rateLimitResult.retryAfter) }
      });
    }

    // 5. Authentication
    const auth = await verifyAuth(req);

    // 6. Input validation
    const body = await req.json();
    const input = CheckoutSchema.parse(body);

    // 7. Authorization check (user can only buy for themselves)
    // ... business logic ...

    // 8. Audit log
    await auditLog({
      userId: auth.uid,
      action: 'checkout_created',
      details: { appId: input.appId },
      ip: req.headers.get('x-forwarded-for')
    });

    // 9. Business logic with error handling
    // ...

  } catch (error) {
    // 10. Safe error response (never leak internals)
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
    }
    console.error('Checkout error:', error); // Server log only
    return new Response(JSON.stringify({ error: 'Something went wrong' }), { status: 500 });
  }
}
```

**Server-side rate limiter (Vercel KV or Upstash Redis):**
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export function rateLimit(config: { windowMs: number; max: number; keyGenerator: (req: Request) => string }) {
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.max, `${config.windowMs}ms`),
    analytics: true,
  });

  return {
    async check(req: Request) {
      const key = config.keyGenerator(req);
      const { success, remaining, reset } = await limiter.limit(key);
      return {
        allowed: success,
        remaining,
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      };
    }
  };
}
```

### Layer 5: Stripe Payment Security

**Webhook verification (critical — this is where money moves):**
```typescript
// /api/stripe-webhook.ts

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('', { status: 405 });

  const body = await req.text(); // Raw body — do NOT parse as JSON first
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature — this proves the request came from Stripe
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  // Process event in try/catch — always return 200 to Stripe to prevent retries
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object);
        break;
      case 'account.updated':
        await handleConnectAccountUpdate(event.data.object);
        break;
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    // Still return 200 — log the error, fix later, don't block Stripe
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
```

**Stripe security checklist:**
- [ ] Webhook signature verification on EVERY webhook handler
- [ ] STRIPE_SECRET_KEY is server-only (never in VITE_ prefixed vars)
- [ ] STRIPE_WEBHOOK_SECRET is unique per endpoint
- [ ] Checkout sessions include `client_reference_id` matching the authenticated user
- [ ] After checkout, verify the session belongs to the requesting user before granting access
- [ ] Use Stripe's `idempotency_key` on creation calls to prevent duplicate charges
- [ ] Enable Stripe Radar for fraud detection (built-in, just needs to be turned on)
- [ ] Restrict Stripe API key permissions (use restricted keys for specific operations)
- [ ] Monitor Stripe webhook delivery failures (set up email alerts)
- [ ] Handle `payment_intent.payment_failed` to flag fraud attempts

**Fraud prevention on purchases:**
```typescript
// Before creating a checkout session, check:

async function validatePurchase(userId: string, appId: string) {
  // 1. User exists and is verified
  const user = await getUser(userId);
  if (!user || !user.email_verified) throw new Error('Account not verified');

  // 2. Not already purchased
  const existing = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('app_id', appId)
    .eq('status', 'active')
    .single();
  if (existing.data) throw new Error('Already purchased');

  // 3. App is approved and published
  const app = await supabase
    .from('apps')
    .select('status, stripe_price_id')
    .eq('id', appId)
    .single();
  if (app.data?.status !== 'approved') throw new Error('App not available');

  // 4. Rate check — max 5 purchases per hour per user (anti-fraud)
  const recentPurchases = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 3600000).toISOString());
  if ((recentPurchases.data?.length || 0) >= 5) throw new Error('Purchase limit reached');

  return app.data;
}
```

### Layer 6: Database Security (Supabase)

**RLS hardening — tighten every policy:**
```sql
-- CRITICAL: Ensure RLS is enabled on ALL tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users: read own, update own (but NOT role field)
CREATE POLICY "users_select_own" ON users FOR SELECT USING (firebase_uid = auth.uid());
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (firebase_uid = auth.uid())
  WITH CHECK (firebase_uid = auth.uid() AND role = (SELECT role FROM users WHERE firebase_uid = auth.uid()));
  -- ^^ Prevents users from escalating their own role

-- Apps: anyone reads approved, devs manage their own
CREATE POLICY "apps_public_read" ON apps FOR SELECT USING (status = 'approved');
CREATE POLICY "apps_dev_read_own" ON apps FOR SELECT USING (
  developer_id IN (SELECT id FROM developer_profiles WHERE user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()))
);
CREATE POLICY "apps_dev_insert" ON apps FOR INSERT WITH CHECK (
  developer_id IN (SELECT id FROM developer_profiles WHERE user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()))
);
CREATE POLICY "apps_dev_update" ON apps FOR UPDATE USING (
  developer_id IN (SELECT id FROM developer_profiles WHERE user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()))
  AND status NOT IN ('approved', 'suspended')  -- Can't modify live apps without re-review
);

-- Purchases: ONLY via server (service_role key), users can read own
CREATE POLICY "purchases_read_own" ON purchases FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid())
);
-- No INSERT/UPDATE/DELETE policy for anon key — purchases created server-side only

-- Transactions: read-only for involved parties
CREATE POLICY "transactions_read" ON transactions FOR SELECT USING (
  buyer_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid())
  OR developer_id IN (SELECT id FROM developer_profiles WHERE user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()))
);

-- Audit logs: insert only (no read via client — admin reads via service key)
CREATE POLICY "audit_insert" ON audit_logs FOR INSERT WITH CHECK (true);
-- No SELECT policy — audit logs are server/admin read only

-- Admin override (careful — only for admin-specific tables)
CREATE POLICY "admin_full_apps" ON apps FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE firebase_uid = auth.uid() AND role = 'admin')
);
```

**Supabase additional security:**
- Enable **Point-in-Time Recovery** for the database (paid plan)
- Set up **database backups** — daily automated + before any migration
- Use **separate Supabase projects** for staging and production
- The `SUPABASE_SERVICE_ROLE_KEY` must NEVER be in frontend code — only in /api/ serverless functions
- Enable **Supabase Auth** logging for security audit trail
- Set up **database connection pooling** to prevent connection exhaustion attacks

### Layer 7: File Upload Security (App Submissions)

**The app submission endpoint is the highest-risk surface.** A developer uploads an HTML file that gets served to other users. This is essentially a stored XSS vector if not handled properly.

```typescript
// /api/submit-app.ts — hardened file upload

const ALLOWED_EXTENSIONS = ['.html'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const FORBIDDEN_PATTERNS = [
  /\beval\s*\(/gi,
  /new\s+Function\s*\(/gi,
  /document\.cookie/gi,
  /document\.domain/gi,
  /window\.opener/gi,
  /window\.top(?!\.postMessage)/gi,     // allow postMessage to parent
  /parent\.document/gi,
  /top\.document/gi,
  /document\.write/gi,
  /innerHTML\s*=/gi,                     // only flag if not DOMPurify-wrapped
  /\.insertAdjacentHTML/gi,
  /crypto\.subtle/gi,                    // suspicious in a sales tool
  /indexedDB/gi,                         // no need for IndexedDB
  /WebSocket/gi,                         // no websockets
  /navigator\.sendBeacon/gi,             // data exfil
  /navigator\.credentials/gi,            // credential theft
  /window\.open\s*\(/gi,                 // no popups
];

const FORBIDDEN_DOMAINS = [
  /google-analytics\.com/,
  /googletagmanager\.com/,
  /facebook\.net/,
  /fbq\(/,
  /hotjar\.com/,
  /mixpanel\.com/,
  /segment\.com/,
  /amplitude\.com/,
  /intercom\.io/,
  /crisp\.chat/,
];

const ALLOWED_CDN_DOMAINS = [
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

const ALLOWED_API_DOMAINS = [
  'api.openai.com',
  'api.anthropic.com',
];

async function scanHTMLFile(content: string): Promise<SecurityScanResult> {
  const checks: SecurityCheck[] = [];
  let score = 100;

  // Check 1: Forbidden JavaScript patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      score -= 25; // Critical
      checks.push({
        name: `Forbidden pattern: ${pattern.source.slice(0, 40)}`,
        passed: false,
        severity: 'critical',
        details: `Found ${matches.length} occurrence(s)`
      });
    }
  }

  // Check 2: External script sources
  const scriptSrcRegex = /<script[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = scriptSrcRegex.exec(content)) !== null) {
    const src = match[1];
    const isAllowed = ALLOWED_CDN_DOMAINS.some(d => src.includes(d));
    if (!isAllowed) {
      score -= 20; // High
      checks.push({
        name: 'External script from non-approved domain',
        passed: false,
        severity: 'high',
        details: `Found: ${src}`
      });
    }
  }

  // Check 3: Fetch/XHR to unknown domains
  const fetchRegex = /fetch\s*\(\s*['"`]([^'"`]+)['"`]/gi;
  while ((match = fetchRegex.exec(content)) !== null) {
    const url = match[1];
    const isAllowed = ALLOWED_API_DOMAINS.some(d => url.includes(d));
    if (!isAllowed && !url.startsWith('/') && !url.startsWith('#')) {
      score -= 20;
      checks.push({
        name: 'Network request to non-approved domain',
        passed: false,
        severity: 'high',
        details: `Found: ${url}`
      });
    }
  }

  // Check 4: Tracking / analytics
  for (const pattern of FORBIDDEN_DOMAINS) {
    if (pattern.test(content)) {
      score -= 15;
      checks.push({
        name: 'Tracking or analytics detected',
        passed: false,
        severity: 'medium',
        details: `Pattern: ${pattern.source}`
      });
    }
  }

  // Check 5: Required elements exist
  if (!/id=["']provider["']/i.test(content)) {
    score -= 15;
    checks.push({ name: 'Missing provider selector (id="provider")', passed: false, severity: 'high', details: 'Required for marketplace integration' });
  }
  if (!/id=["']apiKey["']/i.test(content)) {
    score -= 15;
    checks.push({ name: 'Missing API key input (id="apiKey")', passed: false, severity: 'high', details: 'Required for marketplace integration' });
  }

  // Check 6: PostMessage origin validation
  if (/addEventListener.*message/i.test(content) && !/e\.origin|event\.origin|\.origin\s*[!=]/i.test(content)) {
    score -= 10;
    checks.push({ name: 'PostMessage listener without origin check', passed: false, severity: 'medium', details: 'Message event listeners should validate e.origin' });
  }

  // Check 7: File size sanity
  if (content.length > MAX_FILE_SIZE) {
    score -= 10;
    checks.push({ name: 'File exceeds size limit', passed: false, severity: 'medium', details: `${(content.length / 1024 / 1024).toFixed(1)}MB > 5MB limit` });
  }

  return {
    score: Math.max(0, score),
    passed: score >= 70,
    checks
  };
}
```

### Layer 8: Client-Side Security

**Input sanitization (DOMPurify):**
```typescript
// lib/sanitize.ts
import DOMPurify from 'dompurify';

export function sanitize(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip ALL HTML
    ALLOWED_ATTR: [],
  });
}

export function sanitizeHTML(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'li'],
    ALLOWED_ATTR: [],
  });
}
```

**Use sanitize() on EVERY user input before:**
- Sending to Supabase
- Displaying in the UI (React JSX handles most, but be explicit)
- Sending to Stripe (metadata fields)
- Logging to audit table

**CSRF-like protection for state-changing operations:**
```typescript
// All /api/ routes that change state must:
// 1. Require POST method (already in spec)
// 2. Require valid Firebase ID token in Authorization header
// 3. Verify token server-side with Firebase Admin
// 4. Check that the token's UID matches the requesting user
// 5. Use Stripe's idempotency keys for payment operations

// This is token-based auth, not cookie-based, so traditional CSRF
// doesn't apply — but we enforce the same pattern for defense-in-depth.
```

### Layer 9: Monitoring & Incident Response

**Sentry configuration:**
```typescript
// main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,        // 10% of transactions for performance
  replaysSessionSampleRate: 0,   // No session replay (privacy)
  replaysOnErrorSampleRate: 0.1, // 10% replay on error

  beforeSend(event) {
    // NEVER send sensitive data to Sentry
    if (event.request?.headers) {
      delete event.request.headers['Authorization'];
      delete event.request.headers['x-api-key'];
    }
    // Strip any API keys from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(b => {
        if (b.data) {
          const data = { ...b.data };
          for (const key of Object.keys(data)) {
            if (/key|token|secret|password/i.test(key)) {
              data[key] = '[REDACTED]';
            }
          }
          b.data = data;
        }
        return b;
      });
    }
    return event;
  }
});
```

**Audit logging (comprehensive):**
```typescript
// lib/audit.ts
// Log EVERY security-relevant action

type AuditAction =
  | 'user_signup' | 'user_login' | 'user_logout' | 'user_login_failed'
  | 'key_saved' | 'key_deleted' | 'key_delivered_to_app'
  | 'app_purchased' | 'app_canceled' | 'app_launched'
  | 'checkout_created' | 'payment_succeeded' | 'payment_failed'
  | 'developer_signup' | 'connect_account_created' | 'payout_initiated'
  | 'app_submitted' | 'app_approved' | 'app_rejected' | 'app_suspended'
  | 'settings_changed' | 'role_changed'
  | 'rate_limit_hit' | 'auth_token_invalid' | 'suspicious_activity';

export async function auditLog(params: {
  userId: string;
  action: AuditAction;
  details?: Record<string, unknown>;
  ip?: string | null;
}) {
  // Never log sensitive data in details
  const safeDetails = { ...params.details };
  for (const key of Object.keys(safeDetails)) {
    if (/key|token|secret|password|card/i.test(key)) {
      safeDetails[key] = '[REDACTED]';
    }
  }

  await supabase.from('audit_logs').insert({
    user_id: params.userId,
    action: params.action,
    details: safeDetails,
    ip_address: params.ip || null,
  });
}
```

---

## ENVIRONMENT VARIABLES (updated)

```env
# Firebase Auth
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
FIREBASE_ADMIN_SDK_KEY=              # Server-only — JSON string of service account

# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=              # Client-safe (RLS protects data)
SUPABASE_SERVICE_ROLE_KEY=           # Server-only — bypasses RLS
DATABASE_URL=                         # Server-only — direct Postgres connection

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=         # Client-safe
STRIPE_SECRET_KEY=                    # Server-only
STRIPE_WEBHOOK_SECRET=                # Server-only — unique per webhook endpoint
STRIPE_CONNECT_CLIENT_ID=             # Server-only

# Upstash Redis (rate limiting)
UPSTASH_REDIS_REST_URL=              # Server-only
UPSTASH_REDIS_REST_TOKEN=            # Server-only

# Resend
RESEND_API_KEY=                       # Server-only

# Sentry
VITE_SENTRY_DSN=                      # Client-safe (DSN is not a secret)
SENTRY_AUTH_TOKEN=                    # CI-only — for source map uploads

# App
VITE_APP_URL=https://app.salesai.com
```

**Rules:**
- `VITE_` prefix = exposed to browser. Only put truly public values here.
- Everything else = server-only. Vercel encrypts these at rest.
- NEVER commit .env to git. Use `.env.example` with empty values.
- Use Vercel's environment variable UI, not `.env` files in production.
- Different values for preview/staging/production environments.

---

## SECURITY ADDITIONS TO TECH STACK

| Addition | Purpose | Cost |
|----------|---------|------|
| Upstash Redis | Server-side rate limiting (API routes) | Free tier → $10/mo |
| Firebase Admin SDK | Server-side token verification | Free (part of Firebase) |
| DOMPurify | XSS prevention on user content | Free (npm package) |
| Stripe Radar | Payment fraud detection | Included with Stripe |
| Zod | Input validation schemas on every API route | Free (npm package) |

---

## SECURITY TESTING PLAN

### Before Launch
1. **Automated dependency audit**: `npm audit` in CI on every PR
2. **OWASP ZAP scan**: Run against staging environment
3. **Stripe test mode**: End-to-end payment testing with test cards
4. **RLS verification**: Script that attempts cross-user data access and verifies denial
5. **File upload testing**: Submit intentionally malicious HTML files and verify they're caught
6. **Rate limit testing**: Burst requests to verify limits hold
7. **Token expiry testing**: Verify expired Firebase tokens are rejected server-side

### Ongoing
1. **GitHub Dependabot**: Auto-PRs for security patches
2. **Weekly `security-scan.yml`** workflow: dependency audit + known vulnerability check
3. **Stripe webhook monitoring**: Alert on delivery failures
4. **Sentry alerts**: Spike in auth errors, rate limit hits, or 500s
5. **BetterStack uptime**: Monitor all critical endpoints
6. **Monthly RLS review**: Verify policies haven't drifted after schema changes
7. **Quarterly penetration test**: Consider hiring a third-party firm before scaling

---

## SUMMARY: WHAT PROTECTS WHAT

| Asset | Protection |
|-------|-----------|
| User passwords | Firebase Auth (bcrypt + salt, never stored by us) |
| AI API keys | AES-256-GCM client-side, Web Crypto API, never on server |
| Payment card numbers | Stripe (PCI DSS Level 1 compliant, we never see card data) |
| User data in database | Supabase RLS + Firebase token verification |
| API routes | Firebase Admin token verification + Zod validation + Upstash rate limiting |
| Network traffic | Cloudflare WAF + HTTPS everywhere + HSTS preload |
| Third-party app code | Automated security scan + iframe sandbox + restricted CSP |
| Session hijacking | Firebase JWT (1hr expiry, auto-refresh) + 30min inactivity timeout |
| XSS attacks | React JSX escaping + DOMPurify + strict CSP |
| CSRF attacks | Token-based auth (no cookies) + server-side token verification |
| Fraud purchases | Stripe Radar + purchase rate limiting + email verification required |
| Data breaches | Supabase point-in-time recovery + encrypted env vars + audit logging |
| Developer uploads | 15-check security scanner + manual review + sandboxed execution |
