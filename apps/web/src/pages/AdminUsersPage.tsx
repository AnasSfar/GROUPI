import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Select } from '../components/Select';
import { ApiError } from '../api/client';
import * as adminApi from '../api/adminApi';
import type { AdminUser, UserStatus } from '../api/adminApi';
import { ADMIN_PERMISSIONS } from '../api/adminApi';

type StatusFilterValue = UserStatus | 'ALL';
type RoleFilterValue = 'ALL' | 'ADMIN' | 'TEACHER' | 'PARENT';

const ROLE_FILTER_LABELS: Record<RoleFilterValue, string> = {
  ALL: 'Tous',
  ADMIN: 'Administrateurs',
  TEACHER: 'Professeurs',
  PARENT: 'Parents',
};

// Super Admin est regroupé sous "Administrateurs" (le filtre distingue avant tout le métier :
// qui gère la plateforme vs. qui l'utilise — pas la nuance de permissions entre les deux).
function matchesRoleFilter(user: AdminUser, filter: RoleFilterValue): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'ADMIN') return user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');
  return user.roles.includes(filter);
}

const STATUS_LABELS: Record<UserStatus, string> = {
  PENDING_VALIDATION: 'En attente',
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
  DISABLED: 'Désactivé',
  ARCHIVED: 'Archivé',
};

const STATUS_FILTER_LABELS: Record<StatusFilterValue, string> = {
  ALL: 'Tous',
  ...STATUS_LABELS,
};

const STATUS_BADGE: Record<UserStatus, string> = {
  PENDING_VALIDATION: 'badge-warning',
  ACTIVE: 'badge-success',
  SUSPENDED: 'badge-danger',
  DISABLED: 'badge-neutral',
  ARCHIVED: 'badge-neutral',
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  TEACHER: 'Professeur',
  PARENT: 'Parent',
};

function displayName(user: AdminUser): string {
  const profile = user.teacherProfile ?? user.parentProfile;
  return profile ? `${profile.firstName} ${profile.lastName}` : '—';
}

/** Petit formulaire inline de motif, requis avant de suspendre/désactiver (RM-CYC-029). */
function ReasonPrompt({
  label,
  onConfirm,
  onCancel,
}: {
  label: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="reason-prompt">
      <input
        type="text"
        placeholder="Motif (obligatoire)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        autoFocus
      />
      <button type="button" disabled={reason.trim().length < 3} onClick={() => onConfirm(reason)}>
        {label}
      </button>
      <button type="button" className="ghost" onClick={onCancel}>
        Annuler
      </button>
    </div>
  );
}

function PermissionCheckboxList({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (permissions: string[]) => void;
}) {
  return (
    <div className="permission-list">
      {ADMIN_PERMISSIONS.map((permission) => (
        <label key={permission.code} className="permission-item">
          <input
            type="checkbox"
            checked={selected.includes(permission.code)}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? [...selected, permission.code]
                  : selected.filter((code) => code !== permission.code),
              )
            }
          />
          {permission.label}
        </label>
      ))}
    </div>
  );
}

export function AdminUsersPage() {
  const { getAccessToken, currentUser } = useAuth();
  const isSuperAdmin = currentUser?.roles.includes('SUPER_ADMIN') ?? false;
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('ALL');
  const [roleFilter, setRoleFilter] = useState<RoleFilterValue>('ALL');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingReasonFor, setPendingReasonFor] = useState<{
    userId: string;
    action: 'suspend' | 'disable';
  } | null>(null);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermissions, setInvitePermissions] = useState<string[]>([]);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const [promotingUser, setPromotingUser] = useState<AdminUser | null>(null);
  const [promotePermissions, setPromotePermissions] = useState<string[]>([]);
  const [promoteSubmitting, setPromoteSubmitting] = useState(false);
  const [promoteError, setPromoteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const result = await adminApi.listUsers(token, statusFilter === 'ALL' ? undefined : statusFilter);
      setUsers(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les comptes.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function runAction(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "L'opération a échoué.");
    }
  }

  function handleValidate(userId: string) {
    const token = getAccessToken();
    if (!token) return;
    runAction(() => adminApi.validateUser(token, userId));
  }

  function handleReactivate(userId: string) {
    const token = getAccessToken();
    if (!token) return;
    runAction(() => adminApi.reactivateUser(token, userId));
  }

  function handleReasonConfirm(reason: string) {
    const token = getAccessToken();
    if (!token || !pendingReasonFor) return;
    const { userId, action } = pendingReasonFor;
    setPendingReasonFor(null);
    const call =
      action === 'suspend'
        ? adminApi.suspendUser(token, userId, { reason })
        : adminApi.disableUser(token, userId, { reason });
    runAction(() => call);
  }

  function openInviteModal() {
    setInviteEmail('');
    setInvitePermissions([]);
    setInviteError(null);
    setInviteSuccess(null);
    setShowInviteModal(true);
  }

  async function handleInviteSubmit() {
    const token = getAccessToken();
    if (!token) return;
    setInviteSubmitting(true);
    setInviteError(null);
    try {
      await adminApi.inviteAdministrator(token, { email: inviteEmail, permissions: invitePermissions });
      setInviteSuccess(`Invitation envoyée à ${inviteEmail}.`);
      setInviteEmail('');
      setInvitePermissions([]);
      await load();
    } catch (err) {
      setInviteError(err instanceof ApiError ? err.message : "L'invitation a échoué.");
    } finally {
      setInviteSubmitting(false);
    }
  }

  function openPromoteModal(user: AdminUser) {
    setPromotingUser(user);
    setPromotePermissions([]);
    setPromoteError(null);
  }

  async function handlePromoteSubmit() {
    const token = getAccessToken();
    if (!token || !promotingUser) return;
    setPromoteSubmitting(true);
    setPromoteError(null);
    try {
      await adminApi.promoteToAdmin(token, promotingUser.id, promotePermissions);
      setPromotingUser(null);
      await load();
    } catch (err) {
      setPromoteError(err instanceof ApiError ? err.message : "La promotion a échoué.");
    } finally {
      setPromoteSubmitting(false);
    }
  }

  const searchQuery = search.trim().toLowerCase();
  const visibleUsers = users.filter((user) => {
    if (!matchesRoleFilter(user, roleFilter)) return false;
    if (!searchQuery) return true;
    return displayName(user).toLowerCase().includes(searchQuery) || user.email.toLowerCase().includes(searchQuery);
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Comptes utilisateurs</h1>
          <p>Validation, suspension et désactivation des comptes Professeur et Parent.</p>
        </div>
        {isSuperAdmin && (
          <div className="page-actions">
            <button type="button" onClick={openInviteModal}>
              Ajouter un administrateur
            </button>
          </div>
        )}
      </div>

      <div className="filters-row">
        <input
          type="search"
          className="search-input"
          placeholder="Rechercher un nom ou un e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Rechercher un compte par nom ou e-mail"
        />

        <label className="status-filter">
          Rôle :
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as RoleFilterValue)}>
            {Object.entries(ROLE_FILTER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </label>

        <label className="status-filter">
          Statut :
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilterValue)}
          >
            {Object.entries(STATUS_FILTER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p>Chargement...</p>
      ) : visibleUsers.length === 0 ? (
        <p>Aucun compte ne correspond à ces filtres.</p>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Créé le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => (
                <tr key={user.id}>
                  <td data-label="Nom">{displayName(user)}</td>
                  <td data-label="Email">{user.email}</td>
                  <td data-label="Rôle">{user.roles.map((r) => ROLE_LABELS[r] ?? r).join(', ')}</td>
                  <td data-label="Statut">
                    <span className={`badge ${STATUS_BADGE[user.status]}`}>
                      {STATUS_LABELS[user.status]}
                    </span>
                  </td>
                  <td data-label="Créé le">{new Date(user.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="admin-actions">
                    {pendingReasonFor?.userId === user.id ? (
                      <ReasonPrompt
                        label={pendingReasonFor.action === 'suspend' ? 'Suspendre' : 'Désactiver'}
                        onConfirm={handleReasonConfirm}
                        onCancel={() => setPendingReasonFor(null)}
                      />
                    ) : (
                      <>
                        {user.status === 'PENDING_VALIDATION' && (
                          <button type="button" onClick={() => handleValidate(user.id)}>
                            Valider
                          </button>
                        )}
                        {user.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => setPendingReasonFor({ userId: user.id, action: 'suspend' })}
                          >
                            Suspendre
                          </button>
                        )}
                        {user.status === 'SUSPENDED' && (
                          <button type="button" onClick={() => handleReactivate(user.id)}>
                            Réactiver
                          </button>
                        )}
                        {(user.status === 'ACTIVE' || user.status === 'SUSPENDED') && (
                          <button
                            type="button"
                            className="danger"
                            onClick={() => setPendingReasonFor({ userId: user.id, action: 'disable' })}
                          >
                            Désactiver
                          </button>
                        )}
                        {isSuperAdmin &&
                          user.status === 'ACTIVE' &&
                          !user.roles.includes('ADMIN') &&
                          !user.roles.includes('SUPER_ADMIN') && (
                            <button type="button" className="ghost" onClick={() => openPromoteModal(user)}>
                              Promouvoir Admin
                            </button>
                          )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showInviteModal && (
        <div className="terms-modal-backdrop" onClick={() => setShowInviteModal(false)}>
          <div className="terms-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Ajouter un administrateur</h2>
            <p>
              Un e-mail d'invitation sera envoyé à cette adresse pour qu'elle définisse son mot de
              passe, son nom et son téléphone.
            </p>
            {inviteError && (
              <p className="form-error" role="alert">
                {inviteError}
              </p>
            )}
            {inviteSuccess && <p className="form-notice">{inviteSuccess}</p>}
            <label>
              Adresse e-mail
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                autoFocus
              />
            </label>
            <h3>Permissions accordées</h3>
            <PermissionCheckboxList selected={invitePermissions} onChange={setInvitePermissions} />
            <div className="terms-modal-actions">
              <button type="button" className="ghost" onClick={() => setShowInviteModal(false)}>
                Fermer
              </button>
              <button
                type="button"
                disabled={inviteSubmitting || !inviteEmail || invitePermissions.length === 0}
                onClick={handleInviteSubmit}
              >
                {inviteSubmitting ? 'Envoi...' : "Envoyer l'invitation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {promotingUser && (
        <div className="terms-modal-backdrop" onClick={() => setPromotingUser(null)}>
          <div className="terms-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Promouvoir {displayName(promotingUser)} Administrateur</h2>
            <p>{promotingUser.email} conservera son rôle actuel en plus du rôle Administrateur.</p>
            {promoteError && (
              <p className="form-error" role="alert">
                {promoteError}
              </p>
            )}
            <h3>Permissions accordées</h3>
            <PermissionCheckboxList selected={promotePermissions} onChange={setPromotePermissions} />
            <div className="terms-modal-actions">
              <button type="button" className="ghost" onClick={() => setPromotingUser(null)}>
                Annuler
              </button>
              <button
                type="button"
                disabled={promoteSubmitting || promotePermissions.length === 0}
                onClick={handlePromoteSubmit}
              >
                {promoteSubmitting ? 'Promotion...' : 'Promouvoir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
