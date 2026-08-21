import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/UiState';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
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

interface StudentRow {
  student: TeacherEnrollment['student'];
  parent: TeacherEnrollment['student']['parent'];
  enrollments: (TeacherEnrollment & { status: 'ACTIVE' | 'SUSPENDED' })[];
}

function situationLabel(student: TeacherEnrollment['student']) {
  const situation = student.currentSchoolSituation;
  if (!situation) return '-';
  return `${situation.school.name} - ${situation.schoolLevel.name}${situation.class ? ` (${situation.class})` : ''}`;
}

function buildStudentRows(groups: Group[], enrollmentsByGroup: Map<string, TeacherEnrollment[]>): StudentRow[] {
  const groupOrder = new Map(groups.map((group, index) => [group.id, index]));
  const rows = new Map<string, StudentRow>();

  for (const group of groups) {
    for (const enrollment of enrollmentsByGroup.get(group.id) ?? []) {
      if (enrollment.status !== 'ACTIVE' && enrollment.status !== 'SUSPENDED') continue;
      const existing = rows.get(enrollment.student.id);
      if (existing) {
        existing.enrollments.push(enrollment as TeacherEnrollment & { status: 'ACTIVE' | 'SUSPENDED' });
      } else {
        rows.set(enrollment.student.id, {
          student: enrollment.student,
          parent: enrollment.student.parent,
          enrollments: [enrollment as TeacherEnrollment & { status: 'ACTIVE' | 'SUSPENDED' }],
        });
      }
    }
  }

  return [...rows.values()]
    .map((row) => ({
      ...row,
      enrollments: row.enrollments.sort(
        (a, b) => (groupOrder.get(a.group.id) ?? 0) - (groupOrder.get(b.group.id) ?? 0),
      ),
    }))
    .sort((a, b) => {
      const last = a.student.lastName.localeCompare(b.student.lastName, 'fr');
      return last || a.student.firstName.localeCompare(b.student.firstName, 'fr');
    });
}

export function TeacherStudentsPage() {
  const { getAccessToken } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [enrollmentsByGroup, setEnrollmentsByGroup] = useState<Map<string, TeacherEnrollment[]>>(new Map());
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const myGroups = await groupsApi.listMine(token);
      const entries = await Promise.all(
        myGroups.map(async (group) => [group.id, await enrollmentsApi.listByGroup(token, group.id)] as const),
      );
      setGroups(myGroups);
      setEnrollmentsByGroup(new Map(entries));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger vos eleves.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => buildStudentRows(groups, enrollmentsByGroup), [groups, enrollmentsByGroup]);
  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return rows;
    return rows.filter((row) => {
      const haystack = [
        row.student.firstName,
        row.student.lastName,
        row.parent.firstName,
        row.parent.lastName,
        situationLabel(row.student),
        ...row.enrollments.map((enrollment) => enrollment.group.name),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [query, rows]);

  if (loading) {
    return <p>Chargement...</p>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Mes eleves</h1>
          <p>Vue globale des eleves actifs ou suspendus dans vos groupes.</p>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <section className="card-section">
        <div className="filters-row">
          <input
            className="search-input"
            type="search"
            placeholder="Rechercher un eleve, parent, groupe..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <span className="table-hint">
            {filteredRows.length} eleve{filteredRows.length > 1 ? 's' : ''}
          </span>
        </div>
      </section>

      <section className="card-section">
        <h2>Eleves ({filteredRows.length})</h2>
        {rows.length === 0 ? (
          <EmptyState title="Aucun eleve">
            Aucun eleve actif ou suspendu dans vos groupes pour le moment.
          </EmptyState>
        ) : filteredRows.length === 0 ? (
          <EmptyState title="Aucun resultat">Aucun eleve ne correspond a cette recherche.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Eleve</th>
                  <th>Parent</th>
                  <th>Etablissement / Niveau / Classe</th>
                  <th>Groupes</th>
                  <th>Statuts</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.student.id}>
                    <td data-label="Eleve">
                      {row.student.firstName} {row.student.lastName}
                    </td>
                    <td data-label="Parent">
                      {row.parent.firstName} {row.parent.lastName}
                    </td>
                    <td data-label="Etablissement / Niveau / Classe">{situationLabel(row.student)}</td>
                    <td data-label="Groupes">
                      <ul className="tag-list">
                        {row.enrollments.map((enrollment) => (
                          <li key={enrollment.id} className="tag">
                            {enrollment.group.name}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td data-label="Statuts">
                      <ul className="tag-list">
                        {row.enrollments.map((enrollment) => (
                          <li key={enrollment.id}>
                            <span className={`badge ${STATUS_BADGE[enrollment.status]}`}>
                              {STATUS_LABELS[enrollment.status]}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="admin-actions">
                      {row.enrollments.map((enrollment) => (
                        <Link key={enrollment.id} to={`/teacher/enrollments?groupId=${enrollment.group.id}`}>
                          Gerer {enrollment.group.name}
                        </Link>
                      ))}
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
