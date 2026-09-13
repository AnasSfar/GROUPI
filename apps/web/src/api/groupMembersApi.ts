import { apiRequest } from './client';

/** Avenant 01, Ch. C — affectation d'élèves de la salle d'attente vers un groupe standard. */
export interface AssignGroupMembersPayload {
  studentIds: string[];
  paymentMethod?: string;
  customPrice?: number;
}

export interface AssignOutcome {
  studentId: string;
  status: 'ASSIGNED' | 'SKIPPED';
  reason?: string;
  enrollmentId?: string;
}

export interface AssignGroupMembersResult {
  assigned: AssignOutcome[];
  skipped: AssignOutcome[];
}

export function assign(
  accessToken: string,
  groupId: string,
  payload: AssignGroupMembersPayload,
): Promise<AssignGroupMembersResult> {
  return apiRequest<AssignGroupMembersResult>(`/groups/${groupId}/members`, {
    method: 'POST',
    accessToken,
    body: payload,
  });
}

/** RM-AFF-009 : retirer un élève d'un groupe standard = archiver son inscription. */
export function remove(accessToken: string, groupId: string, studentId: string) {
  return apiRequest(`/groups/${groupId}/members/${studentId}`, { method: 'DELETE', accessToken });
}
