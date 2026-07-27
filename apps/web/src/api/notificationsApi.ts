import { apiRequest } from './client';

export type ActivityPriority = 'INFORMATION' | 'IMPORTANT' | 'CRITICAL';

export interface Activity {
  id: string;
  type: string;
  priority: ActivityPriority;
  title: string;
  body: string | null;
  refType: string | null;
  refId: string | null;
  readAt: string | null;
  archivedAt: string | null;
  emailSentAt: string | null;
  createdAt: string;
}

/** Ch.18.3 : centre d'activités personnel — toujours filtré par l'utilisateur du JWT côté API. */
export function listMine(accessToken: string, filter?: 'all' | 'unread'): Promise<Activity[]> {
  const query = filter ? `?filter=${filter}` : '';
  return apiRequest<Activity[]>(`/notifications/me${query}`, { accessToken });
}

export function getUnreadCount(accessToken: string): Promise<{ count: number }> {
  return apiRequest<{ count: number }>('/notifications/me/unread-count', { accessToken });
}

export function markRead(accessToken: string, id: string): Promise<Activity> {
  return apiRequest<Activity>(`/notifications/${id}/read`, { method: 'POST', accessToken });
}

export function markAllRead(accessToken: string): Promise<{ count: number }> {
  return apiRequest<{ count: number }>('/notifications/me/read-all', { method: 'POST', accessToken });
}
