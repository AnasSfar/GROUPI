import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { LogoTransition } from '../components/LogoTransition';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const notice = (location.state as { notice?: string } | null)?.notice ?? null;
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(identifier, password);
      setJustLoggedIn(true);
      // On profite de l'attente de la transition pour précharger le chunk du tableau de bord :
      // il apparaît instantanément à la navigation au lieu d'afficher son propre "Chargement...".
      import('./DashboardPage');
      // L'overlay reste plein-opaque jusqu'à la navigation elle-même (pas de fondu de sortie
      // avant) : le faire disparaître avant de naviguer laissait réapparaître le formulaire de
      // connexion dessous pendant ce court instant — exactement le "flash de l'autre page" à
      // éviter. Le remplacement overlay -> nouvelle page reste net, mais ne montre plus jamais
      // un écran intermédiaire non désiré.
      setTimeout(() => navigate('/dashboard', { replace: true }), 2500);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Impossible de se connecter. Veuillez réessayer.',
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      {justLoggedIn && (
        <LogoTransition message="Connexion réussie" subMessage="Redirection vers votre espace..." />
      )}
      <form className="auth-card" onSubmit={handleSubmit}>
        <img src="/favicon.png" alt="GROUPI" className="auth-logo" />
        <h1>Connexion</h1>
        {notice && (
          <p className="form-notice" role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <label>
          Email ou téléphone
          <input
            type="text"
            required
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </label>
        <label>
          Mot de passe
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Connexion...' : 'Se connecter'}
        </button>
        <p className="auth-links">
          <Link to="/forgot-password">Mot de passe oublié ?</Link>
        </p>
        <p className="auth-links">
          Pas encore de compte ? <Link to="/register">Créer un compte</Link>
        </p>
      </form>
    </div>
  );
}
