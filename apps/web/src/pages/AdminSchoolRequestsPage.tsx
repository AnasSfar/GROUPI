import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Select } from '../components/Select';
import { ApiError } from '../api/client';
import * as referentialsApi from '../api/referentialsApi';
import type { AdminSchoolAdditionRequest } from '../api/referentialsApi';

const TYPE_LABELS: Record<string, string> = {
  COLLEGE: 'Collège',
  HIGH_SCHOOL: 'Lycée',
  PRIMARY: 'Primaire',
  OTHER: 'Autre',
};

function ReasonPrompt({
  onConfirm,
  onCancel,
}: {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="reason-prompt">
      <input
        type="text"
        placeholder="Motif du refus (obligatoire)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        autoFocus
      />
      <button type="button" disabled={reason.trim().length < 3} onClick={() => onConfirm(reason)}>
        Refuser
      </button>
      <button type="button" className="ghost" onClick={onCancel}>
        Annuler
      </button>
    </div>
  );
}

export function AdminSchoolRequestsPage() {
  const { getAccessToken } = useAuth();
  const [requests, setRequests] = useState<AdminSchoolAdditionRequest[]>([]);
  const [status, setStatus] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setRequests(await referentialsApi.listSchoolRequests(token, status || undefined));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les demandes.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, status]);

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

  function handleApprove(id: string) {
    const token = getAccessToken();
    if (!token) return;
    runAction(() => referentialsApi.approveSchoolRequest(token, id));
  }

  function handleReject(id: string, reason: string) {
    const token = getAccessToken();
    if (!token) return;
    setRejectingId(null);
    runAction(() => referentialsApi.rejectSchoolRequest(token, id, reason));
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Demandes d'établissement</h1>
          <p>Établissements demandés par des Parents, absents du référentiel officiel (Ch.6.7).</p>
        </div>
      </div>

      <div className="status-filter">
        Statut :
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="PENDING">En attente</option>
          <option value="APPROVED">Approuvées</option>
          <option value="REJECTED">Refusées</option>
          <option value="">Toutes</option>
        </Select>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p>Chargement...</p>
      ) : requests.length === 0 ? (
        <p>Aucune demande pour ce statut.</p>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Établissement</th>
                <th>Type</th>
                <th>Ville</th>
                <th>Parent</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>
                    {request.name}
                    {request.address && <div className="table-hint">{request.address}</div>}
                    {request.comment && <div className="table-hint">« {request.comment} »</div>}
                  </td>
                  <td>{TYPE_LABELS[request.type] ?? request.type}</td>
                  <td>{request.city.name}</td>
                  <td>
                    {request.parent.firstName} {request.parent.lastName} ({request.parent.phone})
                  </td>
                  <td>
                    {request.status === 'PENDING' && <span className="badge badge-warning">En attente</span>}
                    {request.status === 'APPROVED' && <span className="badge badge-success">Approuvée</span>}
                    {request.status === 'REJECTED' && (
                      <span className="badge badge-danger" title={request.rejectionReason ?? undefined}>
                        Refusée
                      </span>
                    )}
                  </td>
                  <td className="admin-actions">
                    {request.status !== 'PENDING' ? (
                      <span className="table-hint">
                        {request.status === 'REJECTED' ? request.rejectionReason : 'Ajoutée au référentiel'}
                      </span>
                    ) : rejectingId === request.id ? (
                      <ReasonPrompt
                        onConfirm={(reason) => handleReject(request.id, reason)}
                        onCancel={() => setRejectingId(null)}
                      />
                    ) : (
                      <>
                        <button type="button" onClick={() => handleApprove(request.id)}>
                          Approuver
                        </button>
                        <button type="button" className="danger" onClick={() => setRejectingId(request.id)}>
                          Refuser
                        </button>
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
