import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as authApi from '../api/authApi';
import { ApiError } from '../api/client';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const tokenFromLink = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const [manualCode, setManualCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Un lien e-mail porte le token dans l'URL ; un code reçu par SMS n'a pas de lien cliquable et
  // se saisit manuellement (RM-SEC-001) — les deux aboutissent au même appel, `resetPassword` ne
  // fait aucune distinction entre les deux formats.
  const token = tokenFromLink || manualCode;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, newPassword);
      navigate('/login', {
        replace: true,
        state: { notice: 'Mot de passe réinitialisé. Vous pouvez vous reconnecter.' },
      });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Impossible de réinitialiser le mot de passe. Veuillez réessayer.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <img src="/favicon.png" alt="GROUPI" className="auth-logo" />
        <h1>Nouveau mot de passe</h1>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {!tokenFromLink && (
          <label>
            Code reçu par SMS
            <input
              type="text"
              inputMode="numeric"
              required
              autoComplete="one-time-code"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />
          </label>
        )}
        <label>
          Nouveau mot de passe
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </label>
        <button type="submit" disabled={submitting || !token}>
          {submitting ? 'Enregistrement...' : 'Réinitialiser le mot de passe'}
        </button>
        <p className="auth-links">
          <Link to="/login">Retour à la connexion</Link>
        </p>
      </form>
    </div>
  );
}
