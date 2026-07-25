import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as schoolSituationApi from '../api/schoolSituationApi';
import type { PendingSituation } from '../api/schoolSituationApi';

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

export function AdminSchoolSituationsPage() {
  const { getAccessToken } = useAuth();
  const [situations, setSituations] = useState<PendingSituation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setSituations(await schoolSituationApi.listPending(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les demandes.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

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

  function handleValidate(id: string) {
    const token = getAccessToken();
    if (!token) return;
    runAction(() => schoolSituationApi.validateSituation(token, id));
  }

  function handleReject(id: string, reason: string) {
    const token = getAccessToken();
    if (!token) return;
    setRejectingId(null);
    runAction(() => schoolSituationApi.rejectSituation(token, id, reason));
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Situations scolaires en attente</h1>
          <p>Changements d'établissement, redoublements et réorientations à valider.</p>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p>Chargement...</p>
      ) : situations.length === 0 ? (
        <p>Aucune demande en attente.</p>
      ) : (
        <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Élève</th>
              <th>Parent</th>
              <th>Nouvelle année</th>
              <th>Nouveau niveau</th>
              <th>Nouvel établissement</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {situations.map((situation) => (
              <tr key={situation.id}>
                <td>
                  {situation.student.firstName} {situation.student.lastName}
                </td>
                <td>
                  {situation.student.parent.firstName} {situation.student.parent.lastName} (
                  {situation.student.parent.phone})
                </td>
                <td>{situation.academicYear.label}</td>
                <td>{situation.schoolLevel.name}</td>
                <td>{situation.school.name}</td>
                <td className="admin-actions">
                  {rejectingId === situation.id ? (
                    <ReasonPrompt
                      onConfirm={(reason) => handleReject(situation.id, reason)}
                      onCancel={() => setRejectingId(null)}
                    />
                  ) : (
                    <>
                      <button type="button" onClick={() => handleValidate(situation.id)}>
                        Valider
                      </button>
                      <button type="button" className="danger" onClick={() => setRejectingId(situation.id)}>
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
