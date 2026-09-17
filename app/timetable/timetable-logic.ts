// Timetable logic — port of the Android app's `TimetableSlots.kt`, `WeekGrid.kt` (cell layout)
// and `Palette.kt` (subject/status pastels). Pure functions only, no React.

import type { TimetableEntry } from '@/lib/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SlotKind = 'normal' | 'cancelled' | 'replacement' | 'exam' | 'event';
export type DayKind = 'normal' | 'holiday' | 'allCancelled' | 'allReplacement' | 'fullDayEvent' | 'weekend';

export interface MergedSlot {
  id: string;
  display: TimetableEntry;
  replacement?: TimetableEntry;
  kind: SlotKind;
}

// ── Geometry ──────────────────────────────────────────────────────────────────

/** A 50-minute period is ~48px — enough for subject, teacher and room. */
export const PX_PER_MINUTE = 0.95;
export const GRID_GUTTER = 42;
export const COL_GAP = 3;
export const GRID_EDGE_INSET = 6;
export const MIN_CELL_HEIGHT = 26;
export const MIN_CELL_WIDTH = 10;
/** Below this a cell carries no text — the tint and outline already say enough. */
export const TEXT_MIN_CELL_WIDTH = 34;
export const CELL_GAP = 3;
export const PAST_LESSON_ALPHA = 0.7;
const PER_MILLE = 1000;
/** What the lesson that happens keeps when a cancellation runs alongside it. */
const ACTIVE_SHARE = 750;

export interface TimetablePeriod { number: number; startMinute: number; endMinute: number }

/** This school's 10-period grid, 07:50–16:45. A default, dropped on timetables that don't match it. */
export const TIMETABLE_PERIODS: TimetablePeriod[] = [
  { number: 1, startMinute: 470, endMinute: 520 },
  { number: 2, startMinute: 520, endMinute: 570 },
  { number: 3, startMinute: 570, endMinute: 620 },
  { number: 4, startMinute: 635, endMinute: 685 },
  { number: 5, startMinute: 685, endMinute: 735 },
  { number: 6, startMinute: 735, endMinute: 785 },
  { number: 7, startMinute: 795, endMinute: 845 },
  { number: 8, startMinute: 845, endMinute: 895 },
  { number: 9, startMinute: 905, endMinute: 955 },
  { number: 10, startMinute: 955, endMinute: 1005 },
];

export const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONTH_ABBR = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const MONTH_SHORT_DE = ['Jän.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];

// ── Time helpers ──────────────────────────────────────────────────────────────

/** HHmm int → minutes since midnight. */
export function toMins(t: number): number {
  return Math.floor(t / 100) * 60 + (t % 100);
}

/** HHmm int → "HH:mm". */
export function fmtTime(t: number): string {
  return `${String(Math.floor(t / 100)).padStart(2, '0')}:${String(t % 100).padStart(2, '0')}`;
}

export function hhmm(totalMinutes: number): string {
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
}

export function dateNumOf(d: Date): number {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

export function mondayOf(offset: number, today = new Date()): Date {
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dow = base.getDay() || 7;
  base.setDate(base.getDate() - (dow - 1) + offset * 7);
  return base;
}

export function dateOf(offset: number, dayIndex: number): Date {
  const m = mondayOf(offset);
  m.setDate(m.getDate() + dayIndex);
  return m;
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function rangeText(offset: number): string {
  const start = mondayOf(offset);
  const end = dateOf(offset, 5);
  return `${start.getDate()}. ${MONTH_ABBR[start.getMonth()]} – ${end.getDate()}. ${MONTH_ABBR[end.getMonth()]} ${end.getFullYear()}`;
}

export function monthShortDe(d: Date): string {
  return MONTH_SHORT_DE[d.getMonth()] ?? '';
}

/** Minutes since midnight on the school's clock. */
export function schoolMinuteNow(): number {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date());
    const h = Number(parts.find(p => p.type === 'hour')?.value ?? 0);
    const m = Number(parts.find(p => p.type === 'minute')?.value ?? 0);
    return h * 60 + m;
  } catch {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  }
}

// ── Parsing (v1/timetable/entries) ────────────────────────────────────────────

interface ApiEntity { status?: string; shortName?: string; longName?: string; displayName?: string }
interface ApiPositionItem { current: ApiEntity | null; removed: ApiEntity | null }
interface ApiGridEntry {
  ids: number[];
  duration: { start: string; end: string };
  type: string;
  status: string;
  position1: ApiPositionItem[] | null;
  position2: ApiPositionItem[] | null;
  position3: ApiPositionItem[] | null;
  lessonText?: string | null;
  lessonInfo?: string | null;
  substitutionText?: string | null;
  texts?: Array<{ type?: string; text?: string }> | null;
  icons?: string[] | null;
  exam?: { description?: string } | null;
}
interface ApiDay { date: string; gridEntries: ApiGridEntry[] }

function nonBlank(s: string | null | undefined): string | undefined {
  return s && s.trim() ? s : undefined;
}

export function parseTimetable(json: unknown): TimetableEntry[] {
  try {
    const root = json as { days?: ApiDay[] };
    if (!root.days) return [];
    const entries: TimetableEntry[] = [];

    for (const day of root.days) {
      if (!day.gridEntries?.length) continue;
      const dateNum = parseInt(day.date.replace(/-/g, ''), 10);

      for (const ge of day.gridEntries) {
        const hm = (iso: string) => {
          const [h, m] = (iso.split('T')[1] ?? '').split(':').map(Number);
          return (h || 0) * 100 + (m || 0);
        };
        const pos1 = ge.position1 ?? [];
        const pos2 = ge.position2 ?? [];
        const pos3 = ge.position3 ?? [];

        // WebUntis flags a changed field on the *current* value ("status":"ADDED") and leaves
        // "removed" null; only an outright swap fills `removed` in. Both have to be read.
        const added = (positions: ApiPositionItem[]) => positions
          .filter(p => p.current?.status && p.current.status !== 'REGULAR')
          .map(p => p.current!.displayName ?? '')
          .filter(Boolean);

        const addedTeachers = added(pos1);
        const addedSubjects = added(pos2);
        const addedRooms = added(pos3);
        const activeTeachers = pos1.map(p => p.current?.displayName ?? '').filter(Boolean);
        const activeTeachersLong = pos1.map(p => p.current?.longName || p.current?.displayName || '').filter(Boolean);
        const removedTeachers = pos1.map(p => p.removed?.displayName ?? '').filter(Boolean);
        const removedTeachersLong = pos1.map(p => p.removed?.longName || p.removed?.displayName || '').filter(Boolean);
        const activeSub = pos2.find(p => p.current)?.current ?? null;
        const removedSub = pos2.find(p => p.removed)?.removed ?? null;
        const activeRooms = pos3.map(p => p.current?.displayName ?? '').filter(Boolean);
        const removedRooms = pos3.map(p => p.removed?.displayName ?? '').filter(Boolean);

        const text = (kind: string) => nonBlank(ge.texts?.find(t => t.type === kind)?.text);
        const lessonInfo = text('LESSON_INFO') ?? nonBlank(ge.lessonInfo);
        const lessonText = text('LESSON_TEXT') ?? nonBlank(ge.lessonText);
        const substitutionText = text('SUBSTITUTION') ?? nonBlank(ge.substitutionText);

        const isExam = ge.type === 'EXAM';
        const isCancelled = ge.status === 'CANCELLED';
        const isChanged = ge.status === 'CHANGED';
        const isSubstitution = isChanged && (removedTeachers.length > 0 || addedTeachers.length > 0);

        entries.push({
          id: ge.ids?.[0] ?? 0,
          lessonId: ge.ids?.[0] ?? 0,
          date: dateNum,
          startTime: hm(ge.duration.start),
          endTime: hm(ge.duration.end),
          subjectName: activeSub?.shortName ?? removedSub?.shortName ?? '',
          subjectLong: activeSub?.longName ?? removedSub?.longName ?? '',
          teacherName: activeTeachers.join(', '),
          teacherLongName: activeTeachersLong.join(', ') || undefined,
          roomName: activeRooms.join(', '),
          cellState: isCancelled ? 'CANCEL' : isChanged ? 'SUBSTITUTION' : 'STANDARD',
          isExam,
          isCancelled,
          isSubstitution,
          isAdditional: ge.type === 'ADDITIONAL',
          originalSubject: removedSub?.shortName ?? '',
          originalSubjectLong: removedSub?.longName ?? '',
          originalTeacher: removedTeachers.join(', '),
          originalTeacherLong: removedTeachersLong.join(', ') || undefined,
          originalRoom: removedRooms.join(', '),
          note: lessonInfo ?? lessonText,
          examDescription: ge.exam?.description || undefined,
          addedTeachers,
          addedSubjects,
          addedRooms,
          icons: (ge.icons ?? []).filter(Boolean),
          substitutionText,
          lessonText,
        });
      }
    }

    return entries.sort((a, b) => (a.date !== b.date ? a.date - b.date : a.startTime - b.startTime));
  } catch {
    return [];
  }
}

// ── Changes ───────────────────────────────────────────────────────────────────

export interface SlotChanges { subjectChanged: boolean; teacherChanged: boolean; roomChanged: boolean }

export function changesOf(e: TimetableEntry): SlotChanges {
  const changed = (original: string | undefined, current: string) =>
    !!original && !!original.trim() && original.trim() !== current.trim();
  // A cancelled lesson isn't "changed" — it's gone, and the strikethrough says so.
  if (e.isCancelled) return { subjectChanged: false, teacherChanged: false, roomChanged: false };
  return {
    subjectChanged: (e.addedSubjects?.length ?? 0) > 0 || changed(e.originalSubject, e.subjectName),
    teacherChanged: (e.addedTeachers?.length ?? 0) > 0 || changed(e.originalTeacher, e.teacherName),
    roomChanged: (e.addedRooms?.length ?? 0) > 0 || changed(e.originalRoom, e.roomName),
  };
}

/** Splits a comma-joined field into parts, each tagged with whether WebUntis marked it as new. */
export function splitChanged(joined: string, added: string[]): Array<[string, boolean]> {
  return joined.split(',').map(s => s.trim()).filter(Boolean)
    .map(part => [part, added.some(a => a.trim() === part)]);
}

// ── Slots ─────────────────────────────────────────────────────────────────────

let slotSeq = 0;
const nextSlotId = () => `s${++slotSeq}`;

/** Groups one day's entries by start time, merging cancelled+active pairs into display slots. */
export function buildSlots(dayEntries: TimetableEntry[]): MergedSlot[] {
  const groups = new Map<number, TimetableEntry[]>();
  for (const e of dayEntries) {
    if (!groups.has(e.startTime)) groups.set(e.startTime, []);
    groups.get(e.startTime)!.push(e);
  }

  const slots: MergedSlot[] = [];
  for (const groupStart of [...groups.keys()].sort((a, b) => a - b)) {
    const group = groups.get(groupStart)!;
    const cancelled = group.filter(e => e.isCancelled);
    let active = group.filter(e => !e.isCancelled);

    const spanningCancelled = cancelled.length === 0
      ? dayEntries.filter(e => e.isCancelled && toMins(e.startTime) < toMins(groupStart) && toMins(e.endTime) > toMins(groupStart))
      : [];
    const effectiveCancelled = cancelled.length === 0 ? spanningCancelled : cancelled;

    if (active.length === 0 && effectiveCancelled.length > 0) {
      const spanning = dayEntries.filter(e =>
        !e.isCancelled && toMins(e.startTime) < toMins(groupStart) && toMins(e.endTime) > toMins(groupStart));
      if (spanning.length > 0) active = spanning;
    }

    if (active.length === 0) {
      if (effectiveCancelled[0]) slots.push({ id: nextSlotId(), display: effectiveCancelled[0], kind: 'cancelled' });
      continue;
    }
    if (effectiveCancelled.length > 0) {
      slots.push({ id: nextSlotId(), display: effectiveCancelled[0], replacement: active[0], kind: 'replacement' });
      continue;
    }

    const display =
      active.find(e => e.isExam) ??
      active.find(e => e.isAdditional) ??
      active.find(e => !e.subjectName && !!e.note) ??
      active.find(e => e.isSubstitution) ??
      active[0];

    const kind: SlotKind =
      display.isExam ? 'exam'
      : display.isAdditional ? 'normal'
      : !display.subjectName && display.note ? 'event'
      : display.isSubstitution ? 'replacement'
      : 'normal';
    slots.push({ id: nextSlotId(), display, kind });
  }

  // Drop cancelled slots that are visually covered by an active slot.
  const activeSlots = slots.filter(s => !s.display.isCancelled);
  return slots.filter(slot => {
    if (!slot.display.isCancelled) return true;
    const sm = toMins(slot.display.startTime);
    const em = toMins(slot.display.endTime);
    return !activeSlots.some(a => toMins(a.display.startTime) <= sm && toMins(a.display.endTime) >= em);
  });
}

function baseDayKind(dayEntries: TimetableEntry[], hasOtherDayEntries: boolean): DayKind {
  if (dayEntries.length === 0) return hasOtherDayEntries ? 'holiday' : 'normal';
  const first = dayEntries[0];
  if (dayEntries.length === 1 && !first.isCancelled && !first.subjectName && first.note) return 'fullDayEvent';
  if (dayEntries.every(e => e.isCancelled)) return 'allCancelled';
  return 'normal';
}

export function dayKind(dayEntries: TimetableEntry[], slots: MergedSlot[], hasOtherDayEntries: boolean, index: number): DayKind {
  if (index === 5 && dayEntries.length === 0) return 'weekend';
  const base = baseDayKind(dayEntries, hasOtherDayEntries);
  // Two slots at least: a single substituted lesson is drawn as a cell, not as a whole-day card.
  if (base === 'normal' && slots.length >= 2 && slots.every(s => s.kind === 'replacement')) {
    const first = slots[0].replacement;
    const same = slots.every(s =>
      s.replacement?.subjectName === first?.subjectName &&
      s.replacement?.note === first?.note &&
      s.replacement?.teacherName === first?.teacherName);
    if (same) return 'allReplacement';
  }
  return base;
}

// ── Grid cells ────────────────────────────────────────────────────────────────

export interface GridCell {
  key: string;
  /** What a tap opens. */
  slot: MergedSlot;
  entry: TimetableEntry;
  kind: SlotKind;
  startMinute: number;
  endMinute: number;
  /** Left edge, per-mille of the column width. */
  start: number;
  /** Width, per-mille of the column width. */
  width: number;
}

const cellCancelled = (c: GridCell) => c.kind === 'cancelled' || c.entry.isCancelled;
const overlaps = (a: GridCell, b: GridCell) => a.startMinute < b.endMinute && b.startMinute < a.endMinute;

/** Flattens a day's slots into the boxes the column draws — one entry, one time range per box. */
export function buildGridCells(slots: MergedSlot[]): GridCell[] {
  const cells: GridCell[] = [];
  const base = { start: 0, width: PER_MILLE };

  for (const slot of slots) {
    const replacement = slot.replacement;
    if (slot.kind === 'replacement' && replacement) {
      // The lesson that happens, at its own times.
      cells.push({
        ...base,
        key: `${slot.id}-active`,
        slot: { id: `${slot.id}-active`, display: replacement, replacement: slot.display, kind: 'replacement' },
        entry: replacement,
        kind: 'replacement',
        startMinute: toMins(replacement.startTime),
        endMinute: toMins(replacement.endTime),
      });
      // The cancelled original gets its own cell only when it isn't already a standalone cancellation.
      const standaloneExists = slots.some(s => s.kind === 'cancelled' && s.display.id === slot.display.id);
      if (!standaloneExists) {
        cells.push({
          ...base,
          key: `${slot.id}-cancelled`,
          slot: { id: `${slot.id}-cancelled`, display: slot.display, replacement, kind: 'cancelled' },
          entry: slot.display,
          kind: 'cancelled',
          startMinute: toMins(slot.display.startTime),
          endMinute: toMins(slot.display.endTime),
        });
      }
    } else {
      cells.push({
        ...base,
        key: slot.id,
        slot,
        entry: slot.display,
        kind: slot.kind,
        startMinute: toMins(slot.display.startTime),
        endMinute: toMins(slot.display.endTime),
      });
    }
  }

  const seen = new Set<string>();
  const unique = cells
    .filter(c => c.endMinute > c.startMinute)
    .filter(c => {
      const k = `${c.entry.id}-${c.startMinute}-${c.endMinute}-${c.kind}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  return resolveHorizontal(unique);
}

/** Lesson that happens leads; a column shared with only cancellations splits 75/25. */
function resolveHorizontal(cells: GridCell[]): GridCell[] {
  const ordered = [...cells].sort((a, b) =>
    Number(cellCancelled(a)) - Number(cellCancelled(b)) ||
    a.startMinute - b.startMinute ||
    (b.endMinute - b.startMinute) - (a.endMinute - a.startMinute));

  const lanes = new Map<string, number>();
  for (const cell of ordered) {
    let lane = 0;
    while (ordered.some(o => o.key !== cell.key && lanes.get(o.key) === lane && overlaps(o, cell))) lane++;
    lanes.set(cell.key, lane);
  }
  const laneCount = Math.max(0, ...lanes.values()) + 1;

  const trailing = ordered.filter(c => lanes.get(c.key) === 1);
  const leading = ordered.filter(c => lanes.get(c.key) === 0);
  const weighted = laneCount === 2 && trailing.length > 0 &&
    trailing.every(cellCancelled) && leading.some(c => !cellCancelled(c));
  const edges = weighted
    ? [0, ACTIVE_SHARE, PER_MILLE]
    : Array.from({ length: laneCount + 1 }, (_, i) => Math.floor((i * PER_MILLE) / laneCount));

  return ordered.map(cell => {
    const lane = lanes.get(cell.key)!;
    let last = lane;
    while (last + 1 < laneCount &&
      !ordered.some(o => o.key !== cell.key && lanes.get(o.key) === last + 1 && overlaps(o, cell))) {
      last++;
    }
    return { ...cell, start: edges[lane], width: edges[last + 1] - edges[lane] };
  });
}

// ── Field parts ───────────────────────────────────────────────────────────────

export type PartMark = 'plain' | 'added' | 'removed';

/** A comma-joined field split into the parts a cell draws, changed ones first. */
export function fieldParts(joined: string, added: string[], original: string | undefined, dense: boolean): Array<[string, PartMark]> {
  const current: Array<[string, PartMark]> = splitChanged(joined, added).map(([t, isAdded]) => [t, isAdded ? 'added' : 'plain']);
  const present = current.map(c => c[0]);
  const gone: Array<[string, PartMark]> = splitChanged(original ?? '', [])
    .map(p => p[0])
    .filter(t => !present.includes(t))
    .map(t => [t, 'removed']);
  const parts = [...current, ...gone];
  // Stable: changed parts first.
  const sorted = [...parts.filter(p => p[1] !== 'plain'), ...parts.filter(p => p[1] === 'plain')];
  if (dense && sorted.some(p => p[1] !== 'plain')) return sorted.filter(p => p[1] !== 'plain');
  return sorted;
}

// ── Colours ───────────────────────────────────────────────────────────────────

export const BRAND = {
  accent: '#6366F1',
  accentSoft: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  orange: '#F97316',
};

const FIXED_SUBJECT_COLORS: Record<string, string> = {
  D: '#5AA0E8',
  M: '#4ED87A',
  IT: '#E73BDF',
  'Bew.Sport': '#AA8EE0',
  ENGL: '#3DC4CE',
  R: '#C6E84A',
  'M5-M7': '#E08899',
  M8: '#E89E6E',
  'Re-Wiku': '#6AB87A',
};

function jsHash(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function hexHue(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d <= 0.0001) return 0;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return ((h * 60) + 360) % 360;
}

const hsl = (h: number, s: number, l: number) => `hsl(${h.toFixed(1)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;

export interface Tone {
  fill: string; ink: string; bar: string;
  fillDark: string; inkDark: string; barDark: string;
}

function subjectHue(name: string): number {
  const fixed = FIXED_SUBJECT_COLORS[name];
  return fixed ? hexHue(fixed) : jsHash(name) % 360;
}

/** Pastel subject tone (HSL), light and dark variants. */
export function subjectTone(name: string): Tone {
  const h = subjectHue(name);
  return {
    fill: hsl(h, 0.72, 0.91), ink: hsl(h, 0.62, 0.27), bar: hsl(h, 0.60, 0.55),
    fillDark: hsl(h, 0.34, 0.21), inkDark: hsl(h, 0.85, 0.87), barDark: hsl(h, 0.60, 0.62),
  };
}

/** Same pitch for a status colour, so status cells sit at the same weight as subject cells. */
export function statusTone(hex: string): Tone {
  const h = hexHue(hex);
  return {
    fill: hsl(h, 0.80, 0.92), ink: hsl(h, 0.62, 0.30), bar: hex,
    fillDark: hsl(h, 0.38, 0.22), inkDark: hsl(h, 0.85, 0.85), barDark: hex,
  };
}

/** Exams get a noticeably warmer yellow than the generic status pastel — they're what you scan for. */
export function examTone(): Tone {
  const h = hexHue(BRAND.warning);
  return {
    fill: hsl(h + 6, 0.95, 0.80), ink: hsl(h + 6, 0.75, 0.24), bar: BRAND.warning,
    fillDark: hsl(h + 6, 0.62, 0.30), inkDark: hsl(h + 6, 0.95, 0.86), barDark: BRAND.warning,
  };
}

export function cellTone(entry: TimetableEntry, kind: SlotKind): Tone {
  if (kind === 'cancelled' || entry.isCancelled) return statusTone(BRAND.danger);
  if (entry.isExam || kind === 'exam') return examTone();
  if (kind === 'event') return statusTone(BRAND.accentSoft);
  if (!entry.subjectName) return statusTone(BRAND.accent);
  return subjectTone(entry.subjectName);
}

/** CSS custom properties for a tone; the stylesheet picks light/dark. */
export function toneVars(t: Tone): Record<string, string> {
  return {
    '--tone-fill-l': t.fill, '--tone-ink-l': t.ink, '--tone-bar-l': t.bar,
    '--tone-fill-d': t.fillDark, '--tone-ink-d': t.inkDark, '--tone-bar-d': t.barDark,
  };
}

// ── .ics export ───────────────────────────────────────────────────────────────

function icsDateTime(date: number, time: number): string {
  const y = Math.floor(date / 10000);
  const m = Math.floor(date / 100) % 100;
  const d = date % 100;
  return `${y}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}T${String(Math.floor(time / 100)).padStart(2, '0')}${String(time % 100).padStart(2, '0')}00`;
}

const icsEscape = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

export function buildIcs(entries: TimetableEntry[], calendarName: string): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//POKYH//Web//DE', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${icsEscape(calendarName)}`];
  const sorted = [...entries].sort((a, b) => a.date - b.date || a.startTime - b.startTime);
  for (const e of sorted) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${e.id}-${e.date}-${e.startTime}@pokyh.com`);
    lines.push(`DTSTART:${icsDateTime(e.date, e.startTime)}`);
    lines.push(`DTEND:${icsDateTime(e.date, e.endTime)}`);
    lines.push(`SUMMARY:${icsEscape(e.subjectName || e.note || 'Stunde')}`);
    if (e.roomName) lines.push(`LOCATION:${icsEscape(e.roomName)}`);
    const desc = [e.teacherName ? `Lehrer: ${e.teacherName}` : '', e.examDescription ?? '', e.note ?? ''].filter(Boolean);
    if (desc.length) lines.push(`DESCRIPTION:${icsEscape(desc.join('\n'))}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
