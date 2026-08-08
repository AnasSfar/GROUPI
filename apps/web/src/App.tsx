import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmDialog';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { TeacherProfilePage } from './pages/TeacherProfilePage';
import { ParentChildrenPage } from './pages/ParentChildrenPage';
import { StudentSituationPage } from './pages/StudentSituationPage';
import { AdminSchoolSituationsPage } from './pages/AdminSchoolSituationsPage';
import { TeacherGroupsPage } from './pages/TeacherGroupsPage';
import { TeacherAllSessionsPage } from './pages/TeacherAllSessionsPage';
import { ParentGroupSearchPage } from './pages/ParentGroupSearchPage';
import { TeacherSessionsPage } from './pages/TeacherSessionsPage';
import { ParentEnrollmentsPage } from './pages/ParentEnrollmentsPage';
import { TeacherEnrollmentsPage } from './pages/TeacherEnrollmentsPage';
import { ParentPreEnrollmentsPage } from './pages/ParentPreEnrollmentsPage';
import { TeacherPreEnrollmentsPage } from './pages/TeacherPreEnrollmentsPage';
import { TeacherAttendancePage } from './pages/TeacherAttendancePage';
import { TeacherAttendanceOverviewPage } from './pages/TeacherAttendanceOverviewPage';
import { ParentChildAttendancePage } from './pages/ParentChildAttendancePage';
import { AdminAcademicYearsPage } from './pages/AdminAcademicYearsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { TeacherGroupAnnouncementsPage } from './pages/TeacherGroupAnnouncementsPage';
import { TeacherSubscriptionPage } from './pages/TeacherSubscriptionPage';
import { AdminSubscriptionsPage } from './pages/AdminSubscriptionsPage';
import { TeacherAccountingPage } from './pages/TeacherAccountingPage';
import { TeacherSessionPaymentsPage } from './pages/TeacherSessionPaymentsPage';
import { TeacherGroupStudentsPage } from './pages/TeacherGroupStudentsPage';
import { ParentChildAccountingPage } from './pages/ParentChildAccountingPage';
import { TeacherExportsPage } from './pages/TeacherExportsPage';
import { ParentExportsPage } from './pages/ParentExportsPage';
import { AdminExportsPage } from './pages/AdminExportsPage';
import { ParentSchoolRequestsPage } from './pages/ParentSchoolRequestsPage';
import { AdminSchoolRequestsPage } from './pages/AdminSchoolRequestsPage';
import { AccountSettingsPage } from './pages/AccountSettingsPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { AdminInvitationAcceptPage } from './pages/AdminInvitationAcceptPage';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/admin-invitation" element={<AdminInvitationAcceptPage />} />

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
              <Route
                path="/parent/groups"
                element={
                  <ProtectedRoute roles={['PARENT']}>
                    <ParentGroupSearchPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/sessions"
                element={
                  <ProtectedRoute roles={['TEACHER']}>
                    <TeacherAllSessionsPage />
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
        </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;



