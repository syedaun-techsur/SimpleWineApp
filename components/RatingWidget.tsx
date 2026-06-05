'use client';

import { displayRating } from '@/lib/rating';

interface RatingWidgetProps {
  value: number | null;          // stored 1-100 normalized value OR null
  scale: 'five_star' | 'hundred_point';
  onChange: (storedValue: number | null) => void;
  readOnly?: boolean;
}

export function RatingWidget({ value, scale, onChange, readOnly = false }: RatingWidgetProps) {
  // Suppress unused import warning — displayRating is used for potential display extensions
  void displayRating;

  if (scale === 'five_star') {
    // Display stars 1-5; value is stored 1-100, convert for display
    const starValue = value !== null ? Math.round((value / 20) * 2) / 2 : null;
    return (
      <div
        style={{ display: 'flex', gap: '4px', alignItems: 'center' }}
        role="group"
        aria-label="Rating (5 stars)"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = starValue !== null && starValue >= star;
          return (
            <button
              key={star}
              type="button"
              onClick={() => !readOnly && onChange(star * 20)}
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
              aria-pressed={filled}
              disabled={readOnly}
              style={{
                background: 'none',
                border: 'none',
                cursor: readOnly ? 'default' : 'pointer',
                fontSize: '24px',
                color: filled ? '#FBCA5C' : '#9CA3AF',
                padding: '4px',
                minWidth: '44px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ★
            </button>
          );
        })}
        {value !== null && !readOnly && (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Clear rating"
            style={{
              fontSize: '12px',
              color: '#6B7280',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              minWidth: '28px',
              minHeight: '28px',
            }}
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  // 100-point mode
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input
        type="number"
        min={1}
        max={100}
        value={value ?? ''}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (e.target.value === '') onChange(null);
          else if (!isNaN(v) && v >= 1 && v <= 100) onChange(v);
        }}
        disabled={readOnly}
        placeholder="1–100"
        aria-label="Rating (1–100 points)"
        style={{
          width: '80px',
          padding: '8px',
          border: '1px solid #E5E7EB',
          borderRadius: '2px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '16px',
        }}
      />
      <span
        style={{
          color: '#9CA3AF',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '11px',
          textTransform: 'uppercase',
        }}
      >
        / 100
      </span>
    </div>
  );
}
