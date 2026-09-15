import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ApiError,
  SESSION_EXPIRED_EVENT,
  clearStoredTokens as clearTokens,
  getStoredTokens as readTokens,
  storeTokens as writeTokens,
} from '../api/client';
import * as authApi from '../api/authApi';
import * as pushApi from '../api/pushApi';
import type { CurrentUser, RegisterPayload, RegisterResponse } from '../api/authApi';

/**
 * SECURITY NOTE: on native (Android/iOS builds via Capacitor), tokens are stored via
 * @capacitor/preferences (see api/client.ts) — outside the WebView's JS-accessible storage, so
 * an XSS payload can no longer read them directly. On the plain web SPA, tokens still live in
 * localStorage for simplicity and remain vulnerable to XSS. A fuller hardening would move the
 * refresh token to an httpOnly + Secure cookie issued by the backend — that requires backend
 * changes and is out of scope here, since apps/api's /auth/refresh currently expects the refresh
 * token in the request body.
 */

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  currentUser: CurrentUser | null;
  status: SessionStatus;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  /** Reads straight from storage (not React state) — always the latest token, even right after a refresh. */
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');

  /**
   * Loads the session from whatever is in localStorage. If the access token is expired,
   * retries once via /auth/refresh before giving up (simple retry-once pattern, no queue/mutex).
   */
  const loadCurrentUser = useCallback(async () => {
    const { accessToken, refreshToken } = readTokens();
    if (!accessToken) {
      setCurrentUser(null);
      setStatus('unauthenticated');
      return;
    }
    try {
      const me = await authApi.fetchCurrentUser(accessToken);
      setCurrentUser(me);
      setStatus('authenticated');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401 && refreshToken) {
        try {
          const tokens = await authApi.refreshTokens(refreshToken);
          writeTokens(tokens);
          const me = await authApi.fetchCurrentUser(tokens.accessToken);
          setCurrentUser(me);
          setStatus('authenticated');
          return;
        } catch {
          // Refresh failed too (expired/invalid) — fall through and clear the session below.
        }
      }
      clearTokens();
      setCurrentUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    function handleSessionExpired() {
      setCurrentUser(null);
      setStatus('unauthenticated');
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const tokens = await authApi.login(identifier, password);
    writeTokens(tokens);
    const me = await authApi.fetchCurrentUser(tokens.accessToken);
    setCurrentUser(me);
    setStatus('authenticated');
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    return authApi.register(payload);
  }, []);

  const logout = useCallback(async () => {
    const { accessToken, refreshToken } = readTokens();
    // Best-effort, avant de vider le token : sans ça on ne peut plus s'authentifier pour désenregistrer
    // ce token push (voir PushNotificationSettings, qui l'enregistre sous cette même clé localStorage).
    const lastPushToken = localStorage.getItem('groupi.pushToken');
    if (accessToken && lastPushToken) {
      try {
        await pushApi.unregisterToken(accessToken, lastPushToken);
        localStorage.removeItem('groupi.pushToken');
      } catch {
        /* ignore */
      }
    }
    clearTokens();
    setCurrentUser(null);
    setStatus('unauthenticated');
    if (refreshToken) {
      // Best-effort: the local session is already cleared regardless of whether this succeeds.
      try {
        await authApi.logout(refreshToken);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const getAccessToken = useCallback(() => readTokens().accessToken, []);

  const value = useMemo(
    () => ({ currentUser, status, login, register, logout, getAccessToken }),
    [currentUser, status, login, register, logout, getAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
