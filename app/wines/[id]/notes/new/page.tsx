import { notFound } from 'next/navigation';
import { TastingNoteForm } from '@/components/TastingNoteForm';

export default async function NewTastingNotePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { date?: string };
}) {
  const wineId = parseInt(params.id, 10);
  if (isNaN(wineId)) notFound();

  // Fetch wine and settings in parallel
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const [wineRes, settingsRes] = await Promise.all([
    fetch(`${base}/api/wines/${wineId}`, { cache: 'no-store' }),
    fetch(`${base}/api/settings`, { cache: 'no-store' }),
  ]);

  if (wineRes.status === 404) notFound();

  const wineData = wineRes.ok ? await wineRes.json() : null;
  const settingsData = settingsRes.ok
    ? await settingsRes.json()
    : { rating_scale: 'five_star' };

  if (!wineData?.wine) notFound();

  // Validate ?date= param from post-consume flow (US-4.2)
  const prefillDate =
    searchParams.date && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date)
      ? searchParams.date
      : undefined;

  const wineName = [wineData.wine.name, wineData.wine.vintage]
    .filter(Boolean)
    .join(' ');

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#FAFAF7',
        padding: '16px',
        paddingBottom: '80px', // mobile nav clearance
      }}
    >
      <TastingNoteForm
        wineId={wineId}
        wineName={wineName}
        ratingScale={settingsData.rating_scale ?? 'five_star'}
        prefillDate={prefillDate}
      />
    </main>
  );
}
