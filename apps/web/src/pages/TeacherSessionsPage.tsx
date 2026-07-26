import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as groupsApi from '../api/groupsApi';
import * as sessionsApi from '../api/sessionsApi';
import * as teacherProfileApi from '../api/teacherProfileApi';
import type { Group, TeachingMode } from '../api/groupsApi';
import type { Session, SessionStatus } from '../api/sessionsApi';
import type { TeachingLocation } from '../api/teacherProfileApi';

const STATUS_LABELS: Record<SessionStatus, string> = {
  PLANNED: 'Planifiée',
  POSTPONED: 'Reportée',
  CANCELLED: 'Annulée',
  COMPLETED: 'Terminée',
  LOCKED: 'Verrouillée',
};

const STATUS_BADGE: Record<SessionStatus, string> = {
  PLANNED: 'badge-info',
  POSTPONED: 'badge-warning',
  CANCELLED: 'badge-danger',
  COMPLETED: 'badge-success',
  LOCKED: 'badge-neutral',
};

const MODE_LABELS: Record<TeachingMode, string> = {
  PRESENTIAL: 'Présentiel',
  ONLINE: 'En ligne',
};

/** Ch.13.3/13.8 : petit formulaire inline pour saisir la nouvelle date/heure d'un report. */
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
        Reporter
      </button>
      <button type="button" className="ghost" onClick={onCancel}>
        Annuler
      </button>
    </div>
  );
}

export function TeacherSessionsPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { getAccessToken } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [locations, setLocations] = useState<TeachingLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<SessionStatus | ''>('');
  const [postponeTargetId, setPostponeTargetId] = useState<string | null>(null);

  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [teachingMode, setTeachingMode] = useState<TeachingMode>('PRESENTIAL');
  const [teachingLocationId, setTeachingLocationId] = useState('');

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token || !groupId) return;
    setLoading(true);
    setError(null);
    try {
      const [groups, mySessions, myLocations] = await Promise.all([
        groupsApi.listMine(token),
        sessionsApi.listSessions(token, groupId, statusFilter ? { status: statusFilter } : {}),
        teacherProfileApi.listLocations(token),
      ]);
      setGroup(groups.find((g) => g.id === groupId) ?? null);
      setSessions(mySessions);
      setLocations(myLocations);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les séances.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, groupId, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleGenerate() {
    const token = getAccessToken();
    if (!token || !groupId) return;
    setError(null);
    setNotice(null);
    try {
      const result = await sessionsApi.generateSessions(token, groupId);
      setNotice(
        result.count > 0
          ? `${result.count} séance(s) générée(s).`
          : 'Aucune nouvelle séance à générer (déjà à jour).',
      );
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Génération impossible.');
    }
  }

  async function handleCreateExceptional(event: FormEvent) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token || !groupId || !date || !startTime) return;
    setError(null);
    setNotice(null);
    try {
      await sessionsApi.createSession(token, groupId, {
        date,
        startTime,
        durationMinutes: Number(durationMinutes),
        teachingMode,
        teachingLocationId: teachingLocationId || undefined,
      });
      setNotice('Séance exceptionnelle créée.');
      setDate('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de créer cette séance.');
    }
  }

  async function handlePostponeConfirm(
    sessionId: string,
    newDate: string,
    newStartTime: string,
    newDurationMinutes: number,
  ) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    setNotice(null);
    setPostponeTargetId(null);
    try {
      await sessionsApi.postponeSession(token, sessionId, {
        date: newDate,
        startTime: newStartTime,
        durationMinutes: newDurationMinutes,
      });
      setNotice('Séance reportée.');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Report impossible.');
    }
  }

  async function handleCancel(sessionId: string) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    setNotice(null);
    try {
      await sessionsApi.cancelSession(token, sessionId);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Annulation impossible.');
    }
  }

  async function handleDelete(sessionId: string) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    setNotice(null);
    try {
      await sessionsApi.removeSession(token, sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Suppression impossible.');
    }
  }

  if (loading) {
    return <p>Chargement...</p>;
  }

  if (!group) {
    return <p className="form-error">{error ?? 'Groupe introuvable.'}</p>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Séances — {group.name}</h1>
          <p>Génération, séances exceptionnelles, report et annulation des séances du groupe.</p>
        </div>
        <div className="page-actions">
          <Link to="/teacher/groups">← Retour à mes groupes</Link>
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
        <h2>Séances ({sessions.length})</h2>
        <div className="field-row">
          <button type="button" onClick={handleGenerate}>
            Générer les séances
          </button>
          <label>
            Filtrer par statut
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SessionStatus | '')}
            >
              <option value="">Tous</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {sessions.length === 0 && <p>Aucune séance pour le moment.</p>}
        {sessions.length > 0 && (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Heure</th>
                  <th>Durée</th>
                  <th>Mode</th>
                  <th>Lieu</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td>{new Date(session.date).toLocaleDateString('fr-FR')}</td>
                    <td>{session.startTime}</td>
                    <td>{session.durationMinutes} min</td>
                    <td>{MODE_LABELS[session.teachingMode]}</td>
                    <td>{session.teachingLocation?.label ?? '—'}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[session.status]}`}>
                        {STATUS_LABELS[session.status]}
                      </span>
                    </td>
                    <td className="admin-actions">
                      {postponeTargetId === session.id ? (
                        <PostponePrompt
                          initialDate={session.date.slice(0, 10)}
                          initialStartTime={session.startTime}
                          initialDuration={session.durationMinutes}
                          onConfirm={(d, t, dur) => handlePostponeConfirm(session.id, d, t, dur)}
                          onCancel={() => setPostponeTargetId(null)}
                        />
                      ) : (
                        session.status === 'PLANNED' && (
                          <>
                            <button type="button" onClick={() => setPostponeTargetId(session.id)}>
                              Reporter
                            </button>
                            <button type="button" onClick={() => handleCancel(session.id)}>
                              Annuler
                            </button>
                            <button
                              type="button"
                              className="danger"
                              onClick={() => handleDelete(session.id)}
                            >
                              Supprimer
                            </button>
                          </>
                        )
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
        <h2>Ajouter une séance exceptionnelle</h2>
        <form onSubmit={handleCreateExceptional}>
          <div className="field-row">
            <label>
              Date
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label>
              Heure de début
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </label>
            <label>
              Durée (min)
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
              <select
                value={teachingMode}
                onChange={(e) => setTeachingMode(e.target.value as TeachingMode)}
              >
                <option value="PRESENTIAL">Présentiel</option>
                <option value="ONLINE">En ligne</option>
              </select>
            </label>
            <label>
              Lieu (optionnel)
              <select value={teachingLocationId} onChange={(e) => setTeachingLocationId(e.target.value)}>
                <option value="">—</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="submit" disabled={!date || !startTime}>
            Créer la séance
          </button>
        </form>
      </section>
    </>
  );
}
