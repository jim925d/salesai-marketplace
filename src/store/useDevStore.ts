import { create } from 'zustand'

interface DevProfile {
  id: string
  companyName: string
  stripeConnectId?: string
  stripeOnboarded: boolean
  bio?: string
}

interface DevState {
  profile: DevProfile | null
  apps: Array<{
    id: string
    name: string
    status: string
    totalInstalls: number
    totalRevenueCents: number
    avgRating: number
  }>
  loading: boolean
  setProfile: (profile: DevProfile | null) => void
  setApps: (apps: DevState['apps']) => void
  setLoading: (loading: boolean) => void
}

export const useDevStore = create<DevState>((set) => ({
  profile: null,
  apps: [],
  loading: true,
  setProfile: (profile) => set({ profile }),
  setApps: (apps) => set({ apps, loading: false }),
  setLoading: (loading) => set({ loading }),
}))
