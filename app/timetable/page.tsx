'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  ArrowLeftRight,
  CalendarDays,
  CalendarClock,
  Copy,
  Check,
  MapPin,
  User,
  StickyNote,
} from 'lucide-react';
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

function CopyableField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {/* noop */}
  };
  return (
    <button type="button" className="sheet-field" onClick={onCopy} aria-label={`${label} kopieren`}>
      <span className="sheet-field-ico">{icon}</span>
      <span className="sheet-field-body">
        <span className="sheet-field-label">{label}</span>
        <span className="sheet-field-value">{value}</span>
      </span>
      <span className="sheet-field-copy" aria-hidden="true">
        {copied ? <Check size={14} /> : <Copy size={13} />}
      </span>
      <style jsx>{`
        .sheet-field {
          display: grid;
          grid-template-columns: 28px 1fr auto;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 11px 12px;
          background: var(--app-card);
          border: 1px solid var(--app-border);
          border-radius: 12px;
          text-align: left;
          cursor: pointer;
          transition: border-color 0.16s, background 0.16s;
          font-family: inherit;
        }
        .sheet-field:hover {
          border-color: color-mix(in srgb, var(--app-border) 50%, var(--app-text-tertiary));
        }
        .sheet-field-ico {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: color-mix(in srgb, var(--accent) 12%, transparent);
          color: var(--accent);
        }
        .sheet-field-body {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .sheet-field-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--app-text-tertiary);
        }
        .sheet-field-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--app-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sheet-field-copy {
          color: var(--app-text-tertiary);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </button>
  );
}

function LessonDetailSheet({ slot, onClose }: { slot: MergedSlot; onClose: () => void }) {
  const { display } = slot;
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

  const activeTeachers = display.teacherName ? display.teacherName.split(', ').filter(Boolean) : [];
  const absentTeachers = display.originalTeacher ? display.originalTeacher.split(', ').filter(Boolean) : [];
  const activeRooms = display.roomName ? display.roomName.split(', ').filter(Boolean) : [];
  const absentRooms = display.originalRoom
    ? display.originalRoom.split(', ').filter(Boolean).filter(r => !activeRooms.includes(r))
    : [];

  return (
    <motion.div
      className="sheet-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={() => {
        console.log('[timetable] sheet backdrop click');
        onClose();
      }}
    >
      <motion.div
        className="sheet-panel"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="sheet-handle" />

        <div className="sheet-content">
          <div className="sheet-head" style={{ ['--lesson-color' as string]: accentColor }}>
            <div className="sheet-tile">
              {headerName.slice(0, 1).toUpperCase() || '?'}
            </div>
            <div className="sheet-head-text">
              <p
                className={`sheet-title ${hasInlineOriginal ? 'is-struck' : ''}`}
              >
                {headerName}
              </p>
              {display.subjectLong && display.subjectLong !== display.subjectName && !hasInlineOriginal && (
                <p className="sheet-subtitle">{display.subjectLong}</p>
              )}
              <div className="sheet-time">
                <CalendarClock size={13} />
                <span>{parseTime(display.startTime)} – {parseTime(display.endTime)}</span>
              </div>
            </div>

            <div className="sheet-badges">
              {display.isCancelled && (
                <span className="sheet-badge danger"><X size={11} />Entfall</span>
              )}
              {display.isExam && (
                <span className="sheet-badge warning"><FileText size={11} />Prüfung</span>
              )}
              {display.isSubstitution && !display.isCancelled && (
                <span className="sheet-badge orange"><ArrowLeftRight size={11} />Vertretung</span>
              )}
            </div>

            <button
              className="sheet-close"
              onClick={() => {
                console.log('[timetable] sheet close button');
                onClose();
              }}
              aria-label="Schließen"
            >
              <X size={18} />
            </button>
          </div>

          {!hasInlineOriginal && (activeTeachers.length > 0 || absentTeachers.length > 0 || activeRooms.length > 0 || absentRooms.length > 0) && (
            <div className="sheet-grid">
              {activeTeachers.length > 0 && (
                <CopyableField icon={<User size={14} />} label="Lehrer" value={activeTeachers.join(', ')} />
              )}
              {absentTeachers.length > 0 && activeTeachers.length === 0 && (
                <CopyableField icon={<User size={14} />} label="Lehrer (abwesend)" value={absentTeachers.join(', ')} />
              )}
              {activeRooms.length > 0 && (
                <CopyableField
                  icon={<MapPin size={14} />}
                  label={absentRooms.length > 0 ? `Raum (statt ${absentRooms.join(', ')})` : 'Raum'}
                  value={activeRooms.join(', ')}
                />
              )}
              {absentRooms.length > 0 && activeRooms.length === 0 && (
                <CopyableField icon={<MapPin size={14} />} label="Raum (entfällt)" value={absentRooms.join(', ')} />
              )}
            </div>
          )}

          {display.note && (
            <div className="sheet-note">
              <div className="sheet-note-head">
                <StickyNote size={13} />
                <span>Notiz</span>
              </div>
              <p>{display.note}</p>
            </div>
          )}

          {hasInlineOriginal && (
            <div className="sheet-replacement">
              <div className="sheet-replacement-head">
                <ArrowLeftRight size={13} color={subjectColor(display.subjectName)} />
                <span>Vertretung statt</span>
                <strong>{display.originalSubjectLong || display.originalSubject}</strong>
              </div>
              <div
                className="sheet-replacement-card"
                style={{ ['--lesson-color' as string]: subjectColor(display.subjectName) }}
              >
                <div className="sheet-replacement-bar" />
                <div className="sheet-replacement-body">
                  <p className="sheet-replacement-name">
                    {display.subjectLong || display.subjectName}
                  </p>
                  {display.teacherName && <p className="sheet-replacement-meta"><User size={12} />{display.teacherName}</p>}
                  {display.roomName    && <p className="sheet-replacement-meta"><MapPin size={12} />{display.roomName}</p>}
                </div>
              </div>
            </div>
          )}

          {slot.replacement && (
            <div className="sheet-replacement">
              <div className="sheet-replacement-head">
                <ArrowLeftRight size={13} color={subjectColor(slot.replacement.subjectName) || 'var(--orange)'} />
                <span>Ersatz</span>
              </div>
              <div
                className="sheet-replacement-card"
                style={{ ['--lesson-color' as string]: subjectColor(slot.replacement.subjectName) || 'var(--orange)' }}
              >
                <div className="sheet-replacement-bar" />
                <div className="sheet-replacement-body">
                  <p className="sheet-replacement-name">
                    {slot.replacement.subjectLong || slot.replacement.subjectName || slot.replacement.note || '?'}
                  </p>
                  {slot.replacement.teacherName && <p className="sheet-replacement-meta"><User size={12} />{slot.replacement.teacherName}</p>}
                  {slot.replacement.roomName    && <p className="sheet-replacement-meta"><MapPin size={12} />{slot.replacement.roomName}</p>}
                  {slot.replacement.note        && <p className="sheet-replacement-note">{slot.replacement.note}</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <style jsx>{`
        .sheet-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          background: color-mix(in srgb, #000 55%, transparent);
          backdrop-filter: blur(2px);
        }
        .sheet-panel {
          width: 100%;
          max-width: 560px;
          max-height: 88dvh;
          overflow-y: auto;
          background: var(--app-surface);
          border-top-left-radius: 22px;
          border-top-right-radius: 22px;
          border: 1px solid var(--app-border);
          border-bottom: 0;
          box-shadow: 0 -16px 40px rgba(0, 0, 0, 0.18);
        }
        @media (min-width: 720px) {
          .sheet-backdrop {
            align-items: center;
            padding: 24px;
          }
          .sheet-panel {
            border-radius: 22px;
            border-bottom: 1px solid var(--app-border);
            max-height: 78dvh;
          }
        }
        .sheet-handle {
          width: 38px;
          height: 4px;
          border-radius: 999px;
          background: var(--app-border);
          margin: 10px auto 0;
        }
        .sheet-content {
          padding: 18px 20px 28px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .sheet-head {
          display: grid;
          grid-template-columns: auto 1fr auto;
          grid-template-rows: auto auto;
          gap: 12px 14px;
          padding: 14px;
          background: var(--app-card);
          border: 1px solid var(--app-border);
          border-radius: 16px;
          position: relative;
        }
        .sheet-head::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 16px;
          padding: 1px;
          background: linear-gradient(135deg, color-mix(in srgb, var(--lesson-color) 36%, transparent), transparent 60%);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .sheet-tile {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
          font-weight: 700;
          background: color-mix(in srgb, var(--lesson-color) 16%, transparent);
          color: var(--lesson-color);
          grid-row: span 2;
        }
        .sheet-head-text {
          min-width: 0;
          align-self: center;
        }
        .sheet-title {
          font-size: 19px;
          font-weight: 700;
          letter-spacing: -0.012em;
          color: var(--app-text-primary);
          margin: 0;
          line-height: 1.18;
        }
        .sheet-title.is-struck {
          color: color-mix(in srgb, var(--danger) 75%, transparent);
          text-decoration: line-through;
        }
        .sheet-subtitle {
          margin-top: 1px;
          font-size: 12.5px;
          color: var(--app-text-secondary);
        }
        .sheet-time {
          margin-top: 6px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 500;
          color: var(--app-text-secondary);
          font-variant-numeric: tabular-nums;
        }
        .sheet-time :global(svg) {
          color: var(--app-text-tertiary);
        }
        .sheet-badges {
          display: inline-flex;
          gap: 6px;
          flex-wrap: wrap;
          align-self: flex-start;
          grid-column: 3;
          grid-row: 1;
        }
        .sheet-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 999px;
          letter-spacing: 0.01em;
        }
        .sheet-badge.danger {
          background: color-mix(in srgb, var(--danger) 14%, transparent);
          color: var(--danger);
        }
        .sheet-badge.warning {
          background: color-mix(in srgb, var(--warning) 16%, transparent);
          color: var(--warning);
        }
        .sheet-badge.orange {
          background: color-mix(in srgb, var(--orange) 16%, transparent);
          color: var(--orange);
        }
        .sheet-close {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 30px;
          height: 30px;
          border-radius: 999px;
          background: transparent;
          border: 0;
          color: var(--app-text-tertiary);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .sheet-close:hover {
          background: var(--app-card-alt);
          color: var(--app-text-primary);
        }
        .sheet-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }
        @media (min-width: 480px) {
          .sheet-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .sheet-note {
          background: var(--app-card);
          border: 1px solid var(--app-border);
          border-radius: 14px;
          padding: 12px 14px;
        }
        .sheet-note-head {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--app-text-tertiary);
          margin-bottom: 6px;
        }
        .sheet-note p {
          font-size: 13.5px;
          line-height: 1.45;
          color: var(--app-text-primary);
          margin: 0;
          white-space: pre-wrap;
        }
        .sheet-replacement-head {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--app-text-secondary);
          margin-bottom: 8px;
        }
        .sheet-replacement-head strong {
          color: var(--app-text-primary);
          font-weight: 600;
        }
        .sheet-replacement-card {
          display: flex;
          background: var(--app-card);
          border: 1px solid color-mix(in srgb, var(--lesson-color) 32%, var(--app-border));
          border-radius: 14px;
          overflow: hidden;
        }
        .sheet-replacement-bar {
          width: 4px;
          background: var(--lesson-color);
        }
        .sheet-replacement-body {
          flex: 1;
          padding: 12px 14px;
        }
        .sheet-replacement-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--app-text-primary);
          margin: 0 0 4px;
        }
        .sheet-replacement-meta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          color: var(--app-text-secondary);
          margin: 2px 0;
        }
        .sheet-replacement-meta :global(svg) {
          color: var(--app-text-tertiary);
        }
        .sheet-replacement-note {
          margin-top: 6px;
          font-size: 12px;
          color: var(--app-text-secondary);
        }
      `}</style>
    </motion.div>
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
    StatusIcon = <ArrowLeftRight size={11} />;
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
          {StatusIcon && <span className="lesson-icon">{StatusIcon}</span>}
        </div>
        {!compact && (
          <div className="lesson-meta">
            {teacherAbsent.length > 0 && teacherActive.length === 0 && (
              <span className="lesson-strike">{teacherAbsent.join(', ')}</span>
            )}
            {teacherAbsent.length > 0 && teacherActive.length > 0 && (
              <>
                <span className="lesson-strike">{teacherAbsent.join(', ')}</span>
                <span className="lesson-arrow">→</span>
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
                <span className="lesson-arrow">→</span>
                <span className="lesson-emph">{roomActive || '–'}</span>
              </>
            )}
            {!roomChanged && roomActive && <span>{roomActive}</span>}
          </div>
        )}
      </div>

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
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: var(--lc-text);
          line-height: 1.18;
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
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
          flex-shrink: 0;
          color: var(--lesson-color);
          display: inline-flex;
          align-items: center;
        }
        .lesson-meta {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10.5px;
          line-height: 1.18;
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
          font-size: 11.5px;
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

const SWIPE_THRESHOLD  = 60;
const SWIPE_MAX_DRAG   = 180;
const SWIPE_INTENT_THR = 8;
const SWIPE_PHASE_DUR  = 0.2;
const SWIPE_RESET_DUR  = 0.14;
const SWIPE_EXCLUDE_SELECTOR = '[data-no-swipe="true"]';

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function isSwipeExcluded(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest(SWIPE_EXCLUDE_SELECTOR);
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
  const [pxPerMin, setPxPerMin] = useState<number>(1.5);

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
        setWeekOffset(o => o - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setWeekOffset(o => o + 1);
      } else if (e.key === 't' || e.key === 'T' || e.key === 'Home') {
        e.preventDefault();
        setWeekOffset(0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeSlot]);

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
    if (isSwipeExcluded(e.target)) return;
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
  const totalGridHeight = Math.max(360, (maxMins - minMins) * pxPerMin);

  const weekStats = useMemo(() => {
    const todayDateNum = parseInt(todayStr, 10);
    const todayLessons = entries.filter(e => e.date === todayDateNum && !e.isCancelled).length;
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

  return (
    <AuthGuard>
      <div className="tt-wrap">
        <div
          ref={swipeHostRef}
          className="tt-host"
          style={{ touchAction: 'pan-y' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishSwipe}
          onPointerCancel={finishSwipe}
        >
          <main className="tt-page">
            <header className="tt-head fade-in">
              <div className="tt-head-text">
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
                      onPointerDown={e => e.stopPropagation()}
                      onClick={() => setWeekOffset(0)}
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

            <motion.div
              className="tt-card"
              animate={{ x: panelX }}
              transition={
                isPanelSnap || isDraggingSwipe
                  ? { duration: 0 }
                  : { type: 'tween', duration: panelTweenDuration, ease: [0.22, 0.61, 0.36, 1] }
              }
              onAnimationComplete={handlePanelAnimationComplete}
            >
              <div className="tt-days">
                <button
                  type="button"
                  className="tt-nav-btn"
                  onPointerDown={e => e.stopPropagation()}
                  onClick={() => setWeekOffset(o => o - 1)}
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
                  onPointerDown={e => e.stopPropagation()}
                  onClick={() => setWeekOffset(o => o + 1)}
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
                    <button type="button" className="tt-today is-cta" onClick={() => setWeekOffset(0)}>
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

                            {/* Current-time indicator */}
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
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

          </main>
        </div>

        <AnimatePresence>
          {activeSlot && (
            <LessonDetailSheet
              key={activeSlot.display.id}
              slot={activeSlot}
              onClose={() => setActiveSlot(null)}
            />
          )}
        </AnimatePresence>

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
            max-width: 1400px;
            margin: 0 auto;
            padding: 22px 16px 64px;
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
            gap: 6px;
            min-width: 100%;
          }
          @media (min-width: 560px) {
            .tt-head-stats { min-width: auto; gap: 10px; }
          }
          .tt-stat {
            display: flex;
            flex-direction: column;
            gap: 2px;
            padding: 8px 12px;
            background: var(--app-surface);
            border: 1px solid var(--app-border);
            border-radius: 12px;
            min-width: 0;
          }
          @media (min-width: 768px) {
            .tt-stat { padding: 10px 16px; }
          }
          .tt-stat-label {
            font-size: 10.5px;
            font-weight: 600;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: var(--app-text-tertiary);
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
            width: 30px;
            height: 30px;
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
            background: var(--app-surface);
            border: 1px solid var(--app-border);
            border-radius: 16px;
            overflow: hidden;
            position: relative;
          }

          .tt-days {
            display: grid;
            grid-template-columns: 38px repeat(6, minmax(0, 1fr)) 38px;
            gap: 4px;
            padding: 8px 8px 6px;
            background: color-mix(in srgb, var(--app-bg) 50%, var(--app-surface));
            border-bottom: 1px solid var(--app-border);
          }
          @media (min-width: 768px) {
            .tt-days {
              grid-template-columns: 44px repeat(6, minmax(0, 1fr)) 44px;
              gap: 6px;
              padding: 10px 12px 8px;
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
          .tt-day-chip.is-today .tt-day-name { color: var(--accent); }
          .tt-day-chip.is-today .tt-day-num {
            background: var(--accent);
            color: #fff;
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
            grid-template-columns: 38px 1fr 38px;
            position: relative;
            padding: 4px;
          }
          @media (min-width: 768px) {
            .tt-grid {
              grid-template-columns: 44px 1fr 44px;
              padding: 8px;
            }
          }

          .tt-rail {
            position: relative;
            grid-column: 1;
          }
          .tt-rail-period {
            position: absolute;
            left: 0;
            right: 4px;
          }
          .tt-rail-start {
            position: absolute;
            top: 1px;
            right: 0;
            font-size: 9px;
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
            font-size: 9px;
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
            font-size: 9px;
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
            gap: 4px;
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
            background: color-mix(in srgb, var(--accent) 4%, transparent);
            box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 20%, transparent);
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
