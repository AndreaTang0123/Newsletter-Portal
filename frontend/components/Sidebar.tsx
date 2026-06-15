import React from 'react';
import { LayoutDashboard, Users, Settings, FileText, Upload, History, List } from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'lists', label: 'Distribution Lists', icon: List },
    { id: 'master-subscribers', label: 'Master Subscribers', icon: Users },
    { id: 'import', label: 'Import CSV', icon: Upload },
    { id: 'audit-logs', label: 'Audit Logs', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center' }}>
        <img
          src="/logo.png"
          alt="BioCryst Logo"
          style={{ height: '44px', objectFit: 'contain', maxWidth: '180px' }}
        />
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id ||
            (item.id === 'lists' && currentTab.startsWith('list-detail-'));
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'rgba(94, 187, 148, 0.12)' : 'transparent',
                color: isActive ? 'var(--color-secondary)' : 'var(--text-secondary)',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-glass)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            A
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Maxwell Mitchell</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
