import React, { useEffect, useState } from 'react';
import { listsApi } from '../lib/api';
import { RefreshCw, Users, Mail, User, ShieldAlert, Calendar } from 'lucide-react';

interface ListStats {
  id: number;
  name: string;
  description: string;
  owner: string;
  category: string;
  created_at: string;
  updated_at: string;
  subscriber_count: number;
  active_count: number;
  unsubscribed_count: number;
  bounced_count: number;
}

interface ListsViewProps {
  onListSelect: (listId: number) => void;
}

export const ListsView: React.FC<ListsViewProps> = ({ onListSelect }) => {
  const [lists, setLists] = useState<ListStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLists = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await listsApi.list();
      setLists(response.data);
    } catch (err) {
      console.error('Error loading lists:', err);
      setError('Failed to load distribution lists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Distribution Lists</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Centralized distribution channels for Weekly CI Newsletters and Curated Alerts.
          </p>
        </div>
        <button className="btn-secondary" onClick={fetchLists} disabled={loading} style={{ gap: '8px' }}>
          <RefreshCw size={16} className={loading ? 'spin-anim' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: 'var(--color-error)' }}>
          {error}
        </div>
      )}

      {loading && lists.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          Loading distribution lists...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {lists.map((lst) => (
            <div key={lst.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    background: 'rgba(94, 187, 148, 0.12)',
                    border: '1px solid rgba(94, 187, 148, 0.3)',
                    color: 'var(--color-secondary)',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontWeight: 600
                  }}>
                    {lst.category}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <User size={14} />
                    <span>{lst.owner}</span>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: '6px' }}>{lst.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', minHeight: '36px', lineHeight: 1.5 }}>
                  {lst.description || 'No description provided.'}
                </p>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>SUBSCRIBERS</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{lst.subscriber_count}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 500 }}>ACTIVE</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>{lst.active_count}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>UNSUBSCRIBED</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#64748b', marginTop: '2px' }}>{lst.unsubscribed_count}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>BOUNCED</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444', marginTop: '2px' }}>{lst.bounced_count}</p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} />
                  Updated {new Date(lst.updated_at).toLocaleDateString()}
                </span>
                <button 
                  className="btn-primary" 
                  onClick={() => onListSelect(lst.id)}
                  style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                >
                  Manage List
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
