import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase, setSupabaseAuth } from './supabase'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

const googleProvider = new GoogleAuthProvider()

// Session timeout: 30 minutes of inactivity
const SESSION_TIMEOUT_MS = 30 * 60 * 1000
let activityTimer: ReturnType<typeof setTimeout>

function resetActivityTimer() {
  clearTimeout(activityTimer)
  if (!auth.currentUser) return
  activityTimer = setTimeout(() => {
    signOut()
    window.location.href = '/'
  }, SESSION_TIMEOUT_MS)
}

// Track user activity for session timeout
if (typeof document !== 'undefined') {
  ;['mousedown', 'keydown', 'scroll', 'touchstart'].forEach((event) => {
    document.addEventListener(event, resetActivityTimer, { passive: true })
  })
}

// Force token refresh for critical operations
export async function getVerifiedToken(): Promise<string> {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  return user.getIdToken(true)
}

// Check if Supabase is configured (not using placeholder URL)
function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL
  return Boolean(url && !url.includes('placeholder'))
}

// Sync Firebase user to Supabase users table
// Returns null gracefully when Supabase is not configured
async function syncUserToSupabase(firebaseUser: FirebaseUser, role: 'buyer' | 'developer' = 'buyer') {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured — skipping user sync')
    return null
  }

  const token = await firebaseUser.getIdToken()
  await setSupabaseAuth(token)

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, role, name, avatar_url')
    .eq('firebase_uid', firebaseUser.uid)
    .single()

  if (existingUser) {
    return existingUser
  }

  // Create new user in Supabase
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      firebase_uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      role,
      avatar_url: firebaseUser.photoURL,
    })
    .select('id, role, name, avatar_url')
    .single()

  if (error) {
    console.error('Failed to create user in Supabase:', error)
    throw new Error('Failed to create user profile')
  }

  return newUser
}

// Sign up with email/password
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
  role: 'buyer' | 'developer' = 'buyer'
) {
  const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(firebaseUser, { displayName: name })

  const supabaseUser = await syncUserToSupabase(firebaseUser, role)

  useAuthStore.getState().setUser({
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    name,
    role: supabaseUser?.role ?? role,
    avatarUrl: firebaseUser.photoURL || undefined,
  })

  resetActivityTimer()
  return supabaseUser
}

// Sign in with email/password
export async function signInWithEmail(email: string, password: string) {
  const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password)

  let supabaseUser = null
  try {
    supabaseUser = await syncUserToSupabase(firebaseUser)
  } catch (err) {
    console.warn('Supabase sync failed (RLS), using Firebase profile:', err)
  }

  useAuthStore.getState().setUser({
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: supabaseUser?.name || firebaseUser.displayName || '',
    role: supabaseUser?.role ?? 'buyer',
    avatarUrl: supabaseUser?.avatar_url || undefined,
  })

  resetActivityTimer()
  return supabaseUser
}

// Sign in with Google
export async function signInWithGoogle(role: 'buyer' | 'developer' = 'buyer') {
  const { user: firebaseUser } = await signInWithPopup(auth, googleProvider)

  let supabaseUser = null
  try {
    supabaseUser = await syncUserToSupabase(firebaseUser, role)
  } catch (err) {
    // RLS may block insert — continue with Firebase data only
    console.warn('Supabase sync failed (RLS), using Firebase profile:', err)
  }

  useAuthStore.getState().setUser({
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: supabaseUser?.name || firebaseUser.displayName || '',
    role: supabaseUser?.role ?? role,
    avatarUrl: supabaseUser?.avatar_url || firebaseUser.photoURL || undefined,
  })

  resetActivityTimer()
  return supabaseUser
}

// Developer sign up with company info
export async function signUpDeveloper(
  email: string,
  password: string,
  name: string,
  companyName: string
) {
  const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(firebaseUser, { displayName: name })

  const supabaseUser = await syncUserToSupabase(firebaseUser, 'developer')

  // Create developer profile (only if Supabase is configured)
  if (supabaseUser) {
    await supabase.from('developer_profiles').insert({
      user_id: supabaseUser.id,
      company_name: companyName,
    })
  }

  useAuthStore.getState().setUser({
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    name,
    role: 'developer',
    avatarUrl: firebaseUser.photoURL || undefined,
  })

  resetActivityTimer()
  return supabaseUser
}

// Sign out
export async function signOut() {
  clearTimeout(activityTimer)
  await firebaseSignOut(auth)
  await setSupabaseAuth(null)
  useAuthStore.getState().logout()
}

// Listen for auth state changes (restores session on page reload)
export function initAuthListener() {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        let supabaseUser = null
        try {
          supabaseUser = await syncUserToSupabase(firebaseUser)
        } catch (err) {
          console.warn('Supabase sync failed (RLS), using Firebase profile:', err)
        }
        useAuthStore.getState().setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: supabaseUser?.name || firebaseUser.displayName || '',
          role: supabaseUser?.role ?? 'buyer',
          avatarUrl: supabaseUser?.avatar_url || firebaseUser.photoURL || undefined,
        })
        resetActivityTimer()
      } catch {
        console.error('Failed to sync auth state')
        useAuthStore.getState().setLoading(false)
      }
    } else {
      useAuthStore.getState().logout()
    }
  })
}
