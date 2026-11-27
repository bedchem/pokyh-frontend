'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import {
  ArrowsLeftRight,
  Backpack,
  BookOpenText,
  ChalkboardTeacher,
  Clock,
  Exam,
  FileText,
  MapPin,
  PaperPlaneTilt,
  UserMinus,
  UsersThree,
} from '@phosphor-icons/react';
import type { AbsenceEntry, SentExcuse, TimetableEntry } from '@/lib/types';
import { absenceRangeText, lessonAbsence, sentExcuseFor, type AbsenceMark } from '@/lib/absences';
import { fetchExcuses, getExcusesStale } from '@/lib/api';
import { useDateLocale, useT } from '@/providers/LocaleProvider';
import { timetableDict, type TimetableKey } from '@/lib/i18n/dictionaries/timetable';
import { commonDict } from '@/lib/i18n/dictionaries/common';
import { formatDate } from '@/lib/i18n/dateLocale';
import { BRAND, fmtTime, toMins, statusTone, subjectTone, toneVars, type MergedSlot, type Tone } from '@/lib/timetable-logic';
import Sheet from '@/components/ui/Sheet';
import { Line, LoadingLabel } from '@/components/app/Skeleton';
import { loadLessonDetail, peekLessonDetail, type LessonDetail } from './lessonDetail';
import s from './timetable.module.css';

/** How long the popup waits for the lesson's detail before it shows what the timetable alone knows. */
const DETAIL_WAIT_MS = 3500;

/** The same text once, whichever field it came from. */
const sameText = (a: string, b: string) => a.replace(/\s+/g, ' ').trim().toLowerCase() === b.replace(/\s+/g, ' ').trim().toLowerCase();

type TagKind = 'cancelled' | 'exam' | 'substitution' | 'event';

/** The status chips, each in its status colour. */
const TAG_CLASS: Record<TagKind, string> = {
  cancelled: 'bg-blush text-danger-ink',
  exam: 'bg-butter text-butter-ink',
  substitution: 'bg-periwinkle text-periwinkle-ink',
  event: 'bg-sage text-sage-ink',
};

function tagsFor(slot: MergedSlot): TagKind[] {
  const d = slot.display;
  const tags: TagKind[] = [];
  if (d.isCancelled) tags.push('cancelled');
  if (d.isExam) tags.push('exam');
  if (slot.kind === 'replacement' || (d.isSubstitution && !d.isCancelled)) tags.push('substitution');
  if (slot.kind === 'event') tags.push('event');
  return tags;
}

/** `display` is always the lesson that was tapped, the grid gives each half of a substitution its own slot. */
function detailTone(slot: MergedSlot): Tone {
  const d = slot.display;
  if (d.isCancelled) return statusTone(BRAND.danger);
  if (d.isExam) return statusTone(BRAND.warning);
  if (slot.kind === 'event') return statusTone(BRAND.accentSoft);
  if (!d.subjectName) return statusTone(BRAND.accent);
  return subjectTone(d.subjectName);
}

const dateOf = (n: number) => new Date(Math.floor(n / 10000), (Math.floor(n / 100) % 100) - 1, n % 100);

/**
 * The lesson popup, in the app's sheet: the subject as the title, a banner
 * in the subject's colour with the day, time and status, then
 * everything else about the lesson (the Android app's popup is built the
 * same way). What only the lesson's
 * detail knows (classes, group, lesson texts, homework) comes from WebUntis
 * separately; the part below the banner waits for it, so the popup fills in
 * once instead of row by row. The grid asks for the detail as soon as a
 * lesson is pointed at or pressed (lessonDetail.ts), so it is usually here.
 */
export default function LessonDetailSheet({
  slot,
  onClose,
  absences = [],
  todayNum = 0,
  minute = 0,
}: {
  slot: MergedSlot;
  onClose: () => void;
  absences?: AbsenceEntry[];
  todayNum?: number;
  minute?: number;
}) {
  const t = useT(timetableDict);
  const tc = useT(commonDict);
  const { tag: dateTag } = useDateLocale();
  const d = slot.display;
  const absence = d.isCancelled
    ? null
    : lessonAbsence(absences, d.date, toMins(d.startTime), toMins(d.endTime), todayNum, minute);
  const tone = detailTone(slot);
  const headerName = d.subjectLong || d.subjectName || d.note || t('lesson');
  const tags = tagsFor(slot);
  const day = formatDate(dateOf(d.date), dateTag, { weekday: 'long', day: 'numeric', month: 'long' });

  // Cancelled lessons have no detail worth waiting for.
  const [detail, setDetail] = useState<LessonDetail | null | undefined>(() => (d.isCancelled ? null : peekLessonDetail(d)));
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    if (d.isCancelled || detail !== undefined) return;
    let alive = true;
    loadLessonDetail(d).then(v => { if (alive) setDetail(v); });
    const late = window.setTimeout(() => { if (alive) setWaited(true); }, DETAIL_WAIT_MS);
    return () => { alive = false; window.clearTimeout(late); };
    // The lesson is fixed for this sheet (keyed by slot id).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ready = detail !== undefined || waited;

  // Every text of the lesson once: the timetable's own first, then what the
  // detail adds, then any further text type WebUntis sent with the period.
  const notes: Array<{ label: TimetableKey; text: string }> = [];
  const addNote = (label: TimetableKey, text: string | undefined) => {
    const v = text?.trim();
    if (v && !notes.some(n => sameText(n.text, v))) notes.push({ label, text: v });
  };
  addNote('note', d.note);
  addNote('lessonText', d.lessonText);
  addNote('substitutionText', d.substitutionText);
  detail?.texts.forEach(x => addNote(x.label, x.text));
  (d.texts ?? []).forEach(x => addNote(x.type === 'SUBSTITUTION' ? 'substitutionText' : x.type === 'LESSON_TEXT' ? 'lessonText' : x.type === 'LESSON_INFO' ? 'note' : 'info', x.text));

  const examText = d.isExam
    ? [detail?.examName, d.examDescription || detail?.examDescription].filter((x, i, all): x is string => !!x && all.indexOf(x) === i).join('\n')
    : '';
  const homeworks = detail?.homeworks ?? [];

  // Laid out as a list of properties (Apple Calendar's info panel, Linear,
  // Notion): the name in the subject's colour, its status right under it,
  // then muted names in one column and the values lined up in the next, and
  // the lesson's texts across the full width below.
  return (
    <Sheet
      open
      onClose={onClose}
      title={headerName}
      closeLabel={tc('close')}
      titleClassName={`${s.toned} !text-[26px] text-[var(--tone-ink)]`}
      titleStyle={toneVars(tone) as CSSProperties}
      underTitle={tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(k => (
            <span key={k} className={`rounded-full px-2.5 py-1 text-[12.5px] font-bold leading-none ${TAG_CLASS[k]}`}>{t(k)}</span>
          ))}
        </div>
      )}
    >
      <div className={`${s.toned} pb-2`} style={toneVars(tone) as CSSProperties}>
        {/* Close under the name or its status chip. */}
        <dl className="-mt-1 flex flex-col gap-4 text-[15px] leading-snug">
          <Prop icon={<Clock />} label={t('when')}>
            <span className="first-letter:uppercase">{day}</span>
            <span className="block font-semibold tabular-nums">{fmtTime(d.startTime)} – {fmtTime(d.endTime)}</span>
          </Prop>
          {ready && (
            <>
              <Facts d={d} classes={detail?.classes ?? []} group={detail?.group ?? ''} />
              {absence && <AbsenceProp mark={absence.mark} covering={absence.covering} />}
            </>
          )}
        </dl>

        {!ready ? (
          <DetailSkeleton rows={2 + (d.isExam ? 1 : 0)} label={t('detailsLoading')} />
        ) : (
          // Always there, so a lesson with little to say still has the same shape.
          (
            <div className="mt-5 flex flex-col gap-4 border-t border-line pt-4 fade-in" style={{ animationDuration: '0.24s' }}>
              {!slot.replacement && !examText && notes.length === 0 && homeworks.length === 0 && (
                <p className="flex items-center gap-2 text-[15px] text-ink-3">
                  <LabelIcon><FileText /></LabelIcon>
                  {t('noTexts')}
                </p>
              )}
              {slot.replacement && <InsteadSection other={slot.replacement} />}
              {examText && <TextSection icon={<Exam />} title={t('examContent')}>{examText}</TextSection>}
              {notes.map((n, i) => (
                <TextSection key={`${n.label}-${i}`} icon={n.label === 'teachingContent' ? <BookOpenText /> : <FileText />} title={t(n.label)}>{n.text}</TextSection>
              ))}
              {homeworks.length > 0 && (
                <TextSection icon={<Backpack />} title={t('homework')}>
                  {homeworks.map((hw, i) => (
                    <span key={hw.id ?? i} className="block [&+&]:mt-2">{hw.text}</span>
                  ))}
                </TextSection>
              )}
            </div>
          )
        )}
      </div>
    </Sheet>
  );
}

/** Stands in for the rest of the list while the detail is on its way; invisible for a quick answer. */
function DetailSkeleton({ rows, label }: { rows: number; label: string }) {
  return (
    <div className="mt-3 fade-in" style={{ animationDelay: '140ms' }}>
      <LoadingLabel>{label}</LoadingLabel>
      <div className="flex flex-col gap-3.5">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-6">
            <Line w={64} h={12} />
            <Line w={i % 2 ? '30%' : '45%'} h={14} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** A label's glyph: the same size and weight everywhere, in the label's muted colour. */
function LabelIcon({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden="true" className="grid size-[18px] shrink-0 place-items-center [&>svg]:size-[18px]">
      {children}
    </span>
  );
}

/** One property: its glyph and name, muted, then the value under them (as the texts below). */
function Prop({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="flex items-center gap-2 text-ink-3">
        <LabelIcon>{icon}</LabelIcon>
        {label}
      </dt>
      <dd className="mt-1 min-w-0 pl-[26px] font-medium text-ink [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

function Facts({ d, classes, group }: { d: TimetableEntry; classes: string[]; group: string }) {
  const t = useT(timetableDict);
  const teacher = d.teacherLongName || d.teacherName;
  const origTeacher = d.originalTeacherLong || d.originalTeacher || '';
  const room = d.roomName;
  const origRoom = d.originalRoom || '';
  return (
    <>
      {(teacher || origTeacher) && (
        <Prop icon={<ChalkboardTeacher />} label={t('teacher')}>
          {origTeacher && origTeacher !== teacher ? <Change from={origTeacher} to={teacher} /> : teacher || origTeacher}
        </Prop>
      )}
      {(room || origRoom) && (
        <Prop icon={<MapPin />} label={t('room')}>
          {origRoom && origRoom !== room ? <Change from={origRoom} to={room} /> : room || origRoom}
        </Prop>
      )}
      {classes.length > 0 && <Prop icon={<UsersThree />} label={t('classes')}>{classes.join(', ')}</Prop>}
      {group && <Prop icon={<UsersThree />} label={t('group')}>{group}</Prop>}
    </>
  );
}

/** The new value, and the one it replaces struck through under it. */
function Change({ from, to }: { from: string; to: string }) {
  return (
    <>
      <span className="block">{to || '–'}</span>
      <span className="block text-[13.5px] font-normal text-ink-3 line-through">{from}</span>
    </>
  );
}

/**
 * "Abwesend": the status (Vorentschuldigung / Entschuldigt / Unentschuldigt), from when to when and why.
 * An unexcused absence whose excuse went to the class teachers (Abwesenheiten → "Entschuldigen")
 * says so, as the absences page does, until the school marks it excused.
 */
function AbsenceProp({ mark, covering }: { mark: AbsenceMark; covering: AbsenceEntry[] }) {
  const t = useT(timetableDict);
  const { tag } = useDateLocale();
  const [excuses, setExcuses] = useState<SentExcuse[]>(() => (mark === 'absent' ? getExcusesStale()?.excuses ?? [] : []));
  useEffect(() => {
    if (mark !== 'absent') return;
    let alive = true;
    fetchExcuses().then((r) => { if (alive && Array.isArray(r?.excuses)) setExcuses(r.excuses); }).catch(() => {});
    return () => { alive = false; };
  }, [mark]);
  const sent = mark === 'absent'
    ? covering.filter((a) => !a.isExcused).map((a) => sentExcuseFor(a, excuses)).find(Boolean) ?? null
    : null;
  const sentDate = sent && !Number.isNaN(Date.parse(sent.sentAt)) ? formatDate(new Date(sent.sentAt), tag, { day: 'numeric', month: 'short' }) : '';
  const markLabel = { preExcused: t('markPreExcused'), excused: t('markExcused'), absent: t('markAbsent') } as const;
  const reasons = [...new Set(covering.map((a) => a.reasonName).filter(Boolean))] as string[];
  const ink = sent ? 'text-butter-ink' : mark === 'absent' ? 'text-danger-ink' : 'text-sage-ink';
  return (
    <Prop icon={sent ? <PaperPlaneTilt /> : <UserMinus />} label={t('absent')}>
      <span className={`block font-semibold ${ink}`}>{sent ? t('markSent') : markLabel[mark]}</span>
      <span className="block text-[13.5px] font-normal text-ink-2">
        {covering.map((a) => absenceRangeText(a, t('wholeDay'))).join(', ')}
        {reasons.length > 0 && ` · ${reasons.join(', ')}`}
      </span>
      {sent && sent.recipients.length > 0 && (
        <span className="block text-[13.5px] font-normal text-ink-2">{sentDate ? t('sentTo', { names: sent.recipients.join(', '), date: sentDate }) : sent.recipients.join(', ')}</span>
      )}
    </Prop>
  );
}

/** "Stattdessen" from the cancelled original, "Statt" from the replacement: a section like the notes. */
function InsteadSection({ other }: { other: TimetableEntry }) {
  const t = useT(timetableDict);
  const cancelled = other.isCancelled;
  const meta = [other.teacherName, other.roomName].filter(Boolean).join(' · ');
  return (
    <TextSection icon={<ArrowsLeftRight />} title={cancelled ? t('insteadOf') : t('instead')}>
      <span className={cancelled ? 'text-ink-3 line-through' : ''}>{other.subjectLong || other.subjectName || other.note || '–'}</span>
      {meta && <span className="text-ink-2"> · {meta}</span>}
    </TextSection>
  );
}

/** A text of the lesson (instead, exam, note, lesson content, homework): its glyph and name, then the text. */
function TextSection({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="flex items-center gap-2 text-[15px] text-ink-3">
        <LabelIcon>{icon}</LabelIcon>
        {title}
      </h3>
      <div className="mt-1 whitespace-pre-wrap pl-[26px] text-[15px] leading-[1.55] text-ink [overflow-wrap:anywhere]">{children}</div>
    </section>
  );
}
