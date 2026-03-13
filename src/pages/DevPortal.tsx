import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  DollarSign,
  Users,
  Code2,
  Star,
  Plus,
  TrendingUp,
  Calendar,
  ExternalLink,
  Check,
  Loader2,
} from 'lucide-react'
import DevAppCard from '@/components/cards/DevAppCard'
import SubmitAppModal from '@/components/modals/SubmitAppModal'
import { useDevApps, useRevenue, usePayouts, useDevProfile } from '@/hooks/useRevenue'
import { createConnectAccount } from '@/lib/stripe'
import { toast } from 'sonner'

export default function DevPortal() {
  const { apps, refetch } = useDevApps()
  const { monthly, totalRevenueCents, devShareCents } = useRevenue()
  const { payouts } = usePayouts()
  const { profile } = useDevProfile()

  const [submitOpen, setSubmitOpen] = useState(false)
  const [connecting, setConnecting] = useState(false)

  // Stats
  const totalInstalls = useMemo(
    () => apps.reduce((sum, a) => sum + a.totalInstalls, 0),
    [apps]
  )
  const publishedCount = apps.filter((a) => a.status === 'approved').length
  const avgRating = useMemo(() => {
    const rated = apps.filter((a) => a.avgRating > 0)
    if (rated.length === 0) return 0
    return rated.reduce((sum, a) => sum + a.avgRating, 0) / rated.length
  }, [apps])

  // Revenue chart
  const maxRevenue = Math.max(...monthly.map((m) => m.amount), 1)

  const handleConnectStripe = async () => {
    if (!profile) return
    setConnecting(true)
    try {
      const result = await createConnectAccount(profile.companyName)
      if (result.error) {
        toast.error(result.error)
        return
      }
      if (result.onboardingUrl) {
        window.location.href = result.onboardingUrl
      }
    } catch {
      toast.error('Failed to start Stripe Connect')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="border-purple/20 bg-purple/10 text-purple">
              <Code2 className="mr-1 h-3 w-3" />
              Developer
            </Badge>
          </div>
          <h1 className="mt-2 font-serif text-3xl tracking-tight text-foreground md:text-4xl">
            Developer Portal
          </h1>
        </div>
        <Button
          className="bg-purple text-midnight hover:bg-purple/90"
          onClick={() => setSubmitOpen(true)}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Submit new app
        </Button>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-[rgba(230,237,243,0.02)] p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5" />
            Total Earnings (80%)
          </div>
          <p className="mt-1 font-serif text-2xl font-bold text-green">
            ${(devShareCents / 100).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-[rgba(230,237,243,0.02)] p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            Total Installs
          </div>
          <p className="mt-1 font-serif text-2xl font-bold text-ice">
            {totalInstalls.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-[rgba(230,237,243,0.02)] p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Code2 className="h-3.5 w-3.5" />
            Published Apps
          </div>
          <p className="mt-1 font-serif text-2xl font-bold text-purple">
            {publishedCount}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-[rgba(230,237,243,0.02)] p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5" />
            Avg Rating
          </div>
          <p className="mt-1 font-serif text-2xl font-bold text-orange">
            {avgRating > 0 ? avgRating.toFixed(1) : '—'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="apps">
        <TabsList className="bg-midnight-elevated">
          <TabsTrigger value="apps">My Apps</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* ── My Apps ── */}
        <TabsContent value="apps" className="pt-6">
          {apps.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-lg text-muted-foreground">
                No apps yet. Submit your first app!
              </p>
              <Button
                className="mt-4 bg-purple text-midnight hover:bg-purple/90"
                onClick={() => setSubmitOpen(true)}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Submit new app
              </Button>
            </div>
          ) : (
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              }}
            >
              {apps.map((app) => (
                <DevAppCard key={app.id} app={app} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Revenue ── */}
        <TabsContent value="revenue" className="pt-6">
          <div className="space-y-6">
            {/* Revenue header */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Revenue (Your 80%)
                </p>
                <p className="font-serif text-4xl font-bold text-green">
                  ${(devShareCents / 100).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Fee: 20% / You keep: 80%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Gross Revenue</p>
                <p className="font-serif text-xl text-foreground">
                  ${(totalRevenueCents / 100).toLocaleString()}
                </p>
              </div>
            </div>

            <Separator />

            {/* Bar chart — 12 months */}
            <div>
              <h3 className="mb-4 text-sm font-medium text-foreground">
                Monthly Revenue
              </h3>
              <div className="flex items-end gap-2" style={{ height: '180px' }}>
                {monthly.map((m) => {
                  const height = Math.max((m.amount / maxRevenue) * 100, 2)
                  const monthLabel = new Date(m.month + '-01').toLocaleDateString(
                    'en-US',
                    { month: 'short' }
                  )
                  return (
                    <div
                      key={m.month}
                      className="group flex flex-1 flex-col items-center gap-1"
                    >
                      <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                        ${(m.amount / 100).toFixed(0)}
                      </span>
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-green/60 to-green transition-all duration-300 group-hover:from-green/80 group-hover:to-green"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {monthLabel}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <Separator />

            {/* Revenue by app */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Revenue by App
              </h3>
              <div className="space-y-2">
                {apps
                  .filter((a) => a.totalRevenueCents > 0)
                  .sort((a, b) => b.totalRevenueCents - a.totalRevenueCents)
                  .map((app) => {
                    const devShare = Math.round(app.totalRevenueCents * 0.8)
                    return (
                      <div
                        key={app.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-midnight-elevated p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-ice-border bg-ice-dim text-base">
                            {app.icon}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {app.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {app.totalInstalls} installs
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-serif text-sm font-bold text-green">
                            ${(devShare / 100).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            of ${(app.totalRevenueCents / 100).toLocaleString()} gross
                          </p>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Payouts ── */}
        <TabsContent value="payouts" className="pt-6">
          <div className="space-y-6">
            {/* Payout info */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-border bg-[rgba(230,237,243,0.02)] p-4">
                <p className="text-xs text-muted-foreground">Next Payout</p>
                <p className="mt-1 font-serif text-lg font-bold text-foreground">
                  Apr 5
                </p>
              </div>
              <div className="rounded-xl border border-border bg-[rgba(230,237,243,0.02)] p-4">
                <p className="text-xs text-muted-foreground">Method</p>
                <p className="mt-1 font-serif text-lg font-bold text-foreground">
                  Stripe Connect
                </p>
              </div>
              <div className="rounded-xl border border-border bg-[rgba(230,237,243,0.02)] p-4">
                <p className="text-xs text-muted-foreground">Minimum</p>
                <p className="mt-1 font-serif text-lg font-bold text-foreground">
                  $50
                </p>
              </div>
              <div className="rounded-xl border border-border bg-[rgba(230,237,243,0.02)] p-4">
                <p className="text-xs text-muted-foreground">Frequency</p>
                <p className="mt-1 font-serif text-lg font-bold text-foreground">
                  Monthly
                </p>
              </div>
            </div>

            <Separator />

            {/* Payout history */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Payout History
              </h3>
              <div className="space-y-2">
                {payouts.map((payout) => {
                  const statusColors: Record<string, string> = {
                    paid: 'bg-green/10 text-green',
                    pending: 'bg-yellow/10 text-yellow',
                    processing: 'bg-ice/10 text-ice',
                    failed: 'bg-red/10 text-red',
                  }
                  return (
                    <div
                      key={payout.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-midnight-elevated p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-foreground">
                            {payout.periodStart &&
                              new Date(payout.periodStart).toLocaleDateString(
                                'en-US',
                                { month: 'short', year: 'numeric' }
                              )}
                          </p>
                          {payout.paidAt && (
                            <p className="text-xs text-muted-foreground">
                              Paid{' '}
                              {new Date(payout.paidAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={statusColors[payout.status] || ''}>
                          {payout.status}
                        </Badge>
                        <p className="font-serif text-sm font-bold text-green">
                          ${(payout.amountCents / 100).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Settings ── */}
        <TabsContent value="settings" className="pt-6">
          <div className="max-w-lg space-y-6">
            {/* Company info */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Developer Profile
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Company Name
                  </label>
                  <Input
                    value={profile?.companyName || ''}
                    readOnly
                    className="border-border bg-midnight-elevated"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Support Email
                  </label>
                  <Input
                    value={profile?.supportEmail || ''}
                    readOnly
                    placeholder="Not set"
                    className="border-border bg-midnight-elevated"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Website
                  </label>
                  <Input
                    value={profile?.websiteUrl || ''}
                    readOnly
                    placeholder="Not set"
                    className="border-border bg-midnight-elevated"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Stripe Connect */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Stripe Connect
              </h3>
              {profile?.stripeOnboarded ? (
                <div className="rounded-lg border border-green/20 bg-green/5 p-4">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green" />
                    <span className="text-sm font-medium text-foreground">
                      Connected
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your Stripe account is active. Payouts will be sent
                    automatically.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-purple/20 bg-purple/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Connect your Stripe account
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Required to receive payouts and create paid apps.
                      </p>
                    </div>
                    <Button
                      className="bg-purple text-midnight hover:bg-purple/90"
                      onClick={handleConnectStripe}
                      disabled={connecting}
                    >
                      {connecting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Connect Stripe
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Revenue info */}
            <div className="rounded-lg border border-border bg-midnight-elevated p-4">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-green" />
                <span className="font-medium text-foreground">Revenue Split</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                You receive 80% of every sale. The marketplace retains 20% for
                platform services, payment processing, and security review.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Submit Modal */}
      <SubmitAppModal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        onSubmitted={refetch}
      />
    </div>
  )
}
