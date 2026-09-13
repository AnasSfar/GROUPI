import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { EmptyState } from './UiState';
import { ApiError } from '../api/client';
import * as levelPoolsApi from '../api/levelPoolsApi';
import * as groupMembersApi from '../api/groupMembersApi';
import type { LevelPoolMember } from '../api/levelPoolsApi';

/**
 * Ch. C.3 : affecter un ou plusieurs élèves de la salle d'attente du niveau de CE groupe,
 * directement depuis la fiche du groupe (raccourci vers le même mécanisme que la page
 * "Salles d'attente" — RM-AFF-*).
 */
export function AddStudentFromLevelPoolModal({
  groupId,
  schoolLevelId,
  academicYearId,
  excludeStudentIds,
  onClose,
  onAssigned,
}: {
  groupId: string;
  schoolLevelId: string;
  academicYearId: string;
  excludeStudentIds: Set<string>;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const { getAccessToken } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<LevelPoolMember[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const token = getAccessToken();
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const pools = await levelPoolsApi.listMine(token);
        const pool = pools.find(
          (p) => p.schoolLevel.id === schoolLevelId && p.academicYear.id === academicYearId,
        );
        if (!pool) {
          if (!cancelled) setMembers([]);
          return;
        }
        const poolMembers = await levelPoolsApi.listMembers(token, pool.id);
        if (!cancelled) setMembers(poolMembers);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Impossible de charger la salle d’attente.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [getAccessToken, schoolLevelId, academicYearId]);

  const eligibleMembers = useMemo(
    () => members.filter((m) => !excludeStudentIds.has(m.student.id)),
    [members, excludeStudentIds],
  );

  function toggle(studentId: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(studentId);
      else next.delete(studentId);
      return next;
    });
  }

  async function handleSubmit() {
    const token = getAccessToken();
    if (!token || selected.size === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await groupMembersApi.assign(token, groupId, { studentIds: [...selected] });
      if (result.assigned.length > 0) {
        showToast(`${result.assigned.length} élève(s) affecté(s) au groupe.`);
      }
      if (result.skipped.length > 0) {
        showToast(
          `${result.skipped.length} élève(s) non affecté(s) : ${result.skipped
            .map((s) => s.reason)
            .filter(Boolean)
            .join(' · ')}`,
          'error',
        );
      }
      onAssigned();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "L'affectation a échoué.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="terms-modal-backdrop" onClick={onClose}>
      <div className="terms-modal terms-modal-wide" onClick={(e) => e.stopPropagation()}>
        <h2>Ajouter un élève depuis la salle d'attente</h2>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {loading && <p>Chargement...</p>}
        {!loading && eligibleMembers.length === 0 && (
          <EmptyState title="Aucun élève en attente">
            Personne n'est actuellement rattaché à la salle d'attente de ce niveau, ou tous les élèves en
            attente sont déjà inscrits dans ce groupe.
          </EmptyState>
        )}
        {!loading && eligibleMembers.length > 0 && (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Élève</th>
                  <th>Établissement / Classe</th>
                  <th>Parent</th>
                </tr>
              </thead>
              <tbody>
                {eligibleMembers.map((member) => (
                  <tr key={member.id}>
                    <td data-label="">
                      <input
                        type="checkbox"
                        checked={selected.has(member.student.id)}
                        onChange={(e) => toggle(member.student.id, e.target.checked)}
                      />
                    </td>
                    <td data-label="Élève">
                      {member.student.firstName} {member.student.lastName}
                    </td>
                    <td data-label="Établissement / Classe">
                      {member.student.currentSchoolSituation
                        ? `${member.student.currentSchoolSituation.school.name}${
                            member.student.currentSchoolSituation.class
                              ? ` (${member.student.currentSchoolSituation.class})`
                              : ''
                          }`
                        : '-'}
                    </td>
                    <td data-label="Parent">
                      {member.student.parent.firstName} {member.student.parent.lastName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="terms-modal-actions">
          <button type="button" className="ghost" onClick={onClose}>
            Annuler
          </button>
          <button type="button" disabled={submitting || selected.size === 0} onClick={handleSubmit}>
            {submitting ? 'Affectation...' : `Affecter ${selected.size > 0 ? `(${selected.size})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
