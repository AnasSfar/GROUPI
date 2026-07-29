import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as authApi from '../api/authApi';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrateur',
  ADMIN: 'Administrateur',
  TEACHER: 'Professeur',
  PARENT: 'Parent',
};

export function AccountSettingsPage() {
  const { currentUser, logout, getAccessToken } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleResendVerification() {
    const token = getAccessToken();
    if (!token) return;
    setResending(true);
    setError(null);
    try {
      await authApi.resendVerificationEmail(token);
      setResent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'envoyer l'e-mail de vérification.");
    } finally {
      setResending(false);
    }
  }

  async function handleDeactivate() {
    const token = getAccessToken();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await authApi.deactivateMe(token);
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof ApiError ? err.message : 'Impossible de désactiver votre compte.');
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Mon compte</h1>
          <p>Informations de connexion et gestion de votre compte GROUPI.</p>
        </div>
      </div>

      <section className="card-section">
        <h2>Informations</h2>
        <p className="summary-row">
          Email : <strong>{currentUser?.email}</strong>
        </p>
        <p className="summary-row" style={{ marginTop: 8 }}>
          Rôle(s) :{' '}
          <strong>{currentUser?.roles.map((role) => ROLE_LABELS[role] ?? role).join(', ')}</strong>
        </p>
        <p className="summary-row" style={{ marginTop: 8 }}>
          Adresse e-mail :{' '}
          {currentUser?.emailVerifiedAt ? (
            <span className="badge badge-success">Vérifiée</span>
          ) : (
            <span className="badge badge-warning">Non vérifiée</span>
          )}
        </p>
        {!currentUser?.emailVerifiedAt && (
          <div className="page-actions" style={{ marginTop: 8 }}>
            {resent ? (
              <span className="table-hint">E-mail de vérification envoyé.</span>
            ) : (
              <button type="button" className="ghost" onClick={handleResendVerification} disabled={resending}>
                {resending ? 'Envoi...' : "Renvoyer l'e-mail de vérification"}
              </button>
            )}
          </div>
        )}
      </section>

      <section className="card-section">
        <h2>Zone dangereuse</h2>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {!confirming ? (
          <>
            <p className="table-hint">
              Désactiver votre compte vous déconnecte immédiatement de toutes vos sessions. Un administrateur
              devra réactiver votre compte pour que vous puissiez vous reconnecter.
            </p>
            <div className="page-actions" style={{ marginTop: 12 }}>
              <button type="button" className="danger" onClick={() => setConfirming(true)}>
                Désactiver mon compte
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="form-notice" role="alert">
              Confirmez-vous la désactivation de votre compte ? Vous serez immédiatement déconnecté(e).
            </p>
            <div className="page-actions" style={{ marginTop: 12 }}>
              <button type="button" className="danger" onClick={handleDeactivate} disabled={submitting}>
                {submitting ? 'Désactivation...' : 'Confirmer la désactivation'}
              </button>
              <button type="button" className="ghost" onClick={() => setConfirming(false)} disabled={submitting}>
                Annuler
              </button>
            </div>
          </>
        )}
      </section>
    </>
  );
}
