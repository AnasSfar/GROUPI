import { apiRequest } from './client';
import type { StudentSituation } from './parentProfileApi';

export interface RequestSituationUpdatePayload {
  academicYearId: string;
  schoolLevelId: string;
  schoolId: string;
  schoolClass?: string;
}

export interface PendingSituation extends StudentSituation {
  status: 'PENDING_VALIDATION';
  student: {
    id: string;
    firstName: string;
    lastName: string;
    parent: { firstName: string; lastName: string; phone: string };
  };
}

export function listHistory(
  accessToken: string,
  studentId: string,
): Promise<StudentSituation[]> {
  return apiRequest<StudentSituation[]>(`/parent-profile/me/students/${studentId}/situations`, {
    accessToken,
  });
}

export function requestUpdate(
  accessToken: string,
  studentId: string,
  payload: RequestSituationUpdatePayload,
): Promise<StudentSituation> {
  return apiRequest<StudentSituation>(`/parent-profile/me/students/${studentId}/situations`, {
    method: 'POST',
    accessToken,
    body: payload,
  });
}

export function listPending(accessToken: string): Promise<PendingSituation[]> {
  return apiRequest<PendingSituation[]>('/admin/school-situations/pending', { accessToken });
}

export function validateSituation(accessToken: string, situationId: string) {
  return apiRequest(`/admin/school-situations/${situationId}/validate`, {
    method: 'POST',
    accessToken,
  });
}

export function rejectSituation(accessToken: string, situationId: string, reason: string) {
  return apiRequest(`/admin/school-situations/${situationId}/reject`, {
    method: 'POST',
    accessToken,
    body: { reason },
  });
}
