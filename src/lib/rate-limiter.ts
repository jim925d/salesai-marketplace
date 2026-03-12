// Client-side rate limiting utility
// Prevents excessive API calls from the browser

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

const requestLog = new Map<string, number[]>()

export function checkRateLimit(key: string, config: RateLimitConfig): boolean {
  const now = Date.now()
  const timestamps = requestLog.get(key) || []

  // Remove expired timestamps
  const valid = timestamps.filter((t) => now - t < config.windowMs)

  if (valid.length >= config.maxRequests) {
    return false
  }

  valid.push(now)
  requestLog.set(key, valid)
  return true
}
