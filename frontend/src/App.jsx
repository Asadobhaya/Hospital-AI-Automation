// src/App.jsx — Application Router with Route-Level Code Splitting & Suspense
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { PageSkeleton } from './components/Skeletons';

// Lazy-loaded routes for optimal Core Web Vitals & initial bundle size
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Patients = lazy(() => import('./pages/Patients'));
const Doctors = lazy(() => import('./pages/Doctors'));
const Messages = lazy(() => import('./pages/Messages'));
const Calls = lazy(() => import('./pages/Calls'));
const Reports = lazy(() => import('./pages/Reports'));
const Feedback = lazy(() => import('./pages/Feedback'));
const Settings = lazy(() => import('./pages/Settings'));
const PublicReportView = lazy(() => import('./pages/PublicReportView'));

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen bg-[#F5F8FC] flex items-center justify-center p-4"
        role="status"
        aria-label="Checking authentication session"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#2F78C8] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#617181] font-medium">Restoring secure session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="p-6"><PageSkeleton /></div>}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/reports/view" element={<PublicReportView />} />

              {/* Protected Clinical Operations */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="patients" element={<Patients />} />
                <Route path="doctors" element={<Doctors />} />
                <Route path="messages" element={<Messages />} />
                <Route path="calls" element={<Calls />} />
                <Route path="reports" element={<Reports />} />
                <Route path="feedback" element={<Feedback />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
