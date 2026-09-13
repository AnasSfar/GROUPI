import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Select } from './Select';
import { EmptyState, LoadingState } from './UiState';
import { EnrollmentAccountingPanel } from './EnrollmentAccountingPanel';
import { ApiError } from '../api/client';
import * as accountingApi from '../api/accountingApi';
import type { TeacherAccountSummary } from '../api/accountingApi';

/** Action rapide "Enregistrer un paiement" (tableau de bord) : on choisit l'inscription puis on
 * réutilise le même panneau que la page Comptabilité (une seule logique de saisie de paiement). */
export function QuickPaymentModal({ onClose }: { onClose: () => void }) {
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
        const firstToPay = rows.find((r) => r.status === 'TO_PAY') ?? rows[0];
        if (firstToPay) setEnrollmentId(firstToPay.account.enrollmentId);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Impossible de charger les comptes.');
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
        <h2>Enregistrer un paiement</h2>
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
                <EnrollmentAccountingPanel enrollmentId={enrollmentId} canWrite />
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
