// The order grades were *entered* in WebUntis, for "Kürzlich hinzugefügt" on
// the Noten page and the dashboard: not the exam date but the moment the grade
// appeared. Maths and Italian entered on the exam day and German a week later
// list German first, though its exam was the earliest.
//
// WebUntis' grade ids don't follow that order everywhere, so the order comes
// from, in turn: the time WebUntis says the grade was entered (`enteredAt`,
// passed on by pokyh-backend when WebUntis sends one); the moment this browser
// first saw the grade (kept on the device, ids and times only); the id, then
// the exam date, for grades that were all there the first time it looked. The
// Android app keeps the same order (core/util/GradeEntryOrder.kt).

const KEY = 'pokyh_grade_seen';
/** How many ids are remembered (the newest); a school year has a few hundred grades. */
const LIMIT = 3000;

interface Orderable {
  id: number;
  date: number;
  enteredAt?: number | null;
}

let cache: Record<string, number> | null = null;

function read(): Record<string, number> {
  if (cache) return cache;
  try {
    const raw = typeof window === 'undefined' ? null : window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    cache = parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    cache = {};
  }
  return cache;
}

/**
 * Notes the grades not seen before. On the very first look everything is
 * "already there" (time 0), so only grades that appear later count as new.
 */
export function observeGrades(grades: Array<{ id: number }>): void {
  if (typeof window === 'undefined' || grades.length === 0) return;
  const seen = read();
  const first = Object.keys(seen).length === 0;
  const now = Date.now();
  let changed = false;
  for (const g of grades) {
    if (!g.id || seen[g.id] !== undefined) continue;
    seen[g.id] = first ? 0 : now;
    changed = true;
  }
  if (!changed) return;
  let entries = Object.entries(seen);
  if (entries.length > LIMIT) {
    entries = entries.sort((a, b) => b[1] - a[1]).slice(0, LIMIT);
    cache = Object.fromEntries(entries);
  }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch { /* storage full or blocked: the order falls back to the ids */ }
}

/** When the grade was entered, as far as can be told; 0 when it was there from the start. */
export function enteredAt(g: Orderable): number {
  return (typeof g.enteredAt === 'number' && g.enteredAt > 0 ? g.enteredAt : read()[g.id]) ?? 0;
}

/** Newest entered first. */
export function byEntered(a: Orderable, b: Orderable): number {
  return enteredAt(b) - enteredAt(a) || b.id - a.id || b.date - a.date;
}
