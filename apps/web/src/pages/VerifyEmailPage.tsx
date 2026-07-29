import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import * as authApi from '../api/authApi';

/** Ch.9.5, ERR-SEC-012 — page cible du lien reçu par e-mail à l'inscription. */
export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Lien de vérification incomplet.');
      return;
    }
    authApi
      .verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setError(err instanceof ApiError ? err.message : 'Lien de vérification invalide ou expiré.');
      });
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <img src="/favicon.png" alt="GROUPI" className="auth-logo" />
        <h1>Vérification de l'adresse e-mail</h1>
        {status === 'pending' && <p>Vérification en cours...</p>}
        {status === 'success' && (
          <p className="form-notice" role="status">
            Votre adresse e-mail est vérifiée.
          </p>
        )}
        {status === 'error' && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <p className="auth-links">
          <Link to="/login">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
