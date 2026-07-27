/** Ch.14.9 : jauge de taux d'assiduité — le remplissage porte la sévérité (succès/attention/danger). */
export function AttendanceMeter({ rate }: { rate: number | null }) {
  if (rate === null) {
    return <span className="meter-value">—</span>;
  }
  const pct = Math.round(rate * 100);
  const severity = pct >= 80 ? '' : pct >= 50 ? 'meter-warning' : 'meter-danger';
  return (
    <div className="meter">
      <div className="meter-track">
        <div className={`meter-fill ${severity}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="meter-value">{pct}%</span>
    </div>
  );
}
