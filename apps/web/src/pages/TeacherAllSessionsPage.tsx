import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Select } from '../components/Select';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { MonthCalendar, type MonthCalendarEvent } from '../components/MonthCalendar';
import type { WeekCalendarTone } from '../components/WeekCalendar';
import { ApiError } from '../api/client';
import * as groupsApi from '../api/groupsApi';
import * as sessionsApi from '../api/sessionsApi';
import * as teacherProfileApi from '../api/teacherProfileApi';
import { formatDuration } from '../api/groupsApi';
import { hasSessionStarted, sessionStartTimestamp } from '../utils/format';
import type { Group, TeachingMode } from '../api/groupsApi';
import type { Session, SessionStatus } from '../api/sessionsApi';
import type { TeachingLocation } from '../api/teacherProfileApi';

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

const STATUS_TONE: Record<SessionStatus, WeekCalendarTone> = {
  PLANNED: 'info',
  POSTPONED: 'warning',
  CANCELLED: 'danger',
  COMPLETED: 'success',
  LOCKED: 'neutral',
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

function attendanceUnavailableLabel(session: Session): string {
  if (session.status === 'PLANNED') {
    return `Disponible a ${session.startTime}`;
  }
  return 'Appel indisponible';
}

function canOpenPayments(session: Session): boolean {
  return session.status === 'COMPLETED' || session.status === 'LOCKED';
}

function sessionTimestamp(row: SessionRow): number {
  return sessionStartTimestamp(row.session.date, row.session.startTime);
}

/** Ch.13.3/13.8 : formulaire inline pour saisir la nouvelle date/heure d'un report. */
function PostponePrompt({
  initialDate,
  initialStartTime,
  initialDuration,
  onConfirm,
  onCancel,
}: {
  initialDate: string;
  initialStartTime: string;
  initialDuration: number;
  onConfirm: (date: string, startTime: string, durationMinutes: number) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [durationMinutes, setDurationMinutes] = useState(String(initialDuration));

  return (
    <div className="reason-prompt">
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} autoFocus />
      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
      <input
        type="number"
        min={1}
        value={durationMinutes}
        onChange={(e) => setDurationMinutes(e.target.value)}
      />
      <button
        type="button"
        disabled={!date || !startTime}
        onClick={() => onConfirm(date, startTime, Number(durationMinutes))}
      >
        Confirmer
      </button>
      <button type="button" className="ghost" onClick={onCancel}>
        Annuler
      </button>
    </div>
  );
}

/** Vue operationnelle Professeur : une ligne par occurrence de seance, tous groupes confondus. */
export function TeacherAllSessionsPage() {
  const { getAccessToken } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [locations, setLocations] = useState<TeachingLocation[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [statusFilter, setStatusFilter] = useState<SessionStatus | ''>('');
  const [monthCursor, setMonthCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedRow, setSelectedRow] = useState<SessionRow | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(() => searchParams.get('create') === '1');
  const [createGroupId, setCreateGroupId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [teachingMode, setTeachingMode] = useState<TeachingMode>('PRESENTIAL');
  const [teachingLocationId, setTeachingLocationId] = useState('');

  function applyGroupDefaults(groupId: string, availableGroups = groups) {
    setCreateGroupId(groupId);
    const group = availableGroups.find((item) => item.id === groupId);
    if (!group) return;
    const firstSchedule = group.schedules[0];
    setTeachingMode(firstSchedule?.teachingMode ?? group.teachingMode);
    setStartTime(firstSchedule?.startTime ?? '18:00');
    setDurationMinutes(String(firstSchedule?.durationMinutes ?? 60));
    setTeachingLocationId(firstSchedule?.teachingLocationId ?? '');
  }

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const myGroups = await groupsApi.listMine(token);
      const [sessionsByGroup, myLocations] = await Promise.all([
        Promise.all(
        myGroups.map(async (group) => ({
          group,
          sessions: await sessionsApi.listSessions(token, group.id),
        })),
        ),
        teacherProfileApi.listLocations(token),
      ]);
      setGroups(myGroups);
      setLocations(myLocations);
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

  useEffect(() => {
    if (createGroupId || groups.length === 0) return;
    applyGroupDefaults(groups[0].id, groups);
  }, [createGroupId, groups]);

  // Accès rapide (tableau de bord) : "?create=1" ouvre directement le formulaire de création.
  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setSearchParams((params) => {
        params.delete('create');
        return params;
      }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateSession(event: FormEvent) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token || !createGroupId || !date || !startTime) return;
    setError(null);
    setNotice(null);
    try {
      await sessionsApi.createSession(token, createGroupId, {
        date,
        startTime,
        durationMinutes: Number(durationMinutes),
        teachingMode,
        teachingLocationId: teachingLocationId || undefined,
      });
      setDate('');
      setNotice('Seance creee.');
      showToast('Seance creee');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de creer cette seance.');
    }
  }

  async function handlePostponeConfirm(newDate: string, newStartTime: string, newDurationMinutes: number) {
    const token = getAccessToken();
    if (!token || !selectedRow) return;
    setError(null);
    setNotice(null);
    try {
      await sessionsApi.postponeSession(token, selectedRow.session.id, {
        date: newDate,
        startTime: newStartTime,
        durationMinutes: newDurationMinutes,
      });
      setIsRescheduling(false);
      setSelectedRow(null);
      setNotice('Seance reportee.');
      showToast('Seance reportee');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Report impossible.');
    }
  }

  async function handleSuspend() {
    const token = getAccessToken();
    if (!token || !selectedRow) return;
    const ok = await confirm({
      title: 'Suspendre cette seance ?',
      message: 'La seance sera annulee et ne sera plus comptabilisee.',
      confirmLabel: 'Suspendre',
      danger: true,
    });
    if (!ok) return;
    setError(null);
    setNotice(null);
    try {
      await sessionsApi.cancelSession(token, selectedRow.session.id);
      setSelectedRow(null);
      showToast('Seance suspendue');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Suspension impossible.');
    }
  }

  function handleToggleCreateForm() {
    setShowCreateForm((visible) => {
      const nextVisible = !visible;
      if (nextVisible) applyGroupDefaults(selectedGroupId || createGroupId || groups[0]?.id || '');
      return nextVisible;
    });
  }

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (selectedGroupId && row.group.id !== selectedGroupId) return false;
      if (statusFilter && row.session.status !== statusFilter) return false;
      return true;
    });
  }, [rows, selectedGroupId, statusFilter]);

  const calendarEvents = useMemo<MonthCalendarEvent[]>(
    () =>
      filteredRows.map(({ session, group }) => ({
        id: session.id,
        date: session.date,
        startTime: session.startTime,
        title: group.name,
        subtitle: `${group.subject.name} - ${group.schoolLevel.name}`,
        tone: STATUS_TONE[session.status],
        onClick: () => {
          setIsRescheduling(false);
          setSelectedRow({ session, group });
        },
      })),
    [filteredRows],
  );

  function handleNavigateMonth(direction: 'prev' | 'next' | 'today') {
    setMonthCursor((cursor) => {
      if (direction === 'today') {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
      }
      const delta = direction === 'next' ? 1 : -1;
      return new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1);
    });
  }

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
          <button
            type="button"
            className="btn-primary"
            onClick={handleToggleCreateForm}
            disabled={groups.length === 0}
          >
            {showCreateForm ? 'Fermer' : 'Creer une seance'}
          </button>
          <button type="button" onClick={() => navigate('/teacher/groups')}>
            Mes groupes
          </button>
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

      {showCreateForm && (
        <section className="card-section">
          <h2>Creer une seance</h2>
          <form onSubmit={handleCreateSession}>
            <div className="field-row">
              <label>
                Groupe
                <Select value={createGroupId} onChange={(e) => applyGroupDefaults(e.target.value)}>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label>
                Date
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
              </label>
              <label>
                Heure de debut
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </label>
              <label>
                Duree (min)
                <input
                  type="number"
                  min={1}
                  required
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                />
              </label>
            </div>
            <div className="field-row">
              <label>
                Mode d'enseignement
                <Select value={teachingMode} onChange={(e) => setTeachingMode(e.target.value as TeachingMode)}>
                  <option value="PRESENTIAL">Presentiel</option>
                  <option value="ONLINE">En ligne</option>
                </Select>
              </label>
              <label>
                Lieu (optionnel)
                <Select value={teachingLocationId} onChange={(e) => setTeachingLocationId(e.target.value)}>
                  <option value="">-</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.label}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
            <button type="submit" disabled={!createGroupId || !date || !startTime}>
              Creer la seance
            </button>
          </form>
        </section>
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

        <div className="section-spacer">
          <MonthCalendar month={monthCursor} events={calendarEvents} onNavigate={handleNavigateMonth} />
        </div>
      </section>

      {selectedRow && (
        <div
          className="terms-modal-backdrop"
          onClick={() => {
            setIsRescheduling(false);
            setSelectedRow(null);
          }}
        >
          <div className="terms-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedRow.group.name}</h2>
            <p className="table-hint">
              {selectedRow.group.subject.name} - {selectedRow.group.schoolLevel.name}
            </p>
            <div className="section-spacer">
              <p>
                {new Date(selectedRow.session.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}{' '}
                a {selectedRow.session.startTime} - {formatDuration(selectedRow.session.durationMinutes)}
              </p>
              <p className="table-hint">
                {MODE_LABELS[selectedRow.session.teachingMode]}{' '}
                <span className={`badge ${STATUS_BADGE[selectedRow.session.status]}`}>
                  {STATUS_LABELS[selectedRow.session.status]}
                </span>
              </p>
            </div>

            <div className="admin-actions action-chips section-spacer">
              {canOpenAttendance(selectedRow.session) ? (
                <Link to={`/teacher/sessions/${selectedRow.session.id}/attendance`}>
                  {attendanceLabel(selectedRow.session.status)}
                </Link>
              ) : (
                <span className="table-hint">{attendanceUnavailableLabel(selectedRow.session)}</span>
              )}
              {canOpenPayments(selectedRow.session) ? (
                <Link to={`/teacher/sessions/${selectedRow.session.id}/payments`}>Saisir les paiements</Link>
              ) : (
                <span className="table-hint">Paiements disponibles apres la seance</span>
              )}
            </div>

            <Link className="ghost-link section-spacer" to={`/teacher/groups/${selectedRow.group.id}/sessions`}>
              Voir toutes les seances du groupe
            </Link>

            {selectedRow.session.status === 'PLANNED' && (
              <>
                <h3>Gestion de la seance</h3>
                {isRescheduling ? (
                  <PostponePrompt
                    initialDate={selectedRow.session.date.slice(0, 10)}
                    initialStartTime={selectedRow.session.startTime}
                    initialDuration={selectedRow.session.durationMinutes}
                    onConfirm={handlePostponeConfirm}
                    onCancel={() => setIsRescheduling(false)}
                  />
                ) : (
                  <div className="field-row">
                    <button type="button" onClick={() => setIsRescheduling(true)}>
                      Decaler / avancer la seance
                    </button>
                    <button type="button" className="danger" onClick={handleSuspend}>
                      Suspendre la seance
                    </button>
                  </div>
                )}
              </>
            )}

            <div className="terms-modal-actions">
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  setIsRescheduling(false);
                  setSelectedRow(null);
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
