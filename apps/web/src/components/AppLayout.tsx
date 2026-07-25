import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconLogOut } from './icons';

/** Ossature commune aux pages authentifiées : logo + identité + déconnexion, toujours visibles. */
export function AppLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

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
