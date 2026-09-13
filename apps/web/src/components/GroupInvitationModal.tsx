import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';
import { ApiError } from '../api/client';
import * as parentInvitationsApi from '../api/parentInvitationsApi';
import type { ParentInvitation } from '../api/parentInvitationsApi';

const STATUS_LABELS: Record<ParentInvitation['status'], string> = {
  ACTIVE: 'Actif',
  DISABLED: 'Désactivé',
  EXPIRED: 'Expiré',
};

const STATUS_BADGE: Record<ParentInvitation['status'], string> = {
  ACTIVE: 'badge-success',
  DISABLED: 'badge-neutral',
  EXPIRED: 'badge-danger',
};

/**
 * Ch. A (extension) : lien d'invitation ciblant directement CE groupe standard — pour un nouvel
 * élève en cours d'année. Contrairement au lien général (`TeacherInvitationPage`), l'enfant
 * rejoint directement ce groupe plutôt que la salle d'attente du niveau (si sa situation scolaire
 * correspond bien au niveau/année du groupe).
 */
export function GroupInvitationModal({ groupId, groupName, onClose }: { groupId: string; groupName: string; onClose: () => void }) {
  const { getAccessToken } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [invitation, setInvitation] = useState<ParentInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setInvitation(await parentInvitationsApi.getForGroup(token, groupId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de charger le lien d'invitation.");
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, groupId]);

  useEffect(() => {
    load();
  }, [load]);

  async function copyLink() {
    if (!invitation) return;
    try {
      await navigator.clipboard.writeText(invitation.url);
      showToast('Lien copié dans le presse-papier.');
    } catch {
      showToast('Impossible de copier le lien automatiquement : sélectionnez-le manuellement.', 'error');
    }
  }

  function shareOnWhatsApp() {
    if (!invitation) return;
    window.open(parentInvitationsApi.whatsAppShareUrl(invitation.url, 'GROUPI'), '_blank', 'noopener');
  }

  async function handleRotate() {
    const ok = await confirm({
      title: 'Régénérer le lien',
      message: "L'ancien lien deviendra immédiatement invalide pour toute nouvelle famille. Continuer ?",
      danger: true,
    });
    if (!ok) return;
    const token = getAccessToken();
    if (!token) return;
    setBusy(true);
    try {
      setInvitation(await parentInvitationsApi.rotateForGroup(token, groupId));
      showToast('Lien régénéré.');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Impossible de régénérer le lien.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle() {
    const token = getAccessToken();
    if (!token || !invitation) return;
    setBusy(true);
    try {
      setInvitation(
        invitation.status === 'ACTIVE'
          ? await parentInvitationsApi.disableForGroup(token, groupId)
          : await parentInvitationsApi.enableForGroup(token, groupId),
      );
      showToast(invitation.status === 'ACTIVE' ? 'Lien désactivé.' : 'Lien réactivé.');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Impossible de mettre à jour le lien.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="terms-modal-backdrop" onClick={onClose}>
      <div className="terms-modal terms-modal-wide" onClick={(e) => e.stopPropagation()}>
        <h2>Inviter un nouvel élève — {groupName}</h2>
        <p className="form-hint">
          Ce lien amène directement au groupe « {groupName} » : la famille crée son compte, déclare
          son enfant, et celui-ci est inscrit directement dans ce groupe (si son niveau correspond),
          sans passer par la salle d'attente.
        </p>

        {loading && <p>Chargement...</p>}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {invitation && (
          <>
            <h3>
              Votre lien{' '}
              <span className={`badge ${STATUS_BADGE[invitation.status]}`}>{STATUS_LABELS[invitation.status]}</span>
            </h3>
            <div className="field-row">
              <input type="text" readOnly value={invitation.url} onFocus={(e) => e.target.select()} />
            </div>
            <div className="page-actions">
              <button type="button" onClick={copyLink} disabled={busy}>
                Copier le lien
              </button>
              <button type="button" className="ghost" onClick={shareOnWhatsApp} disabled={busy}>
                Partager sur WhatsApp
              </button>
              <button type="button" className="ghost" onClick={handleRotate} disabled={busy}>
                Régénérer
              </button>
              <button type="button" className="ghost" onClick={handleToggle} disabled={busy}>
                {invitation.status === 'ACTIVE' ? 'Désactiver' : 'Réactiver'}
              </button>
            </div>
          </>
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
