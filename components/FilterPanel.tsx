'use client';

import { useMemo } from 'react';
import { computeReadinessBadge } from '@/lib/readiness';
import type { Wine } from './WineCard';

export interface LocationWithCount {
  id: number;
  name: string;
  wine_count: number;
}

export interface CellarFilterState {
  search: string;
  wine_type: string[];
  producer: string[];
  country: string[];
  vintage_min: number | null;
  vintage_max: number | null;
  grape: string[];
  location: string[];
  readiness: string[];
  rating_min: number | null;
  sort: string;
}

export const DEFAULT_FILTERS: CellarFilterState = {
  search: '',
  wine_type: [],
  producer: [],
  country: [],
  vintage_min: null,
  vintage_max: null,
  grape: [],
  location: [],
  readiness: [],
  rating_min: null,
  sort: 'name_asc',
};

interface FilterPanelProps {
  filters: CellarFilterState;
  wines: Wine[];
  locations: LocationWithCount[];
  onChange: (f: CellarFilterState) => void;
  isOpen?: boolean;
  onClose?: () => void;
  filteredCount?: number;
}

const WINE_TYPES = ['Red', 'White', 'Rosé', 'Sparkling', 'Dessert', 'Fortified', 'Orange', 'Other'];
const READINESS_OPTIONS = ['Drink Now', 'Hold', 'Approaching Peak', 'Past Window', 'No Window Set'];
const RATING_OPTIONS = [
  { label: '★★★★★ (≥80 pts)', value: 80 },
  { label: '★★★★☆ (≥60 pts)', value: 60 },
  { label: '★★★☆☆ (≥40 pts)', value: 40 },
];

const labelStyle: React.CSSProperties = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: '11px',
  textTransform: 'uppercase',
  color: '#9CA3AF',
  letterSpacing: '0.05em',
  display: 'block',
  marginBottom: '8px',
  marginTop: '16px',
};

const checkboxRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '4px 0',
  cursor: 'pointer',
  fontFamily: 'Open Sans, sans-serif',
  fontSize: '14px',
  color: '#0A0A0A',
};

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

function top10ByCount(items: string[]): { value: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const item of items) {
    if (item) counts[item] = (counts[item] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export function FilterPanel({
  filters,
  wines,
  locations,
  onChange,
  isOpen = true,
  onClose,
  filteredCount,
}: FilterPanelProps) {
  // Compute dynamic counts from full wines array (not already filtered)
  const wineTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const w of wines) {
      counts[w.wine_type] = (counts[w.wine_type] || 0) + 1;
    }
    return counts;
  }, [wines]);

  const readinessCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const w of wines) {
      const badge = computeReadinessBadge(w.drinking_window_start, w.drinking_window_end);
      counts[badge] = (counts[badge] || 0) + 1;
    }
    return counts;
  }, [wines]);

  const locationOptions = useMemo(() => {
    const result = locations.map((l) => ({ value: l.name, count: l.wine_count }));
    const unknownCount = wines.filter((w) => !w.location_id).length;
    if (unknownCount > 0) result.push({ value: 'Location Unknown', count: unknownCount });
    return result;
  }, [locations, wines]);

  const countryOptions = useMemo(
    () => top10ByCount(wines.map((w) => w.country ?? '')),
    [wines]
  );

  const grapeOptions = useMemo(
    () => top10ByCount(wines.map((w) => w.grape ?? '')),
    [wines]
  );

  const producerOptions = useMemo(
    () => top10ByCount(wines.map((w) => w.producer ?? '')),
    [wines]
  );

  const panelContent = (
    <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
      {/* Wine Type */}
      <span style={labelStyle}>Wine Type</span>
      {WINE_TYPES.map((wt) => (
        <label key={wt} style={checkboxRowStyle}>
          <input
            type="checkbox"
            checked={filters.wine_type.includes(wt)}
            onChange={() => onChange({ ...filters, wine_type: toggle(filters.wine_type, wt) })}
          />
          {wt}
          <span style={{ color: '#9CA3AF', marginLeft: 'auto', fontSize: '12px' }}>
            [{wineTypeCounts[wt] || 0}]
          </span>
        </label>
      ))}

      {/* Readiness */}
      <span style={labelStyle}>Readiness</span>
      {READINESS_OPTIONS.map((ro) => (
        <label key={ro} style={checkboxRowStyle}>
          <input
            type="checkbox"
            checked={filters.readiness.includes(ro)}
            onChange={() => onChange({ ...filters, readiness: toggle(filters.readiness, ro) })}
          />
          {ro}
          <span style={{ color: '#9CA3AF', marginLeft: 'auto', fontSize: '12px' }}>
            [{readinessCounts[ro] || 0}]
          </span>
        </label>
      ))}

      {/* Storage Location */}
      {locationOptions.length > 0 && (
        <>
          <span style={labelStyle}>Storage Location</span>
          {locationOptions.map(({ value, count }) => (
            <label key={value} style={checkboxRowStyle}>
              <input
                type="checkbox"
                checked={filters.location.includes(value)}
                onChange={() => onChange({ ...filters, location: toggle(filters.location, value) })}
              />
              {value}
              <span style={{ color: '#9CA3AF', marginLeft: 'auto', fontSize: '12px' }}>
                [{count}]
              </span>
            </label>
          ))}
        </>
      )}

      {/* Country / Region */}
      {countryOptions.length > 0 && (
        <>
          <span style={labelStyle}>Country / Region</span>
          {countryOptions.map(({ value, count }) => (
            <label key={value} style={checkboxRowStyle}>
              <input
                type="checkbox"
                checked={filters.country.includes(value)}
                onChange={() => onChange({ ...filters, country: toggle(filters.country, value) })}
              />
              {value}
              <span style={{ color: '#9CA3AF', marginLeft: 'auto', fontSize: '12px' }}>
                [{count}]
              </span>
            </label>
          ))}
        </>
      )}

      {/* Vintage Year Range */}
      <span style={labelStyle}>Vintage Year</span>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="number"
          placeholder="Min"
          value={filters.vintage_min ?? ''}
          min={1900}
          max={new Date().getFullYear()}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            onChange({ ...filters, vintage_min: isNaN(v) ? null : v });
          }}
          style={{
            width: '80px',
            padding: '6px',
            border: '1px solid #E5E7EB',
            borderRadius: '2px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '14px',
          }}
        />
        <span style={{ color: '#9CA3AF', fontSize: '12px' }}>–</span>
        <input
          type="number"
          placeholder="Max"
          value={filters.vintage_max ?? ''}
          min={1900}
          max={new Date().getFullYear()}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            onChange({ ...filters, vintage_max: isNaN(v) ? null : v });
          }}
          style={{
            width: '80px',
            padding: '6px',
            border: '1px solid #E5E7EB',
            borderRadius: '2px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '14px',
          }}
        />
      </div>

      {/* Grape Variety */}
      {grapeOptions.length > 0 && (
        <>
          <span style={labelStyle}>Grape Variety</span>
          {grapeOptions.map(({ value, count }) => (
            <label key={value} style={checkboxRowStyle}>
              <input
                type="checkbox"
                checked={filters.grape.includes(value)}
                onChange={() => onChange({ ...filters, grape: toggle(filters.grape, value) })}
              />
              {value}
              <span style={{ color: '#9CA3AF', marginLeft: 'auto', fontSize: '12px' }}>
                [{count}]
              </span>
            </label>
          ))}
        </>
      )}

      {/* Rating Minimum */}
      <span style={labelStyle}>Minimum Rating</span>
      {RATING_OPTIONS.map(({ label, value }) => (
        <label key={value} style={checkboxRowStyle}>
          <input
            type="radio"
            name="rating_min"
            checked={filters.rating_min === value}
            onChange={() => onChange({ ...filters, rating_min: value })}
          />
          {label}
        </label>
      ))}
      <label style={checkboxRowStyle}>
        <input
          type="radio"
          name="rating_min"
          checked={filters.rating_min === null}
          onChange={() => onChange({ ...filters, rating_min: null })}
        />
        Any rating
      </label>

      {/* Producer */}
      {producerOptions.length > 0 && (
        <>
          <span style={labelStyle}>Producer</span>
          {producerOptions.map(({ value, count }) => (
            <label key={value} style={checkboxRowStyle}>
              <input
                type="checkbox"
                checked={filters.producer.includes(value)}
                onChange={() => onChange({ ...filters, producer: toggle(filters.producer, value) })}
              />
              {value}
              <span style={{ color: '#9CA3AF', marginLeft: 'auto', fontSize: '12px' }}>
                [{count}]
              </span>
            </label>
          ))}
        </>
      )}

      {/* Clear All Filters */}
      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_FILTERS)}
          style={{
            background: 'none',
            border: '1px solid #E5E7EB',
            borderRadius: '2px',
            padding: '8px 16px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#6B7280',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );

  // Mobile: bottom drawer
  const mobileDrawer = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: isOpen ? 'flex' : 'none',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {/* Scrim */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
        }}
        aria-hidden="true"
      />
      {/* Drawer */}
      <div
        style={{
          position: 'relative',
          background: '#FAFAF7',
          borderRadius: '8px 8px 0 0',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#0A0A0A',
            }}
          >
            Filters
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            style={{
              background: '#FBCA5C',
              border: 'none',
              borderRadius: '2px',
              padding: '8px 16px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Done ({filteredCount ?? 0})
          </button>
        </div>
        {panelContent}
      </div>
    </div>
  );

  // Desktop: inline sidebar (always visible, no portal)
  const desktopPanel = (
    <aside
      style={{
        width: '240px',
        flexShrink: 0,
        background: '#FAFAF7',
        border: '1px solid #E5E7EB',
        borderRadius: '2px',
        maxHeight: 'calc(100vh - 80px)',
        overflowY: 'auto',
        position: 'sticky',
        top: '16px',
        alignSelf: 'flex-start',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #E5E7EB',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#0A0A0A',
        }}
      >
        Filters
      </div>
      {panelContent}
    </aside>
  );

  return (
    <>
      {/* Mobile drawer */}
      <div className="filter-mobile">{mobileDrawer}</div>
      {/* Desktop sidebar */}
      <div className="filter-desktop" style={{ display: 'none' }}>
        {desktopPanel}
      </div>
      <style>{`
        @media (min-width: 1024px) {
          .filter-mobile { display: none !important; }
          .filter-desktop { display: block !important; }
        }
      `}</style>
    </>
  );
}
