// src/App.jsx — Application Router with Route-Level Code Splitting & Suspense
import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

const PAGE_TITLES = {
  '/': 'Clinical & AI Operations Hub | MediPulse AI',
  '/appointments': 'Appointment Scheduling & Clinical Consultations | MediPulse AI',
  '/patients': 'Patient Directory & Longitudinal Medical Records | MediPulse AI',
  '/doctors': 'Physicians Roster & Consulting Schedules | MediPulse AI',
  '/messages': 'Automated WhatsApp Patient Communications & Triage | MediPulse AI',
  '/calls': 'AI Voice Scheduling & Interactive Reminders | MediPulse AI',
  '/reports': 'Diagnostic Laboratory Reports & Cryptographic Delivery | MediPulse AI',
  '/feedback': 'Patient Satisfaction & Clinical Care Feedback | MediPulse AI',
  '/settings': 'Hospital System Configuration & Audit Logs | MediPulse AI',
  '/login': 'Staff Portal Sign In | MediPulse AI',
  '/reports/view': 'Verified Diagnostic Lab Report Portal | MediPulse AI',
};

function PageTitleManager() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    const title = PAGE_TITLES[pathname] || 'MediPulse AI — Hospital Automation & Clinical Care Platform';
    document.title = title;

    // Trigger Google Analytics pageview on route change if gtag is defined
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_title: title,
        page_location: window.location.href,
        page_path: pathname,
      });
    }
  }, [location]);

  return null;
}

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
          <PageTitleManager />
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
