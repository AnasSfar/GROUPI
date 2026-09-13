import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/UiState';
import { AddStudentFromLevelPoolModal } from '../components/AddStudentFromLevelPoolModal';
import { GroupInvitationModal } from '../components/GroupInvitationModal';
import { ApiError } from '../api/client';
import * as groupsApi from '../api/groupsApi';
import * as enrollmentsApi from '../api/enrollmentsApi';
import type { Group } from '../api/groupsApi';
import type { TeacherEnrollment } from '../api/enrollmentsApi';

const STATUS_LABELS: Record<'ACTIVE' | 'SUSPENDED', string> = {
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
};

const STATUS_BADGE: Record<'ACTIVE' | 'SUSPENDED', string> = {
  ACTIVE: 'badge-success',
  SUSPENDED: 'badge-danger',
};

/** Roster en lecture seule : uniquement les élèves actuellement inscrits à CE groupe (Actif/Suspendu) —
 * pas les demandes en attente ni les changements de groupe, contrairement à la page Inscriptions. */
export function TeacherGroupStudentsPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { getAccessToken } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [enrollments, setEnrollments] = useState<TeacherEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token || !groupId) return;
    setLoading(true);
    setError(null);
    try {
      const [groups, groupEnrollments] = await Promise.all([
        groupsApi.listMine(token),
        enrollmentsApi.listByGroup(token, groupId),
      ]);
      setGroup(groups.find((g) => g.id === groupId) ?? null);
      setEnrollments(groupEnrollments);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les élèves du groupe.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, groupId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <p>Chargement...</p>;
  }

  if (!group) {
    return <p className="form-error">{error ?? 'Groupe introuvable.'}</p>;
  }

  const students = enrollments.filter(
    (e): e is TeacherEnrollment & { status: 'ACTIVE' | 'SUSPENDED' } =>
      e.status === 'ACTIVE' || e.status === 'SUSPENDED',
  );
  const enrolledStudentIds = new Set(students.map((e) => e.student.id));

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Élèves — {group.name}</h1>
          <p>Liste des élèves actuellement inscrits à ce groupe uniquement.</p>
        </div>
        <div className="page-actions">
          <button type="button" onClick={() => navigate('/teacher/groups')}>
            ← Retour à mes groupes
          </button>
          <button type="button" onClick={() => navigate(`/teacher/enrollments?groupId=${group.id}`)}>
            Gérer les inscriptions
          </button>
          <button type="button" onClick={() => setShowInvite(true)}>
            Inviter un nouvel élève
          </button>
          <button type="button" onClick={() => setShowAddStudent(true)}>
            Ajouter un élève
          </button>
        </div>
      </div>

      {showInvite && (
        <GroupInvitationModal groupId={group.id} groupName={group.name} onClose={() => setShowInvite(false)} />
      )}

      {showAddStudent && (
        <AddStudentFromLevelPoolModal
          groupId={group.id}
          schoolLevelId={group.schoolLevel.id}
          academicYearId={group.academicYear.id}
          excludeStudentIds={enrolledStudentIds}
          onClose={() => setShowAddStudent(false)}
          onAssigned={() => {
            setShowAddStudent(false);
            load();
          }}
        />
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <section className="card-section">
        <h2>Élèves ({students.length})</h2>
        {students.length === 0 ? (
          <EmptyState title="Aucun élève inscrit">
            Aucun élève actif ou suspendu dans ce groupe pour le moment.
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Élève</th>
                  <th>Parent</th>
                  <th>Établissement / Niveau / Classe</th>
                  <th>Statut</th>
                  <th>Tarif personnalisé</th>
                </tr>
              </thead>
              <tbody>
                {students.map((enrollment) => (
                  <tr key={enrollment.id}>
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
                      <span className={`badge ${STATUS_BADGE[enrollment.status]}`}>
                        {STATUS_LABELS[enrollment.status]}
                      </span>
                    </td>
                    <td data-label="Tarif personnalisé">{enrollment.customPrice ?? '-'}</td>
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
