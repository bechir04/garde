import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Shield, Lock, User, ChevronLeft } from 'lucide-react';
import logo from '../assets/667191247_823712910774173_5046685383098711861_n-removebg-preview.png';

const SAVED_USERNAME_KEY = 'gn_saved_username';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(() => localStorage.getItem(SAVED_USERNAME_KEY) || '');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem(SAVED_USERNAME_KEY));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      if (rememberMe) {
        localStorage.setItem(SAVED_USERNAME_KEY, username);
      } else {
        localStorage.removeItem(SAVED_USERNAME_KEY);
      }
      navigate('/', { replace: true });
    } catch {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background decoration */}
      <div className="login-bg-pattern" />

      <div className="login-container">
        {/* Left side - Branding panel (hidden on mobile) */}
        <div className="login-brand-panel">
          <div className="login-brand-content">
            <div className="login-brand-logo">
              <img src={logo} alt="رئيس فرقة حرس المرور" />
            </div>
            <h2>نظام ادارة حوادث المرور</h2>
            <p className="login-brand-sub">محمد المولهي</p>
            <div className="login-brand-divider" />
            <p className="login-brand-desc">رئيس فرقة حرس المرور</p>
          </div>
          <div className="login-brand-footer">
           {new Date().getFullYear()}الحرس الوطني
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="login-form-panel">
          <div className="login-form-inner">
            {/* Mobile header */}
            <div className="login-mobile-header">
              <img src={logo} alt="رئيس فرقة حرس المرور" className="login-mobile-logo" />
              <h1>نظام ادارة حوادث المرور</h1>
              <p className="login-mobile-sub">محمد المولهي — رئيس فرقة حرس المرور</p>
            </div>

            {/* Desktop header */}
            <div className="login-form-header">
              <h3>تسجيل الدخول</h3>
              <p>أدخل بياناتك للمتابعة</p>
            </div>

            {error && (
              <div className="login-error">
                <Shield size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="login-field">
                <label className="login-field-label">اسم المستخدم</label>
                <div className="login-input-wrapper">
                  <User size={18} className="login-input-icon" />
                  <input
                    className="login-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="أدخل اسم المستخدم"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-field-label">كلمة المرور</label>
                <div className="login-input-wrapper">
                  <Lock size={18} className="login-input-icon" />
                  <input
                    className="login-input"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    required
                  />
                  <button
                    type="button"
                    className="login-toggle-pass"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="login-options">
                <label className="login-checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>تذكر اسم المستخدم</span>
                </label>
              </div>

              <button
                type="submit"
                className="login-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="login-spinner" />
                    جاري الدخول...
                  </>
                ) : (
                  <>
                    تسجيل الدخول
                    <ChevronLeft size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
