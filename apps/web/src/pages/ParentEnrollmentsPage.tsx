import { Fragment, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ApiError } from '../api/client';
import * as enrollmentsApi from '../api/enrollmentsApi';
import * as groupChangeApi from '../api/groupChangeApi';
import { ScheduleList } from '../components/ScheduleList';
import type { ParentEnrollment, EnrollmentStatus } from '../api/enrollmentsApi';
import type { GroupChangeRequestView, GroupChangeStatus } from '../api/groupChangeApi';
import { EnrollmentCommentThread } from '../components/EnrollmentCommentThread';
import { GroupAnnouncementsFeed } from '../components/GroupAnnouncementsFeed';
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

// NOTE (Ch.12) : le bouton "Demander une inscription" à ajouter sur les résultats de
// ParentGroupSearchPage.tsx (POST /enrollments avec studentId + groupId) doit être câblé
// séparément — voir la mission : ParentGroupSearchPage.tsx n'est volontairement pas modifié ici.

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

export function ParentEnrollmentsPage() {
  const { getAccessToken } = useAuth();
  const { showToast } = useToast();
  const [enrollments, setEnrollments] = useState<ParentEnrollment[]>([]);
  const [groupChanges, setGroupChanges] = useState<GroupChangeRequestView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<string | null>(null);
  const [expandedAccounting, setExpandedAccounting] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [result, changes] = await Promise.all([enrollmentsApi.listMine(token), groupChangeApi.listMine(token)]);
      setEnrollments(result);
      setGroupChanges(changes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger vos demandes.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCancel(enrollmentId: string) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      const updated = await enrollmentsApi.cancelEnrollment(token, enrollmentId);
      setEnrollments((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      showToast('Demande d’inscription annulée');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "L'annulation a échoué.");
    }
  }

  async function handleCancelGroupChange(id: string) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      const updated = await groupChangeApi.cancelGroupChangeRequest(token, id);
      setGroupChanges((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      showToast('Demande de changement de groupe annulée');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "L'annulation a échoué.");
    }
  }

  if (loading) {
    return <p>Chargement...</p>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Mes demandes d'inscription</h1>
          <p>Suivez l'état de vos demandes d'inscription pour chaque enfant.</p>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <section className="card-section">
        <h2>Demandes ({enrollments.length})</h2>
        {enrollments.length === 0 && <p>Aucune demande d'inscription pour le moment.</p>}
        {enrollments.length > 0 && (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Enfant</th>
                  <th>Groupe</th>
                  <th>Professeur</th>
                  <th>Jour / Horaire</th>
                  <th>Demandée le</th>
                  <th>Statut</th>
                  <th>Actions</th>
                  <th>Commentaires</th>
                  <th>Annonces</th>
                  <th>Comptabilité</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => (
                  <Fragment key={enrollment.id}>
                  <tr>
                    <td data-label="Enfant">
                      {enrollment.student.firstName} {enrollment.student.lastName}
                    </td>
                    <td data-label="Groupe">
                      {enrollment.group.name}
                      <div className="cell-secondary">
                        {enrollment.group.subject.name} — {enrollment.group.schoolLevel.name}
                      </div>
                    </td>
                    <td data-label="Professeur">
                      {enrollment.group.teacher.firstName} {enrollment.group.teacher.lastName}
                    </td>
                    <td data-label="Jour / Horaire">
                      <ScheduleList schedules={enrollment.group.schedules} />
                    </td>
                    <td data-label="Demandée le">{new Date(enrollment.requestedAt).toLocaleDateString('fr-FR')}</td>
                    <td data-label="Statut">
                      <span className={`badge ${STATUS_BADGE[enrollment.status]}`}>
                        {STATUS_LABELS[enrollment.status]}
                      </span>
                    </td>
                    <td className="admin-actions">
                      {enrollment.status === 'PENDING_VALIDATION' && (
                        <button type="button" className="danger" onClick={() => handleCancel(enrollment.id)}>
                          Annuler
                        </button>
                      )}
                      {enrollment.status === 'ACTIVE' && (
                        <Link to={`/parent/groups?changeFromEnrollment=${enrollment.id}`}>Changer de groupe</Link>
                      )}
                    </td>
                    <td data-label="Commentaires">
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
                    <td data-label="Annonces">
                      <button
                        type="button"
                        className="ghost-link"
                        onClick={() =>
                          setExpandedAnnouncements((current) =>
                            current === enrollment.group.id ? null : enrollment.group.id,
                          )
                        }
                      >
                        {expandedAnnouncements === enrollment.group.id ? 'Masquer' : 'Voir'}
                      </button>
                    </td>
                    <td data-label="Comptabilité">
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
                      <td colSpan={10}>
                        <EnrollmentCommentThread enrollmentId={enrollment.id} />
                      </td>
                    </tr>
                  )}
                  {expandedAnnouncements === enrollment.group.id && (
                    <tr>
                      <td colSpan={10}>
                        <GroupAnnouncementsFeed groupId={enrollment.group.id} />
                      </td>
                    </tr>
                  )}
                  {expandedAccounting === enrollment.id && (
                    <tr>
                      <td colSpan={10}>
                        <EnrollmentAccountingPanel enrollmentId={enrollment.id} canWrite={false} />
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
        <h2>Mes demandes de changement de groupe ({groupChanges.length})</h2>
        {groupChanges.length === 0 && <p>Aucune demande de changement de groupe pour le moment.</p>}
        {groupChanges.length > 0 && (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Enfant</th>
                  <th>Groupe actuel</th>
                  <th>Groupe cible</th>
                  <th>Date effective</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupChanges.map((change) => (
                  <tr key={change.id}>
                    <td data-label="Enfant">
                      {change.originalEnrollment.student.firstName} {change.originalEnrollment.student.lastName}
                    </td>
                    <td data-label="Groupe actuel">{change.originalEnrollment.group.name}</td>
                    <td data-label="Groupe cible">
                      {change.targetGroup.name} ({change.targetGroup.teacher.firstName}{' '}
                      {change.targetGroup.teacher.lastName})
                    </td>
                    <td data-label="Date effective">{change.effectiveDate ? new Date(change.effectiveDate).toLocaleDateString('fr-FR') : '—'}</td>
                    <td data-label="Statut">
                      <span className={`badge ${CHANGE_STATUS_BADGE[change.status]}`}>
                        {CHANGE_STATUS_LABELS[change.status]}
                      </span>
                      {change.status === 'REJECTED' && change.rejectionReason && (
                        <span className="table-hint"> — {change.rejectionReason}</span>
                      )}
                    </td>
                    <td className="admin-actions">
                      {(change.status === 'PENDING' ||
                        (change.status === 'ACCEPTED' && !change.appliedAt)) && (
                        <button type="button" className="danger" onClick={() => handleCancelGroupChange(change.id)}>
                          Annuler
                        </button>
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
