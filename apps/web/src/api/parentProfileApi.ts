import { apiRequest } from './client';
import type { School, SchoolLevel } from './referentialsApi';

export interface ParentProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  validatedAt: string | null;
}

export interface StudentSituation {
  id: string;
  class: string | null;
  startDate: string;
  endDate: string | null;
  status: 'ACTIVE' | 'PENDING_VALIDATION' | 'CLOSED' | 'REJECTED';
  rejectionReason: string | null;
  academicYear: { id: string; label: string };
  schoolLevel: SchoolLevel;
  school: School;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  currentSchoolSituation: StudentSituation | null;
}

export interface UpdateParentProfilePayload {
  phone?: string;
  city?: string;
}

export interface CreateStudentPayload {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  schoolLevelId: string;
  schoolId: string;
  schoolClass?: string;
}

export interface UpdateStudentPayload {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
}

/**
 * Avenant 01, Ch. D.3, RM-POOL-010/RM-PAR-023 : rattachement actif d'un enfant à la salle d'attente
 * d'un Professeur, sans inscription standard correspondante — jamais un nom de groupe standard non
 * rejoint ni celui d'un autre élève.
 */
export interface PendingLevelPoolAssignment {
  id: string;
  studentId: string;
  teacher: { firstName: string; lastName: string };
  schoolLevel: { id: string; name: string };
}

export type SchoolAdditionRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface SchoolAdditionRequest {
  id: string;
  name: string;
  type: string;
  cityId: string;
  city: { id: string; name: string };
  address: string | null;
  comment: string | null;
  status: SchoolAdditionRequestStatus;
  rejectionReason: string | null;
  createdSchool: { id: string; name: string } | null;
  createdAt: string;
}

export interface CreateSchoolAdditionRequestPayload {
  name: string;
  type: string;
  cityId: string;
  address?: string;
  comment?: string;
}

export function getMyProfile(accessToken: string): Promise<ParentProfile> {
  return apiRequest<ParentProfile>('/parent-profile/me', { accessToken });
}

export function updateMyProfile(
  accessToken: string,
  payload: UpdateParentProfilePayload,
): Promise<ParentProfile> {
  return apiRequest<ParentProfile>('/parent-profile/me', {
    method: 'PATCH',
    accessToken,
    body: payload,
  });
}

export function listStudents(accessToken: string): Promise<Student[]> {
  return apiRequest<Student[]>('/parent-profile/me/students', { accessToken });
}

export function createStudent(
  accessToken: string,
  payload: CreateStudentPayload,
): Promise<Student> {
  return apiRequest<Student>('/parent-profile/me/students', {
    method: 'POST',
    accessToken,
    body: payload,
  });
}

export function updateStudent(
  accessToken: string,
  studentId: string,
  payload: UpdateStudentPayload,
): Promise<Student> {
  return apiRequest<Student>(`/parent-profile/me/students/${studentId}`, {
    method: 'PATCH',
    accessToken,
    body: payload,
  });
}

export function archiveStudent(accessToken: string, studentId: string): Promise<Student> {
  return apiRequest<Student>(`/parent-profile/me/students/${studentId}/archive`, {
    method: 'POST',
    accessToken,
  });
}

export function reactivateStudent(accessToken: string, studentId: string): Promise<Student> {
  return apiRequest<Student>(`/parent-profile/me/students/${studentId}/reactivate`, {
    method: 'POST',
    accessToken,
  });
}

/** Avenant 01, Ch. D.3 : alimente l'entrée "En attente d'affectation" du niveau 2 de navigation. */
export function listPendingAssignments(accessToken: string): Promise<PendingLevelPoolAssignment[]> {
  return apiRequest<PendingLevelPoolAssignment[]>('/parent-profile/me/pending-assignments', { accessToken });
}

/** Ch.6.7 — un Parent peut demander l'ajout d'un établissement absent du référentiel. */
export function listSchoolAdditionRequests(accessToken: string): Promise<SchoolAdditionRequest[]> {
  return apiRequest<SchoolAdditionRequest[]>('/parent-profile/me/school-requests', { accessToken });
}

export function createSchoolAdditionRequest(
  accessToken: string,
  payload: CreateSchoolAdditionRequestPayload,
): Promise<SchoolAdditionRequest> {
  return apiRequest<SchoolAdditionRequest>('/parent-profile/me/school-requests', {
    method: 'POST',
    accessToken,
    body: payload,
  });
}
