import { apiRequest } from './client';

export type PushCategory =
  | 'SESSION_REMINDER'
  | 'GROUP_ANNOUNCEMENT'
  | 'STUDENT_ASSIGNED'
  | 'STUDENT_ABSENT'
  | 'SESSION_BILLED'
  | 'PAYMENT_REMINDER';

export interface NotificationPreference {
  category: PushCategory;
  enabled: boolean;
  /** Uniquement présent pour SESSION_REMINDER — délai en minutes avant le début de la séance. */
  leadMinutes?: number;
}

export function getMine(accessToken: string): Promise<NotificationPreference[]> {
  return apiRequest<NotificationPreference[]>('/notification-preferences/me', { accessToken });
}

export function updateMine(
  accessToken: string,
  preferences: NotificationPreference[],
): Promise<NotificationPreference[]> {
  return apiRequest<NotificationPreference[]>('/notification-preferences/me', {
    method: 'PATCH',
    accessToken,
    body: { preferences },
  });
}
