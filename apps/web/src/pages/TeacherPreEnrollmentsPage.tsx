import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Select } from '../components/Select';
import { useToast } from '../components/Toast';
import { ApiError } from '../api/client';
import * as referentialsApi from '../api/referentialsApi';
import * as groupsApi from '../api/groupsApi';
import * as preEnrollmentsApi from '../api/preEnrollmentsApi';
import type { AcademicYear } from '../api/referentialsApi';
import type { Group } from '../api/groupsApi';
import type { PreEnrollment, PreEnrollmentStatus } from '../api/preEnrollmentsApi';

/** RM-PRE-005/015 : `Group.preEnrollmentsOpen` existe côté API mais n'est pas déclaré sur le type
 *  `Group` partagé (apps/web/src/api/groupsApi.ts, hors périmètre de ce chantier) — la valeur est
 *  bien présente dans la réponse JSON de `/groups/mine` (Prisma renvoie tous les scalaires par
 *  défaut), on l'accède donc ici via ce type étendu local plutôt que de modifier ce fichier partagé. */
type GroupWithPreEnrollmentsOpen = Group & { preEnrollmentsOpen: boolean };

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
      <Select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
        <option value="">Groupe...</option>
        {compatibleGroups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name} ({g._count.enrollments}/{g.capacity})
          </option>
        ))}
      </Select>
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

/** Formulaire inline : une seule date limite de réponse, envoyée à toutes les préinscriptions
 *  compatibles avec le groupe en un clic (RM-PRE-008/009/010). */
function BulkProposeForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (expiresAt: string) => void;
  onCancel: () => void;
}) {
  const [expiresAt, setExpiresAt] = useState('');

  return (
    <div className="reason-prompt">
      <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
      <button type="button" disabled={!expiresAt} onClick={() => onSubmit(expiresAt)}>
        Envoyer à tous les compatibles
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
  const { showToast } = useToast();
  const [preEnrollments, setPreEnrollments] = useState<PreEnrollment[]>([]);
  const [groups, setGroups] = useState<GroupWithPreEnrollmentsOpen[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [academicYearFilter, setAcademicYearFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proposingFor, setProposingFor] = useState<string | null>(null);
  const [bulkProposingFor, setBulkProposingFor] = useState<string | null>(null);

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
      setGroups(myGroups as GroupWithPreEnrollmentsOpen[]);
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

  /** RM-PRE-008/009/010 : envoi groupé en un clic — remplace l'envoi préinscription par préinscription. */
  async function handleProposeAll(groupId: string, expiresAt: string) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      const result = await preEnrollmentsApi.proposeAllCompatiblePreEnrollments(
        token,
        groupId,
        new Date(expiresAt).toISOString(),
      );
      setBulkProposingFor(null);
      showToast(
        `${result.sentCount} proposition(s) envoyée(s)` +
          (result.failedCount > 0 ? `, ${result.failedCount} échec(s).` : '.'),
        result.failedCount > 0 ? 'info' : 'success',
      );
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "L'envoi groupé a échoué.");
    }
  }

  /** RM-PRE-005/015, PERM-PRE-006 : bascule l'ouverture des préinscriptions pour ce groupe. */
  async function handleToggleOpen(groupId: string, currentlyOpen: boolean) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      const updated = await preEnrollmentsApi.setGroupPreEnrollmentsOpen(token, groupId, !currentlyOpen);
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, preEnrollmentsOpen: updated.preEnrollmentsOpen } : g)),
      );
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Impossible de modifier l'ouverture des préinscriptions.",
      );
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
        <Select value={academicYearFilter} onChange={(e) => setAcademicYearFilter(e.target.value)}>
          <option value="">Toutes</option>
          {academicYears.map((y) => (
            <option key={y.id} value={y.id}>
              {y.label}
            </option>
          ))}
        </Select>
      </label>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <section className="card-section">
        <h2>Mes groupes — préinscriptions</h2>
        <p>
          Ouvrez ou fermez librement les préinscriptions par groupe (RM-PRE-005/015), et envoyez en
          un clic une proposition à toutes les préinscriptions compatibles trouvées (RM-PRE-008/009/010).
        </p>
        {groups.length === 0 && <p>Aucun groupe créé pour le moment.</p>}
        {groups.length > 0 && (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Groupe</th>
                  <th>Matière / Niveau</th>
                  <th>Année</th>
                  <th>Préinscriptions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g.id}>
                    <td data-label="Groupe">{g.name}</td>
                    <td data-label="Matière / Niveau">
                      {g.subject.name} — {g.schoolLevel.name}
                    </td>
                    <td data-label="Année">{g.academicYear.label}</td>
                    <td data-label="Préinscriptions">
                      <span className={`badge ${g.preEnrollmentsOpen ? 'badge-success' : 'badge-neutral'}`}>
                        {g.preEnrollmentsOpen ? 'Ouvertes' : 'Fermées'}
                      </span>
                    </td>
                    <td className="admin-actions">
                      <button type="button" className="ghost" onClick={() => handleToggleOpen(g.id, g.preEnrollmentsOpen)}>
                        {g.preEnrollmentsOpen ? 'Fermer' : 'Ouvrir'}
                      </button>
                      {bulkProposingFor === g.id ? (
                        <BulkProposeForm
                          onSubmit={(expiresAt) => handleProposeAll(g.id, expiresAt)}
                          onCancel={() => setBulkProposingFor(null)}
                        />
                      ) : (
                        <button type="button" onClick={() => setBulkProposingFor(g.id)}>
                          Proposer à tous les compatibles
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
                    <td data-label="Élève">
                      {pe.student.firstName} {pe.student.lastName}
                    </td>
                    <td data-label="Parent">
                      {pe.parent.firstName} {pe.parent.lastName} — {pe.parent.phone}
                    </td>
                    <td data-label="Matière / Niveau">
                      {pe.subject ? `${pe.subject.name} — ` : ''}
                      {pe.schoolLevel.name}
                    </td>
                    <td data-label="Année">{pe.academicYear.label}</td>
                    <td data-label="Statut">
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
