import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { EmptyState } from '../components/UiState';
import { Select } from '../components/Select';
import { ApiError } from '../api/client';
import * as levelPoolsApi from '../api/levelPoolsApi';
import * as groupsApi from '../api/groupsApi';
import * as groupMembersApi from '../api/groupMembersApi';
import type { LevelPool, LevelPoolMember } from '../api/levelPoolsApi';
import type { Group } from '../api/groupsApi';

/**
 * Avenant 01, Ch. B/C — « Salles d'attente » : un niveau par carte, sélection d'élèves puis
 * affectation vers un groupe standard du même niveau (Ch. C.3). Terminologie officielle (§0.3) :
 * « salle d'attente » / « rattachement » / « affectation », jamais « groupe » côté élève en attente.
 */
export function TeacherLevelPoolsPage() {
  const { getAccessToken } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [pools, setPools] = useState<LevelPool[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [members, setMembers] = useState<LevelPoolMember[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [targetGroupId, setTargetGroupId] = useState('');
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadPools = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [poolsRes, groupsRes] = await Promise.all([
        levelPoolsApi.listMine(token),
        groupsApi.listMine(token),
      ]);
      setPools(poolsRes);
      setGroups(groupsRes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les salles d’attente.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    loadPools();
  }, [loadPools]);

  const loadMembers = useCallback(
    async (poolId: string) => {
      const token = getAccessToken();
      if (!token) return;
      setMembersLoading(true);
      try {
        setMembers(await levelPoolsApi.listMembers(token, poolId));
        setSelectedStudentIds(new Set());
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : 'Impossible de charger les élèves.', 'error');
      } finally {
        setMembersLoading(false);
      }
    },
    [getAccessToken, showToast],
  );

  function openPool(pool: LevelPool) {
    setSelectedPoolId(pool.id);
    setTargetGroupId('');
    loadMembers(pool.id);
  }

  const selectedPool = pools.find((p) => p.id === selectedPoolId) ?? null;

  const eligibleGroups = useMemo(() => {
    if (!selectedPool) return [];
    return groups.filter(
      (g) => g.schoolLevel.id === selectedPool.schoolLevel.id && (g.status === 'ACTIVE' || g.status === 'FULL'),
    );
  }, [groups, selectedPool]);

  function toggleStudent(studentId: string, checked: boolean) {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(studentId);
      else next.delete(studentId);
      return next;
    });
  }

  async function handleRemove(studentId: string) {
    if (!selectedPool) return;
    const ok = await confirm({
      message: "Retirer cet élève de la salle d'attente ? Une inscription active éventuelle n'est jamais affectée.",
    });
    if (!ok) return;
    const token = getAccessToken();
    if (!token) return;
    try {
      const res = await levelPoolsApi.removeMember(token, selectedPool.id, studentId);
      showToast(res.warning ?? 'Élève retiré de la salle d’attente.', res.warning ? 'info' : 'success');
      await loadMembers(selectedPool.id);
      await loadPools();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Impossible de retirer cet élève.', 'error');
    }
  }

  async function handleAssign() {
    if (!selectedPool || !targetGroupId || selectedStudentIds.size === 0) return;
    const token = getAccessToken();
    if (!token) return;
    setBusy(true);
    try {
      const result = await groupMembersApi.assign(token, targetGroupId, {
        studentIds: [...selectedStudentIds],
      });
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
      await loadMembers(selectedPool.id);
      await loadPools();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible d'affecter les élèves sélectionnés.", 'error');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p>Chargement...</p>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Salles d'attente</h1>
          <p>
            Un élève rejoint automatiquement la salle d'attente de son niveau via votre lien
            d'invitation. Affectez-le ensuite à l'un de vos groupes standard.
          </p>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {pools.length === 0 ? (
        <EmptyState title="Aucune salle d'attente pour le moment">
          Une salle d'attente est créée automatiquement dès qu'un de vos niveaux enseignés est validé
          par un Administrateur.
        </EmptyState>
      ) : (
        <section className="card-section">
          <h2>Mes niveaux</h2>
          <div className="checkbox-grid">
            {pools.map((pool) => (
              <button
                key={pool.id}
                type="button"
                className={`level-pool-card${selectedPoolId === pool.id ? ' active' : ''}`}
                onClick={() => openPool(pool)}
              >
                <strong>{pool.schoolLevel.name}</strong>
                <span>
                  {pool.activeMemberCount} élève{pool.activeMemberCount > 1 ? 's' : ''} en attente
                </span>
                <span className="form-hint">{pool.academicYear.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedPool && (
        <section className="card-section">
          <h2>Salle d'attente — {selectedPool.schoolLevel.name}</h2>

          {membersLoading ? (
            <p>Chargement...</p>
          ) : members.length === 0 ? (
            <EmptyState title="Aucun élève en attente">
              Personne n'est actuellement rattaché à cette salle d'attente.
            </EmptyState>
          ) : (
            <>
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Élève</th>
                      <th>Établissement / Classe</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id}>
                        <td data-label="">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.has(member.student.id)}
                            onChange={(e) => toggleStudent(member.student.id, e.target.checked)}
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
                        <td data-label="">
                          <button type="button" className="ghost" onClick={() => handleRemove(member.student.id)}>
                            Retirer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="field-row" style={{ alignItems: 'flex-end' }}>
                <label>
                  Groupe cible
                  <Select value={targetGroupId} onChange={(e) => setTargetGroupId(e.target.value)}>
                    <option value="">Sélectionner un groupe standard...</option>
                    {eligibleGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.subject.name})
                      </option>
                    ))}
                  </Select>
                </label>
                <button
                  type="button"
                  disabled={busy || !targetGroupId || selectedStudentIds.size === 0}
                  onClick={handleAssign}
                >
                  Affecter {selectedStudentIds.size > 0 ? `(${selectedStudentIds.size})` : ''}
                </button>
              </div>
              {eligibleGroups.length === 0 && (
                <p className="form-notice" role="status">
                  Aucun groupe standard actif pour ce niveau — créez-en un depuis « Mes groupes ».
                </p>
              )}
            </>
          )}
        </section>
      )}
    </>
  );
}
