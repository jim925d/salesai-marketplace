import { Badge } from '@/components/ui/badge'
import { Star, Users, DollarSign, TrendingUp } from 'lucide-react'

interface DevApp {
  id: string
  name: string
  icon: string
  slug: string
  version: string
  status: string
  priceCents: number
  totalInstalls: number
  avgRating: number
  reviewCount: number
  totalRevenueCents: number
}

interface DevAppCardProps {
  app: DevApp
  onClick?: (app: DevApp) => void
}

const statusConfig: Record<string, { label: string; className: string }> = {
  approved: { label: 'Live', className: 'bg-green/10 text-green' },
  pending_review: { label: 'Pending', className: 'bg-yellow/10 text-yellow' },
  in_review: { label: 'In Review', className: 'bg-ice/10 text-ice' },
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  rejected: { label: 'Rejected', className: 'bg-red/10 text-red' },
  suspended: { label: 'Suspended', className: 'bg-red/10 text-red' },
}

export type { DevApp }

export default function DevAppCard({ app, onClick }: DevAppCardProps) {
  const status = statusConfig[app.status] || statusConfig.draft

  return (
    <button
      type="button"
      onClick={() => onClick?.(app)}
      className="group relative flex flex-col overflow-hidden rounded-[14px] border border-border bg-[rgba(230,237,243,0.02)] text-left transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(230,237,243,0.13)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex flex-1 flex-col p-5">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-ice-border bg-ice-dim text-xl">
            {app.icon}
          </div>
          <Badge className={status.className}>{status.label}</Badge>
        </div>

        {/* Name + version */}
        <h3 className="text-sm font-medium text-foreground">{app.name}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">v{app.version}</p>

        <div className="flex-1" />

        {/* Stats grid */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border bg-midnight-elevated p-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              Price
            </div>
            <p className="mt-0.5 font-serif text-sm font-bold text-foreground">
              {app.priceCents === 0
                ? 'Free'
                : `$${(app.priceCents / 100).toFixed(0)}/mo`}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-midnight-elevated p-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              Installs
            </div>
            <p className="mt-0.5 font-serif text-sm font-bold text-ice">
              {app.totalInstalls.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-midnight-elevated p-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3" />
              Rating
            </div>
            <p className="mt-0.5 font-serif text-sm font-bold text-orange">
              {app.avgRating > 0 ? app.avgRating.toFixed(1) : '—'}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-midnight-elevated p-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Earnings
            </div>
            <p className="mt-0.5 font-serif text-sm font-bold text-green">
              ${((app.totalRevenueCents * 0.8) / 100).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Hover progress bar */}
      <div className="absolute bottom-0 left-0 h-[2px] w-0 rounded-b-[14px] bg-gradient-to-r from-purple to-ice transition-all duration-500 group-hover:w-full" />
    </button>
  )
}
