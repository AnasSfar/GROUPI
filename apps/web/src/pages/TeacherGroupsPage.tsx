import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Select } from '../components/Select';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { ApiError } from '../api/client';
import * as referentialsApi from '../api/referentialsApi';
import * as teacherProfileApi from '../api/teacherProfileApi';
import * as groupsApi from '../api/groupsApi';
import { readHiddenGroupIds } from '../utils/hiddenGroups';
import { formatDuration, effectiveTeachingMode } from '../api/groupsApi';
import type { Subject, SchoolLevel, AcademicYear, SubjectLevelPair } from '../api/referentialsApi';
import type { TeachingLocation } from '../api/teacherProfileApi';
import type {
  Group,
  GroupScheduleInput,
  DayOfWeek,
  TeachingMode,
  AbsenceBillingPolicy,
  VisibilityWhenFull,
} from '../api/groupsApi';

const TEACHING_MODE_LABELS: Record<TeachingMode, string> = {
  PRESENTIAL: 'Présentiel',
  ONLINE: 'En ligne',
};

const STATUS_LABELS: Record<Group['status'], string> = {
  DRAFT: 'Brouillon',
  ACTIVE: 'Ouvert',
  FULL: 'Clôturé',
  SUSPENDED: 'Suspendu',
  CLOSED: 'Fermé',
  ARCHIVED: 'Supprimé',
};

const STATUS_BADGE: Record<Group['status'], string> = {
  DRAFT: 'badge-neutral',
  ACTIVE: 'badge-success',
  FULL: 'badge-info',
  SUSPENDED: 'badge-danger',
  CLOSED: 'badge-warning',
  ARCHIVED: 'badge-neutral',
};

const DAY_LABELS: Record<DayOfWeek, string> = {
  SUNDAY: 'Dimanche',
  MONDAY: 'Lundi',
  TUESDAY: 'Mardi',
  WEDNESDAY: 'Mercredi',
  THURSDAY: 'Jeudi',
  FRIDAY: 'Vendredi',
  SATURDAY: 'Samedi',
};

export function TeacherGroupsPage() {
  const { getAccessToken, currentUser } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupSearch, setGroupSearch] = useState('');
  // Compatibilité avec les groupes retirés avant que "Supprimer" devienne une suppression métier.
  const [hiddenGroupIds, setHiddenGroupIds] = useState<Set<string>>(new Set());
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([]);
  const [subjectLevels, setSubjectLevels] = useState<SubjectLevelPair[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [locations, setLocations] = useState<TeachingLocation[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
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
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('MONDAY');
  const [startTime, setStartTime] = useState('18:00');
  const [durationMinutes, setDurationMinutes] = useState('120');
  const [teachingLocationId, setTeachingLocationId] = useState('');
  // RM-GRP-007 : override du mode d'enseignement pour ce créneau — '' = hérite du mode du groupe.
  const [scheduleTeachingMode, setScheduleTeachingMode] = useState<TeachingMode | ''>('');

  // Ch.10.11/ERR-GRP-016/017 : édition du planning d'un groupe existant.
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editSchedules, setEditSchedules] = useState<GroupScheduleInput[]>([]);
  const [editDayOfWeek, setEditDayOfWeek] = useState<DayOfWeek>('MONDAY');
  const [editStartTime, setEditStartTime] = useState('18:00');
  const [editDurationMinutes, setEditDurationMinutes] = useState('120');
  const [editTeachingLocationId, setEditTeachingLocationId] = useState('');
  // RM-GRP-007 : override du mode d'enseignement pour ce créneau — '' = hérite du mode du groupe.
  const [editScheduleTeachingMode, setEditScheduleTeachingMode] = useState<TeachingMode | ''>('');
  const [scheduleConflict, setScheduleConflict] = useState<{ groupId: string; message: string } | null>(
    null,
  );
  const [savingSchedule, setSavingSchedule] = useState(false);

  useEffect(() => {
    setHiddenGroupIds(readHiddenGroupIds(currentUser?.id));
  }, [currentUser?.id]);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [myGroups, myProfile, allSubjectLevels, allYears, allLocations] = await Promise.all([
        groupsApi.listMine(token),
        teacherProfileApi.getMyProfile(token),
        referentialsApi.listSubjectLevels(token),
        referentialsApi.listAcademicYears(token),
        teacherProfileApi.listLocations(token),
      ]);
      setGroups(myGroups);
      setSubjects(myProfile.subjects.map(({ subject }) => subject));
      setSchoolLevels(myProfile.schoolLevels.map(({ schoolLevel }) => schoolLevel));
      setSubjectLevels(allSubjectLevels);
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

  /** ERR-GRP-001 : n'offrir que les niveaux compatibles avec la matière choisie, plutôt que de
   * laisser composer une combinaison interdite et de l'apprendre seulement à la soumission. */
  const availableLevels = useMemo(() => {
    if (!subjectId) return [];
    const compatibleIds = new Set(
      subjectLevels.filter((sl) => sl.subjectId === subjectId).map((sl) => sl.schoolLevelId),
    );
    return schoolLevels.filter((l) => compatibleIds.has(l.id));
  }, [subjectId, subjectLevels, schoolLevels]);

  useEffect(() => {
    if (subjects.length === 1 && !subjectId) {
      setSubjectId(subjects[0].id);
      return;
    }
    if (subjectId && !subjects.some((s) => s.id === subjectId)) {
      setSubjectId('');
    }
  }, [subjects, subjectId]);

  useEffect(() => {
    if (schoolLevelId && !availableLevels.some((l) => l.id === schoolLevelId)) {
      setSchoolLevelId('');
      return;
    }
    if (!schoolLevelId && availableLevels.length === 1) {
      setSchoolLevelId(availableLevels[0].id);
    }
  }, [availableLevels, schoolLevelId]);

  // Lieux gérés depuis /teacher/profile désormais — ici on ne fait que pré-remplir le premier
  // créneau avec le lieu par défaut du profil (le plus souvent le seul), modifiable ensuite par
  // créneau via le sélecteur "Lieu (optionnel)" comme avant.
  useEffect(() => {
    if (!teachingLocationId && locations.length > 0) {
      const defaultLocation = locations.find((l) => l.isActive);
      if (defaultLocation) setTeachingLocationId(defaultLocation.id);
    }
  }, [locations, teachingLocationId]);

  async function handleCreateGroup(event: FormEvent) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token || !subjectId || !schoolLevelId || !academicYearId || !startTime || Number(durationMinutes) <= 0) return;
    const groupSchedules = [
      {
        dayOfWeek,
        startTime,
        durationMinutes: Number(durationMinutes),
        teachingLocationId: teachingLocationId || undefined,
        teachingMode: scheduleTeachingMode || undefined,
      },
    ];
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
        schedules: groupSchedules,
      });
      const published =
        created.status === 'DRAFT' ? await groupsApi.openGroup(token, created.id) : created;
      setGroups((prev) => [published, ...prev]);
      setName('');
      setPublicPrice('');
      setStartDate('');
      setEndDate('');
      setShowCreateModal(false);
      showToast('Groupe créé et ouvert aux parents');
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
    const ok = await confirm({
      title: 'Supprimer ce groupe ?',
      message: 'Cette action est irréversible.',
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    setError(null);
    try {
      await groupsApi.removeGroup(token, groupId);
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      showToast('Groupe supprimé');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Suppression impossible.');
    }
  }

  async function handleArchive(group: Group) {
    const token = getAccessToken();
    if (!token) return;
    const ok = await confirm({
      title: `Supprimer « ${group.name} » ?`,
      message:
        "Ce groupe possède peut-être un historique : il sera conservé pour les anciennes séances, inscriptions et paiements, mais il n'apparaîtra plus dans vos groupes. Les demandes d'inscription encore en attente seront automatiquement refusées.",
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    setError(null);
    try {
      const closed = group.status === 'CLOSED' ? group : await groupsApi.closeGroup(token, group.id);
      await groupsApi.archiveGroup(token, closed.id);
      setGroups((prev) => prev.filter((g) => g.id !== group.id));
      showToast('Groupe supprimé');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Suppression impossible.');
    }
  }

  function startEditSchedules(group: Group) {
    setEditingGroupId(group.id);
    setEditSchedules(
      group.schedules.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        durationMinutes: s.durationMinutes,
        teachingLocationId: s.teachingLocationId,
        teachingMode: s.teachingMode ?? undefined,
      })),
    );
    setScheduleConflict(null);
    setError(null);
  }

  function cancelEditSchedules() {
    setEditingGroupId(null);
    setEditSchedules([]);
    setScheduleConflict(null);
  }

  function addEditSchedule() {
    setEditSchedules((prev) => [
      ...prev,
      {
        dayOfWeek: editDayOfWeek,
        startTime: editStartTime,
        durationMinutes: Number(editDurationMinutes),
        teachingLocationId: editTeachingLocationId || undefined,
        teachingMode: editScheduleTeachingMode || undefined,
      },
    ]);
  }

  function removeEditSchedule(index: number) {
    setEditSchedules((prev) => prev.filter((_, i) => i !== index));
  }

  /**
   * ERR-GRP-016/017 : un premier essai sans `keepFutureSessions` peut échouer si des séances
   * futures sont déjà planifiées sur l'ancien planning — dans ce cas on affiche le choix renvoyé
   * par l'API (conserver / supprimer) et on ne resoumet qu'une fois l'un des deux choisi.
   */
  async function submitScheduleUpdate(groupId: string, keepFutureSessions?: boolean) {
    const token = getAccessToken();
    if (!token || editSchedules.length === 0) return;
    setSavingSchedule(true);
    setError(null);
    try {
      const updated = await groupsApi.updateGroup(token, groupId, {
        schedules: editSchedules,
        ...(keepFutureSessions !== undefined ? { keepFutureSessions } : {}),
      });
      setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      setEditingGroupId(null);
      setEditSchedules([]);
      setScheduleConflict(null);
      showToast('Planning mis à jour');
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.message.includes('ERR-GRP-016') || err.message.includes('ERR-GRP-017'))
      ) {
        setScheduleConflict({ groupId, message: err.message });
      } else {
        setError(err instanceof ApiError ? err.message : 'Impossible de modifier le planning.');
      }
    } finally {
      setSavingSchedule(false);
    }
  }

  if (loading) {
    return <p>Chargement...</p>;
  }

  const groupSearchQuery = groupSearch.trim().toLowerCase();
  const listedGroups = groups.filter((group) => group.status !== 'ARCHIVED' && !hiddenGroupIds.has(group.id));
  const visibleGroups = listedGroups
    .filter(
      (group) =>
        !groupSearchQuery ||
        group.name.toLowerCase().includes(groupSearchQuery) ||
        group.subject.name.toLowerCase().includes(groupSearchQuery) ||
        group.schoolLevel.name.toLowerCase().includes(groupSearchQuery),
    );

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Mes groupes</h1>
          <p>Créez et gérez vos groupes et plannings.</p>
        </div>
        <div className="page-actions">
          <button type="button" onClick={() => setShowCreateModal(true)}>
            Créer un groupe
          </button>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <section className="card-section">
        <h2>Mes groupes ({listedGroups.length})</h2>
        {listedGroups.length === 0 && <p>Aucun groupe créé pour le moment.</p>}
        {listedGroups.length > 0 && (
          <input
            type="search"
            className="search-input"
            placeholder="Rechercher un groupe, une matière, un niveau..."
            value={groupSearch}
            onChange={(e) => setGroupSearch(e.target.value)}
            aria-label="Rechercher un groupe"
          />
        )}
        {listedGroups.length > 0 && visibleGroups.length === 0 && <p>Aucun groupe ne correspond à cette recherche.</p>}
      </section>

      <div className="teacher-groups-grid">
      {visibleGroups.map((group) => (
        <section key={group.id} className="card-section teacher-group-card">
          <div className="teacher-group-card-top">
            <div>
              <h2>{group.name}</h2>
              <p>
                {group.subject.name} · {group.schoolLevel.name} · {group.academicYear.label}
              </p>
            </div>
            <span className={`badge ${STATUS_BADGE[group.status]}`}>{STATUS_LABELS[group.status]}</span>
          </div>

          <div className="teacher-group-summary">
            <div>
              <span>{group._count.enrollments} / {group.capacity}</span>
              <small>places</small>
            </div>
            <div className="teacher-group-schedule">
              <span>Planning</span>
              <small>
                {group.schedules.length === 0
                  ? '—'
                  : group.schedules
                      .map(
                        (s) =>
                          `${DAY_LABELS[s.dayOfWeek]} ${s.startTime} · ${formatDuration(s.durationMinutes)} · ${TEACHING_MODE_LABELS[effectiveTeachingMode(s, group)]}`,
                      )
                      .join(', ')}
              </small>
            </div>
          </div>

          {(group.generationPausedFrom || group.generationPausedUntil) && (
            <div className="teacher-group-badges">
              {(group.generationPausedFrom || group.generationPausedUntil) && (
                <span className="badge badge-warning">Génération interrompue</span>
              )}
            </div>
          )}

          <div className="admin-actions teacher-group-links">
            <Link to={`/teacher/groups/${group.id}/sessions`}>Séances</Link>
            <Link to={`/teacher/groups/${group.id}/students`}>Élèves</Link>
            <Link to={`/teacher/accounting?groupId=${group.id}`}>Paiements</Link>
            <Link to={`/teacher/groups/${group.id}/attendance`}>Stats</Link>
            <Link to={`/teacher/groups/${group.id}/announcements`}>Annonces</Link>
          </div>

          <div className="admin-actions teacher-group-tools">
            {group.status !== 'ARCHIVED' && editingGroupId !== group.id && (
              <button type="button" onClick={() => startEditSchedules(group)}>
                Modifier planning
              </button>
            )}
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
              <>
                <button
                  type="button"
                  onClick={() => runAction(() => groupsApi.closeGroup(getAccessToken()!, group.id))}
                >
                  Fermer
                </button>
                <button type="button" className="danger" onClick={() => handleArchive(group)}>
                  Supprimer
                </button>
              </>
            )}
            {group.status === 'CLOSED' && (
              <button type="button" className="danger" onClick={() => handleArchive(group)}>
                Supprimer
              </button>
            )}
          </div>

          {editingGroupId === group.id && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <h3>Planning de « {group.name} »</h3>
              <ul className="tag-list">
                {editSchedules.map((s, i) => (
                  <li key={i} className="tag">
                    {DAY_LABELS[s.dayOfWeek]} {s.startTime} ({formatDuration(s.durationMinutes)})
                    <button type="button" onClick={() => removeEditSchedule(i)}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              <div className="field-row">
                <label>
                  Jour
                  <Select value={editDayOfWeek} onChange={(e) => setEditDayOfWeek(e.target.value as DayOfWeek)}>
                    {Object.entries(DAY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </label>
                <label>
                  Heure de début
                  <input type="time" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} />
                </label>
                <label>
                  Durée (min)
                  <input
                    type="number"
                    min={1}
                    value={editDurationMinutes}
                    onChange={(e) => setEditDurationMinutes(e.target.value)}
                  />
                </label>
                <label>
                  Lieu (optionnel)
                  <Select
                    value={editTeachingLocationId}
                    onChange={(e) => setEditTeachingLocationId(e.target.value)}
                  >
                    <option value="">—</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.label}
                      </option>
                    ))}
                  </Select>
                </label>
                <label>
                  Mode du créneau (optionnel)
                  <Select
                    value={editScheduleTeachingMode}
                    onChange={(e) => setEditScheduleTeachingMode(e.target.value as TeachingMode | '')}
                  >
                    <option value="">Hérite du mode du groupe</option>
                    <option value="PRESENTIAL">Présentiel</option>
                    <option value="ONLINE">En ligne</option>
                  </Select>
                </label>
              </div>
              <button type="button" onClick={addEditSchedule}>
                Ajouter ce créneau
              </button>

              {scheduleConflict?.groupId === group.id ? (
                <>
                  <p className="form-notice" role="alert">
                    {scheduleConflict.message}
                  </p>
                  <div className="page-actions" style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      onClick={() => submitScheduleUpdate(group.id, true)}
                      disabled={savingSchedule}
                    >
                      Conserver les séances existantes
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => submitScheduleUpdate(group.id, false)}
                      disabled={savingSchedule}
                    >
                      Supprimer et laisser le planning se régénérer
                    </button>
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => setScheduleConflict(null)}
                      disabled={savingSchedule}
                    >
                      Annuler
                    </button>
                  </div>
                </>
              ) : (
                <div className="page-actions" style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => submitScheduleUpdate(group.id)}
                    disabled={editSchedules.length === 0 || savingSchedule}
                  >
                    {savingSchedule ? 'Enregistrement...' : 'Enregistrer le planning'}
                  </button>
                  <button type="button" className="ghost" onClick={cancelEditSchedules} disabled={savingSchedule}>
                    Annuler
                  </button>
                </div>
              )}
            </div>
          )}

        </section>
      ))}
      </div>

      {showCreateModal && (
        <div className="terms-modal-backdrop group-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="terms-modal group-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Créer un groupe</h2>
        <form className="group-form" onSubmit={handleCreateGroup}>
          <label>
            Nom du groupe
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <div className="field-row">
            <label>
              Matière
              <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                <option value="">Sélectionner...</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </label>
            <label>
              Niveau scolaire
              <Select
                value={schoolLevelId}
                onChange={(e) => setSchoolLevelId(e.target.value)}
                disabled={!subjectId}
              >
                <option value="">{subjectId ? 'Sélectionner...' : "Choisissez d'abord une matière"}</option>
                {availableLevels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          <label>
            Année académique
            <Select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)}>
              <option value="">Sélectionner...</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                </option>
              ))}
            </Select>
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
              <Select value={teachingMode} onChange={(e) => setTeachingMode(e.target.value as TeachingMode)}>
                <option value="PRESENTIAL">Présentiel</option>
                <option value="ONLINE">En ligne</option>
              </Select>
            </label>
            <label>
              Visibilité si complet
              <Select
                value={visibilityWhenFull}
                onChange={(e) => setVisibilityWhenFull(e.target.value as VisibilityWhenFull)}
              >
                <option value="VISIBLE">Visible</option>
                <option value="HIDDEN">Masqué</option>
              </Select>
            </label>
          </div>
          <label>
            Facturation des absences
            <Select
              value={absenceBillingPolicy}
              onChange={(e) => setAbsenceBillingPolicy(e.target.value as AbsenceBillingPolicy)}
            >
              <option value="ALL_BILLED">Toutes facturées</option>
              <option value="EXCUSED_NOT_BILLED">Absences excusées non facturées</option>
              <option value="NONE_BILLED">Aucune absence facturée</option>
            </Select>
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
          <div className="field-row group-schedule-row">
            <label>
              Jour
              <Select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}>
                {Object.entries(DAY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
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
              <Select value={teachingLocationId} onChange={(e) => setTeachingLocationId(e.target.value)}>
                <option value="">—</option>
                {locations
                  .filter((loc) => loc.isActive)
                  .map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.label}
                    </option>
                  ))}
              </Select>
              <span className="table-hint">
                Pré-rempli avec ton lieu par défaut. <Link to="/teacher/profile">Gérer mes lieux</Link>
              </span>
            </label>
            <label>
              Mode du créneau (optionnel)
              <Select
                value={scheduleTeachingMode}
                onChange={(e) => setScheduleTeachingMode(e.target.value as TeachingMode | '')}
              >
                <option value="">Hérite du mode du groupe</option>
                <option value="PRESENTIAL">Présentiel</option>
                <option value="ONLINE">En ligne</option>
              </Select>
            </label>
          </div>
          <div className="terms-modal-actions group-modal-actions">
            <button type="button" className="ghost" onClick={() => setShowCreateModal(false)}>
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!subjectId || !schoolLevelId || !academicYearId || !startTime || Number(durationMinutes) <= 0}
            >
              Créer et ouvrir le groupe
            </button>
          </div>
        </form>
          </div>
        </div>
      )}
    </>
  );
}


