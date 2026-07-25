import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as authApi from '../api/authApi';
import { ApiError } from '../api/client';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Lien invalide</h1>
          <p className="form-error" role="alert">
            Ce lien de réinitialisation est incomplet ou invalide.
          </p>
          <p className="auth-links">
            <Link to="/forgot-password">Demander un nouveau lien</Link>
          </p>
        </div>
      </div>
    );
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
        <button type="submit" disabled={submitting}>
          {submitting ? 'Enregistrement...' : 'Réinitialiser le mot de passe'}
        </button>
        <p className="auth-links">
          <Link to="/login">Retour à la connexion</Link>
        </p>
      </form>
    </div>
  );
}
