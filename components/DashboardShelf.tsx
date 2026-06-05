import Link from 'next/link';
import { ReadinessBadge } from './ReadinessBadge';
import type { Wine } from './WineCard';

interface DashboardShelfProps {
  wines: Wine[];
  ratingScale?: 'five_star' | 'hundred_point';
}

export function DashboardShelf({ wines, ratingScale = 'five_star' }: DashboardShelfProps) {
  if (wines.length === 0) {
    return (
      <p
        style={{
          color: '#9CA3AF',
          fontFamily: 'Open Sans, sans-serif',
          fontSize: '14px',
          textAlign: 'center',
          padding: '24px 0',
        }}
      >
        No wines are ready to drink right now.
      </p>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch' as never,
        paddingBottom: '8px',
        scrollbarWidth: 'none',
      }}
    >
      {wines.map((wine) => {
        const ratingDisplay =
          wine.most_recent_rating != null
            ? ratingScale === 'five_star'
              ? '★'.repeat(Math.round(wine.most_recent_rating / 20)) +
                '☆'.repeat(5 - Math.round(wine.most_recent_rating / 20))
              : String(wine.most_recent_rating)
            : null;

        return (
          <Link
            key={wine.id}
            href={`/wines/${wine.id}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minWidth: '160px',
              width: '160px',
              height: '120px',
              background: '#FAFAF7',
              border: '1px solid #E5E7EB',
              borderRadius: '2px',
              padding: '8px',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: 'Open Sans, sans-serif',
                  fontWeight: 700,
                  fontSize: '14px',
                  color: '#0A0A0A',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {wine.name}
              </p>
              <p
                style={{
                  fontFamily: 'Open Sans, sans-serif',
                  fontSize: '12px',
                  color: '#6B7280',
                  margin: '2px 0 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {wine.producer} {wine.vintage}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {ratingDisplay && (
                <span style={{ color: '#FBCA5C', fontSize: '13px' }}>{ratingDisplay}</span>
              )}
              <ReadinessBadge badge="Drink Now" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
