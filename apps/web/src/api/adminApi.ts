import { apiRequest } from './client';

export type UserStatus = 'PENDING_VALIDATION' | 'ACTIVE' | 'SUSPENDED' | 'DISABLED' | 'ARCHIVED';

export interface AdminUser {
  id: string;
  email: string;
  status: UserStatus;
  roles: string[];
  createdAt: string;
  teacherProfile: { firstName: string; lastName: string } | null;
  parentProfile: { firstName: string; lastName: string } | null;
}

export interface AccountActionPayload {
  reason: string;
  comment?: string;
}

export function listUsers(accessToken: string, status?: UserStatus): Promise<AdminUser[]> {
  const query = status ? `?status=${status}` : '';
  return apiRequest<AdminUser[]>(`/admin/users${query}`, { accessToken });
}

export function validateUser(accessToken: string, userId: string) {
  return apiRequest(`/admin/users/${userId}/validate`, { method: 'POST', accessToken });
}

export function suspendUser(accessToken: string, userId: string, payload: AccountActionPayload) {
  return apiRequest(`/admin/users/${userId}/suspend`, {
    method: 'POST',
    accessToken,
    body: payload,
  });
}

export function reactivateUser(accessToken: string, userId: string, comment?: string) {
  return apiRequest(`/admin/users/${userId}/reactivate`, {
    method: 'POST',
    accessToken,
    body: comment ? { comment } : {},
  });
}

export function disableUser(accessToken: string, userId: string, payload: AccountActionPayload) {
  return apiRequest(`/admin/users/${userId}/disable`, {
    method: 'POST',
    accessToken,
    body: payload,
  });
}
