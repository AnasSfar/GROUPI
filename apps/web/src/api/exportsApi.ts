import { apiRequest, API_BASE_URL } from './client';

export type ExportType =
  | 'GROUPS'
  | 'STUDENTS'
  | 'ATTENDANCE'
  | 'LATENESS'
  | 'PEDAGOGICAL_COMMENTS'
  | 'ACCOUNTING_ACCOUNTS'
  | 'PAYMENTS'
  | 'STATISTICS'
  | 'DASHBOARD_INDICATORS'
  | 'ADMIN_STATISTICS'
  | 'RGPD_PERSONAL_DATA';

export type ExportFormat = 'PDF' | 'EXCEL' | 'CSV';
export type ExportJobStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED' | 'EXPIRED';

export interface ExportJob {
  id: string;
  type: ExportType;
  format: ExportFormat;
  status: ExportJobStatus;
  fileName: string | null;
  fileSize: number | null;
  rowCount: number | null;
  isAsync: boolean;
  errorMessage: string | null;
  createdAt: string;
  readyAt: string | null;
  expiresAt: string | null;
  downloadedAt: string | null;
}

export interface CreateExportPayload {
  type: ExportType;
  format: ExportFormat;
  groupIds?: string[];
  studentId?: string;
  subjectId?: string;
  schoolLevelId?: string;
  academicYearId?: string;
  dateFrom?: string;
  dateTo?: string;
  period?: 'CURRENT_YEAR' | 'ALL';
}

export function createExport(accessToken: string, payload: CreateExportPayload): Promise<ExportJob> {
  return apiRequest<ExportJob>('/exports', { method: 'POST', accessToken, body: payload });
}

export function listMine(accessToken: string): Promise<ExportJob[]> {
  return apiRequest<ExportJob[]>('/exports', { accessToken });
}

export function getOne(accessToken: string, id: string): Promise<ExportJob> {
  return apiRequest<ExportJob>(`/exports/${id}`, { accessToken });
}

function filenameFromDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const match = /filename="?([^"]+)"?/.exec(header);
  return match ? match[1] : fallback;
}

/** RM-EXP-015 : lien de téléchargement personnel — déclenche l'enregistrement navigateur. */
export async function downloadExport(accessToken: string, id: string, fallbackName = 'export'): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/exports/${id}/download`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    let message = `Téléchargement impossible (${response.status}).`;
    try {
      const data = (await response.json()) as { message?: string | string[] };
      if (data?.message) message = Array.isArray(data.message) ? data.message.join(' ') : data.message;
    } catch {
      // Réponse non-JSON : on garde le message générique.
    }
    throw new Error(message);
  }
  const blob = await response.blob();
  const fileName = filenameFromDisposition(response.headers.get('Content-Disposition'), fallbackName);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// --- Administrateur (PERM-EXP-001/002) -----------------------------------------------------------

export function createAdminExport(accessToken: string, payload: CreateExportPayload & { teacherId?: string }): Promise<ExportJob> {
  return apiRequest<ExportJob>('/admin/exports', { method: 'POST', accessToken, body: payload });
}

export interface ExportAuditEntry {
  id: string;
  type: ExportType;
  format: ExportFormat;
  outcome: string;
  refusalReason: string | null;
  createdAt: string;
  user: { email: string; roles: string[] };
}

export function listJournal(accessToken: string): Promise<ExportAuditEntry[]> {
  return apiRequest<ExportAuditEntry[]>('/admin/exports/journal', { accessToken });
}

// --- Portabilité RGPD (Ch.17.4 dernier §) --------------------------------------------------------

export type DataPortabilityStatus = 'PENDING' | 'FULFILLED';

export interface DataPortabilityRequest {
  id: string;
  status: DataPortabilityStatus;
  requestedAt: string;
  dueAt: string;
  fulfilledAt: string | null;
  exportJobId: string | null;
  user?: { email: string };
}

export function requestDataPortability(accessToken: string): Promise<DataPortabilityRequest> {
  return apiRequest<DataPortabilityRequest>('/data-portability-requests', { method: 'POST', accessToken });
}

export function listMyDataPortabilityRequests(accessToken: string): Promise<DataPortabilityRequest[]> {
  return apiRequest<DataPortabilityRequest[]>('/data-portability-requests/me', { accessToken });
}

export function listDataPortabilityQueue(accessToken: string): Promise<DataPortabilityRequest[]> {
  return apiRequest<DataPortabilityRequest[]>('/admin/data-portability-requests', { accessToken });
}

export function fulfillDataPortabilityRequest(
  accessToken: string,
  id: string,
  format: ExportFormat = 'CSV',
): Promise<DataPortabilityRequest> {
  return apiRequest<DataPortabilityRequest>(`/admin/data-portability-requests/${id}/fulfill`, {
    method: 'POST',
    accessToken,
    body: { format },
  });
}
