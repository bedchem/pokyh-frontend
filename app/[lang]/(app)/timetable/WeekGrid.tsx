'use client';

import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { AbsenceEntry, TimetableEntry } from '@/lib/types';
import { absenceBands } from '@/lib/absences';
import { useLocale, useT } from '@/providers/LocaleProvider';
import { timetableDict } from '@/lib/i18n/dictionaries/timetable';
import { dayLabelsMonSat, monthShort } from '@/lib/i18n/dateLocale';
import {
  CELL_GAP,
  GRID_GUTTER,
  MIN_CELL_HEIGHT,
  MIN_CELL_WIDTH,
  PX_PER_MINUTE,
  TEXT_MIN_CELL_WIDTH,
  TIMETABLE_PERIODS,
  buildGridCells,
  buildSlots,
  cellTone,
  changesOf,
  dayKind,
  fieldParts,
  hhmm,
  subjectHueMap,
  toMins,
  toneVars,
  type GridCell,
  type MergedSlot,
  type PartMark,
} from '@/lib/timetable-logic';
import { SpecialDayCard, lessonMarkIcon } from './parts';
import { prefetchLesson } from './lessonDetail';
import { PixelSpriteArt } from '@/components/app/PixelState';
import s from './timetable.module.css';

const PER_MILLE = 1000;
/** A pointer resting this long on a lesson asks for its detail ahead of the click; passing over does not. */
const HOVER_PREFETCH_MS = 140;
/** Room above the first rule and below the last one, for the times on the axis. */
const AXIS_ROOM_TOP = 8;
const AXIS_ROOM_BOTTOM = 7;
/**
 * The day is stretched to the height there is, between these. Below the floor (a phone held
 * sideways) the grid scrolls inside itself; above the ceiling a short day leaves room under it
 * rather than turning three lessons into posters.
 */
const MIN_PX_PER_MINUTE = 0.32;
const MAX_PX_PER_MINUTE = 2.4;
/** The minutes a lesson takes at most where the cells' minimum height applies. */
const SHORT_LESSON_MIN = 45;
/** Narrower than TEXT_MIN_CELL_WIDTH a cell still carries its lines, with less padding; below this, none. */
const NARROW_TEXT_MIN_WIDTH = 20;

/** A figure of the week whose lessons stand out while it is pointed at (page.tsx, the dock). */
export type WeekMark = 'today' | 'cancelled' | 'exam' | 'substitution';

/**
 * The week grid: six day columns (Mo-Sa) against a time axis built from the week's own lesson
 * times. Untis Mobile's look in POKYH pastels: a lesson is one soft tinted block; an outline
 * means something (red = cancelled, yellow = exam); a changed room/teacher is only a chip.
 *
 * With `fit` (tablets and computers) it fills the height it is given: the minutes are spread over
 * what is left under the day names, so the whole school day is on screen and nothing scrolls.
 * Without (phones) a minute has a fixed height and the page scrolls through the day.
 */
export default function WeekGrid({
  dayEntries,
  dates,
  dayNums,
  todayNum,
  weekNumber,
  minute,
  scale,
  onTap,
  absences = [],
  empty,
  mark = null,
  fit = true,
}: {
  dayEntries: TimetableEntry[][];
  dates: Date[];
  dayNums: number[];
  todayNum: number;
  weekNumber: number;
  minute: number;
  scale: number;
  onTap: (slot: MergedSlot) => void;
  /** The student's Abwesenheiten: drawn as a labelled wash over the lessons they cover. */
  absences?: AbsenceEntry[];
  /** Shown under the day headers instead of the lessons (a week without school). */
  empty?: ReactNode;
  /** The lessons of this figure stay as they are, the others step back. */
  mark?: WeekMark | null;
  /** Spread the day over the height there is (no scrolling); else a fixed height per minute. */
  fit?: boolean;
}) {
  const t = useT(timetableDict);
  const { locale } = useLocale();
  const DAY_LABELS = dayLabelsMonSat(locale);
  const viewRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });

  // The room under the day names, measured before the first paint and on every resize.
  useLayoutEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const update = () => setBox(b => (
      b.width === el.clientWidth && b.height === el.clientHeight ? b : { width: el.clientWidth, height: el.clientHeight }
    ));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const gutter = Math.round(GRID_GUTTER * Math.min(scale, 1.25));
  // Breathing room between days: tight on a phone, wider where there is width to spend.
  const colGap = scale > 1 ? 8 : 4;
  const colW = Math.max(0, (box.width - gutter - colGap * 6) / 6);

  const anyDayHasEntries = dayEntries.some(d => d.length > 0);
  const daySlots = useMemo(() => dayEntries.map(d => buildSlots(d)), [dayEntries]);
  const dayKinds = useMemo(
    () => dayEntries.map((d, i) => dayKind(d, daySlots[i], anyDayHasEntries, i)),
    [dayEntries, daySlots, anyDayHasEntries],
  );
  const allEntries = useMemo(() => dayEntries.flat(), [dayEntries]);
  // This week's colours, from its own subjects (the weeks beside it are drawn at the same time).
  const hues = useMemo(() => subjectHueMap(allEntries.map(e => e.subjectName)), [allEntries]);

  const minMins = allEntries.length ? Math.min(...allEntries.map(e => toMins(e.startTime))) : TIMETABLE_PERIODS[0].startMinute;
  const maxMins = allEntries.length ? Math.max(...allEntries.map(e => toMins(e.endTime))) : TIMETABLE_PERIODS[TIMETABLE_PERIODS.length - 1].endMinute;
  const span = Math.max(1, maxMins - minMins);
  const room = Math.max(0, box.height - AXIS_ROOM_TOP - AXIS_ROOM_BOTTOM);
  const pxPerMin = fit ? Math.min(MAX_PX_PER_MINUTE, Math.max(MIN_PX_PER_MINUTE, room / span)) : PX_PER_MINUTE * scale;
  const totalHeight = fit ? span * pxPerMin : Math.max(380 * scale, span * pxPerMin);
  const overflows = fit && totalHeight > room + 0.5;
  // Text grows with the room each minute gets, up to the size the width allows.
  const textScale = fit ? Math.min(scale, Math.max(1, pxPerMin / 0.8)) : scale;
  const minCellHeight = fit ? Math.min(MIN_CELL_HEIGHT * textScale, SHORT_LESSON_MIN * pxPerMin) : MIN_CELL_HEIGHT * scale;
  // Fitted, the body waits for the height it is spread over; scrolling, only for the width.
  const measured = fit ? box.height > 0 : box.width > 0;
  // A cell's padding above and below: the gap between two lessons (a little less where the
  // day is fitted to the screen).
  const slotPad = (fit ? 1.5 : 2) * textScale;

  // Numbered only when the numbers are this school's.
  const visiblePeriods = useMemo(() => {
    const onGrid = allEntries.filter(e => TIMETABLE_PERIODS.some(p => p.startMinute === toMins(e.startTime))).length;
    if (allEntries.length > 0 && onGrid * 2 < allEntries.length) return [];
    return TIMETABLE_PERIODS.filter(p => p.endMinute > minMins && p.startMinute < maxMins);
  }, [allEntries, minMins, maxMins]);

  // Rules from the lessons themselves as well as the period table, so a cell edge lands on a line.
  const boundaryTimes = useMemo(() => {
    const set = new Set<number>();
    visiblePeriods.forEach(p => { set.add(p.startMinute); set.add(p.endMinute); });
    allEntries.forEach(e => { set.add(toMins(e.startTime)); set.add(toMins(e.endTime)); });
    return [...set].filter(m => m >= minMins - 2 && m <= maxMins + 2).sort((a, b) => a - b);
  }, [visiblePeriods, allEntries, minMins, maxMins]);

  // The times written on the axis: where two would overlap (a short break on a short screen),
  // the later one, where the next lesson starts, stays. Every rule is still drawn.
  const axisTimes = useMemo(() => {
    const minGap = 10 * textScale + 1;
    const kept: number[] = [];
    for (const m of boundaryTimes) {
      const prev = kept[kept.length - 1];
      if (prev !== undefined && (m - prev) * pxPerMin < minGap) kept.pop();
      kept.push(m);
    }
    return kept;
  }, [boundaryTimes, pxPerMin, textScale]);

  const todayIndex = dayNums.indexOf(todayNum);
  const showNow = todayIndex >= 0 && minute >= minMins && minute <= maxMins && colW > 0;
  const nowY = (minute - minMins) * pxPerMin;

  return (
    <div className={s.grid} style={{ ['--s' as string]: textScale } as CSSProperties} data-mark={mark ?? undefined}>
      {/* Header */}
      <div className={s.gridHeader} style={{ gap: colGap }}>
        <div className={s.gutterHead} style={{ width: gutter }}>
          <span className={s.gutterKw}>{t('cw')} {weekNumber}</span>
          {dates[0] && <span className={s.gutterMonth}>{monthShort(locale)[dates[0].getMonth()]}</span>}
        </div>
        {DAY_LABELS.map((label, d) => {
          const isToday = dayNums[d] === todayNum;
          return (
            <div key={label} className={s.dayHead}>
              <span className={`${s.dayHeadLabel} ${isToday ? s.dayHeadLabelToday : ''}`}>{label}</span>
              <span className={`${s.dayDisc} ${isToday ? s.dayDiscToday : ''}`}>{dates[d]?.getDate()}</span>
            </div>
          );
        })}
      </div>

      <div ref={viewRef} className={s.gridView} data-overflow={overflows || undefined}>
      {measured && (
      <div className={s.gridBody} style={{ height: totalHeight, gap: colGap, marginTop: AXIS_ROOM_TOP, marginBottom: fit ? AXIS_ROOM_BOTTOM : 0 }}>
        <div className={s.axis} style={{ width: gutter, height: totalHeight }}>
          {visiblePeriods.map(p => (
            <span
              key={`p${p.number}`}
              className={s.axisPeriod}
              style={{ top: ((p.startMinute + p.endMinute) / 2 - minMins) * pxPerMin - 9, width: gutter - 6 }}
            >
              {p.number}.
            </span>
          ))}
          {axisTimes.map(m => (
            <span key={`t${m}`} className={s.axisTime} style={{ top: (m - minMins) * pxPerMin - 6 }}>
              {hhmm(m)}
            </span>
          ))}
        </div>

        {/* A week without school keeps its times on the left; the six days are one panel. */}
        {empty ? <div className={s.emptyWeek} style={{ left: gutter + colGap }}>{empty}</div> : (<>
        {DAY_LABELS.map((label, d) => (
          <DayColumn
            key={label}
            width={colW}
            height={totalHeight}
            boundaryTimes={boundaryTimes}
            minMins={minMins}
            pxPerMin={pxPerMin}
            scale={textScale}
            minCellHeight={minCellHeight}
            slotPad={slotPad}
            hues={hues}
            kind={dayKinds[d]}
            slots={daySlots[d]}
            dayNum={dayNums[d]}
            todayNum={todayNum}
            minute={minute}
            onTap={onTap}
            absences={absences}
          />
        ))}

        {showNow && (
          <>
            <div className={s.nowFaint} style={{ left: gutter + colGap, right: 0, top: nowY - 0.75 }} />
            <div
              className={s.nowStrong}
              style={{ left: gutter + colGap + (colW + colGap) * todayIndex, width: colW, top: nowY - 0.75 }}
            />
          </>
        )}
        </>)}
      </div>
      )}
      </div>
    </div>
  );
}

function DayColumn({
  width,
  height,
  boundaryTimes,
  minMins,
  pxPerMin,
  scale,
  minCellHeight,
  slotPad,
  hues,
  kind,
  slots,
  dayNum,
  todayNum,
  minute,
  onTap,
  absences,
}: {
  width: number;
  height: number;
  boundaryTimes: number[];
  minMins: number;
  pxPerMin: number;
  scale: number;
  minCellHeight: number;
  slotPad: number;
  hues: ReadonlyMap<string, number>;
  kind: ReturnType<typeof dayKind>;
  slots: MergedSlot[];
  dayNum: number;
  todayNum: number;
  minute: number;
  onTap: (slot: MergedSlot) => void;
  absences: AbsenceEntry[];
}) {
  const t = useT(timetableDict);
  const markLabel = { preExcused: t('markPreExcused'), excused: t('markExcused'), absent: t('markAbsent') } as const;
  const markShort = { preExcused: t('markPreExcusedShort'), excused: t('markExcusedShort'), absent: t('markAbsentShort') } as const;
  const cells = useMemo(() => buildGridCells(slots), [slots]);
  const lessons = useMemo(
    () => cells
      .filter(c => !(c.kind === 'cancelled' || c.entry.isCancelled))
      .map(c => ({ startMinute: c.startMinute, endMinute: c.endMinute })),
    [cells],
  );
  const bands = useMemo(
    () => absenceBands(absences, dayNum, lessons, todayNum, minute),
    [absences, dayNum, lessons, todayNum, minute],
  );
  // A whole day away and excused (or reported in advance): its band gets the
  // pixel scene of a day in bed.
  const dayStart = Math.min(...lessons.map(l => l.startMinute));
  const dayEnd = Math.max(...lessons.map(l => l.endMinute));
  const excusedDay = bands.length === 1 && bands[0].mark !== 'absent'
    && bands[0].startMinute <= dayStart && bands[0].endMinute >= dayEnd;

  return (
    <div className={s.column} style={{ height }}>
      {boundaryTimes.map(m => (
        <div key={m} className={s.rule} style={{ top: (m - minMins) * pxPerMin }} />
      ))}

      {kind === 'weekend' ? null : kind !== 'normal' ? (
        <div className={s.specialSlot} data-cancelled={kind === 'allCancelled' || undefined}>
          <SpecialDayCard
            kind={kind}
            month={Math.floor(dayNum / 100) % 100}
            compact
            style={{ top: 2, height: height - 4 }}
            // A day that is cancelled outright opens nothing: the card already says everything the
            // popup would, and every lesson behind it is an Entfall.
            onClick={kind !== 'allCancelled' && slots[0] ? () => onTap(slots[0]) : undefined}
          />
        </div>
      ) : (
        width > 0 && cells.map(cell => {
          const top = (cell.startMinute - minMins) * pxPerMin;
          const h = Math.max(minCellHeight, (cell.endMinute - cell.startMinute) * pxPerMin);
          const sharing = cell.width < PER_MILLE;
          const left = (width * cell.start) / PER_MILLE + (cell.start > 0 ? CELL_GAP : 0);
          const right = (width * (cell.start + cell.width)) / PER_MILLE;
          const cellWidth = Math.max(MIN_CELL_WIDTH, right - left);
          const past = dayNum < todayNum || (dayNum === todayNum && cell.endMinute <= minute);
          // What the lesson counts as in the week's figures (page.tsx, weekStats), for the dock.
          const { entry } = cell;
          const cancelled = cell.kind === 'cancelled' || entry.isCancelled;
          return (
            <div
              key={cell.key}
              className={`${s.cellSlot} ${past ? s.cellPast : ''}`}
              style={{ top, left, width: cellWidth, height: h, padding: `${slotPad}px 0` }}
              data-today={(dayNum === todayNum && !cancelled) || undefined}
              data-cancelled={cancelled || undefined}
              data-exam={(entry.isExam || cell.kind === 'exam') || undefined}
              data-substitution={(entry.isSubstitution && !cancelled) || undefined}
            >
              <GridLessonCell cell={cell} height={h} width={cellWidth} dense={sharing} scale={scale} slotPad={slotPad} hues={hues} onTap={onTap} />
            </div>
          );
        })
      )}

      {kind === 'normal' && width > 0 && bands.map(band => {
        const top = (band.startMinute - minMins) * pxPerMin;
        const h = (band.endMinute - band.startMinute) * pxPerMin;
        return (
          <div
            key={`abs-${band.startMinute}`}
            className={`${s.absenceBand} ${band.mark === 'absent' ? s.absenceBandAbsent : ''} ${excusedDay ? s.absenceBandDay : ''}`}
            style={{ top, height: h }}
            aria-label={markLabel[band.mark]}
          >
            {excusedDay && <PixelSpriteArt sprite="excused" className={s.absenceSprite} />}
            <span className={`${s.absenceLabel} ${s.absenceLabelFull}`}>{markLabel[band.mark]}</span>
            <span className={`${s.absenceLabel} ${s.absenceLabelShort}`} aria-hidden>{markShort[band.mark]}</span>
          </div>
        );
      })}
    </div>
  );
}

/** One lesson block: pastel fill and up to three lines (subject, teacher, room) in that order. */
function GridLessonCell({ cell, height, width, dense, scale, slotPad, hues, onTap }: {
  cell: GridCell;
  height: number;
  width: number;
  dense: boolean;
  scale: number;
  slotPad: number;
  hues: ReadonlyMap<string, number>;
  onTap: (slot: MergedSlot) => void;
}) {
  const t = useT(timetableDict);
  const { entry, kind } = cell;
  const cancelled = kind === 'cancelled' || entry.isCancelled;
  const changes = changesOf(entry);
  const tone = cellTone(entry, kind, hues);
  // Cancelled → red ring, exam → yellow ring. A substitution or room change is carried by its chip alone.
  const exam = !cancelled && (entry.isExam || kind === 'exam');
  const outline = cancelled ? s.cellOutlineDanger : exam ? s.cellOutlineWarning : '';

  const subjectText = entry.subjectName || entry.note || '-';
  const secondary: Array<{ parts: Array<[string, PartMark]>; className: string }> = [
    { parts: fieldParts(entry.teacherName, entry.addedTeachers ?? [], entry.originalTeacher, dense), className: s.lineTeacher },
    { parts: fieldParts(entry.roomName, entry.addedRooms ?? [], entry.originalRoom, dense), className: s.lineRoom },
  ].filter(l => l.parts.length > 0);
  // Subject, teacher and room each on a line of their own whenever the cell can hold them: a
  // shorter cell sets them smaller, a shorter one still puts teacher and room on one line. Only a
  // sliver keeps the subject alone. (`height` includes the slot's padding.)
  const inner = height - 2 * slotPad;
  // Beside an Entfall a lesson gets only part of the column: on a phone too narrow for the
  // usual padding, but still wide enough to say what it is.
  const showText = width >= NARROW_TEXT_MIN_WIDTH;
  const narrow = width < TEXT_MIN_CELL_WIDTH;
  const fit = inner >= 42 * scale ? 'roomy' : inner >= 27.5 * scale ? 'tight' : inner >= 20 * scale ? 'joined' : 'subject';
  const lines = fit === 'subject' ? []
    : fit === 'joined' && secondary.length > 1 ? [{ parts: secondary.flatMap(l => l.parts), className: s.lineTeacher }]
    : secondary;
  const label = [subjectText, entry.teacherName, entry.roomName, cancelled ? t('cancelled') : ''].filter(Boolean).join(', ');

  // The popup's detail is asked for before the tap lands (lessonDetail.ts).
  const hover = useRef(0);
  const prefetch = () => prefetchLesson(cell.slot.display);
  const leave = () => window.clearTimeout(hover.current);

  return (
    <button
      type="button"
      className={`${s.cell} ${s.toned} ${outline}`}
      style={toneVars(tone) as CSSProperties}
      onClick={e => { e.stopPropagation(); onTap(cell.slot); }}
      onPointerDown={e => { e.stopPropagation(); prefetch(); }}
      onPointerEnter={e => {
        if (e.pointerType !== 'mouse') return;
        leave();
        hover.current = window.setTimeout(prefetch, HOVER_PREFETCH_MS);
      }}
      onPointerLeave={leave}
      onFocus={prefetch}
      aria-label={label}
      title={label}
    >
      {showText && (
        <span className={`${s.cellBody} ${dense ? s.cellDense : ''} ${narrow ? s.cellNarrow : ''} ${fit !== 'roomy' ? s.cellTight : ''}`}>
          <ChangeableLine
            parts={[[subjectText, changes.subjectChanged ? 'added' : 'plain']]}
            className={s.lineSubject}
            struck={cancelled}
          />
          {lines.map((l, i) => (
            <ChangeableLine key={i} parts={l.parts} className={`${l.className} ${s.lineSecondary}`} struck={cancelled} />
          ))}
        </span>
      )}
      {width >= TEXT_MIN_CELL_WIDTH && (entry.icons?.length ?? 0) > 0 && (
        <span className={s.marks}>
          {entry.icons!.slice(0, 2).map((name, i) => {
            const Icon = lessonMarkIcon(name);
            return <Icon key={i} size={Math.round(9 * scale)} strokeWidth={2.4} />;
          })}
        </span>
      )}
    </button>
  );
}

/** One line of a cell; a changed part is a filled chip (accent = added, danger = removed). */
function ChangeableLine({ parts, className, struck }: { parts: Array<[string, PartMark]>; className: string; struck: boolean }) {
  return (
    <span className={`${s.line} ${className}`}>
      {parts.map(([text, mark], i) =>
        mark === 'plain' ? (
          <span key={i} className={`${s.part} ${struck ? s.struck : ''}`}>{text}</span>
        ) : (
          <span key={i} className={`${s.part} ${s.partChip} ${mark === 'added' ? s.partAdded : s.partRemoved}`}>{text}</span>
        ),
      )}
    </span>
  );
}

/** `fit`: the times spread over the height there is; else at their fixed spacing (phones). */
export function WeekGridSkeleton({ fit = true }: { fit?: boolean }) {
  const t = useT(timetableDict);
  const pattern: Array<Array<[number, number]>> = [
    [[0, 0.18], [0.2, 0.26], [0.52, 0.16]],
    [[0, 0.26], [0.3, 0.18], [0.54, 0.28]],
    [[0.06, 0.2], [0.3, 0.34]],
    [[0, 0.16], [0.18, 0.22], [0.44, 0.3]],
    [[0.1, 0.3], [0.46, 0.18]],
    [[0, 0.22]],
  ];
  return (
    <div className={s.skelGrid} aria-busy="true" aria-label={t('loadingGrid')}>
      <div className={s.skelRow} style={{ paddingBottom: 12 }}>
        <div style={{ width: 36 }} />
        {pattern.map((_, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div className={s.skel} style={{ width: 18, height: 14 }} />
            <div className={s.skel} style={{ width: 22, height: 22, borderRadius: 999 }} />
          </div>
        ))}
      </div>
      <div className={`${s.skelRow} ${s.skelBody}`}>
        <div style={fit
          ? { width: 36, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '18%' }
          : { width: 36, display: 'flex', flexDirection: 'column', gap: 24 }}
        >
          {Array.from({ length: 6 }, (_, i) => <div key={i} className={s.skel} style={{ width: 26, height: 14 }} />)}
        </div>
        {pattern.map((blocks, i) => (
          <div key={i} className={s.skelCol}>
            {blocks.map(([start, h], j) => (
              <div
                key={j}
                className={s.skel}
                style={{ position: 'absolute', left: 0, right: 0, top: `${start * 100}%`, height: `${h * 100}%`, borderRadius: 12 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
