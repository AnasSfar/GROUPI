import { apiRequest } from './client';
import type { TeacherAccountingIndicators, AccountingEntry, AccountingAccountView, ParentChildAccountSummary } from './accountingApi';
import type { AbandonmentAlert, AttendanceStudentStats, ParentAttendanceEntry } from './attendanceApi';

export interface DashboardAlert {
  level: 'CRITICAL' | 'IMPORTANT' | 'INFORMATION';
  code: string;
  message: string;
}

export interface DashboardSessionSummary {
  id: string;
  date: string;
  startTime: string;
  status: string;
  group: { id: string; name: string };
}

export interface DebtorAccountEntry {
  account: AccountingAccountView;
  balance: number;
  alert: boolean;
}

export interface RecentPaymentEntry extends AccountingEntry {
  account: AccountingAccountView;
}

export interface GroupOccupancyView {
  id: string;
  name: string;
  subject: string;
  schoolLevel: string;
  status: string;
  capacity: number;
  activeCount: number;
  occupancyRate: number;
  category: 'FULL' | 'NEARLY_FULL' | 'NEEDS_STUDENTS' | 'NORMAL' | 'OTHER';
}

export interface TeacherStatistics {
  available: boolean;
  message?: string;
  totalGroups?: number;
  totalActiveStudents?: number;
  revenueThisMonth?: number;
  revenueThisYear?: number;
  bestCollectionMonth?: string | null;
  worstCollectionMonth?: string | null;
  debtRegularizationRate?: number | null;
  averageAttendanceRate?: number | null;
}

export interface TeacherDashboard {
  activity: {
    activeGroupsCount: number;
    totalActiveStudents: number;
    todaysSessions: DashboardSessionSummary[];
    upcomingSessions: DashboardSessionSummary[];
    pendingEnrollmentsCount: number;
    pendingGroupChangesCount: number;
  };
  presences: {
    absencesToday: number;
    latesToday: number;
    frequentlyAbsentStudents: (AbandonmentAlert & { groupId: string; groupName: string })[];
    abandonmentAlerts: (AbandonmentAlert & { groupId: string; groupName: string })[];
  };
  accounting: TeacherAccountingIndicators;
  payments: {
    debtorAccounts: DebtorAccountEntry[];
    negativeBalanceAccounts: DebtorAccountEntry[];
    recentPayments: RecentPaymentEntry[];
  };
  groups: GroupOccupancyView[];
  profile: {
    completenessScore: number;
    missingFields: string[];
    profileStatus: string;
    accountStatus: string;
    pendingAdminValidation: boolean;
  };
  statistics: TeacherStatistics;
  export: { available: boolean; message?: string };
  preEnrollments: {
    receivedCount: number;
    pendingCount: number;
    mostRequestedLevels: { label: string; count: number }[];
    mostRequestedSubjects: { label: string; count: number }[];
  };
  alerts: DashboardAlert[];
}

export interface ParentChildDashboard {
  student: { id: string; firstName: string; lastName: string };
  groups: {
    enrollmentId: string;
    group: {
      id: string;
      name: string;
      subject: string;
      schoolLevel: string;
      teacher: { firstName: string; lastName: string };
      teachingMode: string;
    };
  }[];
  upcomingSessions: (DashboardSessionSummary & { canReportAbsence: boolean; absenceReported: boolean })[];
  cancelledOrPostponedSessions: DashboardSessionSummary[];
  accounts: ParentChildAccountSummary[];
  globalBalance: number;
  recentComments: { id: string; body: string; authorRole: string; createdAt: string; groupName: string }[];
  attendanceSummary: AttendanceStudentStats;
  recentAttendance: ParentAttendanceEntry[];
}

export interface ParentDashboard {
  multipleChildren: boolean;
  children: ParentChildDashboard[];
  alerts: DashboardAlert[];
}

export interface AdminDashboard {
  overview: {
    activeTeacherCount: number;
    activeParentCount: number;
    activeGroupCount: number;
    activeStudentCount: number;
    activeEnrollmentCount: number;
  };
  generalStatistics: AdminDashboard['overview'];
  referentials: {
    subjectCount: number;
    schoolLevelCount: number;
    schoolCount: number;
    openAcademicYearCount: number;
  };
  pendingAccountValidations: { id: string; email: string; roles: string[]; createdAt: string }[] | null;
  pendingSchoolSituations: { id: string; studentId: string; createdAt: string }[] | null;
  subscriptions: { pendingPaymentCount: number; activeCount: number; suspendedCount: number; expiredCount: number } | null;
  auditLog: { totalCount: number; recent: { id: string; action: string; targetType: string; targetId: string; userId: string | null; createdAt: string }[] } | null;
  alerts: DashboardAlert[];
  totalAdminsCount?: number;
}

export function getTeacherDashboard(accessToken: string): Promise<TeacherDashboard> {
  return apiRequest<TeacherDashboard>('/dashboard/teacher', { accessToken });
}

export function getParentDashboard(accessToken: string): Promise<ParentDashboard> {
  return apiRequest<ParentDashboard>('/dashboard/parent', { accessToken });
}

export function getAdminDashboard(accessToken: string): Promise<AdminDashboard> {
  return apiRequest<AdminDashboard>('/dashboard/admin', { accessToken });
}

export function getSuperAdminDashboard(accessToken: string): Promise<AdminDashboard> {
  return apiRequest<AdminDashboard>('/dashboard/super-admin', { accessToken });
}

export interface UserDashboardView {
  role: 'TEACHER' | 'PARENT' | 'ADMIN';
  dashboard: TeacherDashboard | ParentDashboard | AdminDashboard;
}

/** RM-DSH-008 : lecture seule, réservée au Super Admin. */
export function getUserDashboard(accessToken: string, userId: string): Promise<UserDashboardView> {
  return apiRequest<UserDashboardView>(`/dashboard/users/${userId}`, { accessToken });
}
