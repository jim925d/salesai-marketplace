import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import type { App } from '@/store/useAppStore'

interface DashboardPreferences {
  dashboardLayout: 'grid' | 'compact' | 'list'
  appOrder: string[]
  pinnedApps: string[]
  quickLaunch: string[]
  customGroups: Array<{ name: string; appIds: string[] }>
  launcherMode: 'modal' | 'panel' | 'tab' | 'window'
}

const DEFAULT_PREFERENCES: DashboardPreferences = {
  dashboardLayout: 'grid',
  appOrder: [],
  pinnedApps: [],
  quickLaunch: [],
  customGroups: [],
  launcherMode: 'modal',
}

// Mock owned apps for demo (before Supabase is connected)
const MOCK_OWNED_APPS: App[] = [
  {
    id: '1', name: 'LeadSniper', slug: 'leadsniper', icon: '🎯',
    category: 'Prospecting', priceCents: 4900, description: 'AI-powered lead scoring and prioritization. Automatically identifies your highest-value prospects.',
    features: ['AI lead scoring', 'CRM integration', 'Real-time alerts'],
    status: 'approved', version: '2.1.0', totalInstalls: 1240, avgRating: 4.9, reviewCount: 89, developerName: 'SalesAI',
  },
  {
    id: '3', name: 'ProspectIQ', slug: 'prospectiq', icon: '🔍',
    category: 'Prospecting', priceCents: 0, description: 'Free prospecting tool with company enrichment and contact finder.',
    features: ['Company enrichment', 'Contact finder', 'Org charts'],
    status: 'approved', version: '3.0.0', totalInstalls: 2100, avgRating: 4.8, reviewCount: 134, developerName: 'SalesAI',
  },
  {
    id: '5', name: 'MeetingPrep AI', slug: 'meetingprep', icon: '🤖',
    category: 'Meeting Prep', priceCents: 1900, description: 'Auto-generates meeting briefs from CRM data, emails, and LinkedIn.',
    features: ['Auto briefs', 'CRM integration', 'LinkedIn insights'],
    status: 'approved', version: '2.0.0', totalInstalls: 1560, avgRating: 4.9, reviewCount: 112, developerName: 'SalesAI',
  },
  {
    id: '9', name: 'TaskPilot', slug: 'taskpilot', icon: '✈️',
    category: 'Productivity', priceCents: 0, description: 'AI-powered task prioritization for sales reps. Free forever.',
    features: ['AI prioritization', 'Calendar integration', 'Pipeline analysis'],
    status: 'approved', version: '1.1.0', totalInstalls: 1890, avgRating: 4.6, reviewCount: 98, developerName: 'SalesAI',
  },
]

export function useOwnedApps() {
  const { user } = useAuthStore()
  const [ownedApps, setOwnedApps] = useState<App[]>(MOCK_OWNED_APPS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.supabaseId) {
      setOwnedApps(MOCK_OWNED_APPS)
      return
    }

    // TODO: Fetch real owned apps from Supabase purchases table
    // For now, use mock data
    setLoading(false)
  }, [user?.supabaseId])

  return { ownedApps, loading, error, setOwnedApps }
}

export function useDashboardPreferences() {
  const { user } = useAuthStore()
  const [preferences, setPreferences] = useState<DashboardPreferences>(DEFAULT_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Load preferences
  useEffect(() => {
    if (!user?.supabaseId) {
      // Load from localStorage for unauthenticated or demo users
      const stored = localStorage.getItem('salesai_dashboard_prefs')
      if (stored) {
        try {
          setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) })
        } catch {
          // ignore
        }
      }
      setLoading(false)
      return
    }

    // Load from Supabase
    const loadPrefs = async () => {
      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.supabaseId!)
        .single()

      if (data) {
        setPreferences({
          dashboardLayout: data.dashboard_layout,
          appOrder: data.app_order,
          pinnedApps: data.pinned_apps,
          quickLaunch: data.quick_launch,
          customGroups: data.custom_groups.map((g) => ({
            name: g.name,
            appIds: g.app_ids,
          })),
          launcherMode: data.launcher_mode,
        })
      }
      setLoading(false)
    }

    loadPrefs()
  }, [user?.supabaseId])

  // Save preferences (debounced 500ms)
  const savePreferences = useCallback(
    (updated: Partial<DashboardPreferences>) => {
      const newPrefs = { ...preferences, ...updated }
      setPreferences(newPrefs)

      // Always save to localStorage as fallback
      localStorage.setItem('salesai_dashboard_prefs', JSON.stringify(newPrefs))

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        if (!user?.supabaseId) return

        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.supabaseId,
            dashboard_layout: newPrefs.dashboardLayout,
            app_order: newPrefs.appOrder,
            pinned_apps: newPrefs.pinnedApps,
            quick_launch: newPrefs.quickLaunch,
            custom_groups: newPrefs.customGroups.map((g) => ({
              name: g.name,
              app_ids: g.appIds,
            })),
            launcher_mode: newPrefs.launcherMode,
          })
      }, 500)
    },
    [preferences, user?.supabaseId]
  )

  return { preferences, loading, savePreferences }
}
