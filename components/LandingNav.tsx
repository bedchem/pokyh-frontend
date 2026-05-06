'use client';

import { useState } from 'react';
import Link from 'next/link';
import '@/app/landing.css';

const NAV_LINKS = [
  { label: 'About',     href: '/about' },
  { label: 'FAQ',       href: '/faq' },
  { label: 'Vergleich', href: '/vergleich' },
];

export default function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);

  return (
    <>
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          {/* Left: brand + nav links */}
          <div className="lp-nav-left">
            <Link href="/" className="lp-nav-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/POKYH_Logo.png" alt="POKYH" className="lp-nav-logo-img" />
              POKYH
            </Link>
            <div className="lp-nav-links">
              {NAV_LINKS.map(link => (
                <Link key={link.href} href={link.href} className="lp-nav-link">{link.label}</Link>
              ))}
            </div>
          </div>

          {/* Right: Anmelden + CTA */}
          <div className="lp-nav-right">
            <Link href="/login" className="lp-nav-link">Anmelden</Link>
            <Link href="/howto" className="lp-nav-get">GET POKYH</Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lp-nav-ham"
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
          >
            {mobileOpen
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            }
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="lp-mobile-nav-overlay open" onClick={close} />
          <div className="lp-mobile-nav-drawer open">
            <div className="lp-mobile-nav-section">Seiten</div>
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href} className="lp-mobile-nav-item" onClick={close}>
                {link.label}
              </Link>
            ))}
            <div className="lp-mobile-nav-sep" />
            <Link href="/login" className="lp-mobile-nav-item" onClick={close}>
              Anmelden
            </Link>
            <Link href="/howto" className="lp-mobile-nav-item" style={{ color: '#6366F1', fontWeight: 700 }} onClick={close}>
              GET POKYH →
            </Link>
          </div>
        </>
      )}
    </>
  );
}
