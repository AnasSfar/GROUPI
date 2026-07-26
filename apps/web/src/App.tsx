import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
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
import { ParentGroupSearchPage } from './pages/ParentGroupSearchPage';
import { TeacherSessionsPage } from './pages/TeacherSessionsPage';
import { ParentEnrollmentsPage } from './pages/ParentEnrollmentsPage';
import { TeacherEnrollmentsPage } from './pages/TeacherEnrollmentsPage';
import { ParentPreEnrollmentsPage } from './pages/ParentPreEnrollmentsPage';
import { TeacherPreEnrollmentsPage } from './pages/TeacherPreEnrollmentsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
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
              path="/teacher/groups/:groupId/sessions"
              element={
                <ProtectedRoute roles={['TEACHER']}>
                  <TeacherSessionsPage />
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
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
