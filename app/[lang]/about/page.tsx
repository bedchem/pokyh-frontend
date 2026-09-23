import type { Metadata } from 'next';
import Link from 'next/link';
import LandingNav from '@/components/LandingNav';
import LandingFooter from '@/components/LandingFooter';
import { makeT } from '@/lib/i18n/dictionary';
import { routeLocale } from '@/lib/i18n/server';
import { localeAlternates, localizedUrl, ogLocale, pageKeywords } from '@/lib/i18n/seo';
import { aboutDict, type AboutKey } from '@/lib/i18n/dictionaries/about';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com';

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = makeT(aboutDict, locale);
  return {
  title: t('metaTitle'),
  description: t('metaDescription'),
  keywords: pageKeywords(locale, [
    'POKYH Story', 'POKYH Team', 'POKYH Entwickler', 'POKYH Open Source',
    'bedchem GitHub', 'Schulapp selbst gebaut',
    'Tschuggmall App', 'BFS Tschuggmall App', 'Christian Josef Tschuggmall App',
    'LBS Brixen App entwickelt', 'Open Source Schulapp Südtirol',
    'Schüler entwickeln App Brixen',
  ]),
  alternates: localeAlternates(SITE_URL, locale, '/about'),
  openGraph: {
    title: t('ogTitle'),
    description: t('ogDescription'),
    url: localizedUrl(SITE_URL, locale, '/about'),
    type: 'website',
    siteName: 'POKYH',
    ...ogLocale(locale),
  },
  };
}

const GhIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1.1 1.9 2.9 1.4 3.6 1 .1-.8.4-1.4.8-1.7-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2C6.5 7.4 6.1 6.1 6.6 4.4c0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.5 1.7.1 3 .1 3.3.7.8 1.2 1.9 1.2 3.2 0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.3v3.4c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/>
  </svg>
);

// `id` picks the icon; title/why are translation keys.
const FEATURES: { id: string; title: AboutKey; why: AboutKey }[] = [
  { id: 'timetable', title: 'fTimetable', why: 'fTimetableWhy' },
  { id: 'grades', title: 'fGrades', why: 'fGradesWhy' },
  { id: 'mensa', title: 'fMensa', why: 'fMensaWhy' },
  { id: 'messages', title: 'fMessages', why: 'fMessagesWhy' },
  { id: 'absences', title: 'fAbsences', why: 'fAbsencesWhy' },
  { id: 'reminders', title: 'fReminders', why: 'fRemindersWhy' },
  { id: 'todos', title: 'fTodos', why: 'fTodosWhy' },
];

function FeatureIcon({ title }: { title: string }) {
  const w = '1.7';
  if (title === 'timetable') return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w}><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>;
  if (title === 'grades') return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w}><path d="M5 20V10M12 20V4M19 20v-7"/></svg>;
  if (title === 'mensa') return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w}><path d="M4 11h16l-1.5 9h-13z"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>;
  if (title === 'messages') return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w}><path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5z"/></svg>;
  if (title === 'absences') return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w}><path d="M18 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M16 11l6 6M22 11l-6 6"/></svg>;
  if (title === 'reminders') return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M14 21a2 2 0 0 1-4 0"/></svg>;
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w}><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11"/></svg>;
}

const STACK: { label: string; sub: AboutKey }[] = [
  { label: 'Express',         sub: 'sHttp'     },
  { label: 'TypeScript',      sub: 'sTypes'    },
  { label: 'Prisma + MySQL',  sub: 'sDb'       },
  { label: 'SSE',             sub: 'sRealtime' },
  { label: 'JWT',             sub: 'sAuth'     },
  { label: 'Cloudflare',      sub: 'sHosting'  },
];

export default async function AboutPage({ params }: PageProps) {
  const locale = await routeLocale(params);
  const t = makeT(aboutDict, locale);
  return (
    <div className="lp-root lp-page">
      <LandingNav />

      {/* Hero */}
      <div className="lp-page-hero">
        <div className="lp-page-hero-eyebrow">{t('eyebrow')}</div>
        <h1 className="lp-page-hero-h1">{t('heroTitle')}</h1>
        <p className="lp-page-hero-sub">
          {t('heroSub')}
        </p>
      </div>

      <div className="lp-page-content">

        {/* Die Idee */}
        <div className="lp-page-section" style={{ borderTop: 'none', paddingTop: 0 }}>
          <h2 className="lp-page-section-title">{t('startTitle')}</h2>
          <p className="lp-page-section-sub" style={{ maxWidth: 620 }}>
            {t('startSub')}
          </p>
          <div className="lp-steps-grid" style={{ marginTop: 32 }}>
            {[
              { num: '01', title: t('p1Title'), body: t('p1Body') },
              { num: '02', title: t('p2Title'), body: t('p2Body') },
              { num: '03', title: t('p3Title'), body: t('p3Body') },
            ].map(({ num, title, body }) => (
              <div key={num} className="lp-step">
                <div className="lp-step-num">{num}</div>
                <div className="lp-step-title">{title}</div>
                <div className="lp-step-body">{body}</div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 32, color: 'var(--app-text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 620 }}>
            {t('startOutro')}
          </p>
        </div>

        {/* Features mit Warum */}
        <div className="lp-page-section">
          <h2 className="lp-page-section-title">{t('builtTitle')}</h2>
          <p className="lp-page-section-sub">{t('builtSub')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 28, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--lp-card-border)' }}>
            {FEATURES.map(({ id, title, why }, i) => (
              <div
                key={id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr',
                  gap: '0 20px',
                  alignItems: 'start',
                  padding: '20px 24px',
                  background: 'var(--lp-card-bg)',
                  borderTop: i > 0 ? '1px solid var(--lp-card-border)' : 'none',
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--lp-card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--app-text-secondary)' }}>
                  <FeatureIcon title={id} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--app-text-primary)', marginBottom: 4 }}>{t(title)}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--app-text-secondary)', lineHeight: 1.65 }}>{t(why)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Backend */}
        <div className="lp-page-section">
          <h2 className="lp-page-section-title">{t('backendTitle')}</h2>
          <p className="lp-page-section-sub" style={{ maxWidth: 620 }}>
            {t('backendSub')}
          </p>
          <p style={{ marginTop: 16, color: 'var(--app-text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 620 }}>
            {t('backendBody')}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 28 }}>
            {STACK.map(({ label, sub }) => (
              <div
                key={label}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: '1px solid var(--lp-card-border)',
                  background: 'var(--lp-card-bg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--app-text-primary)' }}>{label}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--app-text-tertiary)' }}>{t(sub)}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24 }}>
            <a
              href="https://github.com/bedchem/pokyh"
              target="_blank"
              rel="noopener noreferrer"
              className="lp-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <GhIcon /> {t('github')}
            </a>
          </div>
        </div>

        {/* Team */}
        <div className="lp-page-section">
          <h2 className="lp-page-section-title">{t('teamTitle')}</h2>
          <p className="lp-page-section-sub" style={{ maxWidth: 560 }}>
            {t('teamBefore')}{' '}
            <a href="https://github.com/bedchem" target="_blank" rel="noopener noreferrer" style={{ color: '#6366F1', textDecoration: 'none' }}>bedchem</a>
            {' '}{t('teamAfter')}
          </p>
          <div className="lp-makers-grid" style={{ maxWidth: '100%', marginTop: 24 }}>
            <a href="https://github.com/plattnericus" target="_blank" rel="noopener noreferrer" className="lp-maker">
              <div className="lp-maker-mono">N</div>
              <div>
                <div className="lp-maker-name">
                  Nexor{' '}
                  <span style={{ color: 'var(--app-text-tertiary)', fontWeight: 400 }}>· Plattnericus</span>
                </div>
                <div className="lp-maker-handle"><GhIcon />github.com/plattnericus</div>
              </div>
            </a>
            <a href="https://github.com/ryhox" target="_blank" rel="noopener noreferrer" className="lp-maker">
              <div className="lp-maker-mono">R</div>
              <div>
                <div className="lp-maker-name">Ryhox</div>
                <div className="lp-maker-handle"><GhIcon />github.com/ryhox</div>
              </div>
            </a>
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <h2 className="lp-h2">{t('ctaTitle')}</h2>
          <p className="lp-lead" style={{ margin: '12px auto 32px', maxWidth: 460 }}>
            {t('ctaLead')}
          </p>
          <div style={{ display: 'inline-flex', gap: 22, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href={`/${locale}/login/`} className="lp-btn">{t('ctaLogin')}</Link>
            <Link href={`/${locale}/comparison/`} className="lp-alink">{t('ctaCompare')}</Link>
          </div>
        </div>

      </div>

      <LandingFooter />
    </div>
  );
}
