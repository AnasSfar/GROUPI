import { apiRequest } from './client';
import type { SessionStatus } from './sessionsApi';
import type { TeachingMode } from './groupsApi';

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'EXCUSED_ABSENT' | 'UNEXCUSED_ABSENT';
export type AttendanceStatsPeriod = 'GROUP' | 'ACADEMIC_YEAR' | 'LAST_30_DAYS';

export interface AttendanceView {
  id: string;
  status: AttendanceStatus;
  statusLabel: string;
  lateDuration: number | null;
  /** RM-ATT-019 : durée effective de connexion (minutes), pertinente uniquement pour une séance en ligne. */
  onlineDurationMinutes: number | null;
  comment: string | null;
  recordedAt: string;
  recordedById: string;
  modifiedAt: string | null;
  billable: boolean;
}

export interface SessionAttendanceSummary {
  id: string;
  groupId: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  teachingMode: TeachingMode;
  status: SessionStatus;
  lockDeadline: string | null;
  locked: boolean;
}

export interface AttendanceEntry {
  enrollmentId: string;
  student: { id: string; firstName: string; lastName: string };
  attendance: AttendanceView | null;
}

export interface SessionAttendanceView {
  session: SessionAttendanceSummary;
  entries: AttendanceEntry[];
}

export interface SetAttendancePayload {
  status: AttendanceStatus;
  lateDuration?: number;
  /** RM-ATT-019 : ignorée côté service si la séance n'est pas en mode ONLINE. */
  onlineDurationMinutes?: number;
  comment?: string;
  reason?: string;
}

export interface AbandonmentAlert {
  student: { id: string; firstName: string; lastName: string };
  enrollmentId: string;
  consecutiveUnexcusedAbsences: number;
}

export interface AttendanceStudentStats {
  student: { id: string; firstName: string; lastName: string };
  totalSessions: number;
  present: number;
  late: number;
  excusedAbsences: number;
  unexcusedAbsences: number;
  attendanceRate: number | null;
}

export interface RegisterEntry extends AttendanceView {
  session: { id: string; date: string; startTime: string; status: SessionStatus };
  student: { id: string; firstName: string; lastName: string };
}

export interface ParentAttendanceEntry extends AttendanceView {
  session: { id: string; date: string; startTime: string };
  group: { id: string; name: string };
}

export interface ParentAttendanceView {
  summary: AttendanceStudentStats;
  entries: ParentAttendanceEntry[];
}

export function getSessionAttendance(accessToken: string, sessionId: string): Promise<SessionAttendanceView> {
  return apiRequest<SessionAttendanceView>(`/sessions/${sessionId}/attendance`, { accessToken });
}

export function setAttendance(
  accessToken: string,
  sessionId: string,
  studentId: string,
  payload: SetAttendancePayload,
): Promise<AttendanceView> {
  return apiRequest<AttendanceView>(`/sessions/${sessionId}/attendance/${studentId}`, {
    method: 'PUT',
    accessToken,
    body: payload,
  });
}

export function resetAttendance(
  accessToken: string,
  sessionId: string,
  studentId: string,
): Promise<{ studentId: string; reset: boolean }> {
  return apiRequest(`/sessions/${sessionId}/attendance/${studentId}`, { method: 'DELETE', accessToken });
}

export function validateAttendance(accessToken: string, sessionId: string): Promise<SessionAttendanceView> {
  return apiRequest<SessionAttendanceView>(`/sessions/${sessionId}/attendance/validate`, {
    method: 'POST',
    accessToken,
  });
}

export function getAbandonmentAlerts(accessToken: string, groupId: string): Promise<AbandonmentAlert[]> {
  return apiRequest<AbandonmentAlert[]>(`/groups/${groupId}/attendance/abandonment-alerts`, { accessToken });
}

export function getGroupStats(
  accessToken: string,
  groupId: string,
  period: AttendanceStatsPeriod = 'GROUP',
): Promise<AttendanceStudentStats[]> {
  return apiRequest<AttendanceStudentStats[]>(`/groups/${groupId}/attendance/stats?period=${period}`, {
    accessToken,
  });
}

export function getRegister(accessToken: string, groupId: string): Promise<RegisterEntry[]> {
  return apiRequest<RegisterEntry[]>(`/groups/${groupId}/attendance/register`, { accessToken });
}

export function getChildAttendance(accessToken: string, studentId: string): Promise<ParentAttendanceView> {
  return apiRequest<ParentAttendanceView>(`/parent/children/${studentId}/attendance`, { accessToken });
}
