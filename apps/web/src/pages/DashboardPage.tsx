import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as dashboardApi from '../api/dashboardApi';
import type {
  TeacherDashboard,
  ParentDashboard,
  AdminDashboard,
  GroupOccupancyView,
  DashboardSessionSummary,
} from '../api/dashboardApi';
import { AlertList } from '../components/AlertList';
import { EmptyState, LoadingState } from '../components/UiState';
import { StatGrid } from '../components/StatGrid';
import { ChildDetailCard } from '../components/ChildDetailCard';
import { TeacherWeekCalendar } from '../components/TeacherWeekCalendar';
import { WeekCalendar, addDays, startOfWeek, type WeekCalendarEvent } from '../components/WeekCalendar';
import { formatAmount, formatDateTime, hasSessionStarted } from '../utils/format';
import { readHiddenGroupIds } from '../utils/hiddenGroups';
import {
  IconUsers,
  IconBookOpen,
  IconChildren,
  IconCalendarCheck,
  IconLayers,
  IconSearch,
  IconClipboardCheck,
  IconUserPlus,
  IconCreditCard,
  IconWallet,
  IconDownload,
  IconBell,
} from '../components/icons';

interface DashCard {
  to: string;
  icon: ReactNode;
  title: string;
  description: string;
}

const GROUP_CATEGORY_BADGE: Record<GroupOccupancyView['category'], string> = {
  FULL: 'badge-danger',
  NEARLY_FULL: 'badge-warning',
  NEEDS_STUDENTS: 'badge-info',
  NORMAL: 'badge-success',
  OTHER: 'badge-neutral',
};

const GROUP_CATEGORY_LABEL: Record<GroupOccupancyView['category'], string> = {
  FULL: 'Complet',
  NEARLY_FULL: 'Bientôt complet',
  NEEDS_STUDENTS: 'Places disponibles',
  NORMAL: 'Normal',
  OTHER: '—',
};

function canOpenAttendance(session: DashboardSessionSummary): boolean {
  if (session.status === 'COMPLETED' || session.status === 'LOCKED') return true;
  if (session.status !== 'PLANNED') return false;
  return hasSessionStarted(session.date, session.startTime);
}

function attendanceActionLabel(status: string): string {
  return status === 'PLANNED' ? "Faire l'appel" : "Voir l'appel";
}

function TeacherAccountingPeriodTable({ accounting }: { accounting: TeacherDashboard['accounting'] }) {
  const periods = [
    { key: 'currentMonth' as const, label: 'Mois en cours', icon: <IconCalendarCheck />, tone: 'teal' },
    { key: 'currentQuarter' as const, label: 'Trimestre en cours', icon: <IconLayers />, tone: 'green' },
    { key: 'currentYear' as const, label: "Toute l'année", icon: <IconWallet />, tone: 'amber' },
  ];
  const metrics = [
    {
      key: 'forecastRevenue' as const,
      label: 'CA prévisionnel',
    },
    {
      key: 'realizedRevenue' as const,
      label: 'CA réalisé',
    },
    {
      key: 'collectedRevenue' as const,
      label: 'CA encaissé',
    },
  ];

  return (
    <div className="accounting-period-list">
      {periods.map((period) => (
        <article key={period.key} className={`accounting-period-card tone-${period.tone}`}>
          <div className="accounting-period-title">
            <span className="accounting-period-icon">{period.icon}</span>
            <h3>{period.label}</h3>
          </div>
          <div className="accounting-period-values">
            {metrics.map((metric) => (
              <div key={metric.key} className="accounting-period-value">
                <span>{metric.label}</span>
                <strong>{formatAmount(accounting.periodRevenue[period.key][metric.key])}</strong>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function TeacherDashboardView({
  data,
  onRefresh,
  hiddenGroupIds,
}: {
  data: TeacherDashboard;
  onRefresh: () => void;
  hiddenGroupIds: Set<string>;
}) {
  void onRefresh;
  const removedGroupIds = new Set([
    ...data.groups.filter((g) => g.status === 'ARCHIVED').map((g) => g.id),
    ...hiddenGroupIds,
  ]);
  const visibleGroups = data.groups.filter((g) => !removedGroupIds.has(g.id));
  const visibleTodaysSessions = data.activity.todaysSessions.filter((s) => !removedGroupIds.has(s.group.id));
  return (
    <>
      {data.alerts.length > 0 && (
        <section className="card-section">
          <h2>Alertes</h2>
          <AlertList alerts={data.alerts} />
        </section>
      )}

      {data.profile.pendingAdminValidation && (
        <p className="form-notice" role="status">
          Votre profil (ou une évolution récente) est en attente de validation administrative.
        </p>
      )}

      <TeacherWeekCalendar />

      {visibleTodaysSessions.length > 0 && (
        <section className="card-section">
          <h2>Aujourd'hui</h2>
          <ul className="activity-list">
            {visibleTodaysSessions.map((s) => (
              <li key={s.id} className="activity-item activity-row attendance-shortcut-row">
                <span className="activity-row-dot tone-amber" />
                <p>{s.group.name}</p>
                <span className="activity-row-value">{formatDateTime(s.date, s.startTime)}</span>
                {canOpenAttendance(s) && (
                  <>
                    <Link className="attendance-shortcut" to={`/teacher/sessions/${s.id}/attendance`}>
                      <IconClipboardCheck aria-hidden="true" />
                      {attendanceActionLabel(s.status)}
                    </Link>
                    <Link className="attendance-shortcut" to={`/teacher/sessions/${s.id}/payments`}>
                      <IconCreditCard aria-hidden="true" />
                      Saisir les paiements
                    </Link>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card-section">
        <h2>Comptabilité</h2>
        <TeacherAccountingPeriodTable accounting={data.accounting} />
        <p className="section-link">
          <Link to="/teacher/accounting">Voir tous les indicateurs financiers →</Link>
        </p>
      </section>

      <section className="card-section">
        <h2>Groupes</h2>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Groupe</th>
                <th>Matière / Niveau</th>
                <th>Occupation</th>
                <th>État</th>
              </tr>
            </thead>
            <tbody>
            {visibleGroups.map((g) => (
                <tr key={g.id}>
                  <td data-label="Groupe">{g.name}</td>
                  <td data-label="Matière / Niveau">
                    {g.subject} — {g.schoolLevel}
                  </td>
                  <td data-label="Occupation">
                    {g.activeCount}/{g.capacity}
                  </td>
                  <td data-label="État">
                    <span className={`badge ${GROUP_CATEGORY_BADGE[g.category]}`}>{GROUP_CATEGORY_LABEL[g.category]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card-section">
        <h2>Statistiques</h2>
        {data.statistics.available ? (
          <StatGrid
            tiles={[
              { label: "Taux d'assiduité moyen", value: data.statistics.averageAttendanceRate != null ? `${(data.statistics.averageAttendanceRate * 100).toFixed(1)}%` : '—', icon: <IconClipboardCheck />, tone: 'green' },
              { label: 'CA du mois', value: formatAmount(data.statistics.revenueThisMonth ?? 0), icon: <IconWallet />, tone: 'teal' },
              { label: "CA de l'année", value: formatAmount(data.statistics.revenueThisYear ?? 0), icon: <IconWallet />, tone: 'teal' },
              { label: 'Meilleur mois', value: data.statistics.bestCollectionMonth ?? '—', icon: <IconCalendarCheck />, tone: 'info' },
            ]}
          />
        ) : (
          <p className="form-notice" role="status">
            {data.statistics.message}
          </p>
        )}
      </section>

      {data.preEnrollments.receivedCount > 0 && (
        <section className="card-section">
          <h2>Préinscriptions</h2>
          <StatGrid
            tiles={[
              { label: 'Reçues', value: String(data.preEnrollments.receivedCount), icon: <IconUserPlus />, tone: 'teal' },
              { label: 'En attente de traitement', value: String(data.preEnrollments.pendingCount), icon: <IconUserPlus />, tone: 'amber' },
            ]}
          />
          {data.preEnrollments.mostRequestedSubjects.length > 0 && (
            <p className="table-hint">
              Matières les plus demandées : {data.preEnrollments.mostRequestedSubjects.map((s) => `${s.label} (${s.count})`).join(', ')}
            </p>
          )}
          {data.preEnrollments.mostRequestedLevels.length > 0 && (
            <p className="table-hint">
              Niveaux les plus demandés : {data.preEnrollments.mostRequestedLevels.map((s) => `${s.label} (${s.count})`).join(', ')}
            </p>
          )}
          <p className="section-link">
            <Link to="/teacher/pre-enrollments">Consulter les préinscriptions →</Link>
          </p>
        </section>
      )}
    </>
  );
}

function ParentWeekCalendar({ data }: { data: ParentDashboard }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  const events = useMemo<WeekCalendarEvent[]>(() => {
    const childLabel = (child: ParentDashboard['children'][number]) =>
      data.multipleChildren ? `${child.student.firstName} ${child.student.lastName}` : undefined;
    return data.children.flatMap((child) => [
      ...child.upcomingSessions.map((s) => ({
        id: s.id,
        date: s.date,
        startTime: s.startTime,
        title: s.group.name,
        subtitle: childLabel(child),
        tone: 'accent' as const,
      })),
      ...child.cancelledOrPostponedSessions.map((s) => ({
        id: s.id,
        date: s.date,
        startTime: s.startTime,
        title: s.group.name,
        subtitle: childLabel(child),
        tone: s.status === 'CANCELLED' ? ('danger' as const) : ('warning' as const),
      })),
    ]);
  }, [data]);

  function handleNavigate(direction: 'prev' | 'next' | 'today') {
    if (direction === 'today') {
      setWeekStart(startOfWeek(new Date()));
    } else {
      setWeekStart((w) => addDays(w, direction === 'next' ? 7 : -7));
    }
  }

  const canGoPrev = weekStart.getTime() > startOfWeek(new Date()).getTime();

  return (
    <section className="card-section">
      <h2>Calendrier de la semaine</h2>
      <WeekCalendar events={events} weekStart={weekStart} onNavigate={handleNavigate} canGoPrev={canGoPrev} />
    </section>
  );
}

function ParentDashboardView({ data, onRefresh }: { data: ParentDashboard; onRefresh: () => void }) {
  return (
    <>
      {data.alerts.length > 0 && (
        <section className="card-section">
          <h2>Alertes</h2>
          <AlertList alerts={data.alerts} />
        </section>
      )}
      {data.children.length === 0 && (
        <EmptyState title="Aucun enfant actif déclaré">Ajoutez un enfant pour suivre ses inscriptions, présences et comptes.</EmptyState>
      )}
      {data.children.length > 0 && (
        <StatGrid
          tiles={[
            { label: 'Commentaires non lus', value: String(data.unreadCommentsCount), icon: <IconBell />, tone: 'info' },
            { label: 'Annonces non lues', value: String(data.unreadAnnouncementsCount), icon: <IconBell />, tone: 'info' },
          ]}
        />
      )}
      {data.children.length > 0 && <ParentWeekCalendar data={data} />}
      {data.children.map((child) => (
        <ChildDetailCard key={child.student.id} child={child} showName={data.multipleChildren} onRefresh={onRefresh} />
      ))}
    </>
  );
}

function AdminDashboardView({ data }: { data: AdminDashboard }) {
  return (
    <>
      {data.alerts.length > 0 && (
        <section className="card-section">
          <h2>Alertes</h2>
          <AlertList alerts={data.alerts} />
        </section>
      )}
      <section className="card-section">
        <h2>Vue d'ensemble</h2>
        <StatGrid
          tiles={[
            { label: 'Professeurs actifs', value: String(data.overview.activeTeacherCount), icon: <IconBookOpen />, tone: 'teal' },
            { label: 'Parents actifs', value: String(data.overview.activeParentCount), icon: <IconChildren />, tone: 'teal' },
            { label: 'Groupes actifs', value: String(data.overview.activeGroupCount), icon: <IconLayers />, tone: 'info' },
            { label: 'Élèves actifs', value: String(data.overview.activeStudentCount), icon: <IconUsers />, tone: 'info' },
            { label: 'Inscriptions actives', value: String(data.overview.activeEnrollmentCount), icon: <IconClipboardCheck />, tone: 'green' },
            ...(data.totalAdminsCount !== undefined ? [{ label: 'Administrateurs', value: String(data.totalAdminsCount), icon: <IconUsers />, tone: 'info' as const }] : []),
          ]}
        />
      </section>

      <section className="card-section">
        <h2>Référentiels</h2>
        <StatGrid
          tiles={[
            { label: 'Matières actives', value: String(data.referentials.subjectCount), icon: <IconBookOpen />, tone: 'teal' },
            { label: 'Niveaux actifs', value: String(data.referentials.schoolLevelCount), icon: <IconLayers />, tone: 'teal' },
            { label: 'Établissements actifs', value: String(data.referentials.schoolCount), icon: <IconSearch />, tone: 'teal' },
            { label: 'Années académiques ouvertes', value: String(data.referentials.openAcademicYearCount), icon: <IconCalendarCheck />, tone: 'teal' },
          ]}
        />
      </section>

      {data.pendingAccountValidations && (
        <section className="card-section">
          <h2>Comptes en attente de validation</h2>
          {data.pendingAccountValidations.length === 0 ? (
            <EmptyState title="Aucun compte en attente">La file de validation est vide.</EmptyState>
          ) : (
            <ul className="activity-list">
              {data.pendingAccountValidations.map((u) => (
                <li key={u.id} className="activity-item activity-row">
                  <span className="activity-row-dot tone-amber" />
                  <p>{u.email ?? '—'}</p>
                  <span className="activity-row-value">{u.roles.join(', ')}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="section-link">
            <Link to="/admin/users">Gérer les comptes →</Link>
          </p>
        </section>
      )}

      {data.pendingSchoolSituations && (
        <section className="card-section">
          <h2>Situations scolaires en attente</h2>
          <StatGrid
            tiles={[
              { label: 'En attente', value: String(data.pendingSchoolSituations.length), icon: <IconCalendarCheck />, tone: 'amber' },
            ]}
          />
          <p className="section-link">
            <Link to="/admin/school-situations">Traiter les demandes →</Link>
          </p>
        </section>
      )}

      {data.subscriptions && (
        <section className="card-section">
          <h2>Abonnements</h2>
          <StatGrid
            tiles={[
              { label: 'En attente de paiement', value: String(data.subscriptions.pendingPaymentCount), icon: <IconCreditCard />, tone: 'amber' },
              { label: 'Actifs', value: String(data.subscriptions.activeCount), icon: <IconCreditCard />, tone: 'green' },
              { label: 'Suspendus', value: String(data.subscriptions.suspendedCount), icon: <IconCreditCard />, tone: 'red' },
              { label: 'Expirés', value: String(data.subscriptions.expiredCount), icon: <IconCreditCard />, tone: 'red' },
            ]}
          />
          <p className="section-link">
            <Link to="/admin/subscriptions">Gérer les abonnements →</Link>
          </p>
        </section>
      )}

      {data.auditLog && (
        <section className="card-section">
          <h2>Journal d'audit</h2>
          <StatGrid
            tiles={[
              { label: "Total d'entrées", value: String(data.auditLog.totalCount), icon: <IconClipboardCheck />, tone: 'info' },
            ]}
          />
          <ul className="activity-list">
            {data.auditLog.recent.slice(0, 10).map((a) => (
              <li key={a.id} className="activity-item">
                <div className="activity-item-header">
                  <strong>{a.action}</strong>
                  <span className="activity-item-date">{new Date(a.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
                <p>
                  {a.targetType} — {a.targetId}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

export function DashboardPage() {
  const { currentUser, getAccessToken } = useAuth();
  const [showDebug, setShowDebug] = useState(false);

  const isSuperAdmin = currentUser?.roles.includes('SUPER_ADMIN') ?? false;
  const isAdmin = isSuperAdmin || (currentUser?.roles.includes('ADMIN') ?? false);
  const isTeacher = currentUser?.roles.includes('TEACHER') ?? false;
  const isParent = currentUser?.roles.includes('PARENT') ?? false;
  const hiddenGroupIds = useMemo(() => readHiddenGroupIds(currentUser?.id), [currentUser?.id]);

  const [teacherDashboard, setTeacherDashboard] = useState<TeacherDashboard | null>(null);
  const [parentDashboard, setParentDashboard] = useState<ParentDashboard | null>(null);
  const [adminDashboard, setAdminDashboard] = useState<AdminDashboard | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoadingDashboard(true);
    setDashboardError(null);
    try {
      if (isTeacher) setTeacherDashboard(await dashboardApi.getTeacherDashboard(token));
      if (isParent) setParentDashboard(await dashboardApi.getParentDashboard(token));
      if (isSuperAdmin) setAdminDashboard(await dashboardApi.getSuperAdminDashboard(token));
      else if (isAdmin) setAdminDashboard(await dashboardApi.getAdminDashboard(token));
    } catch (err) {
      setDashboardError(err instanceof ApiError ? err.message : 'Impossible de charger le tableau de bord.');
    } finally {
      setLoadingDashboard(false);
    }
  }, [getAccessToken, isTeacher, isParent, isAdmin, isSuperAdmin]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const cards: DashCard[] = [
    ...(isAdmin
      ? [
          {
            to: '/admin/users',
            icon: <IconUsers />,
            title: 'Comptes utilisateurs',
            description: 'Valider, suspendre ou désactiver des comptes Professeur et Parent.',
          },
          {
            to: '/admin/school-situations',
            icon: <IconCalendarCheck />,
            title: 'Situations scolaires',
            description: "Valider les changements d'établissement, redoublements et réorientations.",
          },
          {
            to: '/admin/academic-years',
            icon: <IconCalendarCheck />,
            title: 'Années académiques',
            description: 'Consulter et créer les années académiques (référentiel partagé).',
          },
          {
            to: '/admin/subscriptions',
            icon: <IconCreditCard />,
            title: 'Abonnements Professeur',
            description: 'Valider les paiements, suspendre ou réactiver un abonnement.',
          },
          {
            to: '/admin/exports',
            icon: <IconDownload />,
            title: 'Exports et RGPD',
            description: 'Statistiques agrégées, journal des exports et demandes de portabilité RGPD.',
          },
        ]
      : []),
    ...(isTeacher
      ? [
          {
            to: '/teacher/profile',
            icon: <IconBookOpen />,
            title: 'Mon profil professeur',
            description: 'Matières, niveaux enseignés et score de complétude.',
          },
          {
            to: '/teacher/groups',
            icon: <IconLayers />,
            title: 'Mes groupes',
            description: 'Créer et gérer vos groupes, plannings et lieux d’enseignement.',
          },
          {
            to: '/teacher/enrollments',
            icon: <IconClipboardCheck />,
            title: "Demandes d'inscription",
            description: 'Accepter, refuser et gérer les inscriptions de vos groupes.',
          },
          {
            to: '/teacher/pre-enrollments',
            icon: <IconUserPlus />,
            title: 'Préinscriptions',
            description: "Consulter les manifestations d'intérêt et proposer un groupe.",
          },
          {
            to: '/teacher/subscription',
            icon: <IconCreditCard />,
            title: 'Mon abonnement',
            description: 'Offres GROUPI, souscription et historique de vos abonnements.',
          },
          {
            to: '/teacher/accounting',
            icon: <IconWallet />,
            title: 'Comptabilité',
            description: 'Chiffre d’affaires, comptes débiteurs/créditeurs et indicateurs financiers.',
          },
          {
            to: '/teacher/exports',
            icon: <IconDownload />,
            title: 'Exporter mes données',
            description: 'Groupes, élèves, présences, comptabilité et statistiques en PDF, Excel ou CSV.',
          },
        ]
      : []),
    ...(isParent
      ? [
          {
            to: '/parent/children',
            icon: <IconChildren />,
            title: 'Mes enfants',
            description: 'Déclarer vos enfants et suivre leur situation scolaire.',
          },
          {
            to: '/parent/groups',
            icon: <IconSearch />,
            title: 'Rechercher un groupe',
            description: 'Trouver un groupe par matière, niveau ou ville.',
          },
          {
            to: '/parent/enrollments',
            icon: <IconClipboardCheck />,
            title: "Mes demandes d'inscription",
            description: "Suivre l'état de vos demandes d'inscription en cours.",
          },
          {
            to: '/parent/pre-enrollments',
            icon: <IconUserPlus />,
            title: 'Mes préinscriptions',
            description: 'Manifester votre intérêt pour la prochaine année académique.',
          },
          {
            to: '/parent/exports',
            icon: <IconDownload />,
            title: 'Exporter les données de mes enfants',
            description: 'Présences, commentaires pédagogiques, comptabilité et paiements en PDF.',
          },
        ]
      : []),
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Tableau de bord</h1>
          <p>
            Connecté en tant que <strong>{currentUser?.email ?? currentUser?.phone}</strong>
          </p>
        </div>
      </div>

      {currentUser?.status === 'PENDING_VALIDATION' && (
        <p className="form-notice" role="status">
          Ce compte est en attente de validation par un administrateur.
        </p>
      )}

      {dashboardError && (
        <p className="form-error" role="alert">
          {dashboardError}
        </p>
      )}

      {loadingDashboard && <LoadingState label="Chargement du tableau de bord..." />}

      {!loadingDashboard && isTeacher && teacherDashboard && (
        <TeacherDashboardView data={teacherDashboard} onRefresh={loadDashboard} hiddenGroupIds={hiddenGroupIds} />
      )}
      {!loadingDashboard && isParent && parentDashboard && (
        <ParentDashboardView data={parentDashboard} onRefresh={loadDashboard} />
      )}
      {!loadingDashboard && isAdmin && adminDashboard && <AdminDashboardView data={adminDashboard} />}

      <section className="card-section">
        <h2>Accès rapide</h2>
        {cards.length > 0 ? (
          <div className="card-grid">
            {cards.map((card) => (
              <Link key={card.to} to={card.to} className="dash-card">
                <span className="dash-card-icon">{card.icon}</span>
                <h2>{card.title}</h2>
                <p>{card.description}</p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="Aucune action disponible">Votre rôle actuel ne donne accès à aucun raccourci.</EmptyState>
        )}
      </section>

      <p className="debug-toggle">
        <button type="button" className="ghost-link" onClick={() => setShowDebug((v) => !v)}>
          {showDebug ? 'Masquer' : 'Afficher'} les informations du compte
        </button>
      </p>
      {showDebug && <pre className="debug-panel">{JSON.stringify(currentUser, null, 2)}</pre>}
    </>
  );
}


