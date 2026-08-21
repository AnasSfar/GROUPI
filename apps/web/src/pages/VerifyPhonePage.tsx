import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../api/client';
import * as authApi from '../api/authApi';

/** Ch.9.5, RM-SEC-001 — équivalent de VerifyEmailPage pour un compte identifié (ou complété) par
 * téléphone : un code reçu par SMS ne peut pas être un lien cliquable, il se saisit manuellement. */
export function VerifyPhonePage() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await authApi.verifyPhone(code);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof ApiError ? err.message : 'Code de vérification invalide ou expiré.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <img src="/favicon.png" alt="GROUPI" className="auth-logo" />
        <h1>Vérification du numéro de téléphone</h1>
        {status === 'success' ? (
          <p className="form-notice" role="status">
            Votre numéro de téléphone est vérifié.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <label>
              Code reçu par SMS
              <input
                type="text"
                inputMode="numeric"
                required
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
            <button type="submit" disabled={submitting || !code}>
              {submitting ? 'Vérification...' : 'Vérifier'}
            </button>
          </form>
        )}
        <p className="auth-links">
          <Link to="/login">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
