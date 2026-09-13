import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Select } from './Select';
import { LoadingState } from './UiState';
import { ApiError } from '../api/client';
import * as referentialsApi from '../api/referentialsApi';
import * as schoolSituationApi from '../api/schoolSituationApi';
import type { AcademicYear, School, SchoolLevel } from '../api/referentialsApi';
import type { StudentSituation } from '../api/parentProfileApi';

export const SITUATION_STATUS_LABELS: Record<StudentSituation['status'], string> = {
  ACTIVE: 'Active',
  PENDING_VALIDATION: 'En attente de validation',
  CLOSED: 'Clôturée',
  REJECTED: 'Refusée',
};

const STATUS_TONE: Record<StudentSituation['status'], string> = {
  ACTIVE: 'tone-success',
  PENDING_VALIDATION: 'tone-warning',
  CLOSED: 'tone-neutral',
  REJECTED: 'tone-danger',
};

/** Statut "en tête de fiche" à afficher devant le nom de l'élève (ParentChildrenPage) — une
 * validation en attente prime toujours (action la plus urgente pour le Parent), sinon la
 * situation active, sinon le statut de la dernière situation connue (typiquement clôturée). */
export function headlineSituationStatus(history: StudentSituation[]): { tone: string; label: string } | null {
  if (history.length === 0) return null;
  if (history.some((s) => s.status === 'PENDING_VALIDATION')) {
    return { tone: STATUS_TONE.PENDING_VALIDATION, label: SITUATION_STATUS_LABELS.PENDING_VALIDATION };
  }
  const active = history.find((s) => s.status === 'ACTIVE');
  if (active) return { tone: STATUS_TONE.ACTIVE, label: SITUATION_STATUS_LABELS.ACTIVE };
  return { tone: STATUS_TONE[history[0].status], label: SITUATION_STATUS_LABELS[history[0].status] };
}

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
  const mostRecent = history[0];

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
            </tr>
          </thead>
          <tbody>
            {history.map((situation) => (
              <tr key={situation.id}>
                <td data-label="Année académique">{situation.academicYear.label}</td>
                <td data-label="Niveau">{situation.schoolLevel.name}</td>
                <td data-label="Établissement">{situation.school.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="table-hint section-spacer">Déclarer une évolution</p>
      {!hasPending && mostRecent?.status === 'REJECTED' && mostRecent.rejectionReason && (
        <p className="form-error" role="alert">
          Votre dernière demande a été refusée : {mostRecent.rejectionReason}
        </p>
      )}
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
