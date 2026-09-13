import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Select } from './Select';
import { EmptyState, LoadingState } from './UiState';
import { EnrollmentCommentThread } from './EnrollmentCommentThread';
import { ApiError } from '../api/client';
import * as accountingApi from '../api/accountingApi';
import type { TeacherAccountSummary } from '../api/accountingApi';

/** Action rapide "Envoyer un message" (tableau de bord) : GROUPI n'a pas de messagerie libre —
 * la messagerie Professeur/Parent passe par le fil de commentaires d'une inscription (Ch.19.3),
 * donc on choisit l'inscription puis on réutilise ce même fil plutôt que d'en recréer un. */
export function QuickMessageModal({ onClose }: { onClose: () => void }) {
  const { getAccessToken } = useAuth();
  const [accounts, setAccounts] = useState<TeacherAccountSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enrollmentId, setEnrollmentId] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const token = getAccessToken();
      if (!token) return;
      try {
        const rows = await accountingApi.listTeacherAccounts(token);
        if (cancelled) return;
        setAccounts(rows);
        if (rows[0]) setEnrollmentId(rows[0].account.enrollmentId);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Impossible de charger les élèves.');
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [getAccessToken]);

  return (
    <div className="terms-modal-backdrop" onClick={onClose}>
      <div className="terms-modal terms-modal-wide" onClick={(e) => e.stopPropagation()}>
        <h2>Envoyer un message</h2>
        <p className="table-hint">Visible par le Parent dans le fil de discussion de l'inscription concernée.</p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {accounts === null && !error && <LoadingState label="Chargement des élèves..." />}
        {accounts?.length === 0 && <EmptyState title="Aucun élève inscrit pour l'instant" />}
        {!!accounts?.length && (
          <>
            <label>
              Élève
              <Select value={enrollmentId} onChange={(e) => setEnrollmentId(e.target.value)}>
                {accounts.map((row) => (
                  <option key={row.account.enrollmentId} value={row.account.enrollmentId}>
                    {row.account.student.firstName} {row.account.student.lastName} — {row.account.group.name}
                  </option>
                ))}
              </Select>
            </label>
            {enrollmentId && (
              <div className="section-spacer">
                <EnrollmentCommentThread enrollmentId={enrollmentId} />
              </div>
            )}
          </>
        )}
        <div className="terms-modal-actions">
          <button type="button" className="ghost" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
