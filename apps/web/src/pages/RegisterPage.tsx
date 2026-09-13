import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as referentialsApi from '../api/referentialsApi';
import type { SchoolLevel, Subject } from '../api/referentialsApi';
import { SchoolLevelSectionPicker } from '../components/SchoolLevelSectionPicker';

/**
 * Avenant 01, Ch. A.2/D.2 : l'auto-inscription en libre-service n'existe plus que pour le
 * Professeur — un Parent n'entre dans GROUPI que via le lien d'invitation d'un Professeur.
 */
export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // RM-TPR-001/002 : profil minimum d'un Professeur - au moins une matière et un niveau.
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([]);
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [schoolLevelIds, setSchoolLevelIds] = useState<string[]>([]);

  useEffect(() => {
    referentialsApi.listSchoolLevels().then(setSchoolLevels).catch(() => setSchoolLevels([]));
    referentialsApi.listSubjects().then(setSubjects).catch(() => setSubjects([]));
  }, []);

  function toggleSubject(subjectId: string, checked: boolean) {
    setSubjectIds((prev) => (checked ? [...prev, subjectId] : prev.filter((id) => id !== subjectId)));
  }

  function toggleSchoolLevel(schoolLevelId: string, checked: boolean) {
    setSchoolLevelIds((prev) =>
      checked ? [...prev, schoolLevelId] : prev.filter((id) => id !== schoolLevelId),
    );
  }

  const teacherRequirementsMet = subjectIds.length > 0 && schoolLevelIds.length > 0;
  /** RM-SEC-001 : le téléphone est l'identifiant de connexion obligatoire. */
  const identifierRequirementsMet = phone.trim() !== '';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({
        password,
        firstName,
        lastName,
        phone: phone.trim(),
        city,
        acceptTerms,
        subjectIds,
        schoolLevelIds,
      });
      navigate('/login', {
        replace: true,
        state: {
          notice: 'Compte créé. Il doit maintenant être validé par un administrateur avant de pouvoir se connecter.',
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
        <h1>Créer mon compte Professeur</h1>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <p className="form-hint">
          Vous vous connecterez avec votre téléphone et votre mot de passe. Les champs marqués * sont obligatoires.
        </p>
        <p className="form-hint">
          Un Parent ne crée pas de compte ici : il rejoint GROUPI via le lien d'invitation que vous lui partagez
          une fois votre profil validé.
        </p>

        <label>
          Mot de passe *
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
            Prénom *
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </label>
          <label>
            Nom *
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
            Téléphone *
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label>
            Ville *
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </label>
        </div>

        <div className="field-group">
          <span className="field-group-label">Matières enseignées *</span>
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
          <span className="field-group-label">Niveaux scolaires *</span>
          <SchoolLevelSectionPicker
            levels={schoolLevels}
            selectedIds={schoolLevelIds}
            onToggle={toggleSchoolLevel}
          />
          {schoolLevelIds.length === 0 && (
            <p className="form-notice" role="status">
              Sélectionne au moins un niveau scolaire.
            </p>
          )}
        </div>

        <div className="terms-row" onClick={() => setShowTerms(true)}>
          <input
            type="checkbox"
            checked={acceptTerms}
            readOnly
            aria-label="Conditions d'utilisation acceptées"
          />
          <span>
            J'accepte les{' '}
            <button type="button" className="terms-link" onClick={() => setShowTerms(true)}>
              conditions d'utilisation
            </button>{' '}
            de GROUPI
          </span>
        </div>

        <button
          type="submit"
          disabled={submitting || !acceptTerms || !teacherRequirementsMet || !identifierRequirementsMet}
        >
          {submitting ? 'Création...' : 'Créer mon compte'}
        </button>
        <p className="auth-links">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </form>

      {showTerms && (
        <div className="terms-modal-backdrop" role="presentation" onClick={() => setShowTerms(false)}>
          <section
            className="terms-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="terms-title">Conditions d'utilisation de GROUPI</h2>
            <p>
              GROUPI facilite la gestion des cours particuliers, des inscriptions, des présences et
              du suivi comptable. Les informations saisies doivent être exactes et concerner votre
              propre activité de professeur.
            </p>
            <p>
              L'utilisateur s'engage à utiliser la plateforme de manière loyale, à respecter la
              confidentialité des données consultées et à signaler toute information incorrecte.
            </p>
            <p>
              La création du compte reste soumise à validation. GROUPI peut suspendre ou refuser un
              compte en cas d'usage abusif ou d'informations manifestement incorrectes.
            </p>
            <div className="terms-modal-actions">
              <button type="button" className="ghost" onClick={() => setShowTerms(false)}>
                Fermer
              </button>
              <button
                type="button"
                onClick={() => {
                  setAcceptTerms(true);
                  setShowTerms(false);
                }}
              >
                Accepter
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
