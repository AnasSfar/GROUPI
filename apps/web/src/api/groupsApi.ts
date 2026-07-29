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

export const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Lundi',
  TUESDAY: 'Mardi',
  WEDNESDAY: 'Mercredi',
  THURSDAY: 'Jeudi',
  FRIDAY: 'Vendredi',
  SATURDAY: 'Samedi',
  SUNDAY: 'Dimanche',
};

/** "90" -> "1h30", "60" -> "1h", "45" -> "45min" — durée lisible plutôt qu'un nombre brut de minutes. */
export function formatDuration(durationMinutes: number): string {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h${String(minutes).padStart(2, '0')}`;
}

/** Ch.10.3/13 : "Lundi 17:00 (1h)" — jour + horaire d'un créneau du planning hebdomadaire. */
export function formatSchedules(
  schedules: { dayOfWeek: DayOfWeek; startTime: string; durationMinutes: number }[],
): string {
  if (schedules.length === 0) return '—';
  return schedules
    .map((s) => `${DAY_LABELS[s.dayOfWeek]} ${s.startTime} (${formatDuration(s.durationMinutes)})`)
    .join(', ');
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
  /** Ch.10.6/RM-TPR-014 : l'effectif/capacité d'un groupe est une donnée privée du Professeur. */
  hasAvailableSpots: boolean;
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

export interface UpdateGroupPayload {
  name?: string;
  capacity?: number;
  publicPrice?: number;
  absenceBillingPolicy?: AbsenceBillingPolicy;
  abandonmentThreshold?: number;
  debtAlertThresholdSessions?: number;
  visibilityWhenFull?: VisibilityWhenFull;
  endDate?: string;
  schedules?: GroupScheduleInput[];
  /**
   * ERR-GRP-016/017 : requis uniquement si la modification de `schedules` touche des séances
   * futures déjà planifiées — `true` = les conserver telles quelles, `false` = les supprimer pour
   * qu'elles soient régénérées depuis le nouveau planning. Omis si l'API n'a pas encore signalé de
   * conflit (voir le message d'erreur ERR-GRP-016/ERR-GRP-017 côté client).
   */
  keepFutureSessions?: boolean;
}

export function listMine(accessToken: string): Promise<Group[]> {
  return apiRequest<Group[]>('/groups/mine', { accessToken });
}

export function createGroup(accessToken: string, payload: CreateGroupPayload): Promise<Group> {
  return apiRequest<Group>('/groups', { method: 'POST', accessToken, body: payload });
}

export function updateGroup(
  accessToken: string,
  groupId: string,
  payload: UpdateGroupPayload,
): Promise<Group> {
  return apiRequest<Group>(`/groups/${groupId}`, { method: 'PATCH', accessToken, body: payload });
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
