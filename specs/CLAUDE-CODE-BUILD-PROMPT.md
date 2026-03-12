# SalesAI Marketplace — Full Build Specification

You are building a developer marketplace for AI-powered sales tools. This is a two-sided platform: **buyers** purchase and use AI sales tools, **developers** build and sell them, and the **marketplace** handles payments (80/20 split), security, app review, and distribution.

Read this entire document before writing any code. Then build it section by section, committing after each major section.

---

## TECH STACK

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 18 + Vite + TypeScript | Fast builds, type safety |
| Styling | Tailwind CSS v4 | Utility-first, consistent design system |
| Components | shadcn/ui | Accessible, customizable primitives built on Radix + Tailwind |
| State | Zustand | Lightweight, no boilerplate |
| Routing | React Router v6 | Standard SPA routing |
| DnD | @dnd-kit/core + @dnd-kit/sortable | Dashboard drag-and-drop reordering |
| Auth | Firebase Auth | Email/password, Google OAuth, SAML, 2FA |
| Database | Supabase (PostgreSQL) | Postgres + Row Level Security + REST API |
| Payments | Stripe Connect (Standard) | 80/20 revenue splits, developer payouts |
| Hosting | Vercel | Auto-deploy, serverless functions, edge CDN |
| Email | Resend | Transactional emails |
| Monitoring | Sentry | Error tracking + performance |
| CI/CD | GitHub Actions | Automated testing, security scanning |
| DNS/WAF | Cloudflare | DDoS protection, SSL, rate limiting |

---

## PROJECT STRUCTURE

```
salesai-marketplace/
├── public/
│   └── apps/                          # Sandboxed HTML tool files (served as static)
│       └── .gitkeep
├── src/
│   ├── main.tsx                       # Entry point
│   ├── App.tsx                        # Root component with router
│   ├── lib/
│   │   ├── supabase.ts               # Supabase client init
│   │   ├── firebase.ts               # Firebase Auth init
│   │   ├── stripe.ts                 # Stripe client init
│   │   ├── key-vault.ts              # AES-256-GCM client-side key encryption
│   │   ├── sanitize.ts              # Input sanitization (XSS prevention)
│   │   ├── rate-limiter.ts          # Client-side rate limiting
│   │   └── audit.ts                 # Audit log helper
│   ├── store/
│   │   ├── useAuthStore.ts           # Auth state (user, role, session)
│   │   ├── useAppStore.ts            # Marketplace apps state
│   │   └── useDevStore.ts            # Developer portal state
│   ├── hooks/
│   │   ├── useApps.ts                # Fetch/filter/sort apps
│   │   ├── useOwnedApps.ts           # User's purchased apps
│   │   ├── useDevApps.ts             # Developer's published apps
│   │   ├── useReviewQueue.ts         # Admin review queue
│   │   └── useRevenue.ts             # Developer revenue data
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx            # Top nav (adapts by role)
│   │   │   ├── Footer.tsx
│   │   │   └── Toast.tsx             # Notification toasts
│   │   ├── cards/
│   │   │   ├── AppCard.tsx           # Store app card (with dev attribution)
│   │   │   ├── DashboardCard.tsx     # Buyer dashboard card (launch/remove)
│   │   │   ├── DevAppCard.tsx        # Developer's app card (stats)
│   │   │   └── ReviewCard.tsx        # Admin review queue card
│   │   ├── modals/
│   │   │   ├── AuthModal.tsx         # Buyer sign in/up
│   │   │   ├── DevAuthModal.tsx      # Developer sign in/up
│   │   │   ├── AppDetailModal.tsx    # Full app detail + purchase
│   │   │   ├── AppLauncher.tsx       # Sandboxed iframe launcher
│   │   │   ├── SubmitAppModal.tsx    # 3-step app submission wizard
│   │   │   └── SettingsModal.tsx     # API keys, security, billing
│   │   └── ui/                      # shadcn/ui components (installed via CLI)
│   │       ├── button.tsx            # shadcn: Button (all variants)
│   │       ├── badge.tsx             # shadcn: Badge
│   │       ├── input.tsx             # shadcn: Input
│   │       ├── select.tsx            # shadcn: Select (with search)
│   │       ├── dialog.tsx            # shadcn: Dialog (modals)
│   │       ├── sheet.tsx             # shadcn: Sheet (slide-over panels)
│   │       ├── tabs.tsx              # shadcn: Tabs
│   │       ├── dropdown-menu.tsx     # shadcn: DropdownMenu (user menu, sort)
│   │       ├── command.tsx           # shadcn: Command (search palette)
│   │       ├── tooltip.tsx           # shadcn: Tooltip
│   │       ├── progress.tsx          # shadcn: Progress bar
│   │       ├── avatar.tsx            # shadcn: Avatar
│   │       ├── card.tsx              # shadcn: Card
│   │       ├── separator.tsx         # shadcn: Separator
│   │       ├── skeleton.tsx          # shadcn: Skeleton (loading states)
│   │       ├── toast.tsx             # shadcn: Toast (via sonner)
│   │       ├── switch.tsx            # shadcn: Switch (toggles)
│   │       ├── slider.tsx            # shadcn: Slider (commission calc)
│   │       ├── popover.tsx           # shadcn: Popover
│   │       ├── form.tsx              # shadcn: Form (react-hook-form)
│   │       ├── table.tsx             # shadcn: Table (batch results, admin)
│   │       └── scroll-area.tsx       # shadcn: ScrollArea (modals)
│   └── pages/
│       ├── Landing.tsx               # Marketing landing page
│       ├── Store.tsx                  # App marketplace (browse/search/filter)
│       ├── BuyerDashboard.tsx        # "My Apps" — installed apps
│       ├── DevPortal.tsx             # Developer home (stats, apps, revenue)
│       ├── DevSubmit.tsx             # App submission flow
│       ├── AdminReview.tsx           # Admin review queue
│       └── NotFound.tsx
├── api/                              # Vercel serverless functions
│   ├── stripe-webhook.ts            # Handles Stripe events
│   ├── create-checkout.ts           # Creates Stripe Checkout session
│   ├── create-connect-account.ts    # Onboards developer to Stripe Connect
│   ├── submit-app.ts                # Handles app file upload + security scan
│   └── health.ts                    # Health check endpoint
├── supabase/
│   └── migrations/
│       ├── 001_create_users.sql
│       ├── 002_create_apps.sql
│       ├── 003_create_purchases.sql
│       ├── 004_create_reviews.sql
│       ├── 005_create_payouts.sql
│       ├── 006_create_audit_logs.sql
│       └── 007_create_user_preferences.sql
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, test, build on every PR
│       ├── deploy.yml                # Auto-deploy to Vercel on main
│       └── security-scan.yml        # Weekly dependency audit
├── .env.example
├── vercel.json
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## DESIGN SYSTEM — "ICE & MIDNIGHT"

The visual identity uses a dark, editorial aesthetic inspired by GitHub's color system with Georgia serif headlines for authority. Do NOT use generic purple gradients, Inter font, or cookie-cutter SaaS aesthetics.

### Color Tokens (use as Tailwind config + CSS variables)

```
--bg-primary: #080B12          /* deep midnight — main background */
--bg-secondary: #0D1117        /* slightly lighter — cards, modals */
--bg-tertiary: #161B22         /* elevated surfaces */
--accent: #58A6FF              /* ice blue — CTAs, links, highlights */
--accent-dim: rgba(88,166,255,0.08)   /* accent backgrounds */
--accent-border: rgba(88,166,255,0.18) /* accent borders */
--text-primary: #E6EDF3        /* main text */
--text-secondary: #A0A8B4      /* secondary text (brightened) */
--text-tertiary: #7A8494       /* muted text (brightened) */
--border: rgba(230,237,243,0.06) /* default borders */
--border-hover: rgba(230,237,243,0.13)
--green: #3FB950               /* success, active, money */
--purple: #D2A8FF              /* developer accents */
--orange: #F0883E              /* warnings, admin */
--red: #F85149                 /* errors, destructive */
--yellow: #E3B341              /* auth accents */
```

### Typography
- **Headlines**: Georgia, 'Times New Roman', serif — weight 400, italic for emphasis words (colored in accent)
- **Body/UI**: system-ui, -apple-system, 'Segoe UI', sans-serif
- **Code**: 'JetBrains Mono', monospace

### Key Visual Patterns
- Subtle grain texture overlay on the body (SVG noise filter, opacity 0.025, fixed position)
- Radial gradient glows behind hero sections (accent color, 6% opacity, large radius)
- Cards: glass background (rgba white 0.02), 1px border, 14px border-radius, lift + shadow on hover with animated gradient progress bar at the bottom that fills left-to-right on hover
- Pulsing green dot with glow shadow on "live" status indicators
- Georgia serif for stat numbers (colored by type), sans-serif for labels
- Staggered entrance animations on card grids (0.06s delay per card)

---

## SHADCN/UI SETUP

### Installation
```bash
npx shadcn@latest init
```

When prompted:
- Style: **Default**
- Base color: **Slate** (we override everything anyway)
- CSS variables: **Yes**
- Tailwind CSS v4: **Yes** (if available, otherwise v3)
- React Server Components: **No**

### Install all required components
```bash
npx shadcn@latest add button badge input select dialog sheet tabs \
  dropdown-menu command tooltip progress avatar card separator \
  skeleton switch slider popover form table scroll-area sonner
```

### Additional dependencies
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities  # Dashboard drag-and-drop
npm install react-hook-form @hookform/resolvers zod              # Form validation
npm install sonner                                                # Toast notifications
npm install lucide-react                                          # Icons
npm install class-variance-authority clsx tailwind-merge          # shadcn utilities
```

### shadcn Theme Override (globals.css)

Override shadcn's default theme to match Ice & Midnight. This is the critical file — shadcn reads these CSS variables for all component styling:

```css
@layer base {
  :root {
    /* shadcn maps to these variable names */
    --background: 222 47% 5%;           /* #080B12 */
    --foreground: 213 31% 91%;          /* #E6EDF3 */
    --card: 215 28% 7%;                 /* #0D1117 */
    --card-foreground: 213 31% 91%;     /* #E6EDF3 */
    --popover: 215 28% 7%;             /* #0D1117 */
    --popover-foreground: 213 31% 91%; /* #E6EDF3 */
    --primary: 212 100% 67%;           /* #58A6FF — accent */
    --primary-foreground: 222 47% 5%;  /* #080B12 — text on accent */
    --secondary: 215 14% 12%;          /* #161B22 */
    --secondary-foreground: 213 31% 91%;
    --muted: 215 14% 12%;             /* #161B22 */
    --muted-foreground: 214 9% 60%;   /* #A0A8B4 — text2 */
    --accent: 212 100% 67%;           /* #58A6FF */
    --accent-foreground: 222 47% 5%;
    --destructive: 0 82% 63%;         /* #F85149 */
    --destructive-foreground: 213 31% 91%;
    --border: 214 20% 16%;            /* ~rgba(230,237,243,0.06) equivalent */
    --input: 214 20% 16%;
    --ring: 212 100% 67%;             /* focus ring = accent */
    --radius: 0.625rem;               /* 10px — our default border radius */

    /* Custom tokens (not shadcn defaults) */
    --green: 142 69% 58%;             /* #3FB950 */
    --purple: 270 100% 83%;           /* #D2A8FF */
    --orange: 25 87% 56%;             /* #F0883E */
    --yellow: 45 96% 56%;             /* #E3B341 */
    --glass: rgba(230, 237, 243, 0.02);
    --accent-dim: rgba(88, 166, 255, 0.08);
    --accent-border: rgba(88, 166, 255, 0.18);
  }
}
```

### Component → Usage Mapping

Here's which shadcn component to use where:

| UI Element | shadcn Component | Where Used |
|-----------|-----------------|------------|
| All modals (auth, detail, settings, submit) | `Dialog` | AuthModal, AppDetailModal, SettingsModal, SubmitAppModal |
| App Launcher side panel | `Sheet` (side="right") | AppLauncher when in panel mode |
| Store category filters | `Tabs` or custom toggle group | Store page |
| Dev Portal tabs | `Tabs` | DevPortal (My Apps, Revenue, Payouts, Settings) |
| Settings tabs | `Tabs` inside `Dialog` | SettingsModal |
| Sort dropdown (store) | `Select` | Store page |
| User menu | `DropdownMenu` | Navbar avatar menu |
| Search (store, admin) | `Command` (as popover) | Store search, ⌘K global search |
| Loading cards | `Skeleton` | App grids while fetching |
| Loading progress | `Progress` | App submission upload, batch scoring |
| Key status indicator | `Badge` variant | Settings, dashboard banner |
| Form validation | `Form` + zod schemas | Auth, app submission, settings |
| Admin review table | `Table` | AdminReview page |
| Batch results table | `Table` | ICP Scorer batch mode |
| Toast notifications | `sonner` (via shadcn's toast) | Everywhere |
| Dashboard reorder | `@dnd-kit/sortable` over `Card` | BuyerDashboard |
| Quick launch bar | Custom + `Tooltip` | Dashboard top bar |
| Commission sliders | `Slider` | Commission Calculator app page |
| Toggle switches | `Switch` | Settings (2FA, notifications) |
| Scroll in modals | `ScrollArea` | All modals with long content |

### shadcn Component Customization Rules

1. **Never use shadcn's default colors as-is.** Always override via the CSS variables above. The defaults are designed for light mode — we're in a deep dark theme.

2. **Border radius**: shadcn defaults to `--radius: 0.5rem`. We use `0.625rem` (10px) for most components and `0.875rem` (14px) for cards. Adjust per component using Tailwind classes like `rounded-xl`.

3. **Focus rings**: shadcn uses `ring-ring` which maps to our accent. This is correct — keep it.

4. **Hover states on cards**: shadcn's Card doesn't have the lift + progress bar effect. Wrap `Card` in a custom `HoverCard` wrapper that adds `hover:-translate-y-1 hover:shadow-lg transition-all duration-300` and the gradient progress bar div at the bottom.

5. **Dialog backdrop**: Override the default backdrop to use `bg-black/60 backdrop-blur-sm` to match our frosted glass overlay aesthetic.

6. **The grain overlay and glow effects are NOT shadcn components.** These are custom CSS applied to the body and section wrappers. Don't try to make them shadcn components.

### Tailwind Config (tailwind.config.ts)

```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Georgia", "Times New Roman", "serif"],
        sans: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        midnight: {
          DEFAULT: "#080B12",
          card: "#0D1117",
          elevated: "#161B22",
        },
        ice: {
          DEFAULT: "#58A6FF",
          dim: "rgba(88, 166, 255, 0.08)",
          border: "rgba(88, 166, 255, 0.18)",
        },
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease-out",
        "slide-in": "slideIn 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
        "progress-fill": "progressFill 0.5s ease forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(40px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        progressFill: {
          "0%": { width: "0%" },
          "100%": { width: "100%" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],  // required by shadcn
}

export default config
```

---

## DATABASE SCHEMA (Supabase / PostgreSQL)

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'developer', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### developer_profiles
```sql
CREATE TABLE developer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  stripe_connect_id TEXT,           -- Stripe Connected Account ID
  stripe_onboarded BOOLEAN DEFAULT false,
  website_url TEXT,
  support_email TEXT,
  bio TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### apps
```sql
CREATE TABLE apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES developer_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,         -- URL-safe identifier
  icon TEXT NOT NULL,                -- emoji or URL
  category TEXT NOT NULL CHECK (category IN ('Outreach', 'Prospecting', 'Meeting Prep', 'Productivity')),
  price_cents INTEGER NOT NULL DEFAULT 0,  -- monthly price in cents ($19 = 1900)
  description TEXT NOT NULL,         -- short (max 120 chars)
  long_description TEXT,             -- full marketing copy
  features JSONB DEFAULT '[]',       -- ["feature 1", "feature 2"]
  file_path TEXT,                    -- path to HTML file in storage
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'in_review', 'approved', 'rejected', 'suspended')),
  security_score INTEGER,            -- 0-100 from automated scan
  version TEXT DEFAULT '1.0.0',
  stripe_product_id TEXT,            -- Stripe Product ID
  stripe_price_id TEXT,              -- Stripe Price ID (recurring)
  total_installs INTEGER DEFAULT 0,
  total_revenue_cents INTEGER DEFAULT 0,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  rejection_reason TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### app_versions
```sql
CREATE TABLE app_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  file_path TEXT NOT NULL,
  changelog TEXT,
  security_score INTEGER,
  status TEXT DEFAULT 'pending_review',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### purchases
```sql
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, app_id)
);
```

### transactions
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id),
  app_id UUID REFERENCES apps(id),
  buyer_id UUID REFERENCES users(id),
  developer_id UUID REFERENCES developer_profiles(id),
  amount_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL,   -- 20% of amount
  developer_payout_cents INTEGER NOT NULL, -- 80% of amount
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,               -- transfer to Connect account
  status TEXT DEFAULT 'succeeded',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### app_reviews (user ratings)
```sql
CREATE TABLE app_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(app_id, user_id)
);
```

### payouts
```sql
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES developer_profiles(id),
  amount_cents INTEGER NOT NULL,
  stripe_payout_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### audit_logs
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### user_preferences
```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  dashboard_layout TEXT DEFAULT 'grid' CHECK (dashboard_layout IN ('grid', 'compact', 'list')),
  app_order JSONB DEFAULT '[]',               -- ordered array of app IDs
  pinned_apps JSONB DEFAULT '[]',             -- array of pinned app IDs (always shown first)
  quick_launch JSONB DEFAULT '[]',            -- top bar shortcuts (max 5 app IDs)
  custom_groups JSONB DEFAULT '[]',           -- [{"name": "Pre-call", "app_ids": ["id1","id2"]}]
  launcher_mode TEXT DEFAULT 'modal' CHECK (launcher_mode IN ('modal', 'panel', 'tab', 'window')),
  theme JSONB DEFAULT '{}',                   -- {"accent_color": "#58A6FF", "density": "comfortable"}
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Row Level Security

Enable RLS on ALL tables. Key policies:

```sql
-- Users can only read their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_data" ON users FOR ALL USING (firebase_uid = auth.uid());

-- Anyone can read approved apps
CREATE POLICY "apps_public_read" ON apps FOR SELECT USING (status = 'approved');
-- Developers can manage their own apps
CREATE POLICY "apps_developer_manage" ON apps FOR ALL USING (
  developer_id IN (SELECT id FROM developer_profiles WHERE user_id = auth.uid())
);

-- Users can only see their own purchases
CREATE POLICY "purchases_own" ON purchases FOR ALL USING (user_id = auth.uid());

-- Users can only access their own preferences
CREATE POLICY "preferences_own" ON user_preferences FOR ALL USING (user_id = auth.uid());

-- Admins can read everything
CREATE POLICY "admin_full_access" ON apps FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE firebase_uid = auth.uid() AND role = 'admin')
);
```

---

## API ROUTES (Vercel Serverless Functions)

### POST /api/create-checkout
Creates a Stripe Checkout session for app purchase.
```typescript
// Input: { appId: string, userId: string }
// Flow:
// 1. Look up app in Supabase (get stripe_price_id, developer's stripe_connect_id)
// 2. Create Stripe Checkout Session with:
//    - mode: 'subscription'
//    - line_items: [{ price: app.stripe_price_id, quantity: 1 }]
//    - subscription_data.application_fee_percent: 20  // marketplace keeps 20%
//    - subscription_data.transfer_data.destination: developer.stripe_connect_id
//    - success_url, cancel_url
//    - trial_period_days: 14
// 3. Return { sessionUrl }
```

### POST /api/create-connect-account
Creates a Stripe Connect onboarding link for new developers.
```typescript
// Input: { userId: string, email: string, companyName: string }
// Flow:
// 1. Create Stripe Connect account (type: 'standard')
// 2. Store stripe_connect_id in developer_profiles
// 3. Create Account Link for onboarding
// 4. Return { onboardingUrl }
```

### POST /api/submit-app
Handles app file upload and triggers security scan.
```typescript
// Input: FormData { file: HTMLFile, name, category, price, description, ... }
// Flow:
// 1. Validate file (must be .html, max 5MB)
// 2. Run automated security scan on the HTML:
//    a. Check for external script tags (only allow approved CDNs: cdnjs.cloudflare.com, fonts.googleapis.com)
//    b. Check for fetch/XMLHttpRequest to non-whitelisted domains
//    c. Check for document.cookie access
//    d. Check for tracking pixels / analytics scripts
//    e. Check for postMessage without origin validation
//    f. Check for eval() or Function() constructor
//    g. Verify provider selector exists (id="provider")
//    h. Verify API key input exists (id="apiKey")
// 3. Calculate security score (0-100)
// 4. Upload file to Supabase Storage
// 5. Create app record with status 'pending_review'
// 6. Create Stripe Product + Price for the app
// 7. Send email notification to admin team
// 8. Return { appId, securityScore }
```

### POST /api/stripe-webhook
Handles Stripe webhook events.
```typescript
// Verify webhook signature with STRIPE_WEBHOOK_SECRET
// Handle events:
//   checkout.session.completed → create purchase record, increment app installs
//   invoice.payment_succeeded → create transaction record, update revenue totals
//   customer.subscription.deleted → update purchase status to 'canceled'
//   account.updated → update developer stripe_onboarded status
//   transfer.created → log transfer to developer
```

### GET /api/health
Returns `{ status: "ok", timestamp: ISO string }` for uptime monitoring.

---

## FRONTEND PAGES — DETAILED SPECS

### Landing Page (`/`)
This is the marketing homepage. It must convert both buyers AND developers.

**Sections (in order):**
1. **Hero** — split layout. Left: badge "OPEN MARKETPLACE · 10+ TOOLS" with pulsing green dot, Georgia serif headline "The marketplace for *AI sales tools.*" (accent italic), subtext about 80/20 split and AES-256 keys, two CTAs: "Browse marketplace" (accent bg) + "Build & sell apps →" (purple outline). Right: stacked list of 5 top apps sliding in with staggered animation, each showing icon, name, dev name, rating, price. Vertical gold accent line animating in height.
2. **Stats bar** — border top/bottom, 4 stats: "2,400+" sellers (accent), "80/20" dev split (green), "AES-256" encryption (purple), "10+" tools (white). Georgia serif numbers.
3. **Developer CTA** — split grid. Left: "FOR DEVELOPERS" badge (purple), "Build once. *Earn forever.*" headline, description of the 80/20 model, CTA button with purple-to-accent gradient. Right: 4 stat cards (80% share, <48h review, $0-999 pricing, 2400+ buyers).
4. **Featured tools** — "Featured *tools*" heading, 6 AppCards in auto-fill grid.
5. **Pricing** — 3 tiers: "Pay Per App" ($0-999/app/mo), "Pro Bundle" ($99/mo, all first-party, marked POPULAR), "Enterprise" (custom). Each with feature list and CTA.
6. **Footer** — copyright, links to Privacy, Terms, Developer Agreement.

### Store (`/store`)
The browsable marketplace.

**Layout:**
- Title "Marketplace" with count of apps and developers
- Search input (searches app name + developer name)
- Category filter pills: All, Outreach, Prospecting, Meeting Prep, Productivity
- Sort dropdown: Popular, Top Rated, Price ↑, Price ↓, Newest
- Responsive grid of AppCards (min 310px columns)

**AppCard must show:**
- Icon (in accent-dim container with accent border)
- App name + developer name with verified badge (◆ for official, ● for third-party)
- Short description (2-line clamp)
- Rating (star + number in accent), user count
- Price (Georgia serif, bold) + "Add/Owned" button
- Hover: card lifts 4px, shadow deepens, gradient progress bar fills bottom

**Clicking a card opens AppDetailModal.**

### Buyer Dashboard (`/dashboard`)
Shows installed apps.

**Layout:**
- "My Apps" title with install count
- "+ Browse store" button
- API key encryption banner: "🔐 Keys encrypted locally — AES-256" with "Configure" button
- Grid of DashboardCards (or empty state with CTA to store)

**DashboardCard shows:**
- Icon, name, developer name, price
- Green active dot with glow
- "Remove" button (outline) + "Launch →" button (accent-dim)
- Hover progress bar

**Launch button opens AppLauncher modal** — loads the HTML file in a sandboxed iframe with:
```html
<iframe
  src="/apps/{file}"
  sandbox="allow-scripts allow-same-origin"
  referrerpolicy="no-referrer"
  style="width:100%;height:100%;border:none"
/>
```
On iframe load, send the user's API key via postMessage (from key-vault.ts).

### Developer Portal (`/dev`)
The developer's home base.

**Stats row** — 4 stat cards: Total earnings at 80% (green), Total installs (accent), Published apps count (purple), Avg rating (orange).

**Tabs: My Apps | Revenue | Payouts | Settings**

**My Apps tab:**
- Grid of DevAppCards showing: icon, name, version, status badge (Live/Pending/Rejected), 4 mini stats (price, installs, rating, earnings)
- "+ Submit new app" button opens SubmitAppModal

**Revenue tab:**
- Large earnings number (Georgia serif, green)
- "Fee: 20% / You keep: 80%" label
- Bar chart showing 12 months of revenue (simple div-based bars, no chart library needed)
- Revenue by app breakdown table

**Payouts tab:**
- Next payout date, method (Stripe Connect), minimum ($50), frequency (monthly)
- Payout history table

**Settings tab:**
- Developer/company name, email, Stripe Connect status, webhook URL
- "Connect Stripe" button if not onboarded (calls /api/create-connect-account)

### App Submission (`/dev/submit` or modal)
3-step wizard for submitting a new app.

**Step 1 — App Details:**
- Icon picker (emoji selector)
- App name (text input)
- Category (select from 4 options)
- Price in $/mo (number input, 0-999)
- Short description (max 120 chars, with counter)
- Long description (textarea)

**Step 2 — Upload:**
- Drag-and-drop file zone for single .html file (max 5MB)
- Requirements checklist displayed:
  - Single HTML with embedded JS/CSS
  - Provider selector (id="provider") with OpenAI + Anthropic options
  - API key input (id="apiKey")
  - No external scripts except approved CDNs
  - No data exfiltration or tracking
  - postMessage bridge for key delivery from marketplace
- File preview after upload (filename, size)

**Step 3 — Review & Submit:**
- Preview card showing how the app will look in the store
- "What happens next" timeline: auto scan → manual review (<48h) → email notification → live in marketplace → revenue flows
- Revenue split confirmation: "You 80% / Marketplace 20%"
- Submit button triggers /api/submit-app

**Progress bar across all 3 steps.**

### Admin Review (`/admin`)
Queue of submitted apps pending approval.

**Each ReviewCard shows:**
- Icon, app name, developer name, submission date
- Short description
- Security score (0-100, color-coded: green ≥90, orange ≥80, red <80)
- Status badge (Pending / In Review)
- "Approve" button (green) — sets status to 'approved', copies file to /public/apps/, sends approval email
- "Reject" button (red) — opens rejection reason input, sends feedback email
- "Preview" button — opens the HTML file in a sandboxed preview

---

## KEY VAULT (Client-Side Key Encryption)

File: `src/lib/key-vault.ts`

This is the most security-critical code. API keys must NEVER leave the user's device unencrypted, and must NEVER be sent to the marketplace server.

```typescript
// Encryption: AES-256-GCM via Web Crypto API
// Key derivation: PBKDF2-SHA256 with 310,000 iterations
// Storage: localStorage (persists across sessions, encrypted)
// Derivation seed: browser fingerprint (userAgent + language + screenSize + timezone + static salt)

export const KeyVault = {
  saveKey(provider: 'openai' | 'anthropic', key: string): Promise<void>
  getKey(provider: 'openai' | 'anthropic'): Promise<string | null>
  removeKey(provider: 'openai' | 'anthropic'): Promise<void>
  getStatus(): Promise<{ openai: boolean; anthropic: boolean }>
  purgeAll(): Promise<void>
}

// PostMessage bridge for sending keys to sandboxed app iframes:
export const KeyBridge = {
  sendKeyToApp(iframe: HTMLIFrameElement, provider: string, origin: string): Promise<void>
  startListening(origin: string): void  // listens for key requests from iframes
}
```

The KeyVault must also detect the Chrome extension (via postMessage ping/pong) and auto-upgrade to extension storage when available. See the key-vault.js file in the project for the full implementation — port it to TypeScript.

---

## STRIPE CONNECT PAYMENT FLOW

### Developer Onboarding
1. Developer signs up → developer_profiles row created
2. Developer clicks "Connect Stripe" → /api/create-connect-account creates a Standard Connect account
3. Developer completes Stripe's hosted onboarding (identity verification, bank account)
4. Webhook `account.updated` fires → set stripe_onboarded = true

### App Purchase Flow
1. Buyer clicks "Add to workspace" on an app
2. Frontend calls /api/create-checkout with appId
3. API creates Stripe Checkout Session with:
   - `subscription_data.application_fee_percent: 20`
   - `subscription_data.transfer_data.destination: developer_stripe_connect_id`
   - `trial_period_days: 14`
4. Buyer redirected to Stripe Checkout
5. On success, webhook `checkout.session.completed` fires
6. API creates purchase record in Supabase
7. Each month, `invoice.payment_succeeded` fires
8. API creates transaction record (amount, 20% fee, 80% developer payout)
9. Stripe automatically transfers 80% to developer's Connect account

### Revenue Split
- **Every transaction**: 80% goes to developer's Stripe Connect account, 20% retained by platform
- This is handled automatically by Stripe's `application_fee_percent` on the subscription
- No manual splitting needed — Stripe handles it

---

## SECURITY REQUIREMENTS

### Headers (configured in vercel.json)
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.openai.com https://api.anthropic.com https://*.supabase.co https://*.firebaseio.com https://api.stripe.com; img-src 'self' data: https:; frame-src 'self'; frame-ancestors 'self'" }
      ]
    },
    {
      "source": "/apps/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src https://api.openai.com https://api.anthropic.com; frame-ancestors 'self'" }
      ]
    }
  ]
}
```

### App Sandboxing
All third-party HTML apps run in iframes with:
- `sandbox="allow-scripts allow-same-origin"`
- Blocked: allow-top-navigation, allow-popups, allow-forms, allow-modals
- Separate CSP for /apps/ path (see above)

### Input Sanitization
Every user input must be sanitized: `< > ' " &` → HTML entities. Use DOMPurify for any HTML rendering. React's JSX escaping provides secondary protection.

### Rate Limiting
Client-side rate limiting on:
- Auth attempts: 5 per 60 seconds
- API key operations: 10 per 60 seconds
- App launches: 30 per 60 seconds

Server-side rate limiting via Cloudflare WAF rules.

### Session Management
- Firebase Auth handles JWT tokens (1 hour expiry, auto-refresh)
- Client-side inactivity timeout: 30 minutes (configurable)
- On timeout: clear all in-memory data, redirect to sign-in

---

## AUTOMATED APP SECURITY SCAN

When a developer submits an app (POST /api/submit-app), run these checks on the HTML file:

```typescript
interface SecurityScanResult {
  score: number;          // 0-100
  passed: boolean;        // score >= 70
  checks: {
    name: string;
    passed: boolean;
    severity: 'critical' | 'high' | 'medium' | 'low';
    details: string;
  }[];
}

// Checks to run:
const SECURITY_CHECKS = [
  { name: "No eval()", severity: "critical", regex: /\beval\s*\(/ },
  { name: "No Function constructor", severity: "critical", regex: /new\s+Function\s*\(/ },
  { name: "No document.cookie access", severity: "critical", regex: /document\.cookie/ },
  { name: "No external scripts", severity: "high", test: (html) => {
    // Parse <script src="..."> tags, only allow: cdnjs.cloudflare.com, fonts.googleapis.com
  }},
  { name: "No fetch to unknown domains", severity: "high", test: (html) => {
    // Check fetch() and XMLHttpRequest URLs, only allow: api.openai.com, api.anthropic.com
  }},
  { name: "No tracking pixels", severity: "medium", regex: /(google-analytics|gtag|fbq|hotjar|mixpanel)/ },
  { name: "Has provider selector", severity: "high", regex: /id=["']provider["']/ },
  { name: "Has API key input", severity: "high", regex: /id=["']apiKey["']/ },
  { name: "No localStorage of raw keys", severity: "medium", test: (html) => {
    // Check for localStorage.setItem patterns that store unencrypted keys
  }},
  { name: "Has postMessage origin check", severity: "low", test: (html) => {
    // Check for event.origin validation in message listeners
  }},
];

// Scoring: critical fail = 0, all checks pass = 100
// Weight: critical = 25pts, high = 15pts, medium = 8pts, low = 5pts
```

---

## ENVIRONMENT VARIABLES

```env
# Firebase Auth
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=

# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server-only

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=                   # server-only
STRIPE_WEBHOOK_SECRET=               # server-only
STRIPE_CONNECT_CLIENT_ID=            # server-only

# Resend
RESEND_API_KEY=                      # server-only

# Sentry
VITE_SENTRY_DSN=

# App
VITE_APP_URL=https://app.salesai.com
```

Variables prefixed with `VITE_` are exposed to the frontend. All others are server-only (used in /api/ functions).

---

## BUILD ORDER

Execute in this order, committing after each step:

1. **Project scaffold** — Vite + React + TypeScript + Tailwind + Zustand + React Router. Run `npx shadcn@latest init` and configure with the Ice & Midnight CSS variables. Install all shadcn components listed in the component mapping. Install @dnd-kit, react-hook-form, zod, lucide-react, sonner. Configure tailwind.config.ts with the extended theme (fonts, colors, animations). Set up the file structure.

2. **Design system** — Verify shadcn components render correctly with the Ice & Midnight theme override. Build custom wrapper components for AppCard (with hover lift + progress bar), the grain overlay, and the glow effects. Build layout components (Navbar using shadcn DropdownMenu, Footer, Toasts using sonner). Build the global ⌘K search palette using shadcn Command.

3. **Supabase setup** — Write all migration SQL files. Set up the Supabase client in lib/supabase.ts. Configure RLS policies.

4. **Firebase Auth** — Set up Firebase in lib/firebase.ts. Build AuthModal and DevAuthModal. Implement sign up, sign in, Google OAuth. Connect Firebase UID to Supabase users table (create user on first sign-in).

5. **Landing page** — Build the full landing page with all sections. This is the most design-heavy page — get the editorial serif + energetic interactions right here.

6. **Store + AppCards** — Build the Store page with search, filters, sort. Build AppCard with hover effects, developer attribution, progress bar animation.

7. **App Detail Modal** — Full app detail with features, developer info, version, purchase button.

8. **Buyer Dashboard** — "My Apps" page using shadcn Card + @dnd-kit/sortable for drag-and-drop reordering. Layout mode toggle (grid/compact/list using shadcn Tabs). Quick launch bar with top 5 apps. Pin/unpin favorites. Custom groups. API key encryption banner. Empty state. All preferences saved to user_preferences table in Supabase (debounced 500ms). App launcher supports 4 modes: fullscreen Dialog, side Sheet, new tab, pop-out window (configurable in settings).

9. **App Launcher** — Sandboxed iframe modal. Implement KeyBridge to send decrypted API key to iframe on load.

10. **Key Vault** — Implement AES-256-GCM encryption, localStorage persistence, Chrome extension detection, postMessage bridge. This is security-critical — test thoroughly.

11. **Stripe integration** — Build /api/create-checkout, /api/stripe-webhook. Wire up purchase flow: AppDetail "Add to workspace" → Checkout → webhook → purchase record → app appears in dashboard.

12. **Developer Portal** — Build DevPortal page with stats, app grid, revenue chart, payout schedule, settings.

13. **App Submission** — Build SubmitAppModal (3-step wizard) + /api/submit-app with file upload and security scan.

14. **Stripe Connect** — Build /api/create-connect-account. Wire developer onboarding flow. Test 80/20 split on test purchases.

15. **Admin Review** — Build AdminReview page with ReviewCards, approve/reject flow, security score display.

16. **Settings Modal** — API key management (encrypt/save/remove), security settings display, billing info.

17. **Email notifications** — Wire Resend for: welcome, purchase confirmation, app approval, app rejection, payout notification.

18. **Sentry** — Install @sentry/react, configure error boundaries, upload source maps.

19. **CI/CD** — GitHub Actions workflows for lint, test, build, security audit, auto-deploy.

20. **Security hardening** — vercel.json headers, input sanitization audit, rate limiter implementation, RLS policy verification.

---

## TESTING CHECKLIST

Before considering any section done:

- [ ] All TypeScript compiles with no errors
- [ ] Tailwind classes match the Ice & Midnight design spec
- [ ] Responsive: works at 1440px, 1024px, 768px widths
- [ ] Auth flow: signup → dashboard, developer signup → dev portal, admin → review queue
- [ ] Store: search works, filters work, sort works, cards hover correctly
- [ ] Purchase flow: add to workspace → Stripe checkout → webhook → app in dashboard
- [ ] Developer flow: submit app → security scan → pending review → admin approves → live in store
- [ ] Key Vault: save key → encrypted in localStorage → launch app → key delivered via postMessage
- [ ] Stripe Connect: developer onboards → purchase triggers 80/20 split → payout scheduled
- [ ] Iframe sandboxing: app cannot navigate parent, cannot open popups, cannot access parent DOM
- [ ] XSS: all inputs sanitized, no unsanitized user content rendered
- [ ] RLS: buyer cannot see other buyers' purchases, developer cannot edit other developers' apps

---

## IMPORTANT NOTES FOR CLAUDE CODE

1. **Do not use placeholder or mock data in production code.** All data must come from Supabase queries. Use mock data only in seed scripts.

2. **TypeScript strict mode.** No `any` types. Define proper interfaces for all data shapes.

3. **Error handling everywhere.** Every Supabase query, every Stripe call, every Firebase operation must have try/catch with user-friendly error messages displayed via Toast.

4. **Never log sensitive data.** No API keys, no passwords, no payment info in console.log or Sentry.

5. **The grain overlay and glow effects are not optional.** They define the visual identity. Implement them with CSS, not as images.

6. **Georgia serif for headlines is not optional.** Every h1/h2 on every page uses Georgia with letter-spacing: -1px to -2px and font-weight: 400. Accent-colored italic words are a core pattern.

7. **Card hover animations are not optional.** Every card must lift on hover with the gradient progress bar filling at the bottom. This is what makes the UI feel alive.

8. **The 80/20 split must be real.** Use Stripe's application_fee_percent on subscriptions. Do not try to manually split payments.

9. **API keys never touch the server.** The KeyVault encrypts client-side. The KeyBridge sends to iframes client-side. No API route ever receives an AI provider API key.

10. **Commit after each major section** with a descriptive commit message. Do not build everything in one giant commit.

11. **SECURITY IS NON-NEGOTIABLE.** Read and implement SECURITY-HARDENING-SPEC.md alongside this document. Every API route must implement: Firebase Admin token verification, Zod input validation, Upstash rate limiting, and audit logging. No exceptions.

12. **Every API route follows the same pattern:** Method check → Rate limit → Auth verification → Input validation → Authorization → Business logic → Audit log → Safe error response. Copy the pattern from SECURITY-HARDENING-SPEC.md.

13. **Install Upstash Redis for server-side rate limiting.** Client-side rate limiting is trivially bypassed. The `/api/create-checkout` and `/api/create-connect-account` routes MUST have server-side rate limits via Upstash.

14. **Stripe webhook signature verification is mandatory.** Use `stripe.webhooks.constructEvent()` with the raw request body. Never parse the body as JSON before verifying. This is the line that prevents forged payment events.

15. **DOMPurify on all user-generated content.** Install `dompurify` and use it before rendering any content that came from user input or database queries, especially app descriptions submitted by developers.

16. **Sentry must redact sensitive data.** Configure `beforeSend` to strip Authorization headers, API keys, and any field matching `/key|token|secret|password/i` from breadcrumbs and event data.

17. **RLS policies must prevent role escalation.** The user update policy must include a `WITH CHECK` that prevents users from changing their own `role` column. Test this explicitly.

18. **Purchases are server-side only.** The Supabase `anon` key must NOT have INSERT/UPDATE/DELETE permissions on the `purchases` or `transactions` tables. These are written exclusively by webhook handlers using the `service_role` key.

