import { create } from 'zustand'

export interface User {
  uid: string
  email: string
  name: string
  role: 'buyer' | 'developer' | 'admin'
  avatarUrl?: string
  supabaseId?: string
}

interface AuthState {
  user: User | null
  loading: boolean
  authModalOpen: boolean
  devAuthModalOpen: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  openAuthModal: () => void
  closeAuthModal: () => void
  openDevAuthModal: () => void
  closeDevAuthModal: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  authModalOpen: false,
  devAuthModalOpen: false,
  setUser: (user) => set({ user, loading: false, authModalOpen: false, devAuthModalOpen: false }),
  setLoading: (loading) => set({ loading }),
  openAuthModal: () => set({ authModalOpen: true }),
  closeAuthModal: () => set({ authModalOpen: false }),
  openDevAuthModal: () => set({ devAuthModalOpen: true }),
  closeDevAuthModal: () => set({ devAuthModalOpen: false }),
  logout: () => set({ user: null, loading: false }),
}))
