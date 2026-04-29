import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DebatePage = lazy(() => import('./pages/DebatePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const DebatesListPage = lazy(() => import('./pages/DebatesListPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PublicDebatePage = lazy(() => import('./pages/PublicDebatePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const InstructorDashboard = lazy(() => import('./pages/InstructorDashboard'));
const InstructorCreateDebate = lazy(() => import('./pages/InstructorCreateDebate'));
const InstructorManageDebate = lazy(() => import('./pages/InstructorManageDebate'));
const SearchPage = lazy(() => import('./pages/SearchPage'));

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function RequireRole({ roles, children, fallback = '/dashboard' }) {
  const token = localStorage.getItem('token');
  const user = getCurrentUser();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={fallback} replace />;
  return children;
}

export default function AppRoutes({ mode, onToggleMode, fontScale, onFontScaleChange }) {
  return (
    <Suspense
      fallback={
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      }
    >
      <Routes>
        <Route
          path="/"
          element={
            <LandingPage
              mode={mode}
              onToggleMode={onToggleMode}
              fontScale={fontScale}
              onFontScaleChange={onFontScaleChange}
            />
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="*" element={<NotFoundPage />} />

        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<RequireRole roles={['admin']} fallback="/dashboard"><AdminDashboard /></RequireRole>} />

        <Route path="/debates" element={<RequireAuth><DebatesListPage /></RequireAuth>} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/contact" element={<ContactPage />} />

        <Route path="/debate/:joincode" element={<RequireAuth><DebatePage /></RequireAuth>} />
        <Route path="/public/debate/:joincode" element={<PublicDebatePage />} />

        <Route path="/instructor/dashboard" element={<RequireRole roles={['instructor', 'admin']} fallback="/dashboard"><InstructorDashboard /></RequireRole>} />
        <Route path="/instructor/create-debate" element={<RequireRole roles={['instructor', 'admin']} fallback="/dashboard"><InstructorCreateDebate /></RequireRole>} />
        <Route path="/instructor/debate/:joincode/manage" element={<RequireRole roles={['instructor', 'admin']} fallback="/dashboard"><InstructorManageDebate /></RequireRole>} />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/search" element={<RequireAuth><SearchPage /></RequireAuth>} />
      </Routes>
    </Suspense>
  );
}
