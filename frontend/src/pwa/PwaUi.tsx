import { useEffect, useState, type ReactNode } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, EllipsisVertical, Menu, MonitorDown, RefreshCw, Share, SquarePlus, WifiOff, X } from 'lucide-react';
import { useInstallState, requestInstall, closeHelp, isTouchDevice, platform, type Platform } from './install';
import logo from '../assets/667191247_823712910774173_5046685383098711861_n-removebg-preview.png';

const DISMISS_KEY = 'pwa_install_dismissed_at';
const DISMISS_DAYS = 7;
const SHOW_DELAY_MS = 1500;
const UPDATE_CHECK_MS = 60 * 60 * 1000;

/** Manual steps per browser, used when no one-tap install dialog is available. */
const STEPS: Record<Platform, ReactNode[]> = {
  ios: [
    <>اضغط على زر المشاركة <Share size={16} /> في شريط Safari.</>,
    <>اختر «إضافة إلى الشاشة الرئيسية» <SquarePlus size={16} />.</>,
    <>اضغط «إضافة»، فتظهر أيقونة التطبيق على شاشتك.</>,
  ],
  android: [
    <>اضغط على زر القائمة <EllipsisVertical size={16} /> أعلى المتصفح.</>,
    <>اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».</>,
    <>اضغط «تثبيت»، فتظهر أيقونة التطبيق على شاشتك.</>,
  ],
  samsung: [
    <>اضغط على زر القائمة <Menu size={16} /> أسفل المتصفح.</>,
    <>اختر «إضافة الصفحة إلى» ثم «الشاشة الرئيسية».</>,
    <>اضغط «إضافة»، فتظهر أيقونة التطبيق على شاشتك.</>,
  ],
  firefox: [
    <>اضغط على زر القائمة <EllipsisVertical size={16} />.</>,
    <>اختر «تثبيت» أو «إضافة إلى الشاشة الرئيسية».</>,
    <>أكّد الإضافة، فتظهر أيقونة التطبيق على شاشتك.</>,
  ],
  desktop: [
    <>اضغط على أيقونة التثبيت <MonitorDown size={16} /> في شريط العنوان أعلى المتصفح.</>,
    <>أكّد بالضغط على «تثبيت».</>,
  ],
};

function dismissedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return !!at && Date.now() - at < DISMISS_DAYS * 24 * 3600 * 1000;
  } catch {
    return false;
  }
}

function rememberDismiss() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* private mode */ }
}

/**
 * Install banner, shown right away on phones and tablets (and on desktop when the
 * browser can install). Its button installs in one tap when the browser allows it;
 * otherwise it shows this browser's "add to home screen" steps. If the one-tap
 * install becomes available while the steps are open, the banner switches to it.
 */
function InstallBanner() {
  const s = useInstallState();
  const [hidden, setHidden] = useState(dismissedRecently);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    rememberDismiss();
    setHidden(true);
    closeHelp();
  };

  if (s.installed) return null;
  // helpOpen is also set from the sidebar button, so it shows even after a dismissal.
  const offer = ready && !hidden && (s.canPrompt || isTouchDevice);
  if (!s.helpOpen && !offer) return null;

  return (
    <div className="pwa-banner" role="dialog" aria-label="تثبيت التطبيق">
      <button className="pwa-banner-close" onClick={dismiss} aria-label="إغلاق"><X size={18} /></button>
      <div className="pwa-banner-head">
        <img src={logo} alt="" className="pwa-banner-logo" />
        <div>
          <div className="pwa-banner-title">ثبّت التطبيق على جهازك</div>
          <div className="pwa-banner-text">أيقونة على الشاشة الرئيسية، فتح سريع بملء الشاشة ودون شريط المتصفح.</div>
        </div>
      </div>

      {s.helpOpen ? (
        <>
          <ol className="pwa-steps">
            {STEPS[platform].map((step, i) => <li key={i}>{step}</li>)}
          </ol>
          <div className="pwa-banner-actions">
            <button className="btn btn-primary" onClick={dismiss}>حسناً</button>
          </div>
        </>
      ) : (
        <div className="pwa-banner-actions">
          <button className="btn btn-primary" onClick={() => requestInstall()}>
            <Download size={16} /> تثبيت التطبيق
          </button>
          <button className="btn btn-outline" onClick={dismiss}>لاحقاً</button>
        </div>
      )}
    </div>
  );
}

/** Offers a newly deployed version; it is applied only when the user accepts. */
function UpdatePrompt() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) setInterval(() => registration.update(), UPDATE_CHECK_MS);
    },
  });

  if (!needRefresh) return null;
  return (
    <div className="pwa-banner pwa-banner-update" role="status">
      <div className="pwa-banner-head">
        <RefreshCw size={22} className="pwa-banner-icon" />
        <div>
          <div className="pwa-banner-title">يتوفر إصدار جديد من التطبيق</div>
          <div className="pwa-banner-text">احفظ عملك الجاري ثم اضغط «تحديث».</div>
        </div>
      </div>
      <div className="pwa-banner-actions">
        <button className="btn btn-primary" onClick={() => updateServiceWorker(true)}>
          <RefreshCw size={16} /> تحديث
        </button>
        <button className="btn btn-outline" onClick={() => setNeedRefresh(false)}>لاحقاً</button>
      </div>
    </div>
  );
}

function OfflineNotice() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);
  if (online) return null;
  return (
    <div className="pwa-offline" role="status">
      <WifiOff size={15} /> لا يوجد اتصال بالإنترنت
    </div>
  );
}

export default function PwaUi() {
  return (
    <>
      <OfflineNotice />
      <UpdatePrompt />
      <InstallBanner />
    </>
  );
}
