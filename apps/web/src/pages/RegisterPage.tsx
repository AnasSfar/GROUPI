import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import type { Role } from '../api/authApi';
import * as referentialsApi from '../api/referentialsApi';
import type { Subject, SchoolLevel } from '../api/referentialsApi';
import { SchoolLevelSectionPicker } from '../components/SchoolLevelSectionPicker';

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
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // RM-TPR-001/002 : profil minimum d'un Professeur — au moins une matière et un niveau.
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([]);
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [schoolLevelIds, setSchoolLevelIds] = useState<string[]>([]);

  useEffect(() => {
    if (role !== 'TEACHER') return;
    referentialsApi.listSubjects().then(setSubjects).catch(() => setSubjects([]));
    referentialsApi.listSchoolLevels().then(setSchoolLevels).catch(() => setSchoolLevels([]));
  }, [role]);

  function toggleSubject(subjectId: string, checked: boolean) {
    setSubjectIds((prev) => (checked ? [...prev, subjectId] : prev.filter((id) => id !== subjectId)));
  }

  function toggleSchoolLevel(schoolLevelId: string, checked: boolean) {
    setSchoolLevelIds((prev) =>
      checked ? [...prev, schoolLevelId] : prev.filter((id) => id !== schoolLevelId),
    );
  }

  const isTeacher = role === 'TEACHER';
  const teacherRequirementsMet = !isTeacher || (subjectIds.length > 0 && schoolLevelIds.length > 0);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({
        email,
        password,
        role,
        firstName,
        lastName,
        phone,
        city,
        acceptTerms,
        ...(isTeacher ? { subjectIds, schoolLevelIds } : {}),
      });
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
        <img src="/favicon.png" alt="GROUPI" className="auth-logo" />
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

        {isTeacher && (
          <>
            <div className="field-group">
              <span className="field-group-label">Matières enseignées</span>
              <div className="checkbox-grid">
                {subjects.map((subject) => (
                  <label key={subject.id} className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={subjectIds.includes(subject.id)}
                      onChange={(e) => toggleSubject(subject.id, e.target.checked)}
                    />
                    {subject.name}
                  </label>
                ))}
              </div>
              {subjectIds.length === 0 && (
                <p className="form-notice" role="status">
                  Sélectionne au moins une matière.
                </p>
              )}
            </div>

            <div className="field-group">
              <span className="field-group-label">Niveaux scolaires</span>
              <SchoolLevelSectionPicker
                levels={schoolLevels}
                selectedIds={schoolLevelIds}
                onToggle={toggleSchoolLevel}
              />
              {schoolLevelIds.length === 0 && (
                <p className="form-notice" role="status">
                  Sélectionne au moins un niveau scolaire (tu peux en cocher plusieurs, dans
                  plusieurs sections à la fois).
                </p>
              )}
            </div>
          </>
        )}

        <label>
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
          />
          J'accepte les conditions d'utilisation de GROUPI
        </label>

        <button type="submit" disabled={submitting || !acceptTerms || !teacherRequirementsMet}>
          {submitting ? 'Création...' : 'Créer mon compte'}
        </button>
        <p className="auth-links">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </form>
    </div>
  );
}
