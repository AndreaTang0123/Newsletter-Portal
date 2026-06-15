import React from 'react';
import { Settings } from 'lucide-react';

interface NavbarProps {
  title: string;
  onSettingsClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ title, onSettingsClick }) => {
  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '32px',
      paddingBottom: '16px',
      borderBottom: '1px solid var(--border-glass)'
    }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', textTransform: 'capitalize' }}>{title}</h1>

      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button onClick={onSettingsClick} style={{
          background: 'transparent',
          border: '1px solid var(--border-glass)',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          transition: 'all 0.2s'
        }} aria-label="Open settings">
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
