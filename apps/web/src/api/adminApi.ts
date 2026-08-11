import { apiRequest } from './client';

export type UserStatus = 'PENDING_VALIDATION' | 'ACTIVE' | 'SUSPENDED' | 'DISABLED' | 'ARCHIVED';

export interface AdminUser {
  id: string;
  email: string;
  status: UserStatus;
  roles: string[];
  createdAt: string;
  teacherProfile: { firstName: string; lastName: string; phone: string } | null;
  parentProfile: { firstName: string; lastName: string; phone: string } | null;
}

export interface AccountActionPayload {
  reason: string;
  comment?: string;
}

export function listUsers(accessToken: string, status?: UserStatus): Promise<AdminUser[]> {
  const query = status ? `?status=${status}` : '';
  return apiRequest<AdminUser[]>(`/admin/users${query}`, { accessToken });
}

export function validateUser(accessToken: string, userId: string) {
  return apiRequest(`/admin/users/${userId}/validate`, { method: 'POST', accessToken });
}

export function suspendUser(accessToken: string, userId: string, payload: AccountActionPayload) {
  return apiRequest(`/admin/users/${userId}/suspend`, {
    method: 'POST',
    accessToken,
    body: payload,
  });
}

export function reactivateUser(accessToken: string, userId: string, comment?: string) {
  return apiRequest(`/admin/users/${userId}/reactivate`, {
    method: 'POST',
    accessToken,
    body: comment ? { comment } : {},
  });
}

export function disableUser(accessToken: string, userId: string, payload: AccountActionPayload) {
  return apiRequest(`/admin/users/${userId}/disable`, {
    method: 'POST',
    accessToken,
    body: payload,
  });
}

/** Codes réellement vérifiés par le backend (@RequirePermissions) — pas de catalogue centralisé côté API. */
export const ADMIN_PERMISSIONS: { code: string; label: string }[] = [
  { code: 'ACC_VALIDATE', label: 'Valider / suspendre / réactiver les comptes Professeur et Parent' },
  { code: 'ACC_REASSIGN_STUDENT', label: 'Réaffecter un élève à un nouveau compte Parent' },
  { code: 'REF_CREATE', label: 'Gérer les référentiels (matières, niveaux, établissements)' },
  { code: 'SCH_VALIDATE', label: 'Valider les situations scolaires' },
  { code: 'SCH_ADMIN_OVERRIDE', label: 'Corriger exceptionnellement une situation scolaire clôturée' },
  { code: 'TPR_VALIDATE', label: 'Valider les ajouts de matière/niveau au profil Professeur' },
  { code: 'ABO_VALIDATE', label: 'Valider les abonnements Professeur' },
  { code: 'ABO_SUSPEND', label: 'Suspendre un abonnement' },
  { code: 'ABO_REACTIVATE', label: 'Réactiver un abonnement' },
  { code: 'CPT_ADMIN_ADJUST', label: 'Effectuer des ajustements comptables' },
  { code: 'EXP_EXPORT_DATA', label: 'Générer des exports de données' },
  { code: 'EXP_VIEW_JOURNAL', label: 'Consulter le journal des exports' },
];

export interface InviteAdministratorPayload {
  email: string;
  permissions: string[];
}

export function inviteAdministrator(accessToken: string, payload: InviteAdministratorPayload) {
  return apiRequest(`/admin/administrators/invite`, {
    method: 'POST',
    accessToken,
    body: payload,
  });
}

export function promoteToAdmin(accessToken: string, userId: string, permissions: string[]) {
  return apiRequest(`/admin/administrators/${userId}/promote`, {
    method: 'POST',
    accessToken,
    body: { permissions },
  });
}

export interface AcceptAdministratorInvitationPayload {
  token: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export function acceptAdministratorInvitation(payload: AcceptAdministratorInvitationPayload) {
  return apiRequest(`/admin/administrators/accept-invitation`, {
    method: 'POST',
    body: payload,
  });
}
