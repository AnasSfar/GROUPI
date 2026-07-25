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

export function listSubjects(accessToken: string): Promise<Subject[]> {
  return apiRequest<Subject[]>('/referentials/subjects', { accessToken });
}

export function listSchoolLevels(accessToken: string): Promise<SchoolLevel[]> {
  return apiRequest<SchoolLevel[]>('/referentials/school-levels', { accessToken });
}
