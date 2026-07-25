import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import type { Role } from '../api/authApi';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('TEACHER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ email, password, role, firstName, lastName, phone, city });
      navigate('/login', {
        replace: true,
        state: {
          notice:
            'Compte créé. Il doit être validé par un administrateur avant de pouvoir se connecter pleinement.',
        },
      });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Impossible de créer le compte. Veuillez réessayer.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Créer un compte</h1>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="role-toggle" role="radiogroup" aria-label="Type de compte">
          <button
            type="button"
            className={role === 'TEACHER' ? 'active' : ''}
            aria-pressed={role === 'TEACHER'}
            onClick={() => setRole('TEACHER')}
          >
            Professeur
          </button>
          <button
            type="button"
            className={role === 'PARENT' ? 'active' : ''}
            aria-pressed={role === 'PARENT'}
            onClick={() => setRole('PARENT')}
          >
            Parent
          </button>
        </div>

        <label>
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Mot de passe
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <div className="field-row">
          <label>
            Prénom
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </label>
          <label>
            Nom
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </label>
        </div>
        <div className="field-row">
          <label>
            Téléphone
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label>
            Ville
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </label>
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Création...' : 'Créer mon compte'}
        </button>
        <p className="auth-links">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </form>
    </div>
  );
}
