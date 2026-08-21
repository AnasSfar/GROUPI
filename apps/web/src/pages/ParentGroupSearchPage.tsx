import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Select } from '../components/Select';
import { useToast } from '../components/Toast';
import { ApiError } from '../api/client';
import * as referentialsApi from '../api/referentialsApi';
import * as groupsApi from '../api/groupsApi';
import * as parentProfileApi from '../api/parentProfileApi';
import * as enrollmentsApi from '../api/enrollmentsApi';
import * as groupChangeApi from '../api/groupChangeApi';
import type { Subject, SchoolLevel, SubjectLevelPair } from '../api/referentialsApi';
import { formatDuration } from '../api/groupsApi';
import type { PublicGroup, DayOfWeek, TeachingMode } from '../api/groupsApi';

const TEACHING_MODE_LABELS: Record<TeachingMode, string> = {
  PRESENTIAL: 'Présentiel',
  ONLINE: 'En ligne',
};
import type { Student } from '../api/parentProfileApi';

const DAY_LABELS: Record<DayOfWeek, string> = {
  SUNDAY: 'Dim',
  MONDAY: 'Lun',
  TUESDAY: 'Mar',
  WEDNESDAY: 'Mer',
  THURSDAY: 'Jeu',
  FRIDAY: 'Ven',
  SATURDAY: 'Sam',
};

function formatSchedule(group: PublicGroup): string {
  return group.schedules
    .map((s) => `${DAY_LABELS[s.dayOfWeek]} ${s.startTime} (${formatDuration(s.durationMinutes)})`)
    .join(', ');
}

export function ParentGroupSearchPage() {
  const { getAccessToken } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const changeFromEnrollmentId = searchParams.get('changeFromEnrollment');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectLevels, setSubjectLevels] = useState<SubjectLevelPair[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [schoolLevelId, setSchoolLevelId] = useState('');
  const [city, setCity] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [teachingMode, setTeachingMode] = useState<TeachingMode | ''>('');
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
        teacherName: teacherName || undefined,
        teachingMode: teachingMode || undefined,
      });
      setResults(groups);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les groupes.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, subjectId, schoolLevelId, city, teacherName, teachingMode]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    Promise.all([
      referentialsApi.listSubjects(token),
      referentialsApi.listSubjectLevels(token),
      parentProfileApi.listStudents(token),
    ]).then(([s, sl, myStudents]) => {
      setSubjects(s);
      setSubjectLevels(sl);
      setStudents(myStudents.filter((st) => st.status === 'ACTIVE'));
    });
  }, [getAccessToken]);

  useEffect(() => {
    search();
  }, [search]);

  /** RM-PAR : un Parent ne recherche que dans les niveaux réellement suivis par ses enfants —
   * jamais la liste complète du référentiel (qui couvre tous les niveaux, primaire à lycée). */
  const childrenLevels = useMemo(() => {
    const byId = new Map<string, SchoolLevel>();
    for (const student of students) {
      const level = student.currentSchoolSituation?.schoolLevel;
      if (level) byId.set(level.id, level);
    }
    return [...byId.values()];
  }, [students]);

  /** Ne propose que les niveaux (parmi ceux des enfants) compatibles avec la matière choisie
   * (ERR-GRP-001) — sans matière sélectionnée, tous les niveaux des enfants restent proposés. */
  const availableLevels = useMemo(() => {
    if (!subjectId) return childrenLevels;
    const compatibleIds = new Set(
      subjectLevels.filter((sl) => sl.subjectId === subjectId).map((sl) => sl.schoolLevelId),
    );
    return childrenLevels.filter((l) => compatibleIds.has(l.id));
  }, [subjectId, subjectLevels, childrenLevels]);

  useEffect(() => {
    if (schoolLevelId && !availableLevels.some((l) => l.id === schoolLevelId)) {
      setSchoolLevelId('');
    }
  }, [availableLevels, schoolLevelId]);

  /** N'autorise à choisir, pour un groupe donné, que les enfants dont le niveau scolaire actuel
   * correspond au niveau du groupe (ex : pas d'élève de 8e proposé pour un groupe de 9e). */
  function eligibleStudentsForGroup(group: PublicGroup): Student[] {
    return students.filter((s) => s.currentSchoolSituation?.schoolLevel.id === group.schoolLevel.id);
  }

  function startEnrollmentRequest(group: PublicGroup) {
    const eligible = eligibleStudentsForGroup(group);
    setStudentToEnroll(eligible.length === 1 ? eligible[0].id : '');
    setRequestingGroupId(group.id);
  }

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
      showToast('Demande d’inscription envoyée');
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
      showToast('Demande de changement de groupe envoyée');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'envoyer la demande de changement.");
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Rechercher un groupe</h1>
          <p>Filtrez par matière, niveau scolaire, ville, nom du professeur ou mode d'enseignement.</p>
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
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">Toutes</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Niveau scolaire
            <Select value={schoolLevelId} onChange={(e) => setSchoolLevelId(e.target.value)}>
              <option value="">Tous</option>
              {availableLevels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Ville du professeur
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} />
          </label>
          <label>
            Nom du professeur
            <input type="text" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} />
          </label>
          <label>
            Mode d'enseignement
            <Select value={teachingMode} onChange={(e) => setTeachingMode(e.target.value as TeachingMode | '')}>
              <option value="">Tous</option>
              {(Object.keys(TEACHING_MODE_LABELS) as TeachingMode[]).map((mode) => (
                <option key={mode} value={mode}>
                  {TEACHING_MODE_LABELS[mode]}
                </option>
              ))}
            </Select>
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
                  <td data-label="Groupe">{group.name}</td>
                  <td data-label="Professeur">
                    {group.teacher.firstName} {group.teacher.lastName} ({group.teacher.city})
                  </td>
                  <td data-label="Matière / Niveau">
                    {group.subject.name} — {group.schoolLevel.name}
                  </td>
                  <td data-label="Planning">{formatSchedule(group)}</td>
                  <td data-label="Tarif">{group.publicPrice} TND</td>
                  <td data-label="Places">
                    {group.status === 'FULL' || !group.hasAvailableSpots ? (
                      <span className="badge badge-warning">Complet</span>
                    ) : (
                      <span className="badge badge-success">Places disponibles</span>
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
                    ) : eligibleStudentsForGroup(group).length === 0 ? (
                      requestingGroupId === group.id ? null : (
                        <span className="table-hint">Aucun enfant de ce niveau</span>
                      )
                    ) : requestingGroupId === group.id ? (
                      <div className="reason-prompt">
                        <Select value={studentToEnroll} onChange={(e) => setStudentToEnroll(e.target.value)}>
                          <option value="">Choisir l'enfant...</option>
                          {eligibleStudentsForGroup(group).map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.firstName} {s.lastName}
                            </option>
                          ))}
                        </Select>
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
                      <button type="button" onClick={() => startEnrollmentRequest(group)}>
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
