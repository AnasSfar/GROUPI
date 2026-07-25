import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
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
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN']}>
                <AdminUsersPage />
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
            path="/admin/school-situations"
            element={
              <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN']}>
                <AdminSchoolSituationsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
