'use client';

import React, { useEffect, useState } from 'react';
import { selfServiceApi } from '../../lib/api';
import { Settings, CheckCircle, AlertCircle, Loader, Save } from 'lucide-react';

interface ListItem {
  list_id: number;
  list_name: string;
  is_subscribed: boolean;
}

interface SubscriberInfo {
  subscriber_id: number;
  email: string;
  name: string | null;
  lists: ListItem[];
}

type PageState = 'loading' | 'ready' | 'saving' | 'success' | 'error' | 'invalid';

export default function ManagePreferencesPage() {
  const [token, setToken] = useState<string | null>(null);
  const [subscriber, setSubscriber] = useState<SubscriberInfo | null>(null);
  const [preferences, setPreferences] = useState<Record<number, boolean>>({});
  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    setToken(t);

    if (!t) {
      setPageState('invalid');
      return;
    }

    selfServiceApi.getSubscriber(t)
      .then(res => {
        const data: SubscriberInfo = res.data;
        setSubscriber(data);
        const prefs: Record<number, boolean> = {};
        data.lists.forEach(l => { prefs[l.list_id] = l.is_subscribed; });
        setPreferences(prefs);
        setPageState('ready');
      })
      .catch(() => setPageState('invalid'));
  }, []);

  const toggleList = (listId: number) => {
    setPreferences(prev => ({ ...prev, [listId]: !prev[listId] }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!token || !subscriber) return;
    setPageState('saving');
    try {
      const subscriptions = subscriber.lists.map(l => ({
        list_id: l.list_id,
        subscribed: preferences[l.list_id] ?? false,
      }));
      await selfServiceApi.updatePreferences(token, subscriptions);
      setPageState('success');
      setIsDirty(false);
    } catch {
      setErrorMessage('Something went wrong saving your preferences. Please try again.');
      setPageState('error');
    }
  };

  const activeCount = Object.values(preferences).filter(Boolean).length;

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg-secondary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div className="glass-panel" style={{ maxWidth: '520px', width: '100%', padding: '40px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 16px',
            background: 'rgba(94, 187, 148, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Settings size={24} color="var(--color-primary)" />
          </div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>Manage Preferences</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            SDIO Subscriber Management Portal
          </p>
        </div>

        {/* Loading */}
        {pageState === 'loading' && (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '16px 0' }}>
            <Loader size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
            <p>Loading your preferences…</p>
          </div>
        )}

        {/* Invalid token */}
        {pageState === 'invalid' && (
          <div style={{ textAlign: 'center' }}>
            <AlertCircle size={36} color="var(--color-error)" style={{ marginBottom: '12px' }} />
            <h2 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Invalid Link</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              This preferences link is invalid or has expired. Please contact your newsletter administrator.
            </p>
          </div>
        )}

        {/* Ready */}
        {(pageState === 'ready' || pageState === 'saving') && subscriber && (
          <div>
            {/* Subscriber info */}
            <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '28px', fontSize: '0.9rem' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Managing preferences for</p>
              <p style={{ fontWeight: 600 }}>{subscriber.name ?? subscriber.email}</p>
              <p style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.85rem' }}>{subscriber.email}</p>
            </div>

            {/* List toggles */}
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '14px' }}>
              Select the newsletters you'd like to receive:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
              {subscriber.lists.map(l => {
                const isOn = preferences[l.list_id] ?? false;
                return (
                  <button
                    key={l.list_id}
                    onClick={() => toggleList(l.list_id)}
                    disabled={pageState === 'saving'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      borderRadius: '10px',
                      border: `1px solid ${isOn ? 'var(--color-primary)' : 'var(--border-glass)'}`,
                      background: isOn ? 'rgba(94, 187, 148, 0.06)' : 'var(--bg-secondary)',
                      cursor: pageState === 'saving' ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {l.list_name}
                    </span>
                    {/* Toggle pill */}
                    <div style={{
                      width: '44px', height: '24px', borderRadius: '12px', flexShrink: 0,
                      background: isOn ? 'var(--color-primary)' : 'var(--border-glass)',
                      position: 'relative', transition: 'background 0.2s ease',
                    }}>
                      <div style={{
                        position: 'absolute', top: '3px',
                        left: isOn ? '23px' : '3px',
                        width: '18px', height: '18px', borderRadius: '50%',
                        background: '#fff',
                        transition: 'left 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }} />
                    </div>
                  </button>
                );
              })}
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              {activeCount === 0
                ? 'You are not subscribed to any newsletters.'
                : `Subscribed to ${activeCount} of ${subscriber.lists.length} newsletter${subscriber.lists.length !== 1 ? 's' : ''}.`}
            </p>

            <button
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', opacity: pageState === 'saving' ? 0.7 : 1 }}
              onClick={handleSave}
              disabled={pageState === 'saving' || !isDirty}
            >
              {pageState === 'saving'
                ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                : <><Save size={16} /> Save preferences</>}
            </button>

            <a
              href={`/unsubscribe?token=${token}`}
              style={{ display: 'block', textAlign: 'center', marginTop: '14px', color: 'var(--text-muted)', fontSize: '0.85rem' }}
            >
              Unsubscribe from all newsletters
            </a>
          </div>
        )}

        {/* Success */}
        {pageState === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle size={36} color="var(--color-success)" style={{ marginBottom: '12px' }} />
            <h2 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Preferences saved</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Your newsletter preferences have been updated successfully.
            </p>
            <button
              className="btn-secondary"
              style={{ justifyContent: 'center' }}
              onClick={() => { setPageState('ready'); setIsDirty(false); }}
            >
              Make more changes
            </button>
          </div>
        )}

        {/* Error */}
        {pageState === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <AlertCircle size={36} color="var(--color-error)" style={{ marginBottom: '12px' }} />
            <h2 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Something went wrong</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>{errorMessage}</p>
            <button className="btn-secondary" onClick={() => setPageState('ready')} style={{ justifyContent: 'center' }}>
              Try again
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
