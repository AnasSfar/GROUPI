import { apiRequest } from './client';

/** Avenant 01, Ch. B — groupe de niveau (salle d'attente), une par (Professeur, niveau, année). */
export interface LevelPool {
  id: string;
  schoolLevel: { id: string; name: string; order: number };
  academicYear: { id: string; label: string; status: 'OPEN' | 'CLOSED' };
  status: 'ACTIVE' | 'ARCHIVED';
  activeMemberCount: number;
}

export interface LevelPoolMember {
  id: string;
  status: 'ACTIVE' | 'REMOVED';
  source: 'INVITATION' | 'TEACHER_MANUAL' | 'SITUATION_SYNC';
  createdAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    status: 'ACTIVE' | 'ARCHIVED';
    currentSchoolSituation: {
      schoolLevelId: string;
      school: { name: string };
      class: string | null;
    } | null;
  };
}

export function listMine(accessToken: string): Promise<LevelPool[]> {
  return apiRequest<LevelPool[]>('/teacher/level-pools', { accessToken });
}

export function listMembers(accessToken: string, groupId: string): Promise<LevelPoolMember[]> {
  return apiRequest<LevelPoolMember[]>(`/teacher/level-pools/${groupId}/members`, { accessToken });
}

/** RM-POOL-007/ERR-POOL-004 : peut renvoyer un avertissement (inscription active) sans échouer. */
export function removeMember(
  accessToken: string,
  groupId: string,
  studentId: string,
): Promise<{ id: string; warning: string | null }> {
  return apiRequest(`/teacher/level-pools/${groupId}/members/${studentId}`, {
    method: 'DELETE',
    accessToken,
  });
}
