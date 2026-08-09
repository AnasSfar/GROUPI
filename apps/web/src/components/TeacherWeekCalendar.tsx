import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as groupsApi from '../api/groupsApi';
import * as sessionsApi from '../api/sessionsApi';
import type { Group } from '../api/groupsApi';
import type { SessionStatus } from '../api/sessionsApi';
import { WeekCalendar, addDays, dateKey, startOfWeek, type WeekCalendarEvent, type WeekCalendarTone } from './WeekCalendar';

const STATUS_TONE: Record<SessionStatus, WeekCalendarTone> = {
  PLANNED: 'accent',
  POSTPONED: 'warning',
  CANCELLED: 'danger',
  COMPLETED: 'success',
  LOCKED: 'neutral',
};

/** Ch.13 : calendrier hebdomadaire des séances toutes groupes confondus, pour le tableau de bord Professeur. */
export function TeacherWeekCalendar() {
  const { getAccessToken } = useAuth();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [events, setEvents] = useState<WeekCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    groupsApi
      .listMine(token)
      .then(setGroups)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Impossible de charger les groupes.'));
  }, [getAccessToken]);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token || !groups) return;
    if (groups.length === 0) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const from = dateKey(weekStart);
      const to = dateKey(addDays(weekStart, 6));
      const perGroup = await Promise.all(
        groups.map((group) => sessionsApi.listSessions(token, group.id, { from, to })),
      );
      setEvents(
        perGroup.flatMap((sessions, i) =>
          sessions.map((s) => ({
            id: s.id,
            date: s.date,
            startTime: s.startTime,
            durationMinutes: s.durationMinutes,
            title: groups[i].name,
            subtitle: `${groups[i].subject.name} · ${groups[i].schoolLevel.name}`,
            tone: STATUS_TONE[s.status],
            to: `/teacher/groups/${groups[i].id}/sessions`,
          })),
        ),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les séances.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, groups, weekStart]);

  useEffect(() => {
    load();
  }, [load]);

  function handleNavigate(direction: 'prev' | 'next' | 'today') {
    if (direction === 'today') {
      setWeekStart(startOfWeek(new Date()));
    } else {
      setWeekStart((w) => addDays(w, direction === 'next' ? 7 : -7));
    }
  }

  return (
    <section className="card-section">
      <h2>Calendrier de la semaine</h2>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <WeekCalendar events={events} weekStart={weekStart} onNavigate={handleNavigate} loading={loading} />
    </section>
  );
}
