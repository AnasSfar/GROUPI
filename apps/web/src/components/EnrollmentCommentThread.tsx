import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as conversationsApi from '../api/enrollmentConversationsApi';
import type { EnrollmentComment } from '../api/enrollmentConversationsApi';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

/**
 * Ch.19.3 : fil de commentaires privé d'une inscription — intégré en ligne (pas de route dédiée)
 * dans les tableaux Professeur/Parent, sur le même modèle que les autres actions par ligne.
 * Le contrôle fin (fenêtre de 48h, gel après réponse) reste côté API (ERR-COM-004) : ce composant
 * n'affiche les actions de modification/suppression qu'à l'auteur, et relaie l'erreur serveur si
 * une tentative arrive malgré tout hors délai.
 */
export function EnrollmentCommentThread({ enrollmentId }: { enrollmentId: string }) {
  const { currentUser, getAccessToken } = useAuth();
  const [comments, setComments] = useState<EnrollmentComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setComments(await conversationsApi.listComments(token, enrollmentId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les commentaires.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, enrollmentId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePost() {
    const token = getAccessToken();
    if (!token || !draft.trim()) return;
    setError(null);
    try {
      const created = await conversationsApi.postComment(token, enrollmentId, draft.trim());
      setComments((prev) => [...prev, created]);
      setDraft('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "L'envoi du commentaire a échoué.");
    }
  }

  async function handleEdit(commentId: string) {
    const token = getAccessToken();
    if (!token || !editDraft.trim()) return;
    setError(null);
    try {
      const updated = await conversationsApi.editComment(token, enrollmentId, commentId, editDraft.trim());
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'La modification a échoué.');
    }
  }

  async function handleDelete(commentId: string) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      const updated = await conversationsApi.deleteComment(token, enrollmentId, commentId);
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'La suppression a échoué.');
    }
  }

  if (loading) {
    return <p>Chargement des commentaires...</p>;
  }

  const visible = comments.filter((c) => !c.deletedAt);

  return (
    <div className="comment-thread">
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {visible.length === 0 && <p>Aucun commentaire pour cette inscription.</p>}
      {visible.map((comment) => {
        const isAuthor = comment.authorId === currentUser?.id;
        return (
          <div key={comment.id} className="comment-item">
            <div className="comment-item-header">
              <strong>{comment.authorRole === 'TEACHER' ? 'Professeur' : 'Parent'}</strong>
              <span>{formatDateTime(comment.createdAt)}</span>
              {comment.editedAt && <span>(modifié)</span>}
            </div>
            {editingId === comment.id ? (
              <div className="comment-form">
                <textarea value={editDraft} onChange={(e) => setEditDraft(e.target.value)} />
                <button type="button" onClick={() => handleEdit(comment.id)}>
                  Enregistrer
                </button>
                <button type="button" className="ghost" onClick={() => setEditingId(null)}>
                  Annuler
                </button>
              </div>
            ) : (
              <>
                <p>{comment.body}</p>
                {isAuthor && (
                  <div className="comment-item-actions">
                    <button
                      type="button"
                      className="ghost-link"
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditDraft(comment.body);
                      }}
                    >
                      Modifier
                    </button>
                    <button type="button" className="ghost-link" onClick={() => handleDelete(comment.id)}>
                      Supprimer
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      <div className="comment-form">
        <textarea
          placeholder="Ajouter un commentaire..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="button" disabled={!draft.trim()} onClick={handlePost}>
          Publier
        </button>
      </div>
    </div>
  );
}
