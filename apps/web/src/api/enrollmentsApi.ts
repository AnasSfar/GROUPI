import { apiRequest } from './client';
import type { Subject, SchoolLevel, AcademicYear } from './referentialsApi';
import type { DayOfWeek } from './groupsApi';

/** Ch.12/13 : jour + horaire d'un créneau du planning hebdomadaire du groupe. */
export interface EnrollmentGroupSchedule {
  dayOfWeek: DayOfWeek;
  startTime: string;
  durationMinutes: number;
}

/** Avenant 02 : toute inscription naît directement ACTIVE — plus d'état intermédiaire en attente. */
export type EnrollmentStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';

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

/**
 * Ch.12.7/RM-INS-014/015 : indicateur synthétique de comportement de paiement du Parent, calculé
 * sur son historique complet (tous enfants, toutes années confondues si l'année en cours n'a pas
 * encore d'historique - RM-INS-029). Jamais de montant ni de détail de compte (RM-INS-016).
 */
export type ParentPaymentBehavior = 'EXCELLENT' | 'MOYEN' | 'MAUVAIS' | 'NON_DISPONIBLE';

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
  parentPaymentBehavior: ParentPaymentBehavior;
}

// Avenant 01, Ch. C/D.2/RM-PAR-021 : `createEnrollment` (demande d'inscription à l'initiative du
// Parent, `POST /enrollments`) a été retiré avec l'endpoint correspondant — remplacé par
// l'affectation Professeur (Ch. C) ou la transformation d'une préinscription confirmée (Ch. 11).

// --- Vue Parent -------------------------------------------------------------

export function listMine(accessToken: string): Promise<ParentEnrollment[]> {
  return apiRequest<ParentEnrollment[]>('/enrollments/mine', { accessToken });
}

// --- Vue Professeur ----------------------------------------------------------

export function listByGroup(accessToken: string, groupId: string): Promise<TeacherEnrollment[]> {
  return apiRequest<TeacherEnrollment[]>(`/groups/${groupId}/enrollments`, { accessToken });
}

/** Avenant 02 : décision unilatérale et immédiate du Professeur, sans confirmation Parent. */
export function changeEnrollmentGroup(
  accessToken: string,
  groupId: string,
  enrollmentId: string,
  targetGroupId: string,
): Promise<TeacherEnrollment> {
  return apiRequest<TeacherEnrollment>(`/groups/${groupId}/enrollments/${enrollmentId}/change-group`, {
    method: 'POST',
    accessToken,
    body: { targetGroupId },
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
