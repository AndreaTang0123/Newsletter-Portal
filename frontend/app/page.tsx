'use client';

import React, { useEffect, useState } from 'react';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { ListsView } from '../components/ListsView';
import { ListDetailView } from '../components/ListDetailView';
import { ImportView } from '../components/ImportView';
import { MasterSubscribersView } from '../components/MasterSubscribersView';
import { AuditLogsView } from '../components/AuditLogsView';
import { authApi, dashboardApi } from '../lib/api';
import { apiScopeRequest } from '../lib/msalConfig';
import { Mail, ShieldCheck, Cpu, CheckCircle, List, Users, ShieldAlert, History, RefreshCw, Calendar, FileText } from 'lucide-react';

interface CurrentUser {
  email: string;
  full_name: string | null;
  role: string;
}

interface RecentChange {
  id: number;
  actor: string | null;
  action: string;
  list_name: string | null;
  subscriber_email: string | null;
  timestamp: string;
  details: string | null;
}

interface DashboardStats {
  total_lists: number;
  total_subscribers: number;
  active_subscribers: number;
  unsubscribed_subscribers: number;
  bounced_subscribers: number;
  last_updated: string | null;
  recent_changes: RecentChange[];
}

export default function DashboardHome() {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [statistics, setStatistics] = useState<DashboardStats>({
    total_lists: 0,
    total_subscribers: 0,
    active_subscribers: 0,
    unsubscribed_subscribers: 0,
    bounced_subscribers: 0,
    last_updated: null,
    recent_changes: []
  });

  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      authApi.me()
        .then((response) => setCurrentUser(response.data))
        .catch(() => setCurrentUser(null));
    } else {
      setCurrentUser(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && currentTab === 'dashboard') {
      fetchStatistics();
    }
  }, [isAuthenticated, currentTab]);

  const fetchStatistics = async () => {
    setLoadingStats(true);
    setStatsError('');
    try {
      const response = await dashboardApi.getStatistics();
      setStatistics(response.data);
    } catch (error) {
      setStatsError('Failed to load dashboard metrics.');
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const navigateToListDetail = (listId: number) => {
    setSelectedListId(listId);
    setCurrentTab(`list-detail-${listId}`);
  };

  if (!isAuthenticated) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--bg-secondary)', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '36px', padding: '48px' }}>
        <section style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '24px', maxWidth: '560px' }}>
          <div>
            <p style={{ textTransform: 'uppercase', letterSpacing: '0.3em', color: 'var(--color-primary)', fontWeight: 700, marginBottom: '18px' }}>Newsletter Subscriber Portal</p>
            <h1 style={{ fontSize: '3rem', lineHeight: 1.05, maxWidth: '540px' }}>SDIO Subscriber Management Portal</h1>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '520px', lineHeight: 1.8 }}>
            Centralized registry for newsletter subscriber management. Add, edit, bulk import, and audit audience distribution lists securely in one unified administrative environment.
          </p>
        </section>

        <section style={{ alignSelf: 'center' }}>
          <div className="glass-panel" style={{ padding: '32px', maxWidth: '420px', width: '100%' }}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>Sign in to your account</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Sign in with your BioCryst Microsoft account to access the Subscriber Portal.</p>
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => instance.loginRedirect(apiScopeRequest)}
            >
              Sign in with Microsoft
            </button>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, marginTop: '16px' }}>
              Access is restricted to <strong>@biocryst.com</strong> accounts.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} currentUser={currentUser} />

      {/* Main Admin View Workspace */}
      <main className="content-area">
        <Navbar
          title={
            currentTab.startsWith('list-detail-') ? 'List Detail' :
              currentTab === 'master-subscribers' ? 'Master Subscribers' :
                currentTab === 'import' ? 'CSV Import' :
                  currentTab === 'audit-logs' ? 'Audit Logs' :
                    currentTab
          }
          onSettingsClick={() => setCurrentTab('settings')}
        />

        {currentTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(94, 187, 148, 0.15)', color: 'var(--color-primary)' }}>
                  <List size={24} />
                </div>
                <div>
                  <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>TOTAL LISTS</h4>
                  <p style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '4px' }}>
                    {loadingStats ? '...' : statistics.total_lists}
                  </p>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0, 40, 69, 0.1)', color: 'var(--color-secondary)' }}>
                  <Users size={24} />
                </div>
                <div>
                  <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>TOTAL SUBSCRIBERS</h4>
                  <p style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '4px' }}>
                    {loadingStats ? '...' : statistics.total_subscribers}
                  </p>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  <CheckCircle size={24} />
                </div>
                <div>
                  <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>ACTIVE SUBSCRIBERS</h4>
                  <p style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '4px', color: '#10b981' }}>
                    {loadingStats ? '...' : statistics.active_subscribers}
                  </p>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>BOUNCED / UNSUB</h4>
                  <p style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '4px', color: '#ef4444' }}>
                    {loadingStats ? '...' : statistics.bounced_subscribers + statistics.unsubscribed_subscribers}
                  </p>
                </div>
              </div>
            </div>

            {statsError && (
              <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: 'var(--color-error)', fontSize: '0.9rem' }}>
                {statsError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.85rem', color: 'var(--text-secondary)', alignItems: 'center', gap: '8px' }}>
              <Calendar size={14} />
              <span>Database Last Updated: {statistics.last_updated ? new Date(statistics.last_updated).toLocaleString() : 'Never'}</span>
              <button
                onClick={fetchStatistics}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--color-primary)', marginLeft: '8px' }}
                title="Refresh stats"
              >
                <RefreshCw size={14} className={loadingStats ? 'spin-anim' : ''} />
              </button>
            </div>

            {/* Recent Subscriber Changes (Audit log snip) */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={18} color="var(--color-primary)" />
                  Recent Subscriber Changes
                </h3>
                <button className="btn-secondary" onClick={() => setCurrentTab('audit-logs')} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                  View Full Audit Trail
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px', fontWeight: 600 }}>TIMESTAMP</th>
                      <th style={{ padding: '12px', fontWeight: 600 }}>ACTION</th>
                      <th style={{ padding: '12px', fontWeight: 600 }}>LIST</th>
                      <th style={{ padding: '12px', fontWeight: 600 }}>SUBSCRIBER</th>
                      <th style={{ padding: '12px', fontWeight: 600 }}>OPERATOR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.recent_changes.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          No recent subscriber updates recorded.
                        </td>
                      </tr>
                    ) : (
                      statistics.recent_changes.map((log) => (
                        <tr key={log.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                          <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td style={{ padding: '16px', fontWeight: 600 }}>{log.action}</td>
                          <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{log.list_name || '—'}</td>
                          <td style={{ padding: '16px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{log.subscriber_email || '—'}</td>
                          <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{log.actor || 'System'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'lists' && (
          <ListsView onListSelect={navigateToListDetail} />
        )}

        {currentTab.startsWith('list-detail-') && selectedListId !== null && (
          <ListDetailView
            listId={selectedListId}
            onBack={() => {
              setSelectedListId(null);
              setCurrentTab('lists');
            }}
          />
        )}

        {currentTab === 'master-subscribers' && (
          <MasterSubscribersView />
        )}

        {currentTab === 'import' && (
          <ImportView />
        )}

        {currentTab === 'audit-logs' && (
          <AuditLogsView />
        )}

        {currentTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <ShieldCheck size={20} color="var(--color-primary)" />
                <h3 style={{ fontSize: '1.25rem' }}>Administrator Access Control</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
                Role specifications for management of centralized distribution lists.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                  <div>
                    <h5 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Administrators</h5>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Full subscriber write privileges, list creations, and manual override capabilities.</p>
                  </div>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(94, 187, 148, 0.12)', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>Admin</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                  <div>
                    <h5 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Curators</h5>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>View metadata, manage list memberships, execute CSV imports, and download reports.</p>
                  </div>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(0, 40, 69, 0.08)', border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>Curator</span>
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Cpu size={20} color="var(--color-primary)" />
                <h3 style={{ fontSize: '1.25rem' }}>Centralized Database Configurations</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                The Subscriber Portal database is currently connected to a local SQLite instance, set up with configurations prepared for future seamless migration to Azure SQL Database.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-glass)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Local Engine</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>SQLite 3</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-glass)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Target Cloud DB</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>Azure SQL Database (ODBC Driver 17)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Centralized Lists</span>
                  <span style={{ fontWeight: 600 }}>4 Configured Channels</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn-secondary"
                onClick={() => instance.logoutRedirect()}
                style={{ padding: '8px 14px' }}
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
