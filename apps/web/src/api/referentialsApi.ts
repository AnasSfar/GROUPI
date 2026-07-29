import { apiRequest } from './client';

export interface Subject {
  id: string;
  name: string;
  code: string;
}

export interface SchoolLevel {
  id: string;
  name: string;
  code: string;
  order: number;
}

/**
 * Regroupement des niveaux par section pour l'UI (primaire / collège / lycée) — dérivé du préfixe
 * du code référentiel (`PRIM*`, `COL*`, `SEC*`) plutôt que stocké en base, le référentiel officiel
 * (Ch.23.5) ne définissant pas de champ "section" formel.
 */
export type SchoolLevelSection = 'PRIMAIRE' | 'COLLEGE' | 'LYCEE';

export const SCHOOL_LEVEL_SECTIONS: SchoolLevelSection[] = ['PRIMAIRE', 'COLLEGE', 'LYCEE'];

export const SCHOOL_LEVEL_SECTION_LABELS: Record<SchoolLevelSection, string> = {
  PRIMAIRE: 'Primaire (1ère à 6ème année)',
  COLLEGE: 'Collège (7ème à 9ème année)',
  LYCEE: 'Lycée',
};

export function schoolLevelSection(code: string): SchoolLevelSection {
  if (code.startsWith('PRIM')) return 'PRIMAIRE';
  if (code.startsWith('COL')) return 'COLLEGE';
  return 'LYCEE';
}

export interface City {
  id: string;
  name: string;
}

export interface School {
  id: string;
  name: string;
  nameAr: string | null;
  type: string;
  cityId: string;
  city: City;
  officialCode: string | null;
  latitude: string | null;
  longitude: string | null;
}

export interface AcademicYear {
  id: string;
  label: string;
  status: 'OPEN' | 'CLOSED';
  startDate: string;
  endDate: string;
}

/** Public — accessible sans authentification (formulaire d'inscription Professeur). */
export function listSubjects(accessToken?: string | null): Promise<Subject[]> {
  return apiRequest<Subject[]>('/referentials/subjects', { accessToken });
}

/** Public — accessible sans authentification (formulaire d'inscription Professeur). */
export function listSchoolLevels(accessToken?: string | null): Promise<SchoolLevel[]> {
  return apiRequest<SchoolLevel[]>('/referentials/school-levels', { accessToken });
}

export function listCities(accessToken: string): Promise<City[]> {
  return apiRequest<City[]>('/referentials/cities', { accessToken });
}

export function listSchools(accessToken: string): Promise<School[]> {
  return apiRequest<School[]>('/referentials/schools', { accessToken });
}

export interface SubjectLevelPair {
  subjectId: string;
  schoolLevelId: string;
}

/** Ch.10/ERR-GRP-001 — couples matière/niveau autorisés, pour filtrer les sélecteurs dépendants. */
export function listSubjectLevels(accessToken: string): Promise<SubjectLevelPair[]> {
  return apiRequest<SubjectLevelPair[]>('/referentials/subject-levels', { accessToken });
}

export function listAcademicYears(accessToken: string): Promise<AcademicYear[]> {
  return apiRequest<AcademicYear[]>('/referentials/academic-years', { accessToken });
}

/** Ch.6.7 — file Admin des demandes d'ajout d'établissement soumises par des Parents. */
export interface AdminSchoolAdditionRequest {
  id: string;
  name: string;
  type: string;
  city: { id: string; name: string };
  address: string | null;
  comment: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  parent: { firstName: string; lastName: string; phone: string };
  reviewedBy: { id: string; email: string } | null;
  createdSchool: { id: string; name: string } | null;
  createdAt: string;
}

export function listSchoolRequests(
  accessToken: string,
  status?: string,
): Promise<AdminSchoolAdditionRequest[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest<AdminSchoolAdditionRequest[]>(`/referentials/school-requests${query}`, { accessToken });
}

export function approveSchoolRequest(
  accessToken: string,
  id: string,
): Promise<AdminSchoolAdditionRequest> {
  return apiRequest<AdminSchoolAdditionRequest>(`/referentials/school-requests/${id}/approve`, {
    method: 'POST',
    accessToken,
  });
}

export function rejectSchoolRequest(
  accessToken: string,
  id: string,
  reason: string,
): Promise<AdminSchoolAdditionRequest> {
  return apiRequest<AdminSchoolAdditionRequest>(`/referentials/school-requests/${id}/reject`, {
    method: 'POST',
    accessToken,
    body: { reason },
  });
}

export interface CreateAcademicYearPayload {
  label: string;
  startDate: string;
  endDate: string;
}

/** PERM-REF-001 — réservé Super Admin / Admin délégué. */
export function createAcademicYear(
  accessToken: string,
  payload: CreateAcademicYearPayload,
): Promise<AcademicYear> {
  return apiRequest<AcademicYear>('/referentials/academic-years', { method: 'POST', accessToken, body: payload });
}

