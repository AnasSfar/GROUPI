import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as enrollmentsApi from '../api/enrollmentsApi';
import { ScheduleList } from '../components/ScheduleList';
import type { ParentEnrollment, EnrollmentStatus } from '../api/enrollmentsApi';
import { EnrollmentCommentThread } from '../components/EnrollmentCommentThread';
import { GroupAnnouncementsFeed } from '../components/GroupAnnouncementsFeed';
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

export function ParentEnrollmentsPage() {
  const { getAccessToken } = useAuth();
  const [enrollments, setEnrollments] = useState<ParentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<string | null>(null);
  const [expandedAccounting, setExpandedAccounting] = useState<string | null>(null);
  const commentsRowRef = useRef<HTMLTableRowElement | null>(null);

  // RM-COM-020 : quand le fil de commentaires d'une inscription s'ouvre (notamment via le lien
  // "Voir la conversation" d'une annonce), on l'amène dans le champ de vision du Parent.
  useEffect(() => {
    if (!expandedComments) return;
    commentsRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [expandedComments]);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const result = await enrollmentsApi.listMine(token);
      setEnrollments(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger vos inscriptions.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <p>Chargement...</p>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Mes inscriptions</h1>
          <p>Suivez les inscriptions de vos enfants. Avenant 02 : le Professeur décide seul de tout changement de groupe.</p>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <section className="card-section">
        <h2>Inscriptions ({enrollments.length})</h2>
        {enrollments.length === 0 && <p>Aucune inscription pour le moment.</p>}
        {enrollments.length > 0 && (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Enfant</th>
                  <th>Groupe</th>
                  <th>Professeur</th>
                  <th>Jour / Horaire</th>
                  <th>Depuis le</th>
                  <th>Statut</th>
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
                    <td data-label="Depuis le">{new Date(enrollment.requestedAt).toLocaleDateString('fr-FR')}</td>
                    <td data-label="Statut">
                      <span className={`badge ${STATUS_BADGE[enrollment.status]}`}>
                        {STATUS_LABELS[enrollment.status]}
                      </span>
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
                    <tr ref={commentsRowRef}>
                      <td colSpan={9}>
                        <EnrollmentCommentThread enrollmentId={enrollment.id} />
                      </td>
                    </tr>
                  )}
                  {expandedAnnouncements === enrollment.group.id && (
                    <tr>
                      <td colSpan={9}>
                        {/* RM-COM-020 : lien vers le fil de commentaires de CETTE inscription — pas
                            du groupe, qui peut être partagé par plusieurs enfants/inscriptions. */}
                        <GroupAnnouncementsFeed
                          groupId={enrollment.group.id}
                          onViewConversation={() => setExpandedComments(enrollment.id)}
                        />
                      </td>
                    </tr>
                  )}
                  {expandedAccounting === enrollment.id && (
                    <tr>
                      <td colSpan={9}>
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
    </>
  );
}
