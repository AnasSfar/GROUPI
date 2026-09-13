import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import * as authApi from '../api/authApi';

/** Avenant 01, Ch. I.3 : sans canal d'envoi garanti, la réinitialisation est surtout assistée
 * (le Professeur ou le support génère un lien à usage unique et vous le transmet). Le code par
 * SMS reste tenté en best-effort, sans garantie de réception. */
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
            Si ce numéro correspond à un compte, un code de réinitialisation par SMS vient d'être
            tenté, sans garantie de réception. Le plus sûr reste de contacter votre professeur ou le
            support GROUPI : ils peuvent générer un lien de réinitialisation à usage unique.
          </p>
        ) : (
          <>
            <p className="form-hint">
              Sans réponse, contactez votre professeur ou le support : ils peuvent générer un lien de
              réinitialisation à votre place.
            </p>
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
            <Link to="/reset-password">Vous avez reçu un code par SMS ou un lien ?</Link>
          </p>
        )}
      </form>
    </div>
  );
}
