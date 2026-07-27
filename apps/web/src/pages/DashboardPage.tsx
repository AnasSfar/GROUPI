import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import * as dashboardApi from '../api/dashboardApi';
import * as absenceNoticeApi from '../api/absenceNoticeApi';
import type {
  TeacherDashboard,
  ParentDashboard,
  ParentChildDashboard,
  AdminDashboard,
  GroupOccupancyView,
} from '../api/dashboardApi';
import { AlertList } from '../components/AlertList';
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
} from '../components/icons';

interface DashCard {
  to: string;
  icon: ReactNode;
  title: string;
  description: string;
}

function formatAmount(n: number): string {
  return `${n.toFixed(3)} TND`;
}

function formatDateTime(date: string, startTime: string): string {
  return `${new Date(date).toLocaleDateString('fr-FR')} à ${startTime}`;
}

interface StatTile {
  label: string;
  value: string;
}

function StatGrid({ tiles }: { tiles: StatTile[] }) {
  return (
    <div className="card-grid stat-grid">
      {tiles.map((tile) => (
        <div key={tile.label} className="card-section stat-tile">
          <p className="table-hint">{tile.label}</p>
          <p className="stat-value">{tile.value}</p>
        </div>
      ))}
    </div>
  );
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

function TeacherDashboardView({ data, onRefresh }: { data: TeacherDashboard; onRefresh: () => void }) {
  void onRefresh;
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

      <section className="card-section">
        <h2>Activité</h2>
        <StatGrid
          tiles={[
            { label: 'Groupes actifs', value: String(data.activity.activeGroupsCount) },
            { label: 'Élèves inscrits', value: String(data.activity.totalActiveStudents) },
            { label: "Séances aujourd'hui", value: String(data.activity.todaysSessions.length) },
            { label: "Demandes d'inscription en attente", value: String(data.activity.pendingEnrollmentsCount) },
            { label: 'Changements de groupe en attente', value: String(data.activity.pendingGroupChangesCount) },
          ]}
        />
        {data.activity.upcomingSessions.length > 0 && (
          <>
            <p className="table-hint" style={{ marginTop: 12 }}>
              Prochaines séances
            </p>
            <ul className="activity-list">
              {data.activity.upcomingSessions.slice(0, 5).map((s) => (
                <li key={s.id} className="activity-item">
                  <p>
                    {s.group.name} — {formatDateTime(s.date, s.startTime)}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="card-section">
        <h2>Présences</h2>
        <StatGrid
          tiles={[
            { label: "Absences aujourd'hui", value: String(data.presences.absencesToday) },
            { label: "Retards aujourd'hui", value: String(data.presences.latesToday) },
            { label: "Élèves à risque d'abandon", value: String(data.presences.abandonmentAlerts.length) },
          ]}
        />
        {data.presences.abandonmentAlerts.length > 0 && (
          <div className="alert-banner">
            <h3>Alertes d'abandon</h3>
            <ul>
              {data.presences.abandonmentAlerts.map((a) => (
                <li key={a.enrollmentId}>
                  {a.student.firstName} {a.student.lastName} ({a.groupName}) — {a.consecutiveUnexcusedAbsences} absences
                  consécutives
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="card-section">
        <h2>Comptabilité</h2>
        <StatGrid
          tiles={[
            { label: 'CA prévisionnel', value: formatAmount(data.accounting.forecastRevenue) },
            { label: 'CA réalisé', value: formatAmount(data.accounting.realizedRevenue) },
            { label: 'CA encaissé', value: formatAmount(data.accounting.collectedRevenue) },
            { label: 'Restant à encaisser', value: formatAmount(data.accounting.receivableRevenue) },
            { label: 'Comptes débiteurs', value: String(data.accounting.debtorAccountCount) },
            { label: 'Comptes créditeurs', value: String(data.accounting.creditorAccountCount) },
          ]}
        />
        <p className="table-hint" style={{ marginTop: 8 }}>
          <Link to="/teacher/accounting">Voir tous les indicateurs financiers →</Link>
        </p>
      </section>

      <section className="card-section">
        <h2>Paiements</h2>
        {data.payments.debtorAccounts.length === 0 ? (
          <p className="table-hint">Aucun compte en solde négatif.</p>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Élève</th>
                  <th>Groupe</th>
                  <th>Solde</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.debtorAccounts.map((d) => (
                  <tr key={d.account.id}>
                    <td>
                      {d.account.student.firstName} {d.account.student.lastName}
                    </td>
                    <td>{d.account.group.name}</td>
                    <td>
                      <span className={`badge ${d.alert ? 'badge-danger' : 'badge-warning'}`}>{formatAmount(d.balance)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data.payments.recentPayments.length > 0 && (
          <>
            <p className="table-hint" style={{ marginTop: 12 }}>
              Derniers paiements enregistrés
            </p>
            <ul className="activity-list">
              {data.payments.recentPayments.slice(0, 5).map((p) => (
                <li key={p.id} className="activity-item">
                  <p>
                    {p.account.student.firstName} {p.account.student.lastName} ({p.account.group.name}) —{' '}
                    {formatAmount(p.amount)} le {new Date(p.effectiveDate).toLocaleDateString('fr-FR')}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
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
              {data.groups.map((g) => (
                <tr key={g.id}>
                  <td>{g.name}</td>
                  <td>
                    {g.subject} — {g.schoolLevel}
                  </td>
                  <td>
                    {g.activeCount}/{g.capacity}
                  </td>
                  <td>
                    <span className={`badge ${GROUP_CATEGORY_BADGE[g.category]}`}>{GROUP_CATEGORY_LABEL[g.category]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card-section">
        <h2>Profil</h2>
        <StatGrid tiles={[{ label: 'Complétude du profil', value: `${data.profile.completenessScore}%` }]} />
        {data.profile.missingFields.length > 0 && (
          <p className="table-hint">À compléter : {data.profile.missingFields.join(', ')}</p>
        )}
      </section>

      <section className="card-section">
        <h2>Statistiques</h2>
        {data.statistics.available ? (
          <StatGrid
            tiles={[
              { label: "Taux d'assiduité moyen", value: data.statistics.averageAttendanceRate != null ? `${(data.statistics.averageAttendanceRate * 100).toFixed(1)}%` : '—' },
              { label: 'CA du mois', value: formatAmount(data.statistics.revenueThisMonth ?? 0) },
              { label: "CA de l'année", value: formatAmount(data.statistics.revenueThisYear ?? 0) },
              { label: 'Meilleur mois', value: data.statistics.bestCollectionMonth ?? '—' },
            ]}
          />
        ) : (
          <p className="form-notice" role="status">
            {data.statistics.message}
          </p>
        )}
      </section>

      <section className="card-section">
        <h2>Préinscriptions</h2>
        <StatGrid
          tiles={[
            { label: 'Reçues', value: String(data.preEnrollments.receivedCount) },
            { label: 'En attente de traitement', value: String(data.preEnrollments.pendingCount) },
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
        <p className="table-hint" style={{ marginTop: 8 }}>
          <Link to="/teacher/pre-enrollments">Consulter les préinscriptions →</Link>
        </p>
      </section>

      <section className="card-section">
        <h2>Export</h2>
        {data.export.available ? (
          <button type="button" disabled title="Export PDF/Excel — module en cours de livraison (Ch.17)">
            Exporter le tableau de bord
          </button>
        ) : (
          <p className="table-hint">{data.export.message}</p>
        )}
      </section>
    </>
  );
}

function AbsenceNoticeButton({
  sessionId,
  studentId,
  onReported,
}: {
  sessionId: string;
  studentId: string;
  onReported: () => void;
}) {
  const { getAccessToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const token = getAccessToken();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await absenceNoticeApi.createAbsenceNotice(token, sessionId, {
        studentId,
        reason: reason || undefined,
        comment: comment || undefined,
      });
      setOpen(false);
      onReported();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Signalement impossible.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="ghost" onClick={() => setOpen(true)}>
        Signaler une absence
      </button>
    );
  }

  return (
    <span className="add-row">
      <input placeholder="Motif (optionnel)" value={reason} onChange={(e) => setReason(e.target.value)} />
      <input placeholder="Commentaire (optionnel)" value={comment} onChange={(e) => setComment(e.target.value)} />
      <button type="button" onClick={submit} disabled={saving}>
        Confirmer
      </button>
      <button type="button" className="ghost" onClick={() => setOpen(false)}>
        Annuler
      </button>
      {error && <span className="form-error">{error}</span>}
    </span>
  );
}

function ChildDashboardCard({
  child,
  showName,
  onRefresh,
}: {
  child: ParentChildDashboard;
  showName: boolean;
  onRefresh: () => void;
}) {
  return (
    <section className="card-section">
      {showName && (
        <h2>
          {child.student.firstName} {child.student.lastName}
        </h2>
      )}
      <StatGrid
        tiles={[
          { label: 'Groupes suivis', value: String(child.groups.length) },
          { label: 'Solde global', value: formatAmount(child.globalBalance) },
          { label: "Taux d'assiduité", value: child.attendanceSummary.attendanceRate != null ? `${(child.attendanceSummary.attendanceRate * 100).toFixed(1)}%` : '—' },
        ]}
      />

      <p className="table-hint" style={{ marginTop: 12 }}>
        Groupes suivis
      </p>
      <ul className="tag-list">
        {child.groups.map((g) => (
          <li key={g.enrollmentId} className="tag">
            {g.group.name} — {g.group.subject} ({g.group.teacher.firstName} {g.group.teacher.lastName})
          </li>
        ))}
      </ul>

      {child.upcomingSessions.length > 0 && (
        <>
          <p className="table-hint" style={{ marginTop: 12 }}>
            Prochaines séances
          </p>
          <ul className="activity-list">
            {child.upcomingSessions.slice(0, 5).map((s) => (
              <li key={s.id} className="activity-item">
                <div className="activity-item-header">
                  <span>
                    {s.group.name} — {formatDateTime(s.date, s.startTime)}
                  </span>
                </div>
                <p>
                  {s.absenceReported ? (
                    <span className="badge badge-info">Absence signalée</span>
                  ) : s.canReportAbsence ? (
                    <AbsenceNoticeButton sessionId={s.id} studentId={child.student.id} onReported={onRefresh} />
                  ) : (
                    <span className="table-hint">Délai de signalement dépassé</span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}

      {child.cancelledOrPostponedSessions.length > 0 && (
        <div className="alert-banner">
          <h3>Modifications de planning</h3>
          <ul>
            {child.cancelledOrPostponedSessions.map((s) => (
              <li key={s.id}>
                {s.group.name} — {formatDateTime(s.date, s.startTime)} ({s.status === 'CANCELLED' ? 'annulée' : 'reportée'})
              </li>
            ))}
          </ul>
        </div>
      )}

      {child.recentComments.length > 0 && (
        <>
          <p className="table-hint" style={{ marginTop: 12 }}>
            Derniers commentaires pédagogiques
          </p>
          <ul className="activity-list">
            {child.recentComments.map((c) => (
              <li key={c.id} className="activity-item">
                <div className="activity-item-header">
                  <strong>{c.groupName}</strong>
                  <span className="activity-item-date">{new Date(c.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
                <p>{c.body}</p>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="table-hint" style={{ marginTop: 12 }}>
        <Link to={`/parent/children/${child.student.id}/attendance`}>Présences détaillées</Link>
        {' · '}
        <Link to={`/parent/children/${child.student.id}/accounting`}>Comptabilité détaillée</Link>
      </p>
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
      {data.children.length === 0 && <p>Aucun enfant actif déclaré pour le moment.</p>}
      {data.children.map((child) => (
        <ChildDashboardCard key={child.student.id} child={child} showName={data.multipleChildren} onRefresh={onRefresh} />
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
            { label: 'Professeurs actifs', value: String(data.overview.activeTeacherCount) },
            { label: 'Parents actifs', value: String(data.overview.activeParentCount) },
            { label: 'Groupes actifs', value: String(data.overview.activeGroupCount) },
            { label: 'Élèves actifs', value: String(data.overview.activeStudentCount) },
            { label: 'Inscriptions actives', value: String(data.overview.activeEnrollmentCount) },
            ...(data.totalAdminsCount !== undefined ? [{ label: 'Administrateurs', value: String(data.totalAdminsCount) }] : []),
          ]}
        />
      </section>

      <section className="card-section">
        <h2>Référentiels</h2>
        <StatGrid
          tiles={[
            { label: 'Matières actives', value: String(data.referentials.subjectCount) },
            { label: 'Niveaux actifs', value: String(data.referentials.schoolLevelCount) },
            { label: 'Établissements actifs', value: String(data.referentials.schoolCount) },
            { label: 'Années académiques ouvertes', value: String(data.referentials.openAcademicYearCount) },
          ]}
        />
      </section>

      {data.pendingAccountValidations && (
        <section className="card-section">
          <h2>Comptes en attente de validation</h2>
          {data.pendingAccountValidations.length === 0 ? (
            <p className="table-hint">Aucun compte en attente.</p>
          ) : (
            <ul className="activity-list">
              {data.pendingAccountValidations.map((u) => (
                <li key={u.id} className="activity-item">
                  <p>
                    {u.email} — {u.roles.join(', ')}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <p className="table-hint" style={{ marginTop: 8 }}>
            <Link to="/admin/users">Gérer les comptes →</Link>
          </p>
        </section>
      )}

      {data.pendingSchoolSituations && (
        <section className="card-section">
          <h2>Situations scolaires en attente</h2>
          <StatGrid tiles={[{ label: 'En attente', value: String(data.pendingSchoolSituations.length) }]} />
          <p className="table-hint" style={{ marginTop: 8 }}>
            <Link to="/admin/school-situations">Traiter les demandes →</Link>
          </p>
        </section>
      )}

      {data.subscriptions && (
        <section className="card-section">
          <h2>Abonnements</h2>
          <StatGrid
            tiles={[
              { label: 'En attente de paiement', value: String(data.subscriptions.pendingPaymentCount) },
              { label: 'Actifs', value: String(data.subscriptions.activeCount) },
              { label: 'Suspendus', value: String(data.subscriptions.suspendedCount) },
              { label: 'Expirés', value: String(data.subscriptions.expiredCount) },
            ]}
          />
          <p className="table-hint" style={{ marginTop: 8 }}>
            <Link to="/admin/subscriptions">Gérer les abonnements →</Link>
          </p>
        </section>
      )}

      {data.auditLog && (
        <section className="card-section">
          <h2>Journal d'audit</h2>
          <StatGrid tiles={[{ label: "Total d'entrées", value: String(data.auditLog.totalCount) }]} />
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
            Connecté en tant que <strong>{currentUser?.email}</strong>
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

      {loadingDashboard && <p>Chargement du tableau de bord...</p>}

      {!loadingDashboard && isTeacher && teacherDashboard && (
        <TeacherDashboardView data={teacherDashboard} onRefresh={loadDashboard} />
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
          <p>Aucune action disponible pour le moment.</p>
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
