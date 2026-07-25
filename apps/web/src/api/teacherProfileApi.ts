import { apiRequest } from './client';
import type { Subject, SchoolLevel } from './referentialsApi';

export interface TeacherProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  bio: string | null;
  photo: string | null;
  experience: string | null;
  completenessScore: number;
  status: string;
  subjects: { subject: Subject }[];
  schoolLevels: { schoolLevel: SchoolLevel }[];
}

export interface UpdateProfilePayload {
  bio?: string;
  photo?: string;
  experience?: string;
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
