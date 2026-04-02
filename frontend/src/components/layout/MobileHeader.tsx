import { Menu } from 'lucide-react';
import logo from '../../assets/garde national.png';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="mobile-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src={logo} alt="Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
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
