import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Placeholder — proves the auth flow works end-to-end (register/login/JWT guard/logout).
 * A real Professeur/Parent dashboard is future work once the domaine Pédagogique API exists.
 */
export function DashboardPage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Tableau de bord</h1>
        <button type="button" onClick={handleLogout}>
          Se déconnecter
        </button>
      </header>
      <p>Connecté en tant que <strong>{currentUser?.email}</strong>.</p>
      {currentUser?.status === 'PENDING_VALIDATION' && (
        <p className="form-notice" role="status">
          Ce compte est en attente de validation par un administrateur.
        </p>
      )}
      {(currentUser?.roles.includes('SUPER_ADMIN') || currentUser?.roles.includes('ADMIN')) && (
        <p>
          <Link to="/admin/users">Gérer les comptes utilisateurs</Link>
        </p>
      )}
      {currentUser?.roles.includes('TEACHER') && (
        <p>
          <Link to="/teacher/profile">Compléter mon profil professeur</Link>
        </p>
      )}
      {currentUser?.roles.includes('PARENT') && (
        <p>
          <Link to="/parent/children">Gérer mes enfants</Link>
        </p>
      )}
      <pre className="debug-panel">{JSON.stringify(currentUser, null, 2)}</pre>
    </div>
  );
}
