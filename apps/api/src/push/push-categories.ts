/**
 * Regroupe le catalogue interne de types `Activity` (libre, ~30 codes — voir le commentaire du
 * modèle `Activity`) en 6 catégories visibles par l'utilisateur dans ses réglages de notifications
 * push. Une catégorie absente de `NotificationPreference` pour un utilisateur = activée par défaut
 * (voir `DEFAULT_LEAD_MINUTES` pour le seul cas où un réglage numérique existe).
 *
 * `SESSION_REMINDER` est un cas particulier : elle ne route jamais de push depuis
 * `MessagingService.notify()` (elle est explicitement exclue, voir ce fichier) — son push est géré
 * par le job temporel dédié `TemporalJobsService.sendConfigurablePushReminders`, qui respecte le
 * délai choisi par l'utilisateur plutôt que le 24h fixe de l'Activity in-app existante.
 */
export type PushCategory =
  | 'SESSION_REMINDER'
  | 'GROUP_ANNOUNCEMENT'
  | 'STUDENT_ASSIGNED'
  | 'STUDENT_ABSENT'
  | 'SESSION_BILLED'
  | 'PAYMENT_REMINDER';

export const PUSH_CATEGORIES: readonly PushCategory[] = [
  'SESSION_REMINDER',
  'GROUP_ANNOUNCEMENT',
  'STUDENT_ASSIGNED',
  'STUDENT_ABSENT',
  'SESSION_BILLED',
  'PAYMENT_REMINDER',
];

export const PUSH_CATEGORY_LABELS: Record<PushCategory, string> = {
  SESSION_REMINDER: 'Rappel de séance',
  GROUP_ANNOUNCEMENT: 'Annonce de groupe',
  STUDENT_ASSIGNED: 'Élève affecté à un groupe',
  STUDENT_ABSENT: 'Élève absent',
  SESSION_BILLED: 'Séance facturée',
  PAYMENT_REMINDER: 'Rappel de paiement',
};

/** `Activity.type` -> catégorie push. Types absents de cette table ne déclenchent jamais de push. */
const TYPE_TO_CATEGORY: Record<string, PushCategory> = {
  COM_ANNOUNCEMENT_CREATED: 'GROUP_ANNOUNCEMENT',
  COM_ANNOUNCEMENT_UPDATED: 'GROUP_ANNOUNCEMENT',
  AFF_ASSIGNED: 'STUDENT_ASSIGNED',
  ATT_ABSENT: 'STUDENT_ABSENT',
  CPT_SESSION_BILLED: 'SESSION_BILLED',
  CPT_PAYMENT_REMINDER: 'PAYMENT_REMINDER',
};

export function categoryForActivityType(type: string): PushCategory | null {
  return TYPE_TO_CATEGORY[type] ?? null;
}

/** Options de délai proposées pour SESSION_REMINDER, en minutes. */
export const LEAD_MINUTES_OPTIONS = [60, 180, 360, 720, 1440, 2880] as const;
export const DEFAULT_LEAD_MINUTES = 1440;
