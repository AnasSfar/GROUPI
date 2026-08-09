import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';
import { hasSessionStarted } from '../utils/format';
import { ApiError } from '../api/client';
import * as groupsApi from '../api/groupsApi';
import * as attendanceApi from '../api/attendanceApi';
import * as absenceNoticeApi from '../api/absenceNoticeApi';
import type { Group } from '../api/groupsApi';
import type {
  AbandonmentAlert,
  AttendanceEntry,
  AttendanceStatus,
  SessionAttendanceView,
} from '../api/attendanceApi';
import type { AbsenceNoticeWithStudent } from '../api/absenceNoticeApi';

const STATUS_COLUMNS: { value: AttendanceStatus; label: string; tone: 'success' | 'info' | 'warning' | 'danger' }[] = [
  { value: 'PRESENT', label: 'Présent', tone: 'success' },
  { value: 'LATE', label: 'Retard', tone: 'info' },
  { value: 'EXCUSED_ABSENT', label: 'Absent excusé', tone: 'warning' },
  { value: 'UNEXCUSED_ABSENT', label: 'Absent non excusé', tone: 'danger' },
];

const STATUS_BADGE: Record<AttendanceStatus, string> = {
  PRESENT: 'badge-success',
  LATE: 'badge-info',
  EXCUSED_ABSENT: 'badge-warning',
  UNEXCUSED_ABSENT: 'badge-danger',
};

/** L'enseignant coche juste "Retard" ; la durée exacte importe peu côté saisie rapide (backend
 *  exige néanmoins une valeur non nulle — ERR-ATT-022 — donc on en pose une par défaut). */
const DEFAULT_LATE_DURATION = '5';

const SESSION_STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Planifiée',
  COMPLETED: 'Terminée',
  LOCKED: 'Verrouillée',
  CANCELLED: 'Annulée',
  POSTPONED: 'Reportée',
};

interface PendingRow {
  status: AttendanceStatus | null;
  lateDuration: string;
  comment: string;
}

function pendingFromEntry(entry: AttendanceEntry): PendingRow {
  return {
    status: entry.attendance?.status ?? null,
    lateDuration: entry.attendance?.lateDuration != null ? String(entry.attendance.lateDuration) : '',
    comment: entry.attendance?.comment ?? '',
  };
}

function isRowDirty(entry: AttendanceEntry, row: PendingRow): boolean {
  const saved = pendingFromEntry(entry);
  return saved.status !== row.status || saved.lateDuration !== row.lateDuration || saved.comment !== row.comment;
}

export function TeacherAttendancePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { getAccessToken } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [view, setView] = useState<SessionAttendanceView | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [alerts, setAlerts] = useState<AbandonmentAlert[]>([]);
  const [absenceNotices, setAbsenceNotices] = useState<AbsenceNoticeWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, PendingRow>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token || !sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const attendance = await attendanceApi.getSessionAttendance(token, sessionId);
      setView(attendance);
      setPending(Object.fromEntries(attendance.entries.map((e) => [e.student.id, pendingFromEntry(e)])));
      const [groups, abandonAlerts, notices] = await Promise.all([
        groupsApi.listMine(token),
        attendanceApi.getAbandonmentAlerts(token, attendance.session.groupId),
        absenceNoticeApi.listAbsenceNotices(token, sessionId),
      ]);
      setGroup(groups.find((g) => g.id === attendance.session.groupId) ?? null);
      setAlerts(abandonAlerts);
      setAbsenceNotices(notices);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les présences.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  const entries = view?.entries ?? [];

  const dirtyEntries = useMemo(
    () => entries.filter((entry) => pending[entry.student.id] && isRowDirty(entry, pending[entry.student.id])),
    [entries, pending],
  );

  const hasUnsavedChanges = dirtyEntries.length > 0;

  const confirmLeave = useCallback(
    () =>
      confirm({
        title: 'Présences non enregistrées',
        message: 'Des présences ont été modifiées sans être enregistrées. Quitter sans enregistrer ?',
        confirmLabel: 'Quitter sans enregistrer',
        cancelLabel: 'Rester sur la page',
        danger: true,
      }),
    [confirm],
  );

  useUnsavedChangesGuard(hasUnsavedChanges, confirmLeave);

  function updateRow(studentId: string, patch: Partial<PendingRow>) {
    setPending((prev) => ({ ...prev, [studentId]: { ...prev[studentId], ...patch } }));
  }

  async function handleSaveAll() {
    const token = getAccessToken();
    if (!token || !sessionId || dirtyEntries.length === 0) return;
    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      const results = await Promise.allSettled(
        dirtyEntries.map((entry) => {
          const row = pending[entry.student.id];
          return attendanceApi.setAttendance(token, sessionId, entry.student.id, {
            status: row.status as AttendanceStatus,
            lateDuration: row.status === 'LATE' && row.lateDuration ? Number(row.lateDuration) : undefined,
            comment: row.comment || undefined,
          });
        }),
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) {
        setError(`${failed} présence(s) n'ont pas pu être enregistrées.`);
      } else {
        showToast('Présences enregistrées');
      }
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  }

  function handleCancelAll() {
    setPending(Object.fromEntries(entries.map((e) => [e.student.id, pendingFromEntry(e)])));
    setNotice(null);
  }

  async function handleReset(studentId: string) {
    const token = getAccessToken();
    if (!token || !sessionId) return;
    setError(null);
    setNotice(null);
    try {
      await attendanceApi.resetAttendance(token, sessionId, studentId);
      showToast('Présence réinitialisée');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de réinitialiser cette présence.');
    }
  }

  async function handleValidate() {
    const token = getAccessToken();
    if (!token || !sessionId || !canValidate) return;
    setError(null);
    setNotice(null);
    try {
      const result = await attendanceApi.validateAttendance(token, sessionId);
      setView(result);
      setPending(Object.fromEntries(result.entries.map((e) => [e.student.id, pendingFromEntry(e)])));
      setNotice('Présences validées : la séance est marquée terminée.');
      showToast('Présences validées');
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

  const { session } = view;
  const filledCount = entries.filter((e) => pending[e.student.id]?.status).length;
  const notYetStarted = session.status === 'PLANNED' && !hasSessionStarted(session.date, session.startTime);
  const canValidate =
    session.status === 'PLANNED' && !notYetStarted && filledCount === entries.length && entries.length > 0 && !hasUnsavedChanges;
  const locked = session.status === 'LOCKED' || session.status === 'COMPLETED' || notYetStarted;

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

      {absenceNotices.length > 0 && (
        <div className="alert-banner">
          <h3>Absences signalées par les Parents (Ch.16.4)</h3>
          <ul>
            {absenceNotices.map((n) => (
              <li key={n.id}>
                {n.student.firstName} {n.student.lastName}
                {n.reason ? ` — ${n.reason}` : ''}
                {n.comment ? ` (${n.comment})` : ''} — signalement informatif, ne modifie pas la présence
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
            <table className="admin-table attendance-table">
              <thead>
                <tr>
                  <th>Élève</th>
                  {STATUS_COLUMNS.map((col) => (
                    <th key={col.value} className="attendance-tick-head">
                      {col.label}
                    </th>
                  ))}
                  <th>Commentaire</th>
                  <th>État</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const row = pending[entry.student.id] ?? pendingFromEntry(entry);
                  const dirty = isRowDirty(entry, row);
                  return (
                    <tr key={entry.enrollmentId}>
                      <td data-label="Élève">
                        {entry.student.firstName} {entry.student.lastName}
                      </td>
                      {STATUS_COLUMNS.map((col) => (
                        <td key={col.value} data-label={col.label} className="attendance-tick-cell">
                          <input
                            type="radio"
                            className={`attendance-tick attendance-tick-${col.tone}`}
                            name={`status-${entry.enrollmentId}`}
                            checked={row.status === col.value}
                            disabled={locked}
                            onChange={() =>
                              updateRow(entry.student.id, {
                                status: col.value,
                                ...(col.value === 'LATE' && !row.lateDuration
                                  ? { lateDuration: DEFAULT_LATE_DURATION }
                                  : {}),
                              })
                            }
                            aria-label={`${col.label} — ${entry.student.firstName} ${entry.student.lastName}`}
                          />
                        </td>
                      ))}
                      <td data-label="Commentaire">
                        <input
                          type="text"
                          placeholder="Commentaire (optionnel)"
                          value={row.comment}
                          onChange={(e) => updateRow(entry.student.id, { comment: e.target.value })}
                          disabled={locked}
                        />
                      </td>
                      <td data-label="État">
                        {dirty && (
                          <span className="badge badge-warning" style={{ marginRight: 6 }}>
                            Non enregistré
                          </span>
                        )}
                        {entry.attendance ? (
                          <span className={`badge ${STATUS_BADGE[entry.attendance.status]}`}>
                            {entry.attendance.statusLabel}
                          </span>
                        ) : (
                          !dirty && <span className="badge badge-neutral">Non renseignée</span>
                        )}
                        {entry.attendance && (
                          <span
                            className={`badge ${entry.attendance.billable ? 'badge-info' : 'badge-neutral'}`}
                            style={{ marginLeft: 6 }}
                          >
                            {entry.attendance.billable ? 'Facturée' : 'Non facturée'}
                          </span>
                        )}
                      </td>
                      <td className="admin-actions">
                        {entry.attendance && !locked && (
                          <button type="button" className="ghost" onClick={() => handleReset(entry.student.id)}>
                            Effacer
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!locked && entries.length > 0 && (
          <div className="field-row" style={{ marginTop: 16 }}>
            <button type="button" onClick={handleSaveAll} disabled={!hasUnsavedChanges || saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button type="button" className="ghost" onClick={handleCancelAll} disabled={!hasUnsavedChanges || saving}>
              Annuler
            </button>
            {hasUnsavedChanges && (
              <span className="table-hint">
                {dirtyEntries.length} présence(s) modifiée(s) non enregistrée(s).
              </span>
            )}
          </div>
        )}

        {session.status === 'PLANNED' && (
          <div className="field-row" style={{ marginTop: 16 }}>
            <button type="button" onClick={handleValidate} disabled={!canValidate}>
              Valider les présences
            </button>
            {!canValidate && entries.length > 0 && (
              <span className="table-hint">
                {hasUnsavedChanges
                  ? 'Enregistrez vos modifications avant de valider.'
                  : 'Tous les élèves doivent recevoir un statut avant validation.'}
              </span>
            )}
          </div>
        )}
      </section>
    </>
  );
}
