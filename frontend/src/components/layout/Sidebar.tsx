import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Car, BarChart3, Upload, Lightbulb, LogOut,
  Users, ClipboardList, X, Map, ChevronDown, BarChart2,
} from 'lucide-react';
import logo from '../../assets/garde national.png';

const mainNav = [
  { to: '/', label: 'لوحة القيادة', icon: LayoutDashboard, exact: true },
  { to: '/accidents', label: 'سجل الحوادث', icon: Car, exact: false },
];

const analyticsNav = [
  { to: '/statistics', label: 'الإحصائيات', icon: BarChart3 },
  { to: '/map', label: 'الخريطة التفاعلية', icon: Map },
  { to: '/insights', label: 'الاستنتاجات', icon: Lightbulb },
];

const otherNav = [
  { to: '/import', label: 'استيراد البيانات', icon: Upload, exact: false },
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

  const isAnalyticsActive = analyticsNav.some((item) => isActive(item.to, false));
  const [analyticsOpen, setAnalyticsOpen] = useState(isAnalyticsActive);

  // Auto-expand analytics dropdown when navigating to an analytics route
  useEffect(() => {
    if (isAnalyticsActive) setAnalyticsOpen(true);
  }, [isAnalyticsActive]);

  const handleNavClick = () => {
    if (window.innerWidth <= 768) onClose?.();
  };

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
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
              onClick={handleNavClick}
              className={`nav-link ${isActive(item.to, item.exact) ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* Analytics dropdown */}
          <div>
            <button
              onClick={() => setAnalyticsOpen(!analyticsOpen)}
              className={`nav-link nav-dropdown ${isAnalyticsActive ? 'active' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <BarChart2 size={20} />
                <span>التحليلات</span>
              </div>
              <ChevronDown
                size={16}
                style={{ transition: 'transform 0.2s', transform: analyticsOpen ? 'rotate(180deg)' : undefined }}
              />
            </button>
            {analyticsOpen && (
              <div style={{ padding: '4px 0 4px 16px' }}>
                {analyticsNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={handleNavClick}
                    className={`nav-link ${isActive(item.to, false) ? 'active' : ''}`}
                    style={{ fontSize: 13, padding: '8px 16px', paddingLeft: 32 }}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {otherNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
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
                  onClick={handleNavClick}
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
