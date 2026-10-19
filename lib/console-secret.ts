// What people find when they open the developer tools: a greeting, a warning
// against pasting foreign code (self-XSS), and a few secret commands on
// `window.pokyh`. Pressing F12 (or the usual shortcuts) on the page reveals
// the commands. Loaded lazily, after the page is idle (ConsoleSecret.tsx).

import { makeT } from '@/lib/i18n/dictionary';
import { consoleSecretDict } from '@/lib/i18n/dictionaries/consoleSecret';
import { localized, dishesFrom } from '@/lib/mensa';
import type { Locale } from '@/lib/i18n/locale';
import { SOURCE_URL } from '@/lib/site-links';

const LOGO = [
  ' ____   ___  _  ____   ___   _ ',
  '|  _ \\ / _ \\| |/ /\\ \\ / / | | |',
  '| |_) | | | | \' /  \\ V /| |_| |',
  '|  __/| |_| | . \\   | | |  _  |',
  '|_|    \\___/|_|\\_\\  |_| |_| |_|',
].join('\n');

const INDIGO = '#534AB7';
const LILAC = '#DEDDFB';
const TONES = ['#F7E7AC', '#D5E4D0', '#DEDDFB', '#F7D9D3', '#534AB7'];

interface Options {
  locale: Locale;
  toggleTheme: () => void;
}

let installed = false;

export function installConsoleSecret({ locale, toggleTheme }: Options): () => void {
  const t = makeT(consoleSecretDict, locale);
  const quotes = t('quotes').split('|');

  const commands: [string, string][] = [
    ['pokyh.help()', t('cmdHelp')],
    ['pokyh.party()', t('cmdParty')],
    ['pokyh.mensa()', t('cmdMensa')],
    ['pokyh.theme()', t('cmdTheme')],
    ['pokyh.quote()', t('cmdQuote')],
    ['pokyh.source()', t('cmdSource')],
  ];

  const api = {
    help() {
      console.log(
        commands.map(([cmd, what]) => `%c${cmd.padEnd(16)}%c ${what}`).join('\n'),
        ...commands.flatMap(() => [`color:${INDIGO};font-weight:700;font-family:monospace`, 'color:inherit']),
      );
    },
    party() {
      party();
      console.log(`%c${t('party')}`, `font:800 22px system-ui;color:${INDIGO}`);
    },
    async mensa() {
      try {
        const res = await fetch('/api/mensa');
        const dishes = dishesFrom(await res.json());
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const dish = dishes.find((d) => String(d.date ?? '').startsWith(today));
        console.log(dish ? t('mensaToday', { dish: localized(dish.name, locale) }) : t('mensaNone'));
      } catch {
        console.log(t('mensaNone'));
      }
    },
    theme() {
      toggleTheme();
      console.log(t('theme'));
    },
    quote() {
      console.log(`%c${quotes[Math.floor(Math.random() * quotes.length)]}`, 'font:600 15px system-ui');
    },
    source() {
      console.log(t('source', { url: SOURCE_URL }));
    },
  };

  if (!installed) {
    installed = true;
    console.log(`%c${LOGO}`, `color:${INDIGO};font:700 12px/1.15 monospace`);
    console.log(`%c${t('hello')}%c\n${t('curious')}\n${SOURCE_URL}`, `font:800 20px system-ui;color:${INDIGO}`, 'font:14px/1.5 system-ui');
    console.log(`%c${t('warnTitle')}%c ${t('warnText')}`, 'font:800 16px system-ui;color:#fff;background:#C0392B;padding:2px 8px;border-radius:6px', 'font:14px/1.5 system-ui;color:#C0392B');
    console.log(`%c${t('help')}`, `font:600 13px system-ui;color:${INDIGO};background:${LILAC};padding:2px 8px;border-radius:6px`);
  }

  (window as unknown as { pokyh?: typeof api }).pokyh = api;

  // F12, Ctrl/Cmd+Shift+I/J/C and Cmd+Option+I/J/C: the hidden commands appear.
  let revealed = false;
  const onKey = (e: KeyboardEvent) => {
    // Autofill sends keydown events without a key.
    if (typeof e.key !== 'string') return;
    const key = e.key.toLowerCase();
    const devtools = e.key === 'F12'
      || ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(key))
      || (e.metaKey && e.altKey && ['i', 'j', 'c'].includes(key));
    if (!devtools || revealed) return;
    revealed = true;
    // After the panel has opened, so the message is the newest line.
    window.setTimeout(() => {
      console.log(`%c${t('caught')}`, `font:700 15px system-ui;color:#fff;background:${INDIGO};padding:4px 10px;border-radius:8px`);
      api.help();
    }, 600);
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}

/** The five letters fall over the page as coloured tiles, then are gone. */
function party() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:200;overflow:hidden';
  const letters = 'POKYH';
  const count = Math.min(60, Math.round(window.innerWidth / 24));
  for (let i = 0; i < count; i++) {
    const tile = document.createElement('span');
    const size = 34 + Math.random() * 30;
    const bg = TONES[i % TONES.length];
    tile.textContent = letters[i % letters.length];
    tile.style.cssText = [
      'position:absolute', 'top:-80px', `left:${Math.random() * 100}%`,
      `width:${size}px`, `height:${size}px`, 'display:grid', 'place-items:center',
      `border-radius:${size * 0.28}px`, `background:${bg}`, `color:${bg === INDIGO ? '#fff' : '#1C1A17'}`,
      `font:800 ${size * 0.5}px system-ui`, 'box-shadow:0 10px 24px -10px rgb(0 0 0/.35)',
    ].join(';');
    layer.appendChild(tile);
    const drift = (Math.random() - 0.5) * 240;
    tile.animate(
      [
        { transform: 'translate(0,0) rotate(0deg)' },
        { transform: `translate(${drift}px, ${window.innerHeight + 160}px) rotate(${(Math.random() - 0.5) * 720}deg)` },
      ],
      { duration: 1800 + Math.random() * 1600, delay: Math.random() * 700, easing: 'cubic-bezier(.3,.1,.6,1)', fill: 'forwards' },
    );
  }
  document.body.appendChild(layer);
  window.setTimeout(() => layer.remove(), 4400);
}
