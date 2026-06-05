import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="page-content">
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '24px', marginBottom: '16px' }}>
        SimpleWineApp
      </h1>
      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
        Full dashboard with drink-now shelf and stats coming soon.
      </p>
      <Link href="/cellar" style={{ display: 'inline-block', marginRight: '12px' }} className="btn btn-primary">View Cellar</Link>
      <Link href="/wines/new" className="btn btn-secondary">+ Add Wine</Link>
    </div>
  );
}
