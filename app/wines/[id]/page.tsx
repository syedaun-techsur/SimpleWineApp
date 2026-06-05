import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ReadinessBadge } from '../../components/ReadinessBadge';

export const dynamic = 'force-dynamic';
import { QuantityControls } from '../../components/QuantityControls';
import { WineDeleteButton } from './WineDeleteButton';

interface Wine {
  id: number; name: string; producer: string; vintage: number; wine_type: string;
  grape?: string; country?: string; region?: string; bottle_size?: string;
  quantity: number; location_id?: number; location_name?: string;
  purchase_date?: string; purchase_source?: string; purchase_price?: string;
  drinking_window_start?: number; drinking_window_end?: number; notes?: string;
  most_recent_rating?: number; created_at: string; updated_at: string;
}

interface TastingNote {
  id: number; tasted_on: string; appearance?: string; aroma?: string;
  flavor?: string; finish?: string; rating?: number; would_buy_again?: string;
  occasion?: string; guest_feedback?: string; created_at: string;
}

interface BottleEvent {
  id: number; event_type: 'Consumed' | 'Gifted' | 'Opened';
  event_date: string; note?: string; created_at: string;
}

const EVENT_COLORS: Record<string, string> = {
  Consumed: '#EF4444', Gifted: '#8B5CF6', Opened: '#F97316',
};

function formatRating(rating: number) {
  const stars = Math.round(rating / 20);
  return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}

export default async function WineDetailPage({ params }: { params: { id: string } }) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  let wine: Wine | null = null;
  let tastingNotes: TastingNote[] = [];
  let bottleEvents: BottleEvent[] = [];

  try {
    const res = await fetch(`${base}/api/wines/${params.id}`, { cache: 'no-store' });
    if (res.status === 404) notFound();
    if (!res.ok) throw new Error('Failed to fetch wine');
    const data = await res.json();
    wine = data.wine;
    tastingNotes = data.tasting_notes || [];
    bottleEvents = data.bottle_events || [];
  } catch {
    notFound();
  }

  if (!wine) notFound();

  return (
    <div className="page-content">
      {/* Sub-header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <Link href="/cellar" style={{ fontSize: '14px', color: '#6B7280', textDecoration: 'none' }}>← Back to Cellar</Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href={`/wines/${wine.id}/edit`} className="btn btn-secondary" style={{ minHeight: '36px', fontSize: '13px', padding: '0 12px' }}>Edit</Link>
        </div>
      </div>

      {/* Hero section */}
      <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--color-gold)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          {wine.quantity === 0
            ? <span className="badge" style={{ background: '#D1D5DB', color: 'var(--color-black)' }}>CELLAR EMPTY</span>
            : <ReadinessBadge start={wine.drinking_window_start} end={wine.drinking_window_end} />
          }
          {wine.most_recent_rating && (
            <span style={{ fontSize: '14px', color: 'var(--color-gold)' }}>
              {formatRating(wine.most_recent_rating)}
            </span>
          )}
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '24px', marginBottom: '4px' }}>
          {wine.name} {wine.vintage}
        </h1>
        <p style={{ fontSize: '15px', color: '#6B7280', marginBottom: '8px' }}>{wine.producer}</p>

        <p style={{ fontSize: '14px', color: '#374151', marginBottom: '4px' }}>
          {[wine.wine_type, wine.region, wine.country].filter(Boolean).join(' · ')}
        </p>
        {wine.grape && <p style={{ fontSize: '14px', color: '#374151', marginBottom: '4px' }}>{wine.grape}</p>}
        {wine.bottle_size && <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>{wine.bottle_size}</p>}

        <div style={{ marginTop: '12px', marginBottom: '12px' }}>
          {wine.location_name ? (
            <p style={{ fontSize: '14px', fontWeight: 700 }}>📍 {wine.location_name}</p>
          ) : (
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-error)' }}>
              📍 Location Unknown —{' '}
              <Link href={`/wines/${wine.id}/edit`} style={{ color: 'var(--color-error)' }}>edit wine to assign a location</Link>
            </p>
          )}
        </div>

        <div>
          <span className="label-mono" style={{ display: 'block', marginBottom: '8px' }}>Quantity</span>
          <QuantityControls wineId={wine.id} initialQuantity={wine.quantity} wineName={`${wine.name} ${wine.vintage}`} />
        </div>
      </div>

      {/* Drinking Window */}
      <div style={{ marginBottom: '24px' }}>
        <div className="section-header">Drinking Window</div>
        {wine.drinking_window_start || wine.drinking_window_end ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '15px', fontWeight: 600 }}>
              {wine.drinking_window_start || '?'} — {wine.drinking_window_end || '?'}
            </span>
            <ReadinessBadge start={wine.drinking_window_start} end={wine.drinking_window_end} />
          </div>
        ) : (
          <p style={{ fontSize: '14px', color: '#6B7280' }}>
            No drinking window set.{' '}
            <Link href={`/wines/${wine.id}/edit`} style={{ color: 'var(--color-gold)' }}>Edit wine to add one →</Link>
          </p>
        )}
      </div>

      {/* Purchase Details */}
      {(wine.purchase_date || wine.purchase_source || wine.purchase_price) && (
        <div style={{ marginBottom: '24px' }}>
          <div className="section-header">Purchase Details</div>
          {wine.purchase_date && <p style={{ fontSize: '14px', marginBottom: '4px' }}>Purchased: {wine.purchase_date}</p>}
          {wine.purchase_source && <p style={{ fontSize: '14px', marginBottom: '4px' }}>From: {wine.purchase_source}</p>}
          {wine.purchase_price && <p style={{ fontSize: '14px' }}>Price: ${wine.purchase_price} / bottle</p>}
        </div>
      )}

      {/* General Notes */}
      {wine.notes && (
        <div style={{ marginBottom: '24px' }}>
          <div className="section-header">General Notes</div>
          <p style={{ fontSize: '14px', lineHeight: 1.6 }}>{wine.notes}</p>
        </div>
      )}

      {/* Tasting Notes */}
      <div style={{ marginBottom: '24px' }}>
        <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Tasting Notes</span>
          <Link href={`/wines/${wine.id}/notes/new`} style={{ fontSize: '12px', color: 'var(--color-gold)', textDecoration: 'none', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
            + ADD TASTING NOTE
          </Link>
        </div>
        {tastingNotes.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#6B7280' }}>
            No tasting notes yet.{' '}
            <Link href={`/wines/${wine.id}/notes/new`} style={{ color: 'var(--color-gold)' }}>Add a Tasting Note →</Link>
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tastingNotes.map(note => (
              <div key={note.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>{new Date(note.tasted_on).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  {note.rating && <span style={{ fontSize: '14px', color: 'var(--color-gold)' }}>{formatRating(note.rating)}</span>}
                </div>
                {note.occasion && (
                  <span className="badge" style={{ background: '#E5E7EB', color: 'var(--color-black)', marginBottom: '8px', marginRight: '8px' }}>
                    {note.occasion.toUpperCase()}
                  </span>
                )}
                {note.would_buy_again && (
                  <span className="badge" style={{
                    background: note.would_buy_again === 'yes' ? '#D1FAE5' : note.would_buy_again === 'no' ? '#FEE2E2' : '#FEF3C7',
                    color: 'var(--color-black)', marginBottom: '8px',
                  }}>
                    {note.would_buy_again === 'yes' ? '✓ Would Buy Again' : note.would_buy_again === 'no' ? '✗ Would Not Buy Again' : '? Maybe'}
                  </span>
                )}
                {note.appearance && (
                  <div style={{ marginBottom: '8px' }}>
                    <span className="label-mono" style={{ display: 'block', marginBottom: '2px' }}>Appearance</span>
                    <p style={{ fontSize: '13px' }}>{note.appearance}</p>
                  </div>
                )}
                {note.aroma && (
                  <div style={{ marginBottom: '8px' }}>
                    <span className="label-mono" style={{ display: 'block', marginBottom: '2px' }}>Aroma</span>
                    <p style={{ fontSize: '13px' }}>{note.aroma}</p>
                  </div>
                )}
                {note.flavor && (
                  <div style={{ marginBottom: '8px' }}>
                    <span className="label-mono" style={{ display: 'block', marginBottom: '2px' }}>Flavor</span>
                    <p style={{ fontSize: '13px' }}>{note.flavor}</p>
                  </div>
                )}
                {note.finish && (
                  <div style={{ marginBottom: '8px' }}>
                    <span className="label-mono" style={{ display: 'block', marginBottom: '2px' }}>Finish</span>
                    <p style={{ fontSize: '13px' }}>{note.finish}</p>
                  </div>
                )}
                {note.guest_feedback && (
                  <div>
                    <span className="label-mono" style={{ display: 'block', marginBottom: '2px' }}>Guest Feedback</span>
                    <p style={{ fontSize: '13px' }}>{note.guest_feedback}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottle History */}
      {bottleEvents.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div className="section-header">Bottle History</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {bottleEvents.map(event => (
              <div key={event.id} className="card" style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#6B7280', minWidth: '100px' }}>
                    {new Date(event.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="badge" style={{ background: EVENT_COLORS[event.event_type] || '#9CA3AF', color: '#ffffff' }}>
                    {event.event_type.toUpperCase()}
                  </span>
                </div>
                {event.note && <p style={{ fontSize: '13px', color: '#374151', marginTop: '6px' }}>{event.note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger Zone — Delete */}
      <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
        <WineDeleteButton wineId={wine.id} wineName={`${wine.name} ${wine.vintage}`} />
      </div>
    </div>
  );
}
