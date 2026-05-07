'use client';

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  ArrowLeftRight,
  CalendarDays,
  CalendarClock,
  MapPin,
  User,
} from 'lucide-react';
import { addDays, format, startOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import Spinner from '@/components/ui/Spinner';
import ErrorView from '@/components/ui/ErrorView';
import { fetchTimetable } from '@/lib/api';
import { pcGetStale, pcSet } from '@/lib/persist-cache';
import { subjectColor } from '@/lib/colors';
import type { TimetableEntry } from '@/lib/types';

// ── Constants ─────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const DAY_LABELS_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

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

// 10:20-10:35 and 14:55-15:05 are real recess slots; 13:05-13:15 is the lunch slot
const BREAKS = [
  { s: 620, e: 635 },
  { s: 785, e: 795 },
  { s: 895, e: 905 },
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

        const activeTeachers      = pos1.filter(p => p.current).map(p => p.current!.displayName).filter(Boolean);
        const activeTeachersLong  = pos1.filter(p => p.current).map(p => p.current!.longName || p.current!.displayName).filter(Boolean);
        const removedTeachers     = pos1.filter(p => p.removed).map(p => p.removed!.displayName).filter(Boolean);
        const removedTeachersLong = pos1.filter(p => p.removed).map(p => p.removed!.longName || p.removed!.displayName).filter(Boolean);

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
          teacherLongName:  activeTeachersLong.join(', ') || undefined,
          roomName:         activeRooms.join(', '),
          cellState:        isCancelled ? 'CANCEL' : isChanged ? 'SUBSTITUTION' : 'STANDARD',
          isExam,
          isCancelled,
          isSubstitution,
          isAdditional:     ge.type === 'ADDITIONAL',
          originalSubject:     removedSub?.shortName ?? '',
          originalSubjectLong: removedSub?.longName  ?? '',
          originalTeacher:     removedTeachers.join(', '),
          originalTeacherLong: removedTeachersLong.join(', ') || undefined,
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

    const spanningCancelled = cancelled.length === 0
      ? dayEntries.filter(e =>
          e.isCancelled &&
          toMins(e.startTime) < toMins(groupStart) &&
          toMins(e.endTime)   > toMins(groupStart)
        )
      : [];
    const effectiveCancelled = cancelled.length > 0 ? cancelled : spanningCancelled;

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
      slots.push({ display: effectiveCancelled[0], replacement: active[0], kind: 'replacement' });
      continue;
    }

    const display =
      active.find(e => e.isExam) ??
      active.find(e => e.isAdditional) ??
      active.find(e => !e.subjectName && !!e.note) ??
      active.find(e => e.isSubstitution) ??
      active[0];

    const kind: SlotKind =
      display.isExam                         ? 'exam'
      : display.isAdditional                 ? 'normal'
      : !display.subjectName && display.note ? 'event'
      : display.isSubstitution               ? 'replacement'
      : 'normal';

    slots.push({ display, kind });
  }

  // Step 2: drop cancelled slots that are visually contained inside an active slot
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
  const { display } = slot;
  const hasReplacement = !!slot.replacement;

  const hasInlineOriginal =
    !hasReplacement &&
    display.isSubstitution &&
    !!display.originalSubject &&
    display.originalSubject !== display.subjectName;

  const hasCancelledWithReplacement = display.isCancelled && !!slot.replacement;

  const accentColor =
    hasCancelledWithReplacement ? subjectColor(slot.replacement!.subjectName) || 'var(--orange)'
    : display.isCancelled ? 'var(--danger)'
    : display.isExam    ? 'var(--warning)'
    : hasInlineOriginal ? subjectColor(display.originalSubject ?? '')
    : subjectColor(display.subjectName);

  const headerName = hasCancelledWithReplacement
    ? (slot.replacement!.subjectLong || slot.replacement!.subjectName || slot.replacement!.note || '')
    : hasInlineOriginal
      ? (display.originalSubjectLong || display.originalSubject || '')
      : (display.subjectLong || display.subjectName || display.note || '');

  const activeTeachers = (display.teacherLongName || display.teacherName) ? (display.teacherLongName || display.teacherName).split(', ').filter(Boolean) : [];
  const absentTeachers = (display.originalTeacherLong || display.originalTeacher) ? (display.originalTeacherLong || display.originalTeacher)!.split(', ').filter(Boolean) : [];
  const activeRooms = display.roomName ? display.roomName.split(', ').filter(Boolean) : [];
  const absentRooms = display.originalRoom
    ? display.originalRoom.split(', ').filter(Boolean).filter(r => !activeRooms.includes(r))
    : [];

  const replTeachers = (slot.replacement?.teacherLongName || slot.replacement?.teacherName)?.split(', ').filter(Boolean) ?? [];
  const replRooms    = slot.replacement?.roomName?.split(', ').filter(Boolean) ?? [];

  const showMeta     = !hasCancelledWithReplacement && !hasInlineOriginal && (activeTeachers.length > 0 || absentTeachers.length > 0 || activeRooms.length > 0 || absentRooms.length > 0);
  const showReplMeta = hasCancelledWithReplacement && (replTeachers.length > 0 || replRooms.length > 0);

  const imageSubject = hasCancelledWithReplacement
    ? (slot.replacement!.subjectLong || slot.replacement!.subjectName || '')
    : hasInlineOriginal
      ? (display.originalSubjectLong || display.originalSubject || '')
      : (display.subjectLong || display.subjectName || '');

  const [bgImage, setBgImage] = useState<string | null>(null);
  useEffect(() => {
    if (!imageSubject) { setBgImage(null); return; }
    import('@/lib/api-client').then(({ api }) => {
      api.subjectImages.getCache().then(cache => {
        const key = imageSubject.toLowerCase().trim();
        setBgImage(cache.has(key) ? api.subjectImages.imageUrl(key) : null);
      });
    });
  }, [imageSubject]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-[28px] fade-in"
        style={{ background: 'var(--app-surface)', animationDuration: '0.25s' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Colored header */}
        <div className="relative" style={{ height: 180 }}>
          <div
            className="w-full h-full"
            style={{
              background: bgImage
                ? '#000'
                : `linear-gradient(135deg, color-mix(in srgb, ${accentColor} 32%, var(--app-surface)), color-mix(in srgb, ${accentColor} 14%, var(--app-surface)))`,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {bgImage && (
              <img
                src={bgImage}
                alt=""
                aria-hidden="true"
                style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  objectFit: 'cover', objectPosition: 'center',
                  opacity: 0.85,
                  filter: 'saturate(1.1)',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              />
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span style={{ fontSize: 96, fontWeight: 800, color: bgImage ? '#fff' : accentColor, opacity: bgImage ? 0.28 : 0.15, lineHeight: 1, letterSpacing: '-0.04em' }}>
              {(headerName || '?').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.45) 100%)' }}
          />
          <div className="absolute bottom-4 left-5 flex gap-1.5 flex-wrap">
            {display.isCancelled && !hasCancelledWithReplacement && (
              <span className="lesson-popup-badge danger"><X size={10} />Entfall</span>
            )}
            {hasCancelledWithReplacement && (
              <span className="lesson-popup-badge orange"><ArrowLeftRight size={10} />Vertretung</span>
            )}
            {display.isExam && (
              <span className="lesson-popup-badge warning"><FileText size={10} />Prüfung</span>
            )}
            {display.isSubstitution && !display.isCancelled && (
              <span className="lesson-popup-badge orange"><ArrowLeftRight size={10} />Vertretung</span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Schließen"
            className="absolute top-5 right-5 flex items-center justify-center rounded-full press-scale transition-colors duration-200 text-white hover:text-[#D97777]"
            style={{ width: 32, height: 32, background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.35)', boxShadow: '0 1px 10px rgba(0,0,0,0.18)' }}
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h2
              className="text-xl font-bold flex-1"
              style={{ color: 'var(--app-text-primary)', ...(hasInlineOriginal ? { textDecoration: 'line-through', opacity: 0.55 } : {}) }}
            >
              {headerName || '—'}
            </h2>
          </div>
          {!hasCancelledWithReplacement && display.subjectLong && display.subjectLong !== display.subjectName && !hasInlineOriginal && (
            <p className="text-sm mb-1" style={{ color: 'var(--app-text-secondary)' }}>{display.subjectLong}</p>
          )}
          {hasCancelledWithReplacement && slot.replacement!.subjectLong && slot.replacement!.subjectLong !== slot.replacement!.subjectName && (
            <p className="text-sm mb-1" style={{ color: 'var(--app-text-secondary)' }}>{slot.replacement!.subjectLong}</p>
          )}
          <p className="text-sm mb-4 flex items-center gap-1.5" style={{ color: 'var(--app-text-secondary)' }}>
            <CalendarClock size={13} />
            {parseTime(display.startTime)} – {parseTime(display.endTime)}
          </p>

          {showMeta && (
            <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--app-card)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--app-text-secondary)' }}>Details</p>
              <div className="flex flex-col gap-2">
                {absentTeachers.length > 0 && activeTeachers.length > 0 ? (
                  <div className="flex items-start gap-3 px-1 py-0.5">
                    <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 28, height: 28, background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
                      <User size={14} />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--app-text-tertiary)' }}>Lehrer</span>
                      <span className="text-sm" style={{ color: 'var(--danger)', textDecoration: 'line-through' }}>{absentTeachers.join(', ')}</span>
                      <span className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--app-text-secondary)' }}>
                        <ArrowLeftRight size={12} style={{ color: 'var(--orange)', flexShrink: 0 }} />
                        <span style={{ color: 'var(--orange)' }}>{activeTeachers.join(', ')}</span>
                      </span>
                    </div>
                  </div>
                ) : (activeTeachers.length > 0 || absentTeachers.length > 0) ? (
                  <div className="flex items-center gap-3 px-1 py-0.5">
                    <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 28, height: 28, background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
                      <User size={14} />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--app-text-tertiary)' }}>{absentTeachers.length > 0 ? 'Lehrer (abwesend)' : 'Lehrer'}</span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--app-text-primary)' }}>{activeTeachers.length > 0 ? activeTeachers.join(', ') : absentTeachers.join(', ')}</span>
                    </div>
                  </div>
                ) : null}
                {(activeRooms.length > 0 || (absentRooms.length > 0 && activeRooms.length === 0)) && (
                  <div className="flex items-center gap-3 px-1 py-0.5">
                    <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 28, height: 28, background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
                      <MapPin size={14} />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--app-text-tertiary)' }}>{absentRooms.length > 0 ? `Raum (statt ${absentRooms.join(', ')})` : 'Raum'}</span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--app-text-primary)' }}>{activeRooms.length > 0 ? activeRooms.join(', ') : absentRooms.join(', ')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {display.note && (
            <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--app-card)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--app-text-secondary)' }}>Notiz</p>
              <p className="text-sm" style={{ color: 'var(--app-text-primary)', lineHeight: '1.45', whiteSpace: 'pre-wrap' }}>{display.note}</p>
            </div>
          )}

          {hasInlineOriginal && (
            <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--app-card)' }}>
              <div className="flex items-center gap-2 mb-2">
                <ArrowLeftRight size={13} style={{ color: subjectColor(display.subjectName) || 'var(--orange)', flexShrink: 0 }} />
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--app-text-secondary)' }}>
                  Vertretung statt <strong style={{ color: 'var(--app-text-primary)' }}>{display.originalSubjectLong || display.originalSubject}</strong>
                </p>
              </div>
              <p className="text-sm font-bold mb-1" style={{ color: 'var(--app-text-primary)' }}>{display.subjectLong || display.subjectName}</p>
              {(display.teacherLongName || display.teacherName) && (
                <div className="flex items-center gap-2 mt-1">
                  <User size={12} style={{ color: 'var(--app-text-tertiary)', flexShrink: 0 }} />
                  <span className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>{display.teacherLongName || display.teacherName}</span>
                </div>
              )}
              {display.roomName && (
                <div className="flex items-center gap-2 mt-1">
                  <MapPin size={12} style={{ color: 'var(--app-text-tertiary)', flexShrink: 0 }} />
                  <span className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>{display.roomName}</span>
                </div>
              )}
            </div>
          )}

          {showReplMeta && (
            <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--app-card)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--app-text-secondary)' }}>Details</p>
              <div className="flex flex-col gap-2">
                {replTeachers.length > 0 && (
                  <div className="flex items-center gap-3 px-1 py-0.5">
                    <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 28, height: 28, background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
                      <User size={14} />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--app-text-tertiary)' }}>Lehrer</span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--app-text-primary)' }}>{replTeachers.join(', ')}</span>
                    </div>
                  </div>
                )}
                {replRooms.length > 0 && (
                  <div className="flex items-center gap-3 px-1 py-0.5">
                    <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 28, height: 28, background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
                      <MapPin size={14} />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--app-text-tertiary)' }}>Raum</span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--app-text-primary)' }}>{replRooms.join(', ')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {hasCancelledWithReplacement && (display.subjectName || display.teacherName) && (
            <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--app-card)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--app-text-secondary)' }}>Statt</p>
              <p className="text-sm font-bold" style={{ color: 'var(--app-text-tertiary)', textDecoration: 'line-through' }}>
                {display.subjectLong || display.subjectName || '—'}
              </p>
              {(display.teacherLongName || display.teacherName) && (
                <div className="flex items-center gap-2 mt-1.5">
                  <User size={12} style={{ color: 'var(--app-text-tertiary)', flexShrink: 0 }} />
                  <span className="text-sm" style={{ color: 'var(--app-text-tertiary)', textDecoration: 'line-through' }}>{display.teacherLongName || display.teacherName}</span>
                </div>
              )}
            </div>
          )}

          {slot.replacement && !hasCancelledWithReplacement && (
            <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--app-card)' }}>
              <div className="flex items-center gap-2 mb-2">
                <ArrowLeftRight size={13} style={{ color: subjectColor(slot.replacement.subjectName) || 'var(--orange)', flexShrink: 0 }} />
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--app-text-secondary)' }}>Ersatz</p>
              </div>
              <p className="text-sm font-bold mb-1" style={{ color: 'var(--app-text-primary)' }}>{slot.replacement.subjectLong || slot.replacement.subjectName || slot.replacement.note || '?'}</p>
              {slot.replacement.teacherName && (
                <div className="flex items-center gap-2 mt-1">
                  <User size={12} style={{ color: 'var(--app-text-tertiary)', flexShrink: 0 }} />
                  <span className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>{slot.replacement.teacherName}</span>
                </div>
              )}
              {slot.replacement.roomName && (
                <div className="flex items-center gap-2 mt-1">
                  <MapPin size={12} style={{ color: 'var(--app-text-tertiary)', flexShrink: 0 }} />
                  <span className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>{slot.replacement.roomName}</span>
                </div>
              )}
              {slot.replacement.note && (
                <p className="text-xs mt-2" style={{ color: 'var(--app-text-secondary)' }}>{slot.replacement.note}</p>
              )}
            </div>
          )}

          <div className="h-4" />
        </div>

        <style jsx>{`
          .lesson-popup-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 999px;
            letter-spacing: 0.01em;
          }
          .lesson-popup-badge.danger {
            background: color-mix(in srgb, var(--danger) 22%, rgba(0,0,0,0.3));
            color: #fff;
          }
          .lesson-popup-badge.warning {
            background: color-mix(in srgb, var(--warning) 22%, rgba(0,0,0,0.3));
            color: #fff;
          }
          .lesson-popup-badge.orange {
            background: color-mix(in srgb, var(--orange) 22%, rgba(0,0,0,0.3));
            color: #fff;
          }
        `}</style>
      </div>
    </div>
  );
}

// ── Lesson Cell ───────────────────────────────────────────────────────────────

function LessonCell({ slot, onClick, compact }: { slot: MergedSlot; onClick: () => void; compact: boolean }) {
  const { display, kind } = slot;

  const hasInlineOriginal =
    display.isSubstitution &&
    !!display.originalSubject &&
    display.originalSubject !== display.subjectName;

  const baseColor =
    display.isCancelled  ? 'var(--danger)'
    : display.isExam     ? 'var(--warning)'
    : kind === 'replacement' ? 'var(--orange)'
    : kind === 'event'    ? 'var(--accent)'
    : subjectColor(display.subjectName);

  const subjectText = hasInlineOriginal
    ? display.subjectName
    : (display.subjectName || display.note || '');

  const teacherActive = display.teacherName ? display.teacherName.split(', ').filter(Boolean) : [];
  const teacherAbsent = display.originalTeacher ? display.originalTeacher.split(', ').filter(Boolean) : [];

  const roomActive = display.roomName ?? '';
  const roomAbsent = display.originalRoom ?? '';
  const roomChanged = !!roomAbsent && roomAbsent !== roomActive;

  let StatusIcon: React.ReactNode = null;
  if (display.isCancelled && slot.replacement) {
    StatusIcon = <ArrowLeftRight size={11} style={{ color: subjectColor(slot.replacement.subjectName) || 'var(--orange)' }} />;
  } else if (display.isCancelled) {
    StatusIcon = <X size={11} />;
  } else if (display.isExam) {
    StatusIcon = <FileText size={11} />;
  } else if (kind === 'replacement') {
    StatusIcon = <ArrowLeftRight size={11} />;
  } else if (kind === 'event') {
    StatusIcon = <CalendarDays size={11} />;
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerDown={e => e.stopPropagation()}
      className={`lesson-cell ${compact ? 'is-compact' : ''}`}
      data-state={display.isCancelled ? 'cancelled' : kind}
      data-no-swipe="true"
      style={{ ['--lesson-color' as string]: baseColor }}
    >
      <div className="lesson-bar" />
      <div className="lesson-body">
        <div className="lesson-row">
          {hasInlineOriginal && (
            <span className="lesson-orig">{display.originalSubject}</span>
          )}
          <span className={`lesson-subject ${display.isCancelled ? 'is-struck' : ''}`}>
            {subjectText || '—'}
          </span>
        </div>
        {!compact && (
          <div className="lesson-meta">
            {teacherAbsent.length > 0 && teacherActive.length === 0 && (
              <span className="lesson-strike">{teacherAbsent.join(', ')}</span>
            )}
            {teacherAbsent.length > 0 && teacherActive.length > 0 && (
              <>
                <span className="lesson-strike">{teacherAbsent.join(', ')}</span>
                <span className="lesson-arrow">»</span>
              </>
            )}
            {teacherActive.length > 0 && (
              <span className={teacherAbsent.length > 0 ? 'lesson-emph' : ''}>
                {teacherActive.join(', ')}
              </span>
            )}
          </div>
        )}
        {!compact && (roomActive || roomChanged) && (
          <div className="lesson-meta">
            {roomChanged && (
              <>
                <span className="lesson-strike">{roomAbsent}</span>
                <span className="lesson-arrow">»</span>
                <span className="lesson-emph">{roomActive || '–'}</span>
              </>
            )}
            {!roomChanged && roomActive && <span>{roomActive}</span>}
          </div>
        )}
      </div>
      {StatusIcon && <span className="lesson-icon">{StatusIcon}</span>}

      <style jsx>{`
        .lesson-cell {
          --lc-text: var(--app-text-primary);

          width: 100%;
          height: 100%;
          display: flex;
          padding: 0;
          background: var(--app-surface);
          border: 1px solid var(--app-border);
          border-radius: 9px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.12s ease;
          font-family: inherit;
          text-align: left;
          position: relative;
        }
        .lesson-cell:active {
          transform: scale(0.985);
        }
        .lesson-bar {
          width: 4px;
          flex-shrink: 0;
          background: var(--lesson-color);
        }
        .lesson-body {
          flex: 1;
          min-width: 0;
          padding: 5px 7px 5px 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }
        .lesson-row {
          display: flex;
          align-items: center;
          gap: 5px;
          min-width: 0;
        }
        .lesson-subject {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.01em;
          color: var(--lc-text);
          line-height: 1.15;
          min-width: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          word-break: break-word;
        }
        .lesson-subject.is-struck {
          text-decoration: line-through;
          text-decoration-color: var(--danger);
          text-decoration-thickness: 1.5px;
          color: color-mix(in srgb, var(--danger) 65%, var(--app-text-tertiary));
        }
        .lesson-orig {
          font-size: 10.5px;
          font-weight: 600;
          color: color-mix(in srgb, var(--danger) 70%, var(--app-text-tertiary));
          text-decoration: line-through;
          text-decoration-color: var(--danger);
          text-decoration-thickness: 1.4px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .lesson-icon {
          position: absolute;
          bottom: 4px;
          right: 5px;
          color: var(--lesson-color);
          display: inline-flex;
          align-items: center;
          pointer-events: none;
        }
        .lesson-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 1px;
          font-size: 8.5px;
          font-weight: 500;
          line-height: 1.15;
          color: var(--app-text-secondary);
          min-width: 0;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .lesson-meta > span {
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .lesson-strike {
          color: color-mix(in srgb, var(--danger) 70%, var(--app-text-tertiary));
          text-decoration: line-through;
          text-decoration-color: var(--danger);
          text-decoration-thickness: 1.2px;
        }
        .lesson-arrow {
          flex-shrink: 0;
          color: var(--app-text-tertiary);
          font-size: 9px;
        }
        .lesson-emph {
          color: var(--orange);
          font-weight: 600;
        }

        .lesson-cell.is-compact .lesson-body {
          padding: 3px 6px 3px 7px;
        }
        .lesson-cell.is-compact .lesson-subject {
          font-size: 9px;
        }

        .lesson-cell[data-state='cancelled'] {
          opacity: 0.78;
          border: 1.5px solid color-mix(in srgb, var(--danger) 70%, transparent);
          background: repeating-linear-gradient(
            -45deg,
            color-mix(in srgb, var(--danger) 6%, var(--app-surface)) 0 8px,
            color-mix(in srgb, var(--danger) 12%, var(--app-surface)) 8px 16px
          );
        }
        .lesson-cell[data-state='exam'] {
          background: color-mix(in srgb, var(--warning) 11%, var(--app-surface));
          border: 1px solid color-mix(in srgb, var(--warning) 36%, var(--app-border));
          --lc-text: color-mix(in srgb, var(--warning) 82%, var(--app-text-primary));
        }
        :global(.dark) .lesson-cell[data-state='exam'] {
          background: color-mix(in srgb, var(--warning) 16%, var(--app-surface));
        }
        .lesson-cell[data-state='replacement'] {
          background: color-mix(in srgb, var(--orange) 9%, var(--app-surface));
          border: 1px solid color-mix(in srgb, var(--orange) 36%, var(--app-border));
        }
        :global(.dark) .lesson-cell[data-state='replacement'] {
          background: color-mix(in srgb, var(--orange) 14%, var(--app-surface));
        }
        .lesson-cell[data-state='event'] {
          background: color-mix(in srgb, var(--accent) 10%, var(--app-surface));
          border: 1px solid color-mix(in srgb, var(--accent) 28%, var(--app-border));
          --lc-text: color-mix(in srgb, var(--accent) 78%, var(--app-text-primary));
        }
        :global(.dark) .lesson-cell[data-state='event'] {
          background: color-mix(in srgb, var(--accent) 16%, var(--app-surface));
        }
      `}</style>
    </button>
  );
}

// ── Special day columns ───────────────────────────────────────────────────────

function SpecialDayColumn({
  height,
  variant,
  label,
  onClick,
}: {
  height: number;
  variant: 'holiday' | 'weekend' | 'cancelled' | 'replacement' | 'event';
  label?: string;
  onClick?: () => void;
}) {
  const config = {
    holiday:     { color: 'var(--orange)',      icon: '🏖️', text: 'Ferien',      desc: 'Kein Unterricht' },
    weekend:     { color: 'var(--success-mid)', icon: '😎', text: 'Wochenende',  desc: 'Frei' },
    cancelled:   { color: 'var(--danger)',      Icon: X,    text: 'Entfall',     desc: 'Alle Stunden ausgefallen' },
    replacement: { color: 'var(--accent)',      Icon: ArrowLeftRight, text: 'Vertretung',  desc: 'Tag durchgehend ersetzt' },
    event:       { color: 'var(--accent)',      Icon: CalendarDays,   text: label || 'Veranstaltung', desc: 'Ganztägig' },
  }[variant];

  const inner = (
    <div
      className="special-col"
      style={{ height, ['--special-color' as string]: config.color }}
    >
      <div className="special-head">
        {'icon' in config ? (
          <span className="special-emoji">{config.icon}</span>
        ) : (
          <span className="special-icon"><config.Icon size={16} /></span>
        )}
      </div>
      <p className="special-label">{config.text}</p>
      <p className="special-desc">{config.desc}</p>

      <style jsx>{`
        .special-col {
          width: 100%;
          padding: 14px 8px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          gap: 6px;
          background: color-mix(in srgb, var(--special-color) 8%, var(--app-surface));
          border: 1px dashed color-mix(in srgb, var(--special-color) 36%, var(--app-border));
        }
        :global(.dark) .special-col {
          background: color-mix(in srgb, var(--special-color) 12%, var(--app-surface));
        }
        .special-head {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .special-emoji { font-size: 22px; line-height: 1; }
        .special-icon {
          width: 30px;
          height: 30px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: color-mix(in srgb, var(--special-color) 18%, transparent);
          color: var(--special-color);
        }
        .special-label {
          font-size: 11.5px;
          font-weight: 700;
          color: var(--special-color);
          text-align: center;
          letter-spacing: 0.01em;
          margin: 2px 0 0;
          line-height: 1.2;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .special-desc {
          font-size: 10px;
          color: var(--app-text-tertiary);
          text-align: center;
          margin: 0;
        }
      `}</style>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className="special-btn press-scale"
        data-no-swipe="true"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        {inner}
        <style jsx>{`
          .special-btn {
            display: block;
            width: 100%;
            padding: 0;
            background: transparent;
            border: 0;
            cursor: pointer;
          }
        `}</style>
      </button>
    );
  }
  return inner;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function TimetableContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(() => {
    
    if (typeof window === 'undefined') return 0;
    const params = new URLSearchParams(window.location.search);
    const dateStr = params.get('date');
    if (!dateStr || dateStr.length !== 8) return 0;
    const year = parseInt(dateStr.slice(0, 4));
    const month = parseInt(dateStr.slice(4, 6)) - 1;
    const day = parseInt(dateStr.slice(6, 8));
    const targetMonday = startOfWeek(new Date(year, month, day), { weekStartsOn: 1 });
    const todayMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Math.round((targetMonday.getTime() - todayMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
  });
  const [direction, setDirection] = useState(0);

  const navigateWeek = useCallback((by: number) => {
    setDirection(by);
    setWeekOffset(o => o + by);
  }, []);

  const [entries,    setEntries]    = useState<TimetableEntry[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const [nowMinutes, setNowMinutes] = useState<number>(() => {
    const n = new Date(); return n.getHours() * 60 + n.getMinutes();
  });

  const [activeSlot, setActiveSlot] = useState<MergedSlot | null>(null);
  const [pxPerMin, setPxPerMin] = useState<number>(1.5);

const [autoOpenId] = useState<number | null>(() => {
  const openStr = searchParams.get('open');
  return openStr ? parseInt(openStr, 10) : null;
});
  const autoOpenedRef = useRef(false);

  const cacheRef     = useRef<Record<number, TimetableEntry[]>>({});
  const preloadRef   = useRef<Record<number, boolean>>({});
  const timeRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  const monday      = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  const weekDates   = Array.from({ length: 6 }, (_, i) => addDays(monday, i));
  const todayStr    = format(new Date(), 'yyyyMMdd');
  const isCurrentWeek = weekOffset === 0;

  // Responsive PX_PER_MIN — taller rows on bigger screens
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1280) setPxPerMin(1.85);
      else if (w >= 768) setPxPerMin(1.65);
      else setPxPerMin(1.4);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    timeRef.current = setInterval(() => {
      const n = new Date(); setNowMinutes(n.getHours() * 60 + n.getMinutes());
    }, 60_000);
    return () => { if (timeRef.current) clearInterval(timeRef.current); };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (activeSlot) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateWeek(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateWeek(1);
      } else if (e.key === 't' || e.key === 'T' || e.key === 'Home') {
        e.preventDefault();
        setDirection(weekOffset > 0 ? -1 : 1);
        setWeekOffset(0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeSlot, navigateWeek, weekOffset]);

  // ── Load ────────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    const cacheKey = `tt_week_${weekOffset}`;
    
    // Memory cache
    if (cacheRef.current[weekOffset]) {
      setEntries(cacheRef.current[weekOffset]);
      setLoading(false);
      return;
    }
    
    // Persistent Cache
    const cachedData = pcGetStale<TimetableEntry[]>(cacheKey);
    if (cachedData) {
      setEntries(cachedData);
      setLoading(false); // Instantly show cached
    } else {
      setLoading(true); 
    }
    setError('');

    try {
      const dateStr = format(monday, 'yyyy-MM-dd');
      const res     = await fetchTimetable(dateStr);
      const parsed  = parseTimetable(res);
      cacheRef.current[weekOffset] = parsed;
      pcSet(cacheKey, parsed);
      setEntries(parsed);
      import('@/lib/api-client').then(({ api }) => api.subjectImages.reportSubjects(parsed));
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'session_expired') { router.replace('/login'); return; }
      if (!cachedData) {
        setError(e instanceof Error ? e.message : 'Fehler beim Laden des Stundenplans');
      }
    } finally {
      if (!cachedData) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset]);

  useEffect(() => { load(); }, [load]);

  // Auto-open slot from URL ?open=<lessonId>
  useEffect(() => {
    if (!autoOpenId || autoOpenedRef.current || loading || entries.length === 0) return;
    const entry = entries.find(e => e.id === autoOpenId);
    if (!entry) return;
    const dayEntries = entries.filter(e => e.date === entry.date);
    const slots = buildSlots(dayEntries);
    const slot = slots.find(s => s.display.id === autoOpenId || s.replacement?.id === autoOpenId);
    if (slot) {
      setActiveSlot(slot);
      autoOpenedRef.current = true;
      window.history.replaceState(null, '', '/timetable');
    }
  }, [autoOpenId, entries, loading]);

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
  const totalGridHeight = Math.max(360, (maxMins - minMins) * pxPerMin);

  const weekStats = useMemo(() => {
    const todayDateNum = parseInt(todayStr, 10);
    const todayActive = entries.filter(e => e.date === todayDateNum && !e.isCancelled);
    const todayLessons = PERIODS.filter(p =>
      todayActive.some(e => toMins(e.startTime) <= p.s && toMins(e.endTime) >= p.e)
    ).length;
    const cancellations = entries.filter(e => e.isCancelled).length;
    const exams = entries.filter(e => e.isExam).length;
    const substitutions = entries.filter(e => e.isSubstitution && !e.isCancelled).length;
    return { todayLessons, cancellations, exams, substitutions };
  }, [entries, todayStr]);

  function weekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  // Period band geometry
  const visiblePeriods = PERIODS.filter(p => p.e > minMins && p.s < maxMins);

  const swipeVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0.5,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0.5,
    }),
  };

  const swipeTransition = {
    x: { type: "spring" as const, stiffness: 450, damping: 35 },
    opacity: { duration: 0.2 },
  };

  return (
    <AuthGuard>
      <div className="tt-wrap">
        <div className="tt-host">
          <main className="tt-page">
            <header className="tt-head fade-in">
              <div className="tt-head-text hidden md:block">
                <h1 className="tt-title">
                  {format(monday, 'd. MMM', { locale: de })} – {format(addDays(monday, 5), 'd. MMM yyyy', { locale: de })}
                </h1>
                <div className="tt-sub-row">
                  <p className="tt-sub">
                    KW {weekNumber(monday)}
                    {isCurrentWeek && <span className="tt-pill-now">· Diese Woche</span>}
                  </p>
                  {!isCurrentWeek && (
                    <button
                      type="button"
                      className="tt-today"
                      onClick={() => {
                        setDirection(weekOffset > 0 ? -1 : 1);
                        setWeekOffset(0);
                      }}
                    >
                      Heute
                    </button>
                  )}
                </div>
              </div>

              <div className="tt-head-stats">
                <div className="tt-stat">
                  <span className="tt-stat-label">Heute</span>
                  <span className="tt-stat-value">
                    {weekStats.todayLessons}<span className="tt-stat-unit">Std</span>
                  </span>
                </div>
                <div className="tt-stat">
                  <span className="tt-stat-label">Entfälle</span>
                  <span className={`tt-stat-value ${weekStats.cancellations > 0 ? 'is-warn' : ''}`}>
                    {weekStats.cancellations}
                  </span>
                </div>
                <div className="tt-stat">
                  <span className="tt-stat-label">Prüfungen</span>
                  <span className={`tt-stat-value ${weekStats.exams > 0 ? 'is-exam' : ''}`}>
                    {weekStats.exams}
                  </span>
                </div>
                <div className="tt-stat">
                  <span className="tt-stat-label">Vertretungen</span>
                  <span className={`tt-stat-value ${weekStats.substitutions > 0 ? 'is-orange' : ''}`}>
                    {weekStats.substitutions}
                  </span>
                </div>
              </div>
            </header>

            <div className="tt-card">
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                  key={weekOffset}
                  custom={direction}
                  variants={swipeVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={swipeTransition}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.9}
                  onDragEnd={(e, { offset, velocity }) => {
                    const swipe = offset.x;
                    if (swipe < -50) {
                      navigateWeek(1);
                    } else if (swipe > 50) {
                      navigateWeek(-1);
                    }
                  }}
                  className="tt-card-inner"
                >
                <div className="tt-days">
                  <button
                    type="button"
                    className="tt-nav-btn"
                    onClick={() => navigateWeek(-1)}
                    aria-label="Vorherige Woche"
                  >
                  <ChevronLeft size={16} />
                </button>
                {weekDates.map((date, i) => {
                  const isToday = format(date, 'yyyyMMdd') === todayStr;
                  const kind    = dayKinds[i];
                  return (
                    <div
                      key={i}
                      className={`tt-day-chip ${isToday ? 'is-today' : ''}`}
                      data-state={kind}
                    >
                      <span className="tt-day-name">{DAY_LABELS[i]}</span>
                      <span className="tt-day-num">{format(date, 'd')}</span>
                    </div>
                  );
                })}
                <button
                  type="button"
                  className="tt-nav-btn"
                  onClick={() => navigateWeek(1)}
                  aria-label="Nächste Woche"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="tt-grid-wrap">
                {loading ? (
                  <div className="tt-state">
                    <Spinner size={28} />
                    <p>Stundenplan wird geladen…</p>
                  </div>
                ) : error ? (
                  <div className="tt-state">
                    <ErrorView message={error} onRetry={load} />
                  </div>
                ) : isHolidayWeek ? (
                  <div className="tt-empty fade-in">
                    <div className="tt-empty-emoji">🏖️</div>
                    <h2>Ferienwoche</h2>
                    <p>In dieser Woche ist kein Unterricht — KW {weekNumber(monday)}</p>
                    <button type="button" className="tt-today is-cta" onClick={() => {
                        setDirection(weekOffset > 0 ? -1 : 1);
                        setWeekOffset(0);
                    }}>
                      Zurück zu Heute
                    </button>
                  </div>
                ) : (
                  <div className="tt-grid" style={{ height: totalGridHeight + 8 }}>
                    {/* Period rail */}
                    <div className="tt-rail" style={{ height: totalGridHeight }}>
                      {visiblePeriods.map((p, idx) => {
                        const top = (p.s - minMins) * pxPerMin;
                        const periodHeight = (p.e - p.s) * pxPerMin;
                        const prevP = visiblePeriods[idx - 1];
                        const nextP = visiblePeriods[idx + 1];
                        const showStart = !prevP || prevP.e !== p.s;
                        const showBoundary = !!prevP && prevP.e === p.s;
                        // Show end time for all periods, except skip 13:05 (785 min)
                        const showEnd = p.e !== 785 && (!nextP || nextP.s !== p.e);
                        const fmt = (m: number) =>
                          `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
                        return (
                          <div key={p.num} className="tt-rail-period" style={{ top, height: periodHeight }}>
                            {showStart && <span className="tt-rail-start">{fmt(p.s)}</span>}
                            {showBoundary && <span className="tt-rail-boundary">{fmt(p.s)}</span>}
                            <span className="tt-rail-num">{p.num}.</span>
                            {showEnd && <span className="tt-rail-end">{fmt(p.e)}</span>}
                          </div>
                        );
                      })}
                    </div>


                    {/* Day columns */}
                    <div className="tt-cols" style={{ gridColumn: 2 }}>
                      {weekDates.map((date, di) => {
                        const isToday = format(date, 'yyyyMMdd') === todayStr;
                        const kind    = dayKinds[di];
                        const slots   = daySlotsMap[di];

                        return (
                          <div
                            key={di}
                            className={`tt-col ${isToday ? 'is-today' : ''}`}
                            style={{ height: totalGridHeight }}
                          >
                            {kind === 'holiday'        && <SpecialDayColumn height={totalGridHeight - 8} variant="holiday" />}
                            {kind === 'weekend'        && <SpecialDayColumn height={totalGridHeight - 8} variant="weekend" />}
                            {kind === 'allCancelled'   && <SpecialDayColumn height={totalGridHeight - 8} variant="cancelled" />}
                            {kind === 'allReplacement' && (
                              <SpecialDayColumn
                                height={totalGridHeight - 8}
                                variant="replacement"
                                onClick={() => { const first = slots[0]; if (first) setActiveSlot(first); }}
                              />
                            )}
                            {kind === 'fullDayEvent' && dayEntries[di][0] && (
                              <SpecialDayColumn
                                height={totalGridHeight - 8}
                                variant="event"
                                label={dayEntries[di][0].note ?? ''}
                                onClick={() => {
                                  const first = slots[0];
                                  if (first) setActiveSlot(first);
                                }}
                              />
                            )}

                            {kind === 'normal' && slots.flatMap((slot, si) => {
                              const startMins = slot.replacement
                                ? Math.max(toMins(slot.display.startTime), toMins(slot.replacement.startTime))
                                : toMins(slot.display.startTime);
                              const endMins = slot.replacement
                                ? Math.min(toMins(slot.display.endTime), toMins(slot.replacement.endTime))
                                : toMins(slot.display.endTime);

                              let segments = [{ s: startMins, e: endMins }];
                              for (const b of BREAKS) {
                                const next: { s: number; e: number }[] = [];
                                for (const seg of segments) {
                                  if (seg.s < b.s && seg.e > b.e) {
                                    next.push({ s: seg.s, e: b.s });
                                    next.push({ s: b.e, e: seg.e });
                                  } else next.push(seg);
                                }
                                segments = next;
                              }

                              return segments.map((seg, partIdx) => {
                                const top    = (seg.s - minMins) * pxPerMin;
                                const height = Math.max((seg.e - minMins) * pxPerMin - top - 3, 28);
                                const compact = height < 42;
                                return (
                                  <div
                                    key={`${slot.display.id}-${si}-${partIdx}`}
                                    className="tt-cell-slot"
                                    style={{ top, height }}
                                  >
                                    <LessonCell slot={slot} compact={compact} onClick={() => setActiveSlot(slot)} />
                                  </div>
                                );
                              });
                            })}

                            {isToday && isCurrentWeek && nowMinutes >= minMins && nowMinutes <= maxMins && (
                              <div className="tt-now" style={{ top: (nowMinutes - minMins) * pxPerMin }}>
                                <span className="tt-now-time">
                                  {Math.floor(nowMinutes / 60).toString().padStart(2, '0')}:{(nowMinutes % 60).toString().padStart(2, '0')}
                                </span>
                                <span className="tt-now-dot" />
                                <span className="tt-now-line" />
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Global Current-Time Indicator line (spans all columns) */}
                      {isCurrentWeek && nowMinutes >= minMins && nowMinutes <= maxMins && (
                        <div className="tt-global-now" style={{ top: (nowMinutes - minMins) * pxPerMin, pointerEvents: 'none' }}>
                          <div className="tt-now-line-global" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              </motion.div>
              </AnimatePresence>
            </div>

          </main>
        </div>

        {activeSlot && (
          <LessonDetailSheet
            slot={activeSlot}
            onClose={() => setActiveSlot(null)}
          />
        )}

        <div className="tt-legend fade-in">
          <span className="tt-legend-item"><span className="tt-legend-dot" style={{ background: 'var(--orange)' }} />Vertretung</span>
          <span className="tt-legend-sep" />
          <span className="tt-legend-item"><span className="tt-legend-dot" style={{ background: 'var(--danger)' }} />Entfall</span>
          <span className="tt-legend-sep" />
          <span className="tt-legend-item"><span className="tt-legend-dot" style={{ background: 'var(--warning)' }} />Prüfung</span>
          <span className="tt-legend-sep" />
          <span className="tt-legend-item"><span className="tt-legend-dot" style={{ background: 'var(--accent)' }} />Veranstaltung</span>
        </div>

        <style jsx>{`
          .tt-wrap {
            height: 100%;
            background: var(--app-bg);
            color: var(--app-text-primary);
            font-feature-settings: 'ss01', 'cv11';
            text-rendering: optimizeLegibility;
            letter-spacing: -0.005em;
          }
          .tt-host {
            height: 100%;
            overflow: auto;
            touch-action: pan-y;
          }
          .tt-page {
            padding: 12px 2px 64px;
            display: flex;
            flex-direction: column;
            gap: 14px;
          }
          @media (min-width: 768px) {
            .tt-page { padding: 28px 24px 80px; gap: 18px; }
          }

          /* ── Header ── */
          .tt-head {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
          }
          .tt-title {
            font-size: 22px;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin: 0;
          }
          @media (min-width: 768px) {
            .tt-title { font-size: 26px; }
          }
          .tt-sub-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 4px;
          }
          .tt-sub {
            font-size: 13px;
            color: var(--app-text-secondary);
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin: 0;
          }
          .tt-pill-now {
            color: var(--accent);
            font-weight: 600;
          }
          .tt-head-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 4px;
            min-width: 100%;
          }
          @media (min-width: 560px) {
            .tt-head-stats { min-width: auto; gap: 10px; }
          }
          .tt-stat {
            display: flex;
            flex-direction: column;
            gap: 2px;
            padding: 8px 4px;
            background: var(--app-surface);
            border: 1px solid var(--app-border);
            border-radius: 12px;
            min-width: 0;
            align-items: center;
            text-align: center;
          }
          @media (min-width: 768px) {
            .tt-stat { padding: 10px 16px; align-items: flex-start; text-align: left; }
          }
          .tt-stat-label {
            font-size: 9px;
            font-weight: 600;
            letter-spacing: 0.02em;
            text-transform: uppercase;
            color: var(--app-text-tertiary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
          }
          .tt-stat-value {
            font-size: 18px;
            font-weight: 700;
            font-variant-numeric: tabular-nums;
            letter-spacing: -0.02em;
            color: var(--app-text-primary);
            line-height: 1.1;
          }
          @media (min-width: 768px) {
            .tt-stat-value { font-size: 22px; }
          }
          .tt-stat-unit {
            font-size: 11px;
            font-weight: 500;
            color: var(--app-text-tertiary);
            margin-left: 3px;
          }
          .tt-stat-value.is-warn   { color: var(--danger); }
          .tt-stat-value.is-exam   { color: var(--warning); }
          .tt-stat-value.is-orange { color: var(--orange); }

          /* ── Nav arrow buttons (inside day header) ── */
          .tt-nav-btn {
            width: 25px;
            height: 32px;
            border-radius: 8px;
            border: 1px solid var(--app-border);
            background: var(--app-bg);
            color: var(--accent);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: border-color 0.15s, background 0.15s;
            flex-shrink: 0;
            align-self: center;
          }
          .tt-nav-btn:hover {
            border-color: color-mix(in srgb, var(--accent) 50%, var(--app-border));
            background: color-mix(in srgb, var(--accent) 6%, var(--app-surface));
          }
          .tt-today {
            border: 1px solid color-mix(in srgb, var(--accent) 40%, var(--app-border));
            background: color-mix(in srgb, var(--accent) 10%, transparent);
            color: var(--accent);
            font-family: inherit;
            font-size: 12.5px;
            font-weight: 600;
            border-radius: 10px;
            padding: 7px 12px;
            cursor: pointer;
            transition: background 0.15s, border-color 0.15s;
          }
          .tt-today:hover {
            background: color-mix(in srgb, var(--accent) 16%, transparent);
            border-color: var(--accent);
          }
          .tt-today.is-cta {
            margin-top: 4px;
            padding: 9px 18px;
          }

          /* ── Main card ── */
          .tt-card {
            border-radius: 16px;
            overflow: hidden;
            position: relative;
            background: transparent;
          }
          .tt-card-inner {
            display: flex;
            flex-direction: column;
            width: 100%;
          }

          .tt-days {
            display: grid;
            grid-template-columns: 31px repeat(6, minmax(0, 1fr)) 25px;
            gap: 2px;
            padding: 8px 2px 6px;
            background: color-mix(in srgb, var(--app-bg) 50%, var(--app-surface));
            border-bottom: 1px solid var(--app-border);
          }
          @media (min-width: 768px) {
            .tt-days {
              grid-template-columns: 44px repeat(6, minmax(0, 1fr)) 44px;
              gap: 6px;
              padding: 10px 8px 8px;
            }
          }
          .tt-day-chip {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1px;
            padding: 6px 4px 7px;
            border: 1px solid transparent;
            background: transparent;
            border-radius: 10px;
            cursor: default;
            font-family: inherit;
          }
          .tt-day-name {
            font-size: 10.5px;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: var(--app-text-tertiary);
          }
          .tt-day-num {
            font-size: 18px;
            font-weight: 700;
            color: var(--app-text-primary);
            font-variant-numeric: tabular-nums;
            letter-spacing: -0.02em;
            line-height: 1.1;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 28px;
            height: 28px;
            padding: 0 6px;
            border-radius: 999px;
          }
          @media (min-width: 768px) {
            .tt-day-num { font-size: 20px; min-width: 32px; height: 32px; }
          }
          .tt-day-chip.is-today .tt-day-name { color: var(--app-text-primary); }
          .tt-day-chip.is-today .tt-day-num {
            background: transparent;
            color: var(--app-text-primary);
          }
          .tt-day-chip[data-state='holiday'] .tt-day-num,
          .tt-day-chip[data-state='weekend'] .tt-day-num,
          .tt-day-chip[data-state='allCancelled'] .tt-day-num,
          .tt-day-chip[data-state='allReplacement'] .tt-day-num,
          .tt-day-chip[data-state='fullDayEvent'] .tt-day-num {
            opacity: 0.55;
          }

          /* ── Grid ── */
          .tt-grid-wrap {
            position: relative;
          }
          .tt-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 64px 24px;
            color: var(--app-text-secondary);
            font-size: 13.5px;
          }
          .tt-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 64px 24px;
            text-align: center;
          }
          .tt-empty-emoji { font-size: 56px; line-height: 1; }
          .tt-empty h2 {
            font-size: 22px;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin: 0;
          }
          .tt-empty p {
            color: var(--app-text-secondary);
            font-size: 13.5px;
            margin: 0;
          }

          .tt-grid {
            display: grid;
            grid-template-columns: 31px 1fr 25px;
            gap: 2px;
            position: relative;
            padding: 4px 2px;
          }
          @media (min-width: 768px) {
            .tt-grid {
              grid-template-columns: 44px 1fr 44px;
              gap: 6px;
              padding: 6px 8px 8px;
            }
          }

          .tt-rail {
            position: relative;
            grid-column: 1;
          }
          .tt-rail-period {
            position: absolute;
            left: 0;
            right: 3px;
          }
          .tt-rail-start {
            position: absolute;
            top: 1px;
            right: 0;
            font-size: 8.5px;
            font-weight: 600;
            color: var(--app-text-secondary);
            font-variant-numeric: tabular-nums;
            letter-spacing: -0.02em;
            line-height: 1;
          }
          .tt-rail-boundary {
            position: absolute;
            top: -2px;
            right: 0;
            transform: translateY(-50%);
            font-size: 8.5px;
            font-weight: 600;
            color: var(--app-text-secondary);
            font-variant-numeric: tabular-nums;
            letter-spacing: -0.02em;
            line-height: 1;
          }
          .tt-rail-num {
            position: absolute;
            top: 50%;
            right: 0;
            transform: translateY(-50%);
            font-size: 8.5px;
            font-weight: 500;
            color: var(--app-text-tertiary);
            font-variant-numeric: tabular-nums;
            line-height: 1;
          }
          .tt-rail-end {
            position: absolute;
            bottom: 1px;
            right: 0;
            font-size: 9px;
            font-weight: 600;
            color: var(--app-text-secondary);
            font-variant-numeric: tabular-nums;
            letter-spacing: -0.02em;
            line-height: 1;
          }

          .tt-bands {
            position: absolute;
            left: 50px;
            right: 4px;
            top: 4px;
            pointer-events: none;
          }
          @media (min-width: 768px) {
            .tt-bands { left: 64px; right: 8px; top: 8px; }
          }
          .tt-band {
            position: absolute;
            left: 0;
            right: 0;
          }
          .tt-band[data-parity='1'] {
            background: color-mix(in srgb, var(--app-bg) 50%, transparent);
          }
          .tt-cols {
            position: relative;
            grid-column: 2;
            display: grid;
            grid-template-columns: repeat(6, minmax(0, 1fr));
            gap: 2px;
          }
          @media (min-width: 768px) {
            .tt-cols { gap: 6px; }
          }
          .tt-col {
            position: relative;
            border-radius: 8px;
            transition: background 0.15s;
          }
          .tt-col.is-today {
            background: transparent;
            box-shadow: none;
          }

          .tt-cell-slot {
            position: absolute;
            left: 2px;
            right: 2px;
          }
          @media (min-width: 768px) {
            .tt-cell-slot { left: 3px; right: 3px; }
          }

          .tt-now {
            position: absolute;
            left: -54px;
            right: 0;
            display: flex;
            align-items: center;
            pointer-events: none;
            z-index: 10;
            transform: translateY(-50%);
          }
          @media (min-width: 768px) {
            .tt-now { left: -68px; }
          }
          .tt-now-time {
            font-size: 10px;
            font-weight: 700;
            color: var(--accent);
            background: var(--app-surface);
            border: 1px solid color-mix(in srgb, var(--accent) 36%, var(--app-border));
            padding: 2px 6px;
            border-radius: 999px;
            font-variant-numeric: tabular-nums;
            margin-right: 4px;
            white-space: nowrap;
          }
          .tt-now-dot {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            background: var(--accent);
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent);
            flex-shrink: 0;
          }
          .tt-now-line {
            flex: 1;
            height: 1.5px;
            background: var(--accent);
            opacity: 0.85;
          }

          .tt-global-now {
            position: absolute;
            left: 0;
            right: 0;
            z-index: 9;
            transform: translateY(-50%);
          }
          .tt-now-line-global {
            width: 100%;
            height: 1.5px;
            background: var(--accent);
            opacity: 0.4;
            box-shadow: 0 0 4px color-mix(in srgb, var(--accent) 50%, transparent);
          }

          /* ── Legend ── */
          .tt-legend {
            position: fixed;
            bottom: 20px;
            left: 0;
            right: 0;
            margin: 0 auto;
            z-index: 40;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 7px 14px;
            background: var(--app-surface);
            border: 1px solid var(--app-border);
            border-radius: 999px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.10);
            white-space: nowrap;
            max-width: calc(100% - 24px);
            justify-content: center;
            flex-wrap: wrap;
            width: max-content;
            pointer-events: none;
          }
          :global(.dark) .tt-legend {
            box-shadow: 0 4px 20px rgba(0,0,0,0.35);
          }
          .tt-legend-item {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 11.5px;
            font-weight: 500;
            color: var(--app-text-secondary);
          }
          .tt-legend-dot {
            width: 7px;
            height: 7px;
            border-radius: 2px;
            flex-shrink: 0;
          }
          .tt-legend-sep {
            width: 1px;
            height: 10px;
            background: var(--app-border);
            flex-shrink: 0;
          }
        `}</style>
      </div>
    </AuthGuard>
  );
}

export default function TimetablePage() {
  return (
    <Suspense fallback={
      <AuthGuard>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' }}>
          <Spinner />
        </div>
      </AuthGuard>
    }>
      <TimetableContent />
    </Suspense>
  );
}
