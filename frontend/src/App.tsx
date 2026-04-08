import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { DisplayProvider } from './contexts/DisplaySettingsContext';
import { ToastProvider } from './contexts/ToastContext';
import AppLayout from './components/layout/AppLayout';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AccidentsListPage = lazy(() => import('./pages/AccidentsListPage'));
const AccidentDetailPage = lazy(() => import('./pages/AccidentDetailPage'));
const AccidentFormPage = lazy(() => import('./pages/AccidentFormPage'));
const StatisticsPage = lazy(() => import('./pages/StatisticsPage'));
const ChartDetailPage = lazy(() => import('./pages/ChartDetailPage'));
const InsightsPage = lazy(() => import('./pages/InsightsPage'));
const ImportPage = lazy(() => import('./pages/ImportPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const AuditPage = lazy(() => import('./pages/AuditPage'));
const DisplaySettingsPage = lazy(() => import('./pages/DisplaySettingsPage'));
const ProtectedMapRoute = lazy(() => import('./components/ProtectedMapRoute'));

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <DisplayProvider>
          <BrowserRouter>
            <Suspense fallback={null}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/accidents" element={<AccidentsListPage />} />
                <Route path="/accidents/new" element={<AccidentFormPage />} />
                <Route path="/accidents/:id" element={<AccidentDetailPage />} />
                <Route path="/accidents/:id/edit" element={<AccidentFormPage />} />
                <Route path="/statistics" element={<StatisticsPage />} />
                <Route path="/statistics/:chartType" element={<ChartDetailPage />} />
                <Route path="/insights" element={<InsightsPage />} />
                <Route path="/import" element={<ImportPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/audit" element={<AuditPage />} />
                <Route path="/map" element={<ProtectedMapRoute />} />
                <Route path="/display-settings" element={<DisplaySettingsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </DisplayProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
