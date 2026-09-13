import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
 * Avenant 01, Ch. B/C — « Salles d'attente » : une carte par niveau, chacune avec son tableau
 * d'élèves (coordonnées incluses) et sa propre affectation vers un groupe standard du même niveau
 * (Ch. C.3). Terminologie officielle (§0.3) : « salle d'attente » / « rattachement » /
 * « affectation », jamais « groupe » côté élève en attente.
 */
export function TeacherLevelPoolsPage() {
  const { getAccessToken } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();

  const [pools, setPools] = useState<LevelPool[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [membersByPool, setMembersByPool] = useState<Record<string, LevelPoolMember[]>>({});
  const [selectedByPool, setSelectedByPool] = useState<Record<string, Set<string>>>({});
  const [targetGroupByPool, setTargetGroupByPool] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyPoolId, setBusyPoolId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
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
      const membersEntries = await Promise.all(
        poolsRes.map(async (pool) => [pool.id, await levelPoolsApi.listMembers(token, pool.id)] as const),
      );
      setMembersByPool(Object.fromEntries(membersEntries));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les salles d’attente.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const eligibleGroupsByLevel = useMemo(() => {
    const map: Record<string, Group[]> = {};
    for (const pool of pools) {
      map[pool.id] = groups.filter(
        (g) => g.schoolLevel.id === pool.schoolLevel.id && (g.status === 'ACTIVE' || g.status === 'FULL'),
      );
    }
    return map;
  }, [groups, pools]);

  function toggleStudent(poolId: string, studentId: string, checked: boolean) {
    setSelectedByPool((prev) => {
      const next = new Set(prev[poolId] ?? []);
      if (checked) next.add(studentId);
      else next.delete(studentId);
      return { ...prev, [poolId]: next };
    });
  }

  async function refreshPoolMembers(poolId: string) {
    const token = getAccessToken();
    if (!token) return;
    try {
      const members = await levelPoolsApi.listMembers(token, poolId);
      setMembersByPool((prev) => ({ ...prev, [poolId]: members }));
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Impossible de recharger les élèves.', 'error');
    }
  }

  async function handleRemove(poolId: string, studentId: string) {
    const ok = await confirm({
      message: "Retirer cet élève de la salle d'attente ? Une inscription active éventuelle n'est jamais affectée.",
    });
    if (!ok) return;
    const token = getAccessToken();
    if (!token) return;
    try {
      const res = await levelPoolsApi.removeMember(token, poolId, studentId);
      showToast(res.warning ?? 'Élève retiré de la salle d’attente.', res.warning ? 'info' : 'success');
      await refreshPoolMembers(poolId);
      await loadAll();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Impossible de retirer cet élève.', 'error');
    }
  }

  async function handleAssign(poolId: string) {
    const targetGroupId = targetGroupByPool[poolId];
    const selectedStudentIds = selectedByPool[poolId] ?? new Set<string>();
    if (!targetGroupId || selectedStudentIds.size === 0) return;
    const token = getAccessToken();
    if (!token) return;
    setBusyPoolId(poolId);
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
      setSelectedByPool((prev) => ({ ...prev, [poolId]: new Set() }));
      await refreshPoolMembers(poolId);
      await loadAll();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible d'affecter les élèves sélectionnés.", 'error');
    } finally {
      setBusyPoolId(null);
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
        <div className="page-actions">
          <button type="button" className="btn-primary" onClick={() => navigate('/teacher/invitation')}>
            Inviter des parents
          </button>
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
        pools.map((pool) => {
          const members = membersByPool[pool.id] ?? [];
          const selectedStudentIds = selectedByPool[pool.id] ?? new Set<string>();
          const eligibleGroups = eligibleGroupsByLevel[pool.id] ?? [];
          const targetGroupId = targetGroupByPool[pool.id] ?? '';

          return (
            <section className="card-section" key={pool.id}>
              <div className="page-header">
                <div>
                  <h2>{pool.schoolLevel.name}</h2>
                  <p className="form-hint">
                    {pool.academicYear.label} · {pool.activeMemberCount} élève
                    {pool.activeMemberCount > 1 ? 's' : ''} en attente
                  </p>
                </div>
              </div>

              {members.length === 0 ? (
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
                          <th>Parent</th>
                          <th>Téléphone</th>
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
                                onChange={(e) => toggleStudent(pool.id, member.student.id, e.target.checked)}
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
                            <td data-label="Téléphone">{member.student.parent.phone}</td>
                            <td data-label="">
                              <button
                                type="button"
                                className="ghost"
                                onClick={() => handleRemove(pool.id, member.student.id)}
                              >
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
                      <Select
                        value={targetGroupId}
                        onChange={(e) =>
                          setTargetGroupByPool((prev) => ({ ...prev, [pool.id]: e.target.value }))
                        }
                      >
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
                      disabled={busyPoolId === pool.id || !targetGroupId || selectedStudentIds.size === 0}
                      onClick={() => handleAssign(pool.id)}
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
          );
        })
      )}
    </>
  );
}
