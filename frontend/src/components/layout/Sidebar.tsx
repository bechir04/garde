import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Car, BarChart3, Upload, Lightbulb, LogOut,
  Users, ClipboardList, X,
} from 'lucide-react';
import logo from '../../assets/garde national.png';

const mainNav = [
  { to: '/', label: 'لوحة القيادة', icon: LayoutDashboard, exact: true },
  { to: '/accidents', label: 'سجل الحوادث', icon: Car, exact: false },
  { to: '/statistics', label: 'الإحصائيات', icon: BarChart3, exact: false },
  { to: '/import', label: 'استيراد البيانات', icon: Upload, exact: false },
  { to: '/insights', label: 'الاستنتاجات', icon: Lightbulb, exact: false },
];

const adminNav = [
  { to: '/users', label: 'المستخدمون', icon: Users, exact: false },
  { to: '/audit', label: 'سجل المراجعة', icon: ClipboardList, exact: false },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'ADMIN';

  const isActive = (to: string, exact: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <>
      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          {/* Close button for mobile */}
          <button 
            className="mobile-nav-toggle" 
            onClick={onClose}
            style={{ position: 'absolute', left: 10, top: 10, color: 'rgba(255,255,255,0.5)', display: 'none' }}
            id="sidebar-close-btn"
          >
            <X size={20} />
          </button>
          <style>{`
            @media (max-width: 768px) {
              #sidebar-close-btn { display: flex !important; }
            }
          `}</style>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <img
              src={logo}
              alt="الحرس الوطني"
              style={{ width: 72, height: 72, objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }}
            />
          </div>
          <h1>الحرس الوطني</h1>
          <p>نظام إدارة حوادث المرور</p>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">القائمة الرئيسية</div>
          {mainNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => window.innerWidth <= 768 && onClose?.()}
              className={`nav-link ${isActive(item.to, item.exact) ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="nav-section-label" style={{ marginTop: 8 }}>الإدارة</div>
              {adminNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => window.innerWidth <= 768 && onClose?.()}
                  className={`nav-link ${isActive(item.to, item.exact) ? 'active' : ''}`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.fullName?.charAt(0) || '؟'}
            </div>
            <div>
              <div className="user-name">{user?.fullName}</div>
              <div className="user-role">
                {user?.role === 'ADMIN' ? 'مدير النظام' :
                 user?.role === 'OFFICER' ? 'ضابط إدخال' : 'مطّلع / محلل'}
              </div>
            </div>
          </div>
          <button className="btn-logout" onClick={() => { logout(); onClose?.(); }}>
            <LogOut size={14} style={{ marginLeft: 6 }} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
