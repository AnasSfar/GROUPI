import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Select } from '../components/Select';
import { ApiError } from '../api/client';
import * as referentialsApi from '../api/referentialsApi';
import * as parentProfileApi from '../api/parentProfileApi';
import * as preEnrollmentsApi from '../api/preEnrollmentsApi';
import type { Subject, SchoolLevel, AcademicYear } from '../api/referentialsApi';
import type { Student } from '../api/parentProfileApi';
import type { PreEnrollment, PreEnrollmentStatus, EligibleTeacher } from '../api/preEnrollmentsApi';

const STATUS_LABELS: Record<PreEnrollmentStatus, string> = {
  PENDING: 'Ouverte',
  PROPOSAL_SENT: 'Proposition reçue',
  CONFIRMED: 'Confirmée',
  TRANSFORMED: 'Transformée en inscription',
  EXPIRED: 'Expirée',
  REJECTED: 'Refusée',
  CANCELLED: 'Annulée',
  CLOSED: 'Clôturée',
};

const STATUS_BADGE: Record<PreEnrollmentStatus, string> = {
  PENDING: 'badge-info',
  PROPOSAL_SENT: 'badge-warning',
  CONFIRMED: 'badge-success',
  TRANSFORMED: 'badge-success',
  EXPIRED: 'badge-neutral',
  REJECTED: 'badge-danger',
  CANCELLED: 'badge-neutral',
  CLOSED: 'badge-neutral',
};

/** RM-PRE-031/ERR-PRE-018 : formulaire inline de modification (niveau visé / matière), affiché
 *  tant qu'aucune proposition n'a été envoyée (statut encore PENDING). */
function EditPreEnrollmentForm({
  preEnrollment,
  schoolLevels,
  subjects,
  onSubmit,
  onCancel,
}: {
  preEnrollment: PreEnrollment;
  schoolLevels: SchoolLevel[];
  subjects: Subject[];
  onSubmit: (schoolLevelId: string, subjectId: string) => void;
  onCancel: () => void;
}) {
  const [schoolLevelId, setSchoolLevelId] = useState(preEnrollment.schoolLevelId);
  const [subjectId, setSubjectId] = useState(preEnrollment.subjectId ?? '');

  return (
    <div className="reason-prompt">
      <Select value={schoolLevelId} onChange={(e) => setSchoolLevelId(e.target.value)}>
        {schoolLevels.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </Select>
      <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
        <option value="">Non précisée</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
      <button type="button" onClick={() => onSubmit(schoolLevelId, subjectId)}>
        Enregistrer
      </button>
      <button type="button" className="ghost" onClick={onCancel}>
        Annuler
      </button>
    </div>
  );
}

/** Ch.11 : espace Parent — manifester son intérêt pour une future année et répondre aux
 *  propositions envoyées par les Professeurs (préinscription, pas encore une inscription). */
export function ParentPreEnrollmentsPage() {
  const { getAccessToken } = useAuth();
  const [preEnrollments, setPreEnrollments] = useState<PreEnrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [eligibleTeachers, setEligibleTeachers] = useState<EligibleTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingFor, setEditingFor] = useState<string | null>(null);

  const [studentId, setStudentId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [schoolLevelId, setSchoolLevelId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [mine, myStudents, allSubjects, allLevels, allYears] = await Promise.all([
        preEnrollmentsApi.listMine(token),
        parentProfileApi.listStudents(token),
        referentialsApi.listSubjects(token),
        referentialsApi.listSchoolLevels(token),
        referentialsApi.listAcademicYears(token),
      ]);
      setPreEnrollments(mine);
      setStudents(myStudents.filter((s) => s.status === 'ACTIVE'));
      setSubjects(allSubjects);
      setSchoolLevels(allLevels);
      // Ch.11.1/RM-PRE-023 : une préinscription ne concerne jamais l'année en cours ou passée.
      setAcademicYears(allYears.filter((y) => new Date(y.startDate) > new Date()));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les préinscriptions.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  // Recherche des Professeurs validés éligibles, affinée par matière/niveau si sélectionnés.
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    preEnrollmentsApi
      .listEligibleTeachers(token, { subjectId: subjectId || undefined, schoolLevelId: schoolLevelId || undefined })
      .then(setEligibleTeachers)
      .catch(() => setEligibleTeachers([]));
  }, [getAccessToken, subjectId, schoolLevelId]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token || !studentId || !teacherId || !schoolLevelId || !academicYearId) return;
    setError(null);
    try {
      const created = await preEnrollmentsApi.createPreEnrollment(token, {
        studentId,
        teacherId,
        schoolLevelId,
        subjectId: subjectId || undefined,
        academicYearId,
      });
      setPreEnrollments((prev) => [created, ...prev]);
      setTeacherId('');
      setAcademicYearId('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de créer cette préinscription.');
    }
  }

  async function runAction(action: () => Promise<PreEnrollment>) {
    setError(null);
    try {
      const updated = await action();
      setPreEnrollments((prev) => prev.map((pe) => (pe.id === updated.id ? updated : pe)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "L'opération a échoué.");
    }
  }

  /** RM-PRE-031/ERR-PRE-018 : modification tant qu'aucune proposition n'a été envoyée. */
  async function handleUpdate(id: string, newSchoolLevelId: string, newSubjectId: string) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      const updated = await preEnrollmentsApi.updatePreEnrollment(token, id, {
        schoolLevelId: newSchoolLevelId,
        subjectId: newSubjectId || undefined,
      });
      setPreEnrollments((prev) => prev.map((pe) => (pe.id === updated.id ? updated : pe)));
      setEditingFor(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de modifier cette préinscription.');
    }
  }

  if (loading) {
    return <p>Chargement...</p>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Mes préinscriptions</h1>
          <p>Manifestez votre intérêt pour la prochaine année académique auprès d'un Professeur.</p>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <section className="card-section">
        <h2>Mes préinscriptions ({preEnrollments.length})</h2>
        {preEnrollments.length === 0 && <p>Aucune préinscription pour le moment.</p>}
        {preEnrollments.length > 0 && (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Élève</th>
                  <th>Professeur</th>
                  <th>Matière / Niveau</th>
                  <th>Année</th>
                  <th>Statut</th>
                  <th>Proposition</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {preEnrollments.map((pe) => (
                  <tr key={pe.id}>
                    <td data-label="Élève">
                      {pe.student.firstName} {pe.student.lastName}
                    </td>
                    <td data-label="Professeur">
                      {pe.teacher.firstName} {pe.teacher.lastName} ({pe.teacher.city})
                    </td>
                    <td data-label="Matière / Niveau">
                      {pe.subject ? `${pe.subject.name} — ` : ''}
                      {pe.schoolLevel.name}
                    </td>
                    <td data-label="Année">{pe.academicYear.label}</td>
                    <td data-label="Statut">
                      <span className={`badge ${STATUS_BADGE[pe.status]}`}>{STATUS_LABELS[pe.status]}</span>
                    </td>
                    <td data-label="Proposition">
                      {pe.status === 'PROPOSAL_SENT' && pe.proposedGroup ? (
                        <div className="proposal-summary">
                          <div>{pe.proposedGroup.name}</div>
                          <div>Tarif : {pe.proposedGroup.publicPrice} TND</div>
                          <div>{pe.proposedGroup.hasAvailableSpots ? 'Places disponibles' : 'Groupe complet'}</div>
                          {pe.expiresAt && (
                            <div>
                              Réponse avant le {new Date(pe.expiresAt).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="admin-actions">
                      {pe.status === 'PENDING' &&
                        (editingFor === pe.id ? (
                          <EditPreEnrollmentForm
                            preEnrollment={pe}
                            schoolLevels={schoolLevels}
                            subjects={subjects}
                            onSubmit={(newSchoolLevelId, newSubjectId) =>
                              handleUpdate(pe.id, newSchoolLevelId, newSubjectId)
                            }
                            onCancel={() => setEditingFor(null)}
                          />
                        ) : (
                          <>
                            <button type="button" onClick={() => setEditingFor(pe.id)}>
                              Modifier
                            </button>
                            <button
                              type="button"
                              className="danger"
                              onClick={() =>
                                runAction(() => preEnrollmentsApi.cancelPreEnrollment(getAccessToken()!, pe.id))
                              }
                            >
                              Annuler
                            </button>
                          </>
                        ))}
                      {pe.status === 'PROPOSAL_SENT' && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              runAction(() => preEnrollmentsApi.confirmPreEnrollment(getAccessToken()!, pe.id))
                            }
                          >
                            Confirmer
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() =>
                              runAction(() => preEnrollmentsApi.rejectPreEnrollment(getAccessToken()!, pe.id))
                            }
                          >
                            Refuser
                          </button>
                        </>
                      )}
                      {pe.status === 'TRANSFORMED' && (
                        <button
                          type="button"
                          className="danger"
                          onClick={() =>
                            runAction(() =>
                              preEnrollmentsApi.withdrawPreEnrollmentConfirmation(getAccessToken()!, pe.id),
                            )
                          }
                        >
                          Retirer ma confirmation
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card-section">
        <h2>Nouvelle préinscription</h2>
        {students.length === 0 ? (
          <p>Ajoutez d'abord un enfant dans votre profil pour créer une préinscription.</p>
        ) : (
          <form onSubmit={handleCreate}>
            <div className="field-row">
              <label>
                Enfant
                <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                  <option value="">Sélectionner...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </option>
                  ))}
                </Select>
              </label>
              <label>
                Niveau scolaire prévu
                <Select value={schoolLevelId} onChange={(e) => setSchoolLevelId(e.target.value)}>
                  <option value="">Sélectionner...</option>
                  {schoolLevels.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
            <div className="field-row">
              <label>
                Matière (optionnel)
                <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                  <option value="">Non précisée</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label>
                Année académique
                <Select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)}>
                  <option value="">Sélectionner...</option>
                  {academicYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.label}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
            <label>
              Professeur
              <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                <option value="">Sélectionner...</option>
                {eligibleTeachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.firstName} {t.lastName} ({t.city})
                  </option>
                ))}
              </Select>
            </label>
            {eligibleTeachers.length === 0 && (
              <p>Aucun Professeur validé ne correspond encore à ces critères.</p>
            )}

            <button
              type="submit"
              disabled={!studentId || !teacherId || !schoolLevelId || !academicYearId}
            >
              Créer la préinscription
            </button>
          </form>
        )}
      </section>
    </>
  );
}
