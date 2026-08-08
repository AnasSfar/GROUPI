import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as attendanceApi from '../api/attendanceApi';
import { AttendanceMeter } from './AttendanceMeter';
import { LoadingState } from './UiState';
import type { ParentAttendanceView } from '../api/attendanceApi';

const STATUS_BADGE: Record<string, string> = {
  PRESENT: 'badge-success',
  LATE: 'badge-info',
  EXCUSED_ABSENT: 'badge-warning',
  UNEXCUSED_ABSENT: 'badge-danger',
};

/** Onglet "Présences" de la fiche enfant — extrait de ParentChildAttendancePage, sans l'en-tête
 * de page ni le lien de retour (déjà dans la même fenêtre que le reste de la fiche). */
export function ChildAttendancePanel({ studentId }: { studentId: string }) {
  const { getAccessToken } = useAuth();
  const [view, setView] = useState<ParentAttendanceView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setView(await attendanceApi.getChildAttendance(token, studentId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de charger les présences de l'enfant.");
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, studentId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <LoadingState label="Chargement des présences..." />;
  }

  if (!view) {
    return <p className="form-error">{error ?? 'Présences indisponibles.'}</p>;
  }

  const { summary, entries } = view;

  return (
    <>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="stat-tiles">
        <div className="stat-tile">
          <div className="stat-tile-value">{summary.totalSessions}</div>
          <div className="stat-tile-label">Séances</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-value">{summary.present}</div>
          <div className="stat-tile-label">Présent</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-value">{summary.late}</div>
          <div className="stat-tile-label">Retards</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-value">{summary.excusedAbsences}</div>
          <div className="stat-tile-label">Absences excusées</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-value">{summary.unexcusedAbsences}</div>
          <div className="stat-tile-label">Absences non excusées</div>
        </div>
      </div>
      <label>
        Taux d'assiduité global
        <AttendanceMeter rate={summary.attendanceRate} />
      </label>

      <p className="table-hint section-spacer">Historique ({entries.length})</p>
      {entries.length === 0 && <p>Aucune présence enregistrée pour le moment.</p>}
      {entries.length > 0 && (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Heure</th>
                <th>Groupe</th>
                <th>Statut</th>
                <th>Facturation</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td data-label="Date">{new Date(entry.session.date).toLocaleDateString('fr-FR')}</td>
                  <td data-label="Heure">{entry.session.startTime}</td>
                  <td data-label="Groupe">{entry.group.name}</td>
                  <td data-label="Statut">
                    <span className={`badge ${STATUS_BADGE[entry.status] ?? 'badge-neutral'}`}>
                      {entry.statusLabel}
                    </span>
                  </td>
                  <td data-label="Facturation">{entry.billable ? 'Facturée' : 'Non facturée'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
