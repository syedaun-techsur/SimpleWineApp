export type ReadinessBadge =
  | 'Drink Now'
  | 'Hold'
  | 'Approaching Peak'
  | 'Past Window'
  | 'No Window Set';

/**
 * Compute readiness badge from drinking window + current year.
 * Pure function — no side effects; never cached.
 * From TechArch §4.4 client-side TypeScript specification.
 */
export function computeReadinessBadge(
  start: number | null,
  end: number | null,
  currentYear: number = new Date().getFullYear()
): ReadinessBadge {
  if (start === null && end === null) return 'No Window Set';
  if (start !== null && end !== null) {
    if (currentYear >= start && currentYear <= end) return 'Drink Now';
    if (currentYear >= start - 2 && currentYear < start) return 'Approaching Peak';
    if (currentYear < start - 2) return 'Hold';
    if (currentYear > end) return 'Past Window';
  }
  if (start !== null && end === null) {
    if (currentYear >= start) return 'Drink Now';
    if (currentYear >= start - 2) return 'Approaching Peak';
    return 'Hold';
  }
  if (end !== null && start === null) {
    if (currentYear <= end) return 'Drink Now';
    return 'Past Window';
  }
  return 'No Window Set';
}
