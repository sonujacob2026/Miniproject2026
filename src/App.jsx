import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { SupabaseAuthProvider, useSupabaseAuth } from './context/SupabaseAuthContext'
import { ProfileProvider } from './context/ProfileContext'
import { AdminProvider } from './context/AdminContext'
import ToastProvider from './components/ToastProvider'
import SmoothLoader from './components/SmoothLoader'
import LandingPage from './components/LandingPage'
import AuthPage from './components/AuthPage'
import ResetPasswordPage from './components/ResetPasswordPage'
import ForgotPasswordDemo from './components/ForgotPasswordDemo'
import EmailTest from './components/EmailTest'
import SupabaseDebug from './components/SupabaseDebug'
import PasswordResetTest from './components/PasswordResetTest'
import AutoPasswordReset from './components/AutoPasswordReset'
import SimplePasswordReset from './components/SimplePasswordReset'
import EmailPasswordReset from './components/EmailPasswordReset'
import PasswordResetIndex from './components/PasswordResetIndex'
import EmailDiagnostic from './components/EmailDiagnostic'
import URLDebugger from './components/URLDebugger'
import QuickPasswordResetTest from './components/QuickPasswordResetTest'
import HashParameterTest from './components/HashParameterTest'
import Questionnaire from './components/Questionnaire'
import Dashboard from './components/Dashboard'
import UserProfile from './components/UserProfile'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'
import AdminTest from './components/AdminTest'
import AdminDebug from './components/AdminDebug'
import ExpenseCategoriesAdmin from './components/ExpenseCategoriesAdmin'
import SystemSettings from './components/SystemSettings'
import UserStatusChecker from './components/UserStatusChecker'

const AppRoutes = () => {
  const { user, loading } = useSupabaseAuth();

  console.log('AppRoutes: user:', user?.id, 'loading:', loading);

  if (loading) {
    return <SmoothLoader message="Loading your dashboard..." delay={100} />
  }

  return (
    <UserStatusChecker>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/auth"
          element={
            <AuthPage suppressAutoRedirect={true} />
          }
        />

      {/* Dedicated signup route so Landing "Sign Up Free" always opens signup form */}
      <Route
        path="/signup"
        element={
          <AuthPage suppressAutoRedirect={true} initialMode="signup" />
        }
      />
      <Route
        path="/reset-password"
        element={<ResetPasswordPage />}
      />
      <Route
        path="/auth/reset-password"
        element={<ResetPasswordPage />}
      />
      <Route
        path="/auth/callback"
        element={<ResetPasswordPage />}
      />
      <Route
        path="/demo/forgot-password"
        element={<ForgotPasswordDemo />}
      />
      <Route
        path="/test/email"
        element={<EmailTest />}
      />
      <Route
        path="/debug/supabase"
        element={<SupabaseDebug />}
      />
      <Route
        path="/test/password-reset"
        element={<PasswordResetTest />}
      />
      <Route
        path="/auto-password-reset"
        element={<AutoPasswordReset />}
      />
      <Route
        path="/simple-password-reset"
        element={<SimplePasswordReset />}
      />
      <Route
        path="/email-password-reset"
        element={<EmailPasswordReset />}
      />
      <Route
        path="/password-reset-options"
        element={<PasswordResetIndex />}
      />
      <Route
        path="/email-diagnostic"
        element={<EmailDiagnostic />}
      />
      <Route
        path="/url-debug"
        element={<URLDebugger />}
      />
      <Route
        path="/quick-test"
        element={<QuickPasswordResetTest />}
      />
      <Route
        path="/hash-test"
        element={<HashParameterTest />}
      />
      <Route
        path="/questionnaire"
        element={
          user ? (
            user.user_metadata?.onboarding_completed ? (
              <Navigate to="/dashboard" />
            ) : (
              <Questionnaire />
            )
          ) : (
            <Navigate to="/auth" />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          user ? (
            <Dashboard />
          ) : (
            <Navigate to="/auth" />
          )
        }
      />
      <Route
        path="/profile"
        element={
          user ? (
            <UserProfile />
          ) : (
            <Navigate to="/auth" />
          )
        }
      />
      
      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/settings" element={<SystemSettings />} />
      <Route path="/admin/categories" element={<ExpenseCategoriesAdmin />} />
      <Route path="/admin/test" element={<AdminTest />} />
      <Route path="/admin/debug" element={<AdminDebug />} />
      <Route path="/admin" element={<Navigate to="/admin/login" />} />
      </Routes>
    </UserStatusChecker>
  )
}

function App() {
  return (
    <SupabaseAuthProvider>
      <ProfileProvider>
        <AdminProvider>
          <ToastProvider>
            <Router>
              <AppRoutes />
            </Router>
          </ToastProvider>
        </AdminProvider>
      </ProfileProvider>
    </SupabaseAuthProvider>
  )
}

export default App
