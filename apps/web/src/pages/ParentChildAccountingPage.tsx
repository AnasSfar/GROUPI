import { Fragment, useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as accountingApi from '../api/accountingApi';
import type { ParentChildAccountSummary } from '../api/accountingApi';
import { EnrollmentAccountingPanel } from '../components/EnrollmentAccountingPanel';

function formatAmount(n: number): string {
  return `${n.toFixed(3)} TND`;
}

/** Ch.15.11 : vue consolidée Parent — groupes suivis, professeur, matière, tarif, solde actuel. */
export function ParentChildAccountingPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const { getAccessToken } = useAuth();
  const [accounts, setAccounts] = useState<ParentChildAccountSummary[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token || !studentId) return;
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
    return <p>Chargement...</p>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Comptabilité</h1>
          <p>Situation financière de votre enfant, par groupe suivi (Ch.15.11).</p>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <section className="card-section">
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
      </section>
    </>
  );
}
