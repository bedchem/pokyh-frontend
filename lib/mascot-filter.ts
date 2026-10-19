import { createWordFilter } from './word-filter';
import de from './word-lists/de.json';
import it from './word-lists/it.json';
import en from './word-lists/en.json';
import lld from './word-lists/lld.json';

// What the sign-in mascot will not say (app/[lang]/login/Hallway.tsx): the
// words of all four languages at once, since a name can be in any of them.
// A deployment adds words or frees names without touching the lists:
//   NEXT_PUBLIC_WORD_FILTER_BLOCK  more words, caught anywhere (comma-separated)
//   NEXT_PUBLIC_WORD_FILTER_ALLOW  names that are never caught (comma-separated)

const fromEnv = (value: string | undefined) => (value ?? '').split(',').map((w) => w.trim()).filter(Boolean);
const lists = [de, it, en, lld];

export const isOffensive = createWordFilter({
  anywhere: [...lists.flatMap((l) => l.anywhere), ...fromEnv(process.env.NEXT_PUBLIC_WORD_FILTER_BLOCK)],
  asWord: lists.flatMap((l) => l.asWord),
  allow: fromEnv(process.env.NEXT_PUBLIC_WORD_FILTER_ALLOW),
});
