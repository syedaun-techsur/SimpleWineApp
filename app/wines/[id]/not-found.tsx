import Link from 'next/link';

export default function WineNotFound() {
  return (
    <div className="page-content" style={{ textAlign: 'center', padding: '48px 16px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '24px', marginBottom: '12px' }}>
        Wine not found.
      </h1>
      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
        The wine you&apos;re looking for doesn&apos;t exist or has been deleted.
      </p>
      <Link href="/cellar" className="btn btn-primary">View My Cellar</Link>
    </div>
  );
}
