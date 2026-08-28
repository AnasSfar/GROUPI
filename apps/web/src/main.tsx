import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'
import { initTheme } from './utils/theme'

// Applique le thème mémorisé (clair par défaut) sur <html> avant le premier rendu React.
initTheme()

// Optionnel — sans VITE_SENTRY_DSN, aucune remontée d'erreur, comportement inchangé (même
// convention que EmailService côté API : infra silencieusement désactivée sans configuration).
const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={
        <div className="empty-state">
          <div>
            <p className="empty-state-title">Une erreur est survenue, veuillez recharger la page.</p>
          </div>
          <div className="empty-state-action">
            <button onClick={() => window.location.reload()}>Recharger</button>
          </div>
        </div>
      }
    >
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
