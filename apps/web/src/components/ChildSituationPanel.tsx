import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Select } from './Select';
import { LoadingState } from './UiState';
import { ApiError } from '../api/client';
import * as referentialsApi from '../api/referentialsApi';
import * as schoolSituationApi from '../api/schoolSituationApi';
import type { AcademicYear, School, SchoolLevel } from '../api/referentialsApi';
import type { StudentSituation } from '../api/parentProfileApi';

const STATUS_LABELS: Record<StudentSituation['status'], string> = {
  ACTIVE: 'Active',
  PENDING_VALIDATION: 'En attente de validation',
  CLOSED: 'Clôturée',
  REJECTED: 'Refusée',
};

const STATUS_BADGE: Record<StudentSituation['status'], string> = {
  ACTIVE: 'badge-success',
  PENDING_VALIDATION: 'badge-warning',
  CLOSED: 'badge-neutral',
  REJECTED: 'badge-danger',
};

function formatSchoolOption(school: School) {
  const city = school.city?.name ? ` - ${school.city.name}` : '';
  const code = school.officialCode ? ` (${school.officialCode})` : '';
  return `${school.name}${city}${code}`;
}

/** Onglet "Situation scolaire" de la fiche enfant — extrait de StudentSituationPage, sans l'en-tête
 * de page ni le lien de retour (déjà dans la même fenêtre que le reste de la fiche). */
export function ChildSituationPanel({ studentId }: { studentId: string }) {
  const { getAccessToken } = useAuth();
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
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [situations, levels, allSchools, years] = await Promise.all([
        schoolSituationApi.listHistory(token, studentId),
        referentialsApi.listSchoolLevels(token),
        referentialsApi.listSchools(token),
        referentialsApi.listAcademicYears(token),
      ]);
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
    if (!token || !academicYearId || !schoolLevelId || !schoolId) return;
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
    return <LoadingState label="Chargement de la situation scolaire..." />;
  }

  const hasPending = history.some((s) => s.status === 'PENDING_VALIDATION');

  return (
    <>
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

      <p className="table-hint section-spacer">Historique</p>
      <div className="table-wrap">
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
                <td data-label="Année académique">{situation.academicYear.label}</td>
                <td data-label="Niveau">{situation.schoolLevel.name}</td>
                <td data-label="Établissement">{situation.school.name}</td>
                <td data-label="Classe">{situation.class ?? '—'}</td>
                <td data-label="Statut">
                  <span className={`badge ${STATUS_BADGE[situation.status]}`}>
                    {STATUS_LABELS[situation.status]}
                  </span>
                  {situation.status === 'REJECTED' && situation.rejectionReason && (
                    <span className="table-hint"> — {situation.rejectionReason}</span>
                  )}
                </td>
                <td data-label="Début">{new Date(situation.startDate).toLocaleDateString('fr-FR')}</td>
                <td data-label="Fin">{situation.endDate ? new Date(situation.endDate).toLocaleDateString('fr-FR') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="table-hint section-spacer">Déclarer une évolution</p>
      {hasPending && (
        <p className="form-notice" role="status">
          Une modification est déjà en attente de validation par un administrateur.
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <label>
          Année académique
          <Select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)}>
            <option value="">Sélectionner...</option>
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.label} {year.status === 'OPEN' ? '' : '(clôturée)'}
              </option>
            ))}
          </Select>
        </label>
        <label>
          Niveau scolaire
          <Select value={schoolLevelId} onChange={(e) => setSchoolLevelId(e.target.value)}>
            <option value="">Sélectionner...</option>
            {schoolLevels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </Select>
        </label>
        <label>
          Établissement
          <Select value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
            <option value="">Sélectionner...</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {formatSchoolOption(school)}
              </option>
            ))}
          </Select>
        </label>
        <label>
          Classe (indicatif)
          <input type="text" value={schoolClass} onChange={(e) => setSchoolClass(e.target.value)} />
        </label>
        <button type="submit" disabled={hasPending || !academicYearId || !schoolLevelId || !schoolId}>
          Envoyer
        </button>
      </form>
    </>
  );
}
