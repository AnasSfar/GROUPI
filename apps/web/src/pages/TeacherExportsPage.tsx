import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as exportsApi from '../api/exportsApi';
import type { ExportFormat, ExportJob, ExportType } from '../api/exportsApi';
import * as groupsApi from '../api/groupsApi';
import type { Group } from '../api/groupsApi';

const TEACHER_TYPES: { value: ExportType; label: string }[] = [
  { value: 'GROUPS', label: 'Liste des groupes' },
  { value: 'STUDENTS', label: 'Liste des élèves' },
  { value: 'ATTENDANCE', label: 'Présences' },
  { value: 'LATENESS', label: 'Retards' },
  { value: 'PEDAGOGICAL_COMMENTS', label: 'Commentaires pédagogiques (offre Pro)' },
  { value: 'ACCOUNTING_ACCOUNTS', label: 'Comptes de suivi comptables' },
  { value: 'PAYMENTS', label: 'Paiements enregistrés' },
  { value: 'STATISTICS', label: 'Statistiques' },
  { value: 'DASHBOARD_INDICATORS', label: 'Indicateurs des tableaux de bord' },
];

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

/** Ch.17.4 : export des données Professeur — réservé aux offres Intermédiaire/Pro (RM-EXP-001). */
export function TeacherExportsPage() {
  const { getAccessToken } = useAuth();
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [type, setType] = useState<ExportType>('GROUPS');
  const [format, setFormat] = useState<ExportFormat>('PDF');
  const [groupId, setGroupId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [gdprRequest, setGdprRequest] = useState<exportsApi.DataPortabilityRequest | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [jobList, groupList, gdprList] = await Promise.all([
        exportsApi.listMine(token),
        groupsApi.listMine(token),
        exportsApi.listMyDataPortabilityRequests(token),
      ]);
      setJobs(jobList);
      setGroups(groupList);
      setGdprRequest(gdprList[0] ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger vos exports.');
    } finally {
      setLoading(false);
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
      const job = await exportsApi.createExport(token, { type, format, groupIds: groupId ? [groupId] : undefined });
      setNotice(
        job.rowCount === 0
          ? `Export "${job.fileName}" généré, mais aucune donnée ne correspond aux critères sélectionnés.`
          : `Export "${job.fileName}" généré et disponible au téléchargement.`,
      );
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

  async function handleGdprRequest() {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      const req = await exportsApi.requestDataPortability(token);
      setGdprRequest(req);
      setNotice('Demande de portabilité de vos données envoyée — traitée par un Administrateur sous 30 jours.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'La demande a échoué.');
    }
  }

  if (loading) {
    return <p>Chargement...</p>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Exporter mes données</h1>
          <p>Groupes, élèves, présences, comptabilité et statistiques — PDF, Excel ou CSV (Ch.17).</p>
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
        <h2>Nouvel export</h2>
        <div className="field-row">
          <label>
            Type de données
            <select value={type} onChange={(e) => setType(e.target.value as ExportType)}>
              {TEACHER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Format
            <select value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)}>
              <option value="PDF">{FORMAT_LABELS.PDF}</option>
              <option value="EXCEL">{FORMAT_LABELS.EXCEL}</option>
              <option value="CSV">{FORMAT_LABELS.CSV}</option>
            </select>
          </label>
          <label>
            Groupe (optionnel)
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              <option value="">Tous mes groupes</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" disabled={submitting} onClick={handleCreate}>
            {submitting ? 'Génération...' : 'Générer l’export'}
          </button>
        </div>
        <p className="table-hint">
          Réservé aux offres Intermédiaire et Pro (RM-EXP-001). Les commentaires pédagogiques sont réservés à l’offre Pro
          (Ch.17.4). Fichier conservé 7 jours, puis supprimé automatiquement (RM-EXP-008).
        </p>
      </section>

      <section className="card-section">
        <h2>Portabilité de mes données personnelles (RGPD)</h2>
        {gdprRequest && gdprRequest.status === 'PENDING' ? (
          <p>
            Demande envoyée le {new Date(gdprRequest.requestedAt).toLocaleDateString('fr-FR')} — traitement attendu avant le{' '}
            {new Date(gdprRequest.dueAt).toLocaleDateString('fr-FR')}.
          </p>
        ) : (
          <button type="button" className="ghost" onClick={handleGdprRequest}>
            Demander l’export de mes données personnelles
          </button>
        )}
      </section>

      <section className="card-section">
        <h2>Mes exports</h2>
        {jobs.length === 0 ? (
          <p>Aucun export généré pour le moment.</p>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Fichier</th>
                  <th>Format</th>
                  <th>Statut</th>
                  <th>Lignes</th>
                  <th>Généré le</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.fileName ?? '—'}</td>
                    <td>{FORMAT_LABELS[job.format]}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[job.status]}`}>{STATUS_LABELS[job.status]}</span>
                    </td>
                    <td>{job.rowCount ?? '—'}</td>
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
    </>
  );
}
