import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Select } from '../components/Select';
import { SchoolLevelSectionPicker } from '../components/SchoolLevelSectionPicker';
import { ApiError } from '../api/client';
import * as referentialsApi from '../api/referentialsApi';
import * as teacherProfileApi from '../api/teacherProfileApi';
import type { Subject, SchoolLevel, SubjectLevelPair } from '../api/referentialsApi';
import type { TeacherProfile, TeacherProfileStatus } from '../api/teacherProfileApi';

const PROFILE_STATUS_LABELS: Record<TeacherProfileStatus, string> = {
  DRAFT: 'Brouillon',
  PENDING_VALIDATION: 'En attente de validation',
  VALIDATED: 'Validé',
};

const PROFILE_STATUS_BADGE: Record<TeacherProfileStatus, string> = {
  DRAFT: 'badge-neutral',
  PENDING_VALIDATION: 'badge-warning',
  VALIDATED: 'badge-success',
};

export function TeacherProfilePage() {
  const { getAccessToken } = useAuth();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([]);
  const [subjectLevels, setSubjectLevels] = useState<SubjectLevelPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState('');
  const [experience, setExperience] = useState('');

  const [subjectToAdd, setSubjectToAdd] = useState('');

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [me, allSubjects, allLevels, allSubjectLevels] = await Promise.all([
        teacherProfileApi.getMyProfile(token),
        referentialsApi.listSubjects(token),
        referentialsApi.listSchoolLevels(token),
        referentialsApi.listSubjectLevels(token),
      ]);
      setProfile(me);
      setSubjects(allSubjects);
      setSchoolLevels(allLevels);
      setSubjectLevels(allSubjectLevels);
      setBio(me.bio ?? '');
      setPhoto(me.photo ?? '');
      setExperience(me.experience ?? '');
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

  function handleSaveInfo() {
    const token = getAccessToken();
    if (!token) return;
    runAction(() => teacherProfileApi.updateMyProfile(token, { bio, photo, experience }));
  }

  function handleAddSubject() {
    const token = getAccessToken();
    if (!token || !subjectToAdd) return;
    runAction(() => teacherProfileApi.addSubject(token, subjectToAdd));
    setSubjectToAdd('');
  }

  function handleRemoveSubject(subjectId: string) {
    const token = getAccessToken();
    if (!token) return;
    runAction(() => teacherProfileApi.removeSubject(token, subjectId));
  }

  function handleRemoveLevel(schoolLevelId: string) {
    const token = getAccessToken();
    if (!token) return;
    runAction(() => teacherProfileApi.removeSchoolLevel(token, schoolLevelId));
  }

  function handleToggleLevel(schoolLevelId: string, checked: boolean) {
    if (checked) {
      const token = getAccessToken();
      if (!token) return;
      runAction(() => teacherProfileApi.addSchoolLevel(token, schoolLevelId));
    } else {
      handleRemoveLevel(schoolLevelId);
    }
  }

  if (loading) {
    return <p>Chargement...</p>;
  }

  if (!profile) {
    return <p className="form-error">{error ?? 'Profil introuvable.'}</p>;
  }

  const selectedLevelIds = profile.schoolLevels.map(({ schoolLevel }) => schoolLevel.id);
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

  const canValidate = profile.subjects.length > 0 && profile.schoolLevels.length > 0;
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
            <span className="profile-stat-value">{profile.schoolLevels.length}</span>
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
          <section className="card-section">
            <h2>À propos</h2>
            <p className="profile-bio-text">{bio || 'Aucune biographie renseignée pour le moment.'}</p>
          </section>

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
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <div className="add-row">
              <Select value={subjectToAdd} onChange={(e) => setSubjectToAdd(e.target.value)}>
                <option value="">Ajouter une matière...</option>
                {availableSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
              <button type="button" disabled={!subjectToAdd} onClick={handleAddSubject}>
                Ajouter
              </button>
            </div>
            {selectedLevelIds.length > 0 && availableSubjects.length === 0 && (
              <p className="form-hint">
                Aucune autre matière compatible avec les niveaux déjà déclarés.
              </p>
            )}
          </section>

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
          </section>

          <section className="card-section">
            <h2>Expérience</h2>
            <p className="profile-bio-text">{experience || 'Aucune expérience renseignée pour le moment.'}</p>
          </section>
        </div>

        <aside className="profile-side">
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
              Expérience
              <textarea value={experience} onChange={(e) => setExperience(e.target.value)} rows={3} />
            </label>
            <button type="button" onClick={handleSaveInfo}>
              Enregistrer
            </button>
          </section>
        </aside>
      </div>
    </>
  );
}
