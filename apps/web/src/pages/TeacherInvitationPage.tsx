import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { ApiError } from '../api/client';
import * as parentInvitationsApi from '../api/parentInvitationsApi';
import type { ParentInvitation } from '../api/parentInvitationsApi';
import * as teacherProfileApi from '../api/teacherProfileApi';
import { IconCopy, IconPower, IconRefreshCw, IconWhatsApp } from '../components/icons';

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
 * Avenant 01, Ch. A.3.1 — espace « Inviter des parents » : un seul lien général, réutilisable pour
 * toutes les familles. « Copier le lien » est le geste de référence ; « Partager sur WhatsApp » est
 * une action secondaire facultative (ouvre `wa.me` avec un message pré-rempli, aucun envoi automatique).
 */
export function TeacherInvitationPage() {
  const { getAccessToken } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [invitation, setInvitation] = useState<ParentInvitation | null>(null);
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setInvitation(await parentInvitationsApi.getMine(token));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Impossible de charger votre lien d'invitation.",
      );
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    teacherProfileApi
      .getMyProfile(token)
      .then((profile) => setTeacherName(`${profile.firstName} ${profile.lastName}`.trim()))
      .catch(() => setTeacherName(null));
  }, [getAccessToken]);

  async function copyLink() {
    if (!invitation) return;
    try {
      await navigator.clipboard.writeText(invitation.url);
      showToast('Lien copié dans le presse-papier.');
    } catch {
      showToast("Impossible de copier le lien automatiquement : sélectionnez-le manuellement.", 'error');
    }
  }

  function shareOnWhatsApp() {
    if (!invitation) return;
    window.open(
      parentInvitationsApi.whatsAppShareUrl(invitation.url, teacherName ?? 'Votre professeur'),
      '_blank',
      'noopener',
    );
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
      setInvitation(await parentInvitationsApi.rotate(token));
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
          ? await parentInvitationsApi.disable(token)
          : await parentInvitationsApi.enable(token),
      );
      showToast(invitation.status === 'ACTIVE' ? 'Lien désactivé.' : 'Lien réactivé.');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de mettre à jour le lien.", 'error');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p>Chargement...</p>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Inviter des parents</h1>
          <p>
            Partagez ce lien unique avec les familles : elles créent leur compte, ajoutent leur enfant,
            et sont automatiquement rattachées à votre salle d'attente du niveau déclaré.
          </p>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {invitation && (
        <section className="card-section">
          <h2>
            Votre lien{' '}
            <span className={`badge ${STATUS_BADGE[invitation.status]}`}>
              {STATUS_LABELS[invitation.status]}
            </span>
          </h2>
          <div className="invite-link-box">
            <input type="text" readOnly value={invitation.url} onFocus={(e) => e.target.select()} />
          </div>
          <div className="page-actions invite-actions">
            <button type="button" className="btn-primary" onClick={copyLink} disabled={busy}>
              <IconCopy /> Copier le lien
            </button>
            <button type="button" className="whatsapp-btn" onClick={shareOnWhatsApp} disabled={busy}>
              <IconWhatsApp /> Partager sur WhatsApp
            </button>
            <button type="button" className="ghost" onClick={handleRotate} disabled={busy}>
              <IconRefreshCw /> Régénérer
            </button>
            <button type="button" className="ghost" onClick={handleToggle} disabled={busy}>
              <IconPower /> {invitation.status === 'ACTIVE' ? 'Désactiver' : 'Réactiver'}
            </button>
          </div>
          {invitation.expiresAt && (
            <p className="form-hint">
              Valide jusqu'au {new Date(invitation.expiresAt).toLocaleDateString('fr-FR')} (fin de
              l'année académique en cours).
            </p>
          )}
        </section>
      )}

      <section className="card-section">
        <h2>Comment ça marche</h2>
        <ol>
          <li>Copiez le lien et envoyez-le à une famille (WhatsApp, SMS, affichette...).</li>
          <li>Le Parent crée son compte (téléphone, mot de passe) et déclare son enfant.</li>
          <li>
            Si le niveau déclaré correspond à un de vos niveaux enseignés validés, l'enfant rejoint
            automatiquement votre « Salle d'attente » de ce niveau.
          </li>
          <li>Depuis « Salles d'attente », affectez ensuite l'élève à l'un de vos groupes standard.</li>
        </ol>
      </section>
    </>
  );
}
