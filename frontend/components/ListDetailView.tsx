import React, { useEffect, useState, useCallback } from 'react';
import { listsApi, subscriptionsApi } from '../lib/api';
import { ArrowLeft, UserPlus, Search, Edit2, Trash2, Download, RefreshCw, X, ShieldAlert, Check } from 'lucide-react';

interface SubscriberRow {
  id: number; // subscriber_id
  subscription_id: number;
  name: string | null;
  email: string;
  department: string | null;
  role_title: string | null;
  status: string;
  source: string;
  opt_in_date: string;
  unsubscribed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ListDetails {
  id: number;
  name: string;
  description: string;
  owner: string;
  category: string;
  subscriber_count: number;
}

interface ListDetailViewProps {
  listId: number;
  onBack: () => void;
}

export const ListDetailView: React.FC<ListDetailViewProps> = ({ listId, onBack }) => {
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [listDetails, setListDetails] = useState<ListDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriberRow | null>(null);

  // Form states
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formStatus, setFormStatus] = useState('Active');
  const [formSource, setFormSource] = useState('Curator Added');
  const [formDepartment, setFormDepartment] = useState('');
  const [formRoleTitle, setFormRoleTitle] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Owner editing state
  const [editingOwner, setEditingOwner] = useState(false);
  const [ownerInput, setOwnerInput] = useState('');

  const fetchListDetails = useCallback(async () => {
    try {
      const response = await listsApi.get(listId);
      setListDetails(response.data);
    } catch (err) {
      console.error('Error fetching list details:', err);
    }
  }, [listId]);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await listsApi.getSubscribers(listId, {
        search: search || undefined,
        status: statusFilter || undefined
      });
      setSubscribers(response.data);
    } catch (err) {
      console.error('Error fetching subscribers:', err);
      setError('Failed to load subscribers for this list.');
    } finally {
      setLoading(false);
    }
  }, [listId, search, statusFilter]);

  useEffect(() => {
    fetchListDetails();
  }, [fetchListDetails]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const handleOpenAddModal = () => {
    setFormEmail('');
    setFormName('');
    setFormStatus('Active');
    setFormSource('Curator Added');
    setFormDepartment('');
    setFormRoleTitle('');
    setFormNotes('');
    setFormError('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (sub: SubscriberRow) => {
    setSelectedSubscription(sub);
    setFormEmail(sub.email);
    setFormName(sub.name || '');
    setFormStatus(sub.status);
    setFormSource(sub.source);
    setFormDepartment(sub.department || '');
    setFormRoleTitle(sub.role_title || '');
    setFormNotes(sub.notes || '');
    setFormError('');
    setShowEditModal(true);
  };

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await listsApi.addSubscriber(listId, {
        email: formEmail,
        name: formName || undefined,
        status: formStatus,
        source: formSource,
        department: formDepartment || undefined,
        role_title: formRoleTitle || undefined,
        notes: formNotes || undefined
      });
      setShowAddModal(false);
      fetchSubscribers();
      fetchListDetails();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to add subscriber.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubscription) return;
    setFormError('');
    setSubmitting(true);
    try {
      await subscriptionsApi.update(selectedSubscription.subscription_id, {
        email: formEmail,
        name: formName || undefined,
        status: formStatus,
        source: formSource,
        department: formDepartment || undefined,
        role_title: formRoleTitle || undefined,
        notes: formNotes || undefined
      });
      setShowEditModal(false);
      fetchSubscribers();
      fetchListDetails();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to update subscriber.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubscriber = async (subscriptionId: number, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from this list?`)) return;
    try {
      await subscriptionsApi.delete(subscriptionId);
      fetchSubscribers();
      fetchListDetails();
    } catch (err) {
      alert('Failed to remove subscriber.');
    }
  };

  const handleExportCsv = () => {
    if (subscribers.length === 0) {
      alert('No subscribers to export.');
      return;
    }
    const headers = ['Name', 'Email', 'Status', 'Source', 'Date Added', 'Last Updated', 'Notes', 'Department', 'Role Title'];
    const rows = subscribers.map(sub => [
      sub.name || '',
      sub.email,
      sub.status,
      sub.source,
      new Date(sub.opt_in_date).toISOString(),
      new Date(sub.updated_at).toISOString(),
      sub.notes || '',
      sub.department || '',
      sub.role_title || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${listDetails?.name.replace(/\s+/g, '_')}_subscribers.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpdateOwner = async () => {
    if (!ownerInput.trim() || !listDetails) return;
    try {
      await listsApi.update(listId, { owner: ownerInput.trim() });
      setEditingOwner(false);
      fetchListDetails();
    } catch (err) {
      console.error('Failed to update owner:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="btn-secondary" onClick={onBack} style={{ padding: '8px 12px' }}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {listDetails?.name || 'Loading List...'}
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              Owner:
              {editingOwner ? (
                <>
                  <input
                    type="text"
                    value={ownerInput}
                    onChange={(e) => setOwnerInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateOwner();
                      } else if (e.key === 'Escape') {
                        setEditingOwner(false);
                      }
                    }}
                    autoFocus
                    style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-primary)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      fontFamily: 'inherit',
                      width: '140px',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleUpdateOwner}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }}
                    title="Save owner"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => setEditingOwner(false)}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
                    title="Cancel"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  {listDetails?.owner || '...'}
                  <button
                    onClick={() => {
                      setOwnerInput(listDetails?.owner || '');
                      setEditingOwner(true);
                    }}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                    title="Edit owner"
                  >
                    <Edit2 size={12} />
                  </button>
                </>
              )}
            </span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {listDetails?.description || 'Loading details...'}
          </p>
        </div>
      </div>

      {/* Control panel */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        {/* Search & Filter */}
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '320px' }}>
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
              placeholder="Search by name or email..."
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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-glass)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '0.875rem'
            }}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
            <option value="Unsubscribed">Unsubscribed</option>
            <option value="Bounced">Bounced</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={handleExportCsv} style={{ gap: '8px' }}>
            <Download size={16} />
            Export CSV
          </button>
          <button className="btn-primary" onClick={handleOpenAddModal} style={{ gap: '8px' }}>
            <UserPlus size={16} />
            Add Subscriber
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: 'var(--color-error)' }}>
          {error}
        </div>
      )}

      {/* Table grid */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading && subscribers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
            Loading subscribers...
          </div>
        ) : subscribers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
            No subscribers found in this list. Click "Add Subscriber" or head to "Import CSV" to populate it.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>NAME</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>EMAIL</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>STATUS</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>SOURCE</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>DATE ADDED</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>LAST UPDATED</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>NOTES</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub) => (
                  <tr key={sub.subscription_id} style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {sub.name || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>None Provided</span>}
                      {(sub.department || sub.role_title) && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 400 }}>
                          {[sub.role_title, sub.department].filter(Boolean).join(' • ')}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{sub.email}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        background: sub.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 
                                    sub.status === 'Paused' ? 'rgba(245, 158, 11, 0.1)' : 
                                    sub.status === 'Bounced' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                        border: sub.status === 'Active' ? '1px solid rgba(16, 185, 129, 0.3)' : 
                                sub.status === 'Paused' ? '1px solid rgba(245, 158, 11, 0.3)' : 
                                sub.status === 'Bounced' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(100, 116, 139, 0.3)',
                        color: sub.status === 'Active' ? '#10b981' : 
                               sub.status === 'Paused' ? '#f59e0b' : 
                               sub.status === 'Bounced' ? '#ef4444' : '#64748b',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {sub.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{sub.source}</td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(sub.opt_in_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(sub.updated_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sub.notes || ''}>
                      {sub.notes || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenEditModal(sub)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', color: 'var(--text-secondary)', transition: 'color 0.2s' }}
                          title="Edit Subscriber"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteSubscriber(sub.subscription_id, sub.email)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', color: 'var(--color-error)', transition: 'color 0.2s' }}
                          title="Remove from List"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Subscriber */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '32px', background: '#ffffff', position: 'relative' }}>
            <button 
              onClick={() => setShowAddModal(false)}
              style={{ position: 'absolute', top: 20, right: 20, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.5rem', marginBottom: '18px' }}>Add Subscriber</h3>
            
            <form onSubmit={handleAddSubscriber} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Email Address *
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="name@biocryst.com"
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Full Name
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Andrea Tang"
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Status
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                    <option value="Unsubscribed">Unsubscribed</option>
                    <option value="Bounced">Bounced</option>
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Source
                  <select
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="Curator Added">Curator Added</option>
                    <option value="Bulk Import">Bulk Import</option>
                    <option value="Self-Service">Self-Service</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Department / Function
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    placeholder="Engineering"
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Role Title
                  <input
                    type="text"
                    value={formRoleTitle}
                    onChange={(e) => setFormRoleTitle(e.target.value)}
                    placeholder="Principal Engineer"
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </label>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Internal Notes
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Brief context notes about the subscriber subscription..."
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', minHeight: '60px', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </label>

              {formError && <p style={{ color: 'var(--color-error)', fontSize: '0.85rem' }}>{formError}</p>}

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }} disabled={submitting}>
                {submitting ? 'Saving...' : 'Add Subscriber'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Subscriber */}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '32px', background: '#ffffff', position: 'relative' }}>
            <button 
              onClick={() => setShowEditModal(false)}
              style={{ position: 'absolute', top: 20, right: 20, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.5rem', marginBottom: '18px' }}>Edit Subscriber</h3>
            
            <form onSubmit={handleEditSubscriber} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Email Address *
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="name@biocryst.com"
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Full Name
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Andrea Tang"
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Status
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                    <option value="Unsubscribed">Unsubscribed</option>
                    <option value="Bounced">Bounced</option>
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Source
                  <select
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="Curator Added">Curator Added</option>
                    <option value="Bulk Import">Bulk Import</option>
                    <option value="Self-Service">Self-Service</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Department / Function
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    placeholder="Engineering"
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Role Title
                  <input
                    type="text"
                    value={formRoleTitle}
                    onChange={(e) => setFormRoleTitle(e.target.value)}
                    placeholder="Principal Engineer"
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </label>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Internal Notes
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Brief context notes about the subscriber subscription..."
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', minHeight: '60px', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </label>

              {formError && <p style={{ color: 'var(--color-error)', fontSize: '0.85rem' }}>{formError}</p>}

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }} disabled={submitting}>
                {submitting ? 'Saving Changes...' : 'Save Subscriber Details'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
