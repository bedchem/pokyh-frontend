'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocalizeHref, useRoutePath, useT } from '@/providers/LocaleProvider';
import { navDict, type NavKey } from '@/lib/i18n/dictionaries/nav';
import { useTheme } from '@/providers/ThemeProvider';
import LanguageMenu from '@/components/LanguageMenu';
import '@/app/landing.css';

const NAV_LINKS: { label: NavKey; href: string }[] = [
  { label: 'about', href: '/about' },
  { label: 'faq', href: '/faq' },
  { label: 'comparison', href: '/comparison' },
];

// Keep in sync with the full-nav breakpoint in landing.css.
const FULL_NAV_QUERY = '(min-width: 920px)';

function MensaIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);
  const pathname = useRoutePath();
  const t = useT(navDict);
  const localize = useLocalizeHref();
  const { resolved, toggleWithRipple } = useTheme();

  // Close the drawer once the window is wide enough that the hamburger disappears.
  useEffect(() => {
    const mq = window.matchMedia(FULL_NAV_QUERY);
    const onChange = () => { if (mq.matches) setMobileOpen(false); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <>
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          {/* Left: brand + nav links */}
          <div className="lp-nav-left">
            <Link href={localize('/')} className="lp-nav-brand">
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
                    href={localize(link.href)} 
                    className={`lp-nav-link ${isActive ? 'active' : ''}`}
                  >
                    {t(link.label)}
                  </Link>
                );
              })}
              <Link
                href={localize('/mensa')}
                className={`lp-nav-link lp-nav-link-mensa ${pathname === '/mensa' ? 'active' : ''}`}
                aria-label={t('viewMensaMenu')}
              >
                <MensaIcon />
                {t('mensa')}
              </Link>
            </div>
          </div>

          {/* Right: theme toggle + language + Anmelden + CTA */}
          <div className="lp-nav-right">
            <input
              id="lp-theme-toggle"
              type="checkbox"
              className="lp-theme-toggle-input"
              checked={resolved === 'dark'}
              onChange={() => {}}
              readOnly
            />
            <label
              htmlFor="lp-theme-toggle"
              className="lp-theme-toggle"
              onClick={(e) => { e.preventDefault(); toggleWithRipple(e); }}
            >
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
            <LanguageMenu className="lp-nav-lang" />
            <Link href={localize('/login')} className="lp-nav-login">{t('login')}</Link>
            <Link href={localize('/get')} className="lp-nav-get">GET POKYH</Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lp-nav-ham"
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
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
            {/* Only what the bar can't show at this width (see landing.css) */}
            <div className="lp-mobile-nav-settings">
              <button
                type="button"
                className="lp-mobile-nav-theme"
                onClick={(e) => toggleWithRipple(e)}
              >
                {resolved === 'dark' ? <SunIcon /> : <MoonIcon />}
                {resolved === 'dark' ? t('lightMode') : t('darkMode')}
              </button>
              <LanguageMenu className="lp-mobile-nav-lang" />
            </div>
            <div className="lp-mobile-nav-sep" />
            <Link href={localize('/mensa')} className="lp-mobile-nav-item lp-mobile-nav-mensa" onClick={close}>
              <MensaIcon />
              {t('mensaMenu')}
              <span className="lp-mobile-nav-badge">{t('withoutLogin')}</span>
            </Link>
            <div className="lp-mobile-nav-sep" />
            <div className="lp-mobile-nav-section">{t('pages')}</div>
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={localize(link.href)} className="lp-mobile-nav-item" onClick={close}>
                {t(link.label)}
              </Link>
            ))}
            <div className="lp-mobile-nav-sep" />
            <Link href={localize('/login')} className="lp-mobile-nav-item" onClick={close}>
              {t('login')}
            </Link>
            <Link href={localize('/get')} className="lp-mobile-nav-item" style={{ color: '#6366F1', fontWeight: 700 }} onClick={close}>
              GET POKYH
            </Link>
          </div>
        </>
      )}
    </>
  );
}
