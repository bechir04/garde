import { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useMediaQuery, DRAWER_NAV_QUERY } from '../../hooks/useMediaQuery';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';

export default function AppLayout() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const isDrawerNav = useMediaQuery(DRAWER_NAV_QUERY);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const drawerOpen = isDrawerNav && isSidebarOpen;

  // Close the drawer whenever the page changes or the screen grows back to desktop.
  useEffect(() => { setSidebarOpen(false); }, [pathname, isDrawerNav]);

  // While the drawer is open: freeze the page behind it and let Escape close it.
  useEffect(() => {
    if (!drawerOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSidebarOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  if (loading) return <div className="spinner" style={{ minHeight: '100vh' }} />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

      {drawerOpen && (
        <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar isOpen={drawerOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
