import { notFound } from 'next/navigation';
import Link from 'next/link';
import { WineFormClient } from '../../new/WineFormClient';

export default async function EditWinePage({ params }: { params: { id: string } }) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  let wine: Record<string, unknown> | null = null;
  let locations: { id: number; name: string }[] = [];

  try {
    const [wineRes, locsRes] = await Promise.all([
      fetch(`${base}/api/wines/${params.id}`, { cache: 'no-store' }),
      fetch(`${base}/api/locations`, { cache: 'no-store' }),
    ]);
    if (wineRes.status === 404) notFound();
    if (!wineRes.ok) throw new Error('Failed to fetch wine');
    const wineData = await wineRes.json();
    wine = wineData.wine;
    if (locsRes.ok) {
      const locsData = await locsRes.json();
      locations = locsData.locations || [];
    }
  } catch {
    notFound();
  }

  if (!wine) notFound();

  // Check if location_id references a deleted location
  const currentLocationId = wine.location_id as number | null;
  const locationExists = currentLocationId
    ? locations.some(l => l.id === currentLocationId)
    : false;
  const locationUnknown = currentLocationId !== null && !locationExists;

  const initialData = {
    name: String(wine.name || ''),
    producer: String(wine.producer || ''),
    vintage: String(wine.vintage || ''),
    wine_type: String(wine.wine_type || ''),
    quantity: String(wine.quantity ?? ''),
    location_id: locationUnknown ? '' : String(wine.location_id || ''),
    grape: String(wine.grape || ''),
    country: String(wine.country || ''),
    region: String(wine.region || ''),
    bottle_size: String(wine.bottle_size || '750ml'),
    purchase_date: wine.purchase_date ? String(wine.purchase_date).split('T')[0] : '',
    purchase_source: String(wine.purchase_source || ''),
    purchase_price: wine.purchase_price ? String(wine.purchase_price) : '',
    drinking_window_start: wine.drinking_window_start ? String(wine.drinking_window_start) : '',
    drinking_window_end: wine.drinking_window_end ? String(wine.drinking_window_end) : '',
    notes: String(wine.notes || ''),
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '24px' }}>Edit Wine</h1>
        <Link href={`/wines/${wine.id}`} style={{ color: '#6B7280', fontSize: '14px', textDecoration: 'none' }}>← Cancel</Link>
      </div>
      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>{String(wine.name)} {String(wine.vintage)}</p>
      <WineFormClient
        locations={locations}
        mode="edit"
        initialData={initialData}
        wineId={Number(wine.id)}
        wineName={`${wine.name} ${wine.vintage}`}
      />
    </div>
  );
}
