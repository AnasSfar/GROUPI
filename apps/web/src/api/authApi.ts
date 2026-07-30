import { apiRequest } from './client';

/** Self-registration is only ever TEACHER or PARENT — Admin/SuperAdmin accounts are never self-created. */
export type Role = 'TEACHER' | 'PARENT';

export interface InitialStudentPayload {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  schoolLevelId: string;
  schoolId: string;
  schoolClass?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  acceptTerms: boolean;
  /** RM-TPR-001 : requis lorsque `role === 'TEACHER'`. */
  subjectIds?: string[];
  schoolLevelIds?: string[];
}

export interface RegisterResponse {
  id: string;
  email: string;
  status: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  roles: string[];
  status: string;
  administratorPermissions: string[] | null;
  emailVerifiedAt: string | null;
}

export function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>('/auth/register', { method: 'POST', body: payload });
}

export function login(email: string, password: string): Promise<TokenPair> {
  return apiRequest<TokenPair>('/auth/login', { method: 'POST', body: { email, password } });
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

/** Always resolves — the API returns 204 whether or not the email is registered (never reveals existence). */
export function forgotPassword(email: string): Promise<void> {
  return apiRequest<void>('/auth/forgot-password', { method: 'POST', body: { email } });
}

export function resetPassword(token: string, newPassword: string): Promise<void> {
  return apiRequest<void>('/auth/reset-password', { method: 'POST', body: { token, newPassword } });
}

/** Ch.6.12/8.8 — désactivation du compte par son propre titulaire (révoque les sessions côté API). */
export function deactivateMe(accessToken: string): Promise<void> {
  return apiRequest<void>('/auth/me/deactivate', { method: 'POST', accessToken });
}

/** Ch.9.5, ERR-SEC-012 — lien reçu par e-mail à l'inscription. */
export function verifyEmail(token: string): Promise<void> {
  return apiRequest<void>('/auth/verify-email', { method: 'POST', body: { token } });
}

export function resendVerificationEmail(accessToken: string): Promise<void> {
  return apiRequest<void>('/auth/resend-verification', { method: 'POST', accessToken });
}
