import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Shield,
  Key,
  Eye,
  EyeOff,
  Trash2,
  Check,
  AlertTriangle,
  Monitor,
  Lock,
  CreditCard,
  Fingerprint,
  Globe,
  Timer,
} from 'lucide-react'
import { KeyVault } from '@/lib/key-vault'
import { toast } from 'sonner'
import type { LaunchMode } from './AppLauncher'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  launchMode: LaunchMode
  onChangeLaunchMode: (mode: LaunchMode) => void
}

export default function SettingsModal({
  open,
  onClose,
  launchMode,
  onChangeLaunchMode,
}: SettingsModalProps) {
  const [keyStatus, setKeyStatus] = useState({ openai: false, anthropic: false })
  const [openaiKey, setOpenaiKey] = useState('')
  const [anthropicKey, setAnthropicKey] = useState('')
  const [showOpenai, setShowOpenai] = useState(false)
  const [showAnthropic, setShowAnthropic] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      KeyVault.getStatus().then(setKeyStatus)
    }
  }, [open])

  const handleSaveKey = async (provider: 'openai' | 'anthropic') => {
    const key = provider === 'openai' ? openaiKey : anthropicKey
    if (!key.trim()) return

    setSaving(true)
    try {
      await KeyVault.saveKey(provider, key.trim())
      setKeyStatus((prev) => ({ ...prev, [provider]: true }))
      if (provider === 'openai') setOpenaiKey('')
      else setAnthropicKey('')
      toast.success(`${provider === 'openai' ? 'OpenAI' : 'Anthropic'} key saved`)
    } catch {
      toast.error('Failed to encrypt key')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveKey = async (provider: 'openai' | 'anthropic') => {
    await KeyVault.removeKey(provider)
    setKeyStatus((prev) => ({ ...prev, [provider]: false }))
    toast.success(`${provider === 'openai' ? 'OpenAI' : 'Anthropic'} key removed`)
  }

  const handlePurgeAll = async () => {
    await KeyVault.purgeAll()
    setKeyStatus({ openai: false, anthropic: false })
    toast.success('All API keys purged')
  }

  const launchModes: { value: LaunchMode; label: string; description: string }[] = [
    { value: 'modal', label: 'Fullscreen', description: 'Opens in a centered dialog' },
    { value: 'panel', label: 'Side Panel', description: 'Opens in a side sheet' },
    { value: 'tab', label: 'New Tab', description: 'Opens in a browser tab' },
    { value: 'window', label: 'Pop-out', description: 'Opens in a new window' },
  ]

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-border bg-midnight-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-foreground">
            Settings
          </DialogTitle>
          <DialogDescription>
            Manage API keys, security, and preferences
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="keys">
          <TabsList className="w-full bg-midnight-elevated">
            <TabsTrigger value="keys" className="flex-1 gap-1.5">
              <Key className="h-3.5 w-3.5" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="security" className="flex-1 gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Security
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex-1 gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="launcher" className="flex-1 gap-1.5">
              <Monitor className="h-3.5 w-3.5" />
              Launcher
            </TabsTrigger>
          </TabsList>

          {/* API Keys Tab */}
          <TabsContent value="keys" className="space-y-4 pt-4">
            {/* Security banner */}
            <div className="rounded-lg border border-border bg-midnight-elevated p-3">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-ice" />
                <span className="font-medium text-foreground">
                  AES-256-GCM Encryption
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Your API keys are encrypted client-side with AES-256-GCM via
                Web Crypto API. Keys never leave your browser unencrypted.
              </p>
            </div>

            {/* OpenAI */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  OpenAI API Key
                </label>
                {keyStatus.openai ? (
                  <Badge className="bg-green/10 text-green">
                    <Check className="mr-1 h-3 w-3" />
                    Stored
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="border-border bg-midnight-elevated text-muted-foreground"
                  >
                    Not set
                  </Badge>
                )}
              </div>
              {keyStatus.openai ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-md border border-border bg-midnight-elevated px-3 py-2 text-sm text-muted-foreground">
                    ••••••••••••••••••••
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red hover:bg-red/10 hover:text-red"
                    onClick={() => handleRemoveKey('openai')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showOpenai ? 'text' : 'password'}
                      placeholder="sk-..."
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      className="border-border bg-midnight-elevated pr-8"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowOpenai(!showOpenai)}
                    >
                      {showOpenai ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <Button
                    size="sm"
                    className="bg-ice text-midnight hover:bg-ice/90"
                    onClick={() => handleSaveKey('openai')}
                    disabled={!openaiKey.trim() || saving}
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Anthropic */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Anthropic API Key
                </label>
                {keyStatus.anthropic ? (
                  <Badge className="bg-green/10 text-green">
                    <Check className="mr-1 h-3 w-3" />
                    Stored
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="border-border bg-midnight-elevated text-muted-foreground"
                  >
                    Not set
                  </Badge>
                )}
              </div>
              {keyStatus.anthropic ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-md border border-border bg-midnight-elevated px-3 py-2 text-sm text-muted-foreground">
                    ••••••••••••••••••••
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red hover:bg-red/10 hover:text-red"
                    onClick={() => handleRemoveKey('anthropic')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showAnthropic ? 'text' : 'password'}
                      placeholder="sk-ant-..."
                      value={anthropicKey}
                      onChange={(e) => setAnthropicKey(e.target.value)}
                      className="border-border bg-midnight-elevated pr-8"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowAnthropic(!showAnthropic)}
                    >
                      {showAnthropic ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <Button
                    size="sm"
                    className="bg-ice text-midnight hover:bg-ice/90"
                    onClick={() => handleSaveKey('anthropic')}
                    disabled={!anthropicKey.trim() || saving}
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Purge all */}
            <div className="flex items-center justify-between rounded-lg border border-red/20 bg-red/5 p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Purge all keys
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete all stored API keys
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-red/30 text-red hover:bg-red/10"
                onClick={handlePurgeAll}
              >
                Purge
              </Button>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4 pt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Security Features</h4>

              <div className="rounded-lg border border-green/20 bg-green/5 p-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-green" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      End-to-End Key Encryption
                    </p>
                    <p className="text-xs text-muted-foreground">
                      AES-256-GCM with PBKDF2-SHA256 (310k iterations)
                    </p>
                  </div>
                  <Badge className="bg-green/10 text-green">Active</Badge>
                </div>
              </div>

              <div className="rounded-lg border border-green/20 bg-green/5 p-3">
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-green" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Browser Fingerprint Binding
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Keys are bound to this browser instance
                    </p>
                  </div>
                  <Badge className="bg-green/10 text-green">Active</Badge>
                </div>
              </div>

              <div className="rounded-lg border border-green/20 bg-green/5 p-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-green" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Sandboxed App Execution
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Apps run in restricted iframes with CSP
                    </p>
                  </div>
                  <Badge className="bg-green/10 text-green">Active</Badge>
                </div>
              </div>

              <div className="rounded-lg border border-green/20 bg-green/5 p-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Origin-Validated Key Delivery
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PostMessage KeyBridge with origin checking
                    </p>
                  </div>
                  <Badge className="bg-green/10 text-green">Active</Badge>
                </div>
              </div>

              <div className="rounded-lg border border-green/20 bg-green/5 p-3">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-green" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Session Timeout
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Auto-logout after 30 minutes of inactivity
                    </p>
                  </div>
                  <Badge className="bg-green/10 text-green">Active</Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div className="rounded-lg border border-border bg-midnight-elevated p-3">
              <p className="text-xs text-muted-foreground">
                All security features are enabled by default and cannot be
                disabled. Your data is protected with industry-standard
                encryption and isolation practices.
              </p>
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-4 pt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Subscription</h4>

              <div className="rounded-lg border border-border bg-midnight-elevated p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Current Plan</p>
                    <p className="text-xs text-muted-foreground">
                      Pay per app, no platform fee
                    </p>
                  </div>
                  <Badge className="bg-ice/10 text-ice">Pay-as-you-go</Badge>
                </div>
              </div>

              <h4 className="mt-4 text-sm font-medium text-foreground">
                Active Subscriptions
              </h4>

              <div className="rounded-lg border border-border bg-midnight-elevated p-4">
                <p className="text-sm text-muted-foreground">
                  Your active app subscriptions are managed through Stripe.
                  You can cancel or update payment methods from your Stripe
                  customer portal.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 border-border"
                  onClick={() =>
                    toast.info('Stripe customer portal coming soon')
                  }
                >
                  <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                  Manage Billing
                </Button>
              </div>

              <Separator />

              <h4 className="text-sm font-medium text-foreground">Payment Method</h4>

              <div className="rounded-lg border border-border bg-midnight-elevated p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-12 items-center justify-center rounded border border-border bg-midnight text-xs font-bold text-muted-foreground">
                    VISA
                  </div>
                  <div>
                    <p className="text-sm text-foreground">
                      •••• •••• •••• 4242
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expires 12/2027
                    </p>
                  </div>
                  <div className="flex-1" />
                  <Badge className="bg-green/10 text-green">Default</Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Launcher Tab */}
          <TabsContent value="launcher" className="space-y-4 pt-4">
            <div>
              <h4 className="mb-3 text-sm font-medium text-foreground">
                Default launch mode
              </h4>
              <div className="space-y-2">
                {launchModes.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                      launchMode === m.value
                        ? 'border-ice/30 bg-ice/[0.05]'
                        : 'border-border bg-[rgba(230,237,243,0.02)] hover:border-[rgba(230,237,243,0.13)]'
                    }`}
                    onClick={() => onChangeLaunchMode(m.value)}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {m.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {m.description}
                      </p>
                    </div>
                    {launchMode === m.value && (
                      <Check className="h-4 w-4 text-ice" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
