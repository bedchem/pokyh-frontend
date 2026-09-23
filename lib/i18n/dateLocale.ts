import { de, it as itLocale, enUS, type Locale as DateFnsLocale } from 'date-fns/locale';
import type { Locale } from './locale';

/**
 * date-fns has no Ladin locale, so `lld` falls back to `de` here. Prefer
 * formatDate()/formatTime() below, which do render Gherdëina names.
 */
export function dateFnsLocale(locale: Locale): DateFnsLocale {
  switch (locale) {
    case 'it': return itLocale;
    case 'en': return enUS;
    default: return de;
  }
}

/** Intl locale tag for `toLocaleDateString`/`toLocaleTimeString` call sites. */
export function intlLocaleTag(locale: Locale): string {
  switch (locale) {
    case 'it': return 'it-IT';
    case 'en': return 'en-US';
    case 'lld': return 'lld';
    default: return 'de-AT';
  }
}

// Mon-first short weekday labels. An empty list falls back to `de` via the
// getters below.
export const DAY_LABELS_MON_SAT: Record<Locale, string[]> = {
  de: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  it: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  lld: ['Lun', 'Mer', 'Mie', 'Jue', 'Vën', 'Sad'],
};

// Full Mon-Sun short weekday labels (for pickers that show all 7 days).
export const DAY_ABBR_MON_SUN: Record<Locale, string[]> = {
  de: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
  it: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  lld: ['Lun', 'Mer', 'Mie', 'Jue', 'Vën', 'Sad', 'Dum'],
};

// Full Mon-Sun weekday names (spelled out).
export const WEEKDAY_NAMES_MON_SUN: Record<Locale, string[]> = {
  de: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
  it: ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  lld: ['Lunesc', 'Merdi', 'Mierculdi', 'Juebia', 'Vënderdi', 'Sada', 'Dumënia'],
};

export const MONTH_SHORT: Record<Locale, string[]> = {
  de: ['Jän.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'],
  it: ['Gen.', 'Feb.', 'Mar.', 'Apr.', 'Mag.', 'Giu.', 'Lug.', 'Ago.', 'Set.', 'Ott.', 'Nov.', 'Dic.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  lld: ['Jen.', 'Fau.', 'Merz', 'Aur.', 'Mei', 'Jugn', 'Lug.', 'Aost', 'Set.', 'Ut.', 'Nuv.', 'Dez.'],
};

function withDeFallback(arr: string[], locale: Locale, fallback: Record<Locale, string[]>): string[] {
  return arr.length > 0 ? arr : fallback.de;
}

export function dayLabelsMonSat(locale: Locale): string[] {
  return withDeFallback(DAY_LABELS_MON_SAT[locale], locale, DAY_LABELS_MON_SAT);
}

export function dayAbbrMonSun(locale: Locale): string[] {
  return withDeFallback(DAY_ABBR_MON_SUN[locale], locale, DAY_ABBR_MON_SUN);
}

export function weekdayNamesMonSun(locale: Locale): string[] {
  return withDeFallback(WEEKDAY_NAMES_MON_SUN[locale], locale, WEEKDAY_NAMES_MON_SUN);
}

export function monthShort(locale: Locale): string[] {
  return withDeFallback(MONTH_SHORT[locale], locale, MONTH_SHORT);
}

// Browsers ship no Ladin (lld) locale data, so for 'lld' dates are laid out
// like de-AT and the weekday/month words are swapped for Gherdëina ones.
const LLD_WEEKDAYS_SUN_FIRST = ['dumënia', 'lunesc', 'merdi', 'mierculdi', 'juebia', 'vënderdi', 'sada'];
const LLD_MONTHS_LONG = ['jené', 'fauré', 'merz', 'auril', 'mei', 'jugn', 'lugio', 'aost', 'setëmber', 'utober', 'nuvëmber', 'dezëmber'];

function formatLadin(d: Date, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('de-AT', opts).formatToParts(d).map((p) => {
    if (p.type === 'weekday') {
      const w = LLD_WEEKDAYS_SUN_FIRST[d.getDay()];
      return opts.weekday === 'long' ? w[0].toUpperCase() + w.slice(1) : w[0].toUpperCase() + w.slice(1, 3);
    }
    if (p.type === 'month' && opts.month !== 'numeric' && opts.month !== '2-digit') {
      const m = LLD_MONTHS_LONG[d.getMonth()];
      return opts.month === 'long' ? m : MONTH_SHORT.lld[d.getMonth()];
    }
    return p.value;
  }).join('');
}

/** Like toLocaleDateString(tag, opts), but also handles the 'lld' tag. */
export function formatDate(d: Date, tag: string, opts: Intl.DateTimeFormatOptions): string {
  if (tag === 'lld') return formatLadin(d, opts);
  return d.toLocaleDateString(tag, opts);
}

/** Like toLocaleTimeString(tag, opts), but also handles the 'lld' tag. */
export function formatTime(d: Date, tag: string, opts: Intl.DateTimeFormatOptions): string {
  return d.toLocaleTimeString(tag === 'lld' ? 'de-AT' : tag, opts);
}

/** Like toLocaleString(tag, opts) (date + time), but also handles the 'lld' tag. */
export function formatDateTime(d: Date, tag: string, opts: Intl.DateTimeFormatOptions): string {
  if (tag !== 'lld') return d.toLocaleString(tag, opts);
  // de-AT's dateStyle/timeStyle output carries German words ("um"), so compose it from parts.
  const { dateStyle, timeStyle, ...rest } = opts;
  const dateOpts: Intl.DateTimeFormatOptions = dateStyle
    ? { day: 'numeric', month: dateStyle === 'short' ? '2-digit' : 'long', year: 'numeric', ...(dateStyle === 'full' ? { weekday: 'long' } : {}) }
    : rest;
  const date = formatLadin(d, dateOpts);
  if (!timeStyle) return date;
  return `${date}, ${formatTime(d, tag, { hour: '2-digit', minute: '2-digit' })}`;
}
