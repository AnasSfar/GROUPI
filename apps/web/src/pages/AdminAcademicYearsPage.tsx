import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as referentialsApi from '../api/referentialsApi';
import type { AcademicYear } from '../api/referentialsApi';

/** PERM-REF-001 : création d'une nouvelle année académique (Super Admin / Admin délégué). */
export function AdminAcademicYearsPage() {
  const { getAccessToken } = useAuth();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [label, setLabel] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const result = await referentialsApi.listAcademicYears(token);
      setYears(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les années académiques.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    setNotice(null);
    try {
      await referentialsApi.createAcademicYear(token, { label, startDate, endDate });
      setNotice(`Année académique "${label}" créée.`);
      setLabel('');
      setStartDate('');
      setEndDate('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de créer cette année académique.');
    }
  }

  if (loading) {
    return <p>Chargement...</p>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Années académiques</h1>
          <p>Référentiel partagé par les groupes, préinscriptions et situations scolaires (Ch.23).</p>
        </div>
      </div>

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

      <section className="card-section">
        <h2>Années existantes ({years.length})</h2>
        {years.length === 0 && <p>Aucune année académique pour le moment.</p>}
        {years.length > 0 && (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Libellé</th>
                  <th>Début</th>
                  <th>Fin</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {years.map((year) => (
                  <tr key={year.id}>
                    <td data-label="Libellé">{year.label}</td>
                    <td data-label="Début">{new Date(year.startDate).toLocaleDateString('fr-FR')}</td>
                    <td data-label="Fin">{new Date(year.endDate).toLocaleDateString('fr-FR')}</td>
                    <td data-label="Statut">
                      <span className={`badge ${year.status === 'OPEN' ? 'badge-success' : 'badge-neutral'}`}>
                        {year.status === 'OPEN' ? 'Ouverte' : 'Clôturée'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card-section">
        <h2>Créer une nouvelle année académique</h2>
        <form onSubmit={handleCreate}>
          <label>
            Libellé
            <input
              type="text"
              required
              placeholder="ex. 2027-2028"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </label>
          <div className="field-row">
            <label>
              Date de début
              <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label>
              Date de fin
              <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>
          </div>
          <button type="submit" disabled={!label || !startDate || !endDate}>
            Créer l'année académique
          </button>
        </form>
      </section>
    </>
  );
}
