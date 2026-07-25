/**
 * Low-level HTTP helper for the GROUPI API.
 *
 * All calls go through the same-origin `/api/v1` path, which Vite's dev server proxies to the
 * NestJS backend (see vite.config.ts). This avoids needing CORS configured on apps/api.
 */
export const API_BASE_URL = '/api/v1';

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message?: unknown }).message;
    if (Array.isArray(message)) return message.join(' ');
    if (typeof message === 'string') return message;
  }
  return fallback;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Bearer token to attach, if the endpoint requires authentication. */
  accessToken?: string | null;
}

/**
 * Calls the API and returns the parsed JSON body. Throws ApiError (with the API's own message,
 * e.g. "Identifiants invalides") on any non-2xx response so callers can show it to the user.
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Impossible de contacter le serveur. Vérifiez votre connexion.');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    throw new ApiError(response.status, extractMessage(data, `Une erreur est survenue (${response.status}).`), data);
  }

  return data as T;
}
