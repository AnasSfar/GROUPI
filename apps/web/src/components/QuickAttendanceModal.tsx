import { useNavigate } from 'react-router-dom';
import type { DashboardSessionSummary } from '../api/dashboardApi';
import { formatDateTime } from '../utils/format';
import { EmptyState } from './UiState';

/** Action rapide "Faire l'appel" (tableau de bord) : une simple liste de séances à traiter,
 * qui renvoie vers l'écran de présence dédié — pas de saisie de présence dupliquée ici. */
export function QuickAttendanceModal({
  sessions,
  onClose,
}: {
  sessions: DashboardSessionSummary[];
  onClose: () => void;
}) {
  const navigate = useNavigate();

  function goToAttendance(session: DashboardSessionSummary) {
    onClose();
    navigate(`/teacher/sessions/${session.id}/attendance`);
  }

  return (
    <div className="terms-modal-backdrop" onClick={onClose}>
      <div className="terms-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Faire l'appel</h2>
        {sessions.length === 0 ? (
          <EmptyState title="Aucune séance à traiter">
            Aucune séance du jour ou à venir n'est disponible pour l'appel pour l'instant.
          </EmptyState>
        ) : (
          <div className="quick-list">
            {sessions.map((s) => (
              <button key={s.id} type="button" className="quick-list-row" onClick={() => goToAttendance(s)}>
                <span className="quick-list-date">{formatDateTime(s.date, s.startTime)}</span>
                <span className="quick-list-group">{s.group.name}</span>
                <span className="quick-list-action">Appel →</span>
              </button>
            ))}
          </div>
        )}
        <div className="terms-modal-actions">
          <button type="button" className="ghost" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
