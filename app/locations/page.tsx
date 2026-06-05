'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ConfirmModal } from '../components/ConfirmModal';

interface Location { id: number; name: string; wine_count: number }

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [addName, setAddName] = useState('');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [renameId, setRenameId] = useState<number | null>(null);
  const [renameName, setRenameName] = useState('');
  const [renameError, setRenameError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadLocations = useCallback(async () => {
    try {
      const res = await fetch('/api/locations');
      if (res.ok) {
        const data = await res.json();
        setLocations(data.locations || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLocations(); }, [loadLocations]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) { setAddError('Location name is required.'); return; }
    setAddLoading(true);
    setAddError('');
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.message || 'Could not add location.');
        return;
      }
      setAddName('');
      await loadLocations();
      showToast('Location added!');
    } finally {
      setAddLoading(false);
    }
  };

  const handleRenameStart = (loc: Location) => {
    setRenameId(loc.id);
    setRenameName(loc.name);
    setRenameError('');
  };

  const handleRenameSave = async (id: number) => {
    if (!renameName.trim()) { setRenameError('Location name is required.'); return; }
    try {
      const res = await fetch(`/api/locations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renameName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRenameError(data.message || 'Could not rename location.');
        return;
      }
      setRenameId(null);
      await loadLocations();
      showToast('Location renamed!');
    } catch {
      setRenameError('Network error. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/locations/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        setDeleteTarget(null);
        await loadLocations();
        showToast('Location deleted.');
      } else {
        showToast('Could not delete location.', 'error');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="page-content">
      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.message}</div>
        </div>
      )}

      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '24px', marginBottom: '24px' }}>
        Storage Locations
      </h1>

      {/* Add Location Form */}
      <div style={{ marginBottom: '32px' }}>
        <div className="section-header">Add Location</div>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={addName}
              onChange={e => { setAddName(e.target.value); setAddError(''); }}
              placeholder="Location name..."
              maxLength={100}
              style={{ borderColor: addError ? 'var(--color-error)' : 'var(--color-border)' }}
              onKeyDown={e => e.key === 'Enter' && handleAdd(e as unknown as React.FormEvent)}
            />
            {addError && <p className="field-error">⚠ {addError}</p>}
          </div>
          <button
            type="submit"
            disabled={addLoading}
            className="btn btn-primary"
            style={{ minHeight: '44px', fontSize: '13px', padding: '0 16px', whiteSpace: 'nowrap' }}
          >
            {addLoading ? 'Adding...' : 'Add'}
          </button>
        </form>
      </div>

      {/* Location List */}
      <div className="section-header">Your Locations</div>

      {loading ? (
        <p style={{ fontSize: '14px', color: '#6B7280' }}>Loading...</p>
      ) : locations.length === 0 ? (
        <p style={{ fontSize: '14px', color: '#6B7280' }}>
          No storage locations yet. Add your first location above.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {locations.map((loc, idx) => (
            <div
              key={loc.id}
              className="card"
              style={{
                borderRadius: idx === 0 ? 'var(--radius-sm) var(--radius-sm) 0 0' : idx === locations.length - 1 ? '0 0 var(--radius-sm) var(--radius-sm)' : '0',
                borderBottom: idx === locations.length - 1 ? undefined : 'none',
                padding: '14px 12px',
              }}
            >
              {renameId === loc.id ? (
                // Inline rename state
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <input
                      type="text"
                      value={renameName}
                      onChange={e => { setRenameName(e.target.value); setRenameError(''); }}
                      maxLength={100}
                      autoFocus
                      style={{ flex: 1, borderColor: renameError ? 'var(--color-error)' : 'var(--color-border)' }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRenameSave(loc.id);
                        if (e.key === 'Escape') setRenameId(null);
                      }}
                    />
                    <button
                      onClick={() => handleRenameSave(loc.id)}
                      className="btn btn-primary"
                      style={{ minHeight: '36px', fontSize: '12px', padding: '0 12px' }}
                    >Save</button>
                    <button
                      onClick={() => setRenameId(null)}
                      style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '13px', padding: '8px' }}
                    >Cancel</button>
                  </div>
                  {renameError && <p className="field-error">⚠ {renameError}</p>}
                </div>
              ) : (
                // Normal display state
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '15px', marginBottom: '2px' }}>{loc.name}</p>
                    {loc.wine_count > 0 ? (
                      <Link
                        href={`/cellar?location=${encodeURIComponent(loc.name)}`}
                        style={{ fontSize: '13px', color: '#6B7280', textDecoration: 'none' }}
                      >
                        {loc.wine_count} {loc.wine_count === 1 ? 'wine' : 'wines'} →
                      </Link>
                    ) : (
                      <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>0 wines</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => handleRenameStart(loc)}
                      className="btn btn-secondary"
                      style={{ minHeight: '36px', fontSize: '12px', padding: '0 12px' }}
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => setDeleteTarget(loc)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontSize: '13px', padding: '8px', fontWeight: 600 }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmModal
          title={`Delete "${deleteTarget.name}"?`}
          body={
            deleteTarget.wine_count > 0
              ? `${deleteTarget.wine_count} wine(s) will be marked "Location Unknown". This cannot be undone.`
              : 'This cannot be undone.'
          }
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          danger={true}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
