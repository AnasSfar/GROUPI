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
