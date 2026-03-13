import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import type { DevApp } from '@/components/cards/DevAppCard'

interface MonthlyRevenue {
  month: string
  amount: number
}

interface Payout {
  id: string
  amountCents: number
  status: 'pending' | 'processing' | 'paid' | 'failed'
  periodStart: string | null
  periodEnd: string | null
  paidAt: string | null
  createdAt: string
}

interface DevProfile {
  id: string
  companyName: string
  stripeConnectId: string | null
  stripeOnboarded: boolean
  websiteUrl: string | null
  supportEmail: string | null
  bio: string | null
}

// Mock data for demo
const MOCK_DEV_APPS: DevApp[] = [
  {
    id: '1', name: 'LeadSniper', icon: '🎯', slug: 'leadsniper', version: '2.1.0',
    status: 'approved', priceCents: 4900, totalInstalls: 1240, avgRating: 4.9,
    reviewCount: 89, totalRevenueCents: 485200,
  },
  {
    id: '3', name: 'ProspectIQ', icon: '🔍', slug: 'prospectiq', version: '3.0.0',
    status: 'approved', priceCents: 0, totalInstalls: 2100, avgRating: 4.8,
    reviewCount: 134, totalRevenueCents: 0,
  },
  {
    id: '5', name: 'MeetingPrep AI', icon: '🤖', slug: 'meetingprep', version: '2.0.0',
    status: 'approved', priceCents: 1900, totalInstalls: 1560, avgRating: 4.9,
    reviewCount: 112, totalRevenueCents: 236400,
  },
  {
    id: 'draft1', name: 'CallCoach Pro', icon: '🎙️', slug: 'callcoach-pro', version: '0.9.0',
    status: 'pending_review', priceCents: 2900, totalInstalls: 0, avgRating: 0,
    reviewCount: 0, totalRevenueCents: 0,
  },
]

const MOCK_MONTHLY_REVENUE: MonthlyRevenue[] = [
  { month: '2025-04', amount: 42000 },
  { month: '2025-05', amount: 48500 },
  { month: '2025-06', amount: 51200 },
  { month: '2025-07', amount: 55800 },
  { month: '2025-08', amount: 62300 },
  { month: '2025-09', amount: 58900 },
  { month: '2025-10', amount: 64100 },
  { month: '2025-11', amount: 71200 },
  { month: '2025-12', amount: 68400 },
  { month: '2026-01', amount: 75600 },
  { month: '2026-02', amount: 82100 },
  { month: '2026-03', amount: 79400 },
]

const MOCK_PAYOUTS: Payout[] = [
  {
    id: 'p1', amountCents: 63520, status: 'paid',
    periodStart: '2026-02-01', periodEnd: '2026-02-28',
    paidAt: '2026-03-05', createdAt: '2026-03-01',
  },
  {
    id: 'p2', amountCents: 60480, status: 'paid',
    periodStart: '2026-01-01', periodEnd: '2026-01-31',
    paidAt: '2026-02-05', createdAt: '2026-02-01',
  },
  {
    id: 'p3', amountCents: 56960, status: 'paid',
    periodStart: '2025-12-01', periodEnd: '2025-12-31',
    paidAt: '2026-01-05', createdAt: '2026-01-01',
  },
]

const MOCK_DEV_PROFILE: DevProfile = {
  id: 'dev1',
  companyName: 'SalesAI',
  stripeConnectId: null,
  stripeOnboarded: false,
  websiteUrl: null,
  supportEmail: null,
  bio: null,
}

export function useDevApps() {
  const { user } = useAuthStore()
  const [apps, setApps] = useState<DevApp[]>(MOCK_DEV_APPS)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.supabaseId) {
      setApps(MOCK_DEV_APPS)
      return
    }
    // TODO: Fetch real dev apps from Supabase
    setLoading(false)
  }, [user?.supabaseId])

  return { apps, loading, refetch: () => setApps([...apps]) }
}

export function useRevenue() {
  const { user } = useAuthStore()
  const [monthly, setMonthly] = useState<MonthlyRevenue[]>(MOCK_MONTHLY_REVENUE)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.supabaseId) {
      setMonthly(MOCK_MONTHLY_REVENUE)
      return
    }
    // TODO: Fetch real revenue from Supabase transactions
    setLoading(false)
  }, [user?.supabaseId])

  const totalRevenueCents = monthly.reduce((sum, m) => sum + m.amount, 0)
  const devShareCents = Math.round(totalRevenueCents * 0.8)

  return { monthly, totalRevenueCents, devShareCents, loading }
}

export function usePayouts() {
  const { user } = useAuthStore()
  const [payouts, setPayouts] = useState<Payout[]>(MOCK_PAYOUTS)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.supabaseId) {
      setPayouts(MOCK_PAYOUTS)
      return
    }
    // TODO: Fetch real payouts from Supabase
    setLoading(false)
  }, [user?.supabaseId])

  return { payouts, loading }
}

export function useDevProfile() {
  const { user } = useAuthStore()
  const [profile, setProfile] = useState<DevProfile | null>(MOCK_DEV_PROFILE)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.supabaseId) {
      setProfile(MOCK_DEV_PROFILE)
      return
    }

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('developer_profiles')
        .select('*')
        .eq('user_id', user.supabaseId!)
        .single()

      if (data) {
        setProfile({
          id: data.id,
          companyName: data.company_name,
          stripeConnectId: data.stripe_connect_id,
          stripeOnboarded: data.stripe_onboarded,
          websiteUrl: data.website_url,
          supportEmail: data.support_email,
          bio: data.bio,
        })
      }
      setLoading(false)
    }

    fetchProfile()
  }, [user?.supabaseId])

  return { profile, loading }
}
