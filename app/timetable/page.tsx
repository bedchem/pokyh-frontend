'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, FileText, ArrowLeftRight, Plus, CalendarDays } from 'lucide-react';
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

const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];
const ROW_H = 78;          // px per time slot row (matches Flutter _rowMinHeight)
const GAP_NORMAL = 5;
const GAP_BREAK = 8;
const GAP_LUNCH = 14;
const GAP_CONNECTED = 4;
const PX_PER_MIN = 1.35;

// ── Types ─────────────────────────────────────────────────────────────────────

type SlotKind = 'normal' | 'cancelled' | 'replacement' | 'exam' | 'event';
type DayKind = 'normal' | 'holiday' | 'allCancelled' | 'allReplacement' | 'fullDayEvent';

interface MergedSlot {
  display: TimetableEntry;
  replacement: TimetableEntry | null;
  kind: SlotKind;
}

// ── Parse timetable (port of Flutter TimetableEntry.fromWeeklyApi) ─────────

function parseTimetable(json: unknown): TimetableEntry[] {
  try {
    const root = json as Record<string, unknown>;
    const wData = (
      (root?.data as Record<string, unknown>)?.result as Record<string, unknown>
    )?.data as Record<string, unknown>;
    const elementPeriods = wData?.elementPeriods as Record<string, unknown[]>;
    const elements = wData?.elements as Array<Record<string, unknown>>;
    if (!elementPeriods || !elements) return [];

    const subjectMap: Record<number, { name: string; longName: string }> = {};
    const teacherMap: Record<number, string> = {};
    const roomMap: Record<number, string> = {};

    for (const el of elements) {
      if (el.type === 3)
        subjectMap[el.id as number] = {
          name: (el.name as string) ?? '',
          longName: (el.displayname as string) ?? (el.longName as string) ?? (el.name as string) ?? '',
        };
      if (el.type === 2) teacherMap[el.id as number] = (el.name as string) ?? '';
      if (el.type === 4) roomMap[el.id as number] = (el.name as string) ?? '';
    }

    const entries: TimetableEntry[] = [];

    for (const periods of Object.values(elementPeriods)) {
      for (const period of (periods as unknown[])) {
        const p = period as Record<string, unknown>;
        const refs = (p.elements as Array<Record<string, unknown>>) ?? [];

        const subjectRefs = refs.filter((r) => r.type === 3);
        const teacherRefs = refs.filter((r) => r.type === 2);
        const roomRefs    = refs.filter((r) => r.type === 4);

        // Split ABSENT (original) vs active elements — mirrors Flutter elState logic
        const activeSubRef  = subjectRefs.find((r) => r.state !== 'ABSENT');
        const absentSubRef  = subjectRefs.find((r) => r.state === 'ABSENT');
        const activeRoomRef = roomRefs.find((r) => r.state !== 'ABSENT');

        // Active teacher(s): may be multiple
        const activeTeacherNames = teacherRefs
          .filter((r) => r.state !== 'ABSENT')
          .map((r) => teacherMap[r.id as number])
          .filter(Boolean) as string[];
        // Absent (original) teacher(s): may be multiple
        const absentTeacherNames = teacherRefs
          .filter((r) => r.state === 'ABSENT')
          .map((r) => teacherMap[r.id as number])
          .filter(Boolean) as string[];

        let subjectName = subjectMap[activeSubRef?.id as number]?.name ?? '';
        let subjectLong = subjectMap[activeSubRef?.id as number]?.longName ?? '';
        const originalSubject     = subjectMap[absentSubRef?.id as number]?.name ?? '';
        const originalSubjectLong = subjectMap[absentSubRef?.id as number]?.longName ?? '';

        // If no active subject but absent subject exists (teacher-only substitution)
        if (!subjectName && originalSubject) {
          subjectName = originalSubject;
          subjectLong = originalSubjectLong;
        }

        const teacherName     = activeTeacherNames.join(', ');
        const originalTeacher = absentTeacherNames.join(', ');
        const roomName        = roomMap[activeRoomRef?.id as number] ?? '';

        const cellState  = (p.cellState as string) ?? 'STANDARD';
        const isInfo     = p.is as Record<string, unknown> | undefined;
        const isCancelled    = cellState === 'CANCEL' || (isInfo?.cancelled as boolean) === true;
        const isExam         = (isInfo?.exam as boolean) === true;
        const isSubstitution = cellState === 'SUBSTITUTION' || (isInfo?.substitution as boolean) === true;
        const isAdditional   = cellState === 'ADDITIONAL'   || (isInfo?.additional as boolean) === true;

        entries.push({
          id:        p.id as number,
          lessonId:  p.lessonId as number,
          date:      p.date as number,
          startTime: p.startTime as number,
          endTime:   p.endTime as number,
          subjectName,
          subjectLong,
          teacherName,
          roomName,
          cellState: cellState as TimetableEntry['cellState'],
          isExam,
          isCancelled,
          isSubstitution,
          isAdditional,
          originalSubject,
          originalSubjectLong,
          originalTeacher,
          note: (p.lessonText as string) || undefined,
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

// ── Slot building (port of Flutter _buildSlot) ────────────────────────────────

function buildSlots(dayEntries: TimetableEntry[]): MergedSlot[] {
  const groups = new Map<number, TimetableEntry[]>();
  for (const e of dayEntries) {
    const key = e.startTime;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }

  const slots: MergedSlot[] = [];
  for (const [, entries] of [...groups.entries()].sort((a, b) => a[0] - b[0])) {
    const cancelled = entries.filter((e) => e.isCancelled);
    const active    = entries.filter((e) => !e.isCancelled);

    if (cancelled.length > 0 && active.length > 0) {
      // Classic: original cancelled + substitute active
      slots.push({ display: cancelled[0], replacement: active[0], kind: 'replacement' });
    } else if (cancelled.length > 0) {
      slots.push({ display: cancelled[0], replacement: null, kind: 'cancelled' });
    } else {
      // All active
      const subOnly = active.filter((e) => e.isSubstitution && !e.isAdditional);
      const addOnly = active.filter((e) => e.isAdditional && !e.isSubstitution);
      const norm    = active.filter((e) => !e.isSubstitution && !e.isAdditional);

      if (norm.length > 0 && (subOnly.length > 0 || addOnly.length > 0)) {
        const repl = addOnly[0] ?? subOnly[0];
        slots.push({ display: norm[0], replacement: repl, kind: 'replacement' });
      } else {
        const display =
          addOnly[0] ??
          active.find((e) => e.isSubstitution && e.isAdditional) ??
          subOnly[0] ??
          active[0];
        let kind: SlotKind = 'normal';
        if (display.isExam) kind = 'exam';
        else if (display.isSubstitution || display.isAdditional) kind = 'replacement';
        else if (!display.subjectName && display.note) kind = 'event';
        slots.push({ display, replacement: null, kind });
      }
    }
  }
  return slots;
}

// ── Day state detection (port of Flutter _isDayAllCancelled / _isDayAllReplacement) ──

function getDayKind(dayEntries: TimetableEntry[], hasOtherDayEntries: boolean): DayKind {
  if (dayEntries.length === 0) {
    return hasOtherDayEntries ? 'holiday' : 'normal';
  }

  const active    = dayEntries.filter((e) => !e.isCancelled);
  const cancelled = dayEntries.filter((e) => e.isCancelled);

  // Full-day event: single entry with no subject covering all time slots
  if (dayEntries.length === 1 && !dayEntries[0].isCancelled &&
      !dayEntries[0].subjectName && dayEntries[0].note) {
    return 'fullDayEvent';
  }

  if (cancelled.length > 0 && active.length === 0) return 'allCancelled';

  if (cancelled.length > 0 && active.every((e) => e.isSubstitution || e.isAdditional)) {
    return 'allReplacement';
  }

  return 'normal';
}

// ── Detail Sheet ──────────────────────────────────────────────────────────────

function LessonDetailSheet({
  slot,
  onClose,
}: {
  slot: MergedSlot;
  onClose: () => void;
}) {
  const { display, replacement, kind } = slot;

  const hasInlineOriginal =
    !replacement &&
    (display.isAdditional || display.isSubstitution) &&
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

  const replIsAdditionalOnly = replacement?.isAdditional === true && replacement?.isSubstitution === false;

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
        onClick={(e) => e.stopPropagation()}
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
              {(display.subjectLong && display.subjectLong !== display.subjectName && !hasInlineOriginal) && (
                <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>{display.subjectLong}</p>
              )}
            </div>
            {/* Badge */}
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
            {display.isAdditional && !display.isSubstitution && !display.isCancelled && !replacement && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0"
                style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)' }}>
                <Plus size={11} />Zusatz
              </span>
            )}
            {(display.isSubstitution && !display.isCancelled && !replacement && !hasInlineOriginal) && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0"
                style={{ background: 'color-mix(in srgb, var(--orange) 14%, transparent)', color: 'var(--orange)' }}>
                <ArrowLeftRight size={11} />Vertretung
              </span>
            )}
            {(replacement?.isSubstitution && !replIsAdditionalOnly) && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0"
                style={{ background: 'color-mix(in srgb, var(--orange) 14%, transparent)', color: 'var(--orange)' }}>
                <ArrowLeftRight size={11} />Vertretung
              </span>
            )}
            {replIsAdditionalOnly && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0"
                style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)' }}>
                <Plus size={11} />Zusatz
              </span>
            )}
          </div>

          <div style={{ height: 1, background: 'var(--app-border)', opacity: 0.4, marginBottom: 16 }} />

          {/* Time */}
          <SheetRow label="Zeit" value={`${parseTime(display.startTime)} – ${parseTime(display.endTime)}`} />

          {/* Teacher — only show if not hasInlineOriginal */}
          {display.teacherName && !hasInlineOriginal && (
            <SheetRow
              label={display.isSubstitution && !display.isAdditional ? 'Vertretung' : 'Lehrer'}
              value={display.teacherName}
              valueStyle={{ color: display.isSubstitution && !display.isAdditional ? 'var(--orange)' : undefined }}
            />
          )}
          {/* Original teacher (struck through) — only if single teacher */}
          {display.originalTeacher && !display.teacherName.includes(',') && !hasInlineOriginal && (
            <SheetRow
              label="Fehlt"
              value={display.originalTeacher}
              valueStyle={{ textDecoration: 'line-through', color: 'color-mix(in srgb, var(--danger) 70%, transparent)' }}
            />
          )}

          {display.roomName && !hasInlineOriginal && (
            <SheetRow label="Raum" value={display.roomName} />
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

          {/* Replacement / Zusatzstunde block */}
          {replacement && (
            <>
              <div style={{ height: 1, background: 'var(--app-border)', opacity: 0.4, margin: '16px 0' }} />
              <div className="flex items-center gap-1.5 mb-3">
                {replIsAdditionalOnly
                  ? <Plus size={14} color="var(--accent)" />
                  : <ArrowLeftRight size={14} color={subjectColor(replacement.subjectName)} />
                }
                <p className="text-sm font-semibold" style={{ color: 'var(--app-text-secondary)' }}>
                  {replIsAdditionalOnly ? 'Zusatzstunde' : 'Ersatz'}
                </p>
              </div>
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'var(--app-card)',
                  border: `1px solid color-mix(in srgb, ${subjectColor(replacement.subjectName)} 30%, transparent)`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: subjectColor(replacement.subjectName) }}
                  />
                  <p className="text-[16px] font-bold" style={{ color: 'var(--app-text-primary)' }}>
                    {replacement.subjectLong || replacement.subjectName || replacement.note || '–'}
                  </p>
                </div>
                {replacement.teacherName && (
                  <SheetRow label="Lehrer" value={replacement.teacherName} small />
                )}
                {replacement.roomName && (
                  <SheetRow label="Raum" value={replacement.roomName} small />
                )}
                {replacement.note && (
                  <p className="text-sm mt-2" style={{ color: 'var(--app-text-secondary)' }}>{replacement.note}</p>
                )}
              </div>
            </>
          )}

          {/* Inline original → new subject (single entry with both) */}
          {hasInlineOriginal && (
            <>
              <div style={{ height: 1, background: 'var(--app-border)', opacity: 0.4, margin: '16px 0' }} />
              <div className="flex items-center gap-1.5 mb-3">
                {display.isAdditional && !display.isSubstitution
                  ? <Plus size={14} color="var(--accent)" />
                  : <ArrowLeftRight size={14} color={subjectColor(display.subjectName)} />
                }
                <p className="text-sm font-semibold" style={{ color: 'var(--app-text-secondary)' }}>
                  {display.isAdditional && !display.isSubstitution ? 'Zusatzstunde' : 'Ersatz / Vertretung'}
                </p>
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
                {display.teacherName && (
                  <SheetRow label="Lehrer" value={display.teacherName} small />
                )}
                {display.roomName && (
                  <SheetRow label="Raum" value={display.roomName} small />
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
      <p
        className={`${small ? 'text-xs' : 'text-sm'} font-medium flex-1`}
        style={{ color: 'var(--app-text-secondary)', ...valueStyle }}
      >
        {value}
      </p>
    </div>
  );
}

// ── Lesson Cell (port of Flutter _SlotContent) ────────────────────────────────

function LessonCell({ slot, onClick }: { slot: MergedSlot; onClick: () => void }) {
  const { display, replacement, kind } = slot;

  const isCancelledReplacement = display.isCancelled && !!replacement;
  const isReplaced = !isCancelledReplacement && (display.isCancelled || !!replacement);

  const hasInlineOriginal =
    !replacement &&
    (display.isAdditional || display.isSubstitution) &&
    !!display.originalSubject &&
    display.originalSubject !== display.subjectName;

  const isPureSubstitution = display.isSubstitution && !display.isAdditional && !replacement;
  const isPureAdditional   = display.isAdditional   && !display.isSubstitution && !replacement;

  // Left bar color
  const leftColor =
    display.isCancelled ? 'var(--danger)'
    : display.isExam    ? 'var(--warning)'
    : kind === 'replacement' && !display.isCancelled
      ? (replacement?.isAdditional || display.isAdditional ? 'var(--accent)' : 'var(--orange)')
    : subjectColor(display.subjectName);

  // Border color
  const isSpecial = display.isExam || display.isCancelled || kind === 'replacement' || kind === 'event' || display.isSubstitution || display.isAdditional;
  const borderColor =
    display.isCancelled ? 'color-mix(in srgb, var(--danger) 70%, transparent)'
    : display.isExam    ? 'color-mix(in srgb, var(--warning) 70%, transparent)'
    : kind === 'replacement' || display.isSubstitution || display.isAdditional
      ? 'color-mix(in srgb, var(--orange) 60%, transparent)'
    : isSpecial ? 'color-mix(in srgb, var(--accent) 60%, transparent)'
    : 'var(--app-border)';

  const replColor = replacement ? subjectColor(replacement.subjectName) : 'var(--orange)';

  // Status icon
  let StatusIcon: React.ReactNode = null;
  if (display.isCancelled && !replacement) {
    StatusIcon = <X size={9} color="var(--danger)" />;
  } else if (display.isExam) {
    StatusIcon = <FileText size={9} color="var(--warning)" />;
  } else if (kind === 'replacement' || display.isSubstitution || display.isAdditional) {
    const isAdd = replacement?.isAdditional || (isPureAdditional);
    StatusIcon = isAdd
      ? <Plus size={9} color="var(--accent)" />
      : <ArrowLeftRight size={9} color="var(--orange)" />;
  }

  // Label to show as subject
  function SubjectLabel() {
    if (hasInlineOriginal) {
      return (
        <>
          {/* Struck-through original */}
          <p className="text-[11px] font-bold leading-tight truncate"
            style={{ color: 'color-mix(in srgb, var(--danger) 65%, transparent)', textDecoration: 'line-through', textDecorationColor: 'var(--danger)', textDecorationThickness: '1.5px' }}>
            {display.originalSubject}
          </p>
          {/* New subject */}
          <p className="text-[11px] font-bold leading-tight truncate"
            style={{ color: isPureAdditional ? 'var(--accent)' : subjectColor(display.subjectName) }}>
            {display.subjectName}
          </p>
        </>
      );
    }

    const subjectText = display.subjectName || display.note || '';
    const shouldStrike = isReplaced || (kind === 'replacement' && display.isCancelled);
    const subColor =
      display.isCancelled && !isCancelledReplacement ? 'color-mix(in srgb, var(--danger) 65%, transparent)'
      : isCancelledReplacement ? 'var(--danger)'
      : isPureSubstitution ? 'var(--orange)'
      : isPureAdditional   ? 'var(--accent)'
      : 'var(--app-text-primary)';

    return (
      <p className="text-[11px] font-bold leading-tight truncate"
        style={{ color: subColor, textDecoration: shouldStrike ? 'line-through' : 'none', textDecorationColor: 'var(--danger)', textDecorationThickness: '1.5px' }}>
        {subjectText}
      </p>
    );
  }

  function TeacherLabel() {
    // Original teacher struck through — only if exactly ONE absent teacher
    const hasOriginalTeacher = !!display.originalTeacher && !display.originalTeacher.includes(',');
    const showOriginalStrike =
      hasOriginalTeacher &&
      !hasInlineOriginal &&
      (isCancelledReplacement || isReplaced);

    if (showOriginalStrike) {
      return (
        <>
          <p className="text-[10px] leading-tight truncate"
            style={{ color: 'color-mix(in srgb, var(--danger) 65%, transparent)', textDecoration: 'line-through', textDecorationColor: 'var(--danger)', textDecorationThickness: '1.2px' }}>
            {display.originalTeacher}
          </p>
        </>
      );
    }

    if (isPureSubstitution || isPureAdditional) {
      return (
        <p className="text-[10px] leading-tight truncate"
          style={{ color: isPureSubstitution ? 'color-mix(in srgb, var(--orange) 75%, transparent)' : 'color-mix(in srgb, var(--accent) 80%, transparent)' }}>
          {display.teacherName}
        </p>
      );
    }

    if (display.teacherName && !hasInlineOriginal && (!replacement || isCancelledReplacement)) {
      return (
        <p className="text-[10px] leading-tight truncate"
          style={{ color: isCancelledReplacement ? 'color-mix(in srgb, var(--danger) 80%, transparent)' : 'var(--app-text-secondary)' }}>
          {display.teacherName}
        </p>
      );
    }
    return null;
  }

  function ReplacementBlock() {
    if (!replacement || isCancelledReplacement) return null;
    return (
      <>
        <p className="text-[11px] font-bold leading-tight truncate mt-0.5" style={{ color: replColor }}>
          {replacement.subjectName || replacement.note || ''}
        </p>
        {replacement.teacherName && (
          <p className="text-[10px] leading-tight truncate" style={{ color: `color-mix(in srgb, ${replColor} 80%, transparent)` }}>
            {replacement.teacherName}
          </p>
        )}
      </>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full h-full rounded-lg text-left overflow-hidden flex press-scale"
      style={{
        background: 'var(--app-surface)',
        border: `${isSpecial ? '1.5px' : '1px'} solid ${borderColor}`,
        opacity: display.isCancelled && !replacement ? 0.65 : 1,
      }}
    >
      <div className="w-[3px] flex-shrink-0 h-full" style={{ background: leftColor }} />
      <div className="flex-1 min-w-0 px-1 py-1 flex flex-col justify-center relative">
        <SubjectLabel />
        <TeacherLabel />
        <ReplacementBlock />
        {/* Status icon bottom-right */}
        {StatusIcon && (
          <div className="absolute bottom-1 right-1">{StatusIcon}</div>
        )}
      </div>
    </button>
  );
}

// ── Special day columns (port of Flutter _HolidayColumn / _DayStatusColumn / _EventColumn) ──

function HolidayColumn({ height }: { height: number }) {
  return (
    <div
      className="rounded-lg flex flex-col items-center pt-3"
      style={{
        height,
        background: 'color-mix(in srgb, var(--orange) 10%, transparent)',
        border: '1px solid color-mix(in srgb, var(--orange) 28%, transparent)',
      }}
    >
      <span style={{ fontSize: 18 }}>🏖️</span>
      <p className="text-[10px] font-bold mt-1" style={{ color: 'var(--orange)' }}>Ferien</p>
    </div>
  );
}

function DayStatusColumn({ height, kind }: { height: number; kind: 'cancelled' | 'replacement' }) {
  const color = kind === 'cancelled' ? 'var(--danger)' : 'var(--accent)';
  const label = kind === 'cancelled' ? 'Entfall' : 'Vertretung';
  const Icon  = kind === 'cancelled' ? X : ArrowLeftRight;
  return (
    <div
      className="rounded-lg flex flex-col items-center pt-3"
      style={{
        height,
        background: `color-mix(in srgb, ${color} 8%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
      }}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center"
        style={{ background: `color-mix(in srgb, ${color} 14%, transparent)` }}
      >
        <Icon size={13} color={color} />
      </div>
      <p className="text-[10px] font-bold mt-1" style={{ color }}>{label}</p>
    </div>
  );
}

function EventColumn({ height, label }: { height: number; label: string }) {
  return (
    <div
      className="rounded-lg flex flex-col items-center pt-3 px-1"
      style={{
        height,
        background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
        border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
      }}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center"
        style={{ background: 'color-mix(in srgb, var(--accent) 16%, transparent)' }}
      >
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

const SWIPE_THRESHOLD     = 60;
const SWIPE_MAX_DRAG      = 180;
const SWIPE_INTENT_THR    = 8;
const SWIPE_PHASE_DUR     = 0.2;
const SWIPE_RESET_DUR     = 0.14;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export default function TimetablePage() {
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const [panelX,             setPanelX]             = useState(0);
  const [isDraggingSwipe,    setIsDraggingSwipe]    = useState(false);
  const [isAnimatingSwipe,   setIsAnimatingSwipe]   = useState(false);
  const [isPanelSnap,        setIsPanelSnap]        = useState(false);
  const [panelTweenDuration, setPanelTweenDuration] = useState(0.2);

  const [nowMinutes, setNowMinutes] = useState<number>(() => {
    const n = new Date(); return n.getHours() * 60 + n.getMinutes();
  });

  // Active slot for detail sheet
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

  const monday = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  const weekDates  = Array.from({ length: 5 }, (_, i) => addDays(monday, i));
  const todayStr   = format(new Date(), 'yyyyMMdd');
  const isCurrentWeek = weekOffset === 0;

  // Keep current-time updated
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
      const res = await fetchTimetable(dateStr);
      const parsed = parseTimetable(res);
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
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!swipeRef.current.active || swipeRef.current.pointerId !== e.pointerId) return;
    swipeRef.current.endX = e.clientX; swipeRef.current.endY = e.clientY;
    const deltaX = e.clientX - swipeRef.current.startX;
    const deltaY = e.clientY - swipeRef.current.startY;
    if (!swipeRef.current.horizontalIntent) {
      if (Math.abs(deltaX) > SWIPE_INTENT_THR || Math.abs(deltaY) > SWIPE_INTENT_THR) {
        swipeRef.current.horizontalIntent = Math.abs(deltaX) > Math.abs(deltaY);
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
    const weekDelta = deltaX < 0 ? 1 : -1;
    const slideOut = containerW + 36;
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

  // Entries per day
  function entriesForDay(date: Date): TimetableEntry[] {
    const d = parseInt(format(date, 'yyyyMMdd'));
    return entries.filter((e) => e.date === d);
  }

  // Day kinds (holiday week → all days return 'holiday' via hasOtherDayEntries=false)
  const isHolidayWeek = !loading && !error && entries.length === 0;

  const dayEntries  = weekDates.map((date) => entriesForDay(date));
  const anyDayHasEntries = dayEntries.some((de) => de.length > 0);
  const dayKinds: DayKind[] = dayEntries.map((de) => getDayKind(de, anyDayHasEntries));

  // Sorted unique start times across all entries
  const allStartMins = [...new Set(entries.map((e) => toMins(e.startTime)))].sort((a, b) => a - b);
  const allEndMins   = [...new Set(entries.map((e) => toMins(e.endTime)))].sort((a, b) => a - b);
  const minMins = allStartMins[0] ?? 470;   // 07:50 default
  const maxMins = allEndMins[allEndMins.length - 1] ?? 960; // 16:00 default
  const totalGridHeight = Math.max(400, (maxMins - minMins) * PX_PER_MIN);

  // Time labels from unique start times
  const timeLabels = allStartMins;

  // Slots per day (merged cancelled+active)
  const daySlotsMap = weekDates.map((date, di) => buildSlots(dayEntries[di]));

  // Week number helper
  function weekNumber(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const diff = (date.getTime() - startOfYear.getTime()) / 86400000;
    return Math.ceil((diff + startOfYear.getDay()) / 7);
  }

  // Day header color based on kind
  function dayHeaderColor(kind: DayKind, isToday: boolean): string {
    if (isToday) return 'var(--accent)';
    if (kind === 'holiday')        return 'var(--orange)';
    if (kind === 'allCancelled')   return 'var(--danger)';
    if (kind === 'allReplacement') return 'var(--accent)';
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
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setWeekOffset((o) => o - 1)}
              className="p-2 rounded-full press-scale"
              style={{ background: 'var(--app-surface)' }}
            >
              <ChevronLeft size={20} color="var(--accent)" />
            </button>
            <div className="text-center">
              <p className="text-[15px] font-medium" style={{ color: 'var(--app-text-secondary)' }}>
                {format(monday, 'd. MMM', { locale: de })} – {format(addDays(monday, 4), 'd. MMM yyyy', { locale: de })}
              </p>
              <p className="text-[12px]" style={{ color: 'var(--app-text-tertiary)' }}>
                KW {weekNumber(monday)}
                {weekOffset === 0 && <span> · Diese Woche</span>}
              </p>
            </div>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setWeekOffset((o) => o + 1)}
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
              const isToday = format(date, 'yyyyMMdd') === todayStr;
              const kind    = dayKinds[i];
              const txtColor = dayHeaderColor(kind, isToday);
              return (
                <div key={i} className="flex-1 text-center">
                  <p className="text-[11px] font-semibold" style={{ color: isToday ? 'var(--accent)' : 'var(--app-text-tertiary)' }}>
                    {DAY_LABELS[i]}
                  </p>
                  <div className="flex justify-center mt-0.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: isToday ? 'var(--accent)' : 'transparent' }}
                    >
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
              /* ── Ferien week ── */
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div
                  className="w-22 h-22 rounded-full flex items-center justify-center"
                  style={{ background: 'color-mix(in srgb, var(--orange) 25%, transparent)', width: 88, height: 88 }}
                >
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
                {/* Time labels column */}
                <div className="flex-shrink-0 relative" style={{ width: 36, height: totalGridHeight }}>
                  {timeLabels.map((m) => {
                    const top = (m - minMins) * PX_PER_MIN;
                    return (
                      <div key={m} className="absolute left-0 right-0" style={{ top }}>
                        <p className="text-[10px] text-right pr-1" style={{ color: 'var(--app-text-tertiary)' }}>
                          {Math.floor(m / 60).toString().padStart(2, '0')}:{(m % 60).toString().padStart(2, '0')}
                        </p>
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
                    <div
                      key={di}
                      className="flex-1 relative"
                      style={{
                        height: totalGridHeight,
                        background: isToday ? 'color-mix(in srgb, var(--accent) 5%, transparent)' : 'transparent',
                        borderRadius: 6,
                      }}
                    >
                      {/* Special full-day column overlays */}
                      {kind === 'holiday' && (
                        <HolidayColumn height={totalGridHeight - 4} />
                      )}
                      {kind === 'allCancelled' && (
                        <DayStatusColumn height={totalGridHeight - 4} kind="cancelled" />
                      )}
                      {kind === 'allReplacement' && (
                        <DayStatusColumn height={totalGridHeight - 4} kind="replacement" />
                      )}
                      {kind === 'fullDayEvent' && dayEntries[di][0] && (
                        <EventColumn
                          height={totalGridHeight - 4}
                          label={dayEntries[di][0].note ?? ''}
                        />
                      )}

                      {/* Normal lesson cells */}
                      {kind === 'normal' && slots.map((slot, si) => {
                        const top    = (toMins(slot.display.startTime) - minMins) * PX_PER_MIN;
                        const height = Math.max(
                          (toMins(slot.display.endTime) - toMins(slot.display.startTime)) * PX_PER_MIN - 2,
                          30,
                        );
                        return (
                          <div
                            key={`${slot.display.id}-${si}`}
                            className="absolute left-0.5 right-0.5"
                            style={{ top, height }}
                          >
                            <LessonCell slot={slot} onClick={() => setActiveSlot(slot)} />
                          </div>
                        );
                      })}

                      {/* Current-time red line */}
                      {isToday && isCurrentWeek && nowMinutes >= minMins && nowMinutes <= maxMins && (
                        <div
                          className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
                          style={{ top: (nowMinutes - minMins) * PX_PER_MIN }}
                        >
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
