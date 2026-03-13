import { useEffect, useRef, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  Maximize2,
  PanelRight,
  ExternalLink,
  X,
} from 'lucide-react'
import { KeyBridge } from '@/lib/key-vault'
import type { App } from '@/store/useAppStore'

export type LaunchMode = 'modal' | 'panel' | 'tab' | 'window'

interface AppLauncherProps {
  app: App | null
  open: boolean
  mode: LaunchMode
  onClose: () => void
  onChangeMode?: (mode: LaunchMode) => void
}

export default function AppLauncher({
  app,
  open,
  mode,
  onClose,
  onChangeMode,
}: AppLauncherProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Build the sandboxed iframe src
  const iframeSrc = app?.slug ? `/apps/${app.slug}.html` : ''

  // Handle iframe load — send API key via KeyBridge
  const handleIframeLoad = useCallback(() => {
    if (!iframeRef.current) return
    // Send key on load; iframe will also request via postMessage
    KeyBridge.sendKeyToApp(iframeRef.current, 'openai')
  }, [])

  // Listen for key requests from iframe
  useEffect(() => {
    if (!open || !app) return

    const cleanup = KeyBridge.startListening((provider) => {
      if (iframeRef.current) {
        KeyBridge.sendKeyToApp(iframeRef.current, provider)
      }
    })

    return cleanup
  }, [open, app])

  // Handle "open in tab" and "open in window" modes
  useEffect(() => {
    if (!open || !app || !iframeSrc) return

    if (mode === 'tab') {
      window.open(iframeSrc, '_blank', 'noopener,noreferrer')
      onClose()
    } else if (mode === 'window') {
      window.open(
        iframeSrc,
        app.name,
        'width=1000,height=700,noopener,noreferrer'
      )
      onClose()
    }
  }, [open, app, mode, iframeSrc, onClose])

  if (!app || mode === 'tab' || mode === 'window') return null

  const iframeElement = (
    <iframe
      ref={iframeRef}
      src={iframeSrc}
      title={app.name}
      sandbox="allow-scripts allow-same-origin"
      referrerPolicy="no-referrer"
      onLoad={handleIframeLoad}
      className="h-full w-full border-none"
      style={{ minHeight: '500px' }}
    />
  )

  const modeButtons = (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant="ghost"
        className={`h-7 w-7 p-0 ${mode === 'modal' ? 'text-ice' : 'text-muted-foreground hover:text-foreground'}`}
        onClick={() => onChangeMode?.('modal')}
        title="Fullscreen"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className={`h-7 w-7 p-0 ${mode === 'panel' ? 'text-ice' : 'text-muted-foreground hover:text-foreground'}`}
        onClick={() => onChangeMode?.('panel')}
        title="Side panel"
      >
        <PanelRight className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        onClick={() => {
          window.open(iframeSrc, '_blank', 'noopener,noreferrer')
          onClose()
        }}
        title="Open in new tab"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </Button>
    </div>
  )

  // Panel mode — side Sheet
  if (mode === 'panel') {
    return (
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="flex w-full flex-col border-border bg-midnight-card p-0 sm:max-w-xl"
        >
          <SheetHeader className="flex flex-row items-center justify-between border-b border-border p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-ice-border bg-ice-dim text-sm">
                {app.icon}
              </div>
              <SheetTitle className="text-sm text-foreground">
                {app.name}
              </SheetTitle>
            </div>
            <div className="flex items-center gap-1">
              {modeButtons}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                onClick={onClose}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-hidden">{iframeElement}</div>
        </SheetContent>
      </Sheet>
    )
  }

  // Modal mode (default) — fullscreen Dialog
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[90vh] max-h-[90vh] w-[95vw] max-w-5xl flex-col border-border bg-midnight-card p-0"
      >
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-ice-border bg-ice-dim text-sm">
              {app.icon}
            </div>
            <DialogTitle className="text-sm text-foreground">
              {app.name}
            </DialogTitle>
          </div>
          <div className="flex items-center gap-1">
            {modeButtons}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={onClose}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">{iframeElement}</div>
      </DialogContent>
    </Dialog>
  )
}
