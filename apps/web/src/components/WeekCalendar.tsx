import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { IconChevronLeft, IconChevronRight } from './icons';

export type WeekCalendarTone = 'accent' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';

export interface WeekCalendarEvent {
  id: string;
  /** Date ISO (le préfixe `yyyy-mm-dd` est utilisé, cohérent avec le reste du frontend). */
  date: string;
  startTime: string;
  durationMinutes?: number;
  title: string;
  subtitle?: string;
  tone?: WeekCalendarTone;
  to?: string;
}

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, amount: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return dateKey(a) === dateKey(b);
}

function minutesFromMidnight(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

/** Vue calendrier hebdomadaire façon "semaine" d'Apple Calendar : une colonne par jour, l'heure de
 * chaque séance affichée dans son bloc plutôt que positionnée sur une grille horaire. */
export function WeekCalendar({
  events,
  weekStart,
  onNavigate,
  canGoPrev = true,
  canGoNext = true,
  loading = false,
}: {
  events: WeekCalendarEvent[];
  weekStart: Date;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
  canGoPrev?: boolean;
  canGoNext?: boolean;
  loading?: boolean;
}) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const today = useMemo(() => new Date(), []);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, WeekCalendarEvent[]>();
    for (const day of days) map.set(dateKey(day), []);
    for (const event of events) {
      const key = event.date.slice(0, 10);
      map.get(key)?.push(event);
    }
    for (const list of map.values()) {
      list.sort((a, b) => minutesFromMidnight(a.startTime) - minutesFromMidnight(b.startTime));
    }
    return map;
  }, [days, events]);

  const rangeLabel = `${days[0].toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} – ${days[6].toLocaleDateString(
    'fr-FR',
    { day: '2-digit', month: 'short', year: 'numeric' },
  )}`;

  return (
    <div className="week-calendar">
      <div className="week-calendar-toolbar">
        <div className="week-calendar-nav">
          <button
            type="button"
            className="ghost"
            onClick={() => onNavigate('prev')}
            disabled={!canGoPrev}
            aria-label="Semaine précédente"
          >
            <IconChevronLeft aria-hidden="true" />
          </button>
          <button type="button" className="ghost" onClick={() => onNavigate('today')}>
            Aujourd'hui
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => onNavigate('next')}
            disabled={!canGoNext}
            aria-label="Semaine suivante"
          >
            <IconChevronRight aria-hidden="true" />
          </button>
        </div>
        <p className="week-calendar-range">{rangeLabel}</p>
      </div>

      <div className="week-calendar-grid">
        {days.map((day, i) => {
          const dayEvents = eventsByDay.get(dateKey(day)) ?? [];
          const isToday = isSameDay(day, today);
          return (
            <div key={dateKey(day)} className={`week-calendar-day-col${isToday ? ' is-today' : ''}`}>
              <div className="week-calendar-day-header">
                <span className="week-calendar-day-label">{DAY_LABELS[i]}</span>
                <span className="week-calendar-day-number">{day.getDate()}</span>
              </div>
              <div className="week-calendar-day-events">
                {dayEvents.length === 0 ? (
                  <span className="week-calendar-day-empty">—</span>
                ) : (
                  dayEvents.map((event) => {
                    const className = `week-calendar-event tone-${event.tone ?? 'accent'}`;
                    const content = (
                      <>
                        <span className="week-calendar-event-time">{event.startTime}</span>
                        <span className="week-calendar-event-title">{event.title}</span>
                        {event.subtitle && <span className="week-calendar-event-subtitle">{event.subtitle}</span>}
                      </>
                    );
                    return event.to ? (
                      <Link key={event.id} to={event.to} className={className}>
                        {content}
                      </Link>
                    ) : (
                      <div key={event.id} className={className}>
                        {content}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {loading && <p className="table-hint section-spacer">Chargement des séances...</p>}
      {!loading && events.length === 0 && <p className="table-hint section-spacer">Aucune séance cette semaine.</p>}
    </div>
  );
}
