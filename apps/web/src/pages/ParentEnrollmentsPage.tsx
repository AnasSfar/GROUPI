import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as enrollmentsApi from '../api/enrollmentsApi';
import type { ParentEnrollment, EnrollmentStatus } from '../api/enrollmentsApi';

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
  const [enrollments, setEnrollments] = useState<ParentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const result = await enrollmentsApi.listMine(token);
      setEnrollments(result);
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
                  <th>Matière / Niveau</th>
                  <th>Professeur</th>
                  <th>Demandée le</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id}>
                    <td>
                      {enrollment.student.firstName} {enrollment.student.lastName}
                    </td>
                    <td>{enrollment.group.name}</td>
                    <td>
                      {enrollment.group.subject.name} — {enrollment.group.schoolLevel.name}
                    </td>
                    <td>
                      {enrollment.group.teacher.firstName} {enrollment.group.teacher.lastName}
                    </td>
                    <td>{new Date(enrollment.requestedAt).toLocaleDateString('fr-FR')}</td>
                    <td>
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
