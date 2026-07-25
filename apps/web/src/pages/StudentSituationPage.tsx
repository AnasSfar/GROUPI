import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as referentialsApi from '../api/referentialsApi';
import * as parentProfileApi from '../api/parentProfileApi';
import * as schoolSituationApi from '../api/schoolSituationApi';
import type { AcademicYear, School, SchoolLevel } from '../api/referentialsApi';
import type { Student, StudentSituation } from '../api/parentProfileApi';

const STATUS_LABELS: Record<StudentSituation['status'], string> = {
  ACTIVE: 'Active',
  PENDING_VALIDATION: 'En attente de validation',
  CLOSED: 'Clôturée',
  REJECTED: 'Refusée',
};

export function StudentSituationPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const { getAccessToken } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [history, setHistory] = useState<StudentSituation[]>([]);
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [academicYearId, setAcademicYearId] = useState('');
  const [schoolLevelId, setSchoolLevelId] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [schoolClass, setSchoolClass] = useState('');

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token || !studentId) return;
    setLoading(true);
    setError(null);
    try {
      const [me, situations, levels, allSchools, years] = await Promise.all([
        parentProfileApi.listStudents(token).then((all) => all.find((s) => s.id === studentId) ?? null),
        schoolSituationApi.listHistory(token, studentId),
        referentialsApi.listSchoolLevels(token),
        referentialsApi.listSchools(token),
        referentialsApi.listAcademicYears(token),
      ]);
      setStudent(me);
      setHistory(situations);
      setSchoolLevels(levels);
      setSchools(allSchools);
      setAcademicYears(years);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger la situation scolaire.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, studentId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token || !studentId || !academicYearId || !schoolLevelId || !schoolId) return;
    setError(null);
    setNotice(null);
    try {
      const result = await schoolSituationApi.requestUpdate(token, studentId, {
        academicYearId,
        schoolLevelId,
        schoolId,
        schoolClass: schoolClass || undefined,
      });
      setNotice(
        result.status === 'ACTIVE'
          ? 'Situation scolaire mise à jour automatiquement.'
          : 'Demande envoyée : cette modification doit être validée par un administrateur.',
      );
      setSchoolClass('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'envoyer la demande.");
    }
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="dashboard-page">
        <p className="form-error">{error ?? 'Élève introuvable.'}</p>
      </div>
    );
  }

  const hasPending = history.some((s) => s.status === 'PENDING_VALIDATION');

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>
          Situation scolaire — {student.firstName} {student.lastName}
        </h1>
        <Link to="/parent/children">Retour à mes enfants</Link>
      </header>

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

      <section>
        <h2>Historique</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Année académique</th>
              <th>Niveau</th>
              <th>Établissement</th>
              <th>Classe</th>
              <th>Statut</th>
              <th>Début</th>
              <th>Fin</th>
            </tr>
          </thead>
          <tbody>
            {history.map((situation) => (
              <tr key={situation.id}>
                <td>{situation.academicYear.label}</td>
                <td>{situation.schoolLevel.name}</td>
                <td>{situation.school.name}</td>
                <td>{situation.class ?? '—'}</td>
                <td>
                  {STATUS_LABELS[situation.status]}
                  {situation.status === 'REJECTED' && situation.rejectionReason && (
                    <> — {situation.rejectionReason}</>
                  )}
                </td>
                <td>{new Date(situation.startDate).toLocaleDateString('fr-FR')}</td>
                <td>{situation.endDate ? new Date(situation.endDate).toLocaleDateString('fr-FR') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Déclarer une évolution</h2>
        {hasPending && (
          <p className="form-notice" role="status">
            Une modification est déjà en attente de validation par un administrateur.
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <label>
            Année académique
            <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} required>
              <option value="">Sélectionner...</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.label} {year.status === 'OPEN' ? '' : '(clôturée)'}
                </option>
              ))}
            </select>
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
            <input type="text" value={schoolClass} onChange={(e) => setSchoolClass(e.target.value)} />
          </label>
          <button type="submit" disabled={hasPending || !academicYearId || !schoolLevelId || !schoolId}>
            Envoyer
          </button>
        </form>
      </section>
    </div>
  );
}
