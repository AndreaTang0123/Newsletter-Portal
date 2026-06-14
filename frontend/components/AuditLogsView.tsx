import React, { useEffect, useState } from 'react';
import { auditLogsApi } from '../lib/api';
import { RefreshCw, Search, Calendar, User, Eye, Activity } from 'lucide-react';

interface AuditLog {
  id: number;
  actor: string | null;
  action: string;
  list_id: number | null;
  list_name: string | null;
  subscriber_id: number | null;
  subscriber_email: string | null;
  timestamp: string;
  details: string | null;
}

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await auditLogsApi.list();
      setLogs(res.data);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter((log) => {
    const term = search.toLowerCase();
    const actionMatch = log.action.toLowerCase().includes(term);
    const emailMatch = log.subscriber_email ? log.subscriber_email.toLowerCase().includes(term) : false;
    const listMatch = log.list_name ? log.list_name.toLowerCase().includes(term) : false;
    const actorMatch = log.actor ? log.actor.toLowerCase().includes(term) : false;
    const detailsMatch = log.details ? log.details.toLowerCase().includes(term) : false;
    return actionMatch || emailMatch || listMatch || actorMatch || detailsMatch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Audit Log Trail</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Review security-related modifications, bulk imports, and manual list manipulations.
          </p>
        </div>
        <button className="btn-secondary" onClick={fetchLogs} disabled={loading} style={{ gap: '8px' }}>
          <RefreshCw size={16} className={loading ? 'spin-anim' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: 'var(--color-error)' }}>
          {error}
        </div>
      )}

      {/* Search Filter */}
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
            placeholder="Search audit trail by action, email, list, details, or operator..."
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
        {loading && logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
            Loading audit logs...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
            No log entries found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>TIMESTAMP</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>ACTION</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>TARGET SUBSCRIBER</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>LIST NAME</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>OPERATOR</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: log.action === 'Subscriber removed' ? '#ef4444' : 
                               log.action === 'Subscriber added' ? '#10b981' :
                               log.action === 'List imported' ? 'var(--color-primary)' : 'var(--text-primary)'
                      }}>
                        <Activity size={14} />
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {log.subscriber_email || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {log.list_name || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                      {log.actor ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                          <User size={12} color="var(--text-muted)" />
                          {log.actor}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>System</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', maxWidth: '300px', wordBreak: 'break-word', fontSize: '0.85rem' }}>
                      {log.details || <span style={{ color: 'var(--text-muted)' }}>—</span>}
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
