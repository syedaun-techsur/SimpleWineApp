'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ReadinessBadge } from './ReadinessBadge';
import { displayRating } from '@/lib/rating';

export interface Wine {
  id: number;
  name: string;
  producer: string;
  vintage: number | null;
  wine_type: string;
  grape: string | null;
  country: string | null;
  region: string | null;
  bottle_size: string | null;
  quantity: number;
  location_id: number | null;
  location_name: string | null;
  purchase_date: string | null;
  purchase_source: string | null;
  purchase_price: string | null;
  drinking_window_start: number | null;
  drinking_window_end: number | null;
  notes: string | null;
  most_recent_rating: number | null;
  created_at: string;
  updated_at: string;
}

interface WineCardProps {
  wine: Wine;
  ratingScale: 'five_star' | 'hundred_point';
  onIncrement?: () => void;
  onDecrement?: () => void;
}

export function WineCard({ wine, ratingScale, onIncrement, onDecrement }: WineCardProps) {
  const [quantity, setQuantity] = useState(wine.quantity);
  const [updating, setUpdating] = useState(false);

  const badge = quantity === 0 ? 'Cellar Empty' : undefined;
  const ratingDisplay =
    wine.most_recent_rating != null
      ? displayRating(wine.most_recent_rating, ratingScale)
      : '—';

  const handleIncrement = async () => {
    if (updating || quantity >= 9999) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/wines/${wine.id}/quantity`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta: 1, event_type: null }),
      });
      if (res.ok) {
        setQuantity((q) => q + 1);
      }
    } catch {
      // ignore
    } finally {
      setUpdating(false);
    }
    onIncrement?.();
  };

  const handleDecrement = async () => {
    if (updating || quantity === 0) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/wines/${wine.id}/quantity`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta: -1, event_type: 'Consumed' }),
      });
      if (res.ok) {
        setQuantity((q) => Math.max(0, q - 1));
      }
    } catch {
      // ignore
    } finally {
      setUpdating(false);
    }
    onDecrement?.();
  };

  return (
    <div
      style={{
        background: '#FAFAF7',
        border: '1px solid #E5E7EB',
        borderRadius: '2px',
        padding: '12px',
        marginBottom: '8px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '8px',
        }}
      >
        <Link
          href={`/wines/${wine.id}`}
          style={{
            color: '#0A0A0A',
            fontWeight: 600,
            fontSize: '16px',
            textDecoration: 'none',
            fontFamily: 'Open Sans, sans-serif',
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {wine.name}
        </Link>
        <ReadinessBadge
          badge={badge}
          start={wine.drinking_window_start}
          end={wine.drinking_window_end}
        />
      </div>

      <p
        style={{
          color: '#6B7280',
          fontSize: '13px',
          margin: '4px 0',
          fontFamily: 'Open Sans, sans-serif',
        }}
      >
        {wine.producer}
        {wine.vintage ? ` · ${wine.vintage}` : ''}
        {' · '}
        {wine.wine_type}
      </p>

      <p
        style={{
          color: '#9CA3AF',
          fontSize: '12px',
          margin: '4px 0',
          fontFamily: 'Open Sans, sans-serif',
        }}
      >
        📍 {wine.location_name ?? 'Location Unknown'}
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '8px',
        }}
      >
        <span style={{ color: '#FBCA5C', fontSize: '14px' }}>
          {ratingScale === 'five_star' && wine.most_recent_rating != null
            ? '★'.repeat(Math.round(wine.most_recent_rating / 20)) +
              '☆'.repeat(5 - Math.round(wine.most_recent_rating / 20))
            : String(ratingDisplay)}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={handleDecrement}
            disabled={quantity === 0 || updating}
            aria-disabled={quantity === 0}
            aria-label="Remove a bottle"
            style={{
              width: '36px',
              height: '36px',
              border: '1px solid #E5E7EB',
              borderRadius: '2px',
              background: '#FAFAF7',
              cursor: quantity === 0 || updating ? 'not-allowed' : 'pointer',
              color: quantity === 0 ? '#9CA3AF' : '#0A0A0A',
              fontSize: '16px',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            −
          </button>
          <span
            style={{
              minWidth: '24px',
              textAlign: 'center',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '14px',
            }}
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={handleIncrement}
            disabled={quantity >= 9999 || updating}
            aria-disabled={quantity >= 9999}
            aria-label="Add a bottle"
            style={{
              width: '36px',
              height: '36px',
              border: '1px solid #E5E7EB',
              borderRadius: '2px',
              background: '#FAFAF7',
              cursor: quantity >= 9999 || updating ? 'not-allowed' : 'pointer',
              color: quantity >= 9999 ? '#9CA3AF' : '#0A0A0A',
              fontSize: '16px',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
