import { computeReadinessBadge, type ReadinessBadge as ReadinessBadgeType } from '@/lib/readiness';

interface ReadinessBadgeProps {
  badge?: ReadinessBadgeType | 'Cellar Empty';
  start?: number | null;
  end?: number | null;
}

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  'Drink Now':        { bg: '#10B981', color: '#FFFFFF' },
  'Hold':             { bg: '#3B82F6', color: '#FFFFFF' },
  'Approaching Peak': { bg: '#F59E0B', color: '#0A0A0A' },
  'Past Window':      { bg: '#6B7280', color: '#FFFFFF' },
  'No Window Set':    { bg: '#9CA3AF', color: '#0A0A0A' },
  'Cellar Empty':     { bg: '#D1D5DB', color: '#0A0A0A' },
};

export function ReadinessBadge({ badge, start, end }: ReadinessBadgeProps) {
  const computed: ReadinessBadgeType | 'Cellar Empty' =
    badge ?? computeReadinessBadge(start ?? null, end ?? null);
  const style = BADGE_STYLES[computed] ?? BADGE_STYLES['No Window Set'];

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '2px',
        backgroundColor: style.bg,
        color: style.color,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '10px',
        fontWeight: 400,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        lineHeight: '1.6',
        whiteSpace: 'nowrap',
      }}
      aria-label={`Readiness: ${computed}`}
    >
      {computed}
    </span>
  );
}
