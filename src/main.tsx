import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App'

// ── Sentry Error Tracking ──
const sentryDsn = import.meta.env.VITE_SENTRY_DSN

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,

    beforeSend(event) {
      // NEVER send sensitive data to Sentry
      if (event.request?.headers) {
        delete event.request.headers['Authorization']
        delete event.request.headers['x-api-key']
      }
      // Strip API keys from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((b) => {
          if (b.data) {
            const data = { ...b.data }
            for (const key of Object.keys(data)) {
              if (/key|token|secret|password/i.test(key)) {
                data[key] = '[REDACTED]'
              }
            }
            b.data = data
          }
          return b
        })
      }
      return event
    },
  })
}

const ErrorFallback = (
  <div className="flex min-h-screen flex-col items-center justify-center bg-midnight text-foreground">
    <h1 className="font-serif text-3xl">Something went wrong</h1>
    <p className="mt-2 text-muted-foreground">
      An unexpected error occurred. Please refresh the page.
    </p>
    <button
      type="button"
      className="mt-6 rounded-lg bg-ice px-6 py-2 font-medium text-midnight hover:bg-ice/90"
      onClick={() => window.location.reload()}
    >
      Refresh
    </button>
  </div>
)

// Dev error boundary — shows crash details on screen when Sentry is not configured
class DevErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, color: '#f00', fontFamily: 'monospace', background: '#111' }}>
          <h1>React Error</h1>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#ff6' }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#aaa', fontSize: 12 }}>{this.state.error.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DevErrorBoundary>
      {sentryDsn ? (
        <Sentry.ErrorBoundary fallback={ErrorFallback}>
          <App />
        </Sentry.ErrorBoundary>
      ) : (
        <App />
      )}
    </DevErrorBoundary>
  </StrictMode>,
)
