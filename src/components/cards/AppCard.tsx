import { Star, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { App } from '@/store/useAppStore'

interface AppCardProps {
  app: App
  index?: number
  owned?: boolean
  onSelect?: (app: App) => void
  onAdd?: (app: App) => void
}

export default function AppCard({ app, index = 0, owned, onSelect, onAdd }: AppCardProps) {
  const delay = index * 0.06

  return (
    <button
      type="button"
      onClick={() => onSelect?.(app)}
      className="group relative flex flex-col overflow-hidden rounded-[14px] border border-border bg-[rgba(230,237,243,0.02)] text-left transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(230,237,243,0.13)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Card content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Icon + header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-ice-border bg-ice-dim text-xl">
            {app.icon}
          </div>
          {app.category && (
            <Badge
              variant="secondary"
              className="border-border bg-midnight-elevated text-xs text-muted-foreground"
            >
              {app.category}
            </Badge>
          )}
        </div>

        {/* Name + developer */}
        <h3 className="text-sm font-medium text-foreground">{app.name}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
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
        </p>

        {/* Description */}
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {app.description}
        </p>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Rating + users */}
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 text-ice">
            <Star className="h-3 w-3 fill-ice" />
            {app.avgRating > 0 ? app.avgRating.toFixed(1) : '—'}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {app.totalInstalls.toLocaleString()}
          </span>
        </div>

        {/* Price + CTA */}
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="font-serif text-base font-bold text-foreground">
            {app.priceCents === 0
              ? 'Free'
              : `$${(app.priceCents / 100).toFixed(0)}`}
            {app.priceCents > 0 && (
              <span className="text-xs font-normal text-muted-foreground">
                /mo
              </span>
            )}
          </span>
          <Button
            size="sm"
            className={
              owned
                ? 'border-green/20 bg-green/10 text-green hover:bg-green/20'
                : 'bg-ice-dim text-ice hover:bg-ice/20'
            }
            onClick={(e) => {
              e.stopPropagation()
              if (!owned) onAdd?.(app)
            }}
          >
            {owned ? 'Owned' : 'Add'}
          </Button>
        </div>
      </div>

      {/* Hover progress bar */}
      <div className="absolute bottom-0 left-0 h-[2px] w-0 rounded-b-[14px] bg-gradient-to-r from-ice to-purple transition-all duration-500 group-hover:w-full" />
    </button>
  )
}
