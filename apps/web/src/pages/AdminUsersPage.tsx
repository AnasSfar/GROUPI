import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Select } from '../components/Select';
import { ApiError } from '../api/client';
import * as adminApi from '../api/adminApi';
import type { AdminUser, UserStatus } from '../api/adminApi';

type StatusFilterValue = UserStatus | 'ALL';

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

export function AdminUsersPage() {
  const { getAccessToken } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('ALL');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingReasonFor, setPendingReasonFor] = useState<{
    userId: string;
    action: 'suspend' | 'disable';
  } | null>(null);

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

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Comptes utilisateurs</h1>
          <p>Validation, suspension et désactivation des comptes Professeur et Parent.</p>
        </div>
      </div>

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

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p>Chargement...</p>
      ) : users.length === 0 ? (
        <p>Aucun compte dans cet état.</p>
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
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{displayName(user)}</td>
                  <td>{user.email}</td>
                  <td>{user.roles.map((r) => ROLE_LABELS[r] ?? r).join(', ')}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[user.status]}`}>
                      {STATUS_LABELS[user.status]}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString('fr-FR')}</td>
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
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
