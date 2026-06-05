'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { WineCard, type Wine } from './WineCard';
import { FilterPanel, type CellarFilterState, type LocationWithCount, DEFAULT_FILTERS } from './FilterPanel';
import { computeReadinessBadge } from '@/lib/readiness';

export type { Wine };

const SESSION_KEYS = {
  search: 'swa_cellar_search',
  filters: 'swa_cellar_filters',
  sort: 'swa_cellar_sort',
};

interface WineCellarListProps {
  wines: Wine[];
  locations: LocationWithCount[];
  initialFilters?: Partial<CellarFilterState>;
}

function safeGetStorage(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetStorage(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // sessionStorage unavailable (private browsing, etc.)
  }
}

function applyFilters(wines: Wine[], filters: CellarFilterState): Wine[] {
  let result = wines;

  // 1. Search filter: case-insensitive substring on name, producer, grape, country, region
  if (filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    result = result.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.producer && w.producer.toLowerCase().includes(q)) ||
        (w.grape && w.grape.toLowerCase().includes(q)) ||
        (w.country && w.country.toLowerCase().includes(q)) ||
        (w.region && w.region.toLowerCase().includes(q))
    );
  }

  // 2. wine_type filter (OR)
  if (filters.wine_type.length > 0) {
    result = result.filter((w) => filters.wine_type.includes(w.wine_type));
  }

  // 3. readiness filter (OR)
  if (filters.readiness.length > 0) {
    result = result.filter((w) => {
      const badge = computeReadinessBadge(w.drinking_window_start, w.drinking_window_end);
      return filters.readiness.includes(badge);
    });
  }

  // 4. location filter (OR)
  if (filters.location.length > 0) {
    result = result.filter((w) => {
      const loc = w.location_name ?? 'Location Unknown';
      return filters.location.includes(loc);
    });
  }

  // 5. country filter (OR)
  if (filters.country.length > 0) {
    result = result.filter((w) => w.country && filters.country.includes(w.country));
  }

  // 6. grape filter (OR)
  if (filters.grape.length > 0) {
    result = result.filter((w) => w.grape && filters.grape.includes(w.grape));
  }

  // 7. producer filter (OR)
  if (filters.producer.length > 0) {
    result = result.filter((w) => filters.producer.includes(w.producer));
  }

  // 8. vintage range
  if (filters.vintage_min !== null) {
    result = result.filter((w) => w.vintage !== null && w.vintage >= filters.vintage_min!);
  }
  if (filters.vintage_max !== null) {
    result = result.filter((w) => w.vintage !== null && w.vintage <= filters.vintage_max!);
  }

  // 9. rating_min
  if (filters.rating_min !== null) {
    result = result.filter(
      (w) => w.most_recent_rating !== null && w.most_recent_rating >= filters.rating_min!
    );
  }

  return result;
}

function sortWines(wines: Wine[], sort: string): Wine[] {
  const arr = [...wines];
  switch (sort) {
    case 'name_asc':
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    case 'name_desc':
      return arr.sort((a, b) => b.name.localeCompare(a.name));
    case 'vintage_newest':
      return arr.sort((a, b) => (b.vintage ?? 0) - (a.vintage ?? 0));
    case 'vintage_oldest':
      return arr.sort((a, b) => (a.vintage ?? 9999) - (b.vintage ?? 9999));
    case 'rating_highest':
      return arr.sort((a, b) => (b.most_recent_rating ?? -1) - (a.most_recent_rating ?? -1));
    case 'rating_lowest':
      return arr.sort(
        (a, b) => (a.most_recent_rating ?? 9999) - (b.most_recent_rating ?? 9999)
      );
    case 'quantity_most':
      return arr.sort((a, b) => b.quantity - a.quantity);
    case 'quantity_fewest':
      return arr.sort((a, b) => a.quantity - b.quantity);
    case 'recently_added':
      return arr.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    case 'recently_consumed':
      // Fall back to recently_added since we don't have last_event_date in the wine list
      return arr.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    default:
      return arr.sort((a, b) => a.name.localeCompare(b.name));
  }
}

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
  { value: 'vintage_newest', label: 'Vintage Newest' },
  { value: 'vintage_oldest', label: 'Vintage Oldest' },
  { value: 'rating_highest', label: 'Rating Highest' },
  { value: 'rating_lowest', label: 'Rating Lowest' },
  { value: 'quantity_most', label: 'Most Bottles' },
  { value: 'quantity_fewest', label: 'Fewest Bottles' },
  { value: 'recently_added', label: 'Recently Added' },
  { value: 'recently_consumed', label: 'Recently Consumed' },
];

const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  background: '#0A0A0A',
  color: '#FBCA5C',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderRadius: '2px',
  padding: '2px 8px',
  margin: '2px',
  cursor: 'pointer',
  border: 'none',
};

function renderChips(
  filters: CellarFilterState,
  onChange: (f: CellarFilterState) => void
): React.ReactNode[] {
  const chips: React.ReactNode[] = [];

  const addChip = (label: string, onRemove: () => void) => {
    chips.push(
      <button
        key={label}
        type="button"
        onClick={onRemove}
        style={chipStyle}
        aria-label={`Remove filter: ${label}`}
      >
        {label} ✕
      </button>
    );
  };

  filters.wine_type.forEach((v) =>
    addChip(`Type: ${v}`, () => onChange({ ...filters, wine_type: filters.wine_type.filter((x) => x !== v) }))
  );
  filters.readiness.forEach((v) =>
    addChip(`Readiness: ${v}`, () =>
      onChange({ ...filters, readiness: filters.readiness.filter((x) => x !== v) })
    )
  );
  filters.location.forEach((v) =>
    addChip(`Location: ${v}`, () =>
      onChange({ ...filters, location: filters.location.filter((x) => x !== v) })
    )
  );
  filters.country.forEach((v) =>
    addChip(`Country: ${v}`, () =>
      onChange({ ...filters, country: filters.country.filter((x) => x !== v) })
    )
  );
  filters.grape.forEach((v) =>
    addChip(`Grape: ${v}`, () =>
      onChange({ ...filters, grape: filters.grape.filter((x) => x !== v) })
    )
  );
  filters.producer.forEach((v) =>
    addChip(`Producer: ${v}`, () =>
      onChange({ ...filters, producer: filters.producer.filter((x) => x !== v) })
    )
  );
  if (filters.vintage_min !== null)
    addChip(`Vintage ≥ ${filters.vintage_min}`, () =>
      onChange({ ...filters, vintage_min: null })
    );
  if (filters.vintage_max !== null)
    addChip(`Vintage ≤ ${filters.vintage_max}`, () =>
      onChange({ ...filters, vintage_max: null })
    );
  if (filters.rating_min !== null)
    addChip(`Rating ≥ ${filters.rating_min}`, () =>
      onChange({ ...filters, rating_min: null })
    );
  if (filters.search.trim())
    addChip(`Search: "${filters.search}"`, () => onChange({ ...filters, search: '' }));

  return chips;
}

function hasActiveFilters(filters: CellarFilterState): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.wine_type.length > 0 ||
    filters.producer.length > 0 ||
    filters.country.length > 0 ||
    filters.grape.length > 0 ||
    filters.location.length > 0 ||
    filters.readiness.length > 0 ||
    filters.vintage_min !== null ||
    filters.vintage_max !== null ||
    filters.rating_min !== null
  );
}

export function WineCellarList({ wines, locations, initialFilters }: WineCellarListProps) {
  const [filters, setFilters] = useState<CellarFilterState>(() => {
    // URL params take precedence over sessionStorage
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      return { ...DEFAULT_FILTERS, ...initialFilters };
    }
    // Restore from sessionStorage
    try {
      const savedSearch = safeGetStorage(SESSION_KEYS.search) ?? '';
      const savedFiltersRaw = safeGetStorage(SESSION_KEYS.filters);
      const savedSort = safeGetStorage(SESSION_KEYS.sort) ?? 'name_asc';
      const savedFilters = savedFiltersRaw ? JSON.parse(savedFiltersRaw) : {};
      return { ...DEFAULT_FILTERS, ...savedFilters, search: savedSearch, sort: savedSort };
    } catch {
      return DEFAULT_FILTERS;
    }
  });

  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [ratingScale] = useState<'five_star' | 'hundred_point'>('five_star');

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (value: string) => {
      setFilters((prev) => ({ ...prev, search: value }));
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        setDebouncedSearch(value);
      }, 150);
    },
    []
  );

  useEffect(() => {
    setDebouncedSearch(filters.search);
  }, [filters.search]);

  // Save to sessionStorage on filter change
  const handleFiltersChange = useCallback((newFilters: CellarFilterState) => {
    setFilters(newFilters);
    const { search, sort, ...rest } = newFilters;
    safeSetStorage(SESSION_KEYS.search, search);
    safeSetStorage(SESSION_KEYS.filters, JSON.stringify(rest));
    safeSetStorage(SESSION_KEYS.sort, sort);
  }, []);

  // Compute filtered + sorted wines
  const displayedWines = useMemo(() => {
    const activeFilters = { ...filters, search: debouncedSearch };
    const filtered = applyFilters(wines, activeFilters);
    return sortWines(filtered, filters.sort);
  }, [wines, filters, debouncedSearch]);

  const chips = renderChips(filters, handleFiltersChange);
  const anyActive = hasActiveFilters(filters);

  return (
    <>
      {/* Filter Panel (mobile: bottom drawer; desktop: sidebar via FilterPanel internal logic) */}
      <FilterPanel
        filters={filters}
        wines={wines}
        locations={locations}
        onChange={handleFiltersChange}
        isOpen={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        filteredCount={displayedWines.length}
      />

      <div style={{ padding: '16px', paddingBottom: '72px' }}>
        {/* Page header */}
        <h1
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 900,
            fontSize: '24px',
            color: '#0A0A0A',
            margin: '0 0 16px',
          }}
        >
          My Cellar
        </h1>

        {/* Search bar */}
        <div style={{ marginBottom: '12px' }}>
          <input
            type="search"
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search wines by name, producer, grape, country..."
            aria-label="Search wines"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #E5E7EB',
              borderRadius: '2px',
              fontFamily: 'Open Sans, sans-serif',
              fontSize: '16px',
              background: '#FAFAF7',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Active filter chips */}
        {anyActive && (
          <div
            style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px', alignItems: 'center' }}
            role="list"
            aria-label="Active filters"
          >
            {chips}
            <button
              type="button"
              onClick={() => handleFiltersChange(DEFAULT_FILTERS)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Open Sans, sans-serif',
                fontSize: '13px',
                color: '#6B7280',
                padding: '2px 8px',
                textDecoration: 'underline',
              }}
            >
              Clear All
            </button>
          </div>
        )}

        {/* Toolbar: result count + sort + filter button */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              textTransform: 'uppercase',
              color: '#9CA3AF',
              letterSpacing: '0.05em',
            }}
          >
            Showing {displayedWines.length} of {wines.length} wines
          </span>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Sort dropdown */}
            <select
              value={filters.sort}
              onChange={(e) => handleFiltersChange({ ...filters, sort: e.target.value })}
              aria-label="Sort wines"
              style={{
                padding: '6px 8px',
                border: '1px solid #E5E7EB',
                borderRadius: '2px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                background: '#FAFAF7',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Filter button (mobile only — desktop uses sidebar) */}
            <button
              type="button"
              onClick={() => setFilterPanelOpen(true)}
              className="filter-btn-mobile"
              aria-label="Open filters"
              style={{
                padding: '6px 12px',
                border: '1px solid #E5E7EB',
                borderRadius: '2px',
                background: anyActive ? '#0A0A0A' : '#FAFAF7',
                color: anyActive ? '#FBCA5C' : '#0A0A0A',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer',
              }}
            >
              {anyActive ? '⚙ Filters ●' : '⚙ Filters'}
            </button>
          </div>
        </div>

        {/* Wine list */}
        {displayedWines.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 16px',
              color: '#9CA3AF',
              fontFamily: 'Open Sans, sans-serif',
              fontSize: '14px',
            }}
          >
            {wines.length === 0 ? (
              <>
                No wines in your cellar yet.{' '}
                <a
                  href="/wines/new"
                  style={{ color: '#0A0A0A', textDecoration: 'underline' }}
                >
                  Add your first wine →
                </a>
              </>
            ) : (
              'No wines match your current filters.'
            )}
          </div>
        ) : (
          <div role="list" aria-label="Wine list">
            {displayedWines.map((wine) => (
              <div key={wine.id} role="listitem">
                <WineCard wine={wine} ratingScale={ratingScale} />
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .filter-btn-mobile { display: none !important; }
        }
      `}</style>
    </>
  );
}
