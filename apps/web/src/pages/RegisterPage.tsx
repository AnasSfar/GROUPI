import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import type { Role } from '../api/authApi';
import * as referentialsApi from '../api/referentialsApi';
import type { City, School, SchoolLevel, Subject } from '../api/referentialsApi';
import { SchoolLevelSectionPicker } from '../components/SchoolLevelSectionPicker';
import { Select } from '../components/Select';


type SchoolType = School['type'];

function schoolTypeForLevel(level?: SchoolLevel): SchoolType | null {
  if (!level) return null;
  if (level.code.startsWith('PRIM')) return 'PRIMARY';
  if (level.code.startsWith('COL')) return 'COLLEGE';
  return 'HIGH_SCHOOL';
}
export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole: Role = searchParams.get('role')?.toLowerCase() === 'parent' ? 'PARENT' : 'TEACHER';
  const [role, setRole] = useState<Role>(initialRole);
  const [email, setEmail] = useState('');
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

  const [cities, setCities] = useState<City[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [studentFirstName, setStudentFirstName] = useState('');
  const [studentLastName, setStudentLastName] = useState('');
  const [studentLastNameEdited, setStudentLastNameEdited] = useState(false);
  const [studentDateOfBirth, setStudentDateOfBirth] = useState('');
  const [studentSchoolLevelId, setStudentSchoolLevelId] = useState('');
  const [studentCityId, setStudentCityId] = useState('');
  const [studentSchoolId, setStudentSchoolId] = useState('');

  const isTeacher = role === 'TEACHER';
  const isParent = role === 'PARENT';

  useEffect(() => {
    referentialsApi.listSchoolLevels().then(setSchoolLevels).catch(() => setSchoolLevels([]));
  }, []);

  useEffect(() => {
    if (!isTeacher) return;
    referentialsApi.listSubjects().then(setSubjects).catch(() => setSubjects([]));
  }, [isTeacher]);

  useEffect(() => {
    if (!isParent) return;
    referentialsApi.listCities().then(setCities).catch(() => setCities([]));
    referentialsApi.listSchools().then(setSchools).catch(() => setSchools([]));
  }, [isParent]);

  // Simple suggestion, jamais imposée : tant que le parent n'a pas modifié le nom de l'enfant à la
  // main, on lui propose son propre nom de famille (cas le plus fréquent) — dès qu'il tape quoi que
  // ce soit dans ce champ, la synchronisation s'arrête pour ne jamais écraser sa saisie.
  useEffect(() => {
    if (!studentLastNameEdited) {
      setStudentLastName(lastName);
    }
  }, [lastName, studentLastNameEdited]);

  const selectedStudentSchoolLevel = useMemo(
    () => schoolLevels.find((level) => level.id === studentSchoolLevelId),
    [schoolLevels, studentSchoolLevelId],
  );
  const expectedSchoolType = schoolTypeForLevel(selectedStudentSchoolLevel);

  const schoolsForSelectedLevel = useMemo(() => {
    if (!expectedSchoolType) return schools;
    return schools.filter((school) => school.type === expectedSchoolType);
  }, [expectedSchoolType, schools]);

  const availableCities = useMemo(() => {
    if (!expectedSchoolType) return cities;
    const cityIds = new Set(schoolsForSelectedLevel.map((school) => school.cityId));
    return cities.filter((item) => cityIds.has(item.id));
  }, [cities, expectedSchoolType, schoolsForSelectedLevel]);

  const filteredSchools = useMemo(() => {
    if (!studentCityId) return schoolsForSelectedLevel;
    return schoolsForSelectedLevel.filter((school) => school.cityId === studentCityId);
  }, [schoolsForSelectedLevel, studentCityId]);

  useEffect(() => {
    if (studentSchoolId && !filteredSchools.some((school) => school.id === studentSchoolId)) {
      setStudentSchoolId('');
    }
  }, [filteredSchools, studentSchoolId]);
  useEffect(() => {
    if (studentCityId && !availableCities.some((item) => item.id === studentCityId)) {
      setStudentCityId('');
    }
  }, [availableCities, studentCityId]);

  function toggleSubject(subjectId: string, checked: boolean) {
    setSubjectIds((prev) => (checked ? [...prev, subjectId] : prev.filter((id) => id !== subjectId)));
  }

  function toggleSchoolLevel(schoolLevelId: string, checked: boolean) {
    setSchoolLevelIds((prev) =>
      checked ? [...prev, schoolLevelId] : prev.filter((id) => id !== schoolLevelId),
    );
  }

  const teacherRequirementsMet = !isTeacher || (subjectIds.length > 0 && schoolLevelIds.length > 0);
  const parentRequirementsMet =
    !isParent ||
    (studentFirstName.trim() !== '' &&
      studentLastName.trim() !== '' &&
      studentSchoolLevelId !== '' &&
      studentSchoolId !== '');
  /** RM-SEC-001 : le téléphone est l'identifiant de connexion obligatoire. */
  const identifierRequirementsMet = phone.trim() !== '';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({
        ...(email.trim() ? { email: email.trim() } : {}),
        password,
        role,
        firstName,
        lastName,
        phone: phone.trim(),
        city,
        acceptTerms,
        ...(isTeacher ? { subjectIds, schoolLevelIds } : {}),
        ...(isParent
          ? {
              initialStudent: {
                firstName: studentFirstName,
                lastName: studentLastName,
                ...(studentDateOfBirth ? { dateOfBirth: studentDateOfBirth } : {}),
                schoolLevelId: studentSchoolLevelId,
                schoolId: studentSchoolId,
              },
            }
          : {}),
      });
      navigate('/login', {
        replace: true,
        state: {
          notice:
            role === 'TEACHER'
              ? "Compte créé. Un code de vérification vient de vous être envoyé par SMS, et le compte doit être validé par un administrateur."
              : "Compte créé. Un code de vérification vient de vous être envoyé par SMS. Vous pouvez vous connecter avec votre téléphone.",
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
    <div className={`auth-page ${isParent ? 'auth-page-wide' : ''}`}>
      <form className={`auth-card ${isParent ? 'auth-card-wide' : ''}`} onSubmit={handleSubmit}>
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

        <p className="form-hint">
          Vous vous connecterez avec votre téléphone et votre mot de passe. Les champs marqués * sont obligatoires.
        </p>

        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
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

        {isTeacher && (
          <>
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
          </>
        )}

        {isParent && (
          <fieldset className="auth-fieldset">
            <legend>Premier enfant</legend>
            <div className="field-row">
              <label>
                Prénom de l'enfant *
                <input
                  type="text"
                  required
                  value={studentFirstName}
                  onChange={(e) => setStudentFirstName(e.target.value)}
                />
              </label>
              <label>
                Nom de l'enfant *
                <input
                  type="text"
                  required
                  value={studentLastName}
                  onChange={(e) => {
                    setStudentLastName(e.target.value);
                    setStudentLastNameEdited(true);
                  }}
                />
              </label>
            </div>
            <label>
              Date de naissance
              <input
                type="date"
                value={studentDateOfBirth}
                onChange={(e) => setStudentDateOfBirth(e.target.value)}
              />
            </label>
            <label>
              Niveau scolaire *
              <select
                required
                value={studentSchoolLevelId}
                onChange={(e) => setStudentSchoolLevelId(e.target.value)}
              >
                <option value="">Sélectionner un niveau</option>
                {schoolLevels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="field-row">
              <label>
                Ville de l'établissement
                <Select
                  searchable
                  searchPlaceholder="Rechercher une ville..."
                  value={studentCityId}
                  onChange={(e) => setStudentCityId(e.target.value)}
                >
                  <option value="">Toutes les villes</option>
                  {availableCities.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label>
                Établissement *
                <Select
                  searchable
                  searchPlaceholder="Rechercher un établissement..."
                  disabled={!studentSchoolLevelId}
                  value={studentSchoolId}
                  onChange={(e) => setStudentSchoolId(e.target.value)}
                >
                  <option value="">{!studentSchoolLevelId ? "Choisir d abord un niveau" : filteredSchools.length === 0 ? "Aucun établissement compatible" : "Sélectionner un établissement"}</option>
                  {filteredSchools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name} - {school.city.name}
                    </option>
                  ))}
                </Select>
              </label>
            </div>

          </fieldset>
        )}

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
          disabled={
            submitting ||
            !acceptTerms ||
            !teacherRequirementsMet ||
            !parentRequirementsMet ||
            !identifierRequirementsMet
          }
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
              du suivi comptable. Les informations saisies doivent être exactes et concerner vos
              propres enfants ou votre propre activité de professeur.
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
