import { apiRequest } from './client';

export interface AbsenceNotice {
  id: string;
  sessionId: string;
  studentId: string;
  reason: string | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AbsenceNoticeWithStudent extends AbsenceNotice {
  student: { id: string; firstName: string; lastName: string };
}

export interface CreateAbsenceNoticePayload {
  studentId: string;
  reason?: string;
  comment?: string;
}

/** Ch.16.4/RM-DSH-006 : signalement d'absence prévisible par le Parent, avant le début de la séance. */
export function createAbsenceNotice(
  accessToken: string,
  sessionId: string,
  payload: CreateAbsenceNoticePayload,
): Promise<AbsenceNotice> {
  return apiRequest<AbsenceNotice>(`/sessions/${sessionId}/absence-notices`, {
    method: 'POST',
    accessToken,
    body: payload,
  });
}

/** Vue Professeur : signalements reçus pour une séance. */
export function listAbsenceNotices(accessToken: string, sessionId: string): Promise<AbsenceNoticeWithStudent[]> {
  return apiRequest<AbsenceNoticeWithStudent[]>(`/sessions/${sessionId}/absence-notices`, { accessToken });
}
