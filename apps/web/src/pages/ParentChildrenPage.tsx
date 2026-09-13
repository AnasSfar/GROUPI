import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Select } from '../components/Select';
import { ChildDetailCard } from '../components/ChildDetailCard';
import { ChildSubjectsPanel } from '../components/ChildSubjectsPanel';
import { ChildAttendancePanel } from '../components/ChildAttendancePanel';
import { ChildAccountingPanel } from '../components/ChildAccountingPanel';
import { ChildSituationPanel, headlineSituationStatus } from '../components/ChildSituationPanel';
import { EmptyState } from '../components/UiState';
import { ApiError } from '../api/client';
import * as referentialsApi from '../api/referentialsApi';
import * as parentProfileApi from '../api/parentProfileApi';
import * as dashboardApi from '../api/dashboardApi';
import * as schoolSituationApi from '../api/schoolSituationApi';
import type { City, School, SchoolLevel } from '../api/referentialsApi';
import type { ParentProfile, Student, PendingLevelPoolAssignment, StudentSituation } from '../api/parentProfileApi';
import type { ParentDashboard } from '../api/dashboardApi';

/**
 * Avenant 01, Ch. D.3 (décision #3) : navigation à 3 niveaux du portail Parent.
 * - Niveau 1 (enfants) : la grille "Mes enfants" ci-dessous, masquée (RM-PAR-022) au profit d'un
 *   affichage direct de la fiche quand le Parent n'a qu'un seul enfant (voir `singleChild`).
 * - Niveau 2 (matières) : onglet "Matières" -> `ChildSubjectsPanel` (masqué en son sein si une
 *   seule matière et rien en attente, RM-PAR-022).
 * - Niveau 3 (Suivi) : contenu de `ChildSubjectsPanel` une fois une matière sélectionnée.
 * Les onglets "Présences"/"Comptabilité"/"Situation scolaire" restent la vue transverse par enfant
 * (Ch.16.4, conservée) — somme des soldes, historique complet tous groupes confondus.
 */
type FicheTab = 'overview' | 'subjects' | 'attendance' | 'accounting' | 'situation';

function initials(student: Student): string {
  return `${student.firstName[0] ?? ''}${student.lastName[0] ?? ''}`.toUpperCase();
}

function formatSchoolOption(school: School) {
  const city = school.city?.name ? ` - ${school.city.name}` : '';
  const code = school.officialCode ? ` (${school.officialCode})` : '';
  return `${school.name}${city}${code}`;
}
export function ParentChildrenPage() {
  const { getAccessToken } = useAuth();
  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [schoolCityId, setSchoolCityId] = useState('');
  const [dashboard, setDashboard] = useState<ParentDashboard | null>(null);
  const [pendingAssignments, setPendingAssignments] = useState<PendingLevelPoolAssignment[]>([]);
  const [openChildId, setOpenChildId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FicheTab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddChild, setShowAddChild] = useState(false);
  const [openStudentSituations, setOpenStudentSituations] = useState<StudentSituation[]>([]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  // Le nom de famille est pré-rempli avec celui du parent (suggestion, pas une valeur imposée) :
  // on arrête de le resynchroniser dès que le parent modifie ce champ à la main, pour ne pas
  // écraser sa saisie. Remis à false après un ajout réussi (le formulaire est vidé), pour que la
  // suggestion réapparaisse au prochain enfant.
  const [lastNameEdited, setLastNameEdited] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [schoolLevelId, setSchoolLevelId] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [schoolClass, setSchoolClass] = useState('');

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [me, myStudents, levels, allSchools, allCities, parentDashboard, pending] = await Promise.all([
        parentProfileApi.getMyProfile(token),
        parentProfileApi.listStudents(token),
        referentialsApi.listSchoolLevels(token),
        referentialsApi.listSchools(token),
        referentialsApi.listCities(token),
        dashboardApi.getParentDashboard(token),
        parentProfileApi.listPendingAssignments(token),
      ]);
      setProfile(me);
      setStudents(myStudents);
      setSchoolLevels(levels);
      setSchools(allSchools);
      setCities(allCities);
      setDashboard(parentDashboard);
      setPendingAssignments(pending);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger le profil.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (profile && !lastNameEdited) {
      setLastName(profile.lastName);
    }
  }, [profile, lastNameEdited]);

  // Avenant 01, Ch. D.3/RM-PAR-022 : niveau 1 ("Mes enfants") masqué s'il n'y a qu'un seul enfant —
  // sa fiche s'ouvre directement, sans grille de sélection à choix unique. `autoOpenedRef` n'ouvre
  // qu'une fois : un rafraîchissement ultérieur (ex. depuis le niveau 3, après un signalement
  // d'absence) ne doit pas réinitialiser l'onglet actif du Parent.
  const autoOpenedRef = useRef(false);
  useEffect(() => {
    if (students.length === 1 && !autoOpenedRef.current) {
      autoOpenedRef.current = true;
      setOpenChildId(students[0].id);
      setActiveTab(students[0].status === 'ACTIVE' ? 'overview' : 'situation');
    }
  }, [students]);

  // Statut affiché devant le nom dans l'en-tête de la fiche : chargé indépendamment de l'onglet
  // actif (l'onglet "Situation scolaire" peut ne jamais avoir été ouvert par le Parent).
  useEffect(() => {
    const token = getAccessToken();
    if (!token || !openChildId) {
      setOpenStudentSituations([]);
      return;
    }
    let cancelled = false;
    schoolSituationApi.listHistory(token, openChildId).then((situations) => {
      if (!cancelled) setOpenStudentSituations(situations);
    });
    return () => {
      cancelled = true;
    };
  }, [getAccessToken, openChildId]);

  /** Le référentiel compte plus de 6000 établissements nationaux — sans filtre par ville, le
   * sélecteur est inutilisable. On restreint donc aux établissements de la ville choisie. */
  const schoolsInCity = useMemo(
    () => (schoolCityId ? schools.filter((s) => s.cityId === schoolCityId) : []),
    [schoolCityId, schools],
  );

  useEffect(() => {
    if (schoolId && !schoolsInCity.some((s) => s.id === schoolId)) {
      setSchoolId('');
    }
  }, [schoolsInCity, schoolId]);

  async function handleCreateStudent(event: FormEvent) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token || !schoolLevelId || !schoolId) return;
    setError(null);
    try {
      const created = await parentProfileApi.createStudent(token, {
        firstName,
        lastName,
        dateOfBirth: dateOfBirth || undefined,
        schoolLevelId,
        schoolId,
        schoolClass: schoolClass || undefined,
      });
      setStudents((prev) => [...prev, created]);
      setFirstName('');
      setLastName('');
      setLastNameEdited(false);
      setDateOfBirth('');
      setSchoolLevelId('');
      setSchoolCityId('');
      setSchoolId('');
      setSchoolClass('');
      setShowAddChild(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'ajouter cet enfant.");
    }
  }

  async function handleArchive(studentId: string) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      const updated = await parentProfileApi.archiveStudent(token, studentId);
      setStudents((prev) => prev.map((s) => (s.id === studentId ? updated : s)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'archiver cet enfant.");
    }
  }

  async function handleReactivate(studentId: string) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      const updated = await parentProfileApi.reactivateStudent(token, studentId);
      setStudents((prev) => prev.map((s) => (s.id === studentId ? updated : s)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de réactiver cet enfant.');
    }
  }

  if (loading) {
    return <p>Chargement...</p>;
  }

  if (!profile) {
    return <p className="form-error">{error ?? 'Profil introuvable.'}</p>;
  }

  const openStudent = students.find((s) => s.id === openChildId) ?? null;
  const openChildDashboard = dashboard?.children.find((c) => c.student.id === openChildId) ?? null;
  // RM-PAR-022 : niveau 1 masqué s'il n'y a qu'un seul enfant (voir l'effet `autoOpenedRef` plus haut).
  const singleChild = students.length === 1 ? students[0] : null;
  const openStudentStatus = headlineSituationStatus(openStudentSituations);

  const openStudentHeading = openStudent && (
    <span className="status-dot-row">
      {openStudentStatus && <span className={`status-dot ${openStudentStatus.tone}`} title={openStudentStatus.label} />}
      {openStudent.firstName} {openStudent.lastName}
    </span>
  );

  const ficheTabsAndContent = openStudent && (
    <>
      <div className="fiche-tabs" role="tablist">
        {openChildDashboard && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'overview'}
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            Vue d'ensemble
          </button>
        )}
        {openChildDashboard && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'subjects'}
            className={activeTab === 'subjects' ? 'active' : ''}
            onClick={() => setActiveTab('subjects')}
          >
            Matières
          </button>
        )}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'attendance'}
          className={activeTab === 'attendance' ? 'active' : ''}
          onClick={() => setActiveTab('attendance')}
        >
          Présences
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'accounting'}
          className={activeTab === 'accounting' ? 'active' : ''}
          onClick={() => setActiveTab('accounting')}
        >
          Comptabilité
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'situation'}
          className={activeTab === 'situation' ? 'active' : ''}
          onClick={() => setActiveTab('situation')}
        >
          Situation scolaire
        </button>
      </div>

      {!openChildDashboard && (
        <p className="form-notice section-spacer">
          Le suivi d'activité (groupes, séances, remarques du professeur) n'est plus
          disponible pour un enfant archivé — l'historique de présences, la comptabilité et
          la situation scolaire restent consultables ci-dessous.
        </p>
      )}

      <div className="fiche-tab-content">
        {activeTab === 'overview' && openChildDashboard && (
          <ChildDetailCard child={openChildDashboard} showName={false} onRefresh={load} onNavigate={setActiveTab} />
        )}
        {activeTab === 'subjects' && openChildDashboard && (
          <ChildSubjectsPanel
            studentId={openStudent.id}
            groups={openChildDashboard.groups}
            upcomingSessions={openChildDashboard.upcomingSessions}
            cancelledOrPostponedSessions={openChildDashboard.cancelledOrPostponedSessions}
            pendingAssignments={pendingAssignments.filter((p) => p.studentId === openStudent.id)}
            onRefresh={load}
          />
        )}
        {activeTab === 'attendance' && <ChildAttendancePanel studentId={openStudent.id} />}
        {activeTab === 'accounting' && <ChildAccountingPanel studentId={openStudent.id} />}
        {activeTab === 'situation' && <ChildSituationPanel studentId={openStudent.id} />}
      </div>
    </>
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Mes enfants</h1>
          <p>Déclarez vos enfants et suivez leur situation scolaire.</p>
        </div>
        <button type="button" onClick={() => setShowAddChild(true)}>
          Ajouter un enfant
        </button>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {students.length === 0 && (
        <section className="card-section">
          <h2>Mes enfants (0)</h2>
          <EmptyState title="Aucun enfant déclaré pour le moment">
            Cliquez sur « Ajouter un enfant » en haut de la page pour commencer à suivre ses
            inscriptions.
          </EmptyState>
        </section>
      )}

      {/* RM-PAR-022 : niveau 1 ("Mes enfants") masqué s'il n'y a qu'un seul enfant — sa fiche
          s'affiche directement ci-dessous, sans grille de sélection à choix unique. */}
      {students.length > 1 && (
        <section className="card-section">
          <h2>Mes enfants ({students.length})</h2>
          <div className="child-card-grid">
            {students.map((student) => (
              <div key={student.id} className="child-card">
                <div className="child-card-avatar">{initials(student)}</div>
                <p className="child-card-name">
                  {student.firstName} {student.lastName}
                </p>
                <p className="table-hint">
                  {student.currentSchoolSituation?.schoolLevel.name ?? 'Niveau non renseigné'}
                </p>
                <span className={`badge ${student.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>
                  {student.status === 'ACTIVE' ? 'Actif' : 'Archivé'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setOpenChildId(student.id);
                    setActiveTab(student.status === 'ACTIVE' ? 'overview' : 'situation');
                  }}
                >
                  Voir la fiche
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {singleChild && openStudent && (
        <section className="card-section">
          <h2>{openStudentHeading}</h2>
          <p className="table-hint section-spacer">
            {openStudent.currentSchoolSituation
              ? `${openStudent.currentSchoolSituation.schoolLevel.name} · ${openStudent.currentSchoolSituation.school.name}${
                  openStudent.currentSchoolSituation.class ? ` · ${openStudent.currentSchoolSituation.class}` : ''
                }`
              : 'Situation scolaire non renseignée'}
          </p>

          {ficheTabsAndContent}

          <div className="terms-modal-actions">
            {openStudent.status === 'ACTIVE' ? (
              <button type="button" className="ghost" onClick={() => handleArchive(openStudent.id)}>
                Archiver cet enfant
              </button>
            ) : (
              <button type="button" onClick={() => handleReactivate(openStudent.id)}>
                Réactiver cet enfant
              </button>
            )}
          </div>
        </section>
      )}

      {!singleChild && openStudent && (
        <div className="terms-modal-backdrop" onClick={() => setOpenChildId(null)}>
          <div className="terms-modal terms-modal-wide" onClick={(e) => e.stopPropagation()}>
            <h2>{openStudentHeading}</h2>
            <p className="table-hint section-spacer">
              {openStudent.currentSchoolSituation
                ? `${openStudent.currentSchoolSituation.schoolLevel.name} · ${openStudent.currentSchoolSituation.school.name}${
                    openStudent.currentSchoolSituation.class ? ` · ${openStudent.currentSchoolSituation.class}` : ''
                  }`
                : 'Situation scolaire non renseignée'}
            </p>

            {ficheTabsAndContent}

            <div className="terms-modal-actions">
              {openStudent.status === 'ACTIVE' ? (
                <button type="button" className="ghost" onClick={() => handleArchive(openStudent.id)}>
                  Archiver cet enfant
                </button>
              ) : (
                <button type="button" onClick={() => handleReactivate(openStudent.id)}>
                  Réactiver cet enfant
                </button>
              )}
              <button type="button" onClick={() => setOpenChildId(null)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddChild && (
        <div className="terms-modal-backdrop" onClick={() => setShowAddChild(false)}>
          <div className="terms-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Ajouter un enfant</h2>
            <form onSubmit={handleCreateStudent} className="child-form">
              <div className="field-row">
                <label>
                  Prénom
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </label>
                <label>
                  Nom
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      setLastNameEdited(true);
                    }}
                  />
                </label>
              </div>
              <label>
                Date de naissance
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </label>
              <div className="field-row">
                <label>
                  Niveau scolaire
                  <Select value={schoolLevelId} onChange={(e) => setSchoolLevelId(e.target.value)}>
                    <option value="">Sélectionner...</option>
                    {schoolLevels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                  </Select>
                </label>
                <label>
                  Ville de l'établissement
                  <Select
                    searchable
                    searchPlaceholder="Rechercher une ville..."
                    value={schoolCityId}
                    onChange={(e) => setSchoolCityId(e.target.value)}
                  >
                    <option value="">Sélectionner...</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
              <div className="field-row">
                <label>
                  Établissement
                  <Select
                    searchable
                    searchPlaceholder="Rechercher un établissement..."
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                    disabled={!schoolCityId}
                  >
                    <option value="">
                      {schoolCityId ? 'Sélectionner...' : "Choisissez d'abord une ville"}
                    </option>
                    {schoolsInCity.map((school) => (
                      <option key={school.id} value={school.id}>
                        {formatSchoolOption(school)}
                      </option>
                    ))}
                  </Select>
                  {schoolCityId && schoolsInCity.length === 0 && (
                    <span className="table-hint">
                      Aucun établissement référencé dans cette ville — vous pouvez en demander l'ajout
                      depuis « Établissements ».
                    </span>
                  )}
                </label>
                <label>
                  Classe (indicatif)
                  <input
                    type="text"
                    value={schoolClass}
                    onChange={(e) => setSchoolClass(e.target.value)}
                  />
                </label>
              </div>
              <div className="terms-modal-actions">
                <button type="submit" disabled={!schoolLevelId || !schoolId}>
                  Ajouter cet enfant
                </button>
                <button type="button" className="ghost" onClick={() => setShowAddChild(false)}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

