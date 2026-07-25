import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as referentialsApi from '../api/referentialsApi';
import * as teacherProfileApi from '../api/teacherProfileApi';
import type { Subject, SchoolLevel } from '../api/referentialsApi';
import type { TeacherProfile } from '../api/teacherProfileApi';

export function TeacherProfilePage() {
  const { getAccessToken } = useAuth();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState('');
  const [experience, setExperience] = useState('');

  const [subjectToAdd, setSubjectToAdd] = useState('');
  const [levelToAdd, setLevelToAdd] = useState('');

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [me, allSubjects, allLevels] = await Promise.all([
        teacherProfileApi.getMyProfile(token),
        referentialsApi.listSubjects(token),
        referentialsApi.listSchoolLevels(token),
      ]);
      setProfile(me);
      setSubjects(allSubjects);
      setSchoolLevels(allLevels);
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

  function handleAddLevel() {
    const token = getAccessToken();
    if (!token || !levelToAdd) return;
    runAction(() => teacherProfileApi.addSchoolLevel(token, levelToAdd));
    setLevelToAdd('');
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

  if (loading) {
    return (
      <div className="dashboard-page">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="dashboard-page">
        <p className="form-error">{error ?? 'Profil introuvable.'}</p>
      </div>
    );
  }

  const availableSubjects = subjects.filter(
    (s) => !profile.subjects.some((ts) => ts.subject.id === s.id),
  );
  const availableLevels = schoolLevels.filter(
    (l) => !profile.schoolLevels.some((tl) => tl.schoolLevel.id === l.id),
  );
  const canValidate = profile.subjects.length > 0 && profile.schoolLevels.length > 0;

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Mon profil professeur</h1>
        <Link to="/dashboard">Retour au tableau de bord</Link>
      </header>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <p>
        Score de complétude : <strong>{profile.completenessScore}%</strong> — Statut :{' '}
        <strong>{profile.status}</strong>
      </p>
      {!canValidate && (
        <p className="form-notice" role="status">
          Il faut au moins une matière et un niveau scolaire pour que ton compte puisse être validé.
        </p>
      )}

      <section>
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
          <select value={subjectToAdd} onChange={(e) => setSubjectToAdd(e.target.value)}>
            <option value="">Ajouter une matière...</option>
            {availableSubjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button type="button" disabled={!subjectToAdd} onClick={handleAddSubject}>
            Ajouter
          </button>
        </div>
      </section>

      <section>
        <h2>Niveaux scolaires</h2>
        <ul className="tag-list">
          {profile.schoolLevels.map(({ schoolLevel }) => (
            <li key={schoolLevel.id} className="tag">
              {schoolLevel.name}
              <button
                type="button"
                aria-label={`Retirer ${schoolLevel.name}`}
                onClick={() => handleRemoveLevel(schoolLevel.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <div className="add-row">
          <select value={levelToAdd} onChange={(e) => setLevelToAdd(e.target.value)}>
            <option value="">Ajouter un niveau...</option>
            {availableLevels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <button type="button" disabled={!levelToAdd} onClick={handleAddLevel}>
            Ajouter
          </button>
        </div>
      </section>

      <section>
        <h2>Informations complémentaires</h2>
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
    </div>
  );
}
