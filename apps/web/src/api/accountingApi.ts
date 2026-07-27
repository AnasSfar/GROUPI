import { apiRequest } from './client';

export type AccountingEntryType = 'PAYMENT' | 'SESSION' | 'ADJUSTMENT' | 'ADMIN_ADJUSTMENT';
export type AccountingEntryDirection = 'CREDIT' | 'DEBIT';
export type AccountingEntryStatus = 'CREATED' | 'POSTED' | 'REVERSED' | 'LOCKED';
export type AccountingAccountStatus = 'CREATED' | 'ACTIVE' | 'LOCKED' | 'CLOSED' | 'ARCHIVED';
export type AdjustmentReason = 'DATA_ENTRY_ERROR' | 'ATTENDANCE_CORRECTION' | 'EXCEPTIONAL_DISCOUNT' | 'ADMIN_CORRECTION';

export interface AccountingEntry {
  id: string;
  entryNumber: string;
  type: AccountingEntryType;
  direction: AccountingEntryDirection;
  status: AccountingEntryStatus;
  amount: number;
  effectiveDate: string;
  sessionId: string | null;
  reason: AdjustmentReason | null;
  reasonNote: string | null;
  paymentMethod: string | null;
  reversesEntryId: string | null;
  authorId: string;
  createdAt: string;
}

export interface AccountingAccountView {
  id: string;
  enrollmentId: string;
  status: AccountingAccountStatus;
  periodId: string;
  student: { id: string; firstName: string; lastName: string };
  group: {
    id: string;
    name: string;
    teacher: { firstName: string; lastName: string };
    subject: { name: string };
  };
  rate: number;
}

export interface AccountIndicators {
  currentBalance: number;
  paidAmount: number;
  invoicedAmount: number;
  remainingToPay: number;
  paymentCount: number;
  averagePaidAmount: number;
  averageInvoicedAmount: number;
  billedSessionCount: number;
  lastPaymentAmount: number | null;
  lastPaymentDate: string | null;
  daysSinceLastPayment: number | null;
  debtAgeDays: number;
  averageBalance: number;
  balanceHistory: { date: string; balance: number }[];
  creditorDays: number;
  debtorDays: number;
  highestCredit: number;
  highestDebt: number;
  adjustmentCount: number;
  lastAdjustment: { date: string; amount: number; direction: AccountingEntryDirection; type: AccountingEntryType } | null;
  totalAdjustmentAmount: number;
  totalDiscountsGranted: number;
  paymentRemindersSent: number;
  daysSinceLastMovement: number | null;
  cancelledPaymentCount: number;
  paymentRate: number | null;
}

export interface AccountDetail {
  account: AccountingAccountView;
  entries: AccountingEntry[];
  indicators: AccountIndicators;
}

export interface ParentChildAccountSummary extends AccountingAccountView {
  currentBalance: number;
}

export function getAccount(accessToken: string, enrollmentId: string): Promise<AccountDetail> {
  return apiRequest<AccountDetail>(`/enrollments/${enrollmentId}/accounting`, { accessToken });
}

export interface RecordPaymentPayload {
  amount: number;
  paymentMethod?: string;
  effectiveDate?: string;
}

export function recordPayment(
  accessToken: string,
  enrollmentId: string,
  payload: RecordPaymentPayload,
): Promise<AccountingEntry> {
  return apiRequest<AccountingEntry>(`/enrollments/${enrollmentId}/accounting/payments`, {
    method: 'POST',
    accessToken,
    body: payload,
  });
}

export function correctPayment(
  accessToken: string,
  enrollmentId: string,
  entryId: string,
  payload: { amount: number; reasonNote: string },
): Promise<AccountingEntry> {
  return apiRequest<AccountingEntry>(`/enrollments/${enrollmentId}/accounting/payments/${entryId}`, {
    method: 'PATCH',
    accessToken,
    body: payload,
  });
}

export function cancelPayment(accessToken: string, enrollmentId: string, entryId: string): Promise<AccountingEntry> {
  return apiRequest<AccountingEntry>(`/enrollments/${enrollmentId}/accounting/payments/${entryId}/cancel`, {
    method: 'POST',
    accessToken,
  });
}

export function sendPaymentReminder(accessToken: string, enrollmentId: string): Promise<{ sent: boolean; balance: number }> {
  return apiRequest(`/enrollments/${enrollmentId}/accounting/reminder`, { method: 'POST', accessToken });
}

export interface CreateAdjustmentPayload {
  sessionId: string;
  direction: AccountingEntryDirection;
  amount: number;
  reason: AdjustmentReason;
  reasonNote: string;
}

export function createAdjustment(
  accessToken: string,
  enrollmentId: string,
  payload: CreateAdjustmentPayload,
): Promise<AccountingEntry> {
  return apiRequest<AccountingEntry>(`/enrollments/${enrollmentId}/accounting/adjustments`, {
    method: 'POST',
    accessToken,
    body: payload,
  });
}

export interface TeacherAccountingIndicators {
  forecastRevenue: number;
  realizedRevenue: number;
  collectedRevenue: number;
  receivableRevenue: number;
  debtorAccountCount: number;
  creditorAccountCount: number;
  averageAccountBalance: number;
  collectionRate: number | null;
  unpaidRate: number | null;
  totalOutstanding: number;
  oldestDebtDays: number;
  paymentsThisMonth: number;
  revenueThisMonth: number;
  revenueThisYear: number;
  alertAccountCount: number;
  averageOutstandingPerEnrollment: number;
  highRiskAccountCount: number;
  averagePaymentAmount: number;
  averageCollectionDelayDays: number | null;
  bestCollectionMonth: string | null;
  worstCollectionMonth: string | null;
  debtRegularizationRate: number | null;
  globalPaymentRate: number | null;
}

export function getTeacherIndicators(accessToken: string): Promise<TeacherAccountingIndicators> {
  return apiRequest<TeacherAccountingIndicators>('/teacher/accounting/indicators', { accessToken });
}

export interface GroupAccountingIndicators {
  billedSessionCount: number;
  totalInvoiced: number;
  totalCollected: number;
  remainingToReceive: number;
  debtorAccountCount: number;
  creditorAccountCount: number;
  averageEnrollmentBalance: number;
  averageLatePaymentDays: number | null;
  groupPaymentRate: number | null;
  averageDebtPerEnrollment: number;
  averageCreditPerEnrollment: number;
  totalDebt: number;
  totalCredit: number;
  groupCollectionRate: number | null;
  debtorRate: number | null;
  creditorRate: number | null;
  averageOutstandingPerEnrollment: number;
  averagePaymentPerEnrollment: number;
  averageInvoicedPerEnrollment: number;
  alertAccountCount: number;
  averageDebtAgeDays: number;
}

export function getGroupIndicators(accessToken: string, groupId: string): Promise<GroupAccountingIndicators> {
  return apiRequest<GroupAccountingIndicators>(`/groups/${groupId}/accounting/indicators`, { accessToken });
}

export function getParentChildSummary(
  accessToken: string,
  studentId: string,
): Promise<ParentChildAccountSummary[]> {
  return apiRequest<ParentChildAccountSummary[]>(`/parent/children/${studentId}/accounting`, { accessToken });
}
