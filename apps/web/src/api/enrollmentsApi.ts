import { apiRequest } from './client';
import type { Subject, SchoolLevel, AcademicYear } from './referentialsApi';
import type { DayOfWeek } from './groupsApi';

/** Ch.12/13 : jour + horaire d'un créneau du planning hebdomadaire du groupe. */
export interface EnrollmentGroupSchedule {
  dayOfWeek: DayOfWeek;
  startTime: string;
  durationMinutes: number;
}

/** Ch.12.11/12.16 : les 7 états du cycle de vie d'une inscription. */
export type EnrollmentStatus =
  | 'PENDING_VALIDATION'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'REJECTED'
  | 'ARCHIVED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface EnrollmentStudentSummary {
  id: string;
  firstName: string;
  lastName: string;
}

/** Ch.12 : vue Parent — infos du groupe/professeur/matière/niveau nécessaires avant/après demande. */
export interface ParentEnrollment {
  id: string;
  status: EnrollmentStatus;
  customPrice: string | null;
  paymentMethod: string | null;
  requestedAt: string;
  decidedAt: string | null;
  student: EnrollmentStudentSummary;
  group: {
    id: string;
    name: string;
    status: string;
    publicPrice: string;
    teachingMode: string;
    subject: Subject;
    schoolLevel: SchoolLevel;
    academicYear: AcademicYear;
    teacher: { firstName: string; lastName: string; city: string };
    schedules: EnrollmentGroupSchedule[];
  };
}

/** Ch.12.7/RM-PAR-007/008 : vue Professeur — jamais le téléphone du Parent (donnée privée). */
export interface TeacherEnrollment {
  id: string;
  status: EnrollmentStatus;
  customPrice: string | null;
  paymentMethod: string | null;
  requestedAt: string;
  decidedAt: string | null;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    status: string;
    parent: { firstName: string; lastName: string };
    currentSchoolSituation: {
      school: { name: string };
      schoolLevel: { name: string };
      class: string | null;
    } | null;
  };
  group: {
    id: string;
    name: string;
    capacity: number;
    status: string;
    schedules: EnrollmentGroupSchedule[];
  };
}

export interface CreateEnrollmentPayload {
  studentId: string;
  groupId: string;
}

// --- Vue Parent -------------------------------------------------------------

export function createEnrollment(
  accessToken: string,
  payload: CreateEnrollmentPayload,
): Promise<ParentEnrollment> {
  return apiRequest<ParentEnrollment>('/enrollments', { method: 'POST', accessToken, body: payload });
}

export function listMine(accessToken: string): Promise<ParentEnrollment[]> {
  return apiRequest<ParentEnrollment[]>('/enrollments/mine', { accessToken });
}

export function cancelEnrollment(accessToken: string, enrollmentId: string): Promise<ParentEnrollment> {
  return apiRequest<ParentEnrollment>(`/enrollments/${enrollmentId}/cancel`, {
    method: 'POST',
    accessToken,
  });
}

// --- Vue Professeur ----------------------------------------------------------

export function listByGroup(accessToken: string, groupId: string): Promise<TeacherEnrollment[]> {
  return apiRequest<TeacherEnrollment[]>(`/groups/${groupId}/enrollments`, { accessToken });
}

export function acceptEnrollment(
  accessToken: string,
  groupId: string,
  enrollmentId: string,
  payload: { customPrice?: number } = {},
): Promise<TeacherEnrollment> {
  return apiRequest<TeacherEnrollment>(`/groups/${groupId}/enrollments/${enrollmentId}/accept`, {
    method: 'POST',
    accessToken,
    body: payload,
  });
}

export function rejectEnrollment(
  accessToken: string,
  groupId: string,
  enrollmentId: string,
  payload: { comment?: string } = {},
): Promise<TeacherEnrollment> {
  return apiRequest<TeacherEnrollment>(`/groups/${groupId}/enrollments/${enrollmentId}/reject`, {
    method: 'POST',
    accessToken,
    body: payload,
  });
}

export function updateEnrollmentPrice(
  accessToken: string,
  groupId: string,
  enrollmentId: string,
  customPrice: number,
): Promise<TeacherEnrollment> {
  return apiRequest<TeacherEnrollment>(`/groups/${groupId}/enrollments/${enrollmentId}`, {
    method: 'PATCH',
    accessToken,
    body: { customPrice },
  });
}

export function suspendEnrollment(
  accessToken: string,
  groupId: string,
  enrollmentId: string,
): Promise<TeacherEnrollment> {
  return apiRequest<TeacherEnrollment>(`/groups/${groupId}/enrollments/${enrollmentId}/suspend`, {
    method: 'POST',
    accessToken,
  });
}

export function reactivateEnrollment(
  accessToken: string,
  groupId: string,
  enrollmentId: string,
): Promise<TeacherEnrollment> {
  return apiRequest<TeacherEnrollment>(`/groups/${groupId}/enrollments/${enrollmentId}/reactivate`, {
    method: 'POST',
    accessToken,
  });
}

export function archiveEnrollment(
  accessToken: string,
  groupId: string,
  enrollmentId: string,
): Promise<TeacherEnrollment> {
  return apiRequest<TeacherEnrollment>(`/groups/${groupId}/enrollments/${enrollmentId}/archive`, {
    method: 'POST',
    accessToken,
  });
}
