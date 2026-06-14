import React, { useEffect, useState } from 'react';
import { subscriberApi } from '../lib/api';
import { Search, RefreshCw, Mail, Database, HelpCircle } from 'lucide-react';

interface ListSubscription {
  list_id: number;
  list_name: string;
  status: string;
}

interface SubscriberMaster {
  id: number;
  name: string | null;
  email: string;
  department: string | null;
  role_title: string | null;
  updated_at: string;
  subscriptions: ListSubscription[];
}

export const MasterSubscribersView: React.FC = () => {
  const [subscribers, setSubscribers] = useState<SubscriberMaster[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchSubscribers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await subscriberApi.listMaster();
      setSubscribers(res.data);
    } catch (err) {
      console.error('Error fetching master subscribers:', err);
      setError('Failed to load global subscriber database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  // Filter subscribers client-side
  const filtered = subscribers.filter(sub => {
    const term = search.toLowerCase();
    const matchesEmail = sub.email.toLowerCase().includes(term);
    const matchesName = sub.name ? sub.name.toLowerCase().includes(term) : false;
    const matchesDept = sub.department ? sub.department.toLowerCase().includes(term) : false;
    const matchesRole = sub.role_title ? sub.role_title.toLowerCase().includes(term) : false;
    return matchesEmail || matchesName || matchesDept || matchesRole;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Master Audience Directory</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Browse unique subscribers across all distribution lists and view their subscription statuses.
          </p>
        </div>
        <button className="btn-secondary" onClick={fetchSubscribers} disabled={loading} style={{ gap: '8px' }}>
          <RefreshCw size={16} className={loading ? 'spin-anim' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: 'var(--color-error)' }}>
          {error}
        </div>
      )}

      {/* Control panel */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-glass)',
          borderRadius: '8px',
          padding: '8px 12px',
          flex: 1
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search master directory by name, email, department, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              outline: 'none',
              width: '100%',
              fontSize: '0.875rem'
            }}
          />
        </div>
      </div>

      {/* Table grid */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading && subscribers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
            Loading master directory...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
            No subscribers found in the directory.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>NAME</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>EMAIL</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>DEPARTMENT & ROLE</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>LIST SUBSCRIPTIONS & STATUSES</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>LAST MODIFIED</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub) => (
                  <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {sub.name || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>None Provided</span>}
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{sub.email}</td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                      {sub.role_title || sub.department ? (
                        <div>
                          <div style={{ fontWeight: 500 }}>{sub.role_title || '—'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{sub.department || '—'}</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {sub.subscriptions.length === 0 ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>No active subscriptions</span>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {sub.subscriptions.map((s, idx) => (
                            <div key={idx} style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border-glass)',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem'
                            }}>
                              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.list_name}</span>
                              <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: s.status === 'Active' ? '#10b981' : 
                                           s.status === 'Paused' ? '#f59e0b' : 
                                           s.status === 'Bounced' ? '#ef4444' : '#64748b'
                              }} title={s.status} />
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(sub.updated_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
