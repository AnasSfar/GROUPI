import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Select } from '../components/Select';
import { ApiError } from '../api/client';
import * as referentialsApi from '../api/referentialsApi';
import * as parentProfileApi from '../api/parentProfileApi';
import type { City } from '../api/referentialsApi';
import type { SchoolAdditionRequest } from '../api/parentProfileApi';

const TYPE_LABELS: Record<string, string> = {
  COLLEGE: 'Collège',
  HIGH_SCHOOL: 'Lycée',
  PRIMARY: 'Primaire',
  OTHER: 'Autre',
};

const STATUS_BADGE: Record<SchoolAdditionRequest['status'], string> = {
  PENDING: 'badge-warning',
  APPROVED: 'badge-success',
  REJECTED: 'badge-danger',
};

const STATUS_LABEL: Record<SchoolAdditionRequest['status'], string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvée',
  REJECTED: 'Refusée',
};

export function ParentSchoolRequestsPage() {
  const { getAccessToken } = useAuth();
  const [requests, setRequests] = useState<SchoolAdditionRequest[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [cityId, setCityId] = useState('');
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [myRequests, allCities] = await Promise.all([
        parentProfileApi.listSchoolAdditionRequests(token),
        referentialsApi.listCities(token),
      ]);
      setRequests(myRequests);
      setCities(allCities);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger vos demandes.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token || !type || !cityId) return;
    setError(null);
    try {
      const created = await parentProfileApi.createSchoolAdditionRequest(token, {
        name,
        type,
        cityId,
        address: address || undefined,
        comment: comment || undefined,
      });
      setRequests((prev) => [created, ...prev]);
      setName('');
      setType('');
      setCityId('');
      setAddress('');
      setComment('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'envoyer cette demande.");
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Établissements</h1>
          <p>Vous ne trouvez pas l'établissement de votre enfant ? Demandez son ajout au référentiel.</p>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <section className="card-section">
        <h2>Demander l'ajout d'un établissement</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Nom de l'établissement
            <input type="text" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <div className="field-row">
            <label>
              Type
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Sélectionner...</option>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </label>
            <label>
              Ville
              <Select
                searchable
                searchPlaceholder="Rechercher une ville..."
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
              >
                <option value="">Sélectionner...</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          <label>
            Adresse (optionnel)
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
          </label>
          <label>
            Commentaire (optionnel)
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
          </label>
          <button type="submit" disabled={!name || !type || !cityId}>
            Envoyer la demande
          </button>
        </form>
      </section>

      <section className="card-section">
        <h2>Mes demandes ({requests.length})</h2>
        {loading ? (
          <p>Chargement...</p>
        ) : requests.length === 0 ? (
          <p className="table-hint">Aucune demande envoyée pour le moment.</p>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Établissement</th>
                  <th>Type</th>
                  <th>Ville</th>
                  <th>Statut</th>
                  <th>Détail</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td data-label="Établissement">{request.name}</td>
                    <td data-label="Type">{TYPE_LABELS[request.type] ?? request.type}</td>
                    <td data-label="Ville">{request.city.name}</td>
                    <td data-label="Statut">
                      <span className={`badge ${STATUS_BADGE[request.status]}`}>
                        {STATUS_LABEL[request.status]}
                      </span>
                    </td>
                    <td className="table-hint" data-label="Détail">
                      {request.status === 'REJECTED' && request.rejectionReason}
                      {request.status === 'APPROVED' && request.createdSchool && 'Ajouté au référentiel'}
                      {request.status === 'PENDING' && 'En cours d’examen par un administrateur'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
