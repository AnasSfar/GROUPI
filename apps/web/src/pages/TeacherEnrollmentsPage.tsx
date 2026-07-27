import { Fragment, useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as groupsApi from '../api/groupsApi';
import * as enrollmentsApi from '../api/enrollmentsApi';
import * as groupChangeApi from '../api/groupChangeApi';
import type { Group } from '../api/groupsApi';
import type { TeacherEnrollment, EnrollmentStatus } from '../api/enrollmentsApi';
import type { GroupChangeRequestView, GroupChangeStatus } from '../api/groupChangeApi';
import { EnrollmentCommentThread } from '../components/EnrollmentCommentThread';
import { EnrollmentAccountingPanel } from '../components/EnrollmentAccountingPanel';

const CHANGE_STATUS_LABELS: Record<GroupChangeStatus, string> = {
  PENDING: 'En attente',
  ACCEPTED: 'Acceptée',
  REJECTED: 'Refusée',
  CANCELLED: 'Annulée',
};

const CHANGE_STATUS_BADGE: Record<GroupChangeStatus, string> = {
  PENDING: 'badge-warning',
  ACCEPTED: 'badge-success',
  REJECTED: 'badge-danger',
  CANCELLED: 'badge-neutral',
};

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
  const [groupChanges, setGroupChanges] = useState<GroupChangeRequestView[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [effectiveDateDrafts, setEffectiveDateDrafts] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [expandedAccounting, setExpandedAccounting] = useState<string | null>(null);

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
      setGroupChanges([]);
      return;
    }
    setLoadingEnrollments(true);
    setError(null);
    try {
      const [result, changes] = await Promise.all([
        enrollmentsApi.listByGroup(token, selectedGroupId),
        groupChangeApi.listByTargetGroup(token, selectedGroupId),
      ]);
      setEnrollments(result);
      setGroupChanges(changes);
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

  function effectiveDateDraftValue(requestId: string) {
    return effectiveDateDrafts[requestId] ?? '';
  }

  function setEffectiveDateDraft(requestId: string, value: string) {
    setEffectiveDateDrafts((prev) => ({ ...prev, [requestId]: value }));
  }

  async function runGroupChangeAction(action: () => Promise<GroupChangeRequestView>) {
    setError(null);
    try {
      const updated = await action();
      setGroupChanges((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "L'opération a échoué.");
    }
  }

  function handleAcceptGroupChange(requestId: string) {
    const token = getAccessToken();
    const effectiveDate = effectiveDateDraftValue(requestId);
    if (!token || !effectiveDate) return;
    runGroupChangeAction(() => groupChangeApi.acceptGroupChangeRequest(token, requestId, effectiveDate));
  }

  function handleRejectGroupChange(requestId: string) {
    const token = getAccessToken();
    if (!token) return;
    const reason = commentDraftValue(requestId);
    runGroupChangeAction(() =>
      groupChangeApi.rejectGroupChangeRequest(token, requestId, reason.trim() === '' ? undefined : reason),
    );
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
                  <th>Commentaires</th>
                  <th>Comptabilité</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => (
                  <Fragment key={enrollment.id}>
                  <tr>
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
                    <td>
                      <button
                        type="button"
                        className="ghost-link"
                        onClick={() =>
                          setExpandedComments((current) => (current === enrollment.id ? null : enrollment.id))
                        }
                      >
                        {expandedComments === enrollment.id ? 'Masquer' : 'Voir'}
                      </button>
                    </td>
                    <td>
                      {/* Ch.15.3 : le compte de suivi comptable n'existe qu'à partir de l'activation. */}
                      {['ACTIVE', 'SUSPENDED', 'ARCHIVED'].includes(enrollment.status) ? (
                        <button
                          type="button"
                          className="ghost-link"
                          onClick={() =>
                            setExpandedAccounting((current) => (current === enrollment.id ? null : enrollment.id))
                          }
                        >
                          {expandedAccounting === enrollment.id ? 'Masquer' : 'Voir'}
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                  {expandedComments === enrollment.id && (
                    <tr>
                      <td colSpan={7}>
                        <EnrollmentCommentThread enrollmentId={enrollment.id} />
                      </td>
                    </tr>
                  )}
                  {expandedAccounting === enrollment.id && (
                    <tr>
                      <td colSpan={7}>
                        <EnrollmentAccountingPanel enrollmentId={enrollment.id} canWrite />
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card-section">
        <h2>Demandes de changement de groupe reçues ({groupChanges.length})</h2>
        <p className="table-hint">
          Un Parent souhaite transférer un élève depuis un autre groupe vers celui sélectionné ci-dessus.
        </p>
        {!loadingEnrollments && groupChanges.length === 0 && <p>Aucune demande de changement reçue.</p>}
        {!loadingEnrollments && groupChanges.length > 0 && (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Élève</th>
                  <th>Groupe d'origine</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupChanges.map((change) => (
                  <tr key={change.id}>
                    <td>
                      {change.originalEnrollment.student.firstName} {change.originalEnrollment.student.lastName}
                    </td>
                    <td>{change.originalEnrollment.group.name}</td>
                    <td>
                      <span className={`badge ${CHANGE_STATUS_BADGE[change.status]}`}>
                        {CHANGE_STATUS_LABELS[change.status]}
                      </span>
                      {change.status === 'ACCEPTED' && change.effectiveDate && (
                        <span className="table-hint">
                          {' '}
                          — effectif le {new Date(change.effectiveDate).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </td>
                    <td className="admin-actions">
                      {change.status === 'PENDING' && (
                        <>
                          <input
                            type="date"
                            value={effectiveDateDraftValue(change.id)}
                            onChange={(e) => setEffectiveDateDraft(change.id, e.target.value)}
                          />
                          <button
                            type="button"
                            disabled={!effectiveDateDraftValue(change.id)}
                            onClick={() => handleAcceptGroupChange(change.id)}
                          >
                            Accepter
                          </button>
                          <input
                            type="text"
                            placeholder="Motif de refus (optionnel)"
                            value={commentDraftValue(change.id)}
                            onChange={(e) => setCommentDraft(change.id, e.target.value)}
                          />
                          <button type="button" className="danger" onClick={() => handleRejectGroupChange(change.id)}>
                            Refuser
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
