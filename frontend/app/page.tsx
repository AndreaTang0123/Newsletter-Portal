'use client';

import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { AIDraftWizard } from '../components/AIDraftWizard';
import { NewsletterEditor } from '../components/NewsletterEditor';
import { SubscribersList } from '../components/SubscribersList';
import { Mail, ShieldCheck, Cpu, Send, CheckCircle, BarChart3 } from 'lucide-react';

export default function DashboardHome() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');

  const handleDraftGenerated = (draft: { title: string; content_html: string }) => {
    setDraftTitle(draft.title);
    setDraftContent(draft.content_html);
    // Switch to newsletter tab to edit the newly created draft
    setCurrentTab('newsletters');
  };

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Admin View Workspace */}
      <main className="content-area">
        <Navbar title={currentTab} />

        {currentTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(94, 187, 148, 0.15)', color: 'var(--color-primary)' }}>
                  <Mail size={24} />
                </div>
                <div>
                  <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>CAMPAIGNS SENT</h4>
                  <p style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '4px' }}>142</p>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0, 40, 69, 0.1)', color: 'var(--color-secondary)' }}>
                  <CheckCircle size={24} />
                </div>
                <div>
                  <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>DELIVERY SUCCESS</h4>
                  <p style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '4px' }}>99.8%</p>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(94, 187, 148, 0.15)', color: 'var(--color-accent)' }}>
                  <BarChart3 size={24} />
                </div>
                <div>
                  <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>OPEN RATE</h4>
                  <p style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '4px' }}>74.2%</p>
                </div>
              </div>
            </div>

            {/* AI Prompting Quick Access */}
            <AIDraftWizard onDraftGenerated={handleDraftGenerated} />

            {/* Recent Campaigns History Table */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Recent Sent History</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px', fontWeight: 600 }}>SUBJECT</th>
                      <th style={{ padding: '12px', fontWeight: 600 }}>CATEGORY</th>
                      <th style={{ padding: '12px', fontWeight: 600 }}>SENT DATE</th>
                      <th style={{ padding: '12px', fontWeight: 600 }}>DELIVERED</th>
                      <th style={{ padding: '12px', fontWeight: 600 }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '16px', fontWeight: 500 }}>Q1 engineering roadmap review</td>
                      <td style={{ padding: '16px' }}>Engineering Updates</td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>2026-06-01 10:00 AM</td>
                      <td style={{ padding: '16px' }}>24 Recipients</td>
                      <td style={{ padding: '16px' }}><span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Delivered</span></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '16px', fontWeight: 500 }}>Health insurance updates & enrollment details</td>
                      <td style={{ padding: '16px' }}>HR Announcements</td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>2026-05-18 09:30 AM</td>
                      <td style={{ padding: '16px' }}>38 Recipients</td>
                      <td style={{ padding: '16px' }}><span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Delivered</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'newsletters' && (
          <div>
            <NewsletterEditor 
              initialTitle={draftTitle} 
              initialContent={draftContent} 
              onSaved={() => {
                setDraftTitle('');
                setDraftContent('');
              }}
            />
          </div>
        )}

        {currentTab === 'subscribers' && (
          <SubscribersList />
        )}

        {currentTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <ShieldCheck size={20} color="var(--color-primary)" />
                <h3 style={{ fontSize: '1.25rem' }}>Curator & Administrator Permissions</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
                Manage roles and assign access to system components.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                  <div>
                    <h5 style={{ fontSize: '0.95rem' }}>Administrators</h5>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Full editing privileges, category creation, database uploads.</p>
                  </div>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(94, 187, 148, 0.12)', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>Admin</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                  <div>
                    <h5 style={{ fontSize: '0.95rem' }}>Curators</h5>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Draft creation, AI content generation tools. Restrictions on sending directly.</p>
                  </div>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(0, 40, 69, 0.08)', border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>Curator</span>
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Cpu size={20} color="var(--color-primary)" />
                <h3 style={{ fontSize: '1.25rem' }}>Gemini AI Credentials</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                Adjust context boundaries, target engines, or custom temperature thresholds for draft generation.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem' }}>AI Model Engine</span>
                  <select style={{ padding: '6px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '6px' }}>
                    <option>Gemini 1.5 Pro</option>
                    <option>Gemini 1.5 Flash</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem' }}>Generation Temperature (Creativity)</span>
                  <input type="range" min="0" max="1" step="0.1" defaultValue="0.7" style={{ accentColor: 'var(--color-primary)' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
