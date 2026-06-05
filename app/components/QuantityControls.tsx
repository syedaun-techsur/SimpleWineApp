'use client';

import { useState } from 'react';
import { CellarEmptyBadge } from './ReadinessBadge';
import { RemoveBottleModal } from './RemoveBottleModal';
import { useRouter } from 'next/navigation';

interface QuantityControlsProps {
  wineId: number;
  initialQuantity: number;
  wineName: string;
}

export function QuantityControls({ wineId, initialQuantity, wineName }: QuantityControlsProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleIncrement = async () => {
    if (quantity >= 9999 || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/wines/${wineId}/quantity`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta: 1 }),
      });
      if (res.ok) {
        const data = await res.json();
        setQuantity(data.quantity);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {quantity === 0 && <CellarEmptyBadge />}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: quantity === 0 ? '8px' : '0' }}>
        <button
          onClick={() => quantity > 0 && setShowModal(true)}
          disabled={quantity === 0 || loading}
          aria-disabled={quantity === 0}
          aria-label="Remove a bottle"
          style={{
            width: '44px', height: '44px',
            borderRadius: 'var(--radius-sm)',
            background: quantity === 0 ? 'var(--color-muted)' : 'var(--color-black)',
            color: '#ffffff',
            fontSize: '20px',
            border: 'none',
            cursor: quantity === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          −
        </button>
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '18px', minWidth: '24px', textAlign: 'center' }}>
          {quantity}
        </span>
        <button
          onClick={handleIncrement}
          disabled={quantity >= 9999 || loading}
          aria-disabled={quantity >= 9999}
          aria-label="Add a bottle"
          style={{
            width: '44px', height: '44px',
            borderRadius: 'var(--radius-sm)',
            background: quantity >= 9999 ? 'var(--color-muted)' : 'var(--color-black)',
            color: '#ffffff',
            fontSize: '20px',
            border: 'none',
            cursor: quantity >= 9999 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          +
        </button>
      </div>
      {showModal && (
        <RemoveBottleModal
          wineId={wineId}
          wineName={wineName}
          onClose={() => setShowModal(false)}
          onSuccess={(newQty) => {
            setQuantity(newQty);
            setShowModal(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
