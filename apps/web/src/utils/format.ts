export function formatAmount(n: number): string {
  return `${n.toFixed(3)} TND`;
}

export function formatDateTime(date: string, startTime: string): string {
  return `${new Date(date).toLocaleDateString('fr-FR')} à ${startTime}`;
}

/** Même calcul que `theoreticalStart` côté API (ERR-ATT-004) : l'appel ne s'ouvre qu'une fois la
 *  séance réellement commencée, pas seulement le jour J. */
export function hasSessionStarted(date: string, startTime: string): boolean {
  const [hours, minutes] = startTime.split(':').map(Number);
  const start = new Date(date);
  start.setUTCHours(hours, minutes, 0, 0);
  return start.getTime() <= Date.now();
}
