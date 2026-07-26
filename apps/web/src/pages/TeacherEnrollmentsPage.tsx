import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as groupsApi from '../api/groupsApi';
import * as enrollmentsApi from '../api/enrollmentsApi';
import type { Group } from '../api/groupsApi';
import type { TeacherEnrollment, EnrollmentStatus } from '../api/enrollmentsApi';

const STATUS_LABELS: Record<EnrollmentStatus, string> = {
  PENDING_VALIDATION: 'En attente',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspendue',
  REJECTED: 'Refusée',
  ARCHIVED: 'Archivée',
  CANCELLED: 'Annulée',
  EXPIRED: 'Expirée',
};

const STATUS_BADGE: Record<EnrollmentStatus, string> = {
  PENDING_VALIDATION: 'badge-warning',
  ACTIVE: 'badge-success',
  SUSPENDED: 'badge-danger',
  REJECTED: 'badge-danger',
  ARCHIVED: 'badge-neutral',
  CANCELLED: 'badge-neutral',
  EXPIRED: 'badge-neutral',
};

export function TeacherEnrollmentsPage() {
  const { getAccessToken } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [enrollments, setEnrollments] = useState<TeacherEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const loadGroups = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const myGroups = await groupsApi.listMine(token);
      setGroups(myGroups);
      setSelectedGroupId((current) => current || myGroups[0]?.id || '');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger vos groupes.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  const loadEnrollments = useCallback(async () => {
    const token = getAccessToken();
    if (!token || !selectedGroupId) {
      setEnrollments([]);
      return;
    }
    setLoadingEnrollments(true);
    setError(null);
    try {
      const result = await enrollmentsApi.listByGroup(token, selectedGroupId);
      setEnrollments(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les inscriptions.');
    } finally {
      setLoadingEnrollments(false);
    }
  }, [getAccessToken, selectedGroupId]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  async function runAction(action: () => Promise<TeacherEnrollment>) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      const updated = await action();
      setEnrollments((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "L'opération a échoué.");
    }
  }

  function priceDraftValue(enrollmentId: string) {
    return priceDrafts[enrollmentId] ?? '';
  }

  function setPriceDraft(enrollmentId: string, value: string) {
    setPriceDrafts((prev) => ({ ...prev, [enrollmentId]: value }));
  }

  function commentDraftValue(enrollmentId: string) {
    return commentDrafts[enrollmentId] ?? '';
  }

  function setCommentDraft(enrollmentId: string, value: string) {
    setCommentDrafts((prev) => ({ ...prev, [enrollmentId]: value }));
  }

  function handleAccept(enrollmentId: string) {
    const token = getAccessToken();
    if (!token) return;
    const draft = priceDraftValue(enrollmentId);
    const customPrice = draft.trim() === '' ? undefined : Number(draft);
    runAction(() =>
      enrollmentsApi.acceptEnrollment(token, selectedGroupId, enrollmentId, { customPrice }),
    );
  }

  function handleReject(enrollmentId: string) {
    const token = getAccessToken();
    if (!token) return;
    const comment = commentDraftValue(enrollmentId);
    runAction(() =>
      enrollmentsApi.rejectEnrollment(token, selectedGroupId, enrollmentId, {
        comment: comment.trim() === '' ? undefined : comment,
      }),
    );
  }

  function handleUpdatePrice(enrollmentId: string) {
    const token = getAccessToken();
    if (!token) return;
    const draft = priceDraftValue(enrollmentId);
    if (draft.trim() === '') return;
    runAction(() => enrollmentsApi.updateEnrollmentPrice(token, selectedGroupId, enrollmentId, Number(draft)));
  }

  function handleSuspend(enrollmentId: string) {
    const token = getAccessToken();
    if (!token) return;
    runAction(() => enrollmentsApi.suspendEnrollment(token, selectedGroupId, enrollmentId));
  }

  function handleReactivate(enrollmentId: string) {
    const token = getAccessToken();
    if (!token) return;
    runAction(() => enrollmentsApi.reactivateEnrollment(token, selectedGroupId, enrollmentId));
  }

  function handleArchive(enrollmentId: string) {
    const token = getAccessToken();
    if (!token) return;
    runAction(() => enrollmentsApi.archiveEnrollment(token, selectedGroupId, enrollmentId));
  }

  if (loading) {
    return <p>Chargement...</p>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Inscriptions</h1>
          <p>Décidez des demandes d'inscription, définissez un tarif personnalisé et gérez le cycle de vie.</p>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <section className="card-section">
        <label>
          Groupe
          <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}>
            {groups.length === 0 && <option value="">Aucun groupe</option>}
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} — {g.subject.name} ({g.schoolLevel.name})
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="card-section">
        <h2>Demandes et inscriptions ({enrollments.length})</h2>
        {loadingEnrollments && <p>Chargement...</p>}
        {!loadingEnrollments && enrollments.length === 0 && (
          <p>Aucune inscription pour ce groupe.</p>
        )}
        {!loadingEnrollments && enrollments.length > 0 && (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Élève</th>
                  <th>Parent</th>
                  <th>Établissement / Niveau / Classe</th>
                  <th>Statut</th>
                  <th>Tarif personnalisé</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id}>
                    <td>
                      {enrollment.student.firstName} {enrollment.student.lastName}
                    </td>
                    <td>
                      {enrollment.student.parent.firstName} {enrollment.student.parent.lastName}
                    </td>
                    <td>
                      {enrollment.student.currentSchoolSituation
                        ? `${enrollment.student.currentSchoolSituation.school.name} — ${enrollment.student.currentSchoolSituation.schoolLevel.name}${enrollment.student.currentSchoolSituation.class ? ` (${enrollment.student.currentSchoolSituation.class})` : ''}`
                        : '—'}
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[enrollment.status]}`}>
                        {STATUS_LABELS[enrollment.status]}
                      </span>
                    </td>
                    <td>{enrollment.customPrice ?? '—'}</td>
                    <td className="admin-actions">
                      {enrollment.status === 'PENDING_VALIDATION' && (
                        <>
                          <input
                            type="number"
                            min={0}
                            step="0.001"
                            placeholder="Tarif (optionnel)"
                            value={priceDraftValue(enrollment.id)}
                            onChange={(e) => setPriceDraft(enrollment.id, e.target.value)}
                          />
                          <button type="button" onClick={() => handleAccept(enrollment.id)}>
                            Accepter
                          </button>
                          <input
                            type="text"
                            placeholder="Motif de refus (optionnel)"
                            value={commentDraftValue(enrollment.id)}
                            onChange={(e) => setCommentDraft(enrollment.id, e.target.value)}
                          />
                          <button type="button" className="danger" onClick={() => handleReject(enrollment.id)}>
                            Refuser
                          </button>
                        </>
                      )}
                      {enrollment.status === 'ACTIVE' && (
                        <>
                          <input
                            type="number"
                            min={0}
                            step="0.001"
                            placeholder="Nouveau tarif"
                            value={priceDraftValue(enrollment.id)}
                            onChange={(e) => setPriceDraft(enrollment.id, e.target.value)}
                          />
                          <button type="button" onClick={() => handleUpdatePrice(enrollment.id)}>
                            Modifier le tarif
                          </button>
                          <button type="button" onClick={() => handleSuspend(enrollment.id)}>
                            Suspendre
                          </button>
                          <button type="button" className="danger" onClick={() => handleArchive(enrollment.id)}>
                            Archiver
                          </button>
                        </>
                      )}
                      {enrollment.status === 'SUSPENDED' && (
                        <>
                          <button type="button" onClick={() => handleReactivate(enrollment.id)}>
                            Réactiver
                          </button>
                          <button type="button" className="danger" onClick={() => handleArchive(enrollment.id)}>
                            Archiver
                          </button>
                        </>
                      )}
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
