import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Star, Users, Shield, Check, Loader2 } from 'lucide-react'
import type { App } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import { createCheckout } from '@/lib/stripe'
import { toast } from 'sonner'
import { useState } from 'react'

interface AppDetailModalProps {
  app: App | null
  open: boolean
  onClose: () => void
  owned?: boolean
  onPurchase?: (app: App) => void
}

export default function AppDetailModal({
  app,
  open,
  onClose,
  owned,
  onPurchase,
}: AppDetailModalProps) {
  const { user, openAuthModal } = useAuthStore()
  const [purchasing, setPurchasing] = useState(false)

  if (!app) return null

  const handlePurchase = async () => {
    if (!user) {
      openAuthModal()
      return
    }

    setPurchasing(true)
    try {
      const result = await createCheckout(app.id)

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.free) {
        toast.success(`${app.name} added to your workspace!`)
        onPurchase?.(app)
        onClose()
        return
      }

      if (result.sessionUrl) {
        // Redirect to Stripe Checkout
        window.location.href = result.sessionUrl
      }
    } catch {
      toast.error('Failed to start checkout')
    } finally {
      setPurchasing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-border bg-midnight-card sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-ice-border bg-ice-dim text-2xl">
              {app.icon}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-serif text-xl text-foreground">
                {app.name}
              </DialogTitle>
              <DialogDescription className="mt-1 flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <span
                    className={
                      app.developerName === 'SalesAI'
                        ? 'text-ice'
                        : 'text-muted-foreground'
                    }
                  >
                    {app.developerName === 'SalesAI' ? '◆' : '●'}
                  </span>
                  {app.developerName || 'Unknown Developer'}
                </span>
                <Badge
                  variant="secondary"
                  className="border-border bg-midnight-elevated text-xs"
                >
                  v{app.version}
                </Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-5 pr-3">
            {/* Stats row */}
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-ice">
                <Star className="h-3.5 w-3.5 fill-ice" />
                {app.avgRating > 0 ? app.avgRating.toFixed(1) : '—'}
                {app.reviewCount > 0 && (
                  <span className="text-muted-foreground">
                    ({app.reviewCount})
                  </span>
                )}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {app.totalInstalls.toLocaleString()} users
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                {app.category}
              </span>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h4 className="mb-2 text-sm font-medium text-foreground">
                About
              </h4>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {app.longDescription || app.description}
              </p>
            </div>

            {/* Features */}
            {app.features.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-foreground">
                  Features
                </h4>
                <ul className="space-y-2">
                  {app.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Separator />

            {/* Security */}
            <div className="rounded-lg border border-border bg-midnight-elevated p-3">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-ice" />
                <span className="font-medium text-foreground">
                  Marketplace Verified
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                This app has passed automated security scanning and manual
                review. Your API keys are encrypted with AES-256-GCM and never
                sent to our servers.
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* Purchase footer */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div>
            <span className="font-serif text-2xl font-bold text-foreground">
              {app.priceCents === 0
                ? 'Free'
                : `$${(app.priceCents / 100).toFixed(0)}`}
            </span>
            {app.priceCents > 0 && (
              <span className="ml-1 text-sm text-muted-foreground">/mo</span>
            )}
            {app.priceCents > 0 && (
              <p className="text-xs text-muted-foreground">
                14-day free trial included
              </p>
            )}
          </div>
          <Button
            size="lg"
            className={
              owned
                ? 'bg-green/10 text-green hover:bg-green/20'
                : 'bg-ice text-midnight hover:bg-ice/90'
            }
            onClick={handlePurchase}
            disabled={owned || purchasing}
          >
            {purchasing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : owned ? (
              'Already owned'
            ) : (
              'Add to workspace'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
