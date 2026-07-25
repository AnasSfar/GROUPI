import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as referentialsApi from '../api/referentialsApi';
import * as parentProfileApi from '../api/parentProfileApi';
import type { School, SchoolLevel } from '../api/referentialsApi';
import type { ParentProfile, Student } from '../api/parentProfileApi';

export function ParentChildrenPage() {
  const { getAccessToken } = useAuth();
  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [schoolLevelId, setSchoolLevelId] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [schoolClass, setSchoolClass] = useState('');

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [me, myStudents, levels, allSchools] = await Promise.all([
        parentProfileApi.getMyProfile(token),
        parentProfileApi.listStudents(token),
        referentialsApi.listSchoolLevels(token),
        referentialsApi.listSchools(token),
      ]);
      setProfile(me);
      setStudents(myStudents);
      setSchoolLevels(levels);
      setSchools(allSchools);
      setPhone(me.phone);
      setCity(me.city);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger le profil.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSaveProfile() {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      const updated = await parentProfileApi.updateMyProfile(token, { phone, city });
      setProfile(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de mettre à jour le profil.');
    }
  }

  async function handleCreateStudent(event: FormEvent) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token || !schoolLevelId || !schoolId) return;
    setError(null);
    try {
      const created = await parentProfileApi.createStudent(token, {
        firstName,
        lastName,
        dateOfBirth: dateOfBirth || undefined,
        schoolLevelId,
        schoolId,
        schoolClass: schoolClass || undefined,
      });
      setStudents((prev) => [...prev, created]);
      setFirstName('');
      setLastName('');
      setDateOfBirth('');
      setSchoolLevelId('');
      setSchoolId('');
      setSchoolClass('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'ajouter cet enfant.");
    }
  }

  async function handleArchive(studentId: string) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      const updated = await parentProfileApi.archiveStudent(token, studentId);
      setStudents((prev) => prev.map((s) => (s.id === studentId ? updated : s)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'archiver cet enfant.");
    }
  }

  async function handleReactivate(studentId: string) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      const updated = await parentProfileApi.reactivateStudent(token, studentId);
      setStudents((prev) => prev.map((s) => (s.id === studentId ? updated : s)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de réactiver cet enfant.');
    }
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

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Mes enfants</h1>
        <Link to="/dashboard">Retour au tableau de bord</Link>
      </header>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {!profile.validatedAt && (
        <p className="form-notice" role="status">
          Votre compte est en attente de validation par un administrateur. Vous pouvez déjà
          déclarer vos enfants en attendant.
        </p>
      )}

      <section>
        <h2>Mes coordonnées</h2>
        <label>
          Téléphone
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label>
          Ville
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} />
        </label>
        <button type="button" onClick={handleSaveProfile}>
          Enregistrer
        </button>
      </section>

      <section>
        <h2>Mes enfants ({students.length})</h2>
        {students.length === 0 && <p>Aucun enfant déclaré pour le moment.</p>}
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Niveau</th>
              <th>Établissement</th>
              <th>Classe</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>
                  {student.firstName} {student.lastName}
                </td>
                <td>{student.currentSchoolSituation?.schoolLevel.name ?? '—'}</td>
                <td>{student.currentSchoolSituation?.school.name ?? '—'}</td>
                <td>{student.currentSchoolSituation?.class ?? '—'}</td>
                <td>{student.status}</td>
                <td className="admin-actions">
                  <Link to={`/parent/children/${student.id}/situation`}>Situation scolaire</Link>
                  {student.status === 'ACTIVE' ? (
                    <button type="button" className="ghost" onClick={() => handleArchive(student.id)}>
                      Archiver
                    </button>
                  ) : (
                    <button type="button" onClick={() => handleReactivate(student.id)}>
                      Réactiver
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Ajouter un enfant</h2>
        <form onSubmit={handleCreateStudent}>
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
          <label>
            Date de naissance
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </label>
          <label>
            Niveau scolaire
            <select value={schoolLevelId} onChange={(e) => setSchoolLevelId(e.target.value)} required>
              <option value="">Sélectionner...</option>
              {schoolLevels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Établissement
            <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} required>
              <option value="">Sélectionner...</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Classe (indicatif)
            <input
              type="text"
              value={schoolClass}
              onChange={(e) => setSchoolClass(e.target.value)}
            />
          </label>
          <button type="submit" disabled={!schoolLevelId || !schoolId}>
            Ajouter cet enfant
          </button>
        </form>
      </section>
    </div>
  );
}
