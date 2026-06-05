'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmModal } from '../../components/ConfirmModal';

export function WineDeleteButton({ wineId, wineName }: { wineId: number; wineName: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wines/${wineId}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        router.push('/cellar');
        router.refresh();
      }
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontSize: '14px', padding: '8px 0' }}
      >
        Delete Wine
      </button>
      {showConfirm && (
        <ConfirmModal
          title={`Delete ${wineName}?`}
          body="This cannot be undone. All tasting notes and bottle events will also be deleted."
          confirmLabel="Delete Permanently"
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          danger={true}
          loading={loading}
        />
      )}
    </>
  );
}
