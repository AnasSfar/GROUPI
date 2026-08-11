import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Select } from '../components/Select';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { ApiError } from '../api/client';
import * as groupsApi from '../api/groupsApi';
import { formatDuration } from '../api/groupsApi';
import * as sessionsApi from '../api/sessionsApi';
import * as teacherProfileApi from '../api/teacherProfileApi';
import { hasSessionStarted } from '../utils/format';
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
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [group, setGroup] = useState<Group | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [locations, setLocations] = useState<TeachingLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<SessionStatus | ''>('');
  const [postponeTargetId, setPostponeTargetId] = useState<string | null>(null);
  const [modeTargetId, setModeTargetId] = useState<string | null>(null);
  const [commentTargetId, setCommentTargetId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');

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
      if (result.count > 0) showToast('Séances générées');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Génération impossible.');
    }
  }

  async function handleGenerateNext() {
    const token = getAccessToken();
    if (!token || !groupId) return;
    setError(null);
    setNotice(null);
    try {
      const result = await sessionsApi.generateNextSession(token, groupId);
      setNotice(
        result.count > 0
          ? 'Prochaine séance générée.'
          : 'Aucune nouvelle séance à générer (déjà à jour).',
      );
      if (result.count > 0) showToast('Prochaine séance générée');
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
      showToast('Séance exceptionnelle créée');
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
      showToast('Séance reportée');
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
      showToast('Séance annulée');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Annulation impossible.');
    }
  }

  /** Ch.13.6 : passage exceptionnel du mode d'enseignement d'une séance précise. */
  async function handleSetTeachingMode(sessionId: string, newMode: TeachingMode) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    setNotice(null);
    setModeTargetId(null);
    try {
      await sessionsApi.setSessionTeachingMode(token, sessionId, newMode);
      showToast('Mode d’enseignement modifié pour cette séance');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Changement de mode impossible.');
    }
  }

  function startCommentEdit(session: Session) {
    setCommentTargetId(session.id);
    setCommentDraft(session.teacherComment ?? '');
  }

  /** RM-SES-041 : commentaire pédagogique de la séance. */
  async function handleSaveComment(sessionId: string) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    setNotice(null);
    try {
      await sessionsApi.setSessionComment(token, sessionId, commentDraft);
      setCommentTargetId(null);
      showToast('Commentaire enregistré');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement du commentaire impossible.');
    }
  }

  async function handleDelete(sessionId: string) {
    const token = getAccessToken();
    if (!token) return;
    const ok = await confirm({
      title: 'Supprimer cette séance ?',
      message: 'Cette action est irréversible.',
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    setError(null);
    setNotice(null);
    try {
      await sessionsApi.removeSession(token, sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      showToast('Séance supprimée');
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
          <Link to={`/teacher/groups/${groupId}/attendance`}>Statistiques de présence</Link>
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
          <button type="button" onClick={handleGenerateNext}>
            Générer la prochaine séance
          </button>
        </div>
        <div className="filters-row">
          <label>
            Filtrer par statut
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SessionStatus | '')}
            >
              <option value="">Tous</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
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
                  <th>Commentaire</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
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
                    <td data-label="Durée">{formatDuration(session.durationMinutes)}</td>
                    <td data-label="Mode">
                      {MODE_LABELS[session.teachingMode]}
                      {session.teachingModeException && (
                        <span className="badge badge-warning" title="Mode exceptionnel pour cette séance">
                          {' '}
                          exceptionnel
                        </span>
                      )}
                    </td>
                    <td data-label="Lieu">{session.teachingLocation?.label ?? '—'}</td>
                    <td data-label="Statut">
                      <span className={`badge ${STATUS_BADGE[session.status]}`}>
                        {STATUS_LABELS[session.status]}
                      </span>
                    </td>
                    <td data-label="Commentaire">
                      {commentTargetId === session.id ? (
                        <div className="reason-prompt">
                          <textarea
                            value={commentDraft}
                            onChange={(e) => setCommentDraft(e.target.value)}
                            rows={2}
                            autoFocus
                          />
                          <button type="button" onClick={() => handleSaveComment(session.id)}>
                            Enregistrer
                          </button>
                          <button type="button" className="ghost" onClick={() => setCommentTargetId(null)}>
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <>
                          <span>{session.teacherComment || '—'}</span>{' '}
                          {session.status !== 'LOCKED' && (
                            <button type="button" className="ghost" onClick={() => startCommentEdit(session)}>
                              {session.teacherComment ? 'Modifier' : 'Ajouter'}
                            </button>
                          )}
                        </>
                      )}
                    </td>
                    <td className="admin-actions">
                      {(session.status === 'COMPLETED' ||
                        session.status === 'LOCKED' ||
                        (session.status === 'PLANNED' && hasSessionStarted(session.date, session.startTime))) && (
                        <Link to={`/teacher/sessions/${session.id}/attendance`}>Présences</Link>
                      )}
                      {(session.status === 'COMPLETED' || session.status === 'LOCKED') && (
                        <Link to={`/teacher/sessions/${session.id}/payments`}>Paiements</Link>
                      )}
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
                            {modeTargetId === session.id ? (
                              <>
                                {(['PRESENTIAL', 'ONLINE'] as TeachingMode[])
                                  .filter((m) => m !== session.teachingMode)
                                  .map((m) => (
                                    <button
                                      key={m}
                                      type="button"
                                      onClick={() => handleSetTeachingMode(session.id, m)}
                                    >
                                      Confirmer {MODE_LABELS[m]}
                                    </button>
                                  ))}
                                <button type="button" className="ghost" onClick={() => setModeTargetId(null)}>
                                  Fermer
                                </button>
                              </>
                            ) : (
                              <button type="button" onClick={() => setModeTargetId(session.id)}>
                                Changer le mode
                              </button>
                            )}
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
              <Select
                value={teachingMode}
                onChange={(e) => setTeachingMode(e.target.value as TeachingMode)}
              >
                <option value="PRESENTIAL">Présentiel</option>
                <option value="ONLINE">En ligne</option>
              </Select>
            </label>
            <label>
              Lieu (optionnel)
              <Select value={teachingLocationId} onChange={(e) => setTeachingLocationId(e.target.value)}>
                <option value="">—</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.label}
                  </option>
                ))}
              </Select>
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
