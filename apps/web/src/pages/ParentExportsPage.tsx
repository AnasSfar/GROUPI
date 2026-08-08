import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Select } from '../components/Select';
import { ApiError } from '../api/client';
import * as exportsApi from '../api/exportsApi';
import type { ExportJob, ExportType } from '../api/exportsApi';
import * as parentProfileApi from '../api/parentProfileApi';
import type { Student } from '../api/parentProfileApi';

const PARENT_TYPES: { value: ExportType; label: string }[] = [
  { value: 'ATTENDANCE', label: 'Présences' },
  { value: 'PEDAGOGICAL_COMMENTS', label: 'Commentaires pédagogiques' },
  { value: 'ACCOUNTING_ACCOUNTS', label: 'Comptes de suivi comptables' },
  { value: 'PAYMENTS', label: 'Historique des paiements' },
];

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

/** Ch.17.4 : export des données de suivi des enfants — PDF uniquement (RM-EXP-010), jamais gaté par abonnement. */
export function ParentExportsPage() {
  const { getAccessToken } = useAuth();
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [type, setType] = useState<ExportType>('ATTENDANCE');
  const [studentId, setStudentId] = useState('');
  const [period, setPeriod] = useState<'CURRENT_YEAR' | 'ALL'>('CURRENT_YEAR');
  const [submitting, setSubmitting] = useState(false);

  const [gdprRequest, setGdprRequest] = useState<exportsApi.DataPortabilityRequest | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [jobList, studentList, gdprList] = await Promise.all([
        exportsApi.listMine(token),
        parentProfileApi.listStudents(token),
        exportsApi.listMyDataPortabilityRequests(token),
      ]);
      setJobs(jobList);
      setStudents(studentList);
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
      const job = await exportsApi.createExport(token, {
        type,
        format: 'PDF',
        studentId: studentId || undefined,
        period,
      });
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
          <h1>Exporter les données de mes enfants</h1>
          <p>Présences, commentaires pédagogiques, comptabilité et paiements — au format PDF (Ch.17.4).</p>
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
            <Select value={type} onChange={(e) => setType(e.target.value as ExportType)}>
              {PARENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Enfant
            <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Tous mes enfants</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Période
            <Select value={period} onChange={(e) => setPeriod(e.target.value as 'CURRENT_YEAR' | 'ALL')}>
              <option value="CURRENT_YEAR">Année académique en cours</option>
              <option value="ALL">Historique complet</option>
            </Select>
          </label>
          <button type="button" disabled={submitting} onClick={handleCreate}>
            {submitting ? 'Génération...' : 'Générer l’export PDF'}
          </button>
        </div>
        <p className="table-hint">
          Format PDF uniquement (RM-EXP-010) — données organisées par enfant. Fichier conservé 7 jours (RM-EXP-008).
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
                  <th>Statut</th>
                  <th>Lignes</th>
                  <th>Généré le</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td data-label="Fichier">{job.fileName ?? '—'}</td>
                    <td data-label="Statut">
                      <span className={`badge ${STATUS_BADGE[job.status]}`}>{STATUS_LABELS[job.status]}</span>
                    </td>
                    <td data-label="Lignes">{job.rowCount ?? '—'}</td>
                    <td data-label="Généré le">{new Date(job.createdAt).toLocaleString('fr-FR')}</td>
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
