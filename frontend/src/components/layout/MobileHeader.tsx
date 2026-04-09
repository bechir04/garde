import { Menu } from 'lucide-react';
import logo from '../../assets/667191247_823712910774173_5046685383098711861_n-removebg-preview.png';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="mobile-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src={logo} alt="Logo" style={{ width: 52, height: 52, objectFit: 'contain', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.4))' }} />
        <span style={{ fontWeight: 700, fontSize: 16 }}>الحرس الوطني</span>
      </div>
      <button 
        className="mobile-nav-toggle" 
        onClick={onMenuClick}
        aria-label="Toggle Menu"
      >
        <Menu size={24} />
      </button>
    </header>
  );
}
