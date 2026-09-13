import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { ApiError } from '../api/client';
import * as groupChangeApi from '../api/groupChangeApi';
import type { EligibleTargetGroup } from '../api/groupChangeApi';
import { formatSchedules } from '../api/groupsApi';

/**
 * Avenant 01, Ch. D.2/D.3/D.4 : sélecteur de groupe cible pour une demande de changement de groupe.
 * Remplace, pour ce seul besoin, la recherche de groupes supprimée (`ParentGroupSearchPage` /
 * `GET /groups/search`) — les groupes proposés sont déjà restreints par l'API au même Professeur,
 * même matière et même niveau que l'inscription d'origine (RM-PAR-025) : le Parent ne "recherche"
 * plus rien, il choisit parmi une liste déjà cloisonnée.
 */
export function GroupChangeTargetPicker({
  enrollmentId,
  onRequested,
}: {
  enrollmentId: string;
  onRequested?: () => void;
}) {
  const { getAccessToken } = useAuth();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<EligibleTargetGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [requestingGroupId, setRequestingGroupId] = useState<string | null>(null);

  async function handleOpen() {
    const token = getAccessToken();
    if (!token) return;
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const result = await groupChangeApi.listEligibleTargetGroups(token, enrollmentId);
      setGroups(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les groupes disponibles.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(targetGroupId: string) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      await groupChangeApi.createGroupChangeRequest(token, { enrollmentId, targetGroupId });
      showToast('Demande de changement de groupe envoyée');
      setOpen(false);
      setRequestingGroupId(null);
      onRequested?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'envoyer la demande.");
    }
  }

  if (!open) {
    return (
      <button type="button" className="ghost" onClick={handleOpen}>
        Demander un changement de groupe
      </button>
    );
  }

  return (
    <div className="reason-prompt">
      {loading && <p>Chargement des groupes disponibles...</p>}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!loading && groups.length === 0 && !error && (
        <p className="table-hint">
          Aucun autre groupe disponible chez ce même Professeur pour cette matière et ce niveau.
        </p>
      )}
      {!loading && groups.length > 0 && (
        <ul className="tag-list">
          {groups.map((g) => (
            <li key={g.id} className="tag">
              <div>
                <strong>{g.name}</strong> — {formatSchedules(g.schedules)} — {g.publicPrice} TND
                {!g.hasAvailableSpots && <span className="badge badge-warning"> Complet</span>}
              </div>
              {requestingGroupId === g.id ? (
                <>
                  <button type="button" disabled={!g.hasAvailableSpots} onClick={() => handleConfirm(g.id)}>
                    Confirmer ce groupe
                  </button>
                  <button type="button" className="ghost" onClick={() => setRequestingGroupId(null)}>
                    Annuler
                  </button>
                </>
              ) : (
                <button type="button" disabled={!g.hasAvailableSpots} onClick={() => setRequestingGroupId(g.id)}>
                  Choisir
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="ghost" onClick={() => setOpen(false)}>
        Fermer
      </button>
    </div>
  );
}
