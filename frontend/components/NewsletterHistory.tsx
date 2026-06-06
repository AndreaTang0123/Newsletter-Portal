import React, { useState } from 'react';
import { Download, Eye, Repeat, FileText, Search } from 'lucide-react';

const sentHistory = [
  {
    id: 1,
    title: 'Q2 Clinical Research Update',
    category: 'HAE',
    sentDate: '2026-06-04 10:15 AM',
    sentBy: 'Andrea Tang',
    audience: ['HAE', 'NS'],
    recipients: 86,
    status: 'Sent',
  },
  {
    id: 2,
    title: 'New Product Launch Announcement',
    category: 'CMD',
    sentDate: '2026-05-22 04:30 PM',
    sentBy: 'Michael Chen',
    audience: ['CMD'],
    recipients: 54,
    status: 'Partially Sent',
  },
  {
    id: 3,
    title: 'NS Compliance Reminder',
    category: 'NS',
    sentDate: '2026-05-10 09:00 AM',
    sentBy: 'Sophie Lee',
    audience: ['NS'],
    recipients: 120,
    status: 'Failed',
  },
];

export const NewsletterHistory: React.FC = () => {
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('recent-first');

  const allAudiences = Array.from(new Set(sentHistory.flatMap((item) => item.audience)));
  const allStatuses = Array.from(new Set(sentHistory.map((item) => item.status)));

  const parseSentDate = (dateString: string) => {
    const [datePart, timePart, ampm] = dateString.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hourRaw, minute] = timePart.split(':').map(Number);
    const hour = ampm === 'PM' && hourRaw !== 12 ? hourRaw + 12 : ampm === 'AM' && hourRaw === 12 ? 0 : hourRaw;
    return new Date(year, month - 1, day, hour, minute).getTime();
  };

  const filteredHistory = sentHistory
    .filter((item) => item.title.toLowerCase().includes(search.toLowerCase()))
    .filter((item) => audienceFilter === 'All' || item.audience.includes(audienceFilter))
    .filter((item) => statusFilter === 'All' || item.status === statusFilter)
    .sort((a, b) => {
      const dateA = parseSentDate(a.sentDate);
      const dateB = parseSentDate(b.sentDate);
      return sortOrder === 'recent-first' ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <FileText size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Newsletter Send History</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Review past sends and take action on any campaign delivery record.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', width: '100%', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 320px', minWidth: '280px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px 14px' }}>
            <Search size={16} color="var(--text-secondary)" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title..."
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Audience
              <select
                value={audienceFilter}
                onChange={(e) => setAudienceFilter(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                <option value="All">All</option>
                {allAudiences.map((audience) => (
                  <option key={audience} value={audience}>{audience}</option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Status
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                <option value="All">All</option>
                {allStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Sort
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                <option value="recent-first">Most Recent First</option>
                <option value="oldest-first">Oldest First</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Title</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Sent Date</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Sent By</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Audience</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Recipients Count</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <td style={{ padding: '16px', fontWeight: 500 }}>{item.title}</td>
                <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{item.sentDate}</td>
                <td style={{ padding: '16px' }}>{item.sentBy}</td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {item.audience.map((audience, idx) => (
                      <span key={idx} style={{
                        background: 'rgba(94, 187, 148, 0.12)',
                        border: '1px solid rgba(94, 187, 148, 0.3)',
                        borderRadius: '12px',
                        padding: '2px 8px',
                        fontSize: '0.75rem',
                        color: 'var(--color-secondary)',
                        fontWeight: 500,
                      }}>
                        {audience}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '16px' }}>{item.recipients}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    color: item.status === 'Sent' ? '#16a34a' : item.status === 'Failed' ? '#dc2626' : '#f59e0b',
                    fontWeight: 600,
                  }}>
                    {item.status}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <button style={{
                      border: '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      padding: '6px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}>
                      <Eye size={14} />
                      View
                    </button>
                    <button style={{
                      border: '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      padding: '6px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}>
                      <Repeat size={14} />
                      Duplicate
                    </button>
                    <button style={{
                      border: '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      padding: '6px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}>
                      <Download size={14} />
                      Download HTML
                    </button>
                    <button style={{
                      border: '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      padding: '6px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}>
                      <Repeat size={14} />
                      Resend
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
