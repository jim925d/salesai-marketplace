# SalesAI — Modular Architecture Guide

## The Principle

The marketplace and the apps are completely decoupled. The marketplace doesn't compile, bundle, or import any app code. It simply loads HTML files in sandboxed iframes. This is the same architecture that Shopify, Figma, and Notion use for plugins.

---

## REPO STRUCTURE

```
GitHub Organization: salesai/
│
├── salesai-marketplace/          ← THE PLATFORM (React app)
│   ├── src/                      # Marketplace frontend
│   ├── api/                      # Serverless functions (Stripe, webhooks, review)
│   ├── supabase/                 # Database migrations
│   ├── public/
│   │   └── apps/                 # ⚠️ This is where approved app files land
│   │       ├── 01-objection-response-generator.html
│   │       ├── 02-crm-note-summarizer.html
│   │       └── ...
│   └── vercel.json               # Security headers, routing
│
├── salesai-apps/                 ← FIRST-PARTY APPS (your 10 apps)
│   ├── 01-objection-response-generator/
│   │   ├── app.html              # The app file
│   │   ├── README.md             # App documentation
│   │   └── metadata.json         # Name, category, price, description, icon
│   ├── 02-crm-note-summarizer/
│   │   ├── app.html
│   │   ├── README.md
│   │   └── metadata.json
│   ├── ...
│   ├── scripts/
│   │   ├── build-all.sh          # Validates + copies all apps to marketplace
│   │   ├── validate.js           # Runs the security scan on an app
│   │   └── deploy.js             # Copies approved apps to marketplace/public/apps/
│   └── shared/
│       ├── bridge.js             # PostMessage bridge (reference copy)
│       ├── theme.css             # Shared Ice & Midnight base vars
│       └── ai-client.js          # Reference AI call pattern
│
├── salesai-developer-sdk/        ← PUBLIC SDK (for third-party developers)
│   ├── template/
│   │   └── app-template.html     # Starter template with bridge + theme
│   ├── docs/
│   │   ├── getting-started.md
│   │   ├── security-requirements.md
│   │   ├── postmessage-bridge.md
│   │   └── submission-guide.md
│   ├── examples/
│   │   └── example-app.html      # Minimal working example
│   └── validator/
│       └── scan.js               # Same security scanner devs can run locally
│
└── salesai-key-vault-extension/  ← CHROME EXTENSION (already built)
    ├── manifest.json
    ├── background.js
    ├── content-script.js
    └── popup.html
```

---

## WHY SEPARATE REPOS

### salesai-marketplace (the platform)
- This is the PRODUCT — auth, payments, dashboard, store, admin, developer portal
- Deployed to Vercel on every push to main
- The only thing that matters about apps is: "what's the HTML file URL?"
- Never imports, compiles, or bundles app code
- Changes here don't affect apps, and vice versa

### salesai-apps (your first-party apps)
- Your 10 apps live here, each in its own folder
- Developed independently — you can work on App 3 without touching App 7
- Each app has a metadata.json that describes it for the marketplace:
  ```json
  {
    "id": "objection-response-generator",
    "name": "Objection Response Generator",
    "icon": "⚡",
    "category": "Outreach",
    "price_cents": 1900,
    "description": "Paste an email thread — get 2 strategic response options with negotiation tactics.",
    "long_description": "...",
    "features": ["Thread analysis", "Negotiation tactics", "Tone control", "Goal targeting"],
    "version": "2.0.0",
    "accent_color": "#E8976C",
    "file": "app.html"
  }
  ```
- A deploy script copies approved HTML files → salesai-marketplace/public/apps/
- This is also the reference for third-party developers to see "how a good app is built"

### salesai-developer-sdk (public)
- This repo is PUBLIC — it's what third-party developers see
- Contains the starter template, documentation, security requirements
- Includes the local security scanner so devs can pre-check before submitting
- This is your developer marketing — the easier you make this, the more apps you get

### salesai-key-vault-extension
- Already built, stays as its own repo
- Published to Chrome Web Store independently

---

## HOW APPS GET INTO THE MARKETPLACE

### First-Party (your apps)
```
Developer builds in salesai-apps/
     ↓
Runs validate.js locally (security scan)
     ↓
Pushes to salesai-apps repo
     ↓
CI runs security scan again
     ↓
Deploy script copies HTML to salesai-marketplace/public/apps/
     ↓
Metadata gets seeded to Supabase (or manually entered via admin)
     ↓
App is live in the marketplace
```

### Third-Party (developer submissions)
```
Developer downloads template from salesai-developer-sdk
     ↓
Builds their app locally using the template
     ↓
Runs the local validator (scan.js)
     ↓
Submits via the Developer Portal (upload HTML + fill metadata form)
     ↓
/api/submit-app runs automated security scan
     ↓
Admin reviews in the review queue
     ↓
On approval: file copied to /public/apps/, Stripe Product created, app listed
     ↓
App is live in the marketplace
```

Both paths end the same way: an HTML file in `/public/apps/` and a row in the `apps` database table.

---

## THE CUSTOMIZABLE DASHBOARD

This is the key differentiator for buyers. When a user purchases apps, they don't just get a list — they get a workspace they can arrange.

### Dashboard Features

**Layout Modes:**
- Grid view (default) — cards in a responsive grid
- Compact view — smaller cards, more density, for power users with 10+ apps
- List view — single column, minimal, fast scanning

**App Card Customization:**
- Drag-and-drop reorder — user arranges apps in their preferred order
- Pin favorites — pinned apps always appear first
- Group by category — auto-group into Outreach / Prospecting / Meeting Prep / Productivity
- Custom groups — user can create named groups ("Pre-call prep", "Post-call", "Weekly")

**Quick Launch Bar:**
- A persistent bar at the top with the user's 3-5 most-used apps as icon buttons
- One click → app opens in the launcher
- Configurable — user picks which apps appear here

**App Launcher Preferences:**
- Full-screen modal (default)
- Side panel (app loads in a right-side panel, dashboard stays visible)
- New tab (opens the app in a standalone browser tab)
- Pop-out window (opens in a new smaller window)

**Theme Customization (stretch goal):**
- User can pick dashboard accent color (separate from app accent colors)
- Compact/comfortable/spacious density options
- Show/hide ratings, prices, developer names on cards

### Dashboard Data Model

In Supabase, add a `user_preferences` table:

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  dashboard_layout TEXT DEFAULT 'grid' CHECK (layout IN ('grid', 'compact', 'list')),
  app_order JSONB DEFAULT '[]',         -- ordered array of app IDs
  pinned_apps JSONB DEFAULT '[]',       -- array of pinned app IDs
  quick_launch JSONB DEFAULT '[]',      -- array of quick launch app IDs (max 5)
  custom_groups JSONB DEFAULT '[]',     -- [{ "name": "Pre-call", "app_ids": [...] }]
  launcher_mode TEXT DEFAULT 'modal',   -- modal | panel | tab | window
  theme JSONB DEFAULT '{}',             -- { accent_color, density }
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### How It Works in the Frontend

```
Dashboard loads:
  1. Fetch user's purchased apps (purchases table)
  2. Fetch user's preferences (user_preferences table)
  3. Render apps in the user's preferred layout + order
  4. Quick launch bar populated from preferences
  5. Drag-and-drop changes → save new order to Supabase
  6. Pin/unpin → update preferences
  7. Group changes → update preferences
```

The dashboard saves preferences on every change (debounced 500ms). When the user returns, everything is exactly where they left it.

---

## IFRAME COMMUNICATION PROTOCOL

The marketplace communicates with apps ONLY via postMessage. This is the complete protocol:

### Marketplace → App (key delivery)
```javascript
// When iframe loads, marketplace sends the API key:
iframe.contentWindow.postMessage({
  type: 'salesai-key-delivery',
  provider: 'openai',  // or 'anthropic'
  key: decryptedKey     // decrypted from KeyVault
}, window.location.origin);  // NEVER use '*'
```

### App → Marketplace (key request)
```javascript
// On load, the app requests its key:
window.parent.postMessage({
  type: 'salesai-key-request',
  provider: 'openai'
}, '*');  // '*' is ok here because we're sending TO the known parent
```

### Marketplace → App (theme sync, future)
```javascript
// Optional: marketplace can send theme preferences
iframe.contentWindow.postMessage({
  type: 'salesai-theme',
  accent: '#58A6FF',
  mode: 'dark'
}, window.location.origin);
```

### App → Marketplace (status reporting, future)
```javascript
// Optional: app can report its status back
window.parent.postMessage({
  type: 'salesai-app-status',
  status: 'ready',       // ready | loading | error
  version: '2.0.0'
}, '*');
```

---

## BUILD ORDER

### Phase 1: Marketplace Platform (salesai-marketplace)
Use the CLAUDE-CODE-BUILD-PROMPT.md to build the full platform.
Leave /public/apps/ empty initially.

### Phase 2: First-Party Apps (salesai-apps)
Build the 10 apps using the specs (Apps 1-3 are already built).
Each app developed and tested standalone first.
Then run through the security validator.
Deploy to marketplace /public/apps/.

### Phase 3: Seed the Marketplace
Insert the 10 first-party app records into Supabase.
Create Stripe Products + Prices for each.
Verify purchase flow end-to-end.

### Phase 4: Developer SDK (salesai-developer-sdk)
Clean up the template and documentation.
Publish the repo publicly.
Write the getting-started guide.

### Phase 5: Customizable Dashboard
Build the preference system.
Add drag-and-drop reordering.
Add layout modes and quick launch bar.
Test that preferences persist across sessions.

### Phase 6: Launch
Domain setup, Cloudflare, monitoring.
Beta invite 10-20 sales reps.
Iterate on feedback.
Open developer submissions.
```

---

## SUMMARY

| Repo | Purpose | Visibility | Deploys To |
|------|---------|------------|------------|
| salesai-marketplace | Platform (React + API) | Private | Vercel |
| salesai-apps | Your 10 first-party tools | Private | → marketplace/public/apps/ |
| salesai-developer-sdk | Template + docs for devs | Public | npm / GitHub |
| salesai-key-vault-extension | Chrome extension | Private | Chrome Web Store |

The marketplace never knows or cares HOW an app works internally. It only knows:
1. What's the HTML file URL?
2. What's the metadata (name, price, category)?
3. Is the user authorized to access it?

That's the boundary. Everything else is the app's business.
