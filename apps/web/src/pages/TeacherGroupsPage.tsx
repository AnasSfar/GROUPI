import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as referentialsApi from '../api/referentialsApi';
import * as teacherProfileApi from '../api/teacherProfileApi';
import * as groupsApi from '../api/groupsApi';
import type { Subject, SchoolLevel, AcademicYear } from '../api/referentialsApi';
import type { TeachingLocation } from '../api/teacherProfileApi';
import type {
  Group,
  GroupScheduleInput,
  DayOfWeek,
  TeachingMode,
  AbsenceBillingPolicy,
  VisibilityWhenFull,
} from '../api/groupsApi';

const STATUS_LABELS: Record<Group['status'], string> = {
  DRAFT: 'Brouillon',
  ACTIVE: 'Ouvert',
  FULL: 'Complet',
  SUSPENDED: 'Suspendu',
  CLOSED: 'Clôturé',
  ARCHIVED: 'Archivé',
};

const STATUS_BADGE: Record<Group['status'], string> = {
  DRAFT: 'badge-neutral',
  ACTIVE: 'badge-success',
  FULL: 'badge-warning',
  SUSPENDED: 'badge-danger',
  CLOSED: 'badge-neutral',
  ARCHIVED: 'badge-neutral',
};

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Lundi',
  TUESDAY: 'Mardi',
  WEDNESDAY: 'Mercredi',
  THURSDAY: 'Jeudi',
  FRIDAY: 'Vendredi',
  SATURDAY: 'Samedi',
  SUNDAY: 'Dimanche',
};

export function TeacherGroupsPage() {
  const { getAccessToken } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [locations, setLocations] = useState<TeachingLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [schoolLevelId, setSchoolLevelId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [capacity, setCapacity] = useState('20');
  const [publicPrice, setPublicPrice] = useState('');
  const [teachingMode, setTeachingMode] = useState<TeachingMode>('PRESENTIAL');
  const [absenceBillingPolicy, setAbsenceBillingPolicy] =
    useState<AbsenceBillingPolicy>('ALL_BILLED');
  const [visibilityWhenFull, setVisibilityWhenFull] = useState<VisibilityWhenFull>('VISIBLE');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [schedules, setSchedules] = useState<GroupScheduleInput[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('MONDAY');
  const [startTime, setStartTime] = useState('18:00');
  const [durationMinutes, setDurationMinutes] = useState('120');
  const [teachingLocationId, setTeachingLocationId] = useState('');

  const [locationLabel, setLocationLabel] = useState('');
  const [locationAddress, setLocationAddress] = useState('');

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [myGroups, allSubjects, allLevels, allYears, allLocations] = await Promise.all([
        groupsApi.listMine(token),
        referentialsApi.listSubjects(token),
        referentialsApi.listSchoolLevels(token),
        referentialsApi.listAcademicYears(token),
        teacherProfileApi.listLocations(token),
      ]);
      setGroups(myGroups);
      setSubjects(allSubjects);
      setSchoolLevels(allLevels);
      setAcademicYears(allYears.filter((y) => y.status === 'OPEN'));
      setLocations(allLocations);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les groupes.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  function addSchedule() {
    setSchedules((prev) => [
      ...prev,
      {
        dayOfWeek,
        startTime,
        durationMinutes: Number(durationMinutes),
        teachingLocationId: teachingLocationId || undefined,
      },
    ]);
  }

  function removeSchedule(index: number) {
    setSchedules((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleAddLocation(event: FormEvent) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token || !locationLabel) return;
    setError(null);
    try {
      const created = await teacherProfileApi.createLocation(token, {
        label: locationLabel,
        address: locationAddress || undefined,
      });
      setLocations((prev) => [...prev, created]);
      setLocationLabel('');
      setLocationAddress('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'ajouter ce lieu.");
    }
  }

  async function handleCreateGroup(event: FormEvent) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token || !subjectId || !schoolLevelId || !academicYearId || schedules.length === 0) return;
    setError(null);
    try {
      const created = await groupsApi.createGroup(token, {
        name,
        subjectId,
        schoolLevelId,
        academicYearId,
        capacity: Number(capacity),
        publicPrice: Number(publicPrice),
        teachingMode,
        absenceBillingPolicy,
        visibilityWhenFull,
        startDate,
        endDate: endDate || undefined,
        schedules,
      });
      setGroups((prev) => [created, ...prev]);
      setName('');
      setPublicPrice('');
      setStartDate('');
      setEndDate('');
      setSchedules([]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de créer ce groupe.');
    }
  }

  async function runAction(action: () => Promise<Group>) {
    setError(null);
    try {
      const updated = await action();
      setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "L'opération a échoué.");
    }
  }

  async function handleDelete(groupId: string) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      await groupsApi.removeGroup(token, groupId);
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Suppression impossible.');
    }
  }

  if (loading) {
    return <p>Chargement...</p>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Mes groupes</h1>
          <p>Créez et gérez vos groupes, plannings et lieux d'enseignement.</p>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <section className="card-section">
        <h2>Mes groupes ({groups.length})</h2>
        {groups.length === 0 && <p>Aucun groupe créé pour le moment.</p>}
        {groups.length > 0 && (
          <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Matière / Niveau</th>
                <th>Année</th>
                <th>Statut</th>
                <th>Places</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id}>
                  <td>{group.name}</td>
                  <td>
                    {group.subject.name} — {group.schoolLevel.name}
                  </td>
                  <td>{group.academicYear.label}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[group.status]}`}>
                      {STATUS_LABELS[group.status]}
                    </span>
                  </td>
                  <td>
                    {group._count.enrollments} / {group.capacity}
                  </td>
                  <td className="admin-actions">
                    <Link to={`/teacher/groups/${group.id}/sessions`}>Séances</Link>
                    <Link to={`/teacher/groups/${group.id}/announcements`}>Annonces</Link>
                    {group.status === 'DRAFT' && (
                      <>
                        <button
                          type="button"
                          onClick={() => runAction(() => groupsApi.openGroup(getAccessToken()!, group.id))}
                        >
                          Ouvrir
                        </button>
                        <button type="button" className="danger" onClick={() => handleDelete(group.id)}>
                          Supprimer
                        </button>
                      </>
                    )}
                    {(group.status === 'ACTIVE' || group.status === 'FULL') && (
                      <button
                        type="button"
                        onClick={() => runAction(() => groupsApi.closeGroup(getAccessToken()!, group.id))}
                      >
                        Clôturer
                      </button>
                    )}
                    {group.status === 'CLOSED' && (
                      <button
                        type="button"
                        onClick={() => runAction(() => groupsApi.archiveGroup(getAccessToken()!, group.id))}
                      >
                        Archiver
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
        <h2>Mes lieux d'enseignement</h2>
        <ul className="tag-list">
          {locations.map((loc) => (
            <li key={loc.id} className="tag">
              {loc.label}
            </li>
          ))}
        </ul>
        <form className="add-row" onSubmit={handleAddLocation}>
          <input
            type="text"
            placeholder="Nom du lieu"
            value={locationLabel}
            onChange={(e) => setLocationLabel(e.target.value)}
          />
          <input
            type="text"
            placeholder="Adresse (optionnel)"
            value={locationAddress}
            onChange={(e) => setLocationAddress(e.target.value)}
          />
          <button type="submit" disabled={!locationLabel}>
            Ajouter
          </button>
        </form>
      </section>

      <section className="card-section">
        <h2>Créer un groupe</h2>
        <form onSubmit={handleCreateGroup}>
          <label>
            Nom du groupe
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <div className="field-row">
            <label>
              Matière
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required>
                <option value="">Sélectionner...</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Niveau scolaire
              <select value={schoolLevelId} onChange={(e) => setSchoolLevelId(e.target.value)} required>
                <option value="">Sélectionner...</option>
                {schoolLevels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Année académique
            <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} required>
              <option value="">Sélectionner...</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                </option>
              ))}
            </select>
          </label>
          <div className="field-row">
            <label>
              Capacité
              <input
                type="number"
                min={1}
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </label>
            <label>
              Tarif public (TND)
              <input
                type="number"
                min={0}
                step="0.001"
                required
                value={publicPrice}
                onChange={(e) => setPublicPrice(e.target.value)}
              />
            </label>
          </div>
          <div className="field-row">
            <label>
              Mode d'enseignement
              <select value={teachingMode} onChange={(e) => setTeachingMode(e.target.value as TeachingMode)}>
                <option value="PRESENTIAL">Présentiel</option>
                <option value="ONLINE">En ligne</option>
              </select>
            </label>
            <label>
              Visibilité si complet
              <select
                value={visibilityWhenFull}
                onChange={(e) => setVisibilityWhenFull(e.target.value as VisibilityWhenFull)}
              >
                <option value="VISIBLE">Visible</option>
                <option value="HIDDEN">Masqué</option>
              </select>
            </label>
          </div>
          <label>
            Facturation des absences
            <select
              value={absenceBillingPolicy}
              onChange={(e) => setAbsenceBillingPolicy(e.target.value as AbsenceBillingPolicy)}
            >
              <option value="ALL_BILLED">Toutes facturées</option>
              <option value="EXCUSED_NOT_BILLED">Absences excusées non facturées</option>
              <option value="NONE_BILLED">Aucune absence facturée</option>
            </select>
          </label>
          <div className="field-row">
            <label>
              Date de début
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label>
              Date de fin (optionnel)
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>
          </div>

          <h3>Planning hebdomadaire</h3>
          <ul className="tag-list">
            {schedules.map((s, i) => (
              <li key={i} className="tag">
                {DAY_LABELS[s.dayOfWeek]} {s.startTime} ({s.durationMinutes} min)
                <button type="button" onClick={() => removeSchedule(i)}>
                  ×
                </button>
              </li>
            ))}
          </ul>
          <div className="field-row">
            <label>
              Jour
              <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}>
                {Object.entries(DAY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Heure de début
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </label>
            <label>
              Durée (min)
              <input
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </label>
            <label>
              Lieu (optionnel)
              <select value={teachingLocationId} onChange={(e) => setTeachingLocationId(e.target.value)}>
                <option value="">—</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="button" onClick={addSchedule}>
            Ajouter ce créneau
          </button>

          <button
            type="submit"
            disabled={!subjectId || !schoolLevelId || !academicYearId || schedules.length === 0}
          >
            Créer le groupe
          </button>
        </form>
      </section>
    </>
  );
}
