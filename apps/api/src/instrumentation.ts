import * as Sentry from '@sentry/node';

/**
 * Remontée d'erreurs Sentry (observabilité prod, voir apps/api/src/common/sentry-exception.filter.ts
 * pour la capture effective des 5xx). Suit exactement la même convention que les services d'infra
 * optionnelle du projet (ex. `SmsService`, apps/api/src/sms/sms.service.ts) : sans SENTRY_DSN,
 * `initSentry()` ne fait rien — aucun appel réseau, aucun log, comportement dev/CI strictement
 * inchangé, aucun compte Sentry requis. (Avenant 01, Ch. I.9 : le module `email/`/`EmailService`
 * précédemment cité ici en exemple a été retiré — RM-SEC-052.)
 *
 * Doit être appelée en tout premier, avant les autres imports qui produisent des effets de bord
 * (recommandation Sentry Node), d'où sa présence en tête de main.ts et vercel-handler.ts plutôt
 * que dans create-app.ts.
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    return;
  }
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 0.1,
  });
}

export { Sentry };
