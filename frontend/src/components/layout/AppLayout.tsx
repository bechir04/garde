import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';

export default function AppLayout() {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return <div className="spinner" style={{ minHeight: '100vh' }} />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
      
      {isSidebarOpen && (
        <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
