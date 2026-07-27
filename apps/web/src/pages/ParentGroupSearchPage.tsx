import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as referentialsApi from '../api/referentialsApi';
import * as groupsApi from '../api/groupsApi';
import * as parentProfileApi from '../api/parentProfileApi';
import * as enrollmentsApi from '../api/enrollmentsApi';
import * as groupChangeApi from '../api/groupChangeApi';
import type { Subject, SchoolLevel } from '../api/referentialsApi';
import type { PublicGroup, DayOfWeek } from '../api/groupsApi';
import type { Student } from '../api/parentProfileApi';

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
  const [searchParams] = useSearchParams();
  const changeFromEnrollmentId = searchParams.get('changeFromEnrollment');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [schoolLevelId, setSchoolLevelId] = useState('');
  const [city, setCity] = useState('');
  const [results, setResults] = useState<PublicGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [requestingGroupId, setRequestingGroupId] = useState<string | null>(null);
  const [studentToEnroll, setStudentToEnroll] = useState('');

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
    Promise.all([
      referentialsApi.listSubjects(token),
      referentialsApi.listSchoolLevels(token),
      parentProfileApi.listStudents(token),
    ]).then(([s, l, myStudents]) => {
      setSubjects(s);
      setSchoolLevels(l);
      setStudents(myStudents.filter((st) => st.status === 'ACTIVE'));
    });
  }, [getAccessToken]);

  useEffect(() => {
    search();
  }, [search]);

  async function handleRequestEnrollment(groupId: string) {
    const token = getAccessToken();
    if (!token || !studentToEnroll) return;
    setError(null);
    setNotice(null);
    try {
      await enrollmentsApi.createEnrollment(token, { studentId: studentToEnroll, groupId });
      setNotice('Demande d’inscription envoyée. Suivez son statut dans "Mes demandes d’inscription".');
      setRequestingGroupId(null);
      setStudentToEnroll('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'envoyer la demande.");
    }
  }

  async function handleRequestGroupChange(groupId: string) {
    const token = getAccessToken();
    if (!token || !changeFromEnrollmentId) return;
    setError(null);
    setNotice(null);
    try {
      await groupChangeApi.createGroupChangeRequest(token, {
        enrollmentId: changeFromEnrollmentId,
        targetGroupId: groupId,
      });
      setNotice('Demande de changement de groupe envoyée. Suivez son statut dans "Mes demandes d’inscription".');
      setRequestingGroupId(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'envoyer la demande de changement.");
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Rechercher un groupe</h1>
          <p>Filtrez par matière, niveau scolaire ou ville du professeur.</p>
        </div>
        <div className="page-actions">
          <Link to="/parent/enrollments">Mes demandes d'inscription</Link>
        </div>
      </div>

      {changeFromEnrollmentId && (
        <p className="form-notice" role="status">
          Vous choisissez un nouveau groupe pour un changement — la décision finale (dont la date effective)
          appartient au Professeur du groupe cible.
        </p>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="form-notice" role="status">
          {notice}
        </p>
      )}

      <section className="card-section">
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
      </section>

      {loading ? (
        <p>Chargement...</p>
      ) : results.length === 0 ? (
        <p>Aucun groupe ne correspond à ces critères.</p>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Groupe</th>
                <th>Professeur</th>
                <th>Matière / Niveau</th>
                <th>Planning</th>
                <th>Tarif</th>
                <th>Places</th>
                <th>Actions</th>
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
                    {group.status === 'FULL' ? (
                      <span className="badge badge-warning">Complet</span>
                    ) : (
                      <span className="badge badge-success">
                        {group.spotsAvailable} / {group.capacity}
                      </span>
                    )}
                  </td>
                  <td className="admin-actions">
                    {changeFromEnrollmentId ? (
                      group.status === 'FULL' ? (
                        <span className="table-hint">Groupe complet</span>
                      ) : requestingGroupId === group.id ? (
                        <div className="reason-prompt">
                          <button type="button" onClick={() => handleRequestGroupChange(group.id)}>
                            Confirmer ce groupe
                          </button>
                          <button type="button" className="ghost" onClick={() => setRequestingGroupId(null)}>
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setRequestingGroupId(group.id)}>
                          Demander ce changement
                        </button>
                      )
                    ) : group.status === 'FULL' || students.length === 0 ? (
                      requestingGroupId === group.id ? null : (
                        <span className="table-hint">
                          {students.length === 0 ? 'Ajoutez un enfant' : 'Groupe complet'}
                        </span>
                      )
                    ) : requestingGroupId === group.id ? (
                      <div className="reason-prompt">
                        <select value={studentToEnroll} onChange={(e) => setStudentToEnroll(e.target.value)}>
                          <option value="">Choisir l'enfant...</option>
                          {students.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.firstName} {s.lastName}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={!studentToEnroll}
                          onClick={() => handleRequestEnrollment(group.id)}
                        >
                          Envoyer
                        </button>
                        <button type="button" className="ghost" onClick={() => setRequestingGroupId(null)}>
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setRequestingGroupId(group.id)}>
                        Demander une inscription
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
