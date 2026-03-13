// Server-side rate limiting for API routes
// Uses in-memory store (suitable for single-instance Vercel functions)
// For production at scale, swap to Upstash Redis

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 60_000)

interface RateLimitConfig {
  windowMs: number
  max: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfter: number
}

export function rateLimit(config: RateLimitConfig) {
  return {
    check(req: Request): RateLimitResult {
      const key =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        'unknown'

      const now = Date.now()
      let entry = store.get(key)

      if (!entry || now > entry.resetAt) {
        entry = { count: 0, resetAt: now + config.windowMs }
        store.set(key, entry)
      }

      entry.count++

      if (entry.count > config.max) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
        return { allowed: false, remaining: 0, retryAfter }
      }

      return {
        allowed: true,
        remaining: config.max - entry.count,
        retryAfter: 0,
      }
    },
  }
}
