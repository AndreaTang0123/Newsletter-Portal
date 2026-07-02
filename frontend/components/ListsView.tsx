import React, { useEffect, useState } from 'react';
import { listsApi } from '../lib/api';
import { RefreshCw, User, Calendar, Plus, X, Trash2 } from 'lucide-react';

interface ListStats {
  id: number;
  name: string;
  description: string;
  owner: string;
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
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', owner: '' });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

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

  const openModal = () => {
    setForm({ name: '', description: '', owner: '' });
    setCreateError('');
    setShowModal(true);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      setCreateError('List name is required.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      await listsApi.create(form);
      setShowModal(false);
      fetchLists();
    } catch (err: any) {
      setCreateError(err?.response?.data?.detail || 'Failed to create list.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await listsApi.delete(id);
      setConfirmDeleteId(null);
      fetchLists();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to delete list.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem' }}>New Distribution List</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>List Name *</label>
                <input
                  className="input-field"
                  placeholder="e.g. Weekly CI Newsletter"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Description</label>
                <input
                  className="input-field"
                  placeholder="Optional description"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Owner</label>
                <input
                  className="input-field"
                  placeholder="e.g. CI Team"
                  value={form.owner}
                  onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {createError && (
              <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: 'var(--color-error)', fontSize: '0.85rem' }}>
                {createError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreate} disabled={creating}>
                {creating ? 'Creating...' : 'Create List'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Delete List</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              This will permanently delete the list and all its subscriber associations. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                {deletingId === confirmDeleteId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Distribution Lists</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Centralized distribution channels for Weekly CI Newsletters and Curated Alerts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={fetchLists} disabled={loading} style={{ gap: '8px' }}>
            <RefreshCw size={16} className={loading ? 'spin-anim' : ''} />
            Refresh
          </button>
          <button className="btn-primary" onClick={openModal} style={{ gap: '8px' }}>
            <Plus size={16} />
            Add New List
          </button>
        </div>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <User size={14} />
                    <span>{lst.owner || '—'}</span>
                  </div>
                  <button
                    onClick={() => setConfirmDeleteId(lst.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                    title="Delete list"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <h3 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: '6px' }}>{lst.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', minHeight: '36px', lineHeight: 1.5 }}>
                  {lst.description || 'No description provided.'}
                </p>
              </div>

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
