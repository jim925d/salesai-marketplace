# SalesAI Marketplace — Launch Setup Guide

From "code on your laptop" to "live product taking payments" — every step, in order.

**Estimated total setup time:** 4-8 hours for someone comfortable with developer tools.

---

## PHASE 1: LOCAL DEVELOPMENT (30 minutes)

These steps get the marketplace running on your machine.

### Step 1.1 — Prerequisites

Install these if you don't have them:

| Tool | Install | Verify |
|------|---------|--------|
| Node.js 20+ | https://nodejs.org (LTS) | `node --version` |
| npm 10+ | Comes with Node | `npm --version` |
| Git | https://git-scm.com | `git --version` |
| VS Code | https://code.visualstudio.com | Open it |
| Claude Code extension | VS Code Extensions → search "Claude" | Installed in sidebar |

### Step 1.2 — Create the Repository

```bash
# Create the marketplace repo
mkdir salesai-marketplace
cd salesai-marketplace
git init

# Create .env file (empty for now — you'll fill it in)
cp .env.example .env

# Install dependencies (Claude Code will have created package.json)
npm install

# Start the dev server
npm run dev
```

Open `http://localhost:5173` — you should see the marketplace UI. Everything renders but nothing connects to backends yet. That's expected.

### Step 1.3 — Create the Apps Repo (separate)

```bash
# In a different directory
mkdir salesai-apps
cd salesai-apps
git init

# Create folders for each app
mkdir -p {01-objection-response-generator,02-crm-note-summarizer,03-icp-match-scorer,04-contact-enricher,05-cold-email-writer,06-linkedin-message-crafter,07-commission-calculator,08-email-to-crm-logger,09-account-briefing-builder,10-discovery-question-generator}

# Copy the 10 HTML files from the build package into their folders
# Each folder gets: app.html (the HTML file renamed)
```

---

## PHASE 2: FIREBASE AUTH (45 minutes)

Firebase handles user sign-up, sign-in, and session management.

### Step 2.1 — Create a Firebase Project

1. Go to https://console.firebase.google.com
2. Click **"Create a project"**
3. Name it `salesai-marketplace`
4. Disable Google Analytics (not needed)
5. Click **Create project** → wait for it to provision

### Step 2.2 — Enable Authentication

1. In the Firebase console, go to **Authentication** (left sidebar)
2. Click **Get started**
3. Under **Sign-in method**, enable:
   - **Email/Password** — toggle ON
   - **Google** — toggle ON, select your support email
4. Go to **Settings** → **Authorized domains**
5. Add your domains:
   - `localhost` (already there)
   - `salesai.com` (your production domain — add later)
   - `*.vercel.app` (for preview deployments)

### Step 2.3 — Get Your Config Keys

1. Go to **Project settings** (gear icon, top left)
2. Scroll down to **"Your apps"**
3. Click the web icon **(</>)** to register a web app
4. Name it `SalesAI Marketplace`
5. Don't check "Firebase Hosting"
6. Click **Register app**
7. You'll see a config object like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB...",
  authDomain: "salesai-marketplace.firebaseapp.com",
  projectId: "salesai-marketplace",
};
```

8. Copy these three values into your `.env` file:

```env
VITE_FIREBASE_API_KEY=AIzaSyB...
VITE_FIREBASE_AUTH_DOMAIN=salesai-marketplace.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=salesai-marketplace
```

### Step 2.4 — Create a Service Account (for server-side verification)

1. Still in **Project settings**, go to the **Service accounts** tab
2. Click **Generate new private key**
3. Download the JSON file
4. Open it and copy the entire contents
5. In your `.env` file, set it as a single-line string:

```env
FIREBASE_ADMIN_SDK_KEY={"type":"service_account","project_id":"salesai-marketplace","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"..."}
```

**IMPORTANT:** This key is highly sensitive. Never commit it to Git. Never put it in a `VITE_` prefixed variable.

### Step 2.5 — Verify Auth Works

1. Restart your dev server: `npm run dev`
2. Click "Get started" on the landing page
3. Fill in the sign-up form and submit
4. You should see a toast notification and land on the dashboard
5. Check Firebase console → **Authentication** → **Users** — your account should appear

**Troubleshooting:**
- "auth/configuration-not-found" → Double-check your API key in `.env`
- "auth/unauthorized-domain" → Add `localhost` to authorized domains
- Console error about Firebase → Make sure `npm install firebase firebase-admin` ran

---

## PHASE 3: SUPABASE (1-2 hours)

Supabase is your database — all users, apps, purchases, and transactions live here.

### Step 3.1 — Create a Supabase Project

1. Go to https://supabase.com and sign up / sign in
2. Click **New Project**
3. Organization: create one or select existing
4. Project name: `salesai-marketplace`
5. Database password: generate a strong one and **save it** (you'll need it)
6. Region: pick the closest to your users (e.g., US East for US-based)
7. Pricing plan: **Free** is fine to start (500MB database, 50K auth requests)
8. Click **Create new project** → wait 2-3 minutes for provisioning

### Step 3.2 — Get Your Keys

1. Go to **Settings** → **API** (left sidebar)
2. Copy these values into your `.env`:

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**CRITICAL:** The `anon` key is safe for the frontend (it's restricted by Row Level Security). The `service_role` key bypasses ALL security — it's server-only. NEVER put it in a `VITE_` variable.

3. Go to **Settings** → **Database** → **Connection string** → **URI**
4. Copy the connection string and add your password:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklmnop.supabase.co:5432/postgres
```

### Step 3.3 — Run Database Migrations

1. Go to **SQL Editor** (left sidebar) in the Supabase dashboard
2. Open each migration file from `supabase/migrations/` in order:
   - `001_create_users.sql`
   - `002_create_apps.sql`
   - `003_create_purchases.sql`
   - `004_create_reviews.sql`
   - `005_create_payouts.sql`
   - `006_create_audit_logs.sql`
   - `007_create_user_preferences.sql`
3. For each file: paste the SQL into the editor and click **Run**
4. After each one, verify the table was created under **Table Editor** (left sidebar)

Or run them all at once via CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref abcdefghijklmnop

# Run migrations
supabase db push
```

### Step 3.4 — Verify Row Level Security

1. Go to **Table Editor** → click on the `users` table
2. Look for the **RLS** badge — it should say "RLS enabled"
3. Click into **Policies** — you should see the policies from the migration
4. Repeat for all tables: `apps`, `purchases`, `transactions`, etc.

If RLS is NOT enabled on any table, run:

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Step 3.5 — Seed Your First-Party Apps

You need to insert the 10 app records into the database so they appear in the store.

1. Go to **SQL Editor**
2. Run the seed script (Claude Code should have generated this, or create it):

```sql
-- First, create a developer profile for SalesAI (your first-party account)
-- You'll need the user ID of whoever signed up as admin
INSERT INTO developer_profiles (user_id, company_name, verified, stripe_onboarded)
VALUES ('[YOUR-ADMIN-USER-ID]', 'SalesAI', true, true);

-- Then insert each app (example for App 1)
INSERT INTO apps (developer_id, name, slug, icon, category, price_cents, description, features, file_path, status, version, published_at)
VALUES (
  '[DEVELOPER-PROFILE-ID]',
  'Objection Response Generator',
  'objection-response-generator',
  '⚡',
  'Outreach',
  1900,
  'Paste an email thread — get 2 strategic response options with negotiation tactics.',
  '["Thread analysis", "8 negotiation tactics", "Tone control", "2 strategic options"]',
  '/apps/01-objection-response-generator.html',
  'approved',
  '2.0.0',
  now()
);
-- Repeat for all 10 apps
```

### Step 3.6 — Verify Data

1. Go to **Table Editor** → `apps` table
2. You should see 10 rows
3. Check that `status` = `approved` and `file_path` is set for each

---

## PHASE 4: STRIPE (1-2 hours)

Stripe handles all money — buyer subscriptions, the 80/20 developer split, and payouts.

### Step 4.1 — Create a Stripe Account

1. Go to https://dashboard.stripe.com/register
2. Sign up with your email
3. Verify your email
4. You'll start in **Test Mode** (toggle in top right says "Test mode") — stay here for now

### Step 4.2 — Get API Keys

1. Go to **Developers** → **API keys** (or click the key icon)
2. You'll see:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: click "Reveal" → `sk_test_...`
3. Add to your `.env`:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51...
```

### Step 4.3 — Enable Stripe Connect

This is what lets developers receive their 80% share.

1. Go to **Settings** → **Connect** → **Settings** (or https://dashboard.stripe.com/settings/connect)
2. Under **Platform profile**, fill in:
   - Platform name: `SalesAI Marketplace`
   - Platform description: `Marketplace for AI-powered sales tools`
   - Platform website: your URL
3. Under **Branding**, upload your logo
4. Under **Connect onboarding**:
   - Account type: **Standard** (recommended — Stripe hosts the onboarding)
   - Country availability: select your target markets
5. Save everything
6. Copy your **Connect Client ID** from the settings page:

```env
STRIPE_CONNECT_CLIENT_ID=ca_...
```

### Step 4.4 — Set Up Webhook Endpoint

Webhooks are how Stripe tells your app about payments. This is critical.

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://your-domain.com/api/stripe-webhook` (use your Vercel URL — set this up after deploying in Phase 6, or use a temporary URL for local testing)
4. Events to listen to — select these:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
   - `account.updated` (for Connect)
   - `transfer.created`
5. Click **Add endpoint**
6. On the endpoint detail page, click **Reveal signing secret**:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Step 4.5 — Create Products for Your 10 Apps

Each app needs a Stripe Product + Price.

1. Go to **Products** → **Add product**
2. For each app, create:
   - Name: `Objection Response Generator`
   - Description: (short description)
   - Pricing: **Recurring** → Monthly → amount (e.g., $19.00)
   - Click **Save product**
3. After creating, click into the product → click into the Price
4. Copy the **Price ID** (starts with `price_...`)
5. Update the `apps` table in Supabase:

```sql
UPDATE apps SET stripe_price_id = 'price_1...' WHERE slug = 'objection-response-generator';
UPDATE apps SET stripe_price_id = 'price_2...' WHERE slug = 'crm-note-summarizer';
-- ... repeat for all 10
```

Also copy each **Product ID** (`prod_...`) into `stripe_product_id`.

### Step 4.6 — Test a Purchase (Local)

For local webhook testing, install the Stripe CLI:

```bash
# Install
brew install stripe/stripe-cli/stripe   # macOS
# or download from https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:5173/api/stripe-webhook
```

The CLI will output a webhook signing secret — use this for local testing (different from your production secret).

Now test:
1. Sign up as a buyer
2. Click "Add to workspace" on any app
3. You should be redirected to Stripe Checkout
4. Use test card: `4242 4242 4242 4242`, any future date, any CVC, any zip
5. After payment, check:
   - Stripe Dashboard → Payments (should show the test payment)
   - Supabase → `purchases` table (should have a new row)
   - Your dashboard should now show the app

### Step 4.7 — Go Live with Stripe (later, when ready for real payments)

1. Complete Stripe account verification:
   - **Settings** → **Account details** → fill in business info
   - Verify your identity (government ID)
   - Add bank account for payouts
2. Toggle from **Test mode** to **Live mode** (top right)
3. Get your LIVE API keys (different from test keys)
4. Create a new webhook endpoint with your production URL
5. Update `.env` with live keys
6. Re-create Products/Prices in live mode (test mode products don't carry over)

---

## PHASE 5: UPSTASH REDIS (15 minutes)

Server-side rate limiting to prevent abuse.

### Step 5.1 — Create Upstash Account

1. Go to https://upstash.com and sign up
2. Click **Create database**
3. Name: `salesai-ratelimit`
4. Region: pick closest to your Vercel deployment region
5. Type: **Regional** (cheaper, fine for rate limiting)
6. Click **Create**

### Step 5.2 — Get Credentials

1. On the database detail page, scroll to **REST API**
2. Copy the URL and token:

```env
UPSTASH_REDIS_REST_URL=https://us1-...upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...
```

That's it. The rate limiter in the codebase reads these automatically.

---

## PHASE 6: DEPLOY TO VERCEL (30 minutes)

This puts your marketplace live on the internet.

### Step 6.1 — Push to GitHub

```bash
cd salesai-marketplace

# Create GitHub repo (via github.com or CLI)
gh repo create salesai-marketplace --private

# Push your code
git add .
git commit -m "Initial marketplace build"
git push origin main
```

### Step 6.2 — Connect to Vercel

1. Go to https://vercel.com and sign in with GitHub
2. Click **Add New** → **Project**
3. Import your `salesai-marketplace` repo
4. Framework Preset: **Vite** (should auto-detect)
5. **Environment Variables** — this is the critical part. Add every variable from your `.env`:

| Variable | Value | Note |
|----------|-------|------|
| `VITE_FIREBASE_API_KEY` | `AIzaSy...` | Client-safe |
| `VITE_FIREBASE_AUTH_DOMAIN` | `...firebaseapp.com` | Client-safe |
| `VITE_FIREBASE_PROJECT_ID` | `salesai-marketplace` | Client-safe |
| `FIREBASE_ADMIN_SDK_KEY` | `{"type":"service_account",...}` | Server-only |
| `VITE_SUPABASE_URL` | `https://...supabase.co` | Client-safe |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Client-safe |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Server-only |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | Client-safe |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Server-only |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Server-only |
| `STRIPE_CONNECT_CLIENT_ID` | `ca_...` | Server-only |
| `UPSTASH_REDIS_REST_URL` | `https://...upstash.io` | Server-only |
| `UPSTASH_REDIS_REST_TOKEN` | `AX...` | Server-only |
| `RESEND_API_KEY` | `re_...` | Server-only |
| `VITE_SENTRY_DSN` | `https://...sentry.io/...` | Client-safe |
| `VITE_APP_URL` | `https://your-domain.com` | Client-safe |

6. Click **Deploy**
7. Wait 2-3 minutes for the build
8. Vercel gives you a URL like `salesai-marketplace-abc123.vercel.app`
9. Test it — everything should work just like localhost but publicly accessible

### Step 6.3 — Deploy the App Files

The 10 HTML tool files need to be in the `/public/apps/` directory of your marketplace repo.

```bash
# From your salesai-apps repo, copy the HTML files
cp 01-objection-response-generator/app.html ../salesai-marketplace/public/apps/01-objection-response-generator.html
cp 02-crm-note-summarizer/app.html ../salesai-marketplace/public/apps/02-crm-note-summarizer.html
# ... repeat for all 10

# Commit and push
cd ../salesai-marketplace
git add public/apps/
git commit -m "Add 10 first-party app HTML files"
git push origin main
```

Vercel auto-deploys on every push to `main`. Within 2 minutes, the apps are live.

### Step 6.4 — Update Stripe Webhook URL

Now that you have a live URL:

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Edit your endpoint URL to: `https://your-vercel-url.vercel.app/api/stripe-webhook`
3. Or if using a custom domain: `https://app.salesai.com/api/stripe-webhook`

### Step 6.5 — Update Firebase Authorized Domains

1. Firebase console → **Authentication** → **Settings** → **Authorized domains**
2. Add your Vercel URL: `salesai-marketplace-abc123.vercel.app`
3. Add your custom domain when ready: `app.salesai.com`

---

## PHASE 7: CUSTOM DOMAIN + CLOUDFLARE (30-60 minutes)

### Step 7.1 — Buy a Domain

Buy `salesai.com` (or your preferred name) from any registrar: Namecheap, Google Domains, Cloudflare Registrar, etc.

### Step 7.2 — Add to Cloudflare

1. Go to https://dash.cloudflare.com and sign up / sign in
2. Click **Add a site** → enter your domain
3. Select the **Free** plan (includes WAF, DDoS protection, SSL)
4. Cloudflare will scan your DNS records
5. **Change your nameservers** at your registrar to the ones Cloudflare provides
   - This takes up to 24 hours to propagate (usually 15-60 minutes)
6. Wait for Cloudflare to confirm the nameservers are active

### Step 7.3 — Configure DNS to Point to Vercel

1. In Cloudflare DNS settings, add:
   - **CNAME** record: `app` → `cname.vercel-dns.com` (proxied, orange cloud ON)
   - Or **A** record: `@` → `76.76.21.21` (Vercel's IP)
2. In Vercel → **Settings** → **Domains** → Add `app.salesai.com`
3. Vercel will verify the DNS and provision an SSL certificate

### Step 7.4 — Configure Cloudflare Security

1. **SSL/TLS** → set to **Full (Strict)**
2. **SSL/TLS** → **Edge Certificates** → enable **Always Use HTTPS**
3. **SSL/TLS** → **Edge Certificates** → Minimum TLS Version: **1.2**
4. **Security** → **WAF** → Enable OWASP Core Ruleset
5. **Security** → **Bots** → Enable **Bot Fight Mode**
6. **Rules** → **Rate Limiting** → Create rules:

| Rule | Requests | Per | Path | Action |
|------|----------|-----|------|--------|
| Checkout rate limit | 10 | 1 minute | `/api/create-checkout` | Block |
| Connect rate limit | 3 | 1 minute | `/api/create-connect-account` | Block |
| Submit rate limit | 5 | 1 hour | `/api/submit-app` | Block |
| Global API limit | 100 | 1 minute | `/api/*` | Challenge |

### Step 7.5 — Update Environment Variables

Update all URLs that reference your domain:

1. **Vercel** → Environment Variables → update `VITE_APP_URL` to `https://app.salesai.com`
2. **Firebase** → Authorized domains → add `app.salesai.com`
3. **Stripe** → Webhook endpoint → update to `https://app.salesai.com/api/stripe-webhook`
4. **Stripe** → Connect settings → add redirect URLs for `app.salesai.com`

---

## PHASE 8: MONITORING (30 minutes)

### Step 8.1 — Sentry (Error Tracking)

1. Go to https://sentry.io and sign up
2. Create a project → Platform: **React** → Name: `salesai-marketplace`
3. Copy the **DSN** from the setup page:

```env
VITE_SENTRY_DSN=https://abc123@o456.ingest.sentry.io/789
```

4. For source map uploads in CI, go to **Settings** → **Developer Settings** → **Auth Tokens**
5. Create a token with `project:releases` and `org:read` scopes:

```env
SENTRY_AUTH_TOKEN=sntrys_...
SENTRY_ORG=your-org-name
SENTRY_PROJECT=salesai-marketplace
```

### Step 8.2 — Resend (Transactional Email)

1. Go to https://resend.com and sign up
2. Go to **API Keys** → **Create API Key**
3. Name: `salesai-production`, Permission: **Full access**

```env
RESEND_API_KEY=re_...
```

4. Go to **Domains** → **Add Domain**
5. Add `salesai.com`
6. Resend will give you DNS records (TXT, CNAME) to add in Cloudflare
7. Add those records in Cloudflare DNS
8. Click **Verify** in Resend once DNS propagates
9. Now emails come from `noreply@salesai.com` instead of Resend's default

### Step 8.3 — BetterStack (Uptime Monitoring) — Optional

1. Go to https://betterstack.com and sign up
2. Create monitors:
   - **Marketplace**: `https://app.salesai.com` → check every 1 minute
   - **API health**: `https://app.salesai.com/api/health` → check every 1 minute
3. Set up alert channels: email, Slack, or PagerDuty
4. Optional: create a status page at `status.salesai.com`

---

## PHASE 9: CI/CD (30 minutes)

### Step 9.1 — GitHub Actions Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add:
- `VERCEL_TOKEN` — get from Vercel → Settings → Tokens → Create
- `VERCEL_ORG_ID` — Vercel → Settings → General → org ID
- `VERCEL_PROJECT_ID` — Vercel → your project → Settings → General → project ID
- `SENTRY_AUTH_TOKEN` — from Phase 8
- `SENTRY_ORG` — your Sentry org slug
- `SENTRY_PROJECT` — `salesai-marketplace`

### Step 9.2 — Verify Workflows

Claude Code should have created these in `.github/workflows/`:

- `ci.yml` — runs on every PR: lint, type-check, build
- `deploy.yml` — runs on push to `main`: builds and deploys to Vercel
- `security-scan.yml` — runs weekly: `npm audit`, dependency check

Push a small change and verify the CI workflow runs:

```bash
echo "// test" >> src/main.tsx
git add . && git commit -m "Test CI" && git push
```

Check **Actions** tab in GitHub — you should see the workflow running.

---

## PHASE 10: FINAL VERIFICATION CHECKLIST

Test every flow end-to-end before inviting users:

### Buyer Flow
- [ ] Sign up with email/password → lands on dashboard
- [ ] Sign up with Google OAuth → lands on dashboard
- [ ] Browse store → search works, filters work, sort works
- [ ] Click app card → detail modal opens with all info
- [ ] Click "Add to workspace" → Stripe Checkout opens
- [ ] Complete purchase with test card → app appears in dashboard
- [ ] Launch app from dashboard → app loads in iframe
- [ ] API key saved in Settings → delivered to app via postMessage
- [ ] App actually works (paste test data, get AI response)
- [ ] Sign out → sign back in → purchased apps still there

### Developer Flow
- [ ] Sign up as developer → lands on developer portal
- [ ] Stats show correctly (zeros for new developer)
- [ ] Click "Submit new app" → 3-step wizard works
- [ ] Upload HTML file → security scan runs, score displayed
- [ ] Submit for review → appears in admin queue

### Admin Flow
- [ ] Sign in as admin → review queue visible
- [ ] Approve an app → status changes, email sent
- [ ] Reject an app → reason required, email sent with feedback

### Security
- [ ] Try accessing another user's purchases (should be denied by RLS)
- [ ] Try calling `/api/create-checkout` without auth token (should return 401)
- [ ] Try calling API routes 20 times in 10 seconds (should get rate-limited)
- [ ] Check security headers: visit https://securityheaders.com → enter your domain
- [ ] Check SSL: visit https://www.ssllabs.com/ssltest/ → should be A or A+

### Payments (Stripe Test Mode)
- [ ] Purchase creates a subscription (check Stripe Dashboard → Subscriptions)
- [ ] 80/20 split works (check Stripe Dashboard → Payments → click into a payment → see application fee)
- [ ] Webhook fires and creates purchase record in Supabase
- [ ] Canceling in Stripe → purchase status updates to "canceled" in Supabase

---

## ONGOING: GOING LIVE CHECKLIST

When you're ready for real users and real money:

1. **Stripe: Switch to live mode** — new API keys, new webhook, new Products/Prices, complete identity verification
2. **Firebase: Review security rules** — ensure no test backdoors
3. **Supabase: Enable Point-in-Time Recovery** (requires Pro plan, $25/mo)
4. **Cloudflare: Verify WAF rules are active** — check the security analytics
5. **Sentry: Set up alert rules** — get emailed on error spikes
6. **DNS: Enable DNSSEC** in Cloudflare for extra domain security
7. **Legal: Add Privacy Policy, Terms of Service, Developer Agreement** to your site
8. **GDPR: Add cookie consent banner** if serving EU users
9. **Remove all test data** from Supabase before launch
10. **Invite 10-20 beta users** for final testing before public launch

---

## COST SUMMARY (Monthly)

| Service | Free Tier | When You Outgrow It |
|---------|-----------|-------------------|
| Firebase Auth | 50K MAU free | $0.0055/MAU after |
| Supabase | 500MB DB, 50K requests | $25/mo Pro |
| Stripe | No monthly fee | 2.9% + $0.30 per transaction |
| Vercel | 100GB bandwidth | $20/mo Pro |
| Cloudflare | Full WAF + DDoS | $20/mo Pro for advanced rules |
| Upstash Redis | 10K commands/day | $10/mo Pro |
| Resend | 100 emails/day | $20/mo for 50K/mo |
| Sentry | 5K errors/mo | $26/mo Developer |
| BetterStack | 5 monitors | $25/mo Starter |
| **Total at launch** | **$0/mo** | **~$150/mo at scale** |

You can launch completely free and only pay when you have paying customers generating revenue to cover the costs.

---

## QUICK REFERENCE: ALL ENVIRONMENT VARIABLES

```env
# Firebase Auth (client-safe)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=

# Firebase Admin (server-only)
FIREBASE_ADMIN_SDK_KEY=

# Supabase (client-safe)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Supabase (server-only)
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# Stripe (client-safe)
VITE_STRIPE_PUBLISHABLE_KEY=

# Stripe (server-only)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CONNECT_CLIENT_ID=

# Upstash Redis (server-only)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Resend (server-only)
RESEND_API_KEY=

# Sentry (client-safe)
VITE_SENTRY_DSN=

# CI/CD (GitHub Actions only)
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=

# App
VITE_APP_URL=https://app.salesai.com
```
