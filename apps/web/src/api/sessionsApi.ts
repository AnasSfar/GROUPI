import { apiRequest } from './client';
import type { TeachingMode } from './groupsApi';
import type { TeachingLocation } from './teacherProfileApi';

export type SessionStatus = 'PLANNED' | 'POSTPONED' | 'CANCELLED' | 'COMPLETED' | 'LOCKED';

export interface Session {
  id: string;
  groupId: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  teachingMode: TeachingMode;
  teachingLocationId: string | null;
  teachingLocation: TeachingLocation | null;
  status: SessionStatus;
  lockedAt: string | null;
  /** Ch.13.7/13.9 : date à partir de laquelle une séance TERMINEE devient définitivement
   *  VERROUILLEE — `null` tant que la séance n'est pas TERMINEE/VERROUILLEE. */
  lockDeadline: string | null;
  createdAt: string;
}

export interface GenerateSessionsResult {
  count: number;
  sessions: Session[];
}

export interface CreateSessionPayload {
  date: string;
  startTime: string;
  durationMinutes: number;
  teachingMode: TeachingMode;
  teachingLocationId?: string;
}

export interface PostponeSessionPayload {
  date: string;
  startTime: string;
  durationMinutes?: number;
}

export interface ListSessionsFilters {
  status?: SessionStatus;
  from?: string;
  to?: string;
}

export function listSessions(
  accessToken: string,
  groupId: string,
  filters: ListSessionsFilters = {},
): Promise<Session[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  const query = params.toString();
  return apiRequest<Session[]>(`/groups/${groupId}/sessions${query ? `?${query}` : ''}`, {
    accessToken,
  });
}

export function generateSessions(accessToken: string, groupId: string): Promise<GenerateSessionsResult> {
  return apiRequest<GenerateSessionsResult>(`/groups/${groupId}/sessions/generate`, {
    method: 'POST',
    accessToken,
  });
}

export function generateNextSession(accessToken: string, groupId: string): Promise<GenerateSessionsResult> {
  return apiRequest<GenerateSessionsResult>(`/groups/${groupId}/sessions/generate-next`, {
    method: 'POST',
    accessToken,
  });
}

export function createSession(
  accessToken: string,
  groupId: string,
  payload: CreateSessionPayload,
): Promise<Session> {
  return apiRequest<Session>(`/groups/${groupId}/sessions`, {
    method: 'POST',
    accessToken,
    body: payload,
  });
}

export function postponeSession(
  accessToken: string,
  sessionId: string,
  payload: PostponeSessionPayload,
): Promise<Session> {
  return apiRequest<Session>(`/sessions/${sessionId}/postpone`, {
    method: 'POST',
    accessToken,
    body: payload,
  });
}

export function cancelSession(accessToken: string, sessionId: string): Promise<Session> {
  return apiRequest<Session>(`/sessions/${sessionId}/cancel`, { method: 'POST', accessToken });
}

export function removeSession(
  accessToken: string,
  sessionId: string,
): Promise<{ id: string; deleted: boolean }> {
  return apiRequest(`/sessions/${sessionId}`, { method: 'DELETE', accessToken });
}
