import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ApiError } from '../api/client';
import * as authApi from '../api/authApi';
import type { Role } from '../api/authApi';
import * as referentialsApi from '../api/referentialsApi';
import type { SchoolLevel, Subject } from '../api/referentialsApi';
import { SchoolLevelSectionPicker } from '../components/SchoolLevelSectionPicker';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrateur',
  ADMIN: 'Administrateur',
  TEACHER: 'Professeur',
  PARENT: 'Parent',
};

/** RM-ACC-002 : formulaire minimal pour ajouter le second rôle métier (Professeur/Parent) au compte. */
function AddRoleSection({ targetRole }: { targetRole: Role }) {
  const { getAccessToken } = useAuth();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([]);
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [schoolLevelIds, setSchoolLevelIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTeacher = targetRole === 'TEACHER';

  useEffect(() => {
    if (!open || !isTeacher) return;
    referentialsApi.listSubjects().then(setSubjects).catch(() => setSubjects([]));
    referentialsApi.listSchoolLevels().then(setSchoolLevels).catch(() => setSchoolLevels([]));
  }, [open, isTeacher]);

  function toggleSubject(subjectId: string, checked: boolean) {
    setSubjectIds((prev) => (checked ? [...prev, subjectId] : prev.filter((id) => id !== subjectId)));
  }

  function toggleSchoolLevel(schoolLevelId: string, checked: boolean) {
    setSchoolLevelIds((prev) =>
      checked ? [...prev, schoolLevelId] : prev.filter((id) => id !== schoolLevelId),
    );
  }

  const teacherRequirementsMet = !isTeacher || (subjectIds.length > 0 && schoolLevelIds.length > 0);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await authApi.addRole(token, {
        role: targetRole,
        firstName,
        lastName,
        phone,
        city,
        ...(isTeacher ? { subjectIds, schoolLevelIds } : {}),
      });
      showToast(
        isTeacher
          ? 'Nouveau rôle Professeur ajouté, en attente de validation par un administrateur'
          : 'Nouveau rôle Parent ajouté',
      );
      setOpen(false);
      // Pas de méthode de rafraîchissement exposée par AuthContext : on recharge la page pour que
      // `/auth/me` soit relu et que le rôle nouvellement ajouté apparaisse partout dans l'app.
      window.location.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'ajouter ce rôle.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card-section">
      <h2>Devenir aussi {isTeacher ? 'Professeur' : 'Parent'}</h2>
      {!open ? (
        <>
          <p className="table-hint">
            Votre compte n'est actuellement que {isTeacher ? 'Parent' : 'Professeur'}. Vous pouvez
            ajouter le rôle {isTeacher ? 'Professeur' : 'Parent'} sur ce même compte ; le nouveau
            profil devra être validé par un administrateur (RM-ACC-002).
          </p>
          <div className="page-actions" style={{ marginTop: 12 }}>
            <button type="button" className="ghost" onClick={() => setOpen(true)}>
              Devenir aussi {isTeacher ? 'Professeur' : 'Parent'}
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="field-row">
            <label>
              Prénom
              <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </label>
            <label>
              Nom
              <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </label>
          </div>
          <div className="field-row">
            <label>
              Téléphone
              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label>
              Ville
              <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} />
            </label>
          </div>

          {isTeacher && (
            <>
              <div className="field-group">
                <span className="field-group-label">Matières enseignées</span>
                <div className="checkbox-grid">
                  {subjects.map((subject) => (
                    <label key={subject.id} className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={subjectIds.includes(subject.id)}
                        onChange={(e) => toggleSubject(subject.id, e.target.checked)}
                      />
                      {subject.name}
                    </label>
                  ))}
                </div>
                {subjectIds.length === 0 && (
                  <p className="form-notice" role="status">
                    Sélectionne au moins une matière.
                  </p>
                )}
              </div>

              <div className="field-group">
                <span className="field-group-label">Niveaux scolaires</span>
                <SchoolLevelSectionPicker
                  levels={schoolLevels}
                  selectedIds={schoolLevelIds}
                  onToggle={toggleSchoolLevel}
                />
                {schoolLevelIds.length === 0 && (
                  <p className="form-notice" role="status">
                    Sélectionne au moins un niveau scolaire.
                  </p>
                )}
              </div>
            </>
          )}

          <div className="page-actions" style={{ marginTop: 12 }}>
            <button type="submit" disabled={submitting || !teacherRequirementsMet}>
              {submitting ? 'Envoi...' : 'Confirmer'}
            </button>
            <button type="button" className="ghost" onClick={() => setOpen(false)} disabled={submitting}>
              Annuler
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

/** Ch.9.2/RM-SEC-017/033 : formulaire de changement de mot de passe — révoque toutes les sessions
 *  côté API (comme `resetPassword`), donc l'utilisateur est déconnecté localement juste après. */
function ChangePasswordSection() {
  const { getAccessToken, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Le nouveau mot de passe et sa confirmation ne correspondent pas.');
      return;
    }
    setSubmitting(true);
    try {
      await authApi.changePassword(token, { currentPassword, newPassword });
      showToast('Mot de passe modifié. Vous devez vous reconnecter.');
      // RM-SEC-017/033 : le changement révoque toutes les sessions (y compris celle-ci) côté API.
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de modifier le mot de passe.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card-section">
      <h2>Changer mon mot de passe</h2>
      <form onSubmit={handleSubmit}>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <label>
          Mot de passe actuel
          <input
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </label>
        <div className="field-row">
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
          <label>
            Confirmer le nouveau mot de passe
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>
        </div>
        <p className="table-hint">
          Cette action vous déconnectera de toutes vos sessions ; vous devrez vous reconnecter avec
          votre nouveau mot de passe.
        </p>
        <div className="page-actions" style={{ marginTop: 12 }}>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </div>
      </form>
    </section>
  );
}

const LOGIN_HISTORY_ROW_LIMIT = 10;

/** §9.10, RM-SEC-026/027/028 : journal des connexions du titulaire du compte. */
function LoginHistorySection() {
  const { getAccessToken } = useAuth();
  const [entries, setEntries] = useState<authApi.LoginHistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    authApi
      .fetchLoginHistory(token)
      .then(setEntries)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Impossible de charger l'historique des connexions."));
  }, [getAccessToken]);

  const totalCount = entries?.length ?? 0;
  const visibleEntries = entries && !showAll ? entries.slice(0, LOGIN_HISTORY_ROW_LIMIT) : entries;

  return (
    <section className="card-section">
      <h2>Historique des connexions</h2>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!error && !entries && <p className="table-hint">Chargement...</p>}
      {!error && entries && entries.length === 0 && <p className="table-hint">Aucune connexion enregistrée.</p>}
      {!error && visibleEntries && visibleEntries.length > 0 && (
        <>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Résultat</th>
                  <th>Adresse IP</th>
                  <th>Navigateur / appareil</th>
                </tr>
              </thead>
              <tbody>
                {visibleEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td data-label="Date">{new Date(entry.createdAt).toLocaleString('fr-FR')}</td>
                    <td data-label="Résultat">
                      <span className={`badge ${entry.success ? 'badge-success' : 'badge-danger'}`}>
                        {entry.success ? 'Réussie' : 'Échouée'}
                      </span>
                    </td>
                    <td data-label="Adresse IP">{entry.ipAddress ?? '—'}</td>
                    <td data-label="Navigateur / appareil">{entry.userAgent ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!showAll && totalCount > LOGIN_HISTORY_ROW_LIMIT && (
            <div className="page-actions" style={{ marginTop: 12 }}>
              <button type="button" className="ghost" onClick={() => setShowAll(true)}>
                Voir tout l'historique ({totalCount})
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export function AccountSettingsPage() {
  const { currentUser, logout, getAccessToken } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  const [phoneResent, setPhoneResent] = useState(false);
  const [phoneResending, setPhoneResending] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [confirmingDeletion, setConfirmingDeletion] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleResendVerification() {
    const token = getAccessToken();
    if (!token) return;
    setResending(true);
    setError(null);
    try {
      await authApi.resendVerificationEmail(token);
      setResent(true);
      showToast('E-mail de vérification envoyé');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'envoyer l'e-mail de vérification.");
    } finally {
      setResending(false);
    }
  }

  async function handleResendPhoneVerification() {
    const token = getAccessToken();
    if (!token) return;
    setPhoneResending(true);
    setError(null);
    try {
      await authApi.resendVerificationPhone(token);
      setPhoneResent(true);
      showToast('Code de vérification envoyé par SMS');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'envoyer le code de vérification.");
    } finally {
      setPhoneResending(false);
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
      navigate('/', { replace: true });
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof ApiError ? err.message : 'Impossible de désactiver votre compte.');
    }
  }

  /** RM-SEC-020/036 : déconnecte toutes les sessions du compte, y compris celle en cours. */
  async function handleLogoutAllSessions() {
    const token = getAccessToken();
    if (!token) return;
    setLoggingOutAll(true);
    setError(null);
    try {
      await authApi.logoutAll(token);
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setLoggingOutAll(false);
      setError(err instanceof ApiError ? err.message : 'Impossible de déconnecter vos sessions.');
    }
  }

  /** RM-CYC-013/018 : suppression logique self-service, décidée côté API. */
  async function handleRequestDeletion() {
    const token = getAccessToken();
    if (!token) return;
    setDeleting(true);
    setError(null);
    try {
      await authApi.requestDeletion(token);
      await logout();
      navigate('/', { replace: true });
      showToast('Votre compte a été supprimé et vous avez été déconnecté.');
    } catch (err) {
      setDeleting(false);
      setError(err instanceof ApiError ? err.message : 'Impossible de supprimer votre compte.');
    }
  }

  // RM-ACC-002 : ne proposer le cumul de rôles que pour un compte n'ayant qu'un seul rôle métier
  // (Professeur OU Parent) et jamais pour un Administrateur/Super Administrateur.
  const businessRoles = (currentUser?.roles ?? []).filter(
    (role): role is Role => role === 'TEACHER' || role === 'PARENT',
  );
  const hasAdminRole = (currentUser?.roles ?? []).some((role) => role === 'ADMIN' || role === 'SUPER_ADMIN');
  const addableRole: Role | null =
    !hasAdminRole && businessRoles.length === 1 ? (businessRoles[0] === 'TEACHER' ? 'PARENT' : 'TEACHER') : null;

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
        <p className="summary-row" style={{ marginTop: 8 }}>
          Rôle(s) :{' '}
          <strong>{currentUser?.roles.map((role) => ROLE_LABELS[role] ?? role).join(', ')}</strong>
        </p>

        {/* RM-SEC-001 : l'identifiant du compte est l'e-mail OU le téléphone — chacun n'est affiché
            (avec son bloc de vérification) que s'il est effectivement renseigné sur ce compte. */}
        {currentUser?.email && (
          <>
            <p className="summary-row" style={{ marginTop: 8 }}>
              Email : <strong>{currentUser.email}</strong>{' '}
              {currentUser.emailVerifiedAt ? (
                <span className="badge badge-success">Vérifié</span>
              ) : (
                <span className="badge badge-warning">Non vérifié</span>
              )}
            </p>
            {!currentUser.emailVerifiedAt && (
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
          </>
        )}

        {currentUser?.phone && (
          <>
            <p className="summary-row" style={{ marginTop: 8 }}>
              Téléphone : <strong>{currentUser.phone}</strong>{' '}
              {currentUser.phoneVerifiedAt ? (
                <span className="badge badge-success">Vérifié</span>
              ) : (
                <span className="badge badge-warning">Non vérifié</span>
              )}
            </p>
            {!currentUser.phoneVerifiedAt && (
              <div className="page-actions" style={{ marginTop: 8 }}>
                {phoneResent ? (
                  <span className="table-hint">Code de vérification envoyé par SMS.</span>
                ) : (
                  <button
                    type="button"
                    className="ghost"
                    onClick={handleResendPhoneVerification}
                    disabled={phoneResending}
                  >
                    {phoneResending ? 'Envoi...' : 'Renvoyer le code de vérification'}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {addableRole && <AddRoleSection targetRole={addableRole} />}

      <ChangePasswordSection />

      <LoginHistorySection />

      <section className="card-section">
        <h2>Zone dangereuse</h2>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <p className="table-hint">
          Déconnecter toutes vos sessions vous déconnecte immédiatement de tous les appareils sur
          lesquels vous étiez connecté(e), y compris celui-ci.
        </p>
        <div className="page-actions" style={{ marginTop: 12, marginBottom: 20 }}>
          <button type="button" className="danger" onClick={handleLogoutAllSessions} disabled={loggingOutAll}>
            {loggingOutAll ? 'Déconnexion...' : 'Déconnecter toutes mes sessions'}
          </button>
        </div>

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

        <hr style={{ margin: '20px 0' }} />

        {!confirmingDeletion ? (
          <>
            <p className="table-hint">
              Supprimer votre compte archive votre accès et vous déconnecte immédiatement. Vos
              données restent conservées uniquement lorsqu'elles sont nécessaires à l'historique de
              la plateforme.
            </p>
            <div className="page-actions" style={{ marginTop: 12 }}>
              <button type="button" className="danger" onClick={() => setConfirmingDeletion(true)}>
                Supprimer mon compte
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="form-notice" role="alert">
              Confirmez-vous la suppression de votre compte ? Cette action est irréversible et vous
              serez immédiatement déconnecté(e).
            </p>
            <div className="page-actions" style={{ marginTop: 12 }}>
              <button type="button" className="danger" onClick={handleRequestDeletion} disabled={deleting}>
                {deleting ? 'Suppression...' : 'Confirmer la suppression'}
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => setConfirmingDeletion(false)}
                disabled={deleting}
              >
                Annuler
              </button>
            </div>
          </>
        )}
      </section>
    </>
  );
}
