// Whether a text contains a word the sign-in mascot must not say. It greets
// you by the user name you type ("Hallo, anna!"), so whatever is typed would
// come out of its mouth. The words themselves are data, not code: one list
// per language in lib/word-lists/*.json, extended or relaxed per deployment
// (lib/mascot-filter.ts). Caught also when written with digits or signs
// ("sh1t", "f*ck", "a.r.s.c.h") or with letters repeated ("fuuuck").
//
// Two kinds of words, so ordinary names are not caught (the "Scunthorpe"
// problem): `anywhere` words count inside longer words too; `asWord` words
// only as a word of their own ("Hancock" stays, "cock" alone does not;
// "calcolo" stays, "culo" does not). `allow` names are never caught.

export interface WordLists {
  anywhere: string[];
  asWord: string[];
  allow?: string[];
}

// Digits and signs people put in place of letters.
const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i', '|': 'i', '€': 'e' };
const VOWELS = ['a', 'e', 'i', 'o', 'u'];

function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[0134578@$!|€]/g, (c) => LEET[c] ?? c);
}

/** Letters only, repeated letters once ("fuuuck" → "fuck"). */
const squash = (s: string) => s.replace(/[^a-z]/g, '').replace(/(.)\1+/g, '$1');

/** Every way the stars of a text can stand for vowels ("f*ck" → "fack", "feck", …). */
function variants(text: string): string[] {
  const i = text.indexOf('*');
  if (i < 0) return [text];
  return VOWELS.flatMap((v) => variants(text.slice(0, i) + v + text.slice(i + 1)));
}

/** A checker for these lists: true when the text should not be said. */
export function createWordFilter(lists: WordLists): (text: string) => boolean {
  const clean = (words: string[]) => [...new Set(words.map((w) => normalise(w).replace(/[^a-z]/g, '')).filter(Boolean))];
  const anywhere = clean(lists.anywhere);
  const anywhereSquashed = anywhere.map(squash);
  const asWord = new Set(clean(lists.asWord).flatMap((w) => [w, squash(w)]));
  const allow = new Set(clean(lists.allow ?? []));

  const check = (text: string): boolean => {
    const norm = normalise(text);
    const words = norm.split(/[^a-z]+/).filter(Boolean);
    if (words.length && words.every((w) => allow.has(w))) return false;
    const plain = norm.replace(/[^a-z]/g, '');
    const all = squash(norm);
    if (anywhere.some((w, i) => plain.includes(w) || all.includes(anywhereSquashed[i]))) return true;
    if (words.some((w) => !allow.has(w) && (asWord.has(w) || asWord.has(squash(w))))) return true;
    // "a.r.s.c.h", "f i c k": single letters spelling a word.
    const spelled = words.length > 1 && words.every((w) => w.length === 1) ? words.join('') : '';
    return !!spelled && (asWord.has(spelled) || asWord.has(squash(spelled)) || anywhere.some((w) => spelled.includes(w)));
  };

  return (text: string) => {
    // "f*ck", "sch**sse": each star stands for a vowel (up to three stars).
    const stars = (text.match(/\*/g) ?? []).length;
    if (stars > 0 && stars <= 3) return variants(text).some(check);
    return check(stars ? text.replace(/\*/g, '') : text);
  };
}
