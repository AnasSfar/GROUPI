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

export function listSubjects(accessToken: string): Promise<Subject[]> {
  return apiRequest<Subject[]>('/referentials/subjects', { accessToken });
}

export function listSchoolLevels(accessToken: string): Promise<SchoolLevel[]> {
  return apiRequest<SchoolLevel[]>('/referentials/school-levels', { accessToken });
}

export function listCities(accessToken: string): Promise<City[]> {
  return apiRequest<City[]>('/referentials/cities', { accessToken });
}

export function listSchools(accessToken: string): Promise<School[]> {
  return apiRequest<School[]>('/referentials/schools', { accessToken });
}

export function listAcademicYears(accessToken: string): Promise<AcademicYear[]> {
  return apiRequest<AcademicYear[]>('/referentials/academic-years', { accessToken });
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

