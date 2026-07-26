import { apiRequest } from './client';
import type { Subject, SchoolLevel, AcademicYear } from './referentialsApi';
import type {
  GroupSchedule,
  TeachingMode,
  AbsenceBillingPolicy,
  VisibilityWhenFull,
  GroupStatus,
} from './groupsApi';

/** Ch.11.14/11.15 — cycle de vie complet, y compris CANCELLED/CLOSED (RM-PRE-020/028). */
export type PreEnrollmentStatus =
  | 'PENDING'
  | 'PROPOSAL_SENT'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'TRANSFORMED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'CLOSED';

export interface PreEnrollmentStudent {
  id: string;
  firstName: string;
  lastName: string;
}

/** Ch.11.5 : coordonnées consultables par le Professeur pour ses préinscriptions reçues. */
export interface PreEnrollmentParent {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
}

export interface PreEnrollmentTeacher {
  id: string;
  firstName: string;
  lastName: string;
  city: string;
}

/** Ch.11.8 : détails du groupe proposé — horaires, lieu, tarif, places disponibles. */
export interface ProposedGroup {
  id: string;
  name: string;
  capacity: number;
  publicPrice: string;
  teachingMode: TeachingMode;
  absenceBillingPolicy: AbsenceBillingPolicy;
  visibilityWhenFull: VisibilityWhenFull;
  startDate: string;
  endDate: string | null;
  status: GroupStatus;
  schedules: GroupSchedule[];
  _count: { enrollments: number };
}

export interface PreEnrollment {
  id: string;
  status: PreEnrollmentStatus;
  expiresAt: string | null;
  proposedGroupId: string | null;
  createdAt: string;
  studentId: string;
  teacherId: string;
  schoolLevelId: string;
  subjectId: string | null;
  academicYearId: string;
  student: PreEnrollmentStudent;
  parent: PreEnrollmentParent;
  teacher: PreEnrollmentTeacher;
  schoolLevel: SchoolLevel;
  subject: Subject | null;
  academicYear: AcademicYear;
  proposedGroup: ProposedGroup | null;
}

export interface EligibleTeacher {
  id: string;
  firstName: string;
  lastName: string;
  city: string;
  subjects: { subject: Subject }[];
  schoolLevels: { schoolLevel: SchoolLevel }[];
}

export interface CreatePreEnrollmentPayload {
  studentId: string;
  teacherId: string;
  schoolLevelId: string;
  subjectId?: string;
  academicYearId: string;
}

export interface ProposePreEnrollmentPayload {
  groupId: string;
  expiresAt: string;
}

export interface EligibleTeachersFilters {
  city?: string;
  subjectId?: string;
  schoolLevelId?: string;
}

/** Vue Parent (Ch.11.9) ou vue Professeur (Ch.11.5, filtrable par année) selon le rôle connecté. */
export function listMine(accessToken: string, academicYearId?: string): Promise<PreEnrollment[]> {
  const query = academicYearId ? `?academicYearId=${academicYearId}` : '';
  return apiRequest<PreEnrollment[]>(`/pre-enrollments/mine${query}`, { accessToken });
}

export function createPreEnrollment(
  accessToken: string,
  payload: CreatePreEnrollmentPayload,
): Promise<PreEnrollment> {
  return apiRequest<PreEnrollment>('/pre-enrollments', { method: 'POST', accessToken, body: payload });
}

export function cancelPreEnrollment(accessToken: string, id: string): Promise<PreEnrollment> {
  return apiRequest<PreEnrollment>(`/pre-enrollments/${id}/cancel`, { method: 'POST', accessToken });
}

export function confirmPreEnrollment(accessToken: string, id: string): Promise<PreEnrollment> {
  return apiRequest<PreEnrollment>(`/pre-enrollments/${id}/confirm`, { method: 'POST', accessToken });
}

export function rejectPreEnrollment(accessToken: string, id: string): Promise<PreEnrollment> {
  return apiRequest<PreEnrollment>(`/pre-enrollments/${id}/reject`, { method: 'POST', accessToken });
}

export function proposePreEnrollment(
  accessToken: string,
  id: string,
  payload: ProposePreEnrollmentPayload,
): Promise<PreEnrollment> {
  return apiRequest<PreEnrollment>(`/pre-enrollments/${id}/propose`, {
    method: 'POST',
    accessToken,
    body: payload,
  });
}

/** Ch.11.4 : recherche minimale de Professeurs validés pour le formulaire de préinscription
 *  (pas encore d'annuaire public dédié — endpoint propre au module Préinscriptions). */
export function listEligibleTeachers(
  accessToken: string,
  filters: EligibleTeachersFilters = {},
): Promise<EligibleTeacher[]> {
  const params = new URLSearchParams();
  if (filters.city) params.set('city', filters.city);
  if (filters.subjectId) params.set('subjectId', filters.subjectId);
  if (filters.schoolLevelId) params.set('schoolLevelId', filters.schoolLevelId);
  const query = params.toString();
  return apiRequest<EligibleTeacher[]>(
    `/pre-enrollments/eligible-teachers${query ? `?${query}` : ''}`,
    { accessToken },
  );
}

/** Ch.11.7, RM-PRE-008 : préinscriptions compatibles avec un groupe donné. */
export function listCompatiblePreEnrollments(
  accessToken: string,
  groupId: string,
): Promise<PreEnrollment[]> {
  return apiRequest<PreEnrollment[]>(`/groups/${groupId}/compatible-pre-enrollments`, { accessToken });
}
