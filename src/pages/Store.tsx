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
import { useAuthStore } from '@/store/useAuthStore'
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

// Mock apps for demo
const mockApps: App[] = [
  {
    id: '1', name: 'LeadSniper', slug: 'leadsniper', icon: '🎯',
    category: 'Prospecting', priceCents: 4900, description: 'AI-powered lead scoring and prioritization. Automatically identifies your highest-value prospects.',
    longDescription: 'LeadSniper uses advanced machine learning to analyze your CRM data and identify the leads most likely to convert. It scores every lead based on engagement signals, firmographic data, and behavioral patterns.',
    features: ['AI lead scoring', 'CRM integration', 'Real-time alerts', 'Custom scoring models', 'Team leaderboards'],
    status: 'approved', version: '2.1.0', totalInstalls: 1240, avgRating: 4.9, reviewCount: 89, developerName: 'SalesAI',
  },
  {
    id: '2', name: 'ColdCraft', slug: 'coldcraft', icon: '📧',
    category: 'Outreach', priceCents: 2900, description: 'Generate personalized cold emails that actually get replies. Powered by GPT-4.',
    longDescription: 'ColdCraft analyzes your prospect\'s LinkedIn, company website, and recent news to generate hyper-personalized cold emails. Average reply rate: 23%.',
    features: ['AI email generation', 'Personalization engine', 'A/B testing', 'Analytics dashboard', 'Sequence builder'],
    status: 'approved', version: '1.8.0', totalInstalls: 890, avgRating: 4.7, reviewCount: 67, developerName: 'OutreachLabs',
  },
  {
    id: '3', name: 'ProspectIQ', slug: 'prospectiq', icon: '🔍',
    category: 'Prospecting', priceCents: 0, description: 'Free prospecting tool with company enrichment and contact finder.',
    longDescription: 'ProspectIQ gives you instant access to company data, org charts, and verified contact information. Free for up to 100 lookups/month.',
    features: ['Company enrichment', 'Contact finder', 'Org charts', 'Chrome extension', 'CRM sync'],
    status: 'approved', version: '3.0.0', totalInstalls: 2100, avgRating: 4.8, reviewCount: 134, developerName: 'SalesAI',
  },
  {
    id: '4', name: 'DealFlow', slug: 'dealflow', icon: '📊',
    category: 'Productivity', priceCents: 3900, description: 'Visual pipeline management with AI deal predictions and coaching.',
    longDescription: 'DealFlow gives your sales team a beautiful, AI-enhanced pipeline view. Predict close dates, get deal coaching, and never miss a follow-up.',
    features: ['Visual pipeline', 'AI predictions', 'Deal coaching', 'Slack notifications', 'Forecast reports'],
    status: 'approved', version: '1.5.0', totalInstalls: 670, avgRating: 4.6, reviewCount: 45, developerName: 'RevOps Co',
  },
  {
    id: '5', name: 'MeetingPrep AI', slug: 'meetingprep', icon: '🤖',
    category: 'Meeting Prep', priceCents: 1900, description: 'Auto-generates meeting briefs from CRM data, emails, and LinkedIn.',
    longDescription: 'Never walk into a meeting unprepared. MeetingPrep AI pulls data from your CRM, recent emails, and LinkedIn to create comprehensive meeting briefs in seconds.',
    features: ['Auto briefs', 'CRM integration', 'LinkedIn insights', 'Calendar sync', 'Team sharing'],
    status: 'approved', version: '2.0.0', totalInstalls: 1560, avgRating: 4.9, reviewCount: 112, developerName: 'SalesAI',
  },
  {
    id: '6', name: 'SequenceHQ', slug: 'sequencehq', icon: '⚡',
    category: 'Outreach', priceCents: 5900, description: 'Multi-channel outreach sequences with AI optimization and analytics.',
    longDescription: 'SequenceHQ lets you build multi-channel sequences across email, LinkedIn, phone, and SMS. AI optimizes send times and messaging for maximum engagement.',
    features: ['Multi-channel sequences', 'AI send-time optimization', 'A/B testing', 'Team templates', 'Advanced analytics'],
    status: 'approved', version: '1.2.0', totalInstalls: 430, avgRating: 4.5, reviewCount: 28, developerName: 'GrowthStack',
  },
  {
    id: '7', name: 'SignalTracker', slug: 'signaltracker', icon: '📡',
    category: 'Prospecting', priceCents: 6900, description: 'Track buying signals across the web — job postings, funding rounds, tech stack changes.',
    longDescription: 'SignalTracker monitors the web for buying signals that indicate purchase intent. Know when your prospects are hiring, raising funds, or adopting new technology.',
    features: ['Intent signals', 'Job posting alerts', 'Funding round tracking', 'Tech stack monitoring', 'Slack alerts'],
    status: 'approved', version: '1.0.0', totalInstalls: 310, avgRating: 4.4, reviewCount: 19, developerName: 'DataPulse',
  },
  {
    id: '8', name: 'CallCoach', slug: 'callcoach', icon: '🎙️',
    category: 'Meeting Prep', priceCents: 4900, description: 'AI call analysis with real-time coaching and conversation intelligence.',
    longDescription: 'CallCoach records and analyzes your sales calls in real-time. Get live coaching prompts, talk-time analysis, and automatic CRM updates.',
    features: ['Call recording', 'Real-time coaching', 'Talk-time analysis', 'CRM auto-update', 'Team scorecards'],
    status: 'approved', version: '2.3.0', totalInstalls: 780, avgRating: 4.7, reviewCount: 56, developerName: 'VoiceAI',
  },
  {
    id: '9', name: 'TaskPilot', slug: 'taskpilot', icon: '✈️',
    category: 'Productivity', priceCents: 0, description: 'AI-powered task prioritization for sales reps. Free forever.',
    longDescription: 'TaskPilot analyzes your pipeline and suggests the optimal order of tasks each day. Focus on what moves deals forward.',
    features: ['AI prioritization', 'Calendar integration', 'Pipeline analysis', 'Daily digest', 'Mobile app'],
    status: 'approved', version: '1.1.0', totalInstalls: 1890, avgRating: 4.6, reviewCount: 98, developerName: 'SalesAI',
  },
]

export default function Store() {
  const { user, openAuthModal } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [sortBy, setSortBy] = useState<SortValue>('popular')
  const [selectedApp, setSelectedApp] = useState<App | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // TODO: Replace with real owned apps from Supabase
  const ownedAppIds = new Set<string>()

  const filteredApps = useMemo(() => {
    let result = [...mockApps]

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
          {filteredApps.length} tools · {new Set(mockApps.map((a) => a.developerName)).size} developers
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
      />
    </div>
  )
}
