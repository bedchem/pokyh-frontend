'use client';

import { useState } from 'react';
import Link from 'next/link';
import '@/app/landing.css';

const FUNKTIONEN = [
  { label: 'Stundenplan',          href: '/#funktionen' },
  { label: 'Noten & Schnitt',      href: '/#funktionen' },
  { label: 'Mensa',                href: '/#funktionen' },
  { label: 'Nachrichten',          href: '/#funktionen' },
  { label: 'Abwesenheiten',        href: '/#funktionen' },
  { label: 'Erinnerungen & Todos', href: '/#funktionen' },
];

const LOGIN_ITEMS = [
  { label: 'Jetzt anmelden',    href: '/login' },
  { label: "So funktioniert's", href: '/#login-info' },
];

const EXTRA_LINKS = [
  { label: 'About',     href: '/about' },
  { label: 'FAQ',       href: '/faq' },
  { label: 'Vergleich', href: '/vergleich' },
];

const ALL_MOBILE = [
  { section: 'Funktionen', items: FUNKTIONEN },
  { section: 'Login',      items: LOGIN_ITEMS },
  { section: 'Mehr',       items: EXTRA_LINKS },
];

const ChevronDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

export default function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);

  return (
    <>
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <Link href="/" className="lp-nav-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/POKYH_Logo.png" alt="POKYH" className="lp-nav-logo-img" />
            POKYH
          </Link>

          <div className="lp-nav-links">
            {/* Funktionen dropdown */}
            <div className="lp-nav-drop-wrap">
              <button className="lp-nav-drop-btn" aria-haspopup="true">
                Funktionen <ChevronDown />
              </button>
              <div className="lp-nav-drop-menu" role="menu">
                {FUNKTIONEN.map(item => (
                  <Link key={item.label} href={item.href} className="lp-nav-drop-item" role="menuitem">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Login dropdown */}
            <div className="lp-nav-drop-wrap">
              <button className="lp-nav-drop-btn" aria-haspopup="true">
                Login <ChevronDown />
              </button>
              <div className="lp-nav-drop-menu" role="menu">
                {LOGIN_ITEMS.map(item => (
                  <Link key={item.label} href={item.href} className="lp-nav-drop-item" role="menuitem">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {EXTRA_LINKS.map(link => (
              <Link key={link.href} href={link.href} className="lp-nav-link">{link.label}</Link>
            ))}

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
            {ALL_MOBILE.map(({ section, items }) => (
              <div key={section}>
                <div className="lp-mobile-nav-section">{section}</div>
                {items.map(item => (
                  <Link key={item.label} href={item.href} className="lp-mobile-nav-item" onClick={close}>
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
            <div className="lp-mobile-nav-sep" />
            <Link href="/howto" className="lp-mobile-nav-item" style={{ color: '#6366F1', fontWeight: 700 }} onClick={close}>
              GET POKYH →
            </Link>
          </div>
        </>
      )}
    </>
  );
}
