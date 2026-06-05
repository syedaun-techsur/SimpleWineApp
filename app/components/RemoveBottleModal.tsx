'use client';

import { useState } from 'react';

type EventType = 'Consumed' | 'Gifted' | 'Opened';

interface RemoveBottleModalProps {
  wineId: number;
  wineName: string;
  onClose: () => void;
  onSuccess: (newQty: number, showingNotePrompt?: boolean) => void;
}

export function RemoveBottleModal({ wineId, wineName, onClose, onSuccess }: RemoveBottleModalProps) {
  const [selectedType, setSelectedType] = useState<EventType | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNotePrompt, setShowNotePrompt] = useState(false);

  const handleConfirm = async () => {
    if (!selectedType || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/wines/${wineId}/quantity`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta: -1, event_type: selectedType, note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Could not remove bottle. Please try again.');
        return;
      }
      const willShowPrompt = selectedType === 'Consumed' || selectedType === 'Gifted';
      onSuccess(data.quantity, willShowPrompt);
      if (willShowPrompt) {
        setShowNotePrompt(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showNotePrompt) {
    return (
      <div className="scrim" role="dialog" aria-modal="true" aria-label="Add tasting note prompt">
        <div style={{
          background: 'var(--color-bone)',
          borderRadius: 'var(--radius-modal) var(--radius-modal) 0 0',
          padding: '24px',
          width: '100%',
          maxWidth: '480px',
        }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>
            🍷 Bottle marked as {selectedType?.toLowerCase()}!
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '16px', marginBottom: '16px' }}>
            {wineName}
          </p>
          <p style={{ fontSize: '14px', marginBottom: '20px', color: '#374151' }}>
            Would you like to add a tasting note?
          </p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <a
              href={`/wines/${wineId}/notes/new`}
              className="btn btn-primary"
              style={{ fontSize: '14px', minHeight: '44px' }}
            >
              Add a Note
            </a>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '14px', padding: '8px' }}
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    );
  }

  const EVENT_TYPES: EventType[] = ['Consumed', 'Gifted', 'Opened'];

  return (
    <div
      className="scrim"
      role="dialog"
      aria-modal="true"
      aria-label="Remove a bottle"
    >
      <div style={{
        background: 'var(--color-bone)',
        borderRadius: 'var(--radius-modal) var(--radius-modal) 0 0',
        padding: '24px',
        width: '100%',
        maxWidth: '480px',
      }}>
        {/* Drag handle */}
        <div style={{ width: '40px', height: '4px', background: '#D1D5DB', borderRadius: '2px', margin: '0 auto 20px' }} />

        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '18px', marginBottom: '4px' }}>
          Remove a Bottle
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginBottom: '20px' }}>{wineName}</p>

        <p style={{ fontSize: '14px', marginBottom: '12px', fontWeight: 600 }}>
          What happened to this bottle?
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {EVENT_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              style={{
                flex: 1,
                height: '44px',
                borderRadius: 'var(--radius-sm)',
                border: '2px solid',
                borderColor: selectedType === type ? 'var(--color-gold)' : 'var(--color-border)',
                background: selectedType === type ? 'var(--color-gold)' : 'transparent',
                color: 'var(--color-black)',
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              {type}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label className="label-mono" style={{ display: 'block', marginBottom: '6px' }}>
            Notes (optional)
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value.slice(0, 500))}
            placeholder="Any notes about this bottle..."
            rows={3}
            style={{ resize: 'none' }}
          />
          <div style={{ textAlign: 'right', fontSize: '11px', color: note.length > 450 ? 'var(--color-error)' : 'var(--color-muted)', marginTop: '4px' }}>
            {note.length}/500
          </div>
        </div>

        {error && <p className="field-error" style={{ marginBottom: '12px' }}>⚠ {error}</p>}

        <button
          onClick={handleConfirm}
          disabled={!selectedType || loading}
          className="btn"
          style={{
            width: '100%',
            background: !selectedType ? 'var(--color-muted)' : 'var(--color-gold)',
            color: 'var(--color-black)',
            marginBottom: '12px',
          }}
        >
          {loading ? 'Removing...' : 'Confirm Removal'}
        </button>

        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '14px', display: 'block', margin: '0 auto', padding: '8px' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
