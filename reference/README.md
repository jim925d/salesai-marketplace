# SalesAI Marketplace

A security-first marketplace of AI-powered sales tools. Each tool runs as a sandboxed single-page app. Users bring their own API keys (OpenAI / Anthropic), which are AES-256-GCM encrypted client-side and never touch the server.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   USER BROWSER                   │
│                                                   │
│  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Marketplace  │  │  Sandboxed App (iframe)  │  │
│  │  React SPA    │  │  HTML + JS               │  │
│  │               │  │                          │  │
│  │  • Dashboard  │  │  • Objection Generator   │  │
│  │  • Settings   │  │  • CRM Note Summarizer   │  │
│  │  • Billing    │  │  • Cold Email Writer     │  │
│  │  • Auth       │  │  • ... (10 tools)        │  │
│  └──────┬───────┘  └──────────┬───────────────┘  │
│         │                      │                   │
│    ┌────┴────┐           ┌────┴──────────┐        │
│    │AES-256  │           │Direct HTTPS   │        │
│    │Encrypted│           │(no proxy)     │        │
│    │Key Store│           │               │        │
│    └─────────┘           ▼               ▼        │
└──────────────────────────┼───────────────┼────────┘
                           │               │
                    ┌──────┴──┐    ┌──────┴───────┐
                    │ OpenAI  │    │  Anthropic   │
                    │ API     │    │  API         │
                    └─────────┘    └──────────────┘

Server only handles: Auth, Subscriptions, App ownership
Server NEVER sees: API keys, AI prompts, AI responses, sales data
```

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd salesai-marketplace
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase, Stripe, and Sentry keys

# 3. Place app files
# Copy the 10 HTML app files into /public/apps/
cp /path/to/apps/*.html public/apps/

# 4. Run development server
npm run dev

# 5. Open http://localhost:5173
```

## Project Structure

```
salesai-marketplace/
├── public/
│   └── apps/                          # Individual tool HTML files
│       ├── 01-objection-response-generator.html
│       ├── 02-crm-note-summarizer.html
│       ├── 03-icp-match-scorer.html
│       ├── 04-contact-enricher.html
│       ├── 05-cold-email-writer.html
│       ├── 06-linkedin-message-crafter.html
│       ├── 07-commission-calculator.html
│       ├── 08-email-to-crm-logger.html
│       ├── 09-account-briefing-builder.html
│       └── 10-discovery-question-generator.html
├── src/
│   ├── App.jsx                        # Main marketplace component
│   ├── lib/
│   │   ├── crypto.js                  # AES-256-GCM encryption
│   │   ├── session.js                 # Session management
│   │   ├── sanitize.js                # Input sanitization
│   │   ├── rate-limiter.js            # Client-side rate limiting
│   │   └── audit-log.js              # Audit logging
│   ├── components/
│   │   ├── NavBar.jsx
│   │   ├── AppCard.jsx
│   │   ├── AppLauncher.jsx            # Sandboxed iframe loader
│   │   └── modals/
│   │       ├── AuthModal.jsx
│   │       ├── AppDetailModal.jsx
│   │       └── SettingsModal.jsx
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── Store.jsx
│   │   └── Dashboard.jsx
│   └── store/                         # Zustand state management
│       └── useAppStore.js
├── api/                               # Serverless functions
│   ├── stripe-webhook.js
│   └── health.js
├── vercel.json                        # Deployment config + security headers
├── package.json
└── README.md
```

## Security Features

### API Key Encryption
- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: PBKDF2-SHA256 with 310,000 iterations
- **Storage**: Browser sessionStorage only (cleared on tab close)
- **Scope**: Keys never leave the browser, never sent to any server

### App Sandboxing
Each tool runs in an iframe with restrictive sandbox:
```html
<iframe
  sandbox="allow-scripts allow-same-origin"
  csp="default-src 'self'; connect-src https://api.openai.com https://api.anthropic.com"
  referrerpolicy="no-referrer"
/>
```
Blocked: top-navigation, popups, forms, modals, downloads, pointer-lock

### Session Management
- Configurable inactivity timeout (default: 30 min)
- CSRF token per session (crypto.randomUUID)
- Automatic session destruction on timeout
- All in-memory data cleared on logout

### Content Security Policy
Strict CSP headers on all pages. Apps restricted to self + AI API endpoints.

### Input Sanitization
All user inputs sanitized against XSS: `< > ' " &` → HTML entities.
React JSX provides secondary protection via default escaping.

### Rate Limiting
- Auth: 5 attempts / 60 seconds
- API key operations: 10 / 60 seconds
- App launches: 30 / 60 seconds

### Audit Logging
Every security action logged: auth, logout, key changes, app launches, settings.

## Environment Variables

```env
# Firebase Auth
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=

# Stripe
STRIPE_SECRET_KEY=           # Server-side only
STRIPE_WEBHOOK_SECRET=       # Server-side only
VITE_STRIPE_PUBLISHABLE_KEY=

# Monitoring
VITE_SENTRY_DSN=

# Database
DATABASE_URL=                # Server-side only
```

## Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```
Security headers are automatically applied via vercel.json.

### Docker
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

## Adding New Apps

1. Build the HTML app as a single self-contained file
2. Include the provider selector (OpenAI/Anthropic) and API key input
3. Place in `/public/apps/` with naming convention: `XX-app-name.html`
4. Add the app metadata to the APPS array in the marketplace
5. Test in sandboxed iframe context
6. Verify CSP compliance (no inline scripts from external sources)

## License

Proprietary. Internal use only.
