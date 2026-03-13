// GET /api/health
// Health check endpoint — no auth required

export default function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response('', { status: 405 })
  }

  return new Response(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
