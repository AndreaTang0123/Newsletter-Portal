import React from 'react';
import { Bell, Search } from 'lucide-react';

interface NavbarProps {
  title: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title }) => {
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
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
          Manage your AI-powered email campaigns and subscriber databases.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-glass)',
          borderRadius: '8px',
          padding: '6px 12px',
          width: '240px'
        }}>
          <Search size={16} color="var(--text-secondary)" />
          <input 
            type="text" 
            placeholder="Search campaigns..." 
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              outline: 'none',
              width: '100%',
              fontSize: '0.85rem'
            }} 
          />
        </div>

        <button style={{
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
        }}>
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
};
