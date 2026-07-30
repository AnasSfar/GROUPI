import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as adminApi from '../api/adminApi';
import { ApiError } from '../api/client';

/** RM-CYC-022 — page cible du lien d'invitation reçu par e-mail par un Administrateur nouvellement créé. */
export function AdminInvitationAcceptPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await adminApi.acceptAdministratorInvitation({ token, password, firstName, lastName, phone });
      navigate('/login', {
        replace: true,
        state: { notice: 'Compte administrateur activé. Vous pouvez vous connecter.' },
      });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Impossible d'activer le compte. Veuillez réessayer.",
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
            Ce lien d'invitation est incomplet ou invalide.
          </p>
          <p className="auth-links">
            <Link to="/login">Retour à la connexion</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <img src="/favicon.png" alt="GROUPI" className="auth-logo" />
        <h1>Activer votre compte administrateur</h1>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <label>
          Prénom
          <input
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </label>
        <label>
          Nom
          <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </label>
        <label>
          Téléphone
          <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label>
          Mot de passe
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Activation...' : 'Activer mon compte'}
        </button>
        <p className="auth-links">
          <Link to="/login">Retour à la connexion</Link>
        </p>
      </form>
    </div>
  );
}
