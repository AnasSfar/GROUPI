import { apiRequest } from './client';

export type AnnouncementEffectiveStatus = 'SCHEDULED' | 'PUBLISHED' | 'EXPIRED' | 'DELETED';

export interface GroupAnnouncement {
  id: string;
  groupId: string;
  createdById: string;
  title: string;
  body: string;
  publishAt: string;
  expiresAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  effectiveStatus: AnnouncementEffectiveStatus;
}

export interface TeacherGroupAnnouncement extends GroupAnnouncement {
  readCount: number;
  totalParents: number;
  unreadParents: string[];
}

export interface CreateAnnouncementPayload {
  title: string;
  body: string;
  scheduled?: boolean;
  publishAt?: string;
  expiresAt?: string;
}

export interface UpdateAnnouncementPayload {
  title?: string;
  body?: string;
  expiresAt?: string | null;
}

/** Ch.19.4 : même route, comportement différent selon le rôle (Professeur = stats, Parent = feed publié). */
export function listForGroup(accessToken: string, groupId: string): Promise<GroupAnnouncement[]> {
  return apiRequest<GroupAnnouncement[]>(`/groups/${groupId}/announcements`, { accessToken });
}

export function createAnnouncement(
  accessToken: string,
  groupId: string,
  payload: CreateAnnouncementPayload,
): Promise<TeacherGroupAnnouncement> {
  return apiRequest<TeacherGroupAnnouncement>(`/groups/${groupId}/announcements`, {
    method: 'POST',
    accessToken,
    body: payload,
  });
}

export function updateAnnouncement(
  accessToken: string,
  groupId: string,
  id: string,
  payload: UpdateAnnouncementPayload,
): Promise<TeacherGroupAnnouncement> {
  return apiRequest<TeacherGroupAnnouncement>(`/groups/${groupId}/announcements/${id}`, {
    method: 'PATCH',
    accessToken,
    body: payload,
  });
}

export function deleteAnnouncement(accessToken: string, groupId: string, id: string): Promise<GroupAnnouncement> {
  return apiRequest<GroupAnnouncement>(`/groups/${groupId}/announcements/${id}`, {
    method: 'DELETE',
    accessToken,
  });
}

export function markRead(accessToken: string, groupId: string, id: string): Promise<{ readAt: string }> {
  return apiRequest<{ readAt: string }>(`/groups/${groupId}/announcements/${id}/read`, {
    method: 'POST',
    accessToken,
  });
}
