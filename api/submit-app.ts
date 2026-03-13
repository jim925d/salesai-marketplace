// POST /api/submit-app
// Handles app file upload and security scan
// Security pattern: method check → rate limit → auth → validate → authorize → scan → business logic → audit

import Stripe from 'stripe'
import { z } from 'zod'
import { verifyAuth, AuthError, supabaseAdmin } from './lib/verify-auth'
import { rateLimit } from './lib/rate-limit'
import { auditLog } from './lib/audit'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Rate limit: 5 submissions per hour per IP
const limiter = rateLimit({ windowMs: 3_600_000, max: 5 })

const ALLOWED_EXTENSIONS = ['.html']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// ── Security Scanner ──

interface SecurityCheck {
  name: string
  passed: boolean
  severity: 'critical' | 'high' | 'medium' | 'low'
  details: string
}

interface SecurityScanResult {
  score: number
  passed: boolean
  checks: SecurityCheck[]
}

const FORBIDDEN_PATTERNS: RegExp[] = [
  /\beval\s*\(/gi,
  /new\s+Function\s*\(/gi,
  /document\.cookie/gi,
  /document\.domain/gi,
  /window\.opener/gi,
  /window\.top(?!\.postMessage)/gi,
  /parent\.document/gi,
  /top\.document/gi,
  /document\.write/gi,
  /innerHTML\s*=/gi,
  /\.insertAdjacentHTML/gi,
  /crypto\.subtle/gi,
  /indexedDB/gi,
  /WebSocket/gi,
  /navigator\.sendBeacon/gi,
  /navigator\.credentials/gi,
  /window\.open\s*\(/gi,
]

const FORBIDDEN_DOMAINS: RegExp[] = [
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
]

const ALLOWED_CDN_DOMAINS = [
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
]

const ALLOWED_API_DOMAINS = [
  'api.openai.com',
  'api.anthropic.com',
]

function scanHTMLFile(content: string): SecurityScanResult {
  const checks: SecurityCheck[] = []
  let score = 100

  // Check 1: Forbidden JavaScript patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    // Reset lastIndex for global regexps
    pattern.lastIndex = 0
    const matches = content.match(pattern)
    if (matches) {
      score -= 25
      checks.push({
        name: `Forbidden pattern: ${pattern.source.slice(0, 40)}`,
        passed: false,
        severity: 'critical',
        details: `Found ${matches.length} occurrence(s)`,
      })
    }
  }

  // Check 2: External script sources
  const scriptSrcRegex = /<script[^>]+src=["']([^"']+)["']/gi
  let match
  while ((match = scriptSrcRegex.exec(content)) !== null) {
    const src = match[1]
    const isAllowed = ALLOWED_CDN_DOMAINS.some((d) => src.includes(d))
    if (!isAllowed) {
      score -= 20
      checks.push({
        name: 'External script from non-approved domain',
        passed: false,
        severity: 'high',
        details: `Found: ${src}`,
      })
    }
  }

  // Check 3: Fetch/XHR to unknown domains
  const fetchRegex = /fetch\s*\(\s*['"`]([^'"`]+)['"`]/gi
  while ((match = fetchRegex.exec(content)) !== null) {
    const url = match[1]
    const isAllowed = ALLOWED_API_DOMAINS.some((d) => url.includes(d))
    if (!isAllowed && !url.startsWith('/') && !url.startsWith('#')) {
      score -= 20
      checks.push({
        name: 'Network request to non-approved domain',
        passed: false,
        severity: 'high',
        details: `Found: ${url}`,
      })
    }
  }

  // Check 4: Tracking / analytics
  for (const pattern of FORBIDDEN_DOMAINS) {
    pattern.lastIndex = 0
    if (pattern.test(content)) {
      score -= 15
      checks.push({
        name: 'Tracking or analytics detected',
        passed: false,
        severity: 'medium',
        details: `Pattern: ${pattern.source}`,
      })
    }
  }

  // Check 5: Required elements exist
  if (!/id=["']provider["']/i.test(content)) {
    score -= 15
    checks.push({
      name: 'Missing provider selector (id="provider")',
      passed: false,
      severity: 'high',
      details: 'Required for marketplace integration',
    })
  }
  if (!/id=["']apiKey["']/i.test(content)) {
    score -= 15
    checks.push({
      name: 'Missing API key input (id="apiKey")',
      passed: false,
      severity: 'high',
      details: 'Required for marketplace integration',
    })
  }

  // Check 6: PostMessage origin validation
  if (
    /addEventListener.*message/i.test(content) &&
    !/e\.origin|event\.origin|\.origin\s*[!=]/i.test(content)
  ) {
    score -= 10
    checks.push({
      name: 'PostMessage listener without origin check',
      passed: false,
      severity: 'medium',
      details: 'Message event listeners should validate e.origin',
    })
  }

  // Check 7: File size sanity
  if (content.length > MAX_FILE_SIZE) {
    score -= 10
    checks.push({
      name: 'File exceeds size limit',
      passed: false,
      severity: 'medium',
      details: `${(content.length / 1024 / 1024).toFixed(1)}MB > 5MB limit`,
    })
  }

  // Add passing checks for good practices
  if (score === 100) {
    checks.push({
      name: 'No forbidden patterns detected',
      passed: true,
      severity: 'low',
      details: 'All security checks passed',
    })
  }

  return {
    score: Math.max(0, score),
    passed: score >= 70,
    checks,
  }
}

// ── Slug generator ──

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

// ── Handler ──

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
        details: { endpoint: 'submit-app', ip },
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

    // 4. Authorization — only developers can submit apps
    if (auth.role !== 'developer') {
      return new Response(
        JSON.stringify({ error: 'Only developer accounts can submit apps' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 5. Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const appName = formData.get('name') as string | null
    const appIcon = formData.get('icon') as string | null
    const appCategory = formData.get('category') as string | null
    const appPriceCents = Number(formData.get('priceCents') || '0')
    const appDescription = formData.get('description') as string | null
    const appLongDescription = formData.get('longDescription') as string | null

    // 6. Validate inputs
    const inputSchema = z.object({
      name: z.string().min(1).max(60),
      icon: z.string().min(1).max(4),
      category: z.enum(['Outreach', 'Prospecting', 'Meeting Prep', 'Productivity']),
      priceCents: z.number().min(0).max(99900),
      description: z.string().min(1).max(120),
    })

    const input = inputSchema.parse({
      name: appName,
      icon: appIcon,
      category: appCategory,
      priceCents: appPriceCents,
      description: appDescription,
    })

    // 7. Validate file
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file uploaded' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return new Response(
        JSON.stringify({ error: 'Only .html files are accepted' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'File exceeds 5MB limit' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 8. Read file content and run security scan
    const content = await file.text()
    const scanResult = scanHTMLFile(content)

    // 9. Get developer profile
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

    // 10. Generate unique slug
    let slug = generateSlug(input.name)
    const { data: existingSlug } = await supabaseAdmin
      .from('apps')
      .select('id')
      .eq('slug', slug)
      .limit(1)

    if (existingSlug && existingSlug.length > 0) {
      slug = `${slug}-${Date.now().toString(36)}`
    }

    // 11. Create Stripe Product + Price (if paid app and developer is onboarded)
    let stripeProductId: string | null = null
    let stripePriceId: string | null = null

    if (input.priceCents > 0 && devProfile.stripe_connect_id && devProfile.stripe_onboarded) {
      const product = await stripe.products.create({
        name: input.name,
        description: input.description,
        metadata: { slug, developer_profile_id: devProfile.id },
      })
      stripeProductId = product.id

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: input.priceCents,
        currency: 'usd',
        recurring: { interval: 'month' },
      })
      stripePriceId = price.id
    }

    // 12. Create app record
    const { data: app, error: appError } = await supabaseAdmin
      .from('apps')
      .insert({
        developer_id: devProfile.id,
        name: input.name,
        slug,
        icon: input.icon,
        category: input.category,
        price_cents: input.priceCents,
        description: input.description,
        long_description: appLongDescription || null,
        file_path: `apps/${slug}.html`,
        status: scanResult.passed ? 'pending_review' : 'rejected',
        security_score: scanResult.score,
        stripe_product_id: stripeProductId,
        stripe_price_id: stripePriceId,
        rejection_reason: scanResult.passed
          ? null
          : `Security scan failed (score: ${scanResult.score}/100). Issues: ${scanResult.checks
              .filter((c) => !c.passed)
              .map((c) => c.name)
              .join(', ')}`,
      })
      .select('id')
      .single()

    if (appError || !app) {
      console.error('Failed to create app:', appError)
      return new Response(
        JSON.stringify({ error: 'Failed to create app record' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 13. Create initial app_version record
    await supabaseAdmin.from('app_versions').insert({
      app_id: app.id,
      version: '1.0.0',
      file_path: `apps/${slug}.html`,
      security_score: scanResult.score,
      status: scanResult.passed ? 'pending_review' : 'rejected',
    })

    // 14. Audit log
    await auditLog({
      userId: auth.supabaseId,
      action: 'app_submitted',
      details: {
        appId: app.id,
        appName: input.name,
        category: input.category,
        priceCents: input.priceCents,
        securityScore: scanResult.score,
        securityPassed: scanResult.passed,
        checksRun: scanResult.checks.length,
        issuesFound: scanResult.checks.filter((c) => !c.passed).length,
      },
      ip,
    })

    // 15. Return result
    return new Response(
      JSON.stringify({
        appId: app.id,
        slug,
        securityScore: scanResult.score,
        securityPassed: scanResult.passed,
        checks: scanResult.checks,
        status: scanResult.passed ? 'pending_review' : 'rejected',
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
        details: { endpoint: 'submit-app' },
        ip,
      })
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: error.status, headers: { 'Content-Type': 'application/json' } }
      )
    }
    console.error('Submit app error:', error)
    return new Response(
      JSON.stringify({ error: 'Something went wrong' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
