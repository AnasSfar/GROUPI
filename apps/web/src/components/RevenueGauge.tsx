import { useEffect, useState } from 'react';
import { formatAmount } from '../utils/format';

/** Barre de progression : le prévisionnel sert de référence (piste pleine, en or), le réalisé
 * (bleu) et l'encaissé (vert) se lisent comme deux remplissages superposés contre cette référence. */
export function RevenueGauge({
  label,
  forecast,
  realized,
  collected,
}: {
  label: string;
  forecast: number;
  realized: number;
  collected: number;
}) {
  const realizedRatio = forecast > 0 ? Math.max(0, Math.min(1, realized / forecast)) : 0;
  const collectedRatio = forecast > 0 ? Math.max(0, Math.min(1, collected / forecast)) : 0;

  const [ratios, setRatios] = useState({ realized: 0, collected: 0 });
  useEffect(() => {
    const frame = requestAnimationFrame(() => setRatios({ realized: realizedRatio, collected: collectedRatio }));
    return () => cancelAnimationFrame(frame);
  }, [realizedRatio, collectedRatio]);

  return (
    <div className="revenue-bar">
      <div className="revenue-bar-header">
        <p className="revenue-bar-label">{label}</p>
        <p className="revenue-bar-total">{formatAmount(forecast)}</p>
      </div>
      <div
        className="revenue-bar-track"
        role="img"
        aria-label={`${label} : prévisionnel ${formatAmount(forecast)}, réalisé ${formatAmount(realized)}, encaissé ${formatAmount(collected)}`}
      >
        <div className="revenue-bar-fill-realized" style={{ width: `${ratios.realized * 100}%` }} />
        <div className="revenue-bar-fill-collected" style={{ width: `${ratios.collected * 100}%` }} />
      </div>
      <ul className="revenue-gauge-legend">
        <li className="tone-amber">
          <span className="revenue-gauge-legend-dot" />
          Prévisionnel <strong>{formatAmount(forecast)}</strong>
        </li>
        <li className="tone-info">
          <span className="revenue-gauge-legend-dot" />
          Réalisé <strong>{formatAmount(realized)}</strong>
        </li>
        <li className="tone-green">
          <span className="revenue-gauge-legend-dot" />
          Encaissé <strong>{formatAmount(collected)}</strong>
        </li>
      </ul>
    </div>
  );
}
