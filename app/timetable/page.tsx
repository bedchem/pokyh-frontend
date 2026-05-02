'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, FileText, ArrowLeftRight, CalendarDays } from 'lucide-react';
import { addDays, format, startOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import Spinner from '@/components/ui/Spinner';
import ErrorView from '@/components/ui/ErrorView';
import { fetchTimetable } from '@/lib/api';
import { subjectColor } from '@/lib/colors';
import type { TimetableEntry } from '@/lib/types';

// ── Constants ─────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const PX_PER_MIN = 1.35;

const PERIODS = [
  { num: 1, s: 470, e: 520 },  // 07:50 - 08:40
  { num: 2, s: 520, e: 570 },  // 08:40 - 09:30
  { num: 3, s: 570, e: 620 },  // 09:30 - 10:20
  { num: 4, s: 635, e: 685 },  // 10:35 - 11:25
  { num: 5, s: 685, e: 735 },  // 11:25 - 12:15
  { num: 6, s: 735, e: 785 },  // 12:15 - 13:05
  { num: 7, s: 795, e: 845 },  // 13:15 - 14:05
  { num: 8, s: 845, e: 895 },  // 14:05 - 14:55
  { num: 9, s: 905, e: 955 },  // 15:05 - 15:55
  { num: 10, s: 955, e: 1005 },// 15:55 - 16:45
];

// ── Types ─────────────────────────────────────────────────────────────────────

type SlotKind = 'normal' | 'cancelled' | 'replacement' | 'exam' | 'event';
type DayKind = 'normal' | 'holiday' | 'allCancelled' | 'allReplacement' | 'fullDayEvent' | 'weekend';

interface MergedSlot {
  display: TimetableEntry;
  replacement?: TimetableEntry;
  kind: SlotKind;
}

// ── API response types ────────────────────────────────────────────────────────

interface ApiEntity {
  type: string;
  status: string;
  shortName: string;
  longName: string;
  displayName: string;
}

interface ApiPositionItem {
  current: ApiEntity | null;
  removed: ApiEntity | null;
}

interface ApiGridEntry {
  ids: number[];
  duration: { start: string; end: string };
  type: string;
  status: string;
  position1: ApiPositionItem[] | null;
  position2: ApiPositionItem[] | null;
  position3: ApiPositionItem[] | null;
  lessonText: string;
  lessonInfo: string | null;
}

interface ApiDay {
  date: string;
  status: string;
  gridEntries: ApiGridEntry[];
}

// ── Parse timetable from the v1/timetable/entries API ────────────────────────

function parseTimetable(json: unknown): TimetableEntry[] {
  try {
    const root = json as { days?: ApiDay[] };
    if (!root.days) return [];

    const entries: TimetableEntry[] = [];

    for (const day of root.days) {
      if (!day.gridEntries?.length) continue;
      const dateNum = parseInt(day.date.replace(/-/g, ''), 10);

      for (const ge of day.gridEntries) {
        const [startH, startM] = ge.duration.start.split('T')[1].split(':').map(Number);
        const [endH, endM]     = ge.duration.end.split('T')[1].split(':').map(Number);
        const startTime = startH * 100 + startM;
        const endTime   = endH   * 100 + endM;

        const pos1 = ge.position1 ?? [];
        const pos2 = ge.position2 ?? [];
        const pos3 = ge.position3 ?? [];

        const activeTeachers  = pos1.filter(p => p.current).map(p => p.current!.displayName).filter(Boolean);
        const removedTeachers = pos1.filter(p => p.removed).map(p => p.removed!.displayName).filter(Boolean);

        const activeSub  = pos2.find(p => p.current)?.current ?? null;
        const removedSub = pos2.find(p => p.removed)?.removed ?? null;

        const activeRooms  = pos3.filter(p => p.current).map(p => p.current!.displayName).filter(Boolean);
        const removedRooms = pos3.filter(p => p.removed).map(p => p.removed!.displayName).filter(Boolean);

        const isExam         = ge.type === 'EXAM';
        const isCancelled    = ge.status === 'CANCELLED';
        const isChanged      = ge.status === 'CHANGED';
        const isSubstitution = isChanged && removedTeachers.length > 0;

        entries.push({
          id:               ge.ids[0],
          lessonId:         ge.ids[0],
          date:             dateNum,
          startTime,
          endTime,
          subjectName:      activeSub?.shortName  ?? removedSub?.shortName  ?? '',
          subjectLong:      activeSub?.longName   ?? removedSub?.longName   ?? '',
          teacherName:      activeTeachers.join(', '),
          roomName:         activeRooms.join(', '),
          cellState:        isCancelled ? 'CANCEL' : isChanged ? 'SUBSTITUTION' : 'STANDARD',
          isExam,
          isCancelled,
          isSubstitution,
          isAdditional:     ge.type === 'ADDITIONAL',
          originalSubject:     removedSub?.shortName ?? '',
          originalSubjectLong: removedSub?.longName  ?? '',
          originalTeacher:  removedTeachers.join(', '),
          originalRoom:     removedRooms.join(', '),
          note:             ge.lessonInfo || ge.lessonText || undefined,
        });
      }
    }

    return entries.sort((a, b) =>
      a.date !== b.date ? a.date - b.date : a.startTime - b.startTime,
    );
  } catch {
    return [];
  }
}

// ── Time helpers ──────────────────────────────────────────────────────────────

function parseTime(t: number): string {
  const s = t.toString().padStart(4, '0');
  return `${s.slice(0, 2)}:${s.slice(2, 4)}`;
}

function toMins(t: number): number {
  const s = t.toString().padStart(4, '0');
  return parseInt(s.slice(0, 2)) * 60 + parseInt(s.slice(2, 4));
}

// ── Slot building ─────────────────────────────────────────────────────────────

function buildSlots(dayEntries: TimetableEntry[]): MergedSlot[] {
  // Step 1: group entries sharing the same startTime into one cell
  const groups = new Map<number, TimetableEntry[]>();
  for (const e of dayEntries) {
    if (!groups.has(e.startTime)) groups.set(e.startTime, []);
    groups.get(e.startTime)!.push(e);
  }

  const slots: MergedSlot[] = [];
  for (const [groupStart, group] of [...groups.entries()].sort((a, b) => a[0] - b[0])) {
    const cancelled = group.filter(e => e.isCancelled);
    let   active    = group.filter(e => !e.isCancelled);

    // A cancelled lesson whose startTime is earlier but whose range covers this slot
    // (one long cancelled entry spanning multiple period groups).
    const spanningCancelled = cancelled.length === 0
      ? dayEntries.filter(e =>
          e.isCancelled &&
          toMins(e.startTime) < toMins(groupStart) &&
          toMins(e.endTime)   > toMins(groupStart)
        )
      : [];
    const effectiveCancelled = cancelled.length > 0 ? cancelled : spanningCancelled;

    // A substitute whose startTime is earlier but whose range covers this slot
    // (one long active entry spanning multiple period groups).
    if (active.length === 0 && effectiveCancelled.length > 0) {
      const spanning = dayEntries.filter(e =>
        !e.isCancelled &&
        toMins(e.startTime) < toMins(groupStart) &&
        toMins(e.endTime)   > toMins(groupStart)
      );
      if (spanning.length > 0) active = spanning;
    }

    if (active.length === 0) {
      slots.push({ display: effectiveCancelled[0], kind: 'cancelled' });
      continue;
    }

    if (effectiveCancelled.length > 0) {
      // Cancelled original + substitute active
      slots.push({ display: effectiveCancelled[0], replacement: active[0], kind: 'replacement' });
      continue;
    }

    // No cancelled entries — pick best active entry
    const display =
      active.find(e => e.isExam) ??
      active.find(e => e.isAdditional) ??
      active.find(e => !e.subjectName && !!e.note) ??
      active.find(e => e.isSubstitution) ??
      active[0];

    // Kind comes from the winning entry only — cancelled siblings must not colour it orange.
    const kind: SlotKind =
      display.isExam                         ? 'exam'
      : display.isAdditional                 ? 'normal'
      : !display.subjectName && display.note ? 'event'
      : display.isSubstitution               ? 'replacement'
      : 'normal';

    slots.push({ display, kind });
  }

  // Step 2: remove cancelled slots that are visually contained inside an active slot
  // (e.g. a full-day Veranstaltung 07:50–15:55 hides cancelled lessons at 08:40, 09:30…)
  const activeSlots = slots.filter(s => !s.display.isCancelled);
  return slots.filter(slot => {
    if (!slot.display.isCancelled) return true;
    const sm = toMins(slot.display.startTime);
    const em = toMins(slot.display.endTime);
    return !activeSlots.some(a => {
      const asm = toMins(a.display.startTime);
      const aem = toMins(a.display.endTime);
      return asm <= sm && aem >= em;
    });
  });
}

// ── Day state detection ───────────────────────────────────────────────────────

function getDayKind(dayEntries: TimetableEntry[], hasOtherDayEntries: boolean): DayKind {
  if (dayEntries.length === 0) {
    return hasOtherDayEntries ? 'holiday' : 'normal';
  }
  if (dayEntries.length === 1 && !dayEntries[0].isCancelled &&
      !dayEntries[0].subjectName && dayEntries[0].note) {
    return 'fullDayEvent';
  }
  const active = dayEntries.filter(e => !e.isCancelled);
  if (active.length === 0) return 'allCancelled';
  return 'normal';
}

// ── Detail Sheet ──────────────────────────────────────────────────────────────

function LessonDetailSheet({ slot, onClose }: { slot: MergedSlot; onClose: () => void }) {
  const { display, kind } = slot;
  const hasReplacement = !!slot.replacement;

  const hasInlineOriginal =
    !hasReplacement &&
    display.isSubstitution &&
    !!display.originalSubject &&
    display.originalSubject !== display.subjectName;

  const accentColor =
    display.isCancelled ? 'var(--danger)'
    : display.isExam    ? 'var(--warning)'
    : hasInlineOriginal ? subjectColor(display.originalSubject ?? '')
    : subjectColor(display.subjectName);

  const headerName = hasInlineOriginal
    ? (display.originalSubjectLong || display.originalSubject || '')
    : (display.subjectLong || display.subjectName || display.note || '');

  // Teachers
  const activeTeachers = display.teacherName ? display.teacherName.split(', ').filter(Boolean) : [];
  const absentTeachers = display.originalTeacher ? display.originalTeacher.split(', ').filter(Boolean) : [];

  // Rooms
  const activeRooms = display.roomName ? display.roomName.split(', ').filter(Boolean) : [];
  const absentRooms = display.originalRoom
    ? display.originalRoom.split(', ').filter(Boolean).filter(r => !activeRooms.includes(r))
    : [];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-h-[85dvh] overflow-y-auto rounded-t-2xl"
        style={{ background: 'var(--app-surface)' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-5" style={{ background: 'var(--app-border)' }} />
        <div className="px-5 pb-10">
          {/* Header */}
          <div className="flex items-start gap-3 mb-5">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-bold"
              style={{
                background: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
                color: accentColor,
              }}
            >
              {headerName.slice(0, 1).toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[20px] font-bold leading-tight"
                style={{
                  color: hasInlineOriginal ? 'color-mix(in srgb, var(--danger) 70%, transparent)' : 'var(--app-text-primary)',
                  textDecoration: hasInlineOriginal ? 'line-through' : 'none',
                  letterSpacing: '-0.3px',
                }}
              >
                {headerName}
              </p>
              {display.subjectLong && display.subjectLong !== display.subjectName && !hasInlineOriginal && (
                <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>{display.subjectLong}</p>
              )}
            </div>
            {/* Badges */}
            {display.isCancelled && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0"
                style={{ background: 'color-mix(in srgb, var(--danger) 14%, transparent)', color: 'var(--danger)' }}>
                <X size={11} />Entfall
              </span>
            )}
            {display.isExam && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0"
                style={{ background: 'color-mix(in srgb, var(--warning) 14%, transparent)', color: 'var(--warning)' }}>
                <FileText size={11} />Prüfung
              </span>
            )}
            {display.isSubstitution && !display.isCancelled && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0"
                style={{ background: 'color-mix(in srgb, var(--orange) 14%, transparent)', color: 'var(--orange)' }}>
                <ArrowLeftRight size={11} />Vertretung
              </span>
            )}
          </div>

          <div style={{ height: 1, background: 'var(--app-border)', opacity: 0.4, marginBottom: 16 }} />

          {/* Time */}
          <SheetRow label="Zeit" value={`${parseTime(display.startTime)} – ${parseTime(display.endTime)}`} />

          {/* Teachers */}
          {!hasInlineOriginal && (activeTeachers.length > 0 || absentTeachers.length > 0) && (
            <div className="flex items-start gap-2 mb-2">
              <p className="text-sm flex-shrink-0" style={{ color: 'var(--app-text-tertiary)', minWidth: 52 }}>Lehrer</p>
              <div className="flex-1 min-w-0">
                {absentTeachers.map((t, i) => (
                  <p key={`a${i}`} className="text-sm font-medium"
                    style={{ textDecoration: 'line-through', textDecorationColor: 'var(--danger)', textDecorationThickness: '1.5px', color: 'color-mix(in srgb, var(--danger) 70%, transparent)' }}>
                    {t}
                  </p>
                ))}
                {activeTeachers.map((t, i) => (
                  <p key={`t${i}`} className="text-sm font-medium"
                    style={{ color: absentTeachers.length > 0 ? 'var(--orange)' : 'var(--app-text-secondary)' }}>
                    {t}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Room */}
          {!hasInlineOriginal && (activeRooms.length > 0 || absentRooms.length > 0) && (
            <div className="flex items-start gap-2 mb-2">
              <p className="text-sm flex-shrink-0" style={{ color: 'var(--app-text-tertiary)', minWidth: 52 }}>Raum</p>
              <div className="flex-1 min-w-0">
                {absentRooms.map((r, i) => (
                  <p key={`ra${i}`} className="text-sm font-medium"
                    style={{ textDecoration: 'line-through', textDecorationColor: 'var(--danger)', textDecorationThickness: '1.5px', color: 'color-mix(in srgb, var(--danger) 70%, transparent)' }}>
                    {r}
                  </p>
                ))}
                {activeRooms.map((r, i) => (
                  <p key={`r${i}`} className="text-sm font-medium"
                    style={{ color: absentRooms.length > 0 ? 'var(--orange)' : 'var(--app-text-secondary)' }}>
                    {r}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          {display.note && (
            <>
              <div style={{ height: 1, background: 'var(--app-border)', opacity: 0.4, margin: '12px 0' }} />
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--app-text-tertiary)' }}>Notiz</p>
              <div className="rounded-xl p-3" style={{ background: 'var(--app-card)' }}>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--app-text-primary)' }}>{display.note}</p>
              </div>
            </>
          )}

          {/* Inline original → new subject block */}
          {hasInlineOriginal && (
            <>
              <div style={{ height: 1, background: 'var(--app-border)', opacity: 0.4, margin: '16px 0' }} />
              <div className="flex items-center gap-1.5 mb-3">
                <ArrowLeftRight size={14} color={subjectColor(display.subjectName)} />
                <p className="text-sm font-semibold" style={{ color: 'var(--app-text-secondary)' }}>Ersatz / Vertretung</p>
              </div>
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'var(--app-card)',
                  border: `1px solid color-mix(in srgb, ${subjectColor(display.subjectName)} 30%, transparent)`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: subjectColor(display.subjectName) }} />
                  <p className="text-[16px] font-bold" style={{ color: 'var(--app-text-primary)' }}>
                    {display.subjectLong || display.subjectName}
                  </p>
                </div>
                {display.teacherName && <SheetRow label="Lehrer" value={display.teacherName} small />}
                {display.roomName    && <SheetRow label="Raum"   value={display.roomName}    small />}
              </div>
            </>
          )}

          {/* Replacement card (cancelled original + active substitute) */}
          {slot.replacement && (
            <>
              <div style={{ height: 1, background: 'var(--app-border)', opacity: 0.4, margin: '16px 0' }} />
              <div className="flex items-center gap-1.5 mb-3">
                <ArrowLeftRight size={14} color={subjectColor(slot.replacement.subjectName) || 'var(--orange)'} />
                <p className="text-sm font-semibold" style={{ color: 'var(--app-text-secondary)' }}>Ersatz</p>
              </div>
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'var(--app-card)',
                  border: `1px solid color-mix(in srgb, ${subjectColor(slot.replacement.subjectName) || 'var(--orange)'} 30%, transparent)`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: subjectColor(slot.replacement.subjectName) || 'var(--orange)' }} />
                  <p className="text-[16px] font-bold" style={{ color: 'var(--app-text-primary)' }}>
                    {slot.replacement.subjectLong || slot.replacement.subjectName || slot.replacement.note || '?'}
                  </p>
                </div>
                {slot.replacement.teacherName && <SheetRow label="Lehrer" value={slot.replacement.teacherName} small />}
                {slot.replacement.roomName    && <SheetRow label="Raum"   value={slot.replacement.roomName}    small />}
                {slot.replacement.note && (
                  <p className="text-xs mt-2" style={{ color: 'var(--app-text-secondary)' }}>{slot.replacement.note}</p>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function SheetRow({
  label,
  value,
  small,
  valueStyle,
}: {
  label: string;
  value: string;
  small?: boolean;
  valueStyle?: React.CSSProperties;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <p className={`${small ? 'text-xs' : 'text-sm'} flex-shrink-0`} style={{ color: 'var(--app-text-tertiary)', minWidth: 52 }}>
        {label}
      </p>
      <p className={`${small ? 'text-xs' : 'text-sm'} font-medium flex-1`} style={{ color: 'var(--app-text-secondary)', ...valueStyle }}>
        {value}
      </p>
    </div>
  );
}

// ── Lesson Cell ───────────────────────────────────────────────────────────────

function LessonCell({ slot, onClick }: { slot: MergedSlot; onClick: () => void }) {
  const { display, kind } = slot;

  const hasInlineOriginal =
    display.isSubstitution &&
    !!display.originalSubject &&
    display.originalSubject !== display.subjectName;

  // Left bar color
  const leftColor =
    display.isCancelled  ? 'var(--danger)'
    : display.isExam     ? 'var(--warning)'
    : kind === 'replacement' ? 'var(--orange)'
    : subjectColor(display.subjectName);

  // Border color
  const isSpecial = display.isExam || display.isCancelled || kind === 'replacement' || kind === 'event';
  const borderColor =
    display.isCancelled      ? 'color-mix(in srgb, var(--danger) 70%, transparent)'
    : display.isExam         ? 'color-mix(in srgb, var(--warning) 70%, transparent)'
    : kind === 'replacement' ? 'color-mix(in srgb, var(--orange) 60%, transparent)'
    : isSpecial              ? 'color-mix(in srgb, var(--accent) 60%, transparent)'
    : 'var(--app-border)';

  // Status icon
  let StatusIcon: React.ReactNode = null;
  if (display.isCancelled && slot.replacement) {
    StatusIcon = <ArrowLeftRight size={9} color={subjectColor(slot.replacement.subjectName) || 'var(--orange)'} />;
  } else if (display.isCancelled) {
    StatusIcon = <X size={9} color="var(--danger)" />;
  } else if (display.isExam) {
    StatusIcon = <FileText size={9} color="var(--warning)" />;
  } else if (kind === 'replacement') {
    StatusIcon = <ArrowLeftRight size={9} color="var(--orange)" />;
  }

  function SubjectLabel() {
    if (hasInlineOriginal) {
      return (
        <>
          <p className="text-[11px] font-bold leading-tight truncate"
            style={{ color: 'color-mix(in srgb, var(--danger) 65%, transparent)', textDecoration: 'line-through', textDecorationColor: 'var(--danger)', textDecorationThickness: '1.5px' }}>
            {display.originalSubject}
          </p>
          <p className="text-[11px] font-bold leading-tight truncate"
            style={{ color: subjectColor(display.subjectName) }}>
            {display.subjectName}
          </p>
        </>
      );
    }
    const subjectText = display.subjectName || display.note || '';
    const subColor =
      display.isCancelled  ? 'color-mix(in srgb, var(--danger) 65%, transparent)'
      : display.isSubstitution ? 'var(--orange)'
      : 'var(--app-text-primary)';
    return (
      <p className="text-[11px] font-bold leading-tight truncate"
        style={{ color: subColor, textDecoration: display.isCancelled ? 'line-through' : 'none', textDecorationColor: 'var(--danger)', textDecorationThickness: '1.5px' }}>
        {subjectText}
      </p>
    );
  }

  function TeacherLabel() {
    if (hasInlineOriginal) return null;

    const active = display.teacherName ? display.teacherName.split(', ').filter(Boolean) : [];
    const absent = display.originalTeacher ? display.originalTeacher.split(', ').filter(Boolean) : [];

    if (active.length === 0 && absent.length === 0) return null;

    const activeColor =
      display.isCancelled ? 'color-mix(in srgb, var(--danger) 80%, transparent)'
      : (display.isSubstitution || absent.length > 0) ? 'color-mix(in srgb, var(--orange) 75%, transparent)'
      : 'var(--app-text-secondary)';

    return (
      <>
        {absent.map((t, i) => (
          <p key={`a${i}`} className="text-[10px] leading-tight truncate"
            style={{ color: 'color-mix(in srgb, var(--danger) 65%, transparent)', textDecoration: 'line-through', textDecorationColor: 'var(--danger)', textDecorationThickness: '1.2px' }}>
            {t}
          </p>
        ))}
        {active.map((t, i) => (
          <p key={`t${i}`} className="text-[10px] leading-tight truncate" style={{ color: activeColor }}>
            {t}
          </p>
        ))}
      </>
    );
  }

  function RoomChangeLabel() {
    if (hasInlineOriginal) return null;
    const roomAbsent = display.originalRoom ?? '';
    const roomActive = display.roomName ?? '';
    if (!roomAbsent || roomAbsent === roomActive) return null;
    return (
      <div className="flex items-center gap-0.5 leading-tight mt-0.5 min-w-0">
        <span className="text-[10px] truncate"
          style={{ color: 'color-mix(in srgb, var(--danger) 65%, transparent)', textDecoration: 'line-through', textDecorationColor: 'var(--danger)', textDecorationThickness: '1.2px' }}>
          {roomAbsent}
        </span>
        <span className="text-[9px] flex-shrink-0 px-0.5" style={{ color: 'var(--app-text-tertiary)' }}>→</span>
        <span className="text-[10px] truncate font-semibold" style={{ color: 'var(--orange)' }}>
          {roomActive || '–'}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full h-full rounded-lg text-left overflow-hidden flex press-scale"
      style={{
        background: 'var(--app-surface)',
        border: `${isSpecial ? '1.5px' : '1px'} solid ${borderColor}`,
        opacity: display.isCancelled ? 0.65 : 1,
      }}
    >
      <div className="w-[3px] flex-shrink-0 h-full" style={{ background: leftColor }} />
      <div className="flex-1 min-w-0 px-1 py-1 flex flex-col justify-start relative">
        <SubjectLabel />
        <TeacherLabel />
        <RoomChangeLabel />
        {StatusIcon && (
          <div className="absolute bottom-1 right-1">{StatusIcon}</div>
        )}
      </div>
    </button>
  );
}

// ── Special day columns ───────────────────────────────────────────────────────

function HolidayColumn({ height }: { height: number }) {
  return (
    <div className="rounded-lg flex flex-col items-center pt-3"
      style={{ height, background: 'color-mix(in srgb, var(--orange) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--orange) 28%, transparent)' }}>
      <span style={{ fontSize: 18 }}>🏖️</span>
      <p className="text-[10px] font-bold mt-1" style={{ color: 'var(--orange)' }}>Ferien</p>
    </div>
  );
}

function WeekendColumn({ height }: { height: number }) {
  return (
    <div className="rounded-lg flex flex-col items-center pt-3"
      style={{ height, background: 'color-mix(in srgb, var(--success-mid) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--success-mid) 28%, transparent)' }}>
      <span style={{ fontSize: 18 }}>🌿</span>
      <p className="text-[10px] font-bold mt-1" style={{ color: 'var(--success-mid)' }}>Wochenende</p>
    </div>
  );
}

function DayStatusColumn({ height, kind, onClick }: { height: number; kind: 'cancelled' | 'replacement'; onClick?: () => void }) {
  const color = kind === 'cancelled' ? 'var(--danger)' : 'var(--accent)';
  const label = kind === 'cancelled' ? 'Entfall' : 'Vertretung';
  const Icon  = kind === 'cancelled' ? X : ArrowLeftRight;
  const inner = (
    <div className="rounded-lg flex flex-col items-center pt-3"
      style={{ height, background: `color-mix(in srgb, ${color} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 28%, transparent)` }}>
      <div className="w-7 h-7 rounded-full flex items-center justify-center"
        style={{ background: `color-mix(in srgb, ${color} 14%, transparent)` }}>
        <Icon size={13} color={color} />
      </div>
      <p className="text-[10px] font-bold mt-1" style={{ color }}>{label}</p>
    </div>
  );
  if (onClick) {
    return <button className="w-full press-scale" style={{ display: 'block' }} onClick={onClick}>{inner}</button>;
  }
  return inner;
}

function EventColumn({ height, label }: { height: number; label: string }) {
  return (
    <div className="rounded-lg flex flex-col items-center pt-3 px-1"
      style={{ height, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}>
      <div className="w-7 h-7 rounded-full flex items-center justify-center"
        style={{ background: 'color-mix(in srgb, var(--accent) 16%, transparent)' }}>
        <CalendarDays size={13} color="var(--accent)" />
      </div>
      <p className="text-[10px] font-bold mt-1 text-center leading-tight"
        style={{ color: 'var(--accent)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {label || 'Veranstaltung'}
      </p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const SWIPE_THRESHOLD  = 60;
const SWIPE_MAX_DRAG   = 180;
const SWIPE_INTENT_THR = 8;
const SWIPE_PHASE_DUR  = 0.2;
const SWIPE_RESET_DUR  = 0.14;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export default function TimetablePage() {
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [entries,    setEntries]    = useState<TimetableEntry[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const [panelX,             setPanelX]             = useState(0);
  const [isDraggingSwipe,    setIsDraggingSwipe]    = useState(false);
  const [isAnimatingSwipe,   setIsAnimatingSwipe]   = useState(false);
  const [isPanelSnap,        setIsPanelSnap]        = useState(false);
  const [panelTweenDuration, setPanelTweenDuration] = useState(0.2);

  const [nowMinutes, setNowMinutes] = useState<number>(() => {
    const n = new Date(); return n.getHours() * 60 + n.getMinutes();
  });

  const [activeSlot, setActiveSlot] = useState<MergedSlot | null>(null);

  const swipeHostRef = useRef<HTMLDivElement | null>(null);
  const cacheRef     = useRef<Record<number, TimetableEntry[]>>({});
  const preloadRef   = useRef<Record<number, boolean>>({});
  const timeRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const swipeRef     = useRef({ pointerId: -1, startX: 0, startY: 0, endX: 0, endY: 0, lastX: 0, lastTs: 0, velocityX: 0, horizontalIntent: false, active: false });
  const pendingWeekDeltaRef = useRef<0 | 1 | -1>(0);
  const swipeStageRef       = useRef<'idle' | 'exiting' | 'entering'>('idle');
  const dragFrameRef        = useRef<number | null>(null);
  const dragXRef            = useRef(0);

  const monday      = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  const weekDates   = Array.from({ length: 6 }, (_, i) => addDays(monday, i));
  const todayStr    = format(new Date(), 'yyyyMMdd');
  const isCurrentWeek = weekOffset === 0;

  useEffect(() => {
    timeRef.current = setInterval(() => {
      const n = new Date(); setNowMinutes(n.getHours() * 60 + n.getMinutes());
    }, 60_000);
    return () => { if (timeRef.current) clearInterval(timeRef.current); };
  }, []);

  // ── Load ────────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (cacheRef.current[weekOffset]) {
      setEntries(cacheRef.current[weekOffset]);
      setLoading(false);
      return;
    }
    setLoading(true); setError('');
    try {
      const dateStr = format(monday, 'yyyy-MM-dd');
      const res     = await fetchTimetable(dateStr);
      const parsed  = parseTimetable(res);
      cacheRef.current[weekOffset] = parsed;
      setEntries(parsed);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'session_expired') { router.replace('/login'); return; }
      setError(e instanceof Error ? e.message : 'Fehler beim Laden des Stundenplans');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset]);

  useEffect(() => { load(); }, [load]);

  // Preload adjacent weeks
  useEffect(() => {
    [weekOffset - 1, weekOffset + 1].forEach((offset) => {
      if (cacheRef.current[offset] || preloadRef.current[offset]) return;
      preloadRef.current[offset] = true;
      const preloadMonday = startOfWeek(addDays(new Date(), offset * 7), { weekStartsOn: 1 });
      fetchTimetable(format(preloadMonday, 'yyyy-MM-dd'))
        .then((res) => { cacheRef.current[offset] = parseTimetable(res); })
        .catch(() => {})
        .finally(() => { preloadRef.current[offset] = false; });
    });
  }, [weekOffset]);

  useEffect(() => () => { if (dragFrameRef.current !== null) cancelAnimationFrame(dragFrameRef.current); }, []);

  // ── Swipe gestures ──────────────────────────────────────────────────────────

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (isAnimatingSwipe) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const nowTs = performance.now();
    swipeRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, endX: e.clientX, endY: e.clientY, lastX: e.clientX, lastTs: nowTs, velocityX: 0, horizontalIntent: false, active: true };
    setIsDraggingSwipe(false);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!swipeRef.current.active || swipeRef.current.pointerId !== e.pointerId) return;
    swipeRef.current.endX = e.clientX; swipeRef.current.endY = e.clientY;
    const deltaX = e.clientX - swipeRef.current.startX;
    const deltaY = e.clientY - swipeRef.current.startY;
    if (!swipeRef.current.horizontalIntent) {
      if (Math.abs(deltaX) > SWIPE_INTENT_THR || Math.abs(deltaY) > SWIPE_INTENT_THR) {
        swipeRef.current.horizontalIntent = Math.abs(deltaX) > Math.abs(deltaY);
        if (swipeRef.current.horizontalIntent) e.currentTarget.setPointerCapture(e.pointerId);
      }
    }
    if (!swipeRef.current.horizontalIntent) return;
    const nowTs = performance.now();
    const dt = Math.max(1, nowTs - swipeRef.current.lastTs);
    swipeRef.current.velocityX = swipeRef.current.velocityX * 0.72 + ((e.clientX - swipeRef.current.lastX) / dt) * 0.28;
    swipeRef.current.lastX = e.clientX; swipeRef.current.lastTs = nowTs;
    const limit = Math.max(SWIPE_MAX_DRAG, (swipeHostRef.current?.clientWidth ?? 360) * 0.5);
    let targetX = deltaX;
    if (Math.abs(targetX) > limit) { const ov = Math.abs(targetX) - limit; targetX = Math.sign(targetX) * (limit + ov * 0.18); }
    dragXRef.current = targetX;
    if (!isDraggingSwipe) setIsDraggingSwipe(true);
    if (dragFrameRef.current !== null) return;
    dragFrameRef.current = requestAnimationFrame(() => { setPanelX(dragXRef.current); dragFrameRef.current = null; });
  }

  function finishSwipe(e: React.PointerEvent<HTMLDivElement>) {
    if (!swipeRef.current.active || swipeRef.current.pointerId !== e.pointerId) return;
    const deltaX = swipeRef.current.endX - swipeRef.current.startX;
    const deltaY = swipeRef.current.endY - swipeRef.current.startY;
    swipeRef.current.active = false; setIsDraggingSwipe(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (!swipeRef.current.horizontalIntent || Math.abs(deltaX) <= Math.abs(deltaY)) { setPanelTweenDuration(SWIPE_RESET_DUR); setPanelX(0); return; }
    const containerW = swipeHostRef.current?.clientWidth ?? 360;
    const absVelocity = Math.abs(swipeRef.current.velocityX);
    const distanceTrigger = Math.max(SWIPE_THRESHOLD, containerW * 0.18);
    if (Math.abs(deltaX) < distanceTrigger && absVelocity < 0.55) { setPanelTweenDuration(clamp(0.1 + Math.abs(deltaX) / 900, 0.1, 0.18)); setPanelX(0); return; }
    const weekDelta  = deltaX < 0 ? 1 : -1;
    const slideOut   = containerW + 36;
    const slideTarget = weekDelta === 1 ? -slideOut : slideOut;
    const estimatedSpeed = Math.max(900, absVelocity * 1800);
    setPanelTweenDuration(clamp(Math.max(12, Math.abs(slideTarget - panelX)) / estimatedSpeed, 0.12, 0.24));
    pendingWeekDeltaRef.current = weekDelta; swipeStageRef.current = 'exiting'; setIsAnimatingSwipe(true); setPanelX(slideTarget);
  }

  function handlePanelAnimationComplete() {
    if (!isAnimatingSwipe) return;
    if (swipeStageRef.current === 'exiting') {
      const weekDelta = pendingWeekDeltaRef.current; if (!weekDelta) return;
      pendingWeekDeltaRef.current = 0;
      setWeekOffset((o) => o + weekDelta);
      swipeStageRef.current = 'entering'; setIsPanelSnap(true);
      const slideOut = (swipeHostRef.current?.clientWidth ?? 360) + 36;
      setPanelX(weekDelta === 1 ? slideOut : -slideOut);
      requestAnimationFrame(() => requestAnimationFrame(() => { setIsPanelSnap(false); setPanelTweenDuration(SWIPE_PHASE_DUR); setPanelX(0); }));
      return;
    }
    if (swipeStageRef.current === 'entering') { swipeStageRef.current = 'idle'; setIsAnimatingSwipe(false); }
  }

  // ── Derived data ────────────────────────────────────────────────────────────

  function entriesForDay(date: Date): TimetableEntry[] {
    const d = parseInt(format(date, 'yyyyMMdd'));
    return entries.filter(e => e.date === d);
  }

  const isHolidayWeek   = !loading && !error && entries.length === 0;
  const dayEntries      = weekDates.map(date => entriesForDay(date));
  const anyDayHasEntries = dayEntries.some(de => de.length > 0);
  const daySlotsMap     = weekDates.map((_, di) => buildSlots(dayEntries[di]));
  const dayKinds: DayKind[] = dayEntries.map((de, i) => {
    if (i === 5 && de.length === 0) return 'weekend';
    const base = getDayKind(de, anyDayHasEntries);
    if (base === 'normal') {
      const slots = daySlotsMap[i];
      if (slots.length > 0 && slots.every(s => s.kind === 'replacement')) {
        const firstRepl = slots[0].replacement;
        const isExactSame = slots.every(s => 
          s.replacement?.subjectName === firstRepl?.subjectName && 
          s.replacement?.note === firstRepl?.note &&
          s.replacement?.teacherName === firstRepl?.teacherName
        );
        if (isExactSame) return 'allReplacement';
      }
    }
    return base;
  });

  const allStartMins  = [...new Set(entries.map(e => toMins(e.startTime)))].sort((a, b) => a - b);
  const allEndMins    = [...new Set(entries.map(e => toMins(e.endTime)))].sort((a, b) => a - b);
  const minMins       = allStartMins[0] ?? 470;
  const maxMins       = allEndMins[allEndMins.length - 1] ?? 960;
  const totalGridHeight = Math.max(400, (maxMins - minMins) * PX_PER_MIN);
  const timeLabels    = allStartMins;

  function weekNumber(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const diff = (date.getTime() - startOfYear.getTime()) / 86400000;
    return Math.ceil((diff + startOfYear.getDay()) / 7);
  }

  function dayHeaderColor(kind: DayKind, isToday: boolean): string {
    if (isToday)                    return 'var(--accent)';
    if (kind === 'holiday')         return 'var(--orange)';
    if (kind === 'weekend')         return 'var(--success-mid)';
    if (kind === 'allCancelled')    return 'var(--danger)';
    if (kind === 'allReplacement')  return 'var(--orange)';
    return 'var(--app-text-primary)';
  }

  return (
    <AuthGuard>
      <div
        ref={swipeHostRef}
        className="h-full flex flex-col overflow-hidden"
        style={{ background: 'var(--app-bg)', touchAction: 'pan-y' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishSwipe}
        onPointerCancel={finishSwipe}
      >
        {/* ── Header ── */}
        <div className="px-5 pt-4 pb-2 fade-in flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={() => setWeekOffset(o => o - 1)}
              className="p-2 rounded-full press-scale"
              style={{ background: 'var(--app-surface)' }}
            >
              <ChevronLeft size={20} color="var(--accent)" />
            </button>
            <div className="text-center">
              <p className="text-[15px] font-medium" style={{ color: 'var(--app-text-secondary)' }}>
                {format(monday, 'd. MMM', { locale: de })} – {format(addDays(monday, 5), 'd. MMM yyyy', { locale: de })}
              </p>
              <p className="text-[12px]" style={{ color: 'var(--app-text-tertiary)' }}>
                KW {weekNumber(monday)}
                {weekOffset === 0 && <span> · Diese Woche</span>}
              </p>
            </div>
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={() => setWeekOffset(o => o + 1)}
              className="p-2 rounded-full press-scale"
              style={{ background: 'var(--app-surface)' }}
            >
              <ChevronRight size={20} color="var(--accent)" />
            </button>
          </div>
        </div>

        <motion.div
          className="flex-1 flex flex-col min-h-0 relative overflow-hidden"
          animate={{ x: panelX }}
          transition={
            isPanelSnap || isDraggingSwipe
              ? { duration: 0 }
              : { type: 'tween', duration: panelTweenDuration, ease: [0.22, 0.61, 0.36, 1] }
          }
          onAnimationComplete={handlePanelAnimationComplete}
        >
          {/* ── Day header row ── */}
          <div className="px-3 flex gap-1 mb-1 flex-shrink-0" style={{ paddingLeft: 44 }}>
            {weekDates.map((date, i) => {
              const isToday  = format(date, 'yyyyMMdd') === todayStr;
              const kind     = dayKinds[i];
              const txtColor = dayHeaderColor(kind, isToday);
              return (
                <div key={i} className="flex-1 text-center">
                  <p className="text-[11px] font-semibold" style={{ color: isToday ? 'var(--accent)' : 'var(--app-text-tertiary)' }}>
                    {DAY_LABELS[i]}
                  </p>
                  <div className="flex justify-center mt-0.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: isToday ? 'var(--accent)' : 'transparent' }}>
                      <span className="text-[14px] font-bold" style={{ color: isToday ? '#fff' : txtColor }}>
                        {format(date, 'd')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex-shrink-0 mx-3" style={{ height: 1, background: 'var(--app-border)', opacity: 0.3 }} />

          {/* ── Content ── */}
          <div className="flex-1 overflow-auto pb-6 px-3 pt-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Spinner size={28} />
                <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>Stundenplan wird geladen…</p>
              </div>
            ) : error ? (
              <ErrorView message={error} onRetry={load} />
            ) : isHolidayWeek ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-22 h-22 rounded-full flex items-center justify-center"
                  style={{ background: 'color-mix(in srgb, var(--orange) 25%, transparent)', width: 88, height: 88 }}>
                  <span style={{ fontSize: 40 }}>🏖️</span>
                </div>
                <p className="text-[28px] font-bold tracking-tight" style={{ color: 'var(--app-text-primary)', letterSpacing: '-0.5px' }}>
                  Ferien
                </p>
                <p className="text-[15px] text-center" style={{ color: 'var(--app-text-secondary)' }}>
                  In dieser Woche ist kein Unterricht.
                </p>
                <p className="text-[13px]" style={{ color: 'var(--app-text-tertiary)' }}>
                  KW {weekNumber(monday)} · Genieße die Zeit! ☀️
                </p>
              </div>
            ) : (
              /* ── Normal week grid ── */
              <div className="flex gap-1">
                {/* Time labels */}
                <div className="flex-shrink-0 relative" style={{ width: 34, height: totalGridHeight }}>
                  {PERIODS.filter(p => p.e > minMins && p.s < maxMins).map((p, i, arr) => {
                    const topStart = (p.s - minMins) * PX_PER_MIN;
                    const topEnd = (p.e - minMins) * PX_PER_MIN;
                    const nextP = PERIODS.find(nx => nx.num === p.num + 1);
                    const showEnd = !nextP || nextP.s !== p.e;
                    
                    return (
                      <div key={p.num}>
                        <p className="absolute left-0 right-2 text-[11px] text-right font-medium tracking-tight leading-none" 
                           style={{ top: topStart - 6, color: 'var(--app-text-secondary)' }}>
                          {Math.floor(p.s / 60).toString().padStart(2, '0')}:{(p.s % 60).toString().padStart(2, '0')}
                        </p>
                        
                        <p className="absolute left-0 right-2 text-[10px] text-right leading-none" 
                           style={{ top: (topStart + topEnd) / 2 - 6, color: 'var(--app-text-tertiary)', opacity: 0.8 }}>
                          {p.num}.
                        </p>

                        {showEnd && (
                          <p className="absolute left-0 right-2 text-[11px] text-right font-medium tracking-tight leading-none" 
                             style={{ top: topEnd - 6, color: 'var(--app-text-secondary)' }}>
                            {Math.floor(p.e / 60).toString().padStart(2, '0')}:{(p.e % 60).toString().padStart(2, '0')}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Day columns */}
                {weekDates.map((date, di) => {
                  const isToday = format(date, 'yyyyMMdd') === todayStr;
                  const kind    = dayKinds[di];
                  const slots   = daySlotsMap[di];

                  return (
                    <div key={di} className="flex-1 relative"
                      style={{ height: totalGridHeight, background: 'transparent', borderRadius: 6 }}>

                      {kind === 'holiday'          && <HolidayColumn    height={totalGridHeight - 4} />}
                      {kind === 'weekend'          && <WeekendColumn    height={totalGridHeight - 4} />}
                      {kind === 'allCancelled'     && <DayStatusColumn  height={totalGridHeight - 4} kind="cancelled" />}
                      {kind === 'allReplacement'   && <DayStatusColumn  height={totalGridHeight - 4} kind="replacement" onClick={() => { const first = daySlotsMap[di][0]; if (first) setActiveSlot(first); }} />}
                      {kind === 'fullDayEvent'     && dayEntries[di][0] && (
                        <EventColumn height={totalGridHeight - 4} label={dayEntries[di][0].note ?? ''} />
                      )}

                      {/* Lesson cells */}
                      {kind === 'normal' && slots.flatMap((slot, si) => {
                        const startMins = slot.replacement
                          ? Math.max(toMins(slot.display.startTime), toMins(slot.replacement.startTime))
                          : toMins(slot.display.startTime);
                        const endMins = slot.replacement
                          ? Math.min(toMins(slot.display.endTime), toMins(slot.replacement.endTime))
                          : toMins(slot.display.endTime);

                        const breaks = [
                          { s: 620, e: 630 }, // 10:20 - 10:30
                          { s: 895, e: 905 }, // 14:55 - 15:05
                        ];

                        let segments = [{ s: startMins, e: endMins }];
                        for (const b of breaks) {
                          const nextSegments: {s: number, e: number}[] = [];
                          for (const seg of segments) {
                            if (seg.s < b.s && seg.e > b.e) {
                              nextSegments.push({ s: seg.s, e: b.s });
                              nextSegments.push({ s: b.e, e: seg.e });
                            } else {
                              nextSegments.push(seg);
                            }
                          }
                          segments = nextSegments;
                        }

                        return segments.map((seg, partIdx) => {
                          const top    = (seg.s - minMins) * PX_PER_MIN;
                          const height = Math.max(
                            (seg.e - minMins) * PX_PER_MIN - top - 2,
                            30,
                          );
                          return (
                            <div key={`${slot.display.id}-${si}-${partIdx}`} className="absolute left-0.5 right-0.5" style={{ top, height }}>
                              <LessonCell slot={slot} onClick={() => setActiveSlot(slot)} />
                            </div>
                          );
                        });
                      })}

                      {/* Current-time indicator */}
                      {isToday && isCurrentWeek && nowMinutes >= minMins && nowMinutes <= maxMins && (
                        <div className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
                          style={{ top: (nowMinutes - minMins) * PX_PER_MIN }}>
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />
                          <div className="flex-1 h-[1.5px]" style={{ background: 'var(--accent)' }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Detail Sheet */}
      <AnimatePresence>
        {activeSlot && (
          <LessonDetailSheet slot={activeSlot} onClose={() => setActiveSlot(null)} />
        )}
      </AnimatePresence>
    </AuthGuard>
  );
}
