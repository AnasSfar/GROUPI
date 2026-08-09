import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Select } from '../components/Select';
import { EmptyState } from '../components/UiState';
import { EnrollmentAccountingPanel } from '../components/EnrollmentAccountingPanel';
import { ApiError } from '../api/client';
import * as groupsApi from '../api/groupsApi';
import * as accountingApi from '../api/accountingApi';
import type { Group } from '../api/groupsApi';
import type {
  GroupAccountingIndicators,
  TeacherAccountSummary,
  TeacherAccountingIndicators,
} from '../api/accountingApi';

function formatAmount(n: number): string {
  return `${n.toFixed(3)} TND`;
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString('fr-FR') : '-';
}

const PAYMENT_STATUS_LABELS: Record<TeacherAccountSummary['status'], string> = {
  TO_PAY: 'A payer',
  PAID: 'Paye',
  CREDIT: 'Avance',
};

const PAYMENT_STATUS_BADGES: Record<TeacherAccountSummary['status'], string> = {
  TO_PAY: 'badge-danger',
  PAID: 'badge-success',
  CREDIT: 'badge-info',
};

interface StatTile {
  label: string;
  value: string;
}

function StatGrid({ tiles }: { tiles: StatTile[] }) {
  return (
    <div className="card-grid stat-grid">
      {tiles.map((tile) => (
        <div key={tile.label} className="card-section stat-tile">
          <p className="table-hint">{tile.label}</p>
          <p className="stat-value">{tile.value}</p>
        </div>
      ))}
    </div>
  );
}

/** Paiements Professeur : tableau de suivi eleve par eleve, plus indicateurs financiers en appui. */
export function TeacherAccountingPage() {
  const { getAccessToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [teacherIndicators, setTeacherIndicators] = useState<TeacherAccountingIndicators | null>(null);
  const [accounts, setAccounts] = useState<TeacherAccountSummary[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState(() => searchParams.get('groupId') ?? '');
  const [statusFilter, setStatusFilter] = useState<TeacherAccountSummary['status'] | ''>('');
  const [groupIndicators, setGroupIndicators] = useState<GroupAccountingIndicators | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedEnrollmentId, setExpandedEnrollmentId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const initialGroupId = searchParams.get('groupId') ?? '';
      const [indicators, myGroups, accountRows] = await Promise.all([
        accountingApi.getTeacherIndicators(token),
        groupsApi.listMine(token),
        accountingApi.listTeacherAccounts(token, initialGroupId || undefined),
      ]);
      setTeacherIndicators(indicators);
      setGroups(myGroups);
      setAccounts(accountRows);
      setSelectedGroupId(initialGroupId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les paiements.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, searchParams]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    setLoadingGroup(true);
    setError(null);
    Promise.all([
      accountingApi.listTeacherAccounts(token, selectedGroupId || undefined),
      selectedGroupId ? accountingApi.getGroupIndicators(token, selectedGroupId) : Promise.resolve(null),
    ])
      .then(([accountRows, indicators]) => {
        setAccounts(accountRows);
        setGroupIndicators(indicators);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Impossible de charger les paiements du groupe.'))
      .finally(() => setLoadingGroup(false));
  }, [getAccessToken, selectedGroupId]);

  function handleGroupChange(groupId: string) {
    setSelectedGroupId(groupId);
    setSearchParams(groupId ? { groupId } : {});
  }

  const filteredAccounts = useMemo(
    () => accounts.filter((row) => !statusFilter || row.status === statusFilter),
    [accounts, statusFilter],
  );

  const totals = useMemo(
    () => ({
      toPayCount: accounts.filter((row) => row.status === 'TO_PAY').length,
      paidCount: accounts.filter((row) => row.status === 'PAID').length,
      creditCount: accounts.filter((row) => row.status === 'CREDIT').length,
      remainingToPay: accounts.reduce((sum, row) => sum + row.remainingToPay, 0),
    }),
    [accounts],
  );

  if (loading) {
    return <p>Chargement...</p>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Paiements</h1>
          <p>Suivi des eleves : qui a paye, qui doit encore regler, et les avances.</p>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <section className="card-section">
        <div className="filters-row">
          <label>
            Groupe
            <Select value={selectedGroupId} onChange={(e) => handleGroupChange(e.target.value)}>
              <option value="">Tous les groupes</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} - {g.subject.name} ({g.schoolLevel.name})
                </option>
              ))}
            </Select>
          </label>
          <label>
            Statut
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
              <option value="">Tous</option>
              <option value="TO_PAY">A payer</option>
              <option value="PAID">Paye</option>
              <option value="CREDIT">Avance</option>
            </Select>
          </label>
        </div>

        <StatGrid
          tiles={[
            { label: 'A payer', value: String(totals.toPayCount) },
            { label: 'Payes', value: String(totals.paidCount) },
            { label: 'Avances', value: String(totals.creditCount) },
            { label: 'Reste a encaisser', value: formatAmount(totals.remainingToPay) },
          ]}
        />

        {loadingGroup && <p>Chargement...</p>}
        {!loadingGroup && filteredAccounts.length === 0 ? (
          <EmptyState title="Aucun paiement">Aucun eleve ne correspond aux filtres actuels.</EmptyState>
        ) : (
          <div className="table-wrap section-spacer">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Eleve</th>
                  <th>Groupe</th>
                  <th>Statut</th>
                  <th>Facture</th>
                  <th>Paye</th>
                  <th>Reste</th>
                  <th>Dernier paiement</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((row) => (
                  <Fragment key={row.account.id}>
                    <tr>
                      <td data-label="Eleve">
                        {row.account.student.firstName} {row.account.student.lastName}
                      </td>
                      <td data-label="Groupe">{row.account.group.name}</td>
                      <td data-label="Statut">
                        <span className={`badge ${PAYMENT_STATUS_BADGES[row.status]}`}>
                          {PAYMENT_STATUS_LABELS[row.status]}
                        </span>
                      </td>
                      <td data-label="Facture">{formatAmount(row.invoicedAmount)}</td>
                      <td data-label="Paye">{formatAmount(row.paidAmount)}</td>
                      <td data-label="Reste">{formatAmount(row.remainingToPay)}</td>
                      <td data-label="Dernier paiement">
                        {row.lastPaymentAmount !== null
                          ? `${formatAmount(row.lastPaymentAmount)} le ${formatDate(row.lastPaymentDate)}`
                          : '-'}
                      </td>
                      <td className="admin-actions">
                        <button
                          type="button"
                          className="ghost-link"
                          onClick={() =>
                            setExpandedEnrollmentId((current) =>
                              current === row.account.enrollmentId ? null : row.account.enrollmentId,
                            )
                          }
                        >
                          {expandedEnrollmentId === row.account.enrollmentId ? 'Masquer' : 'Saisir un paiement'}
                        </button>
                      </td>
                    </tr>
                    {expandedEnrollmentId === row.account.enrollmentId && (
                      <tr>
                        <td colSpan={9}>
                          <EnrollmentAccountingPanel enrollmentId={row.account.enrollmentId} canWrite />
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

      {teacherIndicators && (
        <section className="card-section">
          <h2>Indicateurs financiers</h2>
          <StatGrid
            tiles={[
              { label: 'CA previsionnel', value: formatAmount(teacherIndicators.forecastRevenue) },
              { label: 'CA realise', value: formatAmount(teacherIndicators.realizedRevenue) },
              { label: 'CA encaisse', value: formatAmount(teacherIndicators.collectedRevenue) },
              { label: 'CA a recevoir', value: formatAmount(teacherIndicators.receivableRevenue) },
              { label: 'Comptes debiteurs', value: String(teacherIndicators.debtorAccountCount) },
              { label: 'Comptes crediteurs', value: String(teacherIndicators.creditorAccountCount) },
              { label: 'Paiements du mois', value: String(teacherIndicators.paymentsThisMonth) },
              { label: 'Plus ancienne dette', value: `${teacherIndicators.oldestDebtDays} j.` },
            ]}
          />
        </section>
      )}

      {selectedGroupId && groupIndicators && (
        <section className="card-section">
          <h2>Indicateurs du groupe</h2>
          <StatGrid
            tiles={[
              { label: 'Seances facturees', value: String(groupIndicators.billedSessionCount) },
              { label: 'Total facture', value: formatAmount(groupIndicators.totalInvoiced) },
              { label: 'Total encaisse', value: formatAmount(groupIndicators.totalCollected) },
              { label: 'Reste a recevoir', value: formatAmount(groupIndicators.remainingToReceive) },
              { label: 'Comptes en alerte', value: String(groupIndicators.alertAccountCount) },
            ]}
          />
        </section>
      )}
    </>
  );
}
