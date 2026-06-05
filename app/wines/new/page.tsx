import Link from 'next/link';
import { WineFormClient } from './WineFormClient';

export default async function NewWinePage() {
  // Fetch locations for the dropdown (server-side)
  let locations: { id: number; name: string }[] = [];
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/locations`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      locations = data.locations || [];
    }
  } catch {
    // locations stays empty; form shows no-locations guidance
  }

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '24px' }}>Add Wine</h1>
        <Link href="/" style={{ color: '#6B7280', fontSize: '14px', textDecoration: 'none' }}>← Cancel</Link>
      </div>
      <WineFormClient locations={locations} mode="create" />
    </div>
  );
}
