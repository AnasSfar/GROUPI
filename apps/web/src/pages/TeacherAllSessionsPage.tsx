import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Select } from '../components/Select';
import { EmptyState } from '../components/UiState';
import { ApiError } from '../api/client';
import * as groupsApi from '../api/groupsApi';
import * as sessionsApi from '../api/sessionsApi';
import { formatDuration } from '../api/groupsApi';
import { hasSessionStarted, sessionStartTimestamp } from '../utils/format';
import type { Group } from '../api/groupsApi';
import type { Session, SessionStatus } from '../api/sessionsApi';

const STATUS_LABELS: Record<SessionStatus, string> = {
  PLANNED: 'Planifiee',
  POSTPONED: 'Reportee',
  CANCELLED: 'Annulee',
  COMPLETED: 'Terminee',
  LOCKED: 'Verrouillee',
};

const STATUS_BADGE: Record<SessionStatus, string> = {
  PLANNED: 'badge-info',
  POSTPONED: 'badge-warning',
  CANCELLED: 'badge-danger',
  COMPLETED: 'badge-success',
  LOCKED: 'badge-neutral',
};

const MODE_LABELS: Record<Group['teachingMode'], string> = {
  PRESENTIAL: 'Presentiel',
  ONLINE: 'En ligne',
};

interface SessionRow {
  session: Session;
  group: Group;
}

function canOpenAttendance(session: Session): boolean {
  if (session.status === 'COMPLETED' || session.status === 'LOCKED') return true;
  if (session.status !== 'PLANNED') return false;
  return hasSessionStarted(session.date, session.startTime);
}

function attendanceLabel(status: SessionStatus): string {
  return status === 'PLANNED' ? "Faire l'appel" : "Voir l'appel";
}

function sessionTimestamp(row: SessionRow): number {
  return sessionStartTimestamp(row.session.date, row.session.startTime);
}

/** Vue operationnelle Professeur : une ligne par occurrence de seance, tous groupes confondus. */
export function TeacherAllSessionsPage() {
  const { getAccessToken } = useAuth();
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [statusFilter, setStatusFilter] = useState<SessionStatus | ''>('');
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'TODAY' | 'UPCOMING' | 'PAST'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const myGroups = await groupsApi.listMine(token);
      const sessionsByGroup = await Promise.all(
        myGroups.map(async (group) => ({
          group,
          sessions: await sessionsApi.listSessions(token, group.id),
        })),
      );
      setGroups(myGroups);
      setRows(
        sessionsByGroup
          .flatMap(({ group, sessions }) => sessions.map((session) => ({ group, session })))
          .sort((a, b) => sessionTimestamp(a) - sessionTimestamp(b)),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les seances.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredRows = useMemo(() => {
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);
    const now = Date.now();
    return rows.filter((row) => {
      const dateKey = row.session.date.slice(0, 10);
      if (selectedGroupId && row.group.id !== selectedGroupId) return false;
      if (statusFilter && row.session.status !== statusFilter) return false;
      if (periodFilter === 'TODAY' && dateKey !== todayKey) return false;
      if (periodFilter === 'UPCOMING' && sessionTimestamp(row) < now) return false;
      if (periodFilter === 'PAST' && sessionTimestamp(row) >= now) return false;
      return true;
    });
  }, [periodFilter, rows, selectedGroupId, statusFilter]);

  if (loading) {
    return <p>Chargement...</p>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Mes seances</h1>
          <p>Une ligne par seance, avec acces direct a l'appel et au suivi des paiements.</p>
        </div>
        <div className="page-actions">
          <Link to="/teacher/groups">Mes groupes</Link>
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
            <Select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}>
              <option value="">Tous les groupes</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Periode
            <Select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value as typeof periodFilter)}>
              <option value="ALL">Toutes</option>
              <option value="TODAY">Aujourd'hui</option>
              <option value="UPCOMING">A venir</option>
              <option value="PAST">Passees</option>
            </Select>
          </label>
          <label>
            Statut
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as SessionStatus | '')}>
              <option value="">Tous</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
        </div>

        {filteredRows.length === 0 ? (
          <EmptyState title="Aucune seance">Aucune seance ne correspond aux filtres actuels.</EmptyState>
        ) : (
          <div className="table-wrap section-spacer">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Heure</th>
                  <th>Groupe</th>
                  <th>Matiere / Niveau</th>
                  <th>Duree</th>
                  <th>Mode</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(({ session, group }) => (
                  <tr key={session.id}>
                    <td data-label="Date">
                      {new Date(session.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>
                    <td data-label="Heure">{session.startTime}</td>
                    <td data-label="Groupe">{group.name}</td>
                    <td data-label="Matiere / Niveau">
                      {group.subject.name} - {group.schoolLevel.name}
                    </td>
                    <td data-label="Duree">{formatDuration(session.durationMinutes)}</td>
                    <td data-label="Mode">{MODE_LABELS[session.teachingMode]}</td>
                    <td data-label="Statut">
                      <span className={`badge ${STATUS_BADGE[session.status]}`}>
                        {STATUS_LABELS[session.status]}
                      </span>
                    </td>
                    <td className="admin-actions">
                      {canOpenAttendance(session) ? (
                        <Link to={`/teacher/sessions/${session.id}/attendance`}>
                          {attendanceLabel(session.status)}
                        </Link>
                      ) : (
                        <span className="table-hint">Appel indisponible</span>
                      )}
                      <Link to={`/teacher/sessions/${session.id}/payments`}>Saisir les paiements</Link>
                      <Link to={`/teacher/groups/${group.id}/sessions`}>Voir</Link>
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

