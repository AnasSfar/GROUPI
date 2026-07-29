import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Select } from '../components/Select';
import { ApiError } from '../api/client';
import * as groupsApi from '../api/groupsApi';
import * as accountingApi from '../api/accountingApi';
import type { Group } from '../api/groupsApi';
import type { GroupAccountingIndicators, TeacherAccountingIndicators } from '../api/accountingApi';

function formatAmount(n: number): string {
  return `${n.toFixed(3)} TND`;
}

function formatRate(n: number | null): string {
  return n === null ? '—' : `${n.toFixed(1)}%`;
}

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

/** Ch.15.12.2/15.12.3 : indicateurs financiers — vision globale Professeur, puis détail par groupe. */
export function TeacherAccountingPage() {
  const { getAccessToken } = useAuth();
  const [teacherIndicators, setTeacherIndicators] = useState<TeacherAccountingIndicators | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [groupIndicators, setGroupIndicators] = useState<GroupAccountingIndicators | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [indicators, myGroups] = await Promise.all([
        accountingApi.getTeacherIndicators(token),
        groupsApi.listMine(token),
      ]);
      setTeacherIndicators(indicators);
      setGroups(myGroups);
      setSelectedGroupId((current) => current || myGroups[0]?.id || '');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les indicateurs financiers.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !selectedGroupId) {
      setGroupIndicators(null);
      return;
    }
    setLoadingGroup(true);
    accountingApi
      .getGroupIndicators(token, selectedGroupId)
      .then(setGroupIndicators)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Impossible de charger les indicateurs du groupe.'))
      .finally(() => setLoadingGroup(false));
  }, [getAccessToken, selectedGroupId]);

  if (loading) {
    return <p>Chargement...</p>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Comptabilité</h1>
          <p>Indicateurs financiers calculés en temps réel à partir des écritures comptables (Ch.15.12).</p>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {teacherIndicators && (
        <section className="card-section">
          <h2>Vue d'ensemble</h2>
          <StatGrid
            tiles={[
              { label: 'CA prévisionnel', value: formatAmount(teacherIndicators.forecastRevenue) },
              { label: 'CA réalisé', value: formatAmount(teacherIndicators.realizedRevenue) },
              { label: 'CA encaissé', value: formatAmount(teacherIndicators.collectedRevenue) },
              { label: 'CA à recevoir', value: formatAmount(teacherIndicators.receivableRevenue) },
              { label: 'CA du mois', value: formatAmount(teacherIndicators.revenueThisMonth) },
              { label: "CA de l'année", value: formatAmount(teacherIndicators.revenueThisYear) },
              { label: 'Comptes débiteurs', value: String(teacherIndicators.debtorAccountCount) },
              { label: 'Comptes créditeurs', value: String(teacherIndicators.creditorAccountCount) },
              { label: 'Comptes en alerte', value: String(teacherIndicators.alertAccountCount) },
              { label: 'Solde moyen des comptes', value: formatAmount(teacherIndicators.averageAccountBalance) },
              { label: "Taux d'encaissement", value: formatRate(teacherIndicators.collectionRate) },
              { label: "Taux d'impayés", value: formatRate(teacherIndicators.unpaidRate) },
              { label: 'Encours total', value: formatAmount(teacherIndicators.totalOutstanding) },
              { label: 'Encours moyen / inscription', value: formatAmount(teacherIndicators.averageOutstandingPerEnrollment) },
              { label: 'Plus ancienne dette', value: `${teacherIndicators.oldestDebtDays} j.` },
              { label: 'Paiements du mois', value: String(teacherIndicators.paymentsThisMonth) },
              { label: 'Montant moyen des paiements', value: formatAmount(teacherIndicators.averagePaymentAmount) },
              { label: "Délai moyen d'encaissement", value: teacherIndicators.averageCollectionDelayDays !== null ? `${teacherIndicators.averageCollectionDelayDays.toFixed(1)} j.` : '—' },
              { label: 'Meilleur mois', value: teacherIndicators.bestCollectionMonth ?? '—' },
              { label: 'Pire mois', value: teacherIndicators.worstCollectionMonth ?? '—' },
              { label: 'Taux de régularisation des dettes', value: formatRate(teacherIndicators.debtRegularizationRate) },
            ]}
          />
        </section>
      )}

      <section className="card-section">
        <label>
          Groupe
          <Select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}>
            {groups.length === 0 && <option value="">Aucun groupe</option>}
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} — {g.subject.name} ({g.schoolLevel.name})
              </option>
            ))}
          </Select>
        </label>

        {loadingGroup && <p>Chargement...</p>}
        {!loadingGroup && groupIndicators && (
          <StatGrid
            tiles={[
              { label: 'Séances facturées', value: String(groupIndicators.billedSessionCount) },
              { label: 'Montant total facturé', value: formatAmount(groupIndicators.totalInvoiced) },
              { label: 'Montant total encaissé', value: formatAmount(groupIndicators.totalCollected) },
              { label: 'Montant restant à recevoir', value: formatAmount(groupIndicators.remainingToReceive) },
              { label: 'Comptes débiteurs', value: String(groupIndicators.debtorAccountCount) },
              { label: 'Comptes créditeurs', value: String(groupIndicators.creditorAccountCount) },
              { label: 'Solde moyen des inscriptions', value: formatAmount(groupIndicators.averageEnrollmentBalance) },
              { label: 'Taux de paiement du groupe', value: formatRate(groupIndicators.groupPaymentRate) },
              { label: 'Dette moyenne / inscription', value: formatAmount(groupIndicators.averageDebtPerEnrollment) },
              { label: 'Avance moyenne / inscription', value: formatAmount(groupIndicators.averageCreditPerEnrollment) },
              { label: 'Total des dettes', value: formatAmount(groupIndicators.totalDebt) },
              { label: 'Total des avances', value: formatAmount(groupIndicators.totalCredit) },
              { label: 'Taux de comptes débiteurs', value: formatRate(groupIndicators.debtorRate) },
              { label: 'Taux de comptes créditeurs', value: formatRate(groupIndicators.creditorRate) },
              { label: 'Encours moyen / inscription', value: formatAmount(groupIndicators.averageOutstandingPerEnrollment) },
              { label: 'Paiement moyen / inscription', value: formatAmount(groupIndicators.averagePaymentPerEnrollment) },
              { label: 'Facturation moyenne / inscription', value: formatAmount(groupIndicators.averageInvoicedPerEnrollment) },
              { label: 'Comptes en alerte', value: String(groupIndicators.alertAccountCount) },
              { label: 'Âge moyen des dettes', value: `${groupIndicators.averageDebtAgeDays.toFixed(1)} j.` },
            ]}
          />
        )}
      </section>
    </>
  );
}
