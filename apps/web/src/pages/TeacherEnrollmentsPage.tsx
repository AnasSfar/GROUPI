import { Fragment, useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Select } from '../components/Select';
import { useToast } from '../components/Toast';
import { EmptyState } from '../components/UiState';
import { ApiError } from '../api/client';
import * as groupsApi from '../api/groupsApi';
import * as enrollmentsApi from '../api/enrollmentsApi';
import { formatSchedules } from '../api/groupsApi';
import type { Group } from '../api/groupsApi';
import type { TeacherEnrollment, EnrollmentStatus, ParentPaymentBehavior } from '../api/enrollmentsApi';
import { EnrollmentCommentThread } from '../components/EnrollmentCommentThread';
import { EnrollmentAccountingPanel } from '../components/EnrollmentAccountingPanel';

const STATUS_LABELS: Record<EnrollmentStatus, string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspendue',
  ARCHIVED: 'Archivée',
};

const STATUS_BADGE: Record<EnrollmentStatus, string> = {
  ACTIVE: 'badge-success',
  SUSPENDED: 'badge-danger',
  ARCHIVED: 'badge-neutral',
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
  const [loading, setLoading] = useState(true);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [expandedAccounting, setExpandedAccounting] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  // Avenant 02 : changement de groupe décidé unilatéralement et immédiatement par le Professeur.
  const [changingGroupId, setChangingGroupId] = useState<string | null>(null);
  const [targetGroupDrafts, setTargetGroupDrafts] = useState<Record<string, string>>({});
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

  function targetGroupDraftValue(enrollmentId: string) {
    return targetGroupDrafts[enrollmentId] ?? '';
  }

  function setTargetGroupDraft(enrollmentId: string, value: string) {
    setTargetGroupDrafts((prev) => ({ ...prev, [enrollmentId]: value }));
  }

  /** Avenant 02 : décision unilatérale et immédiate — aucune confirmation Parent nécessaire. */
  async function handleChangeGroup(enrollmentId: string) {
    const token = getAccessToken();
    const targetGroupId = targetGroupDraftValue(enrollmentId);
    if (!token || !targetGroupId) return;
    setError(null);
    try {
      await enrollmentsApi.changeEnrollmentGroup(token, selectedGroupId, enrollmentId, targetGroupId);
      setChangingGroupId(null);
      setTargetGroupDrafts((prev) => {
        const next = { ...prev };
        delete next[enrollmentId];
        return next;
      });
      showToast('Élève déplacé vers le nouveau groupe');
      loadEnrollments();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Le changement de groupe a échoué.');
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
                {/* Avenant 02 : le Professeur décide seul et immédiatement d'un changement de groupe. */}
                <button
                  type="button"
                  className="ghost-link"
                  onClick={() => setChangingGroupId((current) => (current === enrollment.id ? null : enrollment.id))}
                >
                  {changingGroupId === enrollment.id ? 'Annuler' : 'Changer de groupe'}
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
        {changingGroupId === enrollment.id && (
          <tr>
            <td colSpan={9}>
              <div className="admin-actions">
                <label>
                  Groupe cible
                  <Select
                    value={targetGroupDraftValue(enrollment.id)}
                    onChange={(e) => setTargetGroupDraft(enrollment.id, e.target.value)}
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
                <button
                  type="button"
                  disabled={!targetGroupDraftValue(enrollment.id)}
                  onClick={() => handleChangeGroup(enrollment.id)}
                >
                  Déplacer maintenant
                </button>
                <p className="form-hint">
                  Le déplacement est immédiat : l'inscription actuelle est archivée et une nouvelle inscription
                  active est créée dans le groupe cible.
                </p>
              </div>
            </td>
          </tr>
        )}
      </Fragment>
    ));
  }

  if (loading) {
    return <p>Chargement...</p>;
  }

  if (groups.length === 0) {
    return (
      <>
        <div className="page-header">
          <div>
            <h1>Inscriptions</h1>
            <p>Gérez les inscriptions déjà décidées, groupe par groupe.</p>
          </div>
        </div>
        <EmptyState title="Aucun groupe standard pour le moment">
          Vos élèves sont automatiquement rattachés à votre{' '}
          <Link to="/teacher/level-pools">salle d'attente</Link> dès qu'ils rejoignent votre lien
          d'invitation. Créez d'abord un groupe depuis <Link to="/teacher/groups">Mes groupes</Link>,
          puis affectez-y vos élèves en attente : leurs inscriptions apparaîtront ici.
        </EmptyState>
      </>
    );
  }

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Inscriptions</h1>
          <p>Gérez les inscriptions déjà décidées, groupe par groupe.</p>
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

      <section className="card-section">
        <h2>Inscriptions ({enrollments.length})</h2>
        {loadingEnrollments && <p>Chargement...</p>}
        {!loadingEnrollments && enrollments.length === 0 && (
          <EmptyState title="Aucune inscription">
            Aucune inscription active, suspendue ou archivée pour ce groupe.
          </EmptyState>
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
                  <th>Comportement de paiement</th>
                  <th>Tarif personnalisé</th>
                  <th>Actions</th>
                  <th>Commentaires</th>
                  <th>Comptabilité</th>
                </tr>
              </thead>
              <tbody>{renderEnrollmentRows(enrollments)}</tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
