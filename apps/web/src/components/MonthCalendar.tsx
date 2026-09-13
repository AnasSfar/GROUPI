import { useMemo, useState } from 'react';
import { IconChevronLeft, IconChevronRight } from './icons';
import { addDays, dateKey, type WeekCalendarTone } from './WeekCalendar';

export interface MonthCalendarEvent {
  id: string;
  /** Date ISO (le préfixe `yyyy-mm-dd` est utilisé). */
  date: string;
  startTime: string;
  title: string;
  subtitle?: string;
  tone?: WeekCalendarTone;
  onClick?: () => void;
}

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MAX_VISIBLE_PER_DAY = 3;

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Premier jour (un lundi) de la grille — inclut les jours du mois précédent nécessaires pour
 * compléter la première semaine, comme tout calendrier mensuel classique. */
function startOfCalendarGrid(monthDate: Date): Date {
  const first = startOfMonth(monthDate);
  const mondayOffset = (first.getDay() + 6) % 7;
  return addDays(first, -mondayOffset);
}

function minutesFromMidnight(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

function isSameDay(a: Date, b: Date): boolean {
  return dateKey(a) === dateKey(b);
}

/** Vue calendrier mensuelle : une cellule par jour, les séances triées par heure à l'intérieur.
 * Au-delà de {@link MAX_VISIBLE_PER_DAY} séances un jour donné, un lien "+N" déplie la cellule. */
export function MonthCalendar({
  month,
  events,
  onNavigate,
}: {
  month: Date;
  events: MonthCalendarEvent[];
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
}) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const today = useMemo(() => new Date(), []);

  const gridStart = useMemo(() => startOfCalendarGrid(month), [month]);
  const monthIndex = month.getMonth();

  const weeksNeeded = useMemo(() => {
    const lastOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const daysFromGridStart = Math.round((lastOfMonth.getTime() - gridStart.getTime()) / 86_400_000) + 1;
    return Math.ceil(daysFromGridStart / 7);
  }, [gridStart, month]);

  const days = useMemo(
    () => Array.from({ length: weeksNeeded * 7 }, (_, i) => addDays(gridStart, i)),
    [gridStart, weeksNeeded],
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, MonthCalendarEvent[]>();
    for (const event of events) {
      const key = event.date.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => minutesFromMidnight(a.startTime) - minutesFromMidnight(b.startTime));
    }
    return map;
  }, [events]);

  const monthLabel = month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  function toggleExpanded(key: string) {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="month-calendar">
      <div className="month-calendar-toolbar">
        <div className="month-calendar-nav">
          <button type="button" className="ghost" onClick={() => onNavigate('prev')} aria-label="Mois précédent">
            <IconChevronLeft aria-hidden="true" />
          </button>
          <button type="button" className="ghost" onClick={() => onNavigate('today')}>
            Aujourd'hui
          </button>
          <button type="button" className="ghost" onClick={() => onNavigate('next')} aria-label="Mois suivant">
            <IconChevronRight aria-hidden="true" />
          </button>
        </div>
        <p className="month-calendar-label">{monthLabel}</p>
      </div>

      <div className="month-calendar-weekdays">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="month-calendar-weekday">
            {label}
          </span>
        ))}
      </div>

      <div className="month-calendar-grid" style={{ gridTemplateRows: `repeat(${weeksNeeded}, 1fr)` }}>
        {days.map((day) => {
          const key = dateKey(day);
          const dayEvents = eventsByDay.get(key) ?? [];
          const isOutside = day.getMonth() !== monthIndex;
          const isToday = isSameDay(day, today);
          const expanded = expandedDays.has(key);
          const visibleEvents = expanded ? dayEvents : dayEvents.slice(0, MAX_VISIBLE_PER_DAY);
          const hiddenCount = dayEvents.length - visibleEvents.length;

          return (
            <div
              key={key}
              className={`month-calendar-day${isOutside ? ' is-outside' : ''}${isToday ? ' is-today' : ''}`}
            >
              <span className="month-calendar-day-number">{day.getDate()}</span>
              <div className="month-calendar-day-events">
                {visibleEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    className={`month-calendar-event tone-${event.tone ?? 'accent'}`}
                    onClick={event.onClick}
                    title={`${event.startTime} · ${event.title}${event.subtitle ? ` · ${event.subtitle}` : ''}`}
                  >
                    <span className="month-calendar-event-time">{event.startTime}</span>
                    <span className="month-calendar-event-title">{event.title}</span>
                  </button>
                ))}
                {hiddenCount > 0 && (
                  <button type="button" className="month-calendar-day-more" onClick={() => toggleExpanded(key)}>
                    +{hiddenCount} de plus
                  </button>
                )}
                {expanded && dayEvents.length > MAX_VISIBLE_PER_DAY && (
                  <button type="button" className="month-calendar-day-more" onClick={() => toggleExpanded(key)}>
                    Réduire
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
