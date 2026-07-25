import { apiRequest } from './client';
import type { Subject, SchoolLevel, AcademicYear } from './referentialsApi';
import type { TeachingLocation } from './teacherProfileApi';

export type GroupStatus = 'DRAFT' | 'ACTIVE' | 'FULL' | 'SUSPENDED' | 'CLOSED' | 'ARCHIVED';
export type TeachingMode = 'PRESENTIAL' | 'ONLINE';
export type AbsenceBillingPolicy = 'ALL_BILLED' | 'EXCUSED_NOT_BILLED' | 'NONE_BILLED';
export type VisibilityWhenFull = 'VISIBLE' | 'HIDDEN';
export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface GroupScheduleInput {
  dayOfWeek: DayOfWeek;
  startTime: string;
  durationMinutes: number;
  teachingLocationId?: string;
}

export interface GroupSchedule extends GroupScheduleInput {
  id: string;
  teachingLocation: TeachingLocation | null;
}

export interface Group {
  id: string;
  name: string;
  capacity: number;
  publicPrice: string;
  teachingMode: TeachingMode;
  absenceBillingPolicy: AbsenceBillingPolicy;
  abandonmentThreshold: number;
  visibilityWhenFull: VisibilityWhenFull;
  startDate: string;
  endDate: string | null;
  status: GroupStatus;
  subject: Subject;
  schoolLevel: SchoolLevel;
  academicYear: AcademicYear;
  schedules: GroupSchedule[];
  _count: { enrollments: number };
}

export interface PublicGroup {
  id: string;
  name: string;
  subject: Subject;
  schoolLevel: SchoolLevel;
  academicYear: AcademicYear;
  teacher: { firstName: string; lastName: string; city: string };
  publicPrice: string;
  teachingMode: TeachingMode;
  absenceBillingPolicy: AbsenceBillingPolicy;
  capacity: number;
  spotsAvailable: number;
  status: GroupStatus;
  schedules: GroupSchedule[];
  startDate: string;
  endDate: string | null;
}

export interface CreateGroupPayload {
  name: string;
  subjectId: string;
  schoolLevelId: string;
  academicYearId: string;
  capacity: number;
  publicPrice: number;
  teachingMode: TeachingMode;
  absenceBillingPolicy: AbsenceBillingPolicy;
  abandonmentThreshold?: number;
  visibilityWhenFull: VisibilityWhenFull;
  startDate: string;
  endDate?: string;
  schedules: GroupScheduleInput[];
}

export function listMine(accessToken: string): Promise<Group[]> {
  return apiRequest<Group[]>('/groups/mine', { accessToken });
}

export function createGroup(accessToken: string, payload: CreateGroupPayload): Promise<Group> {
  return apiRequest<Group>('/groups', { method: 'POST', accessToken, body: payload });
}

export function openGroup(accessToken: string, groupId: string): Promise<Group> {
  return apiRequest<Group>(`/groups/${groupId}/open`, { method: 'POST', accessToken });
}

export function closeGroup(accessToken: string, groupId: string): Promise<Group> {
  return apiRequest<Group>(`/groups/${groupId}/close`, { method: 'POST', accessToken });
}

export function archiveGroup(accessToken: string, groupId: string): Promise<Group> {
  return apiRequest<Group>(`/groups/${groupId}/archive`, { method: 'POST', accessToken });
}

export function removeGroup(accessToken: string, groupId: string): Promise<{ id: string; deleted: boolean }> {
  return apiRequest(`/groups/${groupId}`, { method: 'DELETE', accessToken });
}

export function searchGroups(
  accessToken: string,
  filters: { subjectId?: string; schoolLevelId?: string; city?: string },
): Promise<PublicGroup[]> {
  const params = new URLSearchParams();
  if (filters.subjectId) params.set('subjectId', filters.subjectId);
  if (filters.schoolLevelId) params.set('schoolLevelId', filters.schoolLevelId);
  if (filters.city) params.set('city', filters.city);
  const query = params.toString();
  return apiRequest<PublicGroup[]>(`/groups/search${query ? `?${query}` : ''}`, { accessToken });
}
