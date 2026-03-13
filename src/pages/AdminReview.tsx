import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import ReviewCard from '@/components/cards/ReviewCard'
import { useReviewQueue } from '@/hooks/useReviewQueue'
import type { ReviewApp } from '@/hooks/useReviewQueue'
import { useAuthStore } from '@/store/useAuthStore'
import { toast } from 'sonner'

export default function AdminReview() {
  const { user } = useAuthStore()
  const { queue, loading, reviewApp } = useReviewQueue()
  const [previewApp, setPreviewApp] = useState<ReviewApp | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending_review' | 'in_review'>('all')

  const filteredQueue =
    filter === 'all' ? queue : queue.filter((app) => app.status === filter)

  const pendingCount = queue.filter((a) => a.status === 'pending_review').length
  const inReviewCount = queue.filter((a) => a.status === 'in_review').length
  const lowScoreCount = queue.filter((a) => a.securityScore < 80).length

  const handleApprove = async (appId: string) => {
    const result = await reviewApp(appId, 'approve')
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('App approved and published')
    }
  }

  const handleReject = async (appId: string, reason: string) => {
    const result = await reviewApp(appId, 'reject', reason)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('App rejected with feedback')
    }
  }

  // Non-admin guard
  if (user && user.role !== 'admin') {
    return (
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center px-6 py-24 text-center">
        <Shield className="mb-4 h-12 w-12 text-red" />
        <h1 className="font-serif text-3xl text-foreground">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">
          Admin access is required to view the review queue.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-foreground">Review Queue</h1>
        <p className="mt-2 text-muted-foreground">
          Apps pending security review and approval
        </p>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-[14px] border border-border bg-[rgba(230,237,243,0.02)] p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 text-yellow" />
            Pending Review
          </div>
          <p className="mt-1 font-serif text-3xl font-bold text-yellow">
            {pendingCount}
          </p>
        </div>
        <div className="rounded-[14px] border border-border bg-[rgba(230,237,243,0.02)] p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-ice" />
            In Review
          </div>
          <p className="mt-1 font-serif text-3xl font-bold text-ice">
            {inReviewCount}
          </p>
        </div>
        <div className="rounded-[14px] border border-border bg-[rgba(230,237,243,0.02)] p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-red" />
            Low Security Score
          </div>
          <p className="mt-1 font-serif text-3xl font-bold text-red">
            {lowScoreCount}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as typeof filter)}
        className="mb-6"
      >
        <TabsList className="bg-midnight-elevated">
          <TabsTrigger value="all">
            All ({queue.length})
          </TabsTrigger>
          <TabsTrigger value="pending_review">
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="in_review">
            In Review ({inReviewCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Queue */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-ice" />
        </div>
      ) : filteredQueue.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <CheckCircle2 className="mb-4 h-12 w-12 text-green" />
          <h2 className="font-serif text-2xl text-foreground">Queue is clear</h2>
          <p className="mt-2 text-muted-foreground">
            No apps waiting for review right now.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredQueue.map((app) => (
            <ReviewCard
              key={app.id}
              app={app}
              onApprove={handleApprove}
              onReject={handleReject}
              onPreview={setPreviewApp}
            />
          ))}
        </div>
      )}

      {/* Preview dialog */}
      <Dialog
        open={!!previewApp}
        onOpenChange={(o) => !o && setPreviewApp(null)}
      >
        <DialogContent className="h-[80vh] max-w-4xl border-border bg-midnight-card p-0">
          <DialogHeader className="border-b border-border p-4">
            <DialogTitle className="flex items-center gap-3 font-serif text-lg text-foreground">
              {previewApp && (
                <>
                  <span className="text-xl">{previewApp.icon}</span>
                  {previewApp.name}
                  <Badge
                    className={`ml-2 ${
                      previewApp.securityScore >= 90
                        ? 'bg-green/10 text-green'
                        : previewApp.securityScore >= 80
                          ? 'bg-orange/10 text-orange'
                          : 'bg-red/10 text-red'
                    }`}
                  >
                    <Shield className="mr-1 h-3 w-3" />
                    {previewApp.securityScore}/100
                  </Badge>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {previewApp && (
              <iframe
                src={`/${previewApp.filePath}`}
                className="h-full w-full"
                sandbox="allow-scripts"
                referrerPolicy="no-referrer"
                title={`Preview: ${previewApp.name}`}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
