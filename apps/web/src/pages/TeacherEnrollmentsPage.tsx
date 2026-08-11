import { Fragment, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Select } from '../components/Select';
import { useToast } from '../components/Toast';
import { EmptyState } from '../components/UiState';
import { ApiError } from '../api/client';
import * as groupsApi from '../api/groupsApi';
import * as enrollmentsApi from '../api/enrollmentsApi';
import * as groupChangeApi from '../api/groupChangeApi';
import { formatSchedules } from '../api/groupsApi';
import type { Group } from '../api/groupsApi';
import type { TeacherEnrollment, EnrollmentStatus, ParentPaymentBehavior } from '../api/enrollmentsApi';
import type { GroupChangeRequestView, GroupChangeStatus } from '../api/groupChangeApi';
import { EnrollmentCommentThread } from '../components/EnrollmentCommentThread';
import { EnrollmentAccountingPanel } from '../components/EnrollmentAccountingPanel';

const CHANGE_STATUS_LABELS: Record<GroupChangeStatus, string> = {
  PENDING: 'En attente',
  ACCEPTED: 'Acceptée',
  REJECTED: 'Refusée',
  CANCELLED: 'Annulée',
};

/** RM-CHG-002 (Ch.20.3) : brouillon du formulaire "Proposer un changement de groupe" par inscription. */
interface TeacherInitiateDraft {
  targetGroupId: string;
  effectiveDate: string;
  note: string;
}

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

/** RM-INS-014/015 : indicateur synthétique consulté par le Professeur avant de décider. */
const PAYMENT_BEHAVIOR_LABELS: Record<ParentPaymentBehavior, string> = {
  EXCELLENT: 'Excellent',
  MOYEN: 'Moyen',
  MAUVAIS: 'Mauvais',
  NON_DISPONIBLE: 'Non disponible',
};

const PAYMENT_BEHAVIOR_BADGE: Record<ParentPaymentBehavior, string> = {
  EXCELLENT: 'badge-success',
  MOYEN: 'badge-warning',
  MAUVAIS: 'badge-danger',
  NON_DISPONIBLE: 'badge-neutral',
};

export function TeacherEnrollmentsPage() {
  const { getAccessToken } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  // RM-CHG-002 : proposition de changement de groupe initiée par le Professeur (Ch.20.3).
  const [proposingChangeId, setProposingChangeId] = useState<string | null>(null);
  const [teacherInitiateDrafts, setTeacherInitiateDrafts] = useState<Record<string, TeacherInitiateDraft>>({});
  const requestedGroupId = searchParams.get('groupId');
  const requestedPaymentSessionId = searchParams.get('paymentSessionId');

  const loadGroups = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const myGroups = await groupsApi.listMine(token);
      setGroups(myGroups);
      setSelectedGroupId((current) => {
        const requested = myGroups.find((group) => group.id === requestedGroupId)?.id;
        return requested || current || myGroups[0]?.id || '';
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger vos groupes.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, requestedGroupId]);

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

  async function runAction(action: () => Promise<TeacherEnrollment>, successMessage?: string) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      const updated = await action();
      setEnrollments((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      if (successMessage) showToast(successMessage);
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
    runAction(
      () => enrollmentsApi.acceptEnrollment(token, selectedGroupId, enrollmentId, { customPrice }),
      'Inscription acceptée',
    );
  }

  function handleReject(enrollmentId: string) {
    const token = getAccessToken();
    if (!token) return;
    const comment = commentDraftValue(enrollmentId);
    runAction(
      () =>
        enrollmentsApi.rejectEnrollment(token, selectedGroupId, enrollmentId, {
          comment: comment.trim() === '' ? undefined : comment,
        }),
      'Inscription refusée',
    );
  }

  function handleUpdatePrice(enrollmentId: string) {
    const token = getAccessToken();
    if (!token) return;
    const draft = priceDraftValue(enrollmentId);
    if (draft.trim() === '') return;
    runAction(
      () => enrollmentsApi.updateEnrollmentPrice(token, selectedGroupId, enrollmentId, Number(draft)),
      'Tarif modifié',
    );
    setEditingPriceId(null);
  }

  function handleStartPriceEdit(enrollment: TeacherEnrollment) {
    setPriceDraft(enrollment.id, enrollment.customPrice ?? '');
    setEditingPriceId(enrollment.id);
  }

  function handleCancelPriceEdit(enrollmentId: string) {
    setEditingPriceId(null);
    setPriceDraft(enrollmentId, '');
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

  async function runGroupChangeAction(action: () => Promise<GroupChangeRequestView>, successMessage?: string) {
    setError(null);
    try {
      const updated = await action();
      setGroupChanges((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      if (successMessage) showToast(successMessage);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "L'opération a échoué.");
    }
  }

  function handleAcceptGroupChange(requestId: string) {
    const token = getAccessToken();
    const effectiveDate = effectiveDateDraftValue(requestId);
    if (!token || !effectiveDate) return;
    runGroupChangeAction(
      () => groupChangeApi.acceptGroupChangeRequest(token, requestId, effectiveDate),
      'Changement de groupe accepté',
    );
  }

  function handleRejectGroupChange(requestId: string) {
    const token = getAccessToken();
    if (!token) return;
    const reason = commentDraftValue(requestId);
    runGroupChangeAction(
      () => groupChangeApi.rejectGroupChangeRequest(token, requestId, reason.trim() === '' ? undefined : reason),
      'Changement de groupe refusé',
    );
  }

  // --- RM-CHG-002 : proposition de changement de groupe initiée par le Professeur -------------

  function teacherInitiateDraft(enrollmentId: string): TeacherInitiateDraft {
    return teacherInitiateDrafts[enrollmentId] ?? { targetGroupId: '', effectiveDate: '', note: '' };
  }

  function setTeacherInitiateDraft(enrollmentId: string, patch: Partial<TeacherInitiateDraft>) {
    setTeacherInitiateDrafts((prev) => ({ ...prev, [enrollmentId]: { ...teacherInitiateDraft(enrollmentId), ...patch } }));
  }

  async function handleTeacherInitiate(enrollment: TeacherEnrollment) {
    const token = getAccessToken();
    if (!token) return;
    const draft = teacherInitiateDraft(enrollment.id);
    if (!draft.targetGroupId || !draft.effectiveDate) return;
    setError(null);
    try {
      await groupChangeApi.teacherInitiateGroupChange(token, {
        enrollmentId: enrollment.id,
        targetGroupId: draft.targetGroupId,
        effectiveDate: draft.effectiveDate,
        note: draft.note.trim() === '' ? undefined : draft.note,
      });
      setProposingChangeId(null);
      setTeacherInitiateDrafts((prev) => {
        const next = { ...prev };
        delete next[enrollment.id];
        return next;
      });
      showToast('Proposition envoyée au Parent — en attente de sa confirmation');
      // RM-CHG-002 : la proposition n'apparaît dans "Demandes reçues" que si le groupe cible est
      // celui actuellement sélectionné (la liste est scopée par groupe cible, comme pour le Parent).
      loadEnrollments();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "La proposition n'a pas pu être envoyée.");
    }
  }

  function renderEnrollmentRows(rows: TeacherEnrollment[]) {
    return rows.map((enrollment) => (
      <Fragment key={enrollment.id}>
        <tr>
          <td data-label="Élève">
            {enrollment.student.firstName} {enrollment.student.lastName}
          </td>
          <td data-label="Parent">
            {enrollment.student.parent.firstName} {enrollment.student.parent.lastName}
          </td>
          <td data-label="Établissement / Niveau / Classe">
            {enrollment.student.currentSchoolSituation
              ? `${enrollment.student.currentSchoolSituation.school.name} - ${enrollment.student.currentSchoolSituation.schoolLevel.name}${enrollment.student.currentSchoolSituation.class ? ` (${enrollment.student.currentSchoolSituation.class})` : ''}`
              : '-'}
          </td>
          <td data-label="Statut">
            <span className={`badge ${STATUS_BADGE[enrollment.status]}`}>{STATUS_LABELS[enrollment.status]}</span>
          </td>
          <td data-label="Comportement de paiement">
            <span className={`badge ${PAYMENT_BEHAVIOR_BADGE[enrollment.parentPaymentBehavior]}`}>
              {PAYMENT_BEHAVIOR_LABELS[enrollment.parentPaymentBehavior]}
            </span>
          </td>
          <td data-label="Tarif personnalisé">{enrollment.customPrice ?? '-'}</td>
          <td className="admin-actions">
            {enrollment.status === 'PENDING_VALIDATION' && (
              <>
                <input
                  type="number"
                  min={0}
                  step="0.001"
                  placeholder="Tarif optionnel"
                  value={priceDraftValue(enrollment.id)}
                  onChange={(e) => setPriceDraft(enrollment.id, e.target.value)}
                />
                <button type="button" onClick={() => handleAccept(enrollment.id)}>
                  Accepter
                </button>
                <input
                  type="text"
                  placeholder="Motif de refus optionnel"
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
                {editingPriceId === enrollment.id ? (
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
                      Enregistrer
                    </button>
                    <button type="button" className="ghost-link" onClick={() => handleCancelPriceEdit(enrollment.id)}>
                      Annuler
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => handleStartPriceEdit(enrollment)}>
                    Modifier le tarif
                  </button>
                )}
                <button type="button" onClick={() => handleSuspend(enrollment.id)}>
                  Suspendre
                </button>
                <button type="button" className="danger" onClick={() => handleArchive(enrollment.id)}>
                  Archiver
                </button>
                {/* RM-CHG-002 (Ch.20.3) : le Professeur peut lui-même proposer un changement de
                    groupe — le Parent doit ensuite confirmer ou décliner la proposition. */}
                <button
                  type="button"
                  className="ghost-link"
                  onClick={() => setProposingChangeId((current) => (current === enrollment.id ? null : enrollment.id))}
                >
                  {proposingChangeId === enrollment.id ? 'Annuler la proposition' : 'Proposer un changement'}
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
          <td data-label="Commentaires">
            <button
              type="button"
              className="ghost-link"
              onClick={() => setExpandedComments((current) => (current === enrollment.id ? null : enrollment.id))}
            >
              {expandedComments === enrollment.id ? 'Masquer' : 'Voir'}
            </button>
          </td>
          <td data-label="Comptabilité">
            {['ACTIVE', 'SUSPENDED', 'ARCHIVED'].includes(enrollment.status) ? (
              <button
                type="button"
                className="ghost-link"
                onClick={() => setExpandedAccounting((current) => (current === enrollment.id ? null : enrollment.id))}
              >
                {expandedAccounting === enrollment.id ? 'Masquer' : 'Voir'}
              </button>
            ) : (
              '-'
            )}
          </td>
        </tr>
        {expandedComments === enrollment.id && (
          <tr>
            <td colSpan={9}>
              <EnrollmentCommentThread enrollmentId={enrollment.id} />
            </td>
          </tr>
        )}
        {expandedAccounting === enrollment.id && (
          <tr>
            <td colSpan={9}>
              <EnrollmentAccountingPanel enrollmentId={enrollment.id} canWrite initialPaymentSessionId={requestedPaymentSessionId} />
            </td>
          </tr>
        )}
        {proposingChangeId === enrollment.id && (
          <tr>
            <td colSpan={9}>
              <div className="admin-actions">
                <label>
                  Groupe cible
                  <Select
                    value={teacherInitiateDraft(enrollment.id).targetGroupId}
                    onChange={(e) => setTeacherInitiateDraft(enrollment.id, { targetGroupId: e.target.value })}
                  >
                    <option value="">Sélectionner un groupe</option>
                    {groups
                      .filter((g) => g.id !== enrollment.group.id)
                      .map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} - {g.subject.name} ({g.schoolLevel.name})
                        </option>
                      ))}
                  </Select>
                </label>
                <label>
                  Date d'effet
                  <input
                    type="date"
                    value={teacherInitiateDraft(enrollment.id).effectiveDate}
                    onChange={(e) => setTeacherInitiateDraft(enrollment.id, { effectiveDate: e.target.value })}
                  />
                </label>
                <label>
                  Motif (optionnel, communiqué au Parent)
                  <input
                    type="text"
                    value={teacherInitiateDraft(enrollment.id).note}
                    onChange={(e) => setTeacherInitiateDraft(enrollment.id, { note: e.target.value })}
                  />
                </label>
                <button
                  type="button"
                  disabled={!teacherInitiateDraft(enrollment.id).targetGroupId || !teacherInitiateDraft(enrollment.id).effectiveDate}
                  onClick={() => handleTeacherInitiate(enrollment)}
                >
                  Envoyer la proposition au Parent
                </button>
                <p className="form-hint">
                  RM-CHG-002/003 : le Parent devra confirmer ou décliner cette proposition avant qu'elle ne prenne effet.
                </p>
              </div>
            </td>
          </tr>
        )}
      </Fragment>
    ));
  }

  function renderEnrollmentSection(title: string, emptyTitle: string, emptyBody: string, rows: TeacherEnrollment[]) {
    return (
      <section className="card-section">
        <h2>
          {title} ({rows.length})
        </h2>
        {loadingEnrollments && <p>Chargement...</p>}
        {!loadingEnrollments && rows.length === 0 && <EmptyState title={emptyTitle}>{emptyBody}</EmptyState>}
        {!loadingEnrollments && rows.length > 0 && (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Élève</th>
                  <th>Parent</th>
                  <th>Établissement / Niveau / Classe</th>
                  <th>Statut</th>
                  <th>Comportement de paiement</th>
                  <th>Tarif personnalisé</th>
                  <th>Actions</th>
                  <th>Commentaires</th>
                  <th>Comptabilité</th>
                </tr>
              </thead>
              <tbody>{renderEnrollmentRows(rows)}</tbody>
            </table>
          </div>
        )}
      </section>
    );
  }

  if (loading) {
    return <p>Chargement...</p>;
  }

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;
  const pendingEnrollments = enrollments.filter((enrollment) => enrollment.status === 'PENDING_VALIDATION');
  const confirmedEnrollments = enrollments.filter((enrollment) => enrollment.status !== 'PENDING_VALIDATION');

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Inscriptions</h1>
          <p>Traitez les demandes séparément, puis gérez les inscriptions déjà décidées.</p>
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
          <Select
            value={selectedGroupId}
            onChange={(e) => {
              setSelectedGroupId(e.target.value);
              setSearchParams(e.target.value ? { groupId: e.target.value } : {});
            }}
          >
            {groups.length === 0 && <option value="">Aucun groupe</option>}
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} - {g.subject.name} ({g.schoolLevel.name})
              </option>
            ))}
          </Select>
        </label>
        {selectedGroup && <p className="form-hint">Jour / Horaire : {formatSchedules(selectedGroup.schedules)}</p>}
      </section>

      {renderEnrollmentSection(
        "Demandes d'inscription",
        'Aucune demande',
        "Aucune demande d'inscription en attente pour ce groupe.",
        pendingEnrollments,
      )}

      {renderEnrollmentSection(
        'Inscriptions',
        'Aucune inscription',
        'Aucune inscription active, suspendue ou archivée pour ce groupe.',
        confirmedEnrollments,
      )}

      <section className="card-section">
        <h2>Demandes de changement de groupe reçues ({groupChanges.length})</h2>
        <p className="table-hint">
          Un Parent souhaite transférer un élève depuis un autre groupe vers celui sélectionné ci-dessus, ou vous avez
          vous-même proposé un changement vers ce groupe (RM-CHG-002).
        </p>
        {!loadingEnrollments && groupChanges.length === 0 && <p>Aucune demande de changement reçue.</p>}
        {!loadingEnrollments && groupChanges.length > 0 && (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Élève</th>
                  <th>Groupe d'origine</th>
                  <th>Initiateur</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupChanges.map((change) => (
                  <tr key={change.id}>
                    <td data-label="Élève">
                      {change.originalEnrollment.student.firstName} {change.originalEnrollment.student.lastName}
                    </td>
                    <td data-label="Groupe d'origine">{change.originalEnrollment.group.name}</td>
                    <td data-label="Initiateur">{change.initiatedBy === 'TEACHER' ? 'Vous (proposition)' : 'Parent'}</td>
                    <td data-label="Statut">
                      <span className={`badge ${CHANGE_STATUS_BADGE[change.status]}`}>
                        {CHANGE_STATUS_LABELS[change.status]}
                      </span>
                      {change.status === 'ACCEPTED' && change.effectiveDate && (
                        <span className="table-hint">
                          {' '}
                          - effectif le {new Date(change.effectiveDate).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </td>
                    <td className="admin-actions">
                      {change.status === 'PENDING' && change.initiatedBy === 'TEACHER' && (
                        <span className="table-hint">En attente de la réponse du Parent</span>
                      )}
                      {change.status === 'PENDING' && change.initiatedBy === 'PARENT' && (
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
                            placeholder="Motif de refus optionnel"
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