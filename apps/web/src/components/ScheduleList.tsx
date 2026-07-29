import { DAY_LABELS, formatDuration } from '../api/groupsApi';
import type { DayOfWeek } from '../api/groupsApi';

interface ScheduleListProps {
  schedules: { dayOfWeek: DayOfWeek; startTime: string; durationMinutes: number }[];
}

/**
 * Un créneau par ligne (plutôt qu'une seule chaîne concaténée) : rend explicite que plusieurs
 * horaires pour un même groupe sont des séances récurrentes de la même inscription, pas des
 * inscriptions distinctes.
 */
export function ScheduleList({ schedules }: ScheduleListProps) {
  if (schedules.length === 0) return <>—</>;
  return (
    <div className="schedule-list">
      {schedules.map((s, index) => (
        <div key={index}>
          {DAY_LABELS[s.dayOfWeek]} {s.startTime} ({formatDuration(s.durationMinutes)})
        </div>
      ))}
    </div>
  );
}
