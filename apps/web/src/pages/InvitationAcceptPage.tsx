import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError, storeTokens } from '../api/client';
import * as parentInvitationsApi from '../api/parentInvitationsApi';
import * as parentProfileApi from '../api/parentProfileApi';
import * as referentialsApi from '../api/referentialsApi';
import type { InvitationPreview } from '../api/parentInvitationsApi';
import type { Student } from '../api/parentProfileApi';
import type { City, School, SchoolLevel } from '../api/referentialsApi';
import { Select } from '../components/Select';

type SchoolType = School['type'];

function schoolTypeForLevel(level?: SchoolLevel): SchoolType | null {
  if (!level) return null;
  if (level.code.startsWith('PRIM')) return 'PRIMARY';
  if (level.code.startsWith('COL')) return 'COLLEGE';
  return 'HIGH_SCHOOL';
}

/**
 * Avenant 01, Ch. A.3.2/A.3.3 — page publique de consultation et de consommation du lien
 * d'invitation d'un Professeur. Cas 1 (visiteur anonyme) : création du compte Parent (téléphone
 * seul, RM-INV-007). Cas 2 (Parent déjà connecté) : ajout ou rattachement d'un enfant uniquement.
 */
export function InvitationAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { currentUser, getAccessToken } = useAuth();
  const isParentLoggedIn = !!currentUser?.roles.includes('PARENT');

  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);

  // Cas 1 — création de compte
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Enfant
  const [childMode, setChildMode] = useState<'NEW' | 'EXISTING'>('NEW');
  const [existingStudents, setExistingStudents] = useState<Student[]>([]);
  const [existingStudentId, setExistingStudentId] = useState('');

  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [studentFirstName, setStudentFirstName] = useState('');
  const [studentLastName, setStudentLastName] = useState('');
  const [studentDateOfBirth, setStudentDateOfBirth] = useState('');
  const [studentSchoolLevelId, setStudentSchoolLevelId] = useState('');
  const [studentCityId, setStudentCityId] = useState('');
  const [studentSchoolId, setStudentSchoolId] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    parentInvitationsApi
      .preview(token)
      .then(setPreview)
      .catch((err) => setPreviewError(err instanceof ApiError ? err.message : 'Lien d’invitation invalide.'))
      .finally(() => setLoadingPreview(false));
  }, [token]);

  useEffect(() => {
    referentialsApi.listSchoolLevels().then(setSchoolLevels).catch(() => setSchoolLevels([]));
    referentialsApi.listCities().then(setCities).catch(() => setCities([]));
    referentialsApi.listSchools().then(setSchools).catch(() => setSchools([]));
  }, []);

  useEffect(() => {
    if (!isParentLoggedIn) return;
    const accessToken = getAccessToken();
    if (!accessToken) return;
    parentProfileApi
      .listStudents(accessToken)
      .then((students) => {
        setExistingStudents(students.filter((s) => s.status === 'ACTIVE'));
        setChildMode(students.length > 0 ? 'EXISTING' : 'NEW');
      })
      .catch(() => setExistingStudents([]));
  }, [isParentLoggedIn, getAccessToken]);

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

  const accountValid =
    isParentLoggedIn || (phone.trim() !== '' && firstName.trim() !== '' && lastName.trim() !== '' && city.trim() !== '' && password.length >= 8 && acceptTerms);
  const childValid =
    childMode === 'EXISTING'
      ? existingStudentId !== ''
      : studentFirstName.trim() !== '' && studentLastName.trim() !== '' && studentSchoolLevelId !== '' && studentSchoolId !== '';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await parentInvitationsApi.accept(
        token,
        {
          ...(isParentLoggedIn
            ? {}
            : { phone: phone.trim(), firstName, lastName, city, password, acceptTerms }),
          ...(childMode === 'EXISTING'
            ? { studentId: existingStudentId }
            : {
                studentFirstName,
                studentLastName,
                ...(studentDateOfBirth ? { studentDateOfBirth } : {}),
                schoolLevelId: studentSchoolLevelId,
                schoolId: studentSchoolId,
              }),
        },
        isParentLoggedIn ? getAccessToken() : undefined,
      );

      if (result.tokens) {
        // Cas 1 : nouveau compte — on installe la session puis on recharge l'app pour que
        // AuthProvider relise localStorage (voir sa logique de démarrage).
        storeTokens(result.tokens);
        window.location.assign('/dashboard');
        return;
      }
      // Cas 2 : déjà connecté — retour à l'espace enfants.
      navigate('/parent/children', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de finaliser l'inscription.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingPreview) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (previewError || !preview) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <img src="/favicon.png" alt="GROUPI" className="auth-logo" />
          <h1>Lien d'invitation</h1>
          <p className="form-error" role="alert">
            {previewError ?? 'Ce lien est invalide.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page auth-page-wide">
      <form className="auth-card auth-card-wide" onSubmit={handleSubmit}>
        <img src="/favicon.png" alt="GROUPI" className="auth-logo" />
        <h1>Bienvenue sur GROUPI</h1>
        <p>
          <strong>
            {preview.teacherFirstName} {preview.teacherLastName}
          </strong>{' '}
          vous invite à suivre la scolarité de votre enfant sur GROUPI — année académique{' '}
          {preview.academicYearLabel}.
          {preview.groupName && (
            <>
              {' '}
              Votre enfant rejoindra directement le groupe « {preview.groupName} » si son niveau
              scolaire correspond.
            </>
          )}
        </p>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {!isParentLoggedIn && (
          <fieldset className="auth-fieldset">
            <legend>Votre compte Parent</legend>
            <p className="form-hint">Aucun e-mail requis : votre numéro de téléphone est votre identifiant.</p>
            <div className="field-row">
              <label>
                Prénom *
                <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </label>
              <label>
                Nom *
                <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </label>
            </div>
            <div className="field-row">
              <label>
                Téléphone *
                <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <label>
                Ville *
                <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} />
              </label>
            </div>
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
            <label className="terms-row">
              <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
              <span>J'accepte les conditions d'utilisation de GROUPI</span>
            </label>
          </fieldset>
        )}

        <fieldset className="auth-fieldset">
          <legend>Votre enfant</legend>

          {isParentLoggedIn && existingStudents.length > 0 && (
            <div className="role-toggle" role="radiogroup" aria-label="Enfant">
              <button type="button" className={childMode === 'EXISTING' ? 'active' : ''} onClick={() => setChildMode('EXISTING')}>
                Enfant déjà déclaré
              </button>
              <button type="button" className={childMode === 'NEW' ? 'active' : ''} onClick={() => setChildMode('NEW')}>
                Nouvel enfant
              </button>
            </div>
          )}

          {childMode === 'EXISTING' ? (
            <label>
              Enfant *
              <select required value={existingStudentId} onChange={(e) => setExistingStudentId(e.target.value)}>
                <option value="">Sélectionner un enfant</option>
                {existingStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                    {s.currentSchoolSituation ? ` (${s.currentSchoolSituation.schoolLevel.name})` : ''}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <div className="field-row">
                <label>
                  Prénom de l'enfant *
                  <input type="text" required value={studentFirstName} onChange={(e) => setStudentFirstName(e.target.value)} />
                </label>
                <label>
                  Nom de l'enfant *
                  <input type="text" required value={studentLastName} onChange={(e) => setStudentLastName(e.target.value)} />
                </label>
              </div>
              <label>
                Date de naissance
                <input type="date" value={studentDateOfBirth} onChange={(e) => setStudentDateOfBirth(e.target.value)} />
              </label>
              <label>
                Niveau scolaire *
                <select required value={studentSchoolLevelId} onChange={(e) => setStudentSchoolLevelId(e.target.value)}>
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
                  <Select searchable searchPlaceholder="Rechercher une ville..." value={studentCityId} onChange={(e) => setStudentCityId(e.target.value)}>
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
                    <option value="">
                      {!studentSchoolLevelId ? "Choisir d'abord un niveau" : 'Sélectionner un établissement'}
                    </option>
                    {filteredSchools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name} - {school.city.name}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
            </>
          )}
        </fieldset>

        <button type="submit" disabled={submitting || !accountValid || !childValid}>
          {submitting ? 'Envoi...' : isParentLoggedIn ? 'Ajouter cet enfant' : 'Créer mon compte'}
        </button>
        {!isParentLoggedIn && (
          <p className="auth-links">
            Déjà un compte GROUPI ? Connectez-vous puis rouvrez ce lien.
          </p>
        )}
      </form>
    </div>
  );
}
