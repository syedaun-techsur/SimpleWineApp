'use client';

import { useEffect, useRef } from 'react';

interface ConfirmModalProps {
  title: string;
  body: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
}

export function ConfirmModal({
  title, body, onConfirm, onCancel,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  danger = false, loading = false,
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Focus cancel button on open
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  // ESC key closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      // Tab trap
      if (e.key === 'Tab') {
        const focusable = [cancelRef.current!, confirmRef.current!].filter(Boolean);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div
      className="scrim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      // Note: scrim click does NOT close (prevents accidental destructive dismissal)
    >
      <div style={{
        background: 'var(--color-bone)',
        borderRadius: 'var(--radius-modal)',
        padding: '24px',
        width: '100%',
        maxWidth: '340px',
        margin: '0 16px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        <h2 id="confirm-title" style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: '18px',
          marginBottom: '12px',
        }}>
          {title}
        </h2>
        <p style={{ fontSize: '14px', color: '#374151', marginBottom: '24px', lineHeight: 1.5 }}>
          {body}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="btn btn-secondary"
            style={{ minHeight: '40px', fontSize: '13px' }}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            style={{ minHeight: '40px', fontSize: '13px' }}
            disabled={loading}
          >
            {loading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
