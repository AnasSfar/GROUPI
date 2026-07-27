import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as exportsApi from '../api/exportsApi';
import type { ExportFormat, ExportJob } from '../api/exportsApi';

const FORMAT_LABELS: Record<ExportFormat, string> = { PDF: 'PDF', EXCEL: 'Excel', CSV: 'CSV' };

const STATUS_LABELS: Record<ExportJob['status'], string> = {
  PENDING: 'En attente',
  PROCESSING: 'En cours de génération',
  READY: 'Disponible',
  FAILED: 'Échec',
  EXPIRED: 'Expiré',
};

const STATUS_BADGE: Record<ExportJob['status'], string> = {
  PENDING: 'badge-neutral',
  PROCESSING: 'badge-warning',
  READY: 'badge-success',
  FAILED: 'badge-danger',
  EXPIRED: 'badge-neutral',
};

const OUTCOME_LABELS: Record<string, string> = {
  SUCCESS: 'Réussi',
  EMPTY: 'Vide',
  FAILED: 'Échoué',
  REFUSED_SUBSCRIPTION: 'Refusé (abonnement)',
  REFUSED_FORMAT: 'Refusé (format)',
  REFUSED_UNAUTHORIZED: 'Refusé (non autorisé)',
};

const OUTCOME_BADGE: Record<string, string> = {
  SUCCESS: 'badge-success',
  EMPTY: 'badge-neutral',
  FAILED: 'badge-danger',
  REFUSED_SUBSCRIPTION: 'badge-warning',
  REFUSED_FORMAT: 'badge-warning',
  REFUSED_UNAUTHORIZED: 'badge-warning',
};

/**
 * Ch.17.4/17.8 : export de statistiques agrégées (PERM-EXP-001) et journal des exports
 * (PERM-EXP-002) pour le Super Admin et les Admins délégués, ainsi que la file de portabilité RGPD.
 */
export function AdminExportsPage() {
  const { getAccessToken } = useAuth();
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [journal, setJournal] = useState<exportsApi.ExportAuditEntry[] | null>(null);
  const [journalError, setJournalError] = useState<string | null>(null);
  const [gdprQueue, setGdprQueue] = useState<exportsApi.DataPortabilityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [format, setFormat] = useState<ExportFormat>('CSV');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [jobList, queue] = await Promise.all([exportsApi.listMine(token), exportsApi.listDataPortabilityQueue(token)]);
      setJobs(jobList);
      setGdprQueue(queue);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les exports.');
    } finally {
      setLoading(false);
    }
    try {
      setJournal(await exportsApi.listJournal(token));
      setJournalError(null);
    } catch (err) {
      // PERM-EXP-002 : un Admin sans la permission `EXP_VIEW_JOURNAL` n'a pas accès au journal —
      // ce n'est pas une erreur de chargement, juste une section non disponible pour ce compte.
      setJournal(null);
      setJournalError(err instanceof ApiError ? err.message : "Le journal des exports n'est pas accessible à ce compte.");
    }
  }, [getAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    const token = getAccessToken();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const job = await exportsApi.createAdminExport(token, { type: 'ADMIN_STATISTICS', format });
      setNotice(`Export "${job.fileName}" généré et disponible au téléchargement.`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "La génération de l'export a échoué.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownload(job: ExportJob) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      await exportsApi.downloadExport(token, job.id, job.fileName ?? 'export');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Téléchargement impossible.');
    }
  }

  async function handleFulfill(id: string) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      await exportsApi.fulfillDataPortabilityRequest(token, id, 'CSV');
      setNotice('Demande de portabilité traitée — export généré pour le titulaire des données.');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Le traitement de la demande a échoué.');
    }
  }

  if (loading) {
    return <p>Chargement...</p>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Exports et portabilité des données</h1>
          <p>Statistiques agrégées de la plateforme (Ch.17.4), journal des exports (17.8) et demandes de portabilité RGPD.</p>
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
        <h2>Statistiques agrégées de la plateforme</h2>
        <div className="field-row">
          <label>
            Format
            <select value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)}>
              <option value="CSV">{FORMAT_LABELS.CSV}</option>
              <option value="EXCEL">{FORMAT_LABELS.EXCEL}</option>
              <option value="PDF">{FORMAT_LABELS.PDF}</option>
            </select>
          </label>
          <button type="button" disabled={submitting} onClick={handleCreate}>
            {submitting ? 'Génération...' : 'Générer l’export'}
          </button>
        </div>

        {jobs.length > 0 && (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Fichier</th>
                  <th>Statut</th>
                  <th>Généré le</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.fileName ?? '—'}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[job.status]}`}>{STATUS_LABELS[job.status]}</span>
                    </td>
                    <td>{new Date(job.createdAt).toLocaleString('fr-FR')}</td>
                    <td className="admin-actions">
                      {job.status === 'READY' ? (
                        <button type="button" onClick={() => handleDownload(job)}>
                          Télécharger
                        </button>
                      ) : (
                        <span className="table-hint">{STATUS_LABELS[job.status]}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card-section">
        <h2>File d’attente — portabilité RGPD</h2>
        {gdprQueue.length === 0 ? (
          <p>Aucune demande de portabilité en attente.</p>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Demandée le</th>
                  <th>À traiter avant le</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {gdprQueue.map((req) => (
                  <tr key={req.id}>
                    <td>{req.user?.email ?? '—'}</td>
                    <td>{new Date(req.requestedAt).toLocaleDateString('fr-FR')}</td>
                    <td>{new Date(req.dueAt).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <span className={`badge ${req.status === 'FULFILLED' ? 'badge-success' : 'badge-warning'}`}>
                        {req.status === 'FULFILLED' ? 'Traitée' : 'En attente'}
                      </span>
                    </td>
                    <td className="admin-actions">
                      {req.status === 'PENDING' ? (
                        <button type="button" onClick={() => handleFulfill(req.id)}>
                          Traiter
                        </button>
                      ) : (
                        <span className="table-hint">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card-section">
        <h2>Journal des exports</h2>
        {journalError ? (
          <p className="table-hint">{journalError}</p>
        ) : journal && journal.length === 0 ? (
          <p>Aucun export enregistré pour le moment.</p>
        ) : journal ? (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Type</th>
                  <th>Format</th>
                  <th>Résultat</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {journal.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.user.email}</td>
                    <td>{entry.type}</td>
                    <td>{FORMAT_LABELS[entry.format]}</td>
                    <td>
                      <span className={`badge ${OUTCOME_BADGE[entry.outcome] ?? 'badge-neutral'}`}>
                        {OUTCOME_LABELS[entry.outcome] ?? entry.outcome}
                      </span>
                      {entry.refusalReason && <span className="table-hint"> — {entry.refusalReason}</span>}
                    </td>
                    <td>{new Date(entry.createdAt).toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </>
  );
}
