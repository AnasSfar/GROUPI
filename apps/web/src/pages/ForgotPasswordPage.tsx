import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import * as authApi from '../api/authApi';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      // The API always returns 204 regardless of whether the email exists — never distinguish.
      await authApi.forgotPassword(email);
    } finally {
      setSubmitting(false);
      setSent(true);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Mot de passe oublié</h1>
        {sent ? (
          <p className="form-notice" role="status">
            Si cette adresse correspond à un compte, un lien de réinitialisation vient d'être
            envoyé.
          </p>
        ) : (
          <>
            <label>
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Envoi...' : 'Envoyer le lien'}
            </button>
          </>
        )}
        <p className="auth-links">
          <Link to="/login">Retour à la connexion</Link>
        </p>
      </form>
    </div>
  );
}
