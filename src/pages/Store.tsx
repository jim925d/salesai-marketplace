import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, ChevronDown } from 'lucide-react'
import AppCard from '@/components/cards/AppCard'
import AppDetailModal from '@/components/modals/AppDetailModal'
import AppLauncher, { type LaunchMode } from '@/components/modals/AppLauncher'
import { useAuthStore } from '@/store/useAuthStore'
import { useApps } from '@/hooks/useApps'
import { createCheckout } from '@/lib/stripe'
import { toast } from 'sonner'
import type { App } from '@/store/useAppStore'

const categories = ['All', 'Outreach', 'Prospecting', 'Meeting Prep', 'Productivity'] as const

const sortOptions = [
  { value: 'popular', label: 'Popular' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price-low', label: 'Price ↑' },
  { value: 'price-high', label: 'Price ↓' },
  { value: 'newest', label: 'Newest' },
] as const

type SortValue = (typeof sortOptions)[number]['value']

export default function Store() {
  const { user, openAuthModal } = useAuthStore()
  const { apps: allApps } = useApps()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [sortBy, setSortBy] = useState<SortValue>('popular')
  const [selectedApp, setSelectedApp] = useState<App | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [launchApp, setLaunchApp] = useState<App | null>(null)
  const [launchOpen, setLaunchOpen] = useState(false)
  const [launchMode, setLaunchMode] = useState<LaunchMode>('modal')

  // TODO: Replace with real owned apps from Supabase
  const ownedAppIds = new Set<string>()

  const filteredApps = useMemo(() => {
    let result = [...allApps]

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (app) =>
          app.name.toLowerCase().includes(q) ||
          (app.developerName?.toLowerCase().includes(q) ?? false)
      )
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter((app) => app.category === selectedCategory)
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => b.totalInstalls - a.totalInstalls)
        break
      case 'rating':
        result.sort((a, b) => b.avgRating - a.avgRating)
        break
      case 'price-low':
        result.sort((a, b) => a.priceCents - b.priceCents)
        break
      case 'price-high':
        result.sort((a, b) => b.priceCents - a.priceCents)
        break
      case 'newest':
        result.sort((a, b) => b.id.localeCompare(a.id))
        break
    }

    return result
  }, [searchQuery, selectedCategory, sortBy])

  const handleSelect = (app: App) => {
    setSelectedApp(app)
    setDetailOpen(true)
  }

  const handlePurchase = async (app: App) => {
    if (!user) {
      openAuthModal()
      return
    }

    try {
      const result = await createCheckout(app.id)

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.free) {
        toast.success(`${app.name} added to your workspace!`)
        return
      }

      if (result.sessionUrl) {
        window.location.href = result.sessionUrl
      }
    } catch {
      toast.error('Failed to start checkout')
    }
  }

  const currentSortLabel =
    sortOptions.find((o) => o.value === sortBy)?.label ?? 'Popular'

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl tracking-tight text-foreground md:text-4xl">
          Marketplace
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {filteredApps.length} tools · {new Set(allApps.map((a: App) => a.developerName)).size} developers
        </p>
      </div>

      {/* Search + Filters */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search apps or developers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-border bg-midnight-card pl-9"
          />
        </div>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg border border-border bg-midnight-card px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
            Sort: {currentSortLabel}
            <ChevronDown className="h-3 w-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="border-border bg-midnight-card"
          >
            {sortOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={
                  sortBy === opt.value
                    ? 'text-ice'
                    : 'text-muted-foreground'
                }
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Category pills */}
      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            size="sm"
            variant={selectedCategory === cat ? 'default' : 'outline'}
            className={
              selectedCategory === cat
                ? 'bg-ice text-midnight hover:bg-ice/90'
                : 'border-border text-muted-foreground hover:text-foreground'
            }
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* App Grid */}
      {filteredApps.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-lg text-muted-foreground">
            No tools found matching your search.
          </p>
          <Button
            variant="outline"
            className="mt-4 border-border text-muted-foreground"
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('All')
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
          }}
        >
          {filteredApps.map((app, i) => (
            <AppCard
              key={app.id}
              app={app}
              index={i}
              owned={ownedAppIds.has(app.id)}
              onSelect={handleSelect}
              onAdd={handlePurchase}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AppDetailModal
        app={selectedApp}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        owned={selectedApp ? ownedAppIds.has(selectedApp.id) : false}
        onPurchase={handlePurchase}
        onLaunch={(app) => {
          setDetailOpen(false)
          setLaunchApp(app)
          setLaunchOpen(true)
        }}
      />

      {/* App Launcher */}
      <AppLauncher
        app={launchApp}
        open={launchOpen}
        mode={launchMode}
        onClose={() => { setLaunchOpen(false); setLaunchApp(null) }}
        onChangeMode={setLaunchMode}
      />
    </div>
  )
}
