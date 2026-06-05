import { WineCellarList } from '@/components/WineCellarList';
import type { CellarFilterState } from '@/components/FilterPanel';

export default async function CellarPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Prefer direct DB calls for server components to avoid HTTP round-trips.
  // However, using fetch with cache:'no-store' is the pattern from the plan.
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  // Fetch wines and locations in parallel
  const [winesRes, locationsRes] = await Promise.all([
    fetch(`${base}/api/wines`, { cache: 'no-store' }),
    fetch(`${base}/api/locations`, { cache: 'no-store' }),
  ]);

  const { wines } = winesRes.ok ? await winesRes.json() : { wines: [] };
  const { locations } = locationsRes.ok ? await locationsRes.json() : { locations: [] };

  // Parse URL query params for initial filter state (overrides sessionStorage per F03-FR-05)
  // Supported params: readiness, wine_type, location, country, vintage_min, vintage_max
  const initialFilters: Partial<CellarFilterState> | undefined = buildInitialFilters(searchParams);

  return (
    <main style={{ minHeight: '100vh', background: '#FAFAF7' }}>
      <WineCellarList
        wines={wines}
        locations={locations}
        initialFilters={initialFilters}
      />
    </main>
  );
}

function buildInitialFilters(
  params: Record<string, string | string[] | undefined>
): Partial<CellarFilterState> | undefined {
  const filters: Partial<CellarFilterState> = {};
  let hasAny = false;

  const get = (k: string): string | undefined => {
    const v = params[k];
    return typeof v === 'string' ? v : Array.isArray(v) ? v[0] : undefined;
  };

  if (get('readiness')) {
    filters.readiness = [get('readiness')!];
    hasAny = true;
  }
  if (get('wine_type')) {
    filters.wine_type = [get('wine_type')!];
    hasAny = true;
  }
  if (get('location')) {
    filters.location = [get('location')!];
    hasAny = true;
  }
  if (get('country')) {
    filters.country = [get('country')!];
    hasAny = true;
  }
  if (get('vintage_min')) {
    const v = parseInt(get('vintage_min')!, 10);
    if (!isNaN(v)) { filters.vintage_min = v; hasAny = true; }
  }
  if (get('vintage_max')) {
    const v = parseInt(get('vintage_max')!, 10);
    if (!isNaN(v)) { filters.vintage_max = v; hasAny = true; }
  }

  return hasAny ? filters : undefined;
}
