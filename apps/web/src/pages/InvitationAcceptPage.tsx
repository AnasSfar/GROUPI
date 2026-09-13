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
import { IconDownload } from '../components/icons';

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

  // Écran d'accueil avant le formulaire : la majorité des familles qui ouvrent ce lien n'ont pas
  // encore de compte, donc on ne les jette pas directement dans un formulaire — on les rassure
  // d'abord (marque GROUPI, choix explicite "j'ai déjà un compte" vs "je n'en ai pas").
  const [entered, setEntered] = useState(false);
  const [welcomeSettled, setWelcomeSettled] = useState(false);

  useEffect(() => {
    if (isParentLoggedIn) return;
    const timer = setTimeout(() => setWelcomeSettled(true), 700);
    return () => clearTimeout(timer);
  }, [isParentLoggedIn]);

  // Cas 1 — création de compte
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  /** Détection en direct d'un compte existant pendant la saisie du téléphone — dès qu'un match est
   *  trouvé, on arrête la création et on propose la connexion plutôt que de laisser le formulaire
   *  échouer au submit (ERR-SEC-050). */
  const [phoneAccountExists, setPhoneAccountExists] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);

  // Enfant
  const [childMode, setChildMode] = useState<'NEW' | 'EXISTING'>('NEW');
  const [existingStudents, setExistingStudents] = useState<Student[]>([]);
  const [existingStudentId, setExistingStudentId] = useState('');

  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [studentFirstName, setStudentFirstName] = useState('');
  const [studentLastName, setStudentLastName] = useState('');
  const [studentLastNameTouched, setStudentLastNameTouched] = useState(false);
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

  // Cas 1 uniquement : dès que le téléphone ressemble à un numéro complet, on vérifie côté serveur
  // si un compte existe déjà — évite de laisser la famille remplir tout le formulaire pour rien.
  useEffect(() => {
    if (isParentLoggedIn) return;
    const trimmed = phone.trim();
    if (trimmed.length < 8) {
      setPhoneAccountExists(false);
      return;
    }
    let cancelled = false;
    setCheckingPhone(true);
    const timer = setTimeout(() => {
      parentInvitationsApi
        .checkPhoneExists(trimmed)
        .then((result) => {
          if (!cancelled) setPhoneAccountExists(result.exists);
        })
        .catch(() => {
          if (!cancelled) setPhoneAccountExists(false);
        })
        .finally(() => {
          if (!cancelled) setCheckingPhone(false);
        });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [phone, isParentLoggedIn]);

  // Le nom de l'enfant s'écrit en même temps que celui du parent (cas fréquent), tant que la famille
  // n'a pas modifié ce champ elle-même directement.
  useEffect(() => {
    if (!studentLastNameTouched) setStudentLastName(lastName);
  }, [lastName, studentLastNameTouched]);

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
    isParentLoggedIn ||
    (!phoneAccountExists &&
      phone.trim() !== '' &&
      firstName.trim() !== '' &&
      lastName.trim() !== '' &&
      city.trim() !== '' &&
      password.length >= 8 &&
      acceptTerms);
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

  if (!isParentLoggedIn && !entered) {
    return (
      <div className="auth-page">
        <div className="invite-welcome">
          <div className={`invite-welcome-logo${welcomeSettled ? ' is-settled' : ''}`}>
            <img src="/favicon.png" alt="GROUPI" />
          </div>
          <div className={`invite-welcome-options${welcomeSettled ? ' is-visible' : ''}`}>
            <h1>Bienvenue sur GROUPI</h1>
            <p>Suivez la scolarité de votre enfant : présences, groupes, paiements, tout au même endroit.</p>
            <button type="button" className="btn-primary invite-welcome-cta" onClick={() => setEntered(true)}>
              Je n'ai pas encore de compte
            </button>
            <button type="button" className="ghost-link" onClick={() => navigate('/login')}>
              J'ai déjà un compte — Se connecter
            </button>
            <div className="invite-welcome-store">
              <IconDownload aria-hidden="true" />
              <span>Bientôt disponible sur Google Play</span>
            </div>
          </div>
        </div>
      </div>
    );
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
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
              <label>
                Ville *
                <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} />
              </label>
            </div>

            {phoneAccountExists ? (
              <div className="alert-banner alert-banner-info phone-exists-banner" role="alert">
                <h3>Un compte existe déjà avec ce numéro</h3>
                <p>
                  Connectez-vous plutôt pour retrouver votre espace — vous pourrez ensuite ajouter
                  cet enfant depuis votre compte.
                </p>
                <button type="button" className="btn-primary" onClick={() => navigate('/login')}>
                  Se connecter
                </button>
              </div>
            ) : (
              <>
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
                <div className="terms-row" onClick={() => setShowTerms(true)}>
                  <input type="checkbox" checked={acceptTerms} readOnly aria-label="Conditions d'utilisation acceptées" />
                  <span>
                    J'accepte les{' '}
                    <button type="button" className="terms-link" onClick={() => setShowTerms(true)}>
                      conditions d'utilisation
                    </button>{' '}
                    de GROUPI
                  </span>
                </div>
              </>
            )}
          </fieldset>
        )}

        {!phoneAccountExists && (
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
                  <input
                    type="text"
                    required
                    value={studentLastName}
                    onChange={(e) => {
                      setStudentLastName(e.target.value);
                      setStudentLastNameTouched(true);
                    }}
                  />
                </label>
              </div>
              <label>
                Date de naissance
                <input type="date" value={studentDateOfBirth} onChange={(e) => setStudentDateOfBirth(e.target.value)} />
              </label>
              <label>
                Niveau scolaire *
                <Select
                  searchable
                  searchPlaceholder="Rechercher un niveau..."
                  value={studentSchoolLevelId}
                  onChange={(e) => setStudentSchoolLevelId(e.target.value)}
                >
                  <option value="">Sélectionner un niveau</option>
                  {schoolLevels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </Select>
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
        )}

        {!phoneAccountExists && (
          <button type="submit" disabled={submitting || !accountValid || !childValid || checkingPhone}>
            {submitting ? 'Envoi...' : isParentLoggedIn ? 'Ajouter cet enfant' : 'Créer mon compte'}
          </button>
        )}
        {!isParentLoggedIn && !phoneAccountExists && (
          <p className="auth-links">
            Déjà un compte GROUPI ? Connectez-vous puis rouvrez ce lien.
          </p>
        )}
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
              propre enfant.
            </p>
            <p>
              L'utilisateur s'engage à utiliser la plateforme de manière loyale, à respecter la
              confidentialité des données consultées et à signaler toute information incorrecte.
            </p>
            <p>
              GROUPI peut suspendre ou refuser un compte en cas d'usage abusif ou d'informations
              manifestement incorrectes.
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
