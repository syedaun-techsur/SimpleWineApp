import Link from 'next/link';
import { DashboardShelf } from '@/components/DashboardShelf';

export const dynamic = 'force-dynamic';

// ── Type definitions for GET /api/dashboard response ─────────────────────────

interface DashboardStats {
  total_bottles: number;
  unique_wines: number;
  drink_now_count: number;
  approaching_peak_count: number;
}

interface DashboardWine {
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

interface TypeBreakdownItem {
  wine_type: string;
  wine_count: number;
  bottle_count: number;
}

interface CountryBreakdownItem {
  country: string;
  wine_count: number;
}

interface DecadeBreakdownItem {
  decade: number;
  wine_count: number;
}

interface RecentlyAddedItem {
  id: number;
  name: string;
  vintage: number | null;
  created_at: string;
}

interface RecentlyConsumedItem {
  event_id: number;
  event_type: string;
  event_date: string;
  wine_id: number;
  wine_name: string;
  producer: string;
  vintage: number | null;
}

interface HighestRatedItem {
  wine_id: number;
  wine_name: string;
  producer: string;
  vintage: number | null;
  rating: number;
  tasted_on: string;
}

interface DashboardResponse {
  stats: DashboardStats;
  drink_now_wines: DashboardWine[];
  type_breakdown: TypeBreakdownItem[];
  country_breakdown: CountryBreakdownItem[];
  decade_breakdown: DecadeBreakdownItem[];
  recently_added: RecentlyAddedItem[];
  recently_consumed: RecentlyConsumedItem[];
  highest_rated: HighestRatedItem[];
}

// ── Dashboard Server Component ────────────────────────────────────────────────

export default async function DashboardPage() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  // Fetch dashboard data and settings in parallel — cache:'no-store' ensures fresh data every request
  const [dashRes, settingsRes] = await Promise.all([
    fetch(`${base}/api/dashboard`, { cache: 'no-store' }),
    fetch(`${base}/api/settings`, { cache: 'no-store' }),
  ]);

  const data: DashboardResponse | null = dashRes.ok ? await dashRes.json() : null;
  const settings = settingsRes.ok ? await settingsRes.json() : { rating_scale: 'five_star' };
  const ratingScale: 'five_star' | 'hundred_point' = settings?.rating_scale ?? 'five_star';

  // Graceful fallback if dashboard fetch fails
  const stats: DashboardStats = data?.stats ?? {
    total_bottles: 0,
    unique_wines: 0,
    drink_now_count: 0,
    approaching_peak_count: 0,
  };
  const drinkNowWines: DashboardWine[] = data?.drink_now_wines ?? [];
  const typeBreakdown: TypeBreakdownItem[] = data?.type_breakdown ?? [];
  const countryBreakdown: CountryBreakdownItem[] = data?.country_breakdown ?? [];
  const decadeBreakdown: DecadeBreakdownItem[] = data?.decade_breakdown ?? [];
  const recentlyAdded: RecentlyAddedItem[] = data?.recently_added ?? [];
  const recentlyConsumed: RecentlyConsumedItem[] = data?.recently_consumed ?? [];
  const highestRated: HighestRatedItem[] = data?.highest_rated ?? [];

  // For bar charts: find max values for relative bar widths
  const maxTypeBottles = Math.max(1, ...typeBreakdown.map((t) => t.bottle_count));
  const maxCountryWines = Math.max(1, ...countryBreakdown.map((c) => c.wine_count));
  const maxDecadeWines = Math.max(1, ...decadeBreakdown.map((d) => d.wine_count));

  const sectionLabelStyle: React.CSSProperties = {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#9CA3AF',
    margin: '24px 0 12px',
    display: 'block',
  };

  const statTileStyle = (accentColor?: string): React.CSSProperties => ({
    background: '#FAFAF7',
    border: '1px solid #E5E7EB',
    borderLeft: accentColor ? `4px solid ${accentColor}` : '1px solid #E5E7EB',
    borderRadius: '2px',
    padding: '8px 12px',
    textDecoration: 'none',
    display: 'block',
    flex: 1,
    minWidth: 0,
  });

  return (
    <main
      style={{
        background: '#FAFAF7',
        minHeight: '100vh',
        padding: '16px',
        paddingBottom: '80px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      {/* Stat Tiles — 2×2 mobile, 4-in-a-row desktop */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
          marginBottom: '8px',
        }}
      >
        {/* Total Bottles */}
        <Link href="/cellar" style={statTileStyle()}>
          <div
            style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 900,
              fontSize: '36px',
              color: '#0A0A0A',
              lineHeight: 1,
            }}
          >
            {stats.total_bottles}
          </div>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              textTransform: 'uppercase',
              color: '#9CA3AF',
              marginTop: '4px',
              letterSpacing: '0.05em',
            }}
          >
            Total Bottles
          </div>
        </Link>

        {/* Unique Wines */}
        <Link href="/cellar" style={statTileStyle()}>
          <div
            style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 900,
              fontSize: '36px',
              color: '#0A0A0A',
              lineHeight: 1,
            }}
          >
            {stats.unique_wines}
          </div>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              textTransform: 'uppercase',
              color: '#9CA3AF',
              marginTop: '4px',
              letterSpacing: '0.05em',
            }}
          >
            Unique Wines
          </div>
        </Link>

        {/* Drink Now */}
        <Link href="/cellar?readiness=Drink+Now" style={statTileStyle('#10B981')}>
          <div
            style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 900,
              fontSize: '36px',
              color: '#10B981',
              lineHeight: 1,
            }}
          >
            {stats.drink_now_count}
          </div>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              textTransform: 'uppercase',
              color: '#9CA3AF',
              marginTop: '4px',
              letterSpacing: '0.05em',
            }}
          >
            Drink Now
          </div>
        </Link>

        {/* Approaching Peak */}
        <Link href="/cellar?readiness=Approaching+Peak" style={statTileStyle('#F59E0B')}>
          <div
            style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 900,
              fontSize: '36px',
              color: '#F59E0B',
              lineHeight: 1,
            }}
          >
            {stats.approaching_peak_count}
          </div>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              textTransform: 'uppercase',
              color: '#9CA3AF',
              marginTop: '4px',
              letterSpacing: '0.05em',
            }}
          >
            Approaching Peak
          </div>
        </Link>
      </div>

      {/* Drink Now Shelf */}
      <span style={sectionLabelStyle}>Drink Now</span>
      <DashboardShelf wines={drinkNowWines} ratingScale={ratingScale} />

      {/* Collection Breakdown */}
      {typeBreakdown.length > 0 || countryBreakdown.length > 0 || decadeBreakdown.length > 0 ? (
        <section aria-label="Collection Breakdown">
          {/* Wine Type */}
          {typeBreakdown.length > 0 && (
            <>
              <span style={sectionLabelStyle}>Wine Type</span>
              {typeBreakdown.map((item) => (
                <Link
                  key={item.wine_type}
                  href={`/cellar?wine_type=${encodeURIComponent(item.wine_type)}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 0',
                    textDecoration: 'none',
                    color: '#0A0A0A',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Open Sans, sans-serif',
                      fontSize: '14px',
                      minWidth: '80px',
                    }}
                  >
                    {item.wine_type}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      background: '#E5E7EB',
                      height: '8px',
                      borderRadius: '2px',
                    }}
                  >
                    <div
                      style={{
                        width: `${(item.bottle_count / maxTypeBottles) * 100}%`,
                        background: '#FBCA5C',
                        height: '8px',
                        borderRadius: '2px',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '12px',
                      color: '#6B7280',
                      minWidth: '80px',
                      textAlign: 'right',
                    }}
                  >
                    {item.bottle_count} btl · {item.wine_count} wines
                  </span>
                </Link>
              ))}
            </>
          )}

          {/* Country / Region */}
          {countryBreakdown.length > 0 && (
            <>
              <span style={sectionLabelStyle}>Country / Region (Top 10)</span>
              {countryBreakdown.map((item) => (
                <Link
                  key={item.country}
                  href={`/cellar?country=${encodeURIComponent(item.country)}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 0',
                    textDecoration: 'none',
                    color: '#0A0A0A',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Open Sans, sans-serif',
                      fontSize: '14px',
                      minWidth: '80px',
                    }}
                  >
                    {item.country}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      background: '#E5E7EB',
                      height: '8px',
                      borderRadius: '2px',
                    }}
                  >
                    <div
                      style={{
                        width: `${(item.wine_count / maxCountryWines) * 100}%`,
                        background: '#FBCA5C',
                        height: '8px',
                        borderRadius: '2px',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '12px',
                      color: '#6B7280',
                      minWidth: '60px',
                      textAlign: 'right',
                    }}
                  >
                    {item.wine_count} wines →
                  </span>
                </Link>
              ))}
            </>
          )}

          {/* Vintage Decade */}
          {decadeBreakdown.length > 0 && (
            <>
              <span style={sectionLabelStyle}>Vintage Decade</span>
              {decadeBreakdown.map((item) => (
                <Link
                  key={item.decade}
                  href={`/cellar?vintage_min=${item.decade}&vintage_max=${item.decade + 9}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 0',
                    textDecoration: 'none',
                    color: '#0A0A0A',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Open Sans, sans-serif',
                      fontSize: '14px',
                      minWidth: '80px',
                    }}
                  >
                    {item.decade}s
                  </span>
                  <div
                    style={{
                      flex: 1,
                      background: '#E5E7EB',
                      height: '8px',
                      borderRadius: '2px',
                    }}
                  >
                    <div
                      style={{
                        width: `${(item.wine_count / maxDecadeWines) * 100}%`,
                        background: '#FBCA5C',
                        height: '8px',
                        borderRadius: '2px',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '12px',
                      color: '#6B7280',
                      minWidth: '60px',
                      textAlign: 'right',
                    }}
                  >
                    {item.wine_count} wines
                  </span>
                </Link>
              ))}
            </>
          )}
        </section>
      ) : (
        <p
          style={{
            color: '#9CA3AF',
            fontFamily: 'Open Sans, sans-serif',
            fontSize: '14px',
            margin: '16px 0',
          }}
        >
          Add wines to see your collection breakdown.
        </p>
      )}

      {/* Recently Added */}
      <span style={sectionLabelStyle}>Recently Added</span>
      {recentlyAdded.length === 0 ? (
        <p style={{ color: '#9CA3AF', fontFamily: 'Open Sans, sans-serif', fontSize: '14px' }}>
          No wines added yet.{' '}
          <Link href="/wines/new" style={{ color: '#0A0A0A', textDecoration: 'underline' }}>
            Add your first wine →
          </Link>
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {recentlyAdded.map((wine) => (
            <li key={wine.id} style={{ borderBottom: '1px solid #E5E7EB', padding: '8px 0' }}>
              <Link
                href={`/wines/${wine.id}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  textDecoration: 'none',
                  color: '#0A0A0A',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Open Sans, sans-serif',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  {wine.name} {wine.vintage}
                </span>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    color: '#9CA3AF',
                  }}
                >
                  {new Date(wine.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Recently Consumed */}
      <span style={sectionLabelStyle}>Recently Consumed</span>
      {recentlyConsumed.length === 0 ? (
        <p style={{ color: '#9CA3AF', fontFamily: 'Open Sans, sans-serif', fontSize: '14px' }}>
          No consumption events recorded yet.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {recentlyConsumed.map((item) => (
            <li
              key={item.event_id}
              style={{ borderBottom: '1px solid #E5E7EB', padding: '8px 0' }}
            >
              <Link
                href={`/wines/${item.wine_id}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  textDecoration: 'none',
                  color: '#0A0A0A',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontFamily: 'Open Sans, sans-serif', fontSize: '14px' }}>
                  {item.wine_name} {item.vintage}
                  <span
                    style={{
                      marginLeft: '8px',
                      display: 'inline-block',
                      padding: '1px 6px',
                      borderRadius: '2px',
                      background: item.event_type === 'Consumed' ? '#EF4444' : '#8B5CF6',
                      color: '#FFFFFF',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '10px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.event_type}
                  </span>
                </span>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    color: '#9CA3AF',
                  }}
                >
                  {new Date(item.event_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Highest Rated */}
      <span style={sectionLabelStyle}>Highest Rated</span>
      {highestRated.length === 0 ? (
        <p style={{ color: '#9CA3AF', fontFamily: 'Open Sans, sans-serif', fontSize: '14px' }}>
          Add tasting notes and ratings to see your top wines here.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {highestRated.map((item) => {
            const displayedRating =
              ratingScale === 'five_star'
                ? '★'.repeat(Math.round(item.rating / 20)) +
                  '☆'.repeat(5 - Math.round(item.rating / 20))
                : String(item.rating);
            return (
              <li
                key={item.wine_id}
                style={{ borderBottom: '1px solid #E5E7EB', padding: '8px 0' }}
              >
                <Link
                  href={`/wines/${item.wine_id}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    textDecoration: 'none',
                    color: '#0A0A0A',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Open Sans, sans-serif',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  >
                    {item.wine_name} {item.vintage}
                  </span>
                  <span style={{ color: '#FBCA5C', fontSize: '14px' }}>
                    {displayedRating} →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
