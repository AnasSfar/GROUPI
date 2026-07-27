/**
 * Low-level HTTP helper for the GROUPI API.
 *
 * All calls go through the same-origin `/api/v1` path, which Vite's dev server proxies to the
 * NestJS backend (see vite.config.ts). This avoids needing CORS configured on apps/api.
 */
export const API_BASE_URL = '/api/v1';

const ACCESS_TOKEN_KEY = 'groupi.accessToken';
const REFRESH_TOKEN_KEY = 'groupi.refreshToken';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function getStoredTokens() {
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  };
}

/** Refresh tokens rotate server-side on every /auth/refresh call — always persist the new pair. */
export function storeTokens(tokens: TokenPair) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearStoredTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/** Dispatched when a request's 401 couldn't be recovered via refresh — AuthContext listens and
 *  clears its session state so ProtectedRoute redirects to /login on the next render. */
export const SESSION_EXPIRED_EVENT = 'groupi:session-expired';

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
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Bearer token to attach, if the endpoint requires authentication. */
  accessToken?: string | null;
  /** Internal — set when retrying after a token refresh, to avoid retry loops. */
  _isRetry?: boolean;
}

let refreshInFlight: Promise<string | null> | null = null;

/** Refreshes the access token at most once even if several requests 401 at the same time. */
function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const { refreshToken } = getStoredTokens();
      if (!refreshToken) return null;
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!response.ok) return null;
        const tokens = (await response.json()) as TokenPair;
        storeTokens(tokens);
        return tokens.accessToken;
      } catch {
        return null;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/**
 * Calls the API and returns the parsed JSON body. Throws ApiError (with the API's own message,
 * e.g. "Identifiants invalides") on any non-2xx response so callers can show it to the user.
 *
 * On a 401 from an authenticated call (not /auth/refresh itself), transparently refreshes the
 * access token once and retries — access tokens are short-lived (15 min) and most pages don't
 * otherwise reload often enough to hit /auth/me's own refresh-on-load check.
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

  if (response.status === 401 && options.accessToken && !options._isRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiRequest<T>(path, { ...options, accessToken: newToken, _isRetry: true });
    }
    clearStoredTokens();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
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
