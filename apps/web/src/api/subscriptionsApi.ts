import { apiRequest } from './client';

export interface SubscriptionPlan {
  id: string;
  code: 'DECOUVERTE' | 'INTERMEDIAIRE' | 'PRO';
  name: string;
  price: number;
  maxActiveEnrollments: number | null;
  durationDays: number | null;
  isTrial: boolean;
}

export type SubscriptionStatus = 'PENDING_PAYMENT' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';

export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  requestedAt: string;
  activatedAt: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  suspensionReason: string | null;
  plan: SubscriptionPlan;
  academicYear: { id: string; label: string; status: 'OPEN' | 'CLOSED'; endDate: string };
  teacher: { id: string; firstName: string; lastName: string; user: { email: string } };
}

export function listPlans(accessToken: string): Promise<SubscriptionPlan[]> {
  return apiRequest<SubscriptionPlan[]>('/subscriptions/plans', { accessToken });
}

export function listMine(accessToken: string): Promise<Subscription[]> {
  return apiRequest<Subscription[]>('/subscriptions/mine', { accessToken });
}

export function subscribe(
  accessToken: string,
  payload: { planId: string; academicYearId: string },
): Promise<Subscription> {
  return apiRequest<Subscription>('/subscriptions', { method: 'POST', accessToken, body: payload });
}

/** RM-SUB-012/013 — changement d'offre en cours d'année pour l'abonnement actif du Professeur. */
export function changePlan(accessToken: string, newPlanId: string): Promise<Subscription> {
  return apiRequest<Subscription>('/subscriptions/change-plan', {
    method: 'POST',
    accessToken,
    body: { newPlanId },
  });
}

/** PERM-ABO-005/006/007 — réservé Super Admin / Admin délégué. */
export function listAll(accessToken: string, status?: SubscriptionStatus): Promise<Subscription[]> {
  const query = status ? `?status=${status}` : '';
  return apiRequest<Subscription[]>(`/admin/subscriptions${query}`, { accessToken });
}

export function validatePayment(accessToken: string, id: string): Promise<Subscription> {
  return apiRequest<Subscription>(`/admin/subscriptions/${id}/validate-payment`, { method: 'POST', accessToken });
}

export function suspend(accessToken: string, id: string, reason?: string): Promise<Subscription> {
  return apiRequest<Subscription>(`/admin/subscriptions/${id}/suspend`, {
    method: 'POST',
    accessToken,
    body: { reason },
  });
}

export function reactivate(accessToken: string, id: string): Promise<Subscription> {
  return apiRequest<Subscription>(`/admin/subscriptions/${id}/reactivate`, { method: 'POST', accessToken });
}
