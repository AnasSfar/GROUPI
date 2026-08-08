import type { ReactNode } from 'react';

export type StatTileTone = 'teal' | 'green' | 'amber' | 'red' | 'info';

export interface StatTile {
  label: string;
  value: string;
  icon?: ReactNode;
  tone?: StatTileTone;
}

export function StatGrid({ tiles }: { tiles: StatTile[] }) {
  return (
    <div className="card-grid stat-grid">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className={`card-section stat-tile${tile.icon ? ` stat-tile-icon tone-${tile.tone ?? 'teal'}` : ''}`}
        >
          {tile.icon ? (
            <>
              <span className="stat-tile-icon-chip">{tile.icon}</span>
              <p className="stat-value">{tile.value}</p>
              <p className="table-hint">{tile.label}</p>
            </>
          ) : (
            <>
              <p className="table-hint">{tile.label}</p>
              <p className="stat-value">{tile.value}</p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
