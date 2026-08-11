import { apiRequest } from './client';
import type { Subject, SchoolLevel } from './referentialsApi';

/** Ch.5.7/8 : cycle de vie du profil professionnel — distinct du statut du Compte (User.status). */
export type TeacherProfileStatus = 'DRAFT' | 'PENDING_VALIDATION' | 'VALIDATED';

export interface TeacherProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  bio: string | null;
  photo: string | null;
  experience: string | null;
  /** RM-TPR-013 : disponibilités déclaratives, texte libre. */
  availability: string | null;
  completenessScore: number;
  status: TeacherProfileStatus;
  subjects: { subject: Subject }[];
  schoolLevels: { schoolLevel: SchoolLevel }[];
}

export interface UpdateProfilePayload {
  bio?: string;
  photo?: string;
  experience?: string;
  availability?: string;
}

export function getMyProfile(accessToken: string): Promise<TeacherProfile> {
  return apiRequest<TeacherProfile>('/teacher-profile/me', { accessToken });
}

export function updateMyProfile(
  accessToken: string,
  payload: UpdateProfilePayload,
): Promise<TeacherProfile> {
  return apiRequest<TeacherProfile>('/teacher-profile/me', {
    method: 'PATCH',
    accessToken,
    body: payload,
  });
}

export function addSubject(accessToken: string, subjectId: string): Promise<TeacherProfile> {
  return apiRequest<TeacherProfile>('/teacher-profile/me/subjects', {
    method: 'POST',
    accessToken,
    body: { subjectId },
  });
}

export function removeSubject(accessToken: string, subjectId: string): Promise<TeacherProfile> {
  return apiRequest<TeacherProfile>(`/teacher-profile/me/subjects/${subjectId}`, {
    method: 'DELETE',
    accessToken,
  });
}

export function addSchoolLevel(
  accessToken: string,
  schoolLevelId: string,
): Promise<TeacherProfile> {
  return apiRequest<TeacherProfile>('/teacher-profile/me/school-levels', {
    method: 'POST',
    accessToken,
    body: { schoolLevelId },
  });
}

export function removeSchoolLevel(
  accessToken: string,
  schoolLevelId: string,
): Promise<TeacherProfile> {
  return apiRequest<TeacherProfile>(`/teacher-profile/me/school-levels/${schoolLevelId}`, {
    method: 'DELETE',
    accessToken,
  });
}

export interface TeachingLocation {
  id: string;
  label: string;
  address: string | null;
  isActive: boolean;
}

export function listLocations(accessToken: string): Promise<TeachingLocation[]> {
  return apiRequest<TeachingLocation[]>('/teacher-profile/me/locations', { accessToken });
}

export function createLocation(
  accessToken: string,
  payload: { label: string; address?: string },
): Promise<TeachingLocation> {
  return apiRequest<TeachingLocation>('/teacher-profile/me/locations', {
    method: 'POST',
    accessToken,
    body: payload,
  });
}

export function deactivateLocation(accessToken: string, locationId: string): Promise<TeachingLocation> {
  return apiRequest<TeachingLocation>(`/teacher-profile/me/locations/${locationId}`, {
    method: 'DELETE',
    accessToken,
  });
}

/** RM-TPR-012 : dépôt de diplôme, facultatif et non vérifié en V1. */
export interface Diploma {
  id: string;
  fileName: string;
  fileUrl: string | null;
  uploadedAt: string;
}

export function listDiplomas(accessToken: string): Promise<Diploma[]> {
  return apiRequest<Diploma[]>('/teacher-profile/me/diplomas', { accessToken });
}

export function addDiploma(
  accessToken: string,
  payload: { fileName: string; fileUrl?: string },
): Promise<Diploma> {
  return apiRequest<Diploma>('/teacher-profile/me/diplomas', {
    method: 'POST',
    accessToken,
    body: payload,
  });
}

export function removeDiploma(accessToken: string, diplomaId: string): Promise<{ id: string; deleted: boolean }> {
  return apiRequest<{ id: string; deleted: boolean }>(`/teacher-profile/me/diplomas/${diplomaId}`, {
    method: 'DELETE',
    accessToken,
  });
}
