import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { getAuth } from 'firebase/auth'
import { sanitize } from '@/lib/sanitize'

export interface ReviewApp {
  id: string
  name: string
  icon: string
  slug: string
  category: string
  description: string
  longDescription: string | null
  priceCents: number
  status: string
  securityScore: number
  filePath: string
  rejectionReason: string | null
  createdAt: string
  developer: {
    id: string
    companyName: string
    email: string
  }
}

// Mock data for demo
const MOCK_REVIEW_QUEUE: ReviewApp[] = [
  {
    id: 'r1',
    name: 'DealTracker Pro',
    icon: '📊',
    slug: 'dealtracker-pro',
    category: 'Productivity',
    description: 'Track deal progress with AI-powered insights and pipeline analytics.',
    longDescription: null,
    priceCents: 3900,
    status: 'pending_review',
    securityScore: 95,
    filePath: 'apps/dealtracker-pro.html',
    rejectionReason: null,
    createdAt: '2026-03-10T14:30:00Z',
    developer: { id: 'dev1', companyName: 'SalesTools Inc.', email: 'dev@salestools.io' },
  },
  {
    id: 'r2',
    name: 'EmailWizard',
    icon: '✉️',
    slug: 'emailwizard',
    category: 'Outreach',
    description: 'Generate personalized cold emails using prospect research and AI.',
    longDescription: null,
    priceCents: 2900,
    status: 'pending_review',
    securityScore: 82,
    filePath: 'apps/emailwizard.html',
    rejectionReason: null,
    createdAt: '2026-03-11T09:15:00Z',
    developer: { id: 'dev2', companyName: 'OutreachLabs', email: 'hello@outreachlabs.com' },
  },
  {
    id: 'r3',
    name: 'CompetitorRadar',
    icon: '📡',
    slug: 'competitorradar',
    category: 'Prospecting',
    description: 'Monitor competitor activity and get real-time alerts on market moves.',
    longDescription: null,
    priceCents: 0,
    status: 'in_review',
    securityScore: 71,
    filePath: 'apps/competitorradar.html',
    rejectionReason: null,
    createdAt: '2026-03-09T16:45:00Z',
    developer: { id: 'dev3', companyName: 'MarketSense AI', email: 'team@marketsense.ai' },
  },
  {
    id: 'r4',
    name: 'ShadyTracker',
    icon: '👀',
    slug: 'shadytracker',
    category: 'Productivity',
    description: 'Track everything with advanced analytics and reporting.',
    longDescription: null,
    priceCents: 4900,
    status: 'pending_review',
    securityScore: 38,
    filePath: 'apps/shadytracker.html',
    rejectionReason: null,
    createdAt: '2026-03-12T11:00:00Z',
    developer: { id: 'dev4', companyName: 'QuickApps LLC', email: 'support@quickapps.co' },
  },
]

export function useReviewQueue() {
  const { user } = useAuthStore()
  const [queue, setQueue] = useState<ReviewApp[]>(MOCK_REVIEW_QUEUE)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.supabaseId || user.role !== 'admin') {
      setQueue(MOCK_REVIEW_QUEUE)
      return
    }

    const fetchQueue = async () => {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('apps')
        .select(`
          id, name, icon, slug, category, description, long_description,
          price_cents, status, security_score, file_path, rejection_reason, created_at,
          developer_profiles!inner(id, company_name, users!inner(email))
        `)
        .in('status', ['pending_review', 'in_review'])
        .order('created_at', { ascending: true })

      if (fetchError) {
        setError(fetchError.message)
      } else if (data) {
        setQueue(
          data.map((app: Record<string, unknown>) => {
            const devProfile = app.developer_profiles as Record<string, unknown>
            const devUser = devProfile.users as Record<string, unknown>
            return {
              id: app.id as string,
              name: app.name as string,
              icon: app.icon as string,
              slug: app.slug as string,
              category: app.category as string,
              description: app.description as string,
              longDescription: app.long_description as string | null,
              priceCents: app.price_cents as number,
              status: app.status as string,
              securityScore: app.security_score as number,
              filePath: app.file_path as string,
              rejectionReason: app.rejection_reason as string | null,
              createdAt: app.created_at as string,
              developer: {
                id: devProfile.id as string,
                companyName: devProfile.company_name as string,
                email: devUser.email as string,
              },
            }
          })
        )
      }
      setLoading(false)
    }

    fetchQueue()
  }, [user?.supabaseId, user?.role])

  const refetch = useCallback(() => {
    setQueue((prev) => [...prev])
  }, [])

  const reviewApp = useCallback(
    async (appId: string, action: 'approve' | 'reject', reason?: string) => {
      const currentUser = getAuth().currentUser
      if (!currentUser) return { error: 'Not authenticated' }

      const token = await currentUser.getIdToken(true)

      const res = await fetch('/api/review-app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ appId, action, reason: reason ? sanitize(reason) : undefined }),
      })

      const data = await res.json()
      if (!res.ok) return { error: data.error || 'Review failed' }

      // Remove from local queue
      setQueue((prev) => prev.filter((app) => app.id !== appId))
      return data
    },
    []
  )

  return { queue, loading, error, refetch, reviewApp }
}
