import { useEffect, useState } from 'react';

export type GaugeTone = 'teal' | 'green' | 'amber' | 'red' | 'info';

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Seuils calqués sur AttendanceMeter (Ch.14.9) : le remplissage porte la sévérité. */
export function gaugeToneFromRate(rate: number | null | undefined): GaugeTone {
  if (rate == null) return 'teal';
  const pct = rate * 100;
  return pct >= 80 ? 'green' : pct >= 50 ? 'amber' : 'red';
}

/** Jauge circulaire (0-1) : lecture rapide d'un taux clé (assiduité, occupation...) en
 * complément des tuiles KPI chiffrées de StatGrid. L'anneau s'anime de 0 vers sa valeur au
 * montage, jamais en boucle — pas de gêne pour la lecture, juste un point d'entrée vivant. */
export function RadialGauge({
  value,
  label,
  displayValue,
  tone = 'teal',
  size = 108,
}: {
  value: number;
  label: string;
  displayValue?: string;
  tone?: GaugeTone;
  size?: number;
}) {
  const clamped = Math.max(0, Math.min(1, value));
  const [offset, setOffset] = useState(CIRCUMFERENCE);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setOffset(CIRCUMFERENCE * (1 - clamped)));
    return () => cancelAnimationFrame(frame);
  }, [clamped]);

  return (
    <div className={`radial-gauge tone-${tone}`}>
      <div className="radial-gauge-ring" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`${label} : ${Math.round(clamped * 100)}%`}>
          <circle className="radial-gauge-track" cx="50" cy="50" r={RADIUS} />
          <circle
            className="radial-gauge-fill"
            cx="50"
            cy="50"
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="radial-gauge-value" aria-hidden="true">
          <strong>{displayValue ?? `${Math.round(clamped * 100)}%`}</strong>
        </div>
      </div>
      <p className="radial-gauge-label">{label}</p>
    </div>
  );
}
