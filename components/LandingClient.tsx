'use client';

import { Fragment, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import '@/app/landing.css';

// Dynamic import — Three.js is heavy and SSR-incompatible
const IPhoneScene = dynamic(() => import('@/components/IPhoneScene'), { ssr: false });

const LESSONS = [
  { time: '08:00', bar: '#6366F1', title: 'Mathematik',  room: 'R204 · Hofer' },
  { time: '09:00', bar: '#10b981', title: 'Deutsch',     room: 'R112 · Mair' },
  { time: '10:00', bar: '#f97316', title: 'Fachpraxis',  room: 'Werkstatt B · Gruber' },
  { time: '11:00', bar: '#8b5cf6', title: 'Englisch',    room: 'R301 · Pichler' },
];

const WEEK_ROWS: [string, [string, string, string][]][] = [
  ['08', [['ca','Mat','R204'],['cb','Deu','R112'],['ca','Mat','R204'],['cc','Eng','R301'],['cd','FP','WkB']]],
  ['09', [['cb','Deu','R112'],['cd','FP','WkB'],['cc','Eng','R301'],['ca','Mat','R204'],['cd','FP','WkB']]],
  ['10', [['cd','FP','WkB'],['cd','FP','WkB'],['ce','Rel','R108'],['cc','Eng','R301'],['ca','Mat','R204']]],
  ['11', [['cc','Eng','R301'],['ca','Mat','R204'],['cd','FP','WkB'],['cb','Deu','R112'],['cc','Sport','Halle']]],
];

const GRADES = [
  ['Mathematik','9,1'],['Deutsch','8,3'],['Englisch','7,8'],
  ['Fachpraxis','9,4'],['Religion','8,0'],
];

const MENSA = [
  ['Spinatknödel mit Salbeibutter','A · C · G','€ 5,80'],
  ['Hähnchenbrust mit Reis','G','€ 6,40'],
  ['Gemüselasagne','A · C · G','€ 5,50'],
];

const ABS_BARS = [
  ['Sep','18%','2'],['Okt','36%','4'],['Nov','9%','1'],
  ['Dez','27%','3'],['Jan','18%','2'],
];

const REMINDERS = [
  { title: 'Mathe Schularbeit',    sub: 'Fr · 02.05', type: 'Klasse',     done: false },
  { title: 'Englisch Hausaufgabe', sub: 'Mi · 30.04', type: 'Persönlich', done: false },
  { title: 'Buch zurückgeben',     sub: 'Erledigt',   type: '',           done: true  },
];

const COMPARE = [
  { title:'Stundenplan',   sub:'Live aus WebUntis.',       rd:0,   icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg> },
  { title:'Noten',         sub:'Schnitt automatisch.',     rd:60,  icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 20V10M12 20V4M19 20v-7"/></svg> },
  { title:'Mensa',         sub:'Menü mit Preisen.',        rd:120, icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 11h16l-1.5 9h-13z"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg> },
  { title:'Vertretungen',  sub:'Sofort sichtbar.',         rd:180, icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 12a9 9 0 1 1-3.6-7.2L21 7"/><path d="M21 3v4h-4"/></svg> },
  { title:'Nachrichten',   sub:'Mit Anhängen.',            rd:0,   icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5z"/></svg> },
  { title:'Abwesenheiten', sub:'Quote im Blick.',          rd:60,  icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M18 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M16 11l6 6M22 11l-6 6"/></svg> },
  { title:'Erinnerungen',  sub:'Klassenweit, in Echtzeit.',rd:120, icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M14 21a2 2 0 0 1-4 0"/></svg> },
  { title:'Todos',         sub:'Auf allen Geräten.',       rd:180, icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11"/></svg> },
];

function GhIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1.1 1.9 2.9 1.4 3.6 1 .1-.8.4-1.4.8-1.7-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2C6.5 7.4 6.1 6.1 6.6 4.4c0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.5 1.7.1 3 .1 3.3.7.8 1.2 1.9 1.2 3.2 0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.3v3.4c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/>
    </svg>
  );
}

function reveal(td: number) {
  return { style: { transitionDelay: `${td}ms` } };
}

export default function LandingClient() {
  const phoneStageRef = useRef<HTMLDivElement>(null);
  // Scroll progress for Three.js — updated on scroll, never triggers re-render
  const progressRef   = useRef<number>(0);

  /* Scroll-driven reveal for section cards */
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    document.querySelectorAll('.lp-reveal').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* Scroll progress → progressRef (read by Three.js useFrame each tick) */
  useEffect(() => {
    const stage = phoneStageRef.current;
    if (!stage) return;

    function update() {
      const { top, height } = stage!.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when stage enters from bottom, 1 when stage has scrolled fully through
      // Using stage height as scroll distance → full 360° over the whole stage
      progressRef.current = Math.max(0, Math.min(1, (vh - top) / (height * 0.9)));
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div className="lp-root">

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <Link href="/" className="lp-nav-brand">
            <span className="lp-nav-logo">P</span>
            POKYH
          </Link>
          <div className="lp-nav-links">
            <a href="#funktionen" className="lp-nav-link">Funktionen</a>
            <a href="#login-info"  className="lp-nav-link">Login</a>
            <Link href="/login"   className="lp-nav-cta">Anmelden</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className="lp-hero">

        {/* Text zone — fills first viewport so phone is always below the fold */}
        <div className="lp-hero-text">
          <div className="lp-hero-eyebrow lp-reveal">POKYH</div>
          <h1 className="lp-hero-h1 lp-reveal" {...reveal(80)}>
            Deine Schule.<br />Übersichtlich.
          </h1>
          <p className="lp-hero-sub lp-reveal" {...reveal(160)}>
            Stundenplan, Noten, Mensa und mehr — für alle Schüler der LBS Brixen.{' '}
            <strong>Anmeldung mit deinem WebUntis‑Account.</strong>
          </p>
          <div className="lp-hero-actions lp-reveal" {...reveal(240)}>
            <Link href="/login"    className="lp-alink">Mit WebUntis anmelden</Link>
            <a    href="#login-info" className="lp-alink">So funktioniert's</a>
          </div>
          {/* Scroll cue */}
          <div className="lp-scroll-hint" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </div>
        </div>

        {/* Atmospheric glow — sits behind the phone */}
        <div className="lp-hero-glow" aria-hidden="true" />

        {/* Three.js iPhone — full 3-D model, scroll-driven animation */}
        <div className="lp-phone-stage" ref={phoneStageRef}>
          <IPhoneScene progressRef={progressRef} className="lp-phone-canvas" />
        </div>
      </header>

      {/* ── TILES ── */}
      <section className="lp-tiles-section" id="funktionen">
        <div className="lp-tiles">

          {/* Stundenplan */}
          <article className="lp-tile lp-tile-a tall">
            <div className="lp-tile-eyebrow lp-reveal">Stundenplan</div>
            <h2 className="lp-tile-title lp-reveal" {...reveal(60)}>Die Woche.<br />Auf einen Blick.</h2>
            <p  className="lp-tile-sub   lp-reveal" {...reveal(120)}>Tages‑ und Wochenansicht. Vertretungen und Entfall sind sofort erkennbar.</p>
            <div className="lp-tile-visual lp-reveal" {...reveal(180)}>
              <div className="lp-mock-week">
                <div className="lp-mw-h" />
                {['Mo','Di','Mi','Do','Fr'].map((d) => <div className="lp-mw-h" key={d}>{d}</div>)}
                {WEEK_ROWS.map(([time, cells]) => (
                  <Fragment key={time}>
                    <div className="lp-mw-t">{time}</div>
                    {cells.map(([cls, t, r], i) => (
                      <div className={`lp-mw-cell ${cls}`} key={i}>
                        <div className="lp-mw-cell-t">{t}</div>
                        <div className="lp-mw-cell-r">{r}</div>
                      </div>
                    ))}
                  </Fragment>
                ))}
              </div>
            </div>
          </article>

          {/* Noten */}
          <article className="lp-tile lp-tile-b tall">
            <div className="lp-tile-eyebrow lp-reveal">Noten &amp; Schnitt</div>
            <h2 className="lp-tile-title lp-reveal" {...reveal(60)}>Dein Durchschnitt.<br />Immer aktuell.</h2>
            <p  className="lp-tile-sub   lp-reveal" {...reveal(120)}>Alle Noten nach Fach. Gesamtschnitt automatisch berechnet — auf zwei Dezimalstellen.</p>
            <div className="lp-tile-visual lp-reveal" {...reveal(180)}>
              <div className="lp-mock-grades">
                <div className="lp-mg-num">8,42</div>
                <div className="lp-mg-lbl">Gesamtschnitt · 2025/26</div>
                {GRADES.map(([s, v]) => (
                  <div className="lp-mg-row" key={s}>
                    <span className="lp-mg-subj">{s}</span>
                    <span className="lp-mg-val">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>

          {/* Mensa */}
          <article className="lp-tile lp-tile-c">
            <div className="lp-tile-eyebrow lp-reveal">Mensa</div>
            <h2 className="lp-tile-title lp-reveal" {...reveal(60)}>Was gibt's heute?</h2>
            <p  className="lp-tile-sub   lp-reveal" {...reveal(120)}>Tagesmenü mit Preisen und Allergenen — direkt im Klassenzimmer.</p>
            <div className="lp-tile-visual lp-reveal" {...reveal(180)}>
              <div className="lp-mock-mensa">
                <div className="lp-mm-h">
                  <span className="lp-mm-h-t">Mittagsmenü</span>
                  <span className="lp-mm-h-d">27.04.2026</span>
                </div>
                {MENSA.map(([name, allerg, price]) => (
                  <div className="lp-mm-item" key={name}>
                    <div>
                      <div className="lp-mm-name">{name}</div>
                      <div className="lp-mm-allerg">{allerg}</div>
                    </div>
                    <div className="lp-mm-price">{price}</div>
                  </div>
                ))}
              </div>
            </div>
          </article>

          {/* Nachrichten */}
          <article className="lp-tile lp-tile-a">
            <div className="lp-tile-eyebrow lp-reveal">Nachrichten</div>
            <h2 className="lp-tile-title lp-reveal" {...reveal(60)}>Direkt aus<br />WebUntis.</h2>
            <p  className="lp-tile-sub   lp-reveal" {...reveal(120)}>Mit Anhang‑Vorschau und klickbaren Links.</p>
            <div className="lp-tile-visual lp-reveal" {...reveal(180)}>
              <div className="lp-mock-msg">
                <div className="lp-msg-from">
                  <div className="lp-msg-avatar">MH</div>
                  <div>
                    <div className="lp-msg-name">Markus Hofer</div>
                    <div className="lp-msg-time">Heute, 08:42</div>
                  </div>
                </div>
                <div className="lp-msg-subj">Mathe‑Schularbeit verschoben</div>
                <div className="lp-msg-body">
                  Liebe Klasse, die Schularbeit von Mittwoch wird auf Freitag verschoben. Stoff bleibt unverändert.
                </div>
                <div className="lp-msg-attach">
                  <div className="lp-msg-attach-icon">PDF</div>
                  <span>Stoffliste_4B.pdf</span>
                </div>
              </div>
            </div>
          </article>

          {/* Abwesenheiten */}
          <article className="lp-tile lp-tile-d">
            <div className="lp-tile-eyebrow lp-reveal">Abwesenheiten</div>
            <h2 className="lp-tile-title lp-reveal" {...reveal(60)}>Fehlstunden.<br />Pro Monat.</h2>
            <p  className="lp-tile-sub   lp-reveal" {...reveal(120)}>Entschuldigt, unentschuldigt und Quote im Schuljahr.</p>
            <div className="lp-tile-visual lp-reveal" {...reveal(180)}>
              <div className="lp-mock-abs">
                <div className="lp-abs-num">12</div>
                <div className="lp-abs-lbl">Stunden · Schuljahr 2025/26 · 3,1 %</div>
                {ABS_BARS.map(([m, w, n]) => (
                  <div className="lp-abs-row" key={m}>
                    <div className="lp-abs-month">{m}</div>
                    <div className="lp-abs-track"><div className="lp-abs-fill" style={{ width: w }} /></div>
                    <div className="lp-abs-n">{n}</div>
                  </div>
                ))}
              </div>
            </div>
          </article>

          {/* Erinnerungen & Todos */}
          <article className="lp-tile lp-tile-b">
            <div className="lp-tile-eyebrow lp-reveal">Erinnerungen &amp; Todos</div>
            <h2 className="lp-tile-title lp-reveal" {...reveal(60)}>Nichts mehr<br />vergessen.</h2>
            <p  className="lp-tile-sub   lp-reveal" {...reveal(120)}>Klassenweite Erinnerungen für Prüfungen — und persönliche Todos für dich.</p>
            <div className="lp-tile-visual lp-reveal" {...reveal(180)}>
              <div className="lp-mock-grades" style={{ maxWidth: 340 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--app-text-primary)', marginBottom: 14, letterSpacing: '-0.01em' }}>
                  Diese Woche
                </div>
                {REMINDERS.map(({ title, sub, type, done }) => (
                  <div className="lp-mg-row" key={title}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                        border: done ? 'none' : `1.5px solid ${type === 'Klasse' ? '#6366F1' : 'var(--app-text-tertiary)'}`,
                        background: done ? '#10b981' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 9, fontWeight: 700,
                      }}>
                        {done && '✓'}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: done ? 'var(--app-text-tertiary)' : 'var(--app-text-primary)', textDecoration: done ? 'line-through' : 'none' }}>
                          {title}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--app-text-tertiary)', marginTop: 2 }}>{sub}</div>
                      </div>
                    </div>
                    {type && (
                      <div style={{ fontSize: 11, fontWeight: 600, color: type === 'Klasse' ? '#6366F1' : 'var(--app-text-tertiary)' }}>
                        {type}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </article>

        </div>
      </section>

      {/* ── COMPARE ── */}
      <section className="lp-compare">
        <div className="lp-compare-grid">
          {COMPARE.map(({ title, sub, icon, rd }) => (
            <div className="lp-compare-cell lp-reveal" style={{ transitionDelay: `${rd}ms` }} key={title}>
              <div className="lp-compare-icon">{icon}</div>
              <div className="lp-compare-title">{title}</div>
              <div className="lp-compare-sub">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── STEPS ── */}
      <section className="lp-steps" id="login-info">
        <div className="lp-steps-head">
          <div className="lp-eyebrow lp-reveal" style={{ marginBottom: 8 }}>Anmeldung</div>
          <h2 className="lp-h2 lp-reveal" {...reveal(80)}>In 30&nbsp;Sekunden eingeloggt.</h2>
          <p className="lp-lead lp-reveal" style={{ maxWidth: 560, margin: '18px auto 0', transitionDelay: '160ms' }}>
            POKYH benutzt deinen{' '}
            <strong style={{ color: 'var(--app-text-primary)', fontWeight: 500 }}>WebUntis‑Account</strong>
            {' '}— denselben, mit dem du dich auch in der WebUntis‑App anmeldest. Kein neues Passwort, keine Registrierung.
          </p>
        </div>
        <div className="lp-steps-grid">
          {[
            { num:'01', title:'BFS Tschuggmall',   body: <><strong>Momentan</strong> wird nur das Berufsbildungszentrum <strong>„Christian Josef Tschuggmall“</strong> unterstützt.</>,                                    rd:0   },
            { num:'02', title:'WebUntis‑Login',  body: <>Gib deinen <strong>WebUntis‑Benutzernamen</strong> und dein Passwort ein — wie in der WebUntis‑App.</>, rd:100 },
            { num:'03', title:'Loslegen',        body: <>Stundenplan, Noten und Mensa werden <strong>automatisch geladen</strong>.</>,                          rd:200 },
          ].map(({ num, title, body, rd }) => (
            <div className="lp-step lp-reveal" style={{ transitionDelay: `${rd}ms` }} key={num}>
              <div className="lp-step-num">{num}</div>
              <div className="lp-step-title">{title}</div>
              <div className="lp-step-body">{body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MAKERS ── */}
      <section className="lp-makers">
        <div className="lp-makers-head">
          <div className="lp-eyebrow lp-reveal" style={{ marginBottom: 8 }}>Made by Schülern</div>
          <h2 className="lp-h2 lp-reveal" {...reveal(80)}>Von zwei aus der Klasse.</h2>
          <p className="lp-lead lp-reveal" style={{ maxWidth: 520, margin: '18px auto 0', transitionDelay: '160ms' }}>
            POKYH wird in der Freizeit von zwei Schülern der LBS Brixen entwickelt — als Open‑Source‑Projekt unter der{' '}
            <a href="https://github.com/bedchem" target="_blank" rel="noopener noreferrer" style={{ color: '#6366F1', textDecoration: 'none' }}>
              bedchem
            </a>{' '}Organisation auf GitHub.
          </p>
        </div>
        <div className="lp-makers-grid">
          <a href="https://github.com/plattnericus" target="_blank" rel="noopener noreferrer" className="lp-maker lp-reveal">
            <div className="lp-maker-mono">N</div>
            <div>
              <div className="lp-maker-name">
                Nexor{' '}
                <span style={{ color: 'var(--app-text-tertiary)', fontWeight: 400 }}>· Plattnericus</span>
              </div>
              <div className="lp-maker-handle"><GhIcon />github.com/plattnericus</div>
            </div>
          </a>
          <a href="https://github.com/ryhox" target="_blank" rel="noopener noreferrer" className="lp-maker lp-reveal" style={{ transitionDelay: '100ms' }}>
            <div className="lp-maker-mono">R</div>
            <div>
              <div className="lp-maker-name">Ryhox</div>
              <div className="lp-maker-handle"><GhIcon />github.com/ryhox</div>
            </div>
          </a>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta" id="login">
        <h2 className="lp-h2 lp-reveal">Bereit?</h2>
        <p className="lp-lead lp-reveal" {...reveal(80)}>
          Kostenlos. Ohne Registrierung. Mit deinem WebUntis‑Account.
        </p>
        <div className="lp-reveal" style={{ transitionDelay: '160ms', marginTop: 32, display: 'inline-flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/login"    className="lp-btn">Mit WebUntis anmelden</Link>
          <a    href="#login-info" className="lp-alink">So funktioniert's</a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-disclaimer">
            POKYH ist ein eigenständiges Projekt von Schülern und steht in keiner offiziellen Verbindung zur LBS Brixen oder zu WebUntis / Untis GmbH. Marken und Logos sind Eigentum ihrer jeweiligen Inhaber.
          </div>
          <div className="lp-footer-bar">
            <div>
              © 2026{' '}
              <a href="https://github.com/bedchem" target="_blank" rel="noopener noreferrer">bedchem</a>
              {' '}· POKYH · Made by{' '}
              <a href="https://github.com/plattnericus" target="_blank" rel="noopener noreferrer">Plattnericus</a>
              {' '}&amp;{' '}
              <a href="https://github.com/ryhox" target="_blank" rel="noopener noreferrer">Ryhox</a>
            </div>
            <div className="lp-footer-links">
              <Link href="/login">Anmelden</Link>
              <Link href="/legal">Impressum</Link>
              <Link href="/legal#datenschutz">Datenschutz</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
