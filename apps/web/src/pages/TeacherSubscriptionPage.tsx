import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Select } from '../components/Select';
import { ApiError } from '../api/client';
import * as subscriptionsApi from '../api/subscriptionsApi';
import type { Subscription, SubscriptionPlan } from '../api/subscriptionsApi';
import * as referentialsApi from '../api/referentialsApi';
import type { AcademicYear } from '../api/referentialsApi';

const STATUS_LABELS: Record<Subscription['status'], string> = {
  PENDING_PAYMENT: 'En attente de paiement',
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
  EXPIRED: 'Expiré',
};

const STATUS_BADGE: Record<Subscription['status'], string> = {
  PENDING_PAYMENT: 'badge-warning',
  ACTIVE: 'badge-success',
  SUSPENDED: 'badge-danger',
  EXPIRED: 'badge-neutral',
};

/** Ch.21 : abonnement du Professeur — offres disponibles, souscription, historique. */
export function TeacherSubscriptionPage() {
  const { getAccessToken } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedYearId, setSelectedYearId] = useState('');

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [subs, planList, yearList] = await Promise.all([
        subscriptionsApi.listMine(token),
        subscriptionsApi.listPlans(token),
        referentialsApi.listAcademicYears(token),
      ]);
      setSubscriptions(subs);
      setPlans(planList);
      setYears(yearList.filter((y) => y.status === 'OPEN'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger vos abonnements.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const subscribedYearIds = new Set(subscriptions.map((s) => s.academicYear.id));
  const availableYears = years.filter((y) => !subscribedYearIds.has(y.id));

  async function handleSubscribe() {
    const token = getAccessToken();
    if (!token || !selectedPlanId || !selectedYearId) return;
    setError(null);
    setNotice(null);
    try {
      const created = await subscriptionsApi.subscribe(token, { planId: selectedPlanId, academicYearId: selectedYearId });
      setNotice(
        created.status === 'ACTIVE'
          ? `Abonnement "${created.plan.name}" activé immédiatement.`
          : `Abonnement "${created.plan.name}" souscrit — en attente de validation du paiement par l'administration.`,
      );
      setSelectedPlanId('');
      setSelectedYearId('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "La souscription a échoué.");
    }
  }

  if (loading) {
    return <p>Chargement...</p>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Mon abonnement</h1>
          <p>Offres GROUPI, souscription et historique de vos abonnements (Ch.21).</p>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="form-notice" role="status">
          {notice}
        </p>
      )}

      <section className="card-section">
        <h2>Offres disponibles</h2>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Offre</th>
                <th>Tarif</th>
                <th>Capacité (inscriptions actives)</th>
                <th>Durée</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id}>
                  <td data-label="Offre">{plan.name}</td>
                  <td data-label="Tarif">{plan.price === 0 ? 'Gratuit' : `${plan.price} TND`}</td>
                  <td data-label="Capacité (inscriptions actives)">{plan.maxActiveEnrollments === null ? 'Illimitée' : plan.maxActiveEnrollments}</td>
                  <td data-label="Durée">{plan.durationDays ? `${plan.durationDays} jours` : "Jusqu'à la fin de l'année académique"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card-section">
        <h2>Souscrire un abonnement</h2>
        {availableYears.length === 0 ? (
          <p>Aucune année académique disponible pour une nouvelle souscription.</p>
        ) : (
          <div className="field-row">
            <label>
              Offre
              <Select value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}>
                <option value="">Choisir une offre</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} {plan.price === 0 ? '(gratuit)' : `(${plan.price} TND)`}
                  </option>
                ))}
              </Select>
            </label>
            <label>
              Année académique
              <Select value={selectedYearId} onChange={(e) => setSelectedYearId(e.target.value)}>
                <option value="">Choisir une année</option>
                {availableYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.label}
                  </option>
                ))}
              </Select>
            </label>
            <button type="button" disabled={!selectedPlanId || !selectedYearId} onClick={handleSubscribe}>
              Souscrire
            </button>
          </div>
        )}
      </section>

      <section className="card-section">
        <h2>Historique de mes abonnements</h2>
        {subscriptions.length === 0 ? (
          <p>Aucun abonnement pour le moment.</p>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Offre</th>
                  <th>Année académique</th>
                  <th>Statut</th>
                  <th>Expire le</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td data-label="Offre">{sub.plan.name}</td>
                    <td data-label="Année académique">{sub.academicYear.label}</td>
                    <td data-label="Statut">
                      <span className={`badge ${STATUS_BADGE[sub.status]}`}>{STATUS_LABELS[sub.status]}</span>
                      {sub.status === 'SUSPENDED' && sub.suspensionReason && (
                        <span className="table-hint"> — {sub.suspensionReason}</span>
                      )}
                    </td>
                    <td data-label="Expire le">{sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString('fr-FR') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
