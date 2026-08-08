import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../components/ConfirmDialog';
import { ApiError } from '../api/client';
import * as groupsApi from '../api/groupsApi';
import * as announcementsApi from '../api/groupAnnouncementsApi';
import type { Group } from '../api/groupsApi';
import type { AnnouncementEffectiveStatus, TeacherGroupAnnouncement } from '../api/groupAnnouncementsApi';

const STATUS_LABELS: Record<AnnouncementEffectiveStatus, string> = {
  SCHEDULED: 'Programmée',
  PUBLISHED: 'Publiée',
  EXPIRED: 'Expirée',
  DELETED: 'Supprimée',
};

const STATUS_BADGE: Record<AnnouncementEffectiveStatus, string> = {
  SCHEDULED: 'badge-info',
  PUBLISHED: 'badge-success',
  EXPIRED: 'badge-neutral',
  DELETED: 'badge-neutral',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

/** Ch.19.4 : gestion des annonces de groupe par le Professeur — création, programmation, suivi de lecture. */
export function TeacherGroupAnnouncementsPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { getAccessToken } = useAuth();
  const confirm = useConfirm();
  const [group, setGroup] = useState<Group | null>(null);
  const [announcements, setAnnouncements] = useState<TeacherGroupAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [scheduled, setScheduled] = useState(false);
  const [publishAt, setPublishAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState('');

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token || !groupId) return;
    setLoading(true);
    setError(null);
    try {
      const [groups, list] = await Promise.all([
        groupsApi.listMine(token),
        announcementsApi.listForGroup(token, groupId) as Promise<TeacherGroupAnnouncement[]>,
      ]);
      setGroup(groups.find((g) => g.id === groupId) ?? null);
      setAnnouncements(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les annonces.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, groupId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token || !groupId || !title.trim() || !body.trim()) return;
    setError(null);
    setNotice(null);
    try {
      await announcementsApi.createAnnouncement(token, groupId, {
        title: title.trim(),
        body: body.trim(),
        scheduled,
        publishAt: scheduled && publishAt ? new Date(publishAt).toISOString() : undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });
      setNotice('Annonce créée.');
      setTitle('');
      setBody('');
      setScheduled(false);
      setPublishAt('');
      setExpiresAt('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "La création de l'annonce a échoué.");
    }
  }

  function startEdit(a: TeacherGroupAnnouncement) {
    setEditingId(a.id);
    setEditTitle(a.title);
    setEditBody(a.body);
    setEditExpiresAt(a.expiresAt ? a.expiresAt.slice(0, 10) : '');
  }

  async function handleSaveEdit(id: string) {
    const token = getAccessToken();
    if (!token || !groupId) return;
    setError(null);
    try {
      await announcementsApi.updateAnnouncement(token, groupId, id, {
        title: editTitle.trim(),
        body: editBody.trim(),
        expiresAt: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
      });
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'La modification a échoué.');
    }
  }

  async function handleDelete(id: string) {
    const token = getAccessToken();
    if (!token || !groupId) return;
    const ok = await confirm({
      title: 'Supprimer cette annonce ?',
      message: 'Cette action est irréversible.',
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    setError(null);
    try {
      await announcementsApi.deleteAnnouncement(token, groupId, id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'La suppression a échoué.');
    }
  }

  if (loading) {
    return <p>Chargement...</p>;
  }

  if (!group) {
    return <p className="form-error">{error ?? 'Groupe introuvable.'}</p>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Annonces — {group.name}</h1>
          <p>Publiez une information collective à destination de tous les Parents du groupe.</p>
        </div>
        <div className="page-actions">
          <Link to="/teacher/groups">← Retour à mes groupes</Link>
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
        <h2>Nouvelle annonce</h2>
        <form onSubmit={handleCreate}>
          <label>
            Titre
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label>
            Message
            <textarea value={body} onChange={(e) => setBody(e.target.value)} required />
          </label>
          <label>
            <input type="checkbox" checked={scheduled} onChange={(e) => setScheduled(e.target.checked)} />
            Publication programmée
          </label>
          {scheduled && (
            <label>
              Date de publication
              <input type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} />
            </label>
          )}
          <label>
            Date d'expiration (optionnel)
            <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </label>
          <button type="submit" disabled={!title.trim() || !body.trim() || (scheduled && !publishAt)}>
            Publier
          </button>
        </form>
      </section>

      <section className="card-section">
        <h2>Annonces ({announcements.length})</h2>
        {announcements.length === 0 && <p>Aucune annonce pour ce groupe.</p>}
        {announcements.map((a) => (
          <div key={a.id} className="announcement-item">
            {editingId === a.id ? (
              <div className="comment-form">
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} />
                <input type="date" value={editExpiresAt} onChange={(e) => setEditExpiresAt(e.target.value)} />
                <button type="button" onClick={() => handleSaveEdit(a.id)}>
                  Enregistrer
                </button>
                <button type="button" className="ghost" onClick={() => setEditingId(null)}>
                  Annuler
                </button>
              </div>
            ) : (
              <>
                <div className="announcement-item-header">
                  <span className={`badge ${STATUS_BADGE[a.effectiveStatus]}`}>
                    {STATUS_LABELS[a.effectiveStatus]}
                  </span>
                  <strong>{a.title}</strong>
                </div>
                <p>{a.body}</p>
                <p className="announcement-item-meta">
                  Publication : {formatDateTime(a.publishAt)}
                  {a.expiresAt && ` — Expire le ${formatDateTime(a.expiresAt)}`}
                  {' — '}
                  Lue par {a.readCount}/{a.totalParents} Parent(s)
                </p>
                {a.effectiveStatus !== 'DELETED' && (
                  <div className="comment-item-actions">
                    <button type="button" className="ghost-link" onClick={() => startEdit(a)}>
                      Modifier
                    </button>
                    <button type="button" className="ghost-link" onClick={() => handleDelete(a.id)}>
                      Supprimer
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </section>
    </>
  );
}
