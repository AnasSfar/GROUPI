import { apiRequest } from './client';

/** Self-registration n'existe plus que pour TEACHER (Avenant 01, Ch. A.2/D.2) — un Parent
 * n'entre dans GROUPI que via un lien d'invitation. Admin/SuperAdmin ne sont jamais self-created. */
export type Role = 'TEACHER' | 'PARENT';

export interface RegisterPayload {
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  acceptTerms: boolean;
  /** RM-TPR-001 */
  subjectIds: string[];
  schoolLevelIds: string[];
}

export interface RegisterResponse {
  id: string;
  phone: string | null;
  status: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface CurrentUser {
  id: string;
  /** Admin/Super Admin uniquement (Ch. H) — null pour un Professeur/Parent (Ch. I.1). */
  email: string | null;
  phone: string | null;
  roles: string[];
  status: string;
  administratorPermissions: string[] | null;
}

export function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>('/auth/register', { method: 'POST', body: payload });
}

/** RM-SEC-001 : `identifier` est le téléphone (Professeur/Parent) ou l'e-mail (Admin, Ch. H). */
export function login(identifier: string, password: string): Promise<TokenPair> {
  return apiRequest<TokenPair>('/auth/login', { method: 'POST', body: { identifier, password } });
}

export function refreshTokens(refreshToken: string): Promise<TokenPair> {
  return apiRequest<TokenPair>('/auth/refresh', { method: 'POST', body: { refreshToken } });
}

export function logout(refreshToken: string): Promise<void> {
  return apiRequest<void>('/auth/logout', { method: 'POST', body: { refreshToken } });
}

export function fetchCurrentUser(accessToken: string): Promise<CurrentUser> {
  return apiRequest<CurrentUser>('/auth/me', { accessToken });
}

/** Always resolves — the API returns 204 whether or not the identifier is registered (never reveals existence). */
export function forgotPassword(identifier: string): Promise<void> {
  return apiRequest<void>('/auth/forgot-password', { method: 'POST', body: { identifier } });
}

export function resetPassword(token: string, newPassword: string): Promise<void> {
  return apiRequest<void>('/auth/reset-password', { method: 'POST', body: { token, newPassword } });
}

/** Ch.6.12/8.8 — désactivation du compte par son propre titulaire (révoque les sessions côté API). */
export function deactivateMe(accessToken: string): Promise<void> {
  return apiRequest<void>('/auth/me/deactivate', { method: 'POST', accessToken });
}

export interface RequestDeletionResponse {
  anonymized: boolean;
  deleted: boolean;
}

/** RM-CYC-013/018 — suppression logique du compte utilisateur. */
export function requestDeletion(accessToken: string): Promise<RequestDeletionResponse> {
  return apiRequest<RequestDeletionResponse>('/auth/me/request-deletion', { method: 'POST', accessToken });
}

/** §9.6, RM-SEC-020/036 — déconnecte toutes les sessions du compte (tous appareils confondus). */
export function logoutAll(accessToken: string): Promise<void> {
  return apiRequest<void>('/auth/logout-all', { method: 'POST', accessToken });
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

/** RM-SEC-017/033 — déconnecte toutes les sessions en même temps que le changement de mot de passe. */
export function changePassword(accessToken: string, payload: ChangePasswordPayload): Promise<void> {
  return apiRequest<void>('/auth/change-password', { method: 'POST', accessToken, body: payload });
}

export interface LoginHistoryEntry {
  id: string;
  success: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

/** §9.10, RM-SEC-026/027/028 — journal des connexions du titulaire du compte, non modifiable. */
export function fetchLoginHistory(accessToken: string): Promise<LoginHistoryEntry[]> {
  return apiRequest<LoginHistoryEntry[]>('/auth/me/login-history', { accessToken });
}

export interface AssistedResetLinkResponse {
  token: string;
  url: string;
  expiresAt: string;
}

/** Ch. I.3 : reset assisté — un Professeur (pour l'un de ses Parents) ou un Administrateur
 * (pour n'importe quel compte) génère un lien de réinitialisation à transmettre hors bande. */
export function generateAssistedResetLink(accessToken: string, targetUserId: string): Promise<AssistedResetLinkResponse> {
  return apiRequest<AssistedResetLinkResponse>(`/auth/users/${targetUserId}/assisted-reset-link`, {
    method: 'POST',
    accessToken,
  });
}

export interface AddRolePayload {
  /** Le rôle métier à ajouter au compte actif (l'autre que celui déjà détenu). */
  role: Role;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  /** RM-TPR-001 : requis lorsque `role === 'TEACHER'`. */
  subjectIds?: string[];
  schoolLevelIds?: string[];
}

export interface AddRoleResponse {
  id: string;
  phone: string | null;
  status: string;
  roles: string[];
}

/** RM-ACC-002 : cumul de rôles — ajoute Professeur ou Parent au compte déjà titulaire de l'autre. */
export function addRole(accessToken: string, payload: AddRolePayload): Promise<AddRoleResponse> {
  return apiRequest<AddRoleResponse>('/auth/me/add-role', { method: 'POST', accessToken, body: payload });
}
