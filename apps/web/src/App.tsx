import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmDialog';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { LoadingState } from './components/UiState';
import { ThemeToggle } from './components/ThemeToggle';
import { DeepLinkListener } from './components/DeepLinkListener';

// Une seule page est chargée par navigation au lieu des 38 d'un coup dans le bundle initial
// (voir Suspense ci-dessous pour le fallback pendant le chargement du chunk).
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })));
const TeacherProfilePage = lazy(() => import('./pages/TeacherProfilePage').then((m) => ({ default: m.TeacherProfilePage })));
const ParentChildrenPage = lazy(() => import('./pages/ParentChildrenPage').then((m) => ({ default: m.ParentChildrenPage })));
const StudentSituationPage = lazy(() => import('./pages/StudentSituationPage').then((m) => ({ default: m.StudentSituationPage })));
const AdminSchoolSituationsPage = lazy(() => import('./pages/AdminSchoolSituationsPage').then((m) => ({ default: m.AdminSchoolSituationsPage })));
const TeacherGroupsPage = lazy(() => import('./pages/TeacherGroupsPage').then((m) => ({ default: m.TeacherGroupsPage })));
const TeacherAllSessionsPage = lazy(() => import('./pages/TeacherAllSessionsPage').then((m) => ({ default: m.TeacherAllSessionsPage })));
const TeacherSessionsPage = lazy(() => import('./pages/TeacherSessionsPage').then((m) => ({ default: m.TeacherSessionsPage })));
const TeacherStudentsPage = lazy(() => import('./pages/TeacherStudentsPage').then((m) => ({ default: m.TeacherStudentsPage })));
const ParentEnrollmentsPage = lazy(() => import('./pages/ParentEnrollmentsPage').then((m) => ({ default: m.ParentEnrollmentsPage })));
const TeacherEnrollmentsPage = lazy(() => import('./pages/TeacherEnrollmentsPage').then((m) => ({ default: m.TeacherEnrollmentsPage })));
const ParentPreEnrollmentsPage = lazy(() => import('./pages/ParentPreEnrollmentsPage').then((m) => ({ default: m.ParentPreEnrollmentsPage })));
const TeacherPreEnrollmentsPage = lazy(() => import('./pages/TeacherPreEnrollmentsPage').then((m) => ({ default: m.TeacherPreEnrollmentsPage })));
const TeacherAttendancePage = lazy(() => import('./pages/TeacherAttendancePage').then((m) => ({ default: m.TeacherAttendancePage })));
const TeacherAttendanceOverviewPage = lazy(() => import('./pages/TeacherAttendanceOverviewPage').then((m) => ({ default: m.TeacherAttendanceOverviewPage })));
const ParentChildAttendancePage = lazy(() => import('./pages/ParentChildAttendancePage').then((m) => ({ default: m.ParentChildAttendancePage })));
const AdminAcademicYearsPage = lazy(() => import('./pages/AdminAcademicYearsPage').then((m) => ({ default: m.AdminAcademicYearsPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const TeacherGroupAnnouncementsPage = lazy(() => import('./pages/TeacherGroupAnnouncementsPage').then((m) => ({ default: m.TeacherGroupAnnouncementsPage })));
const TeacherSubscriptionPage = lazy(() => import('./pages/TeacherSubscriptionPage').then((m) => ({ default: m.TeacherSubscriptionPage })));
const AdminSubscriptionsPage = lazy(() => import('./pages/AdminSubscriptionsPage').then((m) => ({ default: m.AdminSubscriptionsPage })));
const TeacherAccountingPage = lazy(() => import('./pages/TeacherAccountingPage').then((m) => ({ default: m.TeacherAccountingPage })));
const TeacherSessionPaymentsPage = lazy(() => import('./pages/TeacherSessionPaymentsPage').then((m) => ({ default: m.TeacherSessionPaymentsPage })));
const TeacherGroupStudentsPage = lazy(() => import('./pages/TeacherGroupStudentsPage').then((m) => ({ default: m.TeacherGroupStudentsPage })));
const ParentChildAccountingPage = lazy(() => import('./pages/ParentChildAccountingPage').then((m) => ({ default: m.ParentChildAccountingPage })));
const TeacherExportsPage = lazy(() => import('./pages/TeacherExportsPage').then((m) => ({ default: m.TeacherExportsPage })));
const ParentExportsPage = lazy(() => import('./pages/ParentExportsPage').then((m) => ({ default: m.ParentExportsPage })));
const AdminExportsPage = lazy(() => import('./pages/AdminExportsPage').then((m) => ({ default: m.AdminExportsPage })));
const ParentSchoolRequestsPage = lazy(() => import('./pages/ParentSchoolRequestsPage').then((m) => ({ default: m.ParentSchoolRequestsPage })));
const AdminSchoolRequestsPage = lazy(() => import('./pages/AdminSchoolRequestsPage').then((m) => ({ default: m.AdminSchoolRequestsPage })));
const AdminReferentialsPage = lazy(() => import('./pages/AdminReferentialsPage').then((m) => ({ default: m.AdminReferentialsPage })));
const AccountSettingsPage = lazy(() => import('./pages/AccountSettingsPage').then((m) => ({ default: m.AccountSettingsPage })));
const AdminInvitationAcceptPage = lazy(() => import('./pages/AdminInvitationAcceptPage').then((m) => ({ default: m.AdminInvitationAcceptPage })));
// Avenant 01, Ch. A/B — onboarding par invitation du Professeur / groupes de niveau.
const InvitationAcceptPage = lazy(() => import('./pages/InvitationAcceptPage').then((m) => ({ default: m.InvitationAcceptPage })));
const TeacherInvitationPage = lazy(() => import('./pages/TeacherInvitationPage').then((m) => ({ default: m.TeacherInvitationPage })));
const TeacherLevelPoolsPage = lazy(() => import('./pages/TeacherLevelPoolsPage').then((m) => ({ default: m.TeacherLevelPoolsPage })));

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmProvider>
        <AuthProvider>
          <DeepLinkListener />
          <Suspense fallback={<LoadingState label="Chargement..." />}>
          {/* Bascule de thème flottante — visible sur les pages sans chrome propre (connexion,
              inscription, vérifications...) ; masquée en CSS là où <ThemeToggle> est déjà intégré
              (barre d'espace de travail, nav de la landing). */}
          <ThemeToggle variant="floating" />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/admin-invitation" element={<AdminInvitationAcceptPage />} />
            {/* Avenant 01, Ch. A.3.2 : page publique de consultation/consommation du lien
                d'invitation d'un Professeur — accessible non authentifié (visiteur) ou connecté. */}
            <Route path="/invitation/:token" element={<InvitationAcceptPage />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN']}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/school-situations"
                element={
                  <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN']}>
                    <AdminSchoolSituationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/profile"
                element={
                  <ProtectedRoute roles={['TEACHER']}>
                    <TeacherProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/groups"
                element={
                  <ProtectedRoute roles={['TEACHER']}>
                    <TeacherGroupsPage />
                  </ProtectedRoute>
                }
              />
              {/* Avenant 01, Ch. A/B — onboarding par invitation / salles d'attente (Professeur). */}
              <Route
                path="/teacher/invitation"
                element={
                  <ProtectedRoute roles={['TEACHER']}>
                    <TeacherInvitationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/level-pools"
                element={
                  <ProtectedRoute roles={['TEACHER']}>
                    <TeacherLevelPoolsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/children"
                element={
                  <ProtectedRoute roles={['PARENT']}>
                    <ParentChildrenPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/children/:studentId/situation"
                element={
                  <ProtectedRoute roles={['PARENT']}>
                    <StudentSituationPage />
                  </ProtectedRoute>
                }
              />
              {/* Avenant 01, Ch. D.2/RM-PAR-020 : "/parent/groups" (recherche publique de groupes)
                  est supprimée — le Parent n'initie plus jamais une inscription (Ch. C). */}
              <Route
                path="/teacher/sessions"
                element={
                  <ProtectedRoute roles={['TEACHER']}>
                    <TeacherAllSessionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/students"
                element={
                  <ProtectedRoute roles={['TEACHER']}>
                    <TeacherStudentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/groups/:groupId/sessions"
                element={
                  <ProtectedRoute roles={['TEACHER']}>
                    <TeacherSessionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/groups/:groupId/students"
                element={
                  <ProtectedRoute roles={['TEACHER']}>
                    <TeacherGroupStudentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/groups/:groupId/announcements"
                element={
                  <ProtectedRoute roles={['TEACHER']}>
                    <TeacherGroupAnnouncementsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/enrollments"
                element={
                  <ProtectedRoute roles={['PARENT']}>
                    <ParentEnrollmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/enrollments"
                element={
                  <ProtectedRoute roles={['TEACHER']}>
                    <TeacherEnrollmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/pre-enrollments"
                element={
                  <ProtectedRoute roles={['PARENT']}>
                    <ParentPreEnrollmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/pre-enrollments"
                element={
                  <ProtectedRoute roles={['TEACHER']}>
                    <TeacherPreEnrollmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/sessions/:sessionId/attendance"
                element={
                  <ProtectedRoute roles={['TEACHER']}>
                    <TeacherAttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/sessions/:sessionId/payments"
                element={
                  <ProtectedRoute roles={['TEACHER']}>
                    <TeacherSessionPaymentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/groups/:groupId/attendance"
                element={
                  <ProtectedRoute roles={['TEACHER']}>
                    <TeacherAttendanceOverviewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/children/:studentId/attendance"
                element={
                  <ProtectedRoute roles={['PARENT']}>
                    <ParentChildAttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/academic-years"
                element={
                  <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN']}>
                    <AdminAcademicYearsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/referentials"
                element={
                  <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN']}>
                    <AdminReferentialsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/subscriptions"
                element={
                  <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN']}>
                    <AdminSubscriptionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/subscription"
                element={
                  <ProtectedRoute roles={['TEACHER']}>
                    <TeacherSubscriptionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/accounting"
                element={
                  <ProtectedRoute roles={['TEACHER']}>
                    <TeacherAccountingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/children/:studentId/accounting"
                element={
                  <ProtectedRoute roles={['PARENT']}>
                    <ParentChildAccountingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/exports"
                element={
                  <ProtectedRoute roles={['TEACHER']}>
                    <TeacherExportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/exports"
                element={
                  <ProtectedRoute roles={['PARENT']}>
                    <ParentExportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/exports"
                element={
                  <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN']}>
                    <AdminExportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/school-requests"
                element={
                  <ProtectedRoute roles={['PARENT']}>
                    <ParentSchoolRequestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/school-requests"
                element={
                  <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN']}>
                    <AdminSchoolRequestsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/account" element={<AccountSettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;


