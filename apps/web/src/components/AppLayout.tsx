import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as notificationsApi from '../api/notificationsApi';
import { IconBell, IconLogOut } from './icons';

const UNREAD_POLL_INTERVAL_MS = 30_000;

/** Ossature commune aux pages authentifiées : logo + identité + déconnexion, toujours visibles. */
export function AppLayout() {
  const { currentUser, logout, getAccessToken } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const token = getAccessToken();
      if (!token) return;
      try {
        const { count } = await notificationsApi.getUnreadCount(token);
        if (!cancelled) setUnreadCount(count);
      } catch {
        // Ch.18 : le centre d'activités n'est jamais bloquant — un échec de sondage reste silencieux.
      }
    }
    poll();
    const interval = setInterval(poll, UNREAD_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [getAccessToken]);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <>
      <nav className="app-nav">
        <div className="app-nav-inner">
          <Link to="/dashboard" className="app-nav-brand">
            <img src="/favicon.png" alt="" />
            <span>GROUPI</span>
          </Link>
          <div className="app-nav-user">
            {currentUser && <strong>{currentUser.email}</strong>}
            <Link to="/notifications" className="nav-bell ghost" aria-label="Centre d’activités">
              <IconBell width={16} height={16} />
              {unreadCount > 0 && (
                <span className="nav-bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </Link>
            <button type="button" className="ghost" onClick={handleLogout} aria-label="Se déconnecter">
              <IconLogOut width={16} height={16} />
            </button>
          </div>
        </div>
      </nav>
      <main className="app-main">
        <div className="app-main-inner">
          <Outlet />
        </div>
      </main>
    </>
  );
}
