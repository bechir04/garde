import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DisplayProvider } from './contexts/DisplaySettingsContext';
import { ToastProvider } from './contexts/ToastContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AccidentsListPage from './pages/AccidentsListPage';
import AccidentDetailPage from './pages/AccidentDetailPage';
import AccidentFormPage from './pages/AccidentFormPage';
import StatisticsPage from './pages/StatisticsPage';
import InsightsPage from './pages/InsightsPage';
import ImportPage from './pages/ImportPage';
import UsersPage from './pages/UsersPage';
import AuditPage from './pages/AuditPage';
import DisplaySettingsPage from './pages/DisplaySettingsPage';
import ProtectedMapRoute from './components/ProtectedMapRoute';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <DisplayProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/accidents" element={<AccidentsListPage />} />
                <Route path="/accidents/new" element={<AccidentFormPage />} />
                <Route path="/accidents/:id" element={<AccidentDetailPage />} />
                <Route path="/accidents/:id/edit" element={<AccidentFormPage />} />
                <Route path="/statistics" element={<StatisticsPage />} />
                <Route path="/insights" element={<InsightsPage />} />
                <Route path="/import" element={<ImportPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/audit" element={<AuditPage />} />
                <Route path="/map" element={<ProtectedMapRoute />} />
                <Route path="/display-settings" element={<DisplaySettingsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </DisplayProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
