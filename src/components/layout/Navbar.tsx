import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { signOut } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Store, LayoutDashboard, Code2, Shield, LogOut, Settings, ChevronDown } from 'lucide-react'

export default function Navbar() {
  const { user, openAuthModal } = useAuthStore()
  const location = useLocation()

  const navLinks = [
    { to: '/store', label: 'Store', icon: Store },
    ...(user
      ? [{ to: '/dashboard', label: 'My Apps', icon: LayoutDashboard }]
      : []),
    ...(user?.role === 'developer'
      ? [{ to: '/dev', label: 'Developer', icon: Code2 }]
      : []),
    ...(user?.role === 'admin'
      ? [{ to: '/admin/review', label: 'Review', icon: Shield }]
      : []),
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out')
    } catch {
      toast.error('Failed to sign out')
    }
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-midnight/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ice/10">
            <span className="text-sm font-bold text-ice">S</span>
          </div>
          <span className="font-serif text-lg text-foreground">
            SalesAI
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const Icon = link.icon
            const isActive = location.pathname.startsWith(link.to)
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-ice/10 text-ice'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-ice/10 text-xs text-ice">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm text-foreground md:inline">
                  {user.name}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 border-border bg-midnight-card"
              >
                <DropdownMenuItem className="text-muted-foreground">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-red"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={openAuthModal}
              >
                Sign in
              </Button>
              <Button
                size="sm"
                className="bg-ice text-midnight hover:bg-ice/90"
                onClick={openAuthModal}
              >
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
