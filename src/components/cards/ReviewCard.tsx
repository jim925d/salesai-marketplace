import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Shield,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  Building2,
} from 'lucide-react'
import type { ReviewApp } from '@/hooks/useReviewQueue'

interface ReviewCardProps {
  app: ReviewApp
  onApprove: (appId: string) => Promise<void>
  onReject: (appId: string, reason: string) => Promise<void>
  onPreview: (app: ReviewApp) => void
}

function scoreColor(score: number): string {
  if (score >= 90) return 'text-green'
  if (score >= 80) return 'text-orange'
  return 'text-red'
}

function scoreBg(score: number): string {
  if (score >= 90) return 'bg-green/10 border-green/20'
  if (score >= 80) return 'bg-orange/10 border-orange/20'
  return 'bg-red/10 border-red/20'
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending_review: { label: 'Pending', className: 'bg-yellow/10 text-yellow' },
  in_review: { label: 'In Review', className: 'bg-ice/10 text-ice' },
}

export default function ReviewCard({ app, onApprove, onReject, onPreview }: ReviewCardProps) {
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)

  const status = statusConfig[app.status] || statusConfig.pending_review

  const handleApprove = async () => {
    setApproving(true)
    try {
      await onApprove(app.id)
    } finally {
      setApproving(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return
    setRejecting(true)
    try {
      await onReject(app.id, rejectReason.trim())
    } finally {
      setRejecting(false)
      setShowRejectForm(false)
      setRejectReason('')
    }
  }

  const submittedDate = new Date(app.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-[rgba(230,237,243,0.02)] transition-all duration-300 hover:border-[rgba(230,237,243,0.13)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-ice-border bg-ice-dim text-2xl">
              {app.icon}
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground">{app.name}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3" />
                {app.developer.companyName}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={status.className}>{status.label}</Badge>
          </div>
        </div>

        {/* Description */}
        <p className="mt-3 text-sm text-muted-foreground">{app.description}</p>

        {/* Info row */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {submittedDate}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5" />
            {app.priceCents === 0 ? 'Free' : `$${(app.priceCents / 100).toFixed(0)}/mo`}
          </div>
          <Badge variant="secondary" className="border-border bg-midnight-elevated text-xs text-muted-foreground">
            {app.category}
          </Badge>
        </div>

        {/* Security score */}
        <div className={`mt-4 flex items-center justify-between rounded-lg border p-3 ${scoreBg(app.securityScore)}`}>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium text-foreground">Security Score</span>
          </div>
          <span className={`font-serif text-xl font-bold ${scoreColor(app.securityScore)}`}>
            {app.securityScore}/100
          </span>
        </div>

        {/* Reject reason form */}
        {showRejectForm && (
          <div className="mt-4 space-y-2">
            <Textarea
              placeholder="Explain why this app is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[80px] border-border bg-midnight-elevated"
            />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowRejectForm(false)
                  setRejectReason('')
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-red text-white hover:bg-red/90"
                onClick={handleReject}
                disabled={!rejectReason.trim() || rejecting}
              >
                {rejecting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Confirm Rejection
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        {!showRejectForm && (
          <div className="mt-4 flex items-center gap-2">
            <Button
              size="sm"
              className="bg-green text-midnight hover:bg-green/90"
              onClick={handleApprove}
              disabled={approving}
            >
              {approving ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              )}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red/30 text-red hover:bg-red/10"
              onClick={() => setShowRejectForm(true)}
            >
              <XCircle className="mr-1.5 h-3.5 w-3.5" />
              Reject
            </Button>
            <div className="flex-1" />
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => onPreview(app)}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Preview
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
