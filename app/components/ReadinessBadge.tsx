interface ReadinessBadgeProps {
  start?: number | null;
  end?: number | null;
  size?: 'sm' | 'md';
}

type BadgeState = 'drink-now' | 'hold' | 'approaching' | 'past' | 'no-window' | 'cellar-empty';

export function computeReadinessBadge(start?: number | null, end?: number | null): BadgeState {
  if (!start && !end) return 'no-window';
  const cy = new Date().getFullYear();
  // start-only window
  if (start && !end) {
    if (cy >= start) return 'drink-now';
    if (cy === start - 1 || cy === start - 2) return 'approaching';
    return 'hold';
  }
  // end-only window
  if (!start && end) {
    if (cy > end) return 'past';
    return 'drink-now';
  }
  // Both set
  if (cy > end!) return 'past';
  if (cy >= start! && cy <= end!) return 'drink-now';
  if (cy === start! - 1 || cy === start! - 2) return 'approaching';
  return 'hold';
}

const BADGE_CONFIG: Record<BadgeState, { label: string; bg: string; color: string }> = {
  'drink-now':   { label: 'Drink Now',       bg: '#10B981', color: '#ffffff' },
  'hold':        { label: 'Hold',             bg: '#3B82F6', color: '#ffffff' },
  'approaching': { label: 'Approaching Peak', bg: '#F59E0B', color: '#0A0A0A' },
  'past':        { label: 'Past Window',      bg: '#6B7280', color: '#ffffff' },
  'no-window':   { label: 'No Window Set',    bg: '#9CA3AF', color: '#0A0A0A' },
  'cellar-empty':{ label: 'Cellar Empty',     bg: '#D1D5DB', color: '#0A0A0A' },
};

export function ReadinessBadge({ start, end, size = 'md' }: ReadinessBadgeProps) {
  const state = computeReadinessBadge(start, end);
  const config = BADGE_CONFIG[state];
  return (
    <span
      className="badge"
      style={{
        background: config.bg,
        color: config.color,
        fontSize: size === 'sm' ? '10px' : '11px',
      }}
    >
      {config.label}
    </span>
  );
}

export function CellarEmptyBadge() {
  const config = BADGE_CONFIG['cellar-empty'];
  return (
    <span
      className="badge"
      style={{ background: config.bg, color: config.color }}
    >
      Cellar Empty
    </span>
  );
}
