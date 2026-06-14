import React, { useEffect, useState } from 'react';
import { listsApi, importsApi } from '../lib/api';
import { Upload, AlertCircle, CheckCircle, Info, Database, Layers, ArrowRight } from 'lucide-react';

interface ListOption {
  id: number;
  name: string;
}

interface PreviewRow {
  name: string | null;
  email: string;
  status: string; // valid, invalid, duplicate_file, duplicate_db
  details: string | null;
}

interface PreviewStats {
  rows: PreviewRow[];
  total_rows: number;
  valid_count: number;
  duplicate_count: number;
  invalid_count: number;
}

export const ImportView: React.FC = () => {
  const [lists, setLists] = useState<ListOption[]>([]);
  const [selectedListId, setSelectedListId] = useState<number | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingCommit, setLoadingCommit] = useState(false);
  const [previewStats, setPreviewStats] = useState<PreviewStats | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const res = await listsApi.list();
        setLists(res.data);
        if (res.data.length > 0) {
          setSelectedListId(res.data[0].id);
        }
      } catch (err) {
        console.error('Error fetching lists:', err);
      }
    };
    fetchLists();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setPreviewStats(null);
      setErrorMessage('');
      setSuccessMessage('');
    }
  };

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedListId) return;

    setLoadingPreview(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('list_id', String(selectedListId));

    try {
      const res = await importsApi.preview(formData);
      setPreviewStats(res.data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Error uploading and parsing CSV file.');
      setPreviewStats(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleCommit = async () => {
    if (!previewStats || !selectedListId) return;

    const validEntries = previewStats.rows
      .filter((r) => r.status === 'valid')
      .map((r) => ({
        name: r.name || undefined,
        email: r.email,
      }));

    if (validEntries.length === 0) {
      alert('No valid subscribers to import.');
      return;
    }

    setLoadingCommit(true);
    setErrorMessage('');
    try {
      const res = await importsApi.commit({
        list_id: Number(selectedListId),
        entries: validEntries,
      });
      setSuccessMessage(res.data.detail || `Successfully imported subscribers.`);
      setPreviewStats(null);
      setFile(null);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Error committing subscribers.');
    } finally {
      setLoadingCommit(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Import Subscribers</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Bulk upload contacts into the centralized distribution lists (Weekly Newsletter, HAE, CMD, NS).
        </p>
      </div>

      {errorMessage && (
        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} />
          {successMessage}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: previewStats ? '1fr' : '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Upload Form */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Upload CSV File</h3>
          
          <form onSubmit={handlePreview} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Target Distribution List
              <select
                value={selectedListId}
                onChange={(e) => setSelectedListId(Number(e.target.value))}
                style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem' }}
              >
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </label>

            <div style={{
              border: '2px dashed var(--border-glass)',
              borderRadius: '12px',
              padding: '40px 20px',
              textAlign: 'center',
              background: 'var(--bg-secondary)',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              position: 'relative'
            }}>
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange} 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                required={!file}
              />
              <Upload size={32} color="var(--color-primary)" style={{ margin: '0 auto 12px auto' }} />
              <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>
                {file ? file.name : 'Choose a CSV file or drag it here'}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Supports standard spreadsheets with email or Name <email> entries'}
              </p>
            </div>

            <button type="submit" className="btn-primary" style={{ justifyContent: 'center', width: '100%', padding: '12px' }} disabled={loadingPreview || !file}>
              {loadingPreview ? 'Uploading & Parsing...' : 'Parse & Preview CSV'}
            </button>
          </form>
        </div>

        {/* Requirements Box (Only shows when no preview) */}
        {!previewStats && (
          <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} color="var(--color-primary)" />
              CSV Format Specifications
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              The portal parser supports standard spreadsheet layouts and is designed to handle multiple formats:
            </p>
            <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: 1.6 }}>
              <li>
                <strong>Unified email column:</strong> Cells in the format <code>Name &lt;email@domain.com&gt;</code> are split into name and email fields.
              </li>
              <li>
                <strong>Multiple columns:</strong> If headers are present (e.g. <code>email</code> and <code>name</code>), values are automatically mapped to respective database attributes.
              </li>
              <li>
                <strong>Duplicate prevention:</strong> Duplicate emails inside the file or already subscribed to the list are highlighted during preview.
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Preview Section */}
      {previewStats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Summary metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-secondary)', borderLeft: '4px solid var(--border-glass)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL ROWS DETECTED</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px' }}>{previewStats.total_rows}</p>
            </div>
            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-secondary)', borderLeft: '4px solid #10b981' }}>
              <p style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>VALID & READY</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>{previewStats.valid_count}</p>
            </div>
            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-secondary)', borderLeft: '4px solid #f59e0b' }}>
              <p style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>DUPLICATES DETECTED</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>{previewStats.duplicate_count}</p>
            </div>
            <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-secondary)', borderLeft: '4px solid #ef4444' }}>
              <p style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>INVALID ROWS</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444', marginTop: '4px' }}>{previewStats.invalid_count}</p>
            </div>
          </div>

          {/* Action commit banner */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(94, 187, 148, 0.05)', border: '1px solid rgba(94, 187, 148, 0.2)' }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-secondary)' }}>Ready to import?</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Commit import to insert {previewStats.valid_count} valid subscriber(s). Duplicates and invalid rows will be skipped automatically.
              </p>
            </div>
            <button 
              className="btn-primary" 
              onClick={handleCommit} 
              disabled={loadingCommit || previewStats.valid_count === 0}
              style={{ gap: '8px' }}
            >
              {loadingCommit ? 'Importing...' : 'Commit Import'}
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Preview data table */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>CSV Import Row Preview</h3>
            
            <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)', position: 'sticky', top: 0, background: '#ffffff', zIndex: 10 }}>
                    <th style={{ padding: '10px 16px', fontWeight: 600 }}>NAME</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600 }}>EMAIL</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600 }}>VALIDATION STATUS</th>
                    <th style={{ padding: '10px 16px', fontWeight: 600 }}>DETAILS</th>
                  </tr>
                </thead>
                <tbody>
                  {previewStats.rows.map((row, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                        {row.name || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{row.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: row.status === 'valid' ? 'rgba(16, 185, 129, 0.1)' : 
                                      row.status === 'invalid' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          border: row.status === 'valid' ? '1px solid rgba(16, 185, 129, 0.3)' : 
                                  row.status === 'invalid' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                          color: row.status === 'valid' ? '#10b981' : 
                                 row.status === 'invalid' ? '#ef4444' : '#f59e0b',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: 600
                        }}>
                          {row.status === 'valid' ? 'Ready' : 
                           row.status === 'invalid' ? 'Invalid' : 
                           row.status === 'duplicate_file' ? 'File Duplicate' : 'List Duplicate'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{row.details || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
