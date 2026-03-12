# Claude Code Prompts — Run These in Order

## How This Works

1. Put `CLAUDE-CODE-BUILD-PROMPT.md` and `SECURITY-HARDENING-SPEC.md` in your repo root
2. Open the repo in VS Code with Claude Code
3. Copy-paste each prompt below, one at a time
4. After each prompt completes, run `npm run dev` and verify in your browser
5. Fix any issues before moving to the next prompt
6. After all 8 prompts, copy the 10 HTML app files into `public/apps/`

---

## PROMPT 1 — Scaffold + Design System

```
Read the files CLAUDE-CODE-BUILD-PROMPT.md and SECURITY-HARDENING-SPEC.md in this repo. These are your complete build specifications.

Start with Steps 1 and 2 only:

Step 1 — Project Scaffold:
- Initialize Vite + React 18 + TypeScript project
- Run shadcn init and install ALL components listed in the "Install all required components" section
- Install all additional dependencies: @dnd-kit/core, @dnd-kit/sortable, react-hook-form, @hookform/resolvers, zod, sonner, lucide-react, class-variance-authority, clsx, tailwind-merge, dompurify, zustand, react-router-dom, firebase, @supabase/supabase-js, @stripe/stripe-js, @sentry/react, @upstash/ratelimit, @upstash/redis
- Set up tailwind.config.ts exactly as specified (custom fonts, midnight/ice colors, animations)
- Set up globals.css with the shadcn CSS variable overrides for Ice & Midnight theme
- Create the full project file structure from the spec
- Create .env.example with all environment variables listed

Step 2 — Design System:
- Verify shadcn components render with the dark theme
- Build the Navbar component (adapts by user role: buyer/developer/admin)
- Build the Footer component
- Set up sonner for toast notifications
- Add the grain texture overlay (SVG noise filter, fixed position, opacity 0.025)
- Add the radial glow effect component
- Create a reusable AppCard wrapper with hover lift + gradient progress bar animation

Commit with message: "feat: project scaffold + design system"
```

---

## PROMPT 2 — Database + Auth

```
Continue building from CLAUDE-CODE-BUILD-PROMPT.md — Steps 3 and 4.

Step 3 — Supabase Setup:
- Write all migration SQL files in supabase/migrations/:
  - 001_create_users.sql
  - 002_create_apps.sql
  - 003_create_purchases.sql
  - 004_create_reviews.sql
  - 005_create_payouts.sql
  - 006_create_audit_logs.sql
  - 007_create_user_preferences.sql
- Include ALL Row Level Security policies from the spec
- Make sure the user update policy prevents role escalation (WITH CHECK on role field)
- Set up the Supabase client in src/lib/supabase.ts
- Create TypeScript interfaces for all database tables

Step 4 — Firebase Auth:
- Set up Firebase in src/lib/firebase.ts
- Create src/lib/verify-auth.ts for server-side token verification (Firebase Admin)
- Build the auth store (src/store/useAuthStore.ts) with Zustand
- Build AuthModal (buyer sign up/in)
- Build DevAuthModal (developer sign up/in)
- Implement email/password sign up and sign in
- Add Google OAuth button
- On first sign-in, create a user record in Supabase
- Implement 30-minute inactivity timeout from SECURITY-HARDENING-SPEC.md
- Set up React Router with protected routes (redirect to sign-in if not authenticated)

Commit with message: "feat: database schema + firebase auth"
```

---

## PROMPT 3 — Landing Page + Store

```
Continue building — Steps 5, 6, and 7 from CLAUDE-CODE-BUILD-PROMPT.md.

This is the most design-heavy section. Follow the Ice & Midnight spec EXACTLY.

Step 5 — Landing Page:
- Build all 6 sections in order:
  1. Hero: split layout, badge with pulsing green dot, Georgia serif headline ("The marketplace for *AI sales tools.*" with accent italic), two CTAs (Browse marketplace + Build & sell apps), right side stacked app cards with staggered slide-in animation and vertical accent line
  2. Stats bar: 4 stats with Georgia serif numbers, each a different color
  3. Developer CTA: "Build once. Earn forever." with the 4 stat cards (80%, <48h, $0-999, 2400+)
  4. Featured tools: heading + 6 AppCards in responsive grid
  5. Pricing: 3 tiers (Pay Per App, Pro Bundle with "POPULAR" badge, Enterprise)
  6. Footer

Step 6 — Store Page:
- Search input (searches app name + developer name)
- Category filter pills (All, Outreach, Prospecting, Meeting Prep, Productivity)
- Sort dropdown (Popular, Top Rated, Price ascending, Price descending, Newest)
- Responsive grid of AppCards (min 310px columns)
- Fetch apps from Supabase (status = 'approved')

Step 7 — App Detail Modal:
- Full app detail using shadcn Dialog
- Icon, name, developer name with verified badge
- Version, category, updated date as tags
- Long description, features grid
- Price with "Dev gets 80%" note
- "Add to workspace" button (triggers Stripe checkout when wired)

Every card MUST have: hover lift (-4px translateY), shadow deepening, and the gradient progress bar filling at the bottom on hover.

Commit with message: "feat: landing page + store + app detail"
```

---

## PROMPT 4 — Dashboard + Key Vault + App Launcher

```
Continue building — Steps 8, 9, and 10.

Step 8 — Customizable Buyer Dashboard:
- "My Apps" heading with install count
- "+ Browse store" button
- API key encryption status banner
- App grid using shadcn Card + @dnd-kit/sortable for drag-and-drop reordering
- Layout mode toggle (grid / compact / list) using shadcn Tabs
- Quick launch bar at top (user's top 5 apps as icon buttons)
- Pin/unpin favorites (pinned always appear first)
- Empty state with CTA to store
- Save all preferences to user_preferences table in Supabase (debounced 500ms on every change)
- DashboardCards show: icon, name, dev name, price, green active dot, Remove + Launch buttons

Step 9 — App Launcher:
- Sandboxed iframe modal using shadcn Dialog (fullscreen) or Sheet (side panel)
- Launcher mode from user preferences: modal, panel, tab, or window
- Iframe config: sandbox="allow-scripts allow-same-origin", referrerpolicy="no-referrer"
- On iframe load, send API key via postMessage using KeyBridge

Step 10 — Key Vault (SECURITY CRITICAL):
- Implement in src/lib/key-vault.ts
- AES-256-GCM encryption via Web Crypto API
- PBKDF2-SHA256 key derivation with 310,000 iterations
- Browser fingerprint as derivation seed
- localStorage persistence (encrypted)
- KeyVault.saveKey(), getKey(), removeKey(), getStatus(), purgeAll()
- KeyBridge.sendKeyToApp() — sends decrypted key to iframe via postMessage
- NEVER use '*' as target origin in postMessage from marketplace side
- Chrome extension detection via postMessage ping (500ms timeout, fallback to localStorage)
- Follow SECURITY-HARDENING-SPEC.md Section "Layer 8: Client-Side Security"

Commit with message: "feat: dashboard + key vault + app launcher"
```

---

## PROMPT 5 — Stripe Payments

```
Continue building — Steps 11 and 14.

CRITICAL: Every API route MUST follow the security pattern from SECURITY-HARDENING-SPEC.md:
Method check → Rate limit (Upstash) → Auth verification (Firebase Admin) → Input validation (Zod) → Authorization → Business logic → Audit log → Safe error response

Step 11 — Core Stripe Integration:
- Build /api/create-checkout.ts:
  - Verify Firebase token server-side
  - Validate input with Zod (appId must be UUID)
  - Rate limit: 10 requests/minute per user
  - Run fraud checks: user verified, not duplicate purchase, app is approved, purchase rate limit
  - Create Stripe Checkout Session with application_fee_percent: 20 and transfer_data.destination
  - trial_period_days: 14
  - Audit log the checkout creation
  
- Build /api/stripe-webhook.ts:
  - Verify webhook signature with stripe.webhooks.constructEvent() using RAW body
  - Handle: checkout.session.completed, invoice.payment_succeeded, invoice.payment_failed, customer.subscription.deleted, account.updated, transfer.created
  - On checkout complete: create purchase record in Supabase, increment app install count
  - On payment succeeded: create transaction record with amount, platform fee (20%), developer payout (80%)
  - On subscription deleted: update purchase status to 'canceled'
  - Always return 200 to Stripe

Step 14 — Stripe Connect:
- Build /api/create-connect-account.ts:
  - Create Standard Connect account
  - Store stripe_connect_id in developer_profiles
  - Return Account Link URL for onboarding
  - Rate limit: 3 requests/minute per user

- Wire the frontend:
  - AppDetailModal "Add to workspace" → calls create-checkout → redirects to Stripe
  - Success URL returns to dashboard with toast "App added!"
  - Developer Portal Settings → "Connect Stripe" → calls create-connect-account → redirects to Stripe onboarding

Use Stripe's idempotency_key on all creation calls to prevent duplicate charges.

Commit with message: "feat: stripe payments + connect"
```

---

## PROMPT 6 — Developer Portal + App Submission

```
Continue building — Steps 12 and 13.

Step 12 — Developer Portal:
- Page at /dev with 4 tabs (shadcn Tabs):

  My Apps tab:
  - Grid of DevAppCards showing: icon, name, version, status badge (Live/Pending/Rejected)
  - 4 mini stats per card: price, installs, rating, earnings (at 80%)
  - "+ Submit new app" button

  Revenue tab:
  - Large total earnings number (Georgia serif, green)
  - "Fee: 20% / You keep: 80%" label
  - Simple bar chart showing 12 months (div-based, no chart library needed)
  - Revenue by app breakdown

  Payouts tab:
  - Next payout date, method (Stripe Connect), minimum ($50), frequency (monthly)
  - Payout history from payouts table

  Settings tab:
  - Developer name, email, Stripe Connect status
  - "Connect Stripe" button if not onboarded
  - Webhook URL field

Step 13 — App Submission:
- Build SubmitAppModal as a 3-step wizard:

  Step 1 — App Details:
  - Icon picker (emoji selector)
  - App name, category (select), price ($0-999), short description (max 120 chars with counter), long description

  Step 2 — Upload:
  - Drag-and-drop file zone (single .html, max 5MB)
  - Requirements checklist displayed
  - File preview after upload (filename, size)

  Step 3 — Review & Submit:
  - Preview card showing how it will look in the store
  - "What happens next" timeline
  - Revenue split confirmation
  - Submit button

- Build /api/submit-app.ts:
  - Follow the full security pattern
  - Validate file (must be .html, max 5MB)
  - Run ALL 15 security checks from SECURITY-HARDENING-SPEC.md file scanner
  - Calculate security score (0-100)
  - Upload file to Supabase Storage
  - Create app record with status 'pending_review'
  - Create Stripe Product + Price
  - Send notification email to admin via Resend

Commit with message: "feat: developer portal + app submission"
```

---

## PROMPT 7 — Admin + Email + Monitoring

```
Continue building — Steps 15, 16, 17, and 18.

Step 15 — Admin Review:
- Page at /admin (only accessible to role='admin')
- Review queue: list of apps with status 'pending_review' or 'in_review'
- Each ReviewCard shows: icon, name, developer, submission date, description, security score (color-coded), status badge
- "Approve" button: sets status to 'approved', sets published_at, sends approval email to developer
- "Reject" button: opens textarea for rejection reason, sends feedback email
- "Preview" button: opens the HTML file in a sandboxed iframe preview

Step 16 — Settings Modal:
- shadcn Dialog with tabs (shadcn Tabs):
  - API Keys tab: encrypt/save/remove for OpenAI and Anthropic, uses Key Vault
  - Security tab: status display for session timeout, 2FA, rate limiting, CSP, iframe sandbox
  - Billing tab: current plan, payment method, subscription management link

Step 17 — Transactional Email (Resend):
- Set up Resend client in src/lib/resend.ts
- Create email templates for:
  - Welcome (new user sign up)
  - Purchase confirmation (app added to workspace)
  - App approved (developer notification)
  - App rejected (developer notification with feedback)
  - Payout notification (developer received payment)
- Send from appropriate API routes

Step 18 — Sentry:
- Initialize in main.tsx with the config from SECURITY-HARDENING-SPEC.md
- MUST include the beforeSend filter that strips Authorization headers and redacts any field matching /key|token|secret|password/i
- Set up Error Boundary component wrapping the app
- Set tracesSampleRate to 0.1
- Disable session replay (privacy)

Commit with message: "feat: admin review + email + monitoring"
```

---

## PROMPT 8 — Security Hardening + CI/CD + Final Review

```
Final steps 19 and 20 from CLAUDE-CODE-BUILD-PROMPT.md.

Step 19 — CI/CD:
- Create .github/workflows/ci.yml: runs on every PR — lint, type-check, build
- Create .github/workflows/deploy.yml: runs on push to main — deploy to Vercel
- Create .github/workflows/security-scan.yml: runs weekly — npm audit, dependency check

Step 20 — Security Hardening (audit the ENTIRE codebase):
- Verify vercel.json has ALL security headers from SECURITY-HARDENING-SPEC.md
- Audit every /api/ route: does it have auth verification, rate limiting, Zod validation, and audit logging?
- Verify DOMPurify is used on all user-generated content before rendering
- Verify the Key Vault never sends unencrypted keys anywhere
- Verify postMessage calls from marketplace never use '*' as target origin
- Verify RLS policies prevent:
  - Users reading other users' purchases
  - Users changing their own role
  - Anonymous access to transactions/payouts tables
  - Developers editing approved/suspended apps
- Verify Stripe webhook handler uses raw body for signature verification
- Verify SUPABASE_SERVICE_ROLE_KEY is never imported in any frontend file
- Verify STRIPE_SECRET_KEY is never in any VITE_ prefixed variable
- Run `npx tsc --noEmit` and fix any TypeScript errors
- Run `npm run build` and fix any build errors

Do a final review of the entire codebase against both spec documents.
List anything that was missed or needs attention.

Commit with message: "feat: security hardening + CI/CD + final review"
```

---

## AFTER ALL 8 PROMPTS

### Add the app files:
```bash
# Copy the 10 HTML files from the build package into public/apps/
mkdir -p public/apps
cp /path/to/apps/*.html public/apps/
git add public/apps/
git commit -m "content: add 10 first-party app files"
git push origin main
```

### Then follow LAUNCH-SETUP-GUIDE.md:
1. Set up Firebase (Phase 2)
2. Set up Supabase and run migrations (Phase 3)
3. Set up Stripe and create Products (Phase 4)
4. Set up Upstash Redis (Phase 5)
5. Deploy to Vercel (Phase 6)
6. Set up domain + Cloudflare (Phase 7)
7. Set up monitoring (Phase 8)
8. Run the verification checklist (Phase 10)
