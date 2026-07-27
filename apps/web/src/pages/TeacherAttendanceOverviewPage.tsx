import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as groupsApi from '../api/groupsApi';
import * as attendanceApi from '../api/attendanceApi';
import { AttendanceMeter } from '../components/AttendanceMeter';
import type { Group } from '../api/groupsApi';
import type { AbandonmentAlert, AttendanceStatsPeriod, AttendanceStudentStats, RegisterEntry } from '../api/attendanceApi';

const PERIOD_LABELS: Record<AttendanceStatsPeriod, string> = {
  GROUP: 'Depuis le début du groupe',
  ACADEMIC_YEAR: "Depuis le début de l'année académique",
  LAST_30_DAYS: '30 derniers jours',
};

/** Ch.14.9/14.10/14.11 : vue d'ensemble des présences d'un groupe — statistiques, alertes, registre. */
export function TeacherAttendanceOverviewPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { getAccessToken } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [period, setPeriod] = useState<AttendanceStatsPeriod>('GROUP');
  const [stats, setStats] = useState<AttendanceStudentStats[]>([]);
  const [alerts, setAlerts] = useState<AbandonmentAlert[]>([]);
  const [register, setRegister] = useState<RegisterEntry[]>([]);
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (selectedPeriod: AttendanceStatsPeriod) => {
      const token = getAccessToken();
      if (!token || !groupId) return;
      setLoading(true);
      setError(null);
      try {
        const [groups, groupStats, abandonAlerts] = await Promise.all([
          groupsApi.listMine(token),
          attendanceApi.getGroupStats(token, groupId, selectedPeriod),
          attendanceApi.getAbandonmentAlerts(token, groupId),
        ]);
        setGroup(groups.find((g) => g.id === groupId) ?? null);
        setStats(groupStats);
        setAlerts(abandonAlerts);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Impossible de charger les statistiques.');
      } finally {
        setLoading(false);
      }
    },
    [getAccessToken, groupId],
  );

  useEffect(() => {
    load(period);
  }, [load, period]);

  async function handleShowRegister() {
    const token = getAccessToken();
    if (!token || !groupId) return;
    setShowRegister(true);
    if (register.length > 0) return;
    try {
      const entries = await attendanceApi.getRegister(token, groupId);
      setRegister(entries);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger le registre.');
    }
  }

  if (loading && stats.length === 0) {
    return <p>Chargement...</p>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Statistiques de présence — {group?.name ?? 'Groupe'}</h1>
          <p>Assiduité, alertes d'abandon et registre officiel de présence du groupe.</p>
        </div>
        <div className="page-actions">
          <Link to={`/teacher/groups/${groupId}/sessions`}>← Retour aux séances</Link>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {alerts.length > 0 && (
        <div className="alert-banner">
          <h3>⚠ {alerts.length} élève(s) proche(s) de l'abandon</h3>
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

      <section className="card-section">
        <h2>Assiduité par élève</h2>
        <label>
          Période
          <select value={period} onChange={(e) => setPeriod(e.target.value as AttendanceStatsPeriod)}>
            {Object.entries(PERIOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {stats.length === 0 && <p>Aucun élève actif dans ce groupe.</p>}
        {stats.length > 0 && (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Élève</th>
                  <th>Séances</th>
                  <th>Présent</th>
                  <th>Retard</th>
                  <th>Absences excusées</th>
                  <th>Absences non excusées</th>
                  <th>Taux d'assiduité</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.student.id}>
                    <td>
                      {s.student.firstName} {s.student.lastName}
                    </td>
                    <td>{s.totalSessions}</td>
                    <td>{s.present}</td>
                    <td>{s.late}</td>
                    <td>{s.excusedAbsences}</td>
                    <td>{s.unexcusedAbsences}</td>
                    <td>
                      <AttendanceMeter rate={s.attendanceRate} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card-section">
        <h2>Registre de présence</h2>
        <p className="table-hint">
          L'export du registre selon les droits d'abonnement n'est pas encore disponible — le registre reste
          consultable ici dans son intégralité.
        </p>
        {!showRegister ? (
          <button type="button" onClick={handleShowRegister}>
            Afficher le registre complet
          </button>
        ) : register.length === 0 ? (
          <p>Aucune présence enregistrée pour le moment.</p>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Heure</th>
                  <th>Élève</th>
                  <th>Statut</th>
                  <th>Facturation</th>
                </tr>
              </thead>
              <tbody>
                {register.map((entry) => (
                  <tr key={`${entry.session.id}-${entry.student.id}`}>
                    <td>{new Date(entry.session.date).toLocaleDateString('fr-FR')}</td>
                    <td>{entry.session.startTime}</td>
                    <td>
                      {entry.student.firstName} {entry.student.lastName}
                    </td>
                    <td>{entry.statusLabel}</td>
                    <td>{entry.billable ? 'Facturée' : 'Non facturée'}</td>
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
