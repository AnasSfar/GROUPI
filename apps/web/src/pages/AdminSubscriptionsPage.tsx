import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as subscriptionsApi from '../api/subscriptionsApi';
import type { Subscription, SubscriptionStatus } from '../api/subscriptionsApi';

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  PENDING_PAYMENT: 'En attente de paiement',
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
  EXPIRED: 'Expiré',
};

const STATUS_BADGE: Record<SubscriptionStatus, string> = {
  PENDING_PAYMENT: 'badge-warning',
  ACTIVE: 'badge-success',
  SUSPENDED: 'badge-danger',
  EXPIRED: 'badge-neutral',
};

function ReasonPrompt({ onConfirm, onCancel }: { onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('');
  return (
    <div className="reason-prompt">
      <input
        type="text"
        placeholder="Motif de la suspension (optionnel)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        autoFocus
      />
      <button type="button" className="danger" onClick={() => onConfirm(reason)}>
        Suspendre
      </button>
      <button type="button" className="ghost" onClick={onCancel}>
        Annuler
      </button>
    </div>
  );
}

/** PERM-ABO-005/006/007 : validation des paiements, suspension et réactivation des abonnements Professeur. */
export function AdminSubscriptionsPage() {
  const { getAccessToken } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suspendingId, setSuspendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setSubscriptions(await subscriptionsApi.listAll(token, statusFilter || undefined));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les abonnements.');
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

  function handleValidatePayment(id: string) {
    const token = getAccessToken();
    if (!token) return;
    runAction(() => subscriptionsApi.validatePayment(token, id));
  }

  function handleSuspend(id: string, reason: string) {
    const token = getAccessToken();
    if (!token) return;
    setSuspendingId(null);
    runAction(() => subscriptionsApi.suspend(token, id, reason || undefined));
  }

  function handleReactivate(id: string) {
    const token = getAccessToken();
    if (!token) return;
    runAction(() => subscriptionsApi.reactivate(token, id));
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Abonnements Professeur</h1>
          <p>Validation manuelle des paiements (espèces), suspension et réactivation (Ch.21).</p>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="field-row">
        <label>
          Filtrer par statut
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as SubscriptionStatus | '')}>
            <option value="">Tous</option>
            <option value="PENDING_PAYMENT">En attente de paiement</option>
            <option value="ACTIVE">Actif</option>
            <option value="SUSPENDED">Suspendu</option>
            <option value="EXPIRED">Expiré</option>
          </select>
        </label>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : subscriptions.length === 0 ? (
        <p>Aucun abonnement pour ce filtre.</p>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Professeur</th>
                <th>Offre</th>
                <th>Année académique</th>
                <th>Statut</th>
                <th>Expire le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    {sub.teacher.firstName} {sub.teacher.lastName} ({sub.teacher.user.email})
                  </td>
                  <td>{sub.plan.name}</td>
                  <td>{sub.academicYear.label}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[sub.status]}`}>{STATUS_LABELS[sub.status]}</span>
                    {sub.status === 'SUSPENDED' && sub.suspensionReason && (
                      <span className="table-hint"> — {sub.suspensionReason}</span>
                    )}
                  </td>
                  <td>{sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="admin-actions">
                    {suspendingId === sub.id ? (
                      <ReasonPrompt onConfirm={(reason) => handleSuspend(sub.id, reason)} onCancel={() => setSuspendingId(null)} />
                    ) : (
                      <>
                        {sub.status === 'PENDING_PAYMENT' && (
                          <button type="button" onClick={() => handleValidatePayment(sub.id)}>
                            Valider le paiement
                          </button>
                        )}
                        {sub.status === 'ACTIVE' && (
                          <button type="button" className="danger" onClick={() => setSuspendingId(sub.id)}>
                            Suspendre
                          </button>
                        )}
                        {sub.status === 'SUSPENDED' && (
                          <button type="button" onClick={() => handleReactivate(sub.id)}>
                            Réactiver
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
