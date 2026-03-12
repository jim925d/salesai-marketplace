import { create } from 'zustand'

export interface App {
  id: string
  name: string
  slug: string
  icon: string
  category: 'Outreach' | 'Prospecting' | 'Meeting Prep' | 'Productivity'
  priceCents: number
  description: string
  longDescription?: string
  features: string[]
  status: string
  securityScore?: number
  version: string
  totalInstalls: number
  avgRating: number
  reviewCount: number
  developerName?: string
}

interface AppState {
  apps: App[]
  loading: boolean
  searchQuery: string
  selectedCategory: string | null
  sortBy: 'popular' | 'newest' | 'price-low' | 'price-high' | 'rating'
  setApps: (apps: App[]) => void
  setLoading: (loading: boolean) => void
  setSearchQuery: (query: string) => void
  setSelectedCategory: (category: string | null) => void
  setSortBy: (sort: AppState['sortBy']) => void
}

export const useAppStore = create<AppState>((set) => ({
  apps: [],
  loading: true,
  searchQuery: '',
  selectedCategory: null,
  sortBy: 'popular',
  setApps: (apps) => set({ apps, loading: false }),
  setLoading: (loading) => set({ loading }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setSortBy: (sortBy) => set({ sortBy }),
}))
