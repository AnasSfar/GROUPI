import { apiRequest } from './client';

export type GroupChangeStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

/**
 * RM-CHG-002 (Ch.20.3) : `PARENT` pour une demande créée via `createGroupChangeRequest`, `TEACHER`
 * pour une proposition créée via `teacherInitiateGroupChange` — détermine qui doit décider (l'autre
 * partie) et donc quels boutons afficher (Accepter/Refuser vs Confirmer/Décliner).
 */
export type GroupChangeInitiator = 'PARENT' | 'TEACHER';

export interface GroupChangeRequestView {
  id: string;
  status: GroupChangeStatus;
  requestedAt: string;
  decidedAt: string | null;
  effectiveDate: string | null;
  appliedAt: string | null;
  rejectionReason: string | null;
  initiatedBy: GroupChangeInitiator;
  originalEnrollment: {
    id: string;
    status: string;
    student: { id: string; firstName: string; lastName: string };
    group: { id: string; name: string };
  };
  targetGroup: {
    id: string;
    name: string;
    capacity: number;
    status: string;
    teacher: { firstName: string; lastName: string };
  };
  newEnrollment: { id: string; status: string } | null;
}

export interface CreateGroupChangeRequestPayload {
  enrollmentId: string;
  targetGroupId: string;
}

export interface TeacherInitiateGroupChangePayload {
  enrollmentId: string;
  targetGroupId: string;
  effectiveDate: string;
  note?: string;
}

// --- Vue Parent -------------------------------------------------------------

export function createGroupChangeRequest(
  accessToken: string,
  payload: CreateGroupChangeRequestPayload,
): Promise<GroupChangeRequestView> {
  return apiRequest<GroupChangeRequestView>('/group-changes', { method: 'POST', accessToken, body: payload });
}

export function listMine(accessToken: string): Promise<GroupChangeRequestView[]> {
  return apiRequest<GroupChangeRequestView[]>('/group-changes/mine', { accessToken });
}

export function cancelGroupChangeRequest(accessToken: string, id: string): Promise<GroupChangeRequestView> {
  return apiRequest<GroupChangeRequestView>(`/group-changes/${id}/cancel`, { method: 'POST', accessToken });
}

/** RM-CHG-002/003 (Ch.20.3) : le Parent confirme une proposition émise par le Professeur. */
export function confirmGroupChangeProposal(accessToken: string, id: string): Promise<GroupChangeRequestView> {
  return apiRequest<GroupChangeRequestView>(`/group-changes/${id}/confirm`, { method: 'POST', accessToken });
}

/** RM-CHG-002/003 (Ch.20.3) : le Parent décline une proposition émise par le Professeur. */
export function declineGroupChangeProposal(
  accessToken: string,
  id: string,
  reason?: string,
): Promise<GroupChangeRequestView> {
  return apiRequest<GroupChangeRequestView>(`/group-changes/${id}/decline`, {
    method: 'POST',
    accessToken,
    body: { reason },
  });
}

// --- Vue Professeur (du groupe cible) ----------------------------------------

export function listByTargetGroup(accessToken: string, groupId: string): Promise<GroupChangeRequestView[]> {
  return apiRequest<GroupChangeRequestView[]>(`/groups/${groupId}/group-changes`, { accessToken });
}

/** RM-CHG-002 (Ch.20.3) : le Professeur initie lui-même une demande pour un de ses élèves. */
export function teacherInitiateGroupChange(
  accessToken: string,
  payload: TeacherInitiateGroupChangePayload,
): Promise<GroupChangeRequestView> {
  return apiRequest<GroupChangeRequestView>('/group-changes/teacher-initiate', {
    method: 'POST',
    accessToken,
    body: payload,
  });
}

export function acceptGroupChangeRequest(
  accessToken: string,
  id: string,
  effectiveDate: string,
): Promise<GroupChangeRequestView> {
  return apiRequest<GroupChangeRequestView>(`/group-changes/${id}/accept`, {
    method: 'POST',
    accessToken,
    body: { effectiveDate },
  });
}

export function rejectGroupChangeRequest(
  accessToken: string,
  id: string,
  reason?: string,
): Promise<GroupChangeRequestView> {
  return apiRequest<GroupChangeRequestView>(`/group-changes/${id}/reject`, {
    method: 'POST',
    accessToken,
    body: { reason },
  });
}
