import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Toast from '@/components/layout/Toast'
import AuthModal from '@/components/modals/AuthModal'
import DevAuthModal from '@/components/modals/DevAuthModal'
import Landing from '@/pages/Landing'
import Store from '@/pages/Store'
import BuyerDashboard from '@/pages/BuyerDashboard'
import DevPortal from '@/pages/DevPortal'
import DevSubmit from '@/pages/DevSubmit'
import AdminReview from '@/pages/AdminReview'
import NotFound from '@/pages/NotFound'
import { initAuthListener } from '@/lib/firebase'

export default function App() {
  useEffect(() => {
    const unsubscribe = initAuthListener()
    return () => unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <TooltipProvider>
        <div className="flex min-h-screen flex-col bg-midnight">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/store" element={<Store />} />
              <Route path="/dashboard" element={<BuyerDashboard />} />
              <Route path="/dev" element={<DevPortal />} />
              <Route path="/dev/submit" element={<DevSubmit />} />
              <Route path="/admin/review" element={<AdminReview />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
          <Toast />
          <AuthModal />
          <DevAuthModal />
        </div>
      </TooltipProvider>
    </BrowserRouter>
  )
}
