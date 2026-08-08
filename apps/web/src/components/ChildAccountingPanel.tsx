import { Fragment, useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as accountingApi from '../api/accountingApi';
import type { ParentChildAccountSummary } from '../api/accountingApi';
import { EnrollmentAccountingPanel } from './EnrollmentAccountingPanel';
import { LoadingState } from './UiState';
import { formatAmount } from '../utils/format';

/** Onglet "Comptabilité" de la fiche enfant — extrait de ParentChildAccountingPage, sans l'en-tête
 * de page (déjà dans la même fenêtre que le reste de la fiche). */
export function ChildAccountingPanel({ studentId }: { studentId: string }) {
  const { getAccessToken } = useAuth();
  const [accounts, setAccounts] = useState<ParentChildAccountSummary[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setAccounts(await accountingApi.getParentChildSummary(token, studentId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de charger la comptabilité de l'enfant.");
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, studentId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <LoadingState label="Chargement de la comptabilité..." />;
  }

  return (
    <>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {accounts.length === 0 && <p>Aucun compte de suivi comptable pour cet enfant.</p>}
      {accounts.length > 0 && (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Groupe</th>
                <th>Matière</th>
                <th>Professeur</th>
                <th>Tarif</th>
                <th>Solde actuel</th>
                <th>Détail</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <Fragment key={account.id}>
                  <tr>
                    <td data-label="Groupe">{account.group.name}</td>
                    <td data-label="Matière">{account.group.subject.name}</td>
                    <td data-label="Professeur">
                      {account.group.teacher.firstName} {account.group.teacher.lastName}
                    </td>
                    <td data-label="Tarif">{formatAmount(account.rate)}</td>
                    <td data-label="Solde actuel">
                      <span className={`badge ${account.currentBalance < 0 ? 'badge-danger' : 'badge-success'}`}>
                        {formatAmount(account.currentBalance)}
                      </span>
                    </td>
                    <td data-label="Détail">
                      <button
                        type="button"
                        className="ghost-link"
                        onClick={() =>
                          setExpanded((current) => (current === account.enrollmentId ? null : account.enrollmentId))
                        }
                      >
                        {expanded === account.enrollmentId ? 'Masquer' : 'Voir'}
                      </button>
                    </td>
                  </tr>
                  {expanded === account.enrollmentId && (
                    <tr>
                      <td colSpan={6}>
                        <EnrollmentAccountingPanel enrollmentId={account.enrollmentId} canWrite={false} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
