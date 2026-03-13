import { useState, useRef, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Upload,
  FileCode,
  Check,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Star,
  Clock,
  Shield,
  DollarSign,
} from 'lucide-react'
import { toast } from 'sonner'
import { getAuth } from 'firebase/auth'

interface SubmitAppModalProps {
  open: boolean
  onClose: () => void
  onSubmitted?: () => void
}

const categories = ['Outreach', 'Prospecting', 'Meeting Prep', 'Productivity'] as const

const emojiOptions = [
  '🎯', '📧', '🔍', '📊', '🤖', '⚡', '📡', '🎙️', '✈️', '🚀',
  '💡', '🔗', '📈', '🎪', '🛡️', '🔔', '📋', '🗂️', '🧠', '💬',
]

const requirements = [
  'Single HTML file with embedded JS/CSS',
  'Provider selector (id="provider") with OpenAI + Anthropic',
  'API key input (id="apiKey")',
  'No external scripts except approved CDNs',
  'No data exfiltration or tracking',
  'postMessage bridge for key delivery',
]

export default function SubmitAppModal({
  open,
  onClose,
  onSubmitted,
}: SubmitAppModalProps) {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 1: App details
  const [icon, setIcon] = useState('🎯')
  const [name, setName] = useState('')
  const [category, setCategory] = useState<string>('')
  const [priceCents, setPriceCents] = useState(0)
  const [description, setDescription] = useState('')
  const [longDescription, setLongDescription] = useState('')

  // Step 2: File upload
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.name.endsWith('.html')) {
      setFile(dropped)
    } else {
      toast.error('Only .html files are accepted')
    }
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0]
      if (selected && selected.name.endsWith('.html')) {
        setFile(selected)
      } else {
        toast.error('Only .html files are accepted')
      }
    },
    []
  )

  const handleSubmit = async () => {
    if (!file || !name || !category) return

    const user = getAuth().currentUser
    if (!user) {
      toast.error('Not authenticated')
      return
    }

    setSubmitting(true)
    try {
      const token = await user.getIdToken(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', name)
      formData.append('icon', icon)
      formData.append('category', category)
      formData.append('priceCents', String(priceCents))
      formData.append('description', description)
      formData.append('longDescription', longDescription)

      const res = await fetch('/api/submit-app', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Submission failed')
        return
      }

      toast.success(
        `App submitted! Security score: ${data.securityScore}/100`
      )
      onSubmitted?.()
      handleClose()
    } catch {
      toast.error('Failed to submit app')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setName('')
    setCategory('')
    setPriceCents(0)
    setDescription('')
    setLongDescription('')
    setFile(null)
    setIcon('🎯')
    onClose()
  }

  const canProceedStep1 =
    name.trim().length > 0 &&
    category.length > 0 &&
    description.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="border-border bg-midnight-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-foreground">
            Submit New App
          </DialogTitle>
          <DialogDescription>
            Step {step} of 3
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="flex gap-1">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-purple' : 'bg-midnight-elevated'
              }`}
            />
          ))}
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-3">
            {/* Step 1: App Details */}
            {step === 1 && (
              <>
                {/* Icon picker */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Icon
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {emojiOptions.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setIcon(emoji)}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition-colors ${
                          icon === emoji
                            ? 'border-purple bg-purple/10'
                            : 'border-border bg-midnight-elevated hover:border-[rgba(230,237,243,0.13)]'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* App name */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    App Name
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My AI Sales Tool"
                    className="border-border bg-midnight-elevated"
                    maxLength={60}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Category
                  </label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="border-border bg-midnight-elevated">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-midnight-card">
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Price ($/mo)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={999}
                    value={priceCents / 100}
                    onChange={(e) =>
                      setPriceCents(Math.round(Number(e.target.value) * 100))
                    }
                    placeholder="0"
                    className="border-border bg-midnight-elevated"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    0 = Free. You keep 80% of paid sales.
                  </p>
                </div>

                {/* Short description */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Short Description
                  </label>
                  <Input
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value.slice(0, 120))
                    }
                    placeholder="A brief description of your app"
                    className="border-border bg-midnight-elevated"
                    maxLength={120}
                  />
                  <p className="mt-1 text-right text-xs text-muted-foreground">
                    {description.length}/120
                  </p>
                </div>

                {/* Long description */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Long Description
                  </label>
                  <textarea
                    value={longDescription}
                    onChange={(e) => setLongDescription(e.target.value)}
                    placeholder="Detailed description shown on the app detail page..."
                    className="min-h-[80px] w-full rounded-md border border-border bg-midnight-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={3}
                  />
                </div>
              </>
            )}

            {/* Step 2: File Upload */}
            {step === 2 && (
              <>
                {/* Upload zone */}
                <div
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                    dragOver
                      ? 'border-purple bg-purple/5'
                      : file
                        ? 'border-green/30 bg-green/5'
                        : 'border-border hover:border-[rgba(230,237,243,0.2)]'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {file ? (
                    <>
                      <FileCode className="mb-2 h-8 w-8 text-green" />
                      <p className="text-sm font-medium text-foreground">
                        {file.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                      <p className="mt-2 text-xs text-green">
                        Click to replace
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">
                        Drop your .html file here
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        or click to browse (max 5MB)
                      </p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".html"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                <Separator />

                {/* Requirements checklist */}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-foreground">
                    Requirements
                  </h4>
                  <ul className="space-y-2">
                    {requirements.map((req) => (
                      <li
                        key={req}
                        className="flex items-start gap-2 text-xs text-muted-foreground"
                      >
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-green" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* Step 3: Review & Submit */}
            {step === 3 && (
              <>
                {/* Preview card */}
                <div className="rounded-xl border border-border bg-[rgba(230,237,243,0.02)] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-ice-border bg-ice-dim text-xl">
                      {icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-foreground">
                        {name}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {category}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {description}
                      </p>
                    </div>
                    <span className="font-serif text-sm font-bold text-foreground">
                      {priceCents === 0
                        ? 'Free'
                        : `$${(priceCents / 100).toFixed(0)}/mo`}
                    </span>
                  </div>
                  {file && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-midnight-elevated p-2 text-xs text-muted-foreground">
                      <FileCode className="h-3.5 w-3.5" />
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>

                <Separator />

                {/* What happens next */}
                <div>
                  <h4 className="mb-3 text-sm font-medium text-foreground">
                    What happens next
                  </h4>
                  <div className="space-y-3">
                    {[
                      {
                        icon: Shield,
                        label: 'Automated security scan',
                        desc: 'Instant',
                        color: 'text-ice',
                      },
                      {
                        icon: Clock,
                        label: 'Manual review',
                        desc: '<48 hours',
                        color: 'text-yellow',
                      },
                      {
                        icon: Star,
                        label: 'Live in marketplace',
                        desc: 'After approval',
                        color: 'text-green',
                      },
                      {
                        icon: DollarSign,
                        label: 'Revenue flows',
                        desc: 'You 80% / Platform 20%',
                        color: 'text-purple',
                      },
                    ].map((item) => {
                      const Icon = item.icon
                      return (
                        <div
                          key={item.label}
                          className="flex items-center gap-3"
                        >
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-midnight-elevated ${item.color}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-foreground">
                              {item.label}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className="border-border bg-midnight-elevated text-xs"
                          >
                            {item.desc}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Revenue split */}
                <div className="rounded-lg border border-purple/20 bg-purple/5 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">Revenue split</span>
                    <span className="font-medium text-purple">
                      You 80% / Marketplace 20%
                    </span>
                  </div>
                </div>

                {priceCents > 0 && (
                  <div className="rounded-lg border border-border bg-midnight-elevated p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-yellow" />
                      <span className="text-foreground">
                        14-day free trial included for all paid apps
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          {step > 1 ? (
            <Button
              variant="outline"
              className="border-border text-muted-foreground"
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button
              className="bg-purple text-midnight hover:bg-purple/90"
              onClick={() => setStep(step + 1)}
              disabled={step === 1 ? !canProceedStep1 : step === 2 ? !file : false}
            >
              Next
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              className="bg-purple text-midnight hover:bg-purple/90"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit for review'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
