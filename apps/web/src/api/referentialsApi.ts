import { apiRequest, API_BASE_URL } from './client';

export interface Subject {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolLevel {
  id: string;
  name: string;
  code: string;
  order: number;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface School {
  id: string;
  name: string;
  nameAr: string | null;
  type: string;
  cityId: string;
  city: { id: string; name: string };
  officialCode: string | null;
  latitude: string | null;
  longitude: string | null;
  createdAt: string;
  updatedAt: string;
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

export function listCities(accessToken?: string | null): Promise<City[]> {
  return apiRequest<City[]>('/referentials/cities', { accessToken });
}

export function listSchools(accessToken?: string | null): Promise<School[]> {
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

// --- RM-REF-011 — création/modification directe des référentiels (Admin habilité, REF_CREATE) ----

export interface CreateSubjectPayload {
  name: string;
  code: string;
}

export interface UpdateSubjectPayload {
  name?: string;
  code?: string;
  isActive?: boolean;
}

/** Vue Administrateur (RM-REF-011) : toutes les entrées, actives ou non — contrairement aux
 *  sélecteurs publics (`listSubjects`/`listSchoolLevels`/`listCities`) qui ne renvoient que les
 *  entrées actives et n'exposent pas `isActive`. */
export interface AdminReferentialEntry {
  isActive: boolean;
}

export function listAllSubjects(accessToken: string): Promise<(Subject & AdminReferentialEntry)[]> {
  return apiRequest<(Subject & AdminReferentialEntry)[]>('/admin/referentials/subjects', { accessToken });
}

export function listAllSchoolLevels(accessToken: string): Promise<(SchoolLevel & AdminReferentialEntry)[]> {
  return apiRequest<(SchoolLevel & AdminReferentialEntry)[]>('/admin/referentials/school-levels', { accessToken });
}

export function listAllCities(accessToken: string): Promise<(City & AdminReferentialEntry)[]> {
  return apiRequest<(City & AdminReferentialEntry)[]>('/admin/referentials/cities', { accessToken });
}

export function createSubject(accessToken: string, payload: CreateSubjectPayload): Promise<Subject> {
  return apiRequest<Subject>('/admin/referentials/subjects', { method: 'POST', accessToken, body: payload });
}

export function updateSubject(
  accessToken: string,
  id: string,
  payload: UpdateSubjectPayload,
): Promise<Subject> {
  return apiRequest<Subject>(`/admin/referentials/subjects/${id}`, { method: 'PATCH', accessToken, body: payload });
}

export interface CreateSchoolLevelPayload {
  name: string;
  code: string;
  order: number;
}

export interface UpdateSchoolLevelPayload {
  name?: string;
  code?: string;
  order?: number;
  isActive?: boolean;
}

export function createSchoolLevel(
  accessToken: string,
  payload: CreateSchoolLevelPayload,
): Promise<SchoolLevel> {
  return apiRequest<SchoolLevel>('/admin/referentials/school-levels', { method: 'POST', accessToken, body: payload });
}

export function updateSchoolLevel(
  accessToken: string,
  id: string,
  payload: UpdateSchoolLevelPayload,
): Promise<SchoolLevel> {
  return apiRequest<SchoolLevel>(`/admin/referentials/school-levels/${id}`, {
    method: 'PATCH',
    accessToken,
    body: payload,
  });
}

export interface CreateCityPayload {
  name: string;
}

export interface UpdateCityPayload {
  name?: string;
  isActive?: boolean;
}

export function createCity(accessToken: string, payload: CreateCityPayload): Promise<City> {
  return apiRequest<City>('/admin/referentials/cities', { method: 'POST', accessToken, body: payload });
}

export function updateCity(accessToken: string, id: string, payload: UpdateCityPayload): Promise<City> {
  return apiRequest<City>(`/admin/referentials/cities/${id}`, { method: 'PATCH', accessToken, body: payload });
}

/** RM-REF-013 — export CSV synchrone des référentiels actifs (matières, niveaux, villes, établissements). */
export async function downloadReferentialsCsv(accessToken: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/referentials/export.csv`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    let message = `Export impossible (${response.status}).`;
    try {
      const data = (await response.json()) as { message?: string | string[] };
      if (data?.message) message = Array.isArray(data.message) ? data.message.join(' ') : data.message;
    } catch {
      // Réponse non-JSON : on garde le message générique.
    }
    throw new Error(message);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'groupi-referentiels.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

