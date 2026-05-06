'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/providers/ThemeProvider';
import '@/app/landing.css';

const NAV_LINKS = [
  { label: 'About',     href: '/about' },
  { label: 'FAQ',       href: '/faq' },
  { label: 'Vergleich', href: '/vergleich' },
];

export default function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);
  const pathname = usePathname();
  const { resolved, setTheme } = useTheme();

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
              {NAV_LINKS.map(link => {
                const isActive = pathname === link.href;
                return (
                  <Link 
                    key={link.href} 
                    href={link.href} 
                    className={`lp-nav-link ${isActive ? 'active' : ''}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: theme toggle + Anmelden + CTA */}
          <div className="lp-nav-right">
            <input
              id="lp-theme-toggle"
              type="checkbox"
              className="lp-theme-toggle-input"
              checked={resolved === 'dark'}
              onChange={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
            />
            <label htmlFor="lp-theme-toggle" className="lp-theme-toggle">
              <div className="lp-theme-toggle-icon lp-theme-toggle-icon--moon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="lp-theme-toggle-icon lp-theme-toggle-icon--sun">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                </svg>
              </div>
            </label>
            <Link href="/login" className="lp-nav-login">Anmelden</Link>
            <Link href="/get" className="lp-nav-get">GET POKYH</Link>
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
            <Link href="/get" className="lp-mobile-nav-item" style={{ color: '#6366F1', fontWeight: 700 }} onClick={close}>
              GET POKYH
            </Link>
          </div>
        </>
      )}
    </>
  );
}
