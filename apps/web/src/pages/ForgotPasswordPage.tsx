import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import * as authApi from '../api/authApi';

export function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      // The API always returns 204 regardless of whether the identifier exists — never distinguish.
      await authApi.forgotPassword(identifier);
    } finally {
      setSubmitting(false);
      setSent(true);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <img src="/favicon.png" alt="GROUPI" className="auth-logo" />
        <h1>Mot de passe oublié</h1>
        {sent ? (
          <p className="form-notice" role="status">
            Si cet identifiant correspond à un compte, un lien (par e-mail) ou un code (par SMS) de
            réinitialisation vient d'être envoyé.
          </p>
        ) : (
          <>
            <label>
              Email ou téléphone
              <input
                type="text"
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </label>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Envoi...' : 'Envoyer'}
            </button>
          </>
        )}
        <p className="auth-links">
          <Link to="/login">Retour à la connexion</Link>
        </p>
        {sent && (
          <p className="auth-links">
            <Link to="/reset-password">Vous avez reçu un code par SMS ?</Link>
          </p>
        )}
      </form>
    </div>
  );
}
