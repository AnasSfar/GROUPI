import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as announcementsApi from '../api/groupAnnouncementsApi';
import type { GroupAnnouncement } from '../api/groupAnnouncementsApi';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR');
}

/**
 * Ch.19.4 : fil de lecture des annonces d'un groupe, côté Parent — l'API ne renvoie déjà que les
 * annonces effectivement publiées et non expirées (visibilité paresseuse côté serveur). La
 * première consultation vaut lecture (RM-COM-011) : chaque annonce affichée est marquée lue.
 * RM-COM-020 : `onViewConversation`, si fourni, affiche un lien "Voir la conversation" sur chaque
 * annonce menant au fil de commentaires de l'inscription concernée (le Parent ne peut pas répondre
 * à une annonce, RM-COM-010 — il ne peut réagir qu'en passant par le fil de commentaires).
 */
export function GroupAnnouncementsFeed({
  groupId,
  onViewConversation,
}: {
  groupId: string;
  onViewConversation?: () => void;
}) {
  const { getAccessToken } = useAuth();
  const [announcements, setAnnouncements] = useState<GroupAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const token = getAccessToken();
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const list = await announcementsApi.listForGroup(token, groupId);
        if (cancelled) return;
        setAnnouncements(list);
        await Promise.all(list.map((a) => announcementsApi.markRead(token, groupId, a.id)));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Impossible de charger les annonces.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [getAccessToken, groupId]);

  if (loading) {
    return <p>Chargement des annonces...</p>;
  }

  return (
    <div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {announcements.length === 0 && <p>Aucune annonce pour ce groupe.</p>}
      {announcements.map((a) => (
        <div key={a.id} className="announcement-item">
          <div className="announcement-item-header">
            <strong>{a.title}</strong>
          </div>
          <p>{a.body}</p>
          <p className="announcement-item-meta">Publiée le {formatDate(a.publishAt)}</p>
          {onViewConversation && (
            <button type="button" className="ghost-link" onClick={onViewConversation}>
              Voir la conversation
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
