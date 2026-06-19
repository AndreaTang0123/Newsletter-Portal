'use client';

import React, { useEffect, useState } from 'react';
import { selfServiceApi } from '../../lib/api';
import { Mail, CheckCircle, AlertCircle, Loader, ArrowRight } from 'lucide-react';

interface SubscriberInfo {
  subscriber_id: number;
  email: string;
  name: string | null;
  lists: Array<{ list_id: number; list_name: string; is_subscribed: boolean }>;
}

type PageState = 'email-form' | 'loading' | 'ready' | 'confirming' | 'success' | 'error' | 'invalid';

export default function UnsubscribePage() {
  const [token, setToken] = useState<string | null>(null);
  const [subscriber, setSubscriber] = useState<SubscriberInfo | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [lookupError, setLookupError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (t) {
      setToken(t);
      loadByToken(t);
    } else {
      setPageState('email-form');
    }
  }, []);

  const loadByToken = (t: string) => {
    setPageState('loading');
    selfServiceApi.getSubscriber(t)
      .then(res => {
        setSubscriber(res.data);
        const activeCount = res.data.lists.filter((l: any) => l.is_subscribed).length;
        setPageState(activeCount === 0 ? 'success' : 'ready');
      })
      .catch(() => setPageState('invalid'));
  };

  const handleEmailLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');
    setPageState('loading');
    try {
      const res = await selfServiceApi.lookupByEmail(emailInput);
      setToken(res.data.token);
      setSubscriber(res.data);
      const activeCount = res.data.lists.filter((l: any) => l.is_subscribed).length;
      setPageState(activeCount === 0 ? 'success' : 'ready');
    } catch (err: any) {
      setPageState('email-form');
      setLookupError(err.response?.status === 404
        ? 'No subscription found for this email address.'
        : 'Something went wrong. Please try again.');
    }
  };

  const handleUnsubscribe = async () => {
    if (!token) return;
    setPageState('confirming');
    try {
      await selfServiceApi.unsubscribeAll(token);
      setPageState('success');
    } catch {
      setErrorMessage('Something went wrong. Please try again or contact support.');
      setPageState('error');
    }
  };

  const activeSubscriptions = subscriber?.lists.filter(l => l.is_subscribed) ?? [];

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg-secondary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '40px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 16px',
            background: 'rgba(94, 187, 148, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Mail size={24} color="var(--color-primary)" />
          </div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>Unsubscribe</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            SDIO Subscriber Management Portal
          </p>
        </div>

        {/* Email lookup form (no token in URL) */}
        {pageState === 'email-form' && (
          <form onSubmit={handleEmailLookup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Enter your email address to manage your newsletter subscriptions.
            </p>
            <input
              type="email"
              required
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              placeholder="your.name@company.com"
              style={{
                padding: '12px 16px', borderRadius: '10px',
                border: '1px solid var(--border-glass)',
                background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                fontSize: '0.95rem', outline: 'none',
              }}
            />
            {lookupError && (
              <p style={{ color: 'var(--color-error)', fontSize: '0.85rem' }}>{lookupError}</p>
            )}
            <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
              Continue <ArrowRight size={16} />
            </button>
            <a
              href="/manage-preferences"
              style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}
            >
              Manage individual preferences instead
            </a>
          </form>
        )}

        {/* Loading */}
        {pageState === 'loading' && (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '16px 0' }}>
            <Loader size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
            <p>Looking up your subscription…</p>
          </div>
        )}

        {/* Invalid token */}
        {pageState === 'invalid' && (
          <div style={{ textAlign: 'center' }}>
            <AlertCircle size={36} color="var(--color-error)" style={{ marginBottom: '12px' }} />
            <h2 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Invalid Link</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
              This unsubscribe link is invalid or has expired.
            </p>
            <button className="btn-secondary" onClick={() => setPageState('email-form')} style={{ justifyContent: 'center' }}>
              Try with email instead
            </button>
          </div>
        )}

        {/* Ready to confirm */}
        {pageState === 'ready' && subscriber && (
          <div>
            <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '24px', fontSize: '0.9rem' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Unsubscribing</p>
              <p style={{ fontWeight: 600 }}>{subscriber.name ?? subscriber.email}</p>
              <p style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.85rem' }}>{subscriber.email}</p>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
              You are currently subscribed to {activeSubscriptions.length} newsletter{activeSubscriptions.length !== 1 ? 's' : ''}:
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
              {activeSubscriptions.map(l => (
                <li key={l.list_id} style={{
                  padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '8px',
                  border: '1px solid var(--border-glass)', fontSize: '0.9rem', color: 'var(--text-primary)'
                }}>
                  {l.list_name}
                </li>
              ))}
            </ul>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Clicking below will unsubscribe you from all of the lists above. You can re-subscribe anytime via the{' '}
              <a href={token ? `/manage-preferences?token=${token}` : '/manage-preferences'} style={{ color: 'var(--color-primary)' }}>
                manage preferences
              </a>{' '}page.
            </p>

            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleUnsubscribe}>
              Unsubscribe from all
            </button>
            <a
              href={token ? `/manage-preferences?token=${token}` : '/manage-preferences'}
              style={{ display: 'block', textAlign: 'center', marginTop: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}
            >
              Manage individual preferences instead
            </a>
          </div>
        )}

        {/* Confirming */}
        {pageState === 'confirming' && (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '16px 0' }}>
            <Loader size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
            <p>Processing your request…</p>
          </div>
        )}

        {/* Success */}
        {pageState === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle size={36} color="var(--color-success)" style={{ marginBottom: '12px' }} />
            <h2 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>You've been unsubscribed</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
              You have been removed from all newsletter distribution lists. If this was a mistake, you can re-subscribe below.
            </p>
            <a
              href={token ? `/manage-preferences?token=${token}` : '/manage-preferences'}
              className="btn-secondary"
              style={{ justifyContent: 'center' }}
            >
              Re-subscribe or manage preferences
            </a>
          </div>
        )}

        {/* Error */}
        {pageState === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <AlertCircle size={36} color="var(--color-error)" style={{ marginBottom: '12px' }} />
            <h2 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Something went wrong</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{errorMessage}</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
