import { useState, useMemo, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LayoutGrid,
  List,
  Rows3,
  Play,
  Settings,
  Shield,
  Plus,
  FolderPlus,
  X,
} from 'lucide-react'
import DashboardCard from '@/components/cards/DashboardCard'
import AppLauncher from '@/components/modals/AppLauncher'
import SettingsModal from '@/components/modals/SettingsModal'
import { useOwnedApps, useDashboardPreferences } from '@/hooks/useOwnedApps'
import { useAuthStore } from '@/store/useAuthStore'
import { KeyVault } from '@/lib/key-vault'
import type { App } from '@/store/useAppStore'
import type { LaunchMode } from '@/components/modals/AppLauncher'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

export default function BuyerDashboard() {
  const { user: _user } = useAuthStore()
  const { ownedApps } = useOwnedApps()
  const { preferences, savePreferences } = useDashboardPreferences()

  // Local state
  const [launcherApp, setLauncherApp] = useState<App | null>(null)
  const [launcherOpen, setLauncherOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [keyStatus, setKeyStatus] = useState({ openai: false, anthropic: false })
  const [newGroupName, setNewGroupName] = useState('')
  const [showNewGroup, setShowNewGroup] = useState(false)

  // Load key status on mount
  useState(() => {
    KeyVault.getStatus().then(setKeyStatus)
  })

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Ordered apps based on preferences
  const orderedApps = useMemo(() => {
    if (preferences.appOrder.length === 0) return ownedApps
    const orderMap = new Map(preferences.appOrder.map((id, i) => [id, i]))
    return [...ownedApps].sort((a, b) => {
      const ai = orderMap.get(a.id) ?? Infinity
      const bi = orderMap.get(b.id) ?? Infinity
      return ai - bi
    })
  }, [ownedApps, preferences.appOrder])

  // Quick launch apps (top 5 pinned or first 5)
  const quickLaunchApps = useMemo(() => {
    if (preferences.quickLaunch.length > 0) {
      return preferences.quickLaunch
        .map((id) => ownedApps.find((a) => a.id === id))
        .filter(Boolean) as App[]
    }
    // Default: pinned apps first, then by order, max 5
    const pinned = orderedApps.filter((a) => preferences.pinnedApps.includes(a.id))
    const rest = orderedApps.filter((a) => !preferences.pinnedApps.includes(a.id))
    return [...pinned, ...rest].slice(0, 5)
  }, [ownedApps, orderedApps, preferences.pinnedApps, preferences.quickLaunch])

  // Group apps
  const groupedApps = useMemo(() => {
    const groups = preferences.customGroups.map((group) => ({
      name: group.name,
      apps: group.appIds
        .map((id) => ownedApps.find((a) => a.id === id))
        .filter(Boolean) as App[],
    }))
    // Ungrouped apps
    const groupedIds = new Set(preferences.customGroups.flatMap((g) => g.appIds))
    const ungrouped = orderedApps.filter((a) => !groupedIds.has(a.id))
    return { groups, ungrouped }
  }, [ownedApps, orderedApps, preferences.customGroups])

  // Handlers
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = orderedApps.findIndex((a) => a.id === active.id)
      const newIndex = orderedApps.findIndex((a) => a.id === over.id)
      const newOrder = arrayMove(orderedApps, oldIndex, newIndex).map((a) => a.id)
      savePreferences({ appOrder: newOrder })
    },
    [orderedApps, savePreferences]
  )

  const handleLaunch = useCallback(
    (app: App) => {
      setLauncherApp(app)
      setLauncherOpen(true)
    },
    []
  )

  const handlePin = useCallback(
    (app: App) => {
      const isPinned = preferences.pinnedApps.includes(app.id)
      const newPinned = isPinned
        ? preferences.pinnedApps.filter((id) => id !== app.id)
        : [...preferences.pinnedApps, app.id]
      savePreferences({ pinnedApps: newPinned })
      toast.success(isPinned ? `Unpinned ${app.name}` : `Pinned ${app.name}`)
    },
    [preferences.pinnedApps, savePreferences]
  )

  const handleRemove = useCallback(
    (app: App) => {
      // Remove from all preference arrays
      savePreferences({
        appOrder: preferences.appOrder.filter((id) => id !== app.id),
        pinnedApps: preferences.pinnedApps.filter((id) => id !== app.id),
        quickLaunch: preferences.quickLaunch.filter((id) => id !== app.id),
        customGroups: preferences.customGroups.map((g) => ({
          ...g,
          appIds: g.appIds.filter((id) => id !== app.id),
        })),
      })
      toast.success(`Removed ${app.name}`)
    },
    [preferences, savePreferences]
  )

  const handleLayoutChange = useCallback(
    (value: string) => {
      savePreferences({ dashboardLayout: value as 'grid' | 'compact' | 'list' })
    },
    [savePreferences]
  )

  const handleLaunchModeChange = useCallback(
    (mode: LaunchMode) => {
      savePreferences({ launcherMode: mode })
    },
    [savePreferences]
  )

  const handleCreateGroup = useCallback(() => {
    if (!newGroupName.trim()) return
    const newGroups = [
      ...preferences.customGroups,
      { name: newGroupName.trim(), appIds: [] },
    ]
    savePreferences({ customGroups: newGroups })
    setNewGroupName('')
    setShowNewGroup(false)
    toast.success(`Created group "${newGroupName.trim()}"`)
  }, [newGroupName, preferences.customGroups, savePreferences])

  const handleDeleteGroup = useCallback(
    (groupName: string) => {
      savePreferences({
        customGroups: preferences.customGroups.filter((g) => g.name !== groupName),
      })
      toast.success(`Deleted group "${groupName}"`)
    },
    [preferences.customGroups, savePreferences]
  )

  const layout = preferences.dashboardLayout
  const sortingStrategy =
    layout === 'list' ? verticalListSortingStrategy : rectSortingStrategy

  // Empty state
  if (ownedApps.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">
          My Apps
        </h1>
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-midnight-elevated text-2xl">
            📦
          </div>
          <h2 className="mt-4 font-serif text-xl text-foreground">
            No apps yet
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Browse the marketplace to find AI sales tools that will supercharge
            your workflow.
          </p>
          <Button
            asChild
            className="mt-6 bg-ice text-midnight hover:bg-ice/90"
          >
            <Link to="/store">Browse marketplace</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-foreground md:text-4xl">
            My Apps
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ownedApps.length} installed tool{ownedApps.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Layout toggle */}
          <Tabs value={layout} onValueChange={handleLayoutChange}>
            <TabsList className="bg-midnight-elevated">
              <TabsTrigger value="grid" className="px-2">
                <LayoutGrid className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="compact" className="px-2">
                <Rows3 className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="px-2">
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            size="sm"
            variant="outline"
            className="border-border text-muted-foreground hover:text-foreground"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="mr-1.5 h-3.5 w-3.5" />
            Settings
          </Button>
        </div>
      </div>

      {/* API key banner */}
      {!keyStatus.openai && !keyStatus.anthropic && (
        <div className="mb-6 rounded-lg border border-ice/20 bg-ice/[0.03] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-ice" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Set up your API keys
                </p>
                <p className="text-xs text-muted-foreground">
                  Encrypted with AES-256-GCM — keys never leave your browser
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-ice text-midnight hover:bg-ice/90"
              onClick={() => setSettingsOpen(true)}
            >
              Add keys
            </Button>
          </div>
        </div>
      )}

      {/* Quick Launch bar */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Quick Launch
        </h2>
        <div className="flex flex-wrap gap-2">
          {quickLaunchApps.map((app) => (
            <button
              key={app.id}
              type="button"
              className="flex items-center gap-2 rounded-xl border border-border bg-[rgba(230,237,243,0.02)] px-3 py-2 transition-all hover:-translate-y-0.5 hover:border-[rgba(230,237,243,0.13)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
              onClick={() => handleLaunch(app)}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-ice-border bg-ice-dim text-sm">
                {app.icon}
              </div>
              <span className="text-sm text-foreground">{app.name}</span>
              <Play className="h-3 w-3 text-ice" />
            </button>
          ))}
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Custom Groups */}
      {groupedApps.groups.map((group) => (
        <div key={group.name} className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium text-foreground">
                {group.name}
              </h2>
              <Badge
                variant="secondary"
                className="border-border bg-midnight-elevated text-xs"
              >
                {group.apps.length}
              </Badge>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-red"
              onClick={() => handleDeleteGroup(group.name)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          {group.apps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Drag apps here to organize them.
            </p>
          ) : (
            <div
              className={
                layout === 'list'
                  ? 'space-y-2'
                  : 'grid gap-4'
              }
              style={
                layout !== 'list'
                  ? { gridTemplateColumns: layout === 'compact' ? 'repeat(auto-fill, minmax(200px, 1fr))' : 'repeat(auto-fill, minmax(310px, 1fr))' }
                  : undefined
              }
            >
              {group.apps.map((app) => (
                <DashboardCard
                  key={app.id}
                  app={app}
                  layout={layout}
                  pinned={preferences.pinnedApps.includes(app.id)}
                  onLaunch={handleLaunch}
                  onPin={handlePin}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* New group form */}
      <div className="mb-6">
        {showNewGroup ? (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Group name..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
              className="max-w-xs border-border bg-midnight-card"
              autoFocus
            />
            <Button
              size="sm"
              className="bg-ice text-midnight hover:bg-ice/90"
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim()}
            >
              Create
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => {
                setShowNewGroup(false)
                setNewGroupName('')
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="border-border text-muted-foreground hover:text-foreground"
            onClick={() => setShowNewGroup(true)}
          >
            <FolderPlus className="mr-1.5 h-3.5 w-3.5" />
            New group
          </Button>
        )}
      </div>

      {/* Main apps grid (ungrouped) */}
      {groupedApps.ungrouped.length > 0 && (
        <>
          {groupedApps.groups.length > 0 && (
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-medium text-foreground">All Apps</h2>
              <Badge
                variant="secondary"
                className="border-border bg-midnight-elevated text-xs"
              >
                {groupedApps.ungrouped.length}
              </Badge>
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={groupedApps.ungrouped.map((a) => a.id)}
              strategy={sortingStrategy}
            >
              <div
                className={
                  layout === 'list'
                    ? 'space-y-2'
                    : 'grid gap-4'
                }
                style={
                  layout !== 'list'
                    ? { gridTemplateColumns: layout === 'compact' ? 'repeat(auto-fill, minmax(200px, 1fr))' : 'repeat(auto-fill, minmax(310px, 1fr))' }
                    : undefined
                }
              >
                {groupedApps.ungrouped.map((app) => (
                  <DashboardCard
                    key={app.id}
                    app={app}
                    layout={layout}
                    pinned={preferences.pinnedApps.includes(app.id)}
                    onLaunch={handleLaunch}
                    onPin={handlePin}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}

      {/* Browse more CTA */}
      <div className="mt-8 text-center">
        <Button
          asChild
          variant="outline"
          className="border-border text-muted-foreground hover:text-foreground"
        >
          <Link to="/store" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Browse more tools
          </Link>
        </Button>
      </div>

      {/* App Launcher */}
      <AppLauncher
        app={launcherApp}
        open={launcherOpen}
        mode={preferences.launcherMode}
        onClose={() => setLauncherOpen(false)}
        onChangeMode={handleLaunchModeChange}
      />

      {/* Settings Modal */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false)
          KeyVault.getStatus().then(setKeyStatus)
        }}
        launchMode={preferences.launcherMode}
        onChangeLaunchMode={handleLaunchModeChange}
      />
    </div>
  )
}
