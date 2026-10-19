// llms.txt (https://llmstxt.org): a plain summary of the site for AI search
// and assistants, generated from the same texts the pages show, so it never
// says more than the site does. Not needed by Google; read by others.
// llms-full.txt adds every question and answer the pages show, in all languages.

import { makeT } from '@/lib/i18n/dictionary';
import { metaDict } from '@/lib/i18n/dictionaries/meta';
import { faqDict, FAQ_COUNT, type FaqKey } from '@/lib/i18n/dictionaries/faq';
import { loginDict } from '@/lib/i18n/dictionaries/login';
import { webuntisPageDict, WEBUNTIS_FAQ_COUNT, type WebuntisPageKey } from '@/lib/i18n/dictionaries/webuntisPage';
import { toolsDict, GRADE_FAQ_COUNT, ABSENCE_FAQ_COUNT, type ToolsKey } from '@/lib/i18n/dictionaries/tools';
import { ACTIVE_LOCALES, LOCALE_NAMES, type Locale } from '@/lib/i18n/locale';
import { localizedUrl } from '@/lib/i18n/seo';
import { SOURCE_URL } from '@/lib/site-links';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pokyh.com';

const PAGES: { path: string; title: string; about: string }[] = [
  { path: '/', title: 'Home', about: 'what POKYH is and what it shows' },
  { path: '/login', title: 'Sign in', about: 'pick your school (any school on WebUntis, by name, city or address), then sign in with your WebUntis account' },
  { path: '/webuntis', title: 'For WebUntis', about: 'what POKYH shows from WebUntis (timetable, exams, grades with averages, absences in hours and percent, messages), how signing in works, questions' },
  { path: '/faq', title: 'FAQ', about: 'schools, sign-in, security, age, features' },
  { path: '/tools', title: 'Calculators', about: 'free school calculators, no sign-in' },
  { path: '/tools/grade-average', title: 'Grade average calculator', about: 'weighted average on the 1-10, 1-6, 1-5 and 0-15 point scales, and the grade needed for a target average' },
  { path: '/tools/absences', title: 'Absences in percent', about: 'share of lessons missed and hours left before the limit; explains the three-quarter attendance rule in Italy (DPR 122/2009 art. 14(7), Legislative Decree 62/2017 art. 5)' },
  { path: '/comparison', title: 'Comparison', about: 'POKYH and WebUntis compared, feature by feature' },
  { path: '/get', title: 'Get POKYH', about: 'browser, web app, iPhone, Android' },
  { path: '/get/pwa/ios', title: 'Web app on iPhone', about: 'add POKYH to the home screen in Safari, step by step' },
  { path: '/get/pwa/android', title: 'Web app on Android', about: 'install POKYH from Chrome, step by step' },
  { path: '/about', title: 'About', about: 'the story behind POKYH' },
  { path: '/mensa', title: 'Cafeteria', about: 'school cafeteria menus with ratings; with several cafeterias a choice with search, each named with its schools; schools without a menu on POKYH show none' },
  { path: '/howto', title: 'Self-hosting', about: 'run the open-source web app on your own computer or server' },
  { path: '/legal', title: 'Legal', about: 'imprint, privacy policy, terms of use and cookies' },
];

type Qa = { q: string; a: string };

function siteFaq(locale: Locale): Qa[] {
  const t = makeT(faqDict, locale);
  return Array.from({ length: FAQ_COUNT }, (_, i) => ({ q: t(`q${i + 1}` as FaqKey), a: t(`a${i + 1}` as FaqKey) }));
}

function webuntisFaq(locale: Locale): Qa[] {
  const t = makeT(webuntisPageDict, locale);
  return Array.from({ length: WEBUNTIS_FAQ_COUNT }, (_, i) => ({ q: t(`q${i + 1}` as WebuntisPageKey), a: t(`a${i + 1}` as WebuntisPageKey) }));
}

function toolsFaq(locale: Locale, prefix: 'g' | 'a', count: number): Qa[] {
  const t = makeT(toolsDict, locale);
  return Array.from({ length: count }, (_, i) => ({ q: t(`${prefix}q${i + 1}` as ToolsKey), a: t(`${prefix}a${i + 1}` as ToolsKey) }));
}

/** Every question the site answers, with the page that answers it. */
function questions(locale: Locale): { path: string; items: Qa[] }[] {
  return [
    { path: '/faq', items: siteFaq(locale) },
    { path: '/webuntis', items: webuntisFaq(locale) },
    { path: '/tools/grade-average', items: toolsFaq(locale, 'g', GRADE_FAQ_COUNT) },
    { path: '/tools/absences', items: toolsFaq(locale, 'a', ABSENCE_FAQ_COUNT) },
  ];
}

export function llmsTxt(full: boolean): string {
  const en = makeT(metaDict, 'en');
  const login = makeT(loginDict, 'en');
  const lines = [
    '# POKYH',
    '',
    `> ${en('appDescription')}`,
    '',
    en('aboutText'),
    '',
    '## Key facts',
    '',
    `- ${en('aboutPoints').split('|').join('\n- ')}`,
    `- ${login('trust1')}`,
    `- ${login('trust2')}`,
    `- ${login('ageNote')}`,
    `- ${en('independence')}`,
    `- Website: ${SITE_URL} (English ${localizedUrl(SITE_URL, 'en', '/')}, German ${localizedUrl(SITE_URL, 'de', '/')}, Italian ${localizedUrl(SITE_URL, 'it', '/')})`,
    `- Source code: ${SOURCE_URL}`,
    '',
    '## What POKYH shows',
    '',
    `- ${en('featureList').split('|').join('\n- ')}`,
    '',
    '## Pages (English)',
    '',
    ...PAGES.map((p) => `- [${p.title}](${localizedUrl(SITE_URL, 'en', p.path)}): ${p.about}`),
    '',
    '## Questions the site answers',
    '',
    ...questions('en').flatMap(({ path, items }) => items.map((qa) => `- [${qa.q}](${localizedUrl(SITE_URL, 'en', path)})`)),
    '',
    '## Other languages',
    '',
    ...ACTIVE_LOCALES.filter((l) => l !== 'en').map((l) => `- [${LOCALE_NAMES[l]}](${localizedUrl(SITE_URL, l, '/')}): ${makeT(metaDict, l)('siteDescription')}`),
  ];
  if (full) {
    for (const l of ACTIVE_LOCALES) {
      lines.push('', `## Questions and answers (${LOCALE_NAMES[l]})`);
      for (const { path, items } of questions(l)) {
        lines.push('', `Source: ${localizedUrl(SITE_URL, l, path)}`, '', ...items.flatMap((qa) => [`### ${qa.q}`, '', qa.a, '']));
      }
    }
  } else {
    lines.push('', '## Optional', '', `- [Full text with every answer, in English, German and Italian](${SITE_URL}/llms-full.txt)`);
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}
