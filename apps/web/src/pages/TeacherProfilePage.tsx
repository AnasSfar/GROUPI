import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Select } from '../components/Select';
import { SchoolLevelSectionPicker } from '../components/SchoolLevelSectionPicker';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { ApiError } from '../api/client';
import * as referentialsApi from '../api/referentialsApi';
import * as teacherProfileApi from '../api/teacherProfileApi';
import type { Subject, SchoolLevel, SubjectLevelPair } from '../api/referentialsApi';
import type { TeacherProfile, TeacherProfileStatus, TeachingLocation } from '../api/teacherProfileApi';

const PROFILE_STATUS_LABELS: Record<TeacherProfileStatus, string> = {
  DRAFT: 'Profil brouillon',
  PENDING_VALIDATION: 'Profil en attente de validation',
  VALIDATED: 'Profil validé',
};

const PROFILE_STATUS_BADGE: Record<TeacherProfileStatus, string> = {
  DRAFT: 'badge-neutral',
  PENDING_VALIDATION: 'badge-warning',
  VALIDATED: 'badge-success',
};

const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Compte actif',
  PENDING_VALIDATION: 'Compte en attente',
  SUSPENDED: 'Compte suspendu',
  DISABLED: 'Compte désactivé',
};

function accountStatusBadge(status: string | undefined): string {
  if (status === 'ACTIVE') return 'badge-success';
  if (status === 'PENDING_VALIDATION') return 'badge-warning';
  return 'badge-neutral';
}

const EXPERIENCE_INSTITUTION_PREFIX = 'Etablissement : ';

function parseExperience(value: string | null): { institution: string; details: string } {
  if (!value) return { institution: '', details: '' };
  const [firstLine, ...rest] = value.split('\n');
  if (!firstLine.startsWith(EXPERIENCE_INSTITUTION_PREFIX)) {
    return { institution: '', details: value };
  }
  return {
    institution: firstLine.slice(EXPERIENCE_INSTITUTION_PREFIX.length),
    details: rest.join('\n').trimStart(),
  };
}

function formatExperience(institution: string, details: string): string {
  const cleanInstitution = institution.trim();
  const cleanDetails = details.trim();
  return [cleanInstitution ? `${EXPERIENCE_INSTITUTION_PREFIX}${cleanInstitution}` : '', cleanDetails]
    .filter(Boolean)
    .join('\n\n');
}

export function TeacherProfilePage() {
  const { currentUser, getAccessToken } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([]);
  const [subjectLevels, setSubjectLevels] = useState<SubjectLevelPair[]>([]);
  const [locations, setLocations] = useState<TeachingLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState('');
  const [teachingInstitution, setTeachingInstitution] = useState('');
  const [experience, setExperience] = useState('');

  const [subjectToAdd, setSubjectToAdd] = useState('');
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [draftLevelIds, setDraftLevelIds] = useState<string[]>([]);
  const [savingLevels, setSavingLevels] = useState(false);
  const [locationLabel, setLocationLabel] = useState('');
  const [locationAddress, setLocationAddress] = useState('');

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [me, allSubjects, allLevels, allSubjectLevels, allLocations] = await Promise.all([
        teacherProfileApi.getMyProfile(token),
        referentialsApi.listSubjects(token),
        referentialsApi.listSchoolLevels(token),
        referentialsApi.listSubjectLevels(token),
        teacherProfileApi.listLocations(token),
      ]);
      setProfile(me);
      setSubjects(allSubjects);
      setSchoolLevels(allLevels);
      setSubjectLevels(allSubjectLevels);
      setLocations(allLocations);
      setDraftLevelIds(me.schoolLevels.map(({ schoolLevel }) => schoolLevel.id));
      setBio(me.bio ?? '');
      setPhoto(me.photo ?? '');
      const parsedExperience = parseExperience(me.experience);
      setTeachingInstitution(parsedExperience.institution);
      setExperience(parsedExperience.details);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger le profil.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function runAction(action: () => Promise<TeacherProfile>) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      const updated = await action();
      setProfile(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "L'opération a échoué.");
    }
  }

  async function handleSaveInfo() {
    const token = getAccessToken();
    if (!token || !profile) return;
    if (draftLevelIds.length === 0) {
      setError('Sélectionne au moins un niveau scolaire avant d’enregistrer.');
      return;
    }

    setSavingLevels(true);
    setError(null);
    try {
      let updated = await teacherProfileApi.updateMyProfile(token, {
        bio,
        photo,
        experience: formatExperience(teachingInstitution, experience),
      });
      updated = await saveDraftLevels(token, updated);
      setProfile(updated);
      showToast('Profil enregistré');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'enregistrer le profil.");
    } finally {
      setSavingLevels(false);
    }
  }

  async function handleAddSubject(subjectId = subjectToAdd) {
    const token = getAccessToken();
    if (!token || !subjectId) return;
    setError(null);
    try {
      const updated = await teacherProfileApi.addSubject(token, subjectId);
      setProfile(updated);
      setSubjectToAdd('');
      setShowSubjectPicker(false);
      showToast('Matière ajoutée');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'ajouter cette matière.");
    }
  }

  function handleRemoveSubject(subjectId: string) {
    const token = getAccessToken();
    if (!token) return;
    runAction(() => teacherProfileApi.removeSubject(token, subjectId));
  }
  function handleToggleLevel(schoolLevelId: string, checked: boolean) {
    setDraftLevelIds((prev) =>
      checked ? Array.from(new Set([...prev, schoolLevelId])) : prev.filter((id) => id !== schoolLevelId),
    );
  }

  async function saveDraftLevels(token: string, baseProfile: TeacherProfile): Promise<TeacherProfile> {
    const persistedLevelIds = baseProfile.schoolLevels.map(({ schoolLevel }) => schoolLevel.id);
    const levelsToAdd = draftLevelIds.filter((id) => !persistedLevelIds.includes(id));
    const levelsToRemove = persistedLevelIds.filter((id) => !draftLevelIds.includes(id));

    let updated = baseProfile;
    for (const levelId of levelsToAdd) {
      updated = await teacherProfileApi.addSchoolLevel(token, levelId);
    }
    for (const levelId of levelsToRemove) {
      updated = await teacherProfileApi.removeSchoolLevel(token, levelId);
    }
    setDraftLevelIds(updated.schoolLevels.map(({ schoolLevel }) => schoolLevel.id));
    return updated;
  }
  async function handleAddLocation(event: FormEvent) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token || !locationLabel) return;
    setError(null);
    try {
      const created = await teacherProfileApi.createLocation(token, {
        label: locationLabel,
        address: locationAddress || undefined,
      });
      setLocations((prev) => [...prev, created]);
      setLocationLabel('');
      setLocationAddress('');
      showToast('Lieu ajouté');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'ajouter ce lieu.");
    }
  }

  async function handleRemoveLocation(location: TeachingLocation) {
    const token = getAccessToken();
    if (!token) return;
    const ok = await confirm({
      title: `Retirer « ${location.label} » ?`,
      message:
        'Ce lieu ne sera plus proposé pour de nouveaux créneaux. Les groupes qui l’utilisent déjà ne sont pas affectés.',
      confirmLabel: 'Retirer',
      danger: true,
    });
    if (!ok) return;
    setError(null);
    try {
      await teacherProfileApi.deactivateLocation(token, location.id);
      setLocations((prev) => prev.filter((l) => l.id !== location.id));
      showToast('Lieu retiré');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de retirer ce lieu.');
    }
  }

  if (loading) {
    return <p>Chargement...</p>;
  }

  if (!profile) {
    return <p className="form-error">{error ?? 'Profil introuvable.'}</p>;
  }
  const selectedLevelIds = draftLevelIds;
  const selectedSubjectIds = profile.subjects.map(({ subject }) => subject.id);

  /* ERR-TPR-001 : plutôt que de proposer une matière puis apprendre après coup qu'elle est
     incompatible avec les niveaux déjà déclarés, on ne l'offre que si elle est compatible avec
     au moins l'un d'eux (tant qu'aucun niveau n'est encore déclaré, aucune contrainte). */
  const compatibleSubjectIds =
    selectedLevelIds.length === 0
      ? null
      : new Set(
          subjectLevels.filter((sl) => selectedLevelIds.includes(sl.schoolLevelId)).map((sl) => sl.subjectId),
        );
  const availableSubjects = subjects.filter(
    (s) =>
      !selectedSubjectIds.includes(s.id) && (compatibleSubjectIds === null || compatibleSubjectIds.has(s.id)),
  );

  /* ERR-TPR-002, symétrique : niveaux compatibles avec au moins une matière déjà déclarée. Les
     niveaux déjà sélectionnés restent toujours visibles pour pouvoir être décochés. */
  const compatibleLevelIds =
    selectedSubjectIds.length === 0
      ? null
      : new Set(
          subjectLevels.filter((sl) => selectedSubjectIds.includes(sl.subjectId)).map((sl) => sl.schoolLevelId),
        );
  const pickerLevels = schoolLevels.filter(
    (l) => compatibleLevelIds === null || compatibleLevelIds.has(l.id) || selectedLevelIds.includes(l.id),
  );
  const canValidate = profile.subjects.length > 0 && draftLevelIds.length > 0;
  const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
  const completenessSeverity =
    profile.completenessScore >= 80 ? '' : profile.completenessScore >= 50 ? 'meter-warning' : 'meter-danger';

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Mon profil professeur</h1>
          <p>Matières, niveaux et informations visibles par les Parents.</p>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <section className="profile-card">
        <div className="profile-cover" />
        <div className="profile-card-body">
          {photo ? (
            <img src={photo} alt="" className="profile-avatar" />
          ) : (
            <div className="profile-avatar profile-avatar-fallback">{initials}</div>
          )}
          <div className="profile-identity">
            <div className="profile-identity-top">
              <h2 className="profile-name">
                {profile.firstName} {profile.lastName}
              </h2>
              <span className={`badge ${PROFILE_STATUS_BADGE[profile.status]}`}>
                {PROFILE_STATUS_LABELS[profile.status]}
              </span>
            </div>
            <p className="profile-subtitle">
              Professeur{profile.city ? ` · ${profile.city}` : ''}
            </p>
          </div>
        </div>

        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-value">{profile.subjects.length}</span>
            <span className="profile-stat-label">Matières enseignées</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">{draftLevelIds.length}</span>
            <span className="profile-stat-label">Niveaux scolaires</span>
          </div>
          <div className="profile-stat profile-stat-completeness">
            <div className="meter">
              <div className="meter-track">
                <div
                  className={`meter-fill ${completenessSeverity}`}
                  style={{ width: `${profile.completenessScore}%` }}
                />
              </div>
              <span className="meter-value">{profile.completenessScore}%</span>
            </div>
            <span className="profile-stat-label">Complétude du profil</span>
          </div>
        </div>
      </section>

      {!canValidate && (
        <p className="form-notice" role="status">
          Il faut au moins une matière et un niveau scolaire pour que ton compte puisse être validé.
        </p>
      )}

      <div className="profile-grid">
        <div className="profile-main">
          <div className="profile-inline-sections">
            <section className="card-section">
              <h2>Matières enseignées</h2>
              <ul className="tag-list">
                {profile.subjects.map(({ subject }) => (
                  <li key={subject.id} className="tag">
                    {subject.name}
                    <button
                      type="button"
                      aria-label={`Retirer ${subject.name}`}
                      onClick={() => handleRemoveSubject(subject.id)}
                    >
                      &times;
                    </button>
                  </li>
                ))}
                {availableSubjects.length > 0 && (
                  <li className="subject-add-item">
                    <button
                      type="button"
                      className="subject-add-button"
                      aria-label="Ajouter une matière"
                      title="Ajouter une matière"
                      onClick={() => setShowSubjectPicker((open) => !open)}
                    >
                      +
                    </button>
                    {showSubjectPicker && (
                      <Select
                        value={subjectToAdd}
                        className="subject-add-select"
                        aria-label="Matière à ajouter"
                        onChange={(e) => {
                          setSubjectToAdd(e.target.value);
                          handleAddSubject(e.target.value);
                        }}
                      >
                        <option value="">Choisir...</option>
                        {availableSubjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </Select>
                    )}
                  </li>
                )}
              </ul>
              {selectedLevelIds.length > 0 && availableSubjects.length === 0 && (
                <p className="form-hint">Aucune autre matière compatible avec les niveaux déclarés.</p>
              )}
            </section>

            <section className="card-section">
              <h2>Lieu du cours particulier</h2>
              <p className="form-hint">Lieux proposés pour organiser les séances avec les élèves.</p>
              <ul className="tag-list">
                {locations
                  .filter((loc) => loc.isActive)
                  .map((loc) => (
                    <li key={loc.id} className="tag">
                      {loc.label}
                      <button
                        type="button"
                        aria-label={`Retirer ${loc.label}`}
                        onClick={() => handleRemoveLocation(loc)}
                      >
                      &times;
                    </button>
                    </li>
                  ))}
              </ul>
              <form className="add-row" onSubmit={handleAddLocation}>
                <input
                  type="text"
                  placeholder="Nom du lieu"
                  value={locationLabel}
                  onChange={(e) => setLocationLabel(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Adresse (optionnel)"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                />
                <button type="submit" disabled={!locationLabel}>
                  Ajouter
                </button>
              </form>
            </section>
          </div>
<section className="card-section">
            <h2>Niveaux scolaires</h2>
            <p className="form-hint">
              {selectedSubjectIds.length > 0
                ? 'Seuls les niveaux compatibles avec tes matières déclarées sont proposés.'
                : 'Coche les niveaux enseignés, dans une ou plusieurs sections à la fois (primaire, collège, lycée).'}
            </p>
            <SchoolLevelSectionPicker
              levels={pickerLevels}
              selectedIds={selectedLevelIds}
              onToggle={handleToggleLevel}
            />
            {draftLevelIds.length === 0 && (
              <p className="form-error" role="alert">
                Sélectionne au moins un niveau scolaire avant d’enregistrer.
              </p>
            )}
          </section>
          <section className="card-section">
            <h2>Expérience</h2>
            {teachingInstitution && (
              <div className="experience-institution">
                <span>Établissement</span>
                <strong>{teachingInstitution}</strong>
              </div>
            )}
            <p className="profile-bio-text">{experience || 'Aucune expérience renseignée pour le moment.'}</p>
          </section>
        </div>

        <aside className="profile-side">
          <section className="card-section">
            <h3>Compte GROUPI</h3>
            <div className="account-summary-row">
              <div>
                <p className="table-hint">Adresse de connexion</p>
                <p className="profile-bio-text">{currentUser?.email ?? 'Adresse non disponible'}</p>
              </div>
              <div>
                <p className="table-hint">Accès au compte</p>
                <span className={`badge ${accountStatusBadge(currentUser?.status)}`}>
                  {ACCOUNT_STATUS_LABELS[currentUser?.status ?? ''] ?? currentUser?.status ?? 'Statut non disponible'}
                </span>
              </div>
            </div>
          </section>

          <section className="card-section">
            <h3>Modifier mes informations</h3>
            <label>
              Biographie
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
            </label>
            <label>
              Photo (URL)
              <input type="text" value={photo} onChange={(e) => setPhoto(e.target.value)} />
            </label>
            <label>
              Établissement actuel ou passé
              <input
                type="text"
                value={teachingInstitution}
                onChange={(e) => setTeachingInstitution(e.target.value)}
                placeholder="Ex. Lycée pilote de Tunis"
              />
            </label>
            <label>
              Expérience
              <textarea value={experience} onChange={(e) => setExperience(e.target.value)} rows={3} />
            </label>
            <button type="button" onClick={handleSaveInfo} disabled={savingLevels}>
              Enregistrer
            </button>
          </section>
        </aside>
      </div>
    </>
  );
}
