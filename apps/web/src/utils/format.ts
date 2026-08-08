export function formatAmount(n: number): string {
  return `${n.toFixed(3)} TND`;
}

export function formatDateTime(date: string, startTime: string): string {
  return `${new Date(date).toLocaleDateString('fr-FR')} à ${startTime}`;
}
