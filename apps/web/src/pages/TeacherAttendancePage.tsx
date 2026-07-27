import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as groupsApi from '../api/groupsApi';
import * as attendanceApi from '../api/attendanceApi';
import type { Group } from '../api/groupsApi';
import type {
  AbandonmentAlert,
  AttendanceEntry,
  AttendanceStatus,
  SessionAttendanceView,
} from '../api/attendanceApi';

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'PRESENT', label: 'Présent' },
  { value: 'LATE', label: 'Retard' },
  { value: 'EXCUSED_ABSENT', label: 'Absent excusé' },
  { value: 'UNEXCUSED_ABSENT', label: 'Absent non excusé' },
];

const STATUS_BADGE: Record<AttendanceStatus, string> = {
  PRESENT: 'badge-success',
  LATE: 'badge-info',
  EXCUSED_ABSENT: 'badge-warning',
  UNEXCUSED_ABSENT: 'badge-danger',
};

const SESSION_STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Planifiée',
  COMPLETED: 'Terminée',
  LOCKED: 'Verrouillée',
  CANCELLED: 'Annulée',
  POSTPONED: 'Reportée',
};

/** Formulaire de saisie inline pour une ligne élève — état local tant que non enregistré. */
function AttendanceRow({
  entry,
  locked,
  onSave,
  onReset,
}: {
  entry: AttendanceEntry;
  locked: boolean;
  onSave: (studentId: string, status: AttendanceStatus, lateDuration: string, comment: string) => Promise<void>;
  onReset: (studentId: string) => Promise<void>;
}) {
  const [status, setStatus] = useState<AttendanceStatus>(entry.attendance?.status ?? 'PRESENT');
  const [lateDuration, setLateDuration] = useState(String(entry.attendance?.lateDuration ?? ''));
  const [comment, setComment] = useState(entry.attendance?.comment ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(entry.student.id, status, lateDuration, comment);
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr>
      <td>
        {entry.student.firstName} {entry.student.lastName}
      </td>
      <td>
        <select value={status} onChange={(e) => setStatus(e.target.value as AttendanceStatus)} disabled={locked}>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </td>
      <td>
        {status === 'LATE' && (
          <input
            type="number"
            min={1}
            placeholder="minutes"
            value={lateDuration}
            onChange={(e) => setLateDuration(e.target.value)}
            disabled={locked}
            style={{ width: '80px' }}
          />
        )}
      </td>
      <td>
        <input
          type="text"
          placeholder="Commentaire (optionnel)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={locked}
        />
      </td>
      <td>
        {entry.attendance ? (
          <span className={`badge ${STATUS_BADGE[entry.attendance.status]}`}>{entry.attendance.statusLabel}</span>
        ) : (
          <span className="badge badge-neutral">Non renseignée</span>
        )}
        {entry.attendance && (
          <span className={`badge ${entry.attendance.billable ? 'badge-info' : 'badge-neutral'}`} style={{ marginLeft: 6 }}>
            {entry.attendance.billable ? 'Facturée' : 'Non facturée'}
          </span>
        )}
      </td>
      <td className="admin-actions">
        <button type="button" onClick={handleSave} disabled={locked || saving}>
          {entry.attendance ? 'Corriger' : 'Enregistrer'}
        </button>
        {entry.attendance && !locked && (
          <button type="button" className="ghost" onClick={() => onReset(entry.student.id)}>
            Effacer
          </button>
        )}
      </td>
    </tr>
  );
}

export function TeacherAttendancePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { getAccessToken } = useAuth();
  const [view, setView] = useState<SessionAttendanceView | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [alerts, setAlerts] = useState<AbandonmentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token || !sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const attendance = await attendanceApi.getSessionAttendance(token, sessionId);
      setView(attendance);
      const [groups, abandonAlerts] = await Promise.all([
        groupsApi.listMine(token),
        attendanceApi.getAbandonmentAlerts(token, attendance.session.groupId),
      ]);
      setGroup(groups.find((g) => g.id === attendance.session.groupId) ?? null);
      setAlerts(abandonAlerts);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les présences.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(studentId: string, status: AttendanceStatus, lateDuration: string, comment: string) {
    const token = getAccessToken();
    if (!token || !sessionId) return;
    setError(null);
    setNotice(null);
    try {
      await attendanceApi.setAttendance(token, sessionId, studentId, {
        status,
        lateDuration: status === 'LATE' && lateDuration ? Number(lateDuration) : undefined,
        comment: comment || undefined,
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement impossible.');
    }
  }

  async function handleReset(studentId: string) {
    const token = getAccessToken();
    if (!token || !sessionId) return;
    setError(null);
    setNotice(null);
    try {
      await attendanceApi.resetAttendance(token, sessionId, studentId);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de réinitialiser cette présence.');
    }
  }

  async function handleValidate() {
    const token = getAccessToken();
    if (!token || !sessionId) return;
    setError(null);
    setNotice(null);
    try {
      const result = await attendanceApi.validateAttendance(token, sessionId);
      setView(result);
      setNotice('Présences validées : la séance est marquée terminée.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Validation impossible.');
    }
  }

  if (loading) {
    return <p>Chargement...</p>;
  }

  if (!view) {
    return <p className="form-error">{error ?? 'Séance introuvable.'}</p>;
  }

  const { session, entries } = view;
  const filledCount = entries.filter((e) => e.attendance !== null).length;
  const canValidate = session.status === 'PLANNED' && filledCount === entries.length && entries.length > 0;
  const locked = session.status === 'LOCKED' || session.status === 'COMPLETED';

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Présences — {group?.name ?? 'Groupe'}</h1>
          <p>
            Séance du {new Date(session.date).toLocaleDateString('fr-FR')} à {session.startTime} ·{' '}
            <span className={`badge ${session.status === 'LOCKED' ? 'badge-neutral' : session.status === 'COMPLETED' ? 'badge-success' : 'badge-info'}`}>
              {SESSION_STATUS_LABELS[session.status] ?? session.status}
            </span>
          </p>
        </div>
        <div className="page-actions">
          <Link to={`/teacher/groups/${session.groupId}/sessions`}>← Retour aux séances</Link>
          <Link to={`/teacher/groups/${session.groupId}/attendance`}>Statistiques du groupe</Link>
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

      {alerts.length > 0 && (
        <div className="alert-banner">
          <h3>⚠ Alerte d'abandon</h3>
          <ul>
            {alerts.map((a) => (
              <li key={a.enrollmentId}>
                {a.student.firstName} {a.student.lastName} — {a.consecutiveUnexcusedAbsences} absences non
                excusées consécutives
              </li>
            ))}
          </ul>
        </div>
      )}

      {session.status === 'LOCKED' && (
        <p className="form-notice" role="status">
          Cette séance est verrouillée (fenêtre de correction de 48h expirée) : toute présence est désormais
          définitive.
        </p>
      )}

      <section className="card-section">
        <h2>
          Élèves ({filledCount}/{entries.length} renseignés)
        </h2>
        {entries.length === 0 && <p>Aucun élève inscrit activement dans ce groupe.</p>}
        {entries.length > 0 && (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Élève</th>
                  <th>Statut</th>
                  <th>Retard</th>
                  <th>Commentaire</th>
                  <th>État</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <AttendanceRow
                    key={entry.enrollmentId}
                    entry={entry}
                    locked={locked}
                    onSave={handleSave}
                    onReset={handleReset}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
        {session.status === 'PLANNED' && (
          <div className="field-row" style={{ marginTop: 16 }}>
            <button type="button" onClick={handleValidate} disabled={!canValidate}>
              Valider les présences
            </button>
            {!canValidate && entries.length > 0 && (
              <span className="table-hint">Tous les élèves doivent recevoir un statut avant validation.</span>
            )}
          </div>
        )}
      </section>
    </>
  );
}
