import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Select } from '../components/Select';
import { useToast } from '../components/Toast';
import { ApiError } from '../api/client';
import * as notificationsApi from '../api/notificationsApi';
import type { Activity, ActivityPriority } from '../api/notificationsApi';

const PRIORITY_LABELS: Record<ActivityPriority, string> = {
  INFORMATION: 'Information',
  IMPORTANT: 'Important',
  CRITICAL: 'Critique',
};

const PRIORITY_BADGE: Record<ActivityPriority, string> = {
  INFORMATION: 'badge-info',
  IMPORTANT: 'badge-warning',
  CRITICAL: 'badge-danger',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

/** Ch.18.3 : centre d'activités personnel — historique chronologique, plus récent d'abord. */
export function NotificationsPage() {
  const { getAccessToken } = useAuth();
  const { showToast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setActivities(await notificationsApi.listMine(token, filter));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger le centre d’activités.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleMarkRead(id: string) {
    const token = getAccessToken();
    if (!token) return;
    try {
      const updated = await notificationsApi.markRead(token, id);
      setActivities((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showToast('Marqué comme lu');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Le marquage comme lu a échoué.');
    }
  }

  async function handleMarkAllRead() {
    const token = getAccessToken();
    if (!token) return;
    try {
      await notificationsApi.markAllRead(token);
      showToast('Toutes les activités ont été marquées comme lues');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Le marquage comme lu a échoué.');
    }
  }

  const unreadCount = activities.filter((a) => !a.readAt).length;

  if (loading) {
    return <p>Chargement...</p>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Centre d’activités</h1>
          <p>Historique de toutes les activités qui vous concernent, de la plus récente à la plus ancienne.</p>
        </div>
        {unreadCount > 0 && (
          <button type="button" className="ghost" onClick={handleMarkAllRead}>
            Tout marquer comme lu ({unreadCount})
          </button>
        )}
      </div>

      <label className="status-filter">
        Afficher :
        <Select value={filter} onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}>
          <option value="all">Toutes</option>
          <option value="unread">Non lues uniquement</option>
        </Select>
      </label>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <section className="card-section">
        {activities.length === 0 && <p>Aucune activité pour le moment.</p>}
        {activities.length > 0 && (
          <ul className="activity-list">
            {activities.map((a) => (
              <li key={a.id} className={a.readAt ? 'activity-item' : 'activity-item activity-item-unread'}>
                <div className="activity-item-header">
                  <span className={`badge ${PRIORITY_BADGE[a.priority]}`}>{PRIORITY_LABELS[a.priority]}</span>
                  <strong>{a.title}</strong>
                  <span className="activity-item-date">{formatDateTime(a.createdAt)}</span>
                </div>
                {a.body && <p>{a.body}</p>}
                {!a.readAt && (
                  <button type="button" className="ghost-link" onClick={() => handleMarkRead(a.id)}>
                    Marquer comme lu
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
