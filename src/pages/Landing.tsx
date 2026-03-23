import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Star,
  ArrowRight,
  Zap,
  Clock,
  DollarSign,
  Check,
  Users,
  Code2,
} from 'lucide-react'

// Mock top apps for hero
const topApps = [
  { icon: '🎯', name: 'LeadSniper', dev: 'SalesAI', rating: 4.9, price: '$49/mo' },
  { icon: '📧', name: 'ColdCraft', dev: 'OutreachLabs', rating: 4.7, price: '$29/mo' },
  { icon: '🔍', name: 'ProspectIQ', dev: 'SalesAI', rating: 4.8, price: 'Free' },
  { icon: '📊', name: 'DealFlow', dev: 'RevOps Co', rating: 4.6, price: '$39/mo' },
  { icon: '🤖', name: 'MeetingPrep AI', dev: 'SalesAI', rating: 4.9, price: '$19/mo' },
]

const stats = [
  { value: '2,400+', label: 'Active sellers', color: 'text-ice' },
  { value: '80/20', label: 'Developer split', color: 'text-green' },
  { value: 'AES-256', label: 'Key encryption', color: 'text-purple' },
  { value: '10+', label: 'AI tools', color: 'text-foreground' },
]

const devStats = [
  { value: '80%', label: 'Revenue share', icon: DollarSign },
  { value: '<48h', label: 'Review time', icon: Clock },
  { value: '$0–999', label: 'Flexible pricing', icon: Zap },
  { value: '2,400+', label: 'Active buyers', icon: Users },
]

const pricingTiers = [
  {
    name: 'Pay Per App',
    price: '$0–999',
    period: '/app/mo',
    description: 'Only pay for the tools you need.',
    features: [
      '14-day free trial on all paid apps',
      'AES-256 encrypted API keys',
      'Cancel anytime',
      'Basic support',
    ],
    cta: 'Browse marketplace',
    ctaLink: '/store',
    accent: false,
    popular: false,
  },
  {
    name: 'Pro Bundle',
    price: '$99',
    period: '/mo',
    description: 'All first-party SalesAI tools, one price.',
    features: [
      'All SalesAI-built tools included',
      'Priority support',
      'Early access to new tools',
      'Custom integrations',
      'Team management',
    ],
    cta: 'Start free trial',
    ctaLink: '/store',
    accent: true,
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For teams that need more.',
    features: [
      'Everything in Pro',
      'SSO & SAML',
      'Dedicated account manager',
      'Custom SLAs',
      'On-premise deployment',
      'Audit logs & compliance',
    ],
    cta: 'Contact sales',
    ctaLink: '/store',
    accent: false,
    popular: false,
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="glow-hero relative overflow-hidden">
        <div className="relative z-10 mx-auto grid max-w-6xl gap-12 px-6 pb-24 pt-24 md:grid-cols-2 md:pt-32">
          {/* Left */}
          <div className="flex flex-col justify-center">
            <Badge
              variant="secondary"
              className="mb-6 w-fit border-border bg-midnight-elevated text-sm"
            >
              <span className="live-dot mr-2" />
              OPEN MARKETPLACE · 10+ TOOLS
            </Badge>

            <h1 className="font-serif text-4xl tracking-tight text-foreground md:text-5xl lg:text-6xl">
              The marketplace for{' '}
              <em className="not-italic text-ice">AI sales tools.</em>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              Browse, purchase, and deploy AI-powered sales tools. Developers
              keep 80% of revenue. All API keys encrypted with AES-256-GCM.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-ice text-midnight hover:bg-ice/90"
              >
                <Link to="/store">Browse marketplace</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-purple/30 text-purple hover:bg-purple/10"
              >
                <Link to="/dev" className="flex items-center gap-2">
                  Build & sell apps
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right — stacked app list */}
          <div className="relative flex items-center justify-center">
            {/* Vertical accent line */}
            <div className="absolute left-0 top-4 hidden h-[85%] w-px bg-gradient-to-b from-transparent via-yellow to-transparent md:block" />

            <div className="w-full max-w-sm space-y-3 md:pl-8">
              {topApps.map((app, i) => (
                <div
                  key={app.name}
                  className="flex items-center gap-3 rounded-xl border border-border bg-[rgba(230,237,243,0.02)] p-3 opacity-0 animate-[fadeUp_0.5s_ease_forwards]"
                  style={{ animationDelay: `${0.15 + i * 0.1}s` }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-ice-border bg-ice-dim text-lg">
                    {app.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {app.name}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span
                        className={
                          app.dev === 'SalesAI'
                            ? 'text-ice'
                            : 'text-muted-foreground'
                        }
                      >
                        {app.dev === 'SalesAI' ? '◆' : '●'}
                      </span>
                      {app.dev}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="flex items-center gap-0.5 text-xs text-ice">
                      <Star className="h-3 w-3 fill-ice" />
                      {app.rating}
                    </p>
                    <p className="font-serif text-xs font-bold text-foreground">
                      {app.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-y border-border">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className={`font-serif text-3xl font-bold ${stat.color}`}>
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Developer CTA ── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-12 md:grid-cols-2">
          {/* Left */}
          <div className="flex flex-col justify-center">
            <Badge
              variant="secondary"
              className="mb-6 w-fit border-purple/20 bg-purple/10 text-purple"
            >
              <Code2 className="mr-1.5 h-3 w-3" />
              FOR DEVELOPERS
            </Badge>

            <h2 className="font-serif text-3xl tracking-tight text-foreground md:text-4xl">
              Build once.{' '}
              <em className="not-italic text-purple">Earn forever.</em>
            </h2>

            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              Publish your AI sales tool to 2,400+ active buyers. You keep 80%
              of every sale. We handle billing, distribution, and security
              review.
            </p>

            <Button
              asChild
              size="lg"
              className="mt-8 w-fit bg-gradient-to-r from-purple to-ice text-midnight hover:opacity-90"
            >
              <Link to="/dev">Start building</Link>
            </Button>
          </div>

          {/* Right — stat cards */}
          <div className="grid grid-cols-2 gap-3">
            {devStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="flex flex-col items-center justify-center rounded-xl border border-border bg-[rgba(230,237,243,0.02)] p-6 text-center"
                >
                  <Icon className="mb-2 h-5 w-5 text-purple" />
                  <p className="font-serif text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Featured Tools ── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="font-serif text-3xl tracking-tight text-foreground md:text-4xl">
          Featured <em className="not-italic text-ice">tools</em>
        </h2>
        <p className="mt-2 text-muted-foreground">
          Hand-picked AI sales tools, reviewed and verified.
        </p>

        <div className="mt-10 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))' }}>
          {topApps.map((app, i) => (
            <Link
              to="/store"
              key={app.name}
              className="group relative flex flex-col overflow-hidden rounded-[14px] border border-border bg-[rgba(230,237,243,0.02)] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(230,237,243,0.13)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-ice-border bg-ice-dim text-xl">
                  {app.icon}
                </div>
              </div>
              <h3 className="text-sm font-medium text-foreground">
                {app.name}
              </h3>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <span
                  className={
                    app.dev === 'SalesAI'
                      ? 'text-ice'
                      : 'text-muted-foreground'
                  }
                >
                  {app.dev === 'SalesAI' ? '◆' : '●'}
                </span>
                {app.dev}
              </p>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 text-ice">
                  <Star className="h-3 w-3 fill-ice" />
                  {app.rating}
                </span>
              </div>
              <div className="mt-3 border-t border-border pt-3">
                <span className="font-serif text-base font-bold text-foreground">
                  {app.price}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 h-[2px] w-0 rounded-b-[14px] bg-gradient-to-r from-ice to-purple transition-all duration-500 group-hover:w-full" />
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button
            asChild
            variant="outline"
            className="border-border text-muted-foreground hover:text-foreground"
          >
            <Link to="/store" className="flex items-center gap-2">
              View all tools
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <Separator />

      {/* ── Pricing ── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center">
          <h2 className="font-serif text-3xl tracking-tight text-foreground md:text-4xl">
            Simple, transparent{' '}
            <em className="not-italic text-ice">pricing</em>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Start with a free trial on any paid app. No credit card required.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-xl border p-6 ${
                tier.accent
                  ? 'border-ice/30 bg-ice/[0.03]'
                  : 'border-border bg-[rgba(230,237,243,0.02)]'
              }`}
            >
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-ice text-midnight">
                  POPULAR
                </Badge>
              )}
              <h3 className="text-lg font-medium text-foreground">
                {tier.name}
              </h3>
              <div className="mt-3">
                <span className="font-serif text-3xl font-bold text-foreground">
                  {tier.price}
                </span>
                {tier.period && (
                  <span className="text-sm text-muted-foreground">
                    {tier.period}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {tier.description}
              </p>
              <Separator className="my-5" />
              <ul className="flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={`mt-6 ${
                  tier.accent
                    ? 'bg-ice text-midnight hover:bg-ice/90'
                    : 'bg-midnight-elevated text-foreground hover:bg-midnight-elevated/80'
                }`}
              >
                <Link to={tier.ctaLink}>{tier.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
