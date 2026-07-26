import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as referentialsApi from '../api/referentialsApi';
import * as groupsApi from '../api/groupsApi';
import * as preEnrollmentsApi from '../api/preEnrollmentsApi';
import type { AcademicYear } from '../api/referentialsApi';
import type { Group } from '../api/groupsApi';
import type { PreEnrollment, PreEnrollmentStatus } from '../api/preEnrollmentsApi';

const STATUS_LABELS: Record<PreEnrollmentStatus, string> = {
  PENDING: 'Ouverte',
  PROPOSAL_SENT: 'Proposition envoyée',
  CONFIRMED: 'Confirmée',
  TRANSFORMED: 'Transformée en inscription',
  EXPIRED: 'Expirée',
  REJECTED: 'Refusée',
  CANCELLED: 'Annulée',
  CLOSED: 'Clôturée',
};

const STATUS_BADGE: Record<PreEnrollmentStatus, string> = {
  PENDING: 'badge-info',
  PROPOSAL_SENT: 'badge-warning',
  CONFIRMED: 'badge-success',
  TRANSFORMED: 'badge-success',
  EXPIRED: 'badge-neutral',
  REJECTED: 'badge-danger',
  CANCELLED: 'badge-neutral',
  CLOSED: 'badge-neutral',
};

/** Petit formulaire inline : choix d'un groupe compatible + date limite de réponse (Ch.11.7/11.8). */
function ProposeForm({
  compatibleGroups,
  onSubmit,
  onCancel,
}: {
  compatibleGroups: Group[];
  onSubmit: (groupId: string, expiresAt: string) => void;
  onCancel: () => void;
}) {
  const [groupId, setGroupId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  if (compatibleGroups.length === 0) {
    return (
      <div className="reason-prompt">
        <span>Aucun de vos groupes ne correspond (même année/niveau/matière).</span>
        <button type="button" className="ghost" onClick={onCancel}>
          Fermer
        </button>
      </div>
    );
  }

  return (
    <div className="reason-prompt">
      <select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
        <option value="">Groupe...</option>
        {compatibleGroups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name} ({g._count.enrollments}/{g.capacity})
          </option>
        ))}
      </select>
      <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
      <button
        type="button"
        disabled={!groupId || !expiresAt}
        onClick={() => onSubmit(groupId, expiresAt)}
      >
        Envoyer
      </button>
      <button type="button" className="ghost" onClick={onCancel}>
        Annuler
      </button>
    </div>
  );
}

/** Ch.11.5/11.6/11.7 : espace Professeur — consulter les préinscriptions reçues et leur proposer
 *  un groupe compatible une fois la prochaine année académique préparée. */
export function TeacherPreEnrollmentsPage() {
  const { getAccessToken } = useAuth();
  const [preEnrollments, setPreEnrollments] = useState<PreEnrollment[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [academicYearFilter, setAcademicYearFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proposingFor, setProposingFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [mine, myGroups, allYears] = await Promise.all([
        preEnrollmentsApi.listMine(token, academicYearFilter || undefined),
        groupsApi.listMine(token),
        referentialsApi.listAcademicYears(token),
      ]);
      setPreEnrollments(mine);
      setGroups(myGroups);
      setAcademicYears(allYears);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les préinscriptions.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, academicYearFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePropose(preEnrollmentId: string, groupId: string, expiresAt: string) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      const updated = await preEnrollmentsApi.proposePreEnrollment(token, preEnrollmentId, {
        groupId,
        expiresAt: new Date(expiresAt).toISOString(),
      });
      setPreEnrollments((prev) => prev.map((pe) => (pe.id === updated.id ? updated : pe)));
      setProposingFor(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "L'envoi de la proposition a échoué.");
    }
  }

  function compatibleGroupsFor(pe: PreEnrollment): Group[] {
    return groups.filter(
      (g) =>
        g.academicYear.id === pe.academicYearId &&
        g.schoolLevel.id === pe.schoolLevelId &&
        (!pe.subjectId || g.subject.id === pe.subjectId),
    );
  }

  if (loading) {
    return <p>Chargement...</p>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Préinscriptions reçues</h1>
          <p>
            Anticipez la prochaine rentrée : consultez les intérêts manifestés par les Parents et
            proposez-leur l'un de vos groupes une fois créé.
          </p>
        </div>
      </div>

      <label className="status-filter">
        Année académique :
        <select value={academicYearFilter} onChange={(e) => setAcademicYearFilter(e.target.value)}>
          <option value="">Toutes</option>
          {academicYears.map((y) => (
            <option key={y.id} value={y.id}>
              {y.label}
            </option>
          ))}
        </select>
      </label>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <section className="card-section">
        <h2>Préinscriptions ({preEnrollments.length})</h2>
        {preEnrollments.length === 0 && <p>Aucune préinscription reçue pour le moment.</p>}
        {preEnrollments.length > 0 && (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Élève</th>
                  <th>Parent</th>
                  <th>Matière / Niveau</th>
                  <th>Année</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {preEnrollments.map((pe) => (
                  <tr key={pe.id}>
                    <td>
                      {pe.student.firstName} {pe.student.lastName}
                    </td>
                    <td>
                      {pe.parent.firstName} {pe.parent.lastName} — {pe.parent.phone}
                    </td>
                    <td>
                      {pe.subject ? `${pe.subject.name} — ` : ''}
                      {pe.schoolLevel.name}
                    </td>
                    <td>{pe.academicYear.label}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[pe.status]}`}>{STATUS_LABELS[pe.status]}</span>
                    </td>
                    <td className="admin-actions">
                      {proposingFor === pe.id ? (
                        <ProposeForm
                          compatibleGroups={compatibleGroupsFor(pe)}
                          onSubmit={(groupId, expiresAt) => handlePropose(pe.id, groupId, expiresAt)}
                          onCancel={() => setProposingFor(null)}
                        />
                      ) : (
                        pe.status === 'PENDING' && (
                          <button type="button" onClick={() => setProposingFor(pe.id)}>
                            Proposer
                          </button>
                        )
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
