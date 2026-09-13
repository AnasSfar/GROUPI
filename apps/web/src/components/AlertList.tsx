import type { DashboardAlert } from '../api/dashboardApi';

const LEVEL_TONE: Record<DashboardAlert['level'], string> = {
  CRITICAL: 'tone-danger',
  IMPORTANT: 'tone-warning',
  INFORMATION: 'tone-neutral',
};

const LEVEL_LABEL: Record<DashboardAlert['level'], string> = {
  CRITICAL: 'Critique',
  IMPORTANT: 'Importante',
  INFORMATION: 'Informative',
};

/** Ch.16.8 : alertes recalculées à chaque chargement du tableau de bord, jamais stockées. Puce
 * colorée plutôt que badge pleine largeur + paragraphe : une ligne compacte par alerte. */
export function AlertList({ alerts }: { alerts: DashboardAlert[] }) {
  if (alerts.length === 0) {
    return <p className="table-hint">Aucune alerte pour le moment.</p>;
  }
  return (
    <ul className="activity-list">
      {alerts.map((alert, idx) => (
        <li key={`${alert.code}-${idx}`} className="activity-item alert-row">
          <span className={`status-dot ${LEVEL_TONE[alert.level]}`} title={LEVEL_LABEL[alert.level]} />
          <p>{alert.message}</p>
        </li>
      ))}
    </ul>
  );
}
