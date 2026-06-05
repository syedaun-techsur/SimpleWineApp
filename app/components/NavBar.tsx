'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: '⬛' },
  { label: 'Cellar', href: '/cellar', icon: '🍷' },
  { label: 'Locations', href: '/locations', icon: '📍' },
] as const;

export function NavBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop top header */}
      <header style={{
        display: 'none',
        background: 'var(--color-black)',
        color: 'var(--color-bone)',
        padding: '0 32px',
        height: '56px',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
      className="desktop-header"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link href="/" style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: '18px',
            color: 'var(--color-bone)',
            textDecoration: 'none',
          }}>
            🍷 SimpleWineApp
          </Link>
          <nav aria-label="Primary navigation" style={{ display: 'flex', gap: '24px' }}>
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: isActive(item.href) ? 'var(--color-gold)' : 'var(--color-bone)',
                  textDecoration: 'none',
                  borderBottom: isActive(item.href) ? '2px solid var(--color-gold)' : '2px solid transparent',
                  paddingBottom: '4px',
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <Link
          href="/wines/new"
          className="btn btn-primary"
          style={{ fontSize: '13px', minHeight: '36px', padding: '0 16px' }}
        >
          + Add Wine
        </Link>
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Primary navigation"
        className="mobile-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '56px',
          background: 'var(--color-black)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 50,
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                padding: '8px 16px',
                textDecoration: 'none',
                color: active ? 'var(--color-gold)' : 'var(--color-muted)',
                minWidth: '64px',
                minHeight: '44px',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile FAB for + Add Wine */}
      <Link
        href="/wines/new"
        aria-label="Add wine"
        className="mobile-fab"
        style={{
          position: 'fixed',
          bottom: '72px',
          right: '16px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--color-gold)',
          color: 'var(--color-black)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: 700,
          textDecoration: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 49,
        }}
      >
        +
      </Link>

      <style>{`
        @media (min-width: 1024px) {
          .desktop-header { display: flex !important; }
          .mobile-nav { display: none !important; }
          .mobile-fab { display: none !important; }
          main { padding-bottom: 0 !important; }
        }
      `}</style>
    </>
  );
}
