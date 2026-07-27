import { apiRequest } from './client';

export type GroupChangeStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export interface GroupChangeRequestView {
  id: string;
  status: GroupChangeStatus;
  requestedAt: string;
  decidedAt: string | null;
  effectiveDate: string | null;
  appliedAt: string | null;
  rejectionReason: string | null;
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

// --- Vue Professeur (du groupe cible) ----------------------------------------

export function listByTargetGroup(accessToken: string, groupId: string): Promise<GroupChangeRequestView[]> {
  return apiRequest<GroupChangeRequestView[]>(`/groups/${groupId}/group-changes`, { accessToken });
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
