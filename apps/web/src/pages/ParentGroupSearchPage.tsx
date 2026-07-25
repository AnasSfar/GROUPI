import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as referentialsApi from '../api/referentialsApi';
import * as groupsApi from '../api/groupsApi';
import type { Subject, SchoolLevel } from '../api/referentialsApi';
import type { PublicGroup, DayOfWeek } from '../api/groupsApi';

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Lun',
  TUESDAY: 'Mar',
  WEDNESDAY: 'Mer',
  THURSDAY: 'Jeu',
  FRIDAY: 'Ven',
  SATURDAY: 'Sam',
  SUNDAY: 'Dim',
};

function formatSchedule(group: PublicGroup): string {
  return group.schedules
    .map((s) => `${DAY_LABELS[s.dayOfWeek]} ${s.startTime} (${s.durationMinutes} min)`)
    .join(', ');
}

export function ParentGroupSearchPage() {
  const { getAccessToken } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [schoolLevelId, setSchoolLevelId] = useState('');
  const [city, setCity] = useState('');
  const [results, setResults] = useState<PublicGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const groups = await groupsApi.searchGroups(token, {
        subjectId: subjectId || undefined,
        schoolLevelId: schoolLevelId || undefined,
        city: city || undefined,
      });
      setResults(groups);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les groupes.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, subjectId, schoolLevelId, city]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    Promise.all([referentialsApi.listSubjects(token), referentialsApi.listSchoolLevels(token)]).then(
      ([s, l]) => {
        setSubjects(s);
        setSchoolLevels(l);
      },
    );
  }, [getAccessToken]);

  useEffect(() => {
    search();
  }, [search]);

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Rechercher un groupe</h1>
        <Link to="/dashboard">Retour au tableau de bord</Link>
      </header>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="field-row">
        <label>
          Matière
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Toutes</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Niveau scolaire
          <select value={schoolLevelId} onChange={(e) => setSchoolLevelId(e.target.value)}>
            <option value="">Tous</option>
            {schoolLevels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ville du professeur
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} />
        </label>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : results.length === 0 ? (
        <p>Aucun groupe ne correspond à ces critères.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Groupe</th>
              <th>Professeur</th>
              <th>Matière / Niveau</th>
              <th>Planning</th>
              <th>Tarif</th>
              <th>Places</th>
            </tr>
          </thead>
          <tbody>
            {results.map((group) => (
              <tr key={group.id}>
                <td>{group.name}</td>
                <td>
                  {group.teacher.firstName} {group.teacher.lastName} ({group.teacher.city})
                </td>
                <td>
                  {group.subject.name} — {group.schoolLevel.name}
                </td>
                <td>{formatSchedule(group)}</td>
                <td>{group.publicPrice} TND</td>
                <td>
                  {group.status === 'FULL'
                    ? 'Complet'
                    : `${group.spotsAvailable} / ${group.capacity}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
