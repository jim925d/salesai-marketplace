// Firebase Admin token verification for API routes
// Used in every /api/ function to verify the caller's identity

import { getAuth } from 'firebase-admin/auth'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { createClient } from '@supabase/supabase-js'

// Initialize Firebase Admin (singleton)
if (getApps().length === 0) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY!)),
  })
}

// Server-side Supabase client with service_role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export { supabaseAdmin }

export interface AuthResult {
  uid: string
  email: string
  role: 'buyer' | 'developer' | 'admin'
  supabaseId: string
}

export async function verifyAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('Missing authentication token', 401)
  }

  const token = authHeader.split('Bearer ')[1]

  try {
    // Verify token with Firebase Admin — checks signature, expiry, issuer
    // true = also check if token has been revoked
    const decoded = await getAuth().verifyIdToken(token, true)

    // Get user from Supabase
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('firebase_uid', decoded.uid)
      .single()

    if (error || !user) {
      throw new AuthError('User not found', 401)
    }

    return {
      uid: decoded.uid,
      email: decoded.email || '',
      role: user.role as AuthResult['role'],
      supabaseId: user.id,
    }
  } catch (err) {
    if (err instanceof AuthError) throw err
    throw new AuthError('Invalid or expired authentication token', 401)
  }
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}
