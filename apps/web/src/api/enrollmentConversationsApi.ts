import { apiRequest } from './client';

export type CommentAuthorRole = 'TEACHER' | 'PARENT';

export interface EnrollmentComment {
  id: string;
  enrollmentId: string;
  authorId: string;
  authorRole: CommentAuthorRole;
  body: string;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
}

/** Ch.19.3 : fil de commentaires privé d'une inscription (Professeur du groupe / Parent de l'élève). */
export function listComments(accessToken: string, enrollmentId: string): Promise<EnrollmentComment[]> {
  return apiRequest<EnrollmentComment[]>(`/enrollments/${enrollmentId}/comments`, { accessToken });
}

export function postComment(accessToken: string, enrollmentId: string, body: string): Promise<EnrollmentComment> {
  return apiRequest<EnrollmentComment>(`/enrollments/${enrollmentId}/comments`, {
    method: 'POST',
    accessToken,
    body: { body },
  });
}

export function editComment(
  accessToken: string,
  enrollmentId: string,
  commentId: string,
  body: string,
): Promise<EnrollmentComment> {
  return apiRequest<EnrollmentComment>(`/enrollments/${enrollmentId}/comments/${commentId}`, {
    method: 'PATCH',
    accessToken,
    body: { body },
  });
}

export function deleteComment(accessToken: string, enrollmentId: string, commentId: string): Promise<EnrollmentComment> {
  return apiRequest<EnrollmentComment>(`/enrollments/${enrollmentId}/comments/${commentId}`, {
    method: 'DELETE',
    accessToken,
  });
}
