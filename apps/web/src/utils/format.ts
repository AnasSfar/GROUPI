export function formatAmount(n: number): string {
  return `${n.toFixed(3)} TND`;
}

export function formatDateTime(date: string, startTime: string): string {
  return `${new Date(date).toLocaleDateString('fr-FR')} à ${startTime}`;
}

/**
 * `startTime` est saisie et affichée comme heure murale française : on l'ancre explicitement sur
 * Europe/Paris (plutôt que sur UTC ou le fuseau du navigateur) pour rester correct été comme hiver.
 */
const SESSION_TIME_ZONE = 'Europe/Paris';

const zonedPartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: SESSION_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** Convertit une heure murale (`hours:minutes`) du jour `date` (ISO, ex. "2026-08-09") en instant UTC. */
function zonedWallTimeToUtc(date: string, hours: number, minutes: number): Date {
  const day = new Date(date);
  const utcGuess = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hours, minutes, 0, 0));
  const parts: Record<string, string> = {};
  for (const part of zonedPartsFormatter.formatToParts(utcGuess)) {
    if (part.type !== 'literal') parts[part.type] = part.value;
  }
  const asIfUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  const offsetMs = asIfUtc - utcGuess.getTime();
  return new Date(utcGuess.getTime() - offsetMs);
}

/** Instant UTC du début théorique d'une séance (heure de Paris) — même calcul que `theoreticalStart` côté API. */
export function sessionStartTimestamp(date: string, startTime: string): number {
  const [hours, minutes] = startTime.split(':').map(Number);
  return zonedWallTimeToUtc(date, hours, minutes).getTime();
}

/** Même calcul que `theoreticalStart` côté API (ERR-ATT-004) : l'appel ne s'ouvre qu'une fois la
 *  séance réellement commencée (heure de Paris), pas seulement le jour J. */
export function hasSessionStarted(date: string, startTime: string): boolean {
  return sessionStartTimestamp(date, startTime) <= Date.now();
}

const ATTENDANCE_REMINDER_DELAY_MS = 24 * 60 * 60 * 1000;

/**
 * NOT-ATT-009 (« Rappel : présences non saisies (J+1) ») : une séance PLANIFIEE reste sans appel
 * saisi plus de 24h après sa fin théorique. Sert à mettre en avant la séance dans le calendrier ;
 * l'envoi effectif de la notification au Professeur n'est pas encore câblé côté backend.
 */
export function isAttendanceOverdue(session: {
  status: string;
  date: string;
  startTime: string;
  durationMinutes: number;
}): boolean {
  if (session.status !== 'PLANNED') return false;
  const [hours, minutes] = session.startTime.split(':').map(Number);
  const end = zonedWallTimeToUtc(session.date, hours, minutes + session.durationMinutes);
  return Date.now() - end.getTime() >= ATTENDANCE_REMINDER_DELAY_MS;
}
