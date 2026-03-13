import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Star, Pin, PinOff, Play, Trash2, GripVertical } from 'lucide-react'
import type { App } from '@/store/useAppStore'

type LayoutMode = 'grid' | 'compact' | 'list'

interface DashboardCardProps {
  app: App
  layout: LayoutMode
  pinned?: boolean
  onLaunch?: (app: App) => void
  onPin?: (app: App) => void
  onRemove?: (app: App) => void
}

export default function DashboardCard({
  app,
  layout,
  pinned,
  onLaunch,
  onPin,
  onRemove,
}: DashboardCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  if (layout === 'list') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-3 rounded-xl border border-border bg-[rgba(230,237,243,0.02)] p-3 transition-colors hover:border-[rgba(230,237,243,0.13)]"
      >
        <button
          type="button"
          className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ice-border bg-ice-dim text-lg">
          {app.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{app.name}</p>
          <p className="text-xs text-muted-foreground">
            {app.developerName || 'Unknown'}
          </p>
        </div>
        <span className="flex items-center gap-1 text-xs text-ice">
          <Star className="h-3 w-3 fill-ice" />
          {app.avgRating > 0 ? app.avgRating.toFixed(1) : '—'}
        </span>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => onPin?.(app)}
          >
            {pinned ? (
              <PinOff className="h-3.5 w-3.5" />
            ) : (
              <Pin className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            size="sm"
            className="h-7 bg-ice text-midnight hover:bg-ice/90"
            onClick={() => onLaunch?.(app)}
          >
            <Play className="mr-1 h-3 w-3" />
            Launch
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-red"
            onClick={() => onRemove?.(app)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  if (layout === 'compact') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="group relative flex items-center gap-3 rounded-xl border border-border bg-[rgba(230,237,243,0.02)] p-3 transition-all hover:-translate-y-0.5 hover:border-[rgba(230,237,243,0.13)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
      >
        <button
          type="button"
          className="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ice-border bg-ice-dim text-lg">
          {app.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{app.name}</p>
        </div>
        {pinned && <Pin className="h-3 w-3 text-ice" />}
        <Button
          size="sm"
          className="h-7 bg-ice/10 text-ice hover:bg-ice/20"
          onClick={() => onLaunch?.(app)}
        >
          <Play className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  // Grid layout (default)
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex flex-col overflow-hidden rounded-[14px] border border-border bg-[rgba(230,237,243,0.02)] transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(230,237,243,0.13)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
    >
      {/* Drag handle */}
      <button
        type="button"
        className="absolute right-2 top-2 cursor-grab rounded p-1 opacity-0 transition-opacity hover:bg-midnight-elevated group-hover:opacity-100 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="flex flex-1 flex-col p-5">
        {/* Icon + pin */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-ice-border bg-ice-dim text-xl">
            {app.icon}
          </div>
          {pinned && <Pin className="h-3.5 w-3.5 text-ice" />}
        </div>

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
          {app.developerName || 'Unknown'}
        </p>

        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {app.description}
        </p>

        <div className="flex-1" />

        {/* Rating */}
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 text-ice">
            <Star className="h-3 w-3 fill-ice" />
            {app.avgRating > 0 ? app.avgRating.toFixed(1) : '—'}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => onPin?.(app)}
            >
              {pinned ? (
                <PinOff className="h-3.5 w-3.5" />
              ) : (
                <Pin className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-red"
              onClick={() => onRemove?.(app)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button
            size="sm"
            className="bg-ice text-midnight hover:bg-ice/90"
            onClick={() => onLaunch?.(app)}
          >
            <Play className="mr-1 h-3 w-3" />
            Launch
          </Button>
        </div>
      </div>

      {/* Hover progress bar */}
      <div className="absolute bottom-0 left-0 h-[2px] w-0 rounded-b-[14px] bg-gradient-to-r from-ice to-purple transition-all duration-500 group-hover:w-full" />
    </div>
  )
}
