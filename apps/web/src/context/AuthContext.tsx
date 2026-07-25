import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError } from '../api/client';
import * as authApi from '../api/authApi';
import type { CurrentUser, RegisterPayload, RegisterResponse, TokenPair } from '../api/authApi';

/**
 * SECURITY NOTE: tokens are kept in localStorage for simplicity, at this dev stage of the SPA.
 * This is vulnerable to XSS (any injected script can read localStorage and steal both tokens).
 * A production-hardened version would move the refresh token to an httpOnly + Secure cookie
 * issued by the backend — that requires backend changes and is out of scope here, since
 * apps/api's /auth/refresh currently expects the refresh token in the request body.
 */
const ACCESS_TOKEN_KEY = 'groupi.accessToken';
const REFRESH_TOKEN_KEY = 'groupi.refreshToken';

function readTokens() {
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  };
}

function writeTokens(tokens: TokenPair) {
  // Refresh tokens rotate server-side on every /auth/refresh call — always persist the new pair,
  // the old refresh token stops working immediately.
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  currentUser: CurrentUser | null;
  status: SessionStatus;
  login: (email: string, password: string) => Promise<void>;
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

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.login(email, password);
    writeTokens(tokens);
    const me = await authApi.fetchCurrentUser(tokens.accessToken);
    setCurrentUser(me);
    setStatus('authenticated');
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    return authApi.register(payload);
  }, []);

  const logout = useCallback(async () => {
    const { refreshToken } = readTokens();
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
