import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/store/useAuthStore'
import { signInWithEmail, signInWithGoogle, signUpDeveloper } from '@/lib/firebase'
import { toast } from 'sonner'
import { Loader2, Mail, Code2 } from 'lucide-react'
import { sanitize } from '@/lib/sanitize'

export default function DevAuthModal() {
  const { devAuthModalOpen, closeDevAuthModal } = useAuthStore()
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setName('')
    setCompanyName('')
    setLoading(false)
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      closeDevAuthModal()
      resetForm()
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'signup') {
        await signUpDeveloper(email, password, sanitize(name), sanitize(companyName))
        toast.success('Developer account created! Welcome to SalesAI.')
      } else {
        await signInWithEmail(email, password)
        toast.success('Welcome back!')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    try {
      await signInWithGoogle('developer')
      toast.success('Signed in with Google!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={devAuthModalOpen} onOpenChange={handleClose}>
      <DialogContent className="border-border bg-midnight-card sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple/10">
              <Code2 className="h-4 w-4 text-purple" />
            </div>
            <span className="text-xs font-medium uppercase tracking-wider text-purple">
              Developer Portal
            </span>
          </div>
          <DialogTitle className="font-serif text-xl text-foreground">
            {mode === 'signup' ? 'Build & sell AI tools' : 'Developer sign in'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'signup'
              ? 'Create a developer account. You keep 80% of every sale.'
              : 'Sign in to manage your apps and revenue.'}
          </DialogDescription>
        </DialogHeader>

        {/* Google OAuth */}
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleGoogleAuth}
          disabled={loading}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          {mode === 'signup' && (
            <>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">
                  Your name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">
                  Company / Studio name
                </label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme AI Labs"
                  required
                  disabled={loading}
                />
              </div>
            </>
          )}
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dev@company.com"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              minLength={6}
              required
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-purple text-midnight hover:bg-purple/90"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            {mode === 'signup' ? 'Create developer account' : 'Sign in'}
          </Button>
        </form>

        {mode === 'signup' && (
          <div className="rounded-lg border border-border bg-midnight-elevated p-3">
            <p className="text-center text-xs text-muted-foreground">
              By signing up, you agree to the Developer Agreement.
              <br />
              Revenue split:{' '}
              <span className="font-medium text-green">You 80%</span>
              {' / '}
              <span className="text-muted-foreground">Marketplace 20%</span>
            </p>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {mode === 'signup' ? (
            <>
              Already have a developer account?{' '}
              <button
                onClick={() => setMode('signin')}
                className="text-purple hover:underline"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Need a developer account?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-purple hover:underline"
              >
                Sign up
              </button>
            </>
          )}
        </p>

        <p className="text-center text-xs text-muted-foreground">
          Looking to buy tools?{' '}
          <button
            onClick={() => {
              closeDevAuthModal()
              useAuthStore.getState().openAuthModal()
            }}
            className="text-ice hover:underline"
          >
            Buyer sign up
          </button>
        </p>
      </DialogContent>
    </Dialog>
  )
}
