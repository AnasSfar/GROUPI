import { apiRequest } from './client';

/** Avenant 01, Ch. A — lien d'invitation général et réutilisable d'un Professeur. */
export interface ParentInvitation {
  id: string;
  /** Ch. A (extension) : renseigné si ce lien cible directement un groupe standard précis. */
  groupId: string | null;
  status: 'ACTIVE' | 'DISABLED' | 'EXPIRED';
  expiresAt: string | null;
  rotatedAt: string | null;
  createdAt: string;
  /** RM-INV-003 : jeton en clair — visible uniquement dans l'espace du Professeur émetteur. */
  token: string;
  /** URL publique complète à copier / partager (`/invitation/:token`). */
  url: string;
}

export interface InvitationPreview {
  teacherFirstName: string;
  teacherLastName: string;
  academicYearLabel: string;
  groupId: string | null;
  groupName: string | null;
}

export interface AcceptInvitationPayload {
  // Cas 1 — nouveau Parent (ignoré si déjà connecté)
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  password?: string;
  acceptTerms?: boolean;
  // Enfant : existant (cas 2) ou nouveau
  studentId?: string;
  studentFirstName?: string;
  studentLastName?: string;
  studentDateOfBirth?: string;
  schoolId?: string;
  schoolLevelId?: string;
  schoolClass?: string;
}

export interface AcceptInvitationResponse {
  tokens: { accessToken: string; refreshToken: string } | null;
  student: { id: string; firstName: string; lastName: string };
  attached: boolean;
}

// --- Espace Professeur ---

export function getMine(accessToken: string): Promise<ParentInvitation> {
  return apiRequest<ParentInvitation>('/teacher/invitation', { accessToken });
}

export function rotate(accessToken: string): Promise<ParentInvitation> {
  return apiRequest<ParentInvitation>('/teacher/invitation/rotate', { method: 'POST', accessToken });
}

export function disable(accessToken: string): Promise<ParentInvitation> {
  return apiRequest<ParentInvitation>('/teacher/invitation/disable', { method: 'POST', accessToken });
}

export function enable(accessToken: string): Promise<ParentInvitation> {
  return apiRequest<ParentInvitation>('/teacher/invitation/enable', { method: 'POST', accessToken });
}

// --- Lien ciblant directement un groupe standard (nouvel élève en cours d'année) ---

export function getForGroup(accessToken: string, groupId: string): Promise<ParentInvitation> {
  return apiRequest<ParentInvitation>(`/teacher/invitation/group/${groupId}`, { accessToken });
}

export function rotateForGroup(accessToken: string, groupId: string): Promise<ParentInvitation> {
  return apiRequest<ParentInvitation>(`/teacher/invitation/group/${groupId}/rotate`, {
    method: 'POST',
    accessToken,
  });
}

export function disableForGroup(accessToken: string, groupId: string): Promise<ParentInvitation> {
  return apiRequest<ParentInvitation>(`/teacher/invitation/group/${groupId}/disable`, {
    method: 'POST',
    accessToken,
  });
}

export function enableForGroup(accessToken: string, groupId: string): Promise<ParentInvitation> {
  return apiRequest<ParentInvitation>(`/teacher/invitation/group/${groupId}/enable`, {
    method: 'POST',
    accessToken,
  });
}

// --- Page publique ---

export function preview(token: string): Promise<InvitationPreview> {
  return apiRequest<InvitationPreview>(`/public/invitations/${token}`);
}

/** Détection en direct pendant la saisie du téléphone (cas 1) — évite de laisser l'utilisateur
 *  remplir tout le formulaire avant de découvrir au submit qu'un compte existe déjà. */
export function checkPhoneExists(phone: string): Promise<{ exists: boolean }> {
  return apiRequest<{ exists: boolean }>(`/public/invitations/phone-check?phone=${encodeURIComponent(phone)}`);
}

/** Optionnel : accessToken du Parent déjà connecté (cas 2) — omis pour un visiteur anonyme (cas 1). */
export function accept(
  token: string,
  payload: AcceptInvitationPayload,
  accessToken?: string | null,
): Promise<AcceptInvitationResponse> {
  return apiRequest<AcceptInvitationResponse>(`/public/invitations/${token}/accept`, {
    method: 'POST',
    body: payload,
    accessToken: accessToken ?? undefined,
  });
}

/** Ch. A.3.1 : message pré-rempli pour le partage manuel WhatsApp (`wa.me`), jamais automatique. */
export function whatsAppShareUrl(url: string, teacherName: string): string {
  const text = `Bonjour ! ${teacherName} vous invite à créer votre compte parent GROUPI pour suivre la scolarité de votre enfant. Cliquez sur ce lien pour commencer : ${url}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
