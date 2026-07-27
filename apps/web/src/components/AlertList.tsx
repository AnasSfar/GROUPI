import type { DashboardAlert } from '../api/dashboardApi';
import { IconAlertTriangle } from './icons';

const LEVEL_BADGE: Record<DashboardAlert['level'], string> = {
  CRITICAL: 'badge-danger',
  IMPORTANT: 'badge-warning',
  INFORMATION: 'badge-info',
};

const LEVEL_LABEL: Record<DashboardAlert['level'], string> = {
  CRITICAL: 'Critique',
  IMPORTANT: 'Importante',
  INFORMATION: 'Informative',
};

/** Ch.16.8 : alertes recalculées à chaque chargement du tableau de bord, jamais stockées. */
export function AlertList({ alerts }: { alerts: DashboardAlert[] }) {
  if (alerts.length === 0) {
    return <p className="table-hint">Aucune alerte pour le moment.</p>;
  }
  return (
    <ul className="activity-list">
      {alerts.map((alert, idx) => (
        <li key={`${alert.code}-${idx}`} className="activity-item">
          <div className="activity-item-header">
            <IconAlertTriangle width={16} height={16} />
            <span className={`badge ${LEVEL_BADGE[alert.level]}`}>{LEVEL_LABEL[alert.level]}</span>
          </div>
          <p>{alert.message}</p>
        </li>
      ))}
    </ul>
  );
}
