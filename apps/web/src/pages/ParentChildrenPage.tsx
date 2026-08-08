import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Select } from '../components/Select';
import { ChildDetailCard } from '../components/ChildDetailCard';
import { ChildAttendancePanel } from '../components/ChildAttendancePanel';
import { ChildAccountingPanel } from '../components/ChildAccountingPanel';
import { ChildSituationPanel } from '../components/ChildSituationPanel';
import { EmptyState } from '../components/UiState';
import { ApiError } from '../api/client';
import * as referentialsApi from '../api/referentialsApi';
import * as parentProfileApi from '../api/parentProfileApi';
import * as dashboardApi from '../api/dashboardApi';
import type { City, School, SchoolLevel } from '../api/referentialsApi';
import type { ParentProfile, Student } from '../api/parentProfileApi';
import type { ParentDashboard } from '../api/dashboardApi';

type FicheTab = 'overview' | 'attendance' | 'accounting' | 'situation';

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
  const [openChildId, setOpenChildId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FicheTab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
      const [me, myStudents, levels, allSchools, allCities, parentDashboard] = await Promise.all([
        parentProfileApi.getMyProfile(token),
        parentProfileApi.listStudents(token),
        referentialsApi.listSchoolLevels(token),
        referentialsApi.listSchools(token),
        referentialsApi.listCities(token),
        dashboardApi.getParentDashboard(token),
      ]);
      setProfile(me);
      setStudents(myStudents);
      setSchoolLevels(levels);
      setSchools(allSchools);
      setCities(allCities);
      setDashboard(parentDashboard);
      setPhone(me.phone);
      setCity(me.city);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger le profil.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

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

  async function handleSaveProfile() {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    try {
      const updated = await parentProfileApi.updateMyProfile(token, { phone, city });
      setProfile(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de mettre à jour le profil.');
    }
  }

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
      setDateOfBirth('');
      setSchoolLevelId('');
      setSchoolCityId('');
      setSchoolId('');
      setSchoolClass('');
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

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Mes enfants</h1>
          <p>Déclarez vos enfants et suivez leur situation scolaire.</p>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {!profile.validatedAt && (
        <p className="form-notice" role="status">
          Votre compte est en attente de validation par un administrateur. Vous pouvez déjà
          déclarer vos enfants en attendant.
        </p>
      )}

      <section className="card-section">
        <h2>Mes coordonnées</h2>
        <label>
          Téléphone
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label>
          Ville
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} />
        </label>
        <button type="button" onClick={handleSaveProfile}>
          Enregistrer
        </button>
      </section>

      <section className="card-section">
        <h2>Mes enfants ({students.length})</h2>
        {students.length === 0 && (
          <EmptyState title="Aucun enfant déclaré pour le moment">
            Déclarez votre premier enfant ci-dessous pour commencer à suivre ses inscriptions.
          </EmptyState>
        )}
        {students.length > 0 && (
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
        )}
      </section>

      {openStudent && (
        <div className="terms-modal-backdrop" onClick={() => setOpenChildId(null)}>
          <div className="terms-modal terms-modal-wide" onClick={(e) => e.stopPropagation()}>
            <h2>
              {openStudent.firstName} {openStudent.lastName}
            </h2>
            <p className="table-hint section-spacer">
              {openStudent.currentSchoolSituation
                ? `${openStudent.currentSchoolSituation.schoolLevel.name} · ${openStudent.currentSchoolSituation.school.name}${
                    openStudent.currentSchoolSituation.class ? ` · ${openStudent.currentSchoolSituation.class}` : ''
                  }`
                : 'Situation scolaire non renseignée'}
            </p>

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
              {activeTab === 'attendance' && <ChildAttendancePanel studentId={openStudent.id} />}
              {activeTab === 'accounting' && <ChildAccountingPanel studentId={openStudent.id} />}
              {activeTab === 'situation' && <ChildSituationPanel studentId={openStudent.id} />}
            </div>

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

      <section className="card-section">
        <h2>Ajouter un enfant</h2>
        <form onSubmit={handleCreateStudent}>
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
                onChange={(e) => setLastName(e.target.value)}
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
            <Select value={schoolCityId} onChange={(e) => setSchoolCityId(e.target.value)}>
              <option value="">Sélectionner...</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Établissement
            <Select
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
          <button type="submit" disabled={!schoolLevelId || !schoolId}>
            Ajouter cet enfant
          </button>
        </form>
      </section>
    </>
  );
}


