import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { Select } from './Select';
import { EmptyState } from './UiState';
import { ApiError } from '../api/client';
import * as groupsApi from '../api/groupsApi';
import * as announcementsApi from '../api/groupAnnouncementsApi';
import type { Group } from '../api/groupsApi';

/** Action rapide "Faire une annonce" (tableau de bord) : version courte du formulaire de
 * TeacherGroupAnnouncementsPage (pas de programmation ni d'expiration ici, pour rester rapide). */
export function QuickAnnouncementModal({ onClose, onPosted }: { onClose: () => void; onPosted: () => void }) {
  const { getAccessToken } = useAuth();
  const { showToast } = useToast();
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [groupId, setGroupId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const token = getAccessToken();
      if (!token) return;
      try {
        const list = await groupsApi.listMine(token);
        if (cancelled) return;
        const active = list.filter((g) => g.status === 'ACTIVE');
        setGroups(active);
        if (active[0]) setGroupId(active[0].id);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Impossible de charger les groupes.');
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [getAccessToken]);

  async function handleSubmit() {
    setError(null);
    if (!groupId || !title.trim() || !body.trim()) {
      setError('Choisis un groupe et renseigne un titre et un message.');
      return;
    }
    const token = getAccessToken();
    if (!token) return;
    setSubmitting(true);
    try {
      await announcementsApi.createAnnouncement(token, groupId, { title: title.trim(), body: body.trim() });
      showToast('Annonce publiée.');
      onPosted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Publication impossible.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="terms-modal-backdrop" onClick={onClose}>
      <div className="terms-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Faire une annonce</h2>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {groups?.length === 0 ? (
          <EmptyState title="Aucun groupe ouvert">Créez d'abord un groupe pour pouvoir y publier une annonce.</EmptyState>
        ) : (
          <div className="group-form">
            <label>
              Groupe
              <Select value={groupId} onChange={(e) => setGroupId(e.target.value)} disabled={!groups}>
                {groups?.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
            </label>
            <label>
              Titre
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label>
              Message
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                placeholder="Ex : la séance de jeudi est décalée à 19h..."
              />
            </label>
          </div>
        )}
        <div className="terms-modal-actions">
          <button type="button" className="ghost" onClick={onClose}>
            Annuler
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting || !groups?.length}>
            {submitting ? 'Publication...' : 'Publier'}
          </button>
        </div>
      </div>
    </div>
  );
}
