'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import {
  ArrowElbowDownRight,
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
import { resolveSubjectImageSrc, subjectImageKey } from '@/lib/subject-image-preload';
import Sheet from '@/components/ui/Sheet';
import { Line, LoadingLabel } from '@/components/app/Skeleton';
import { loadLessonDetail, peekLessonDetail, type LessonDetail } from './lessonDetail';
import s from './timetable.module.css';

/** How long the popup waits for the lesson's detail before it shows what the timetable alone knows. */
const DETAIL_WAIT_MS = 3500;

/** The same text once, whichever field it came from. */
const sameText = (a: string, b: string) => a.replace(/\s+/g, ' ').trim().toLowerCase() === b.replace(/\s+/g, ' ').trim().toLowerCase();

type TagKind = 'cancelled' | 'exam' | 'substitution' | 'event';

/** The status chips: on the card colour, so they read on any subject's banner, each in its status colour. */
const TAG_CLASS: Record<TagKind, string> = {
  cancelled: 'text-danger-ink',
  exam: 'text-warning-ink',
  substitution: 'text-periwinkle-ink',
  event: 'text-sage-ink',
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
 * in the subject's colour with its photo (or short name), day, time and
 * status, then everything else about the lesson. What only the lesson's
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
  const short = d.subjectName || headerName.trim().slice(0, 3);
  const tags = tagsFor(slot);
  const day = formatDate(dateOf(d.date), dateTag, { weekday: 'long', day: 'numeric', month: 'long' });

  const imageSubject = subjectImageKey(d.subjectLong, d.subjectName);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageShown, setImageShown] = useState(false);
  // Cancelled lessons have no detail worth waiting for.
  const [detail, setDetail] = useState<LessonDetail | null | undefined>(() => (d.isCancelled ? null : peekLessonDetail(d)));
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!imageSubject) return;
    import('@/lib/api-client').then(({ api }) =>
      api.subjectImages.getCache().then(async cache => {
        if (!cache.has(imageSubject)) return;
        // Usually already downloaded in the background by SubjectImagePreloader.
        const src = await resolveSubjectImageSrc(api.subjectImages.imageUrl(imageSubject));
        if (alive && src) setImageUrl(src);
      }),
    ).catch(() => {});
    return () => { alive = false; };
  }, [imageSubject]);

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

  return (
    <Sheet open onClose={onClose} title={headerName} closeLabel={tc('close')}>
      <div className={`${s.toned} flex flex-col gap-4 pb-2`} style={toneVars(tone) as CSSProperties}>
        {/* The lesson at a glance, in its own colour, like its block in the grid. */}
        <div className="flex items-center gap-4 rounded-[20px] bg-[var(--tone-fill)] p-3 pr-4 text-[var(--tone-ink)]">
          <span
            aria-hidden="true"
            className="relative grid size-[68px] shrink-0 place-items-center overflow-hidden rounded-[16px] bg-[color-mix(in_srgb,var(--tone-ink)_9%,transparent)] text-[17px] font-extrabold tracking-[-0.02em]"
          >
            <span className="max-w-full truncate px-1.5">{short}</span>
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                onLoad={() => setImageShown(true)}
                onError={() => setImageUrl(null)}
                className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${imageShown ? 'opacity-100' : 'opacity-0'}`}
              />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold opacity-80 first-letter:uppercase">{day}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[20px] font-extrabold leading-tight tracking-[-0.02em] tabular-nums">
              {fmtTime(d.startTime)} – {fmtTime(d.endTime)}
            </p>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map(k => (
                  <span key={k} className={`rounded-full bg-surface px-2.5 py-1 text-[12.5px] font-bold leading-none ${TAG_CLASS[k]}`}>{t(k)}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {!ready ? (
          <DetailSkeleton rows={2 + (d.isExam ? 1 : 0)} label={t('detailsLoading')} />
        ) : (
          <div className="flex flex-col gap-4 fade-in" style={{ animationDuration: '0.24s' }}>
            <FactsList d={d} classes={detail?.classes ?? []} group={detail?.group ?? ''} />
            {absence && <AbsenceBlock mark={absence.mark} covering={absence.covering} />}
            {slot.replacement && <InsteadBlock other={slot.replacement} />}
            {examText && <TextBlock icon={<Exam size={17} weight="bold" />} title={t('examContent')}>{examText}</TextBlock>}
            {notes.map((n, i) => (
              <TextBlock key={`${n.label}-${i}`} icon={n.label === 'teachingContent' ? <BookOpenText size={17} weight="bold" /> : <FileText size={17} weight="bold" />} title={t(n.label)}>
                {n.text}
              </TextBlock>
            ))}
            {homeworks.length > 0 && (
              <TextBlock icon={<Backpack size={17} weight="bold" />} title={t('homework')}>
                {homeworks.map((hw, i) => (
                  <span key={hw.id ?? i} className="block border-line-soft [&+&]:mt-2.5 [&+&]:border-t [&+&]:pt-2.5">{hw.text}</span>
                ))}
              </TextBlock>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}

/** Stands in for the part below the banner while the detail is on its way; invisible for a quick answer. */
function DetailSkeleton({ rows, label }: { rows: number; label: string }) {
  return (
    <div className="fade-in" style={{ animationDelay: '140ms' }}>
      <LoadingLabel>{label}</LoadingLabel>
      <div className="flex flex-col rounded-[18px] bg-inset">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-3.5 py-3">
            <span aria-hidden="true" className="size-9 shrink-0 rounded-full bg-[var(--tone-fill)] opacity-60" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Line w={64} h={10} />
              <Line w={i % 2 ? '38%' : '56%'} h={13} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FactsList({ d, classes, group }: { d: TimetableEntry; classes: string[]; group: string }) {
  const t = useT(timetableDict);
  const teacher = d.teacherLongName || d.teacherName;
  const origTeacher = d.originalTeacherLong || d.originalTeacher || '';
  const room = d.roomName;
  const origRoom = d.originalRoom || '';
  const hasTeacher = !!teacher || !!origTeacher;
  const hasRoom = !!room || !!origRoom;
  if (!hasTeacher && !hasRoom && classes.length === 0 && !group) return null;

  return (
    <ul className="flex flex-col rounded-[18px] bg-inset">
      {hasTeacher && (
        <FactRow icon={<ChalkboardTeacher size={18} weight="bold" />} label={t('teacher')}>
          {origTeacher && origTeacher !== teacher ? <Change from={origTeacher} to={teacher} /> : teacher || origTeacher}
        </FactRow>
      )}
      {hasRoom && (
        <FactRow icon={<MapPin size={18} weight="bold" />} label={t('room')}>
          {origRoom && origRoom !== room ? <Change from={origRoom} to={room} /> : room || origRoom}
        </FactRow>
      )}
      {classes.length > 0 && <FactRow icon={<UsersThree size={18} weight="bold" />} label={t('classes')}>{classes.join(', ')}</FactRow>}
      {group && <FactRow icon={<UsersThree size={18} weight="bold" />} label={t('group')}>{group}</FactRow>}
    </ul>
  );
}

/** One line of the list: the glyph on the lesson's colour, the name, the value. */
function FactRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3 border-line-soft px-3.5 py-3 [&+&]:border-t">
      <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--tone-fill)] text-[var(--tone-ink)]">{icon}</span>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-ink-2">{label}</p>
        <div className="text-[15.5px] font-semibold text-ink [overflow-wrap:anywhere]">{children}</div>
      </div>
    </li>
  );
}

/** Old and new on their own lines: side by side, two full teacher names ran out of width. */
function Change({ from, to }: { from: string; to: string }) {
  return (
    <>
      <span className="block font-medium text-ink-3 line-through">{from}</span>
      <span className="flex items-center gap-1.5 text-orange-ink">
        <ArrowElbowDownRight size={14} weight="bold" aria-hidden="true" className="shrink-0 text-ink-3" />
        {to || '–'}
      </span>
    </>
  );
}

/**
 * "Abwesend": the status (Vorentschuldigung / Entschuldigt / Unentschuldigt), from when to when and why.
 * An unexcused absence whose excuse went to the class teachers (Abwesenheiten → "Entschuldigen")
 * says so, as the absences page does, until the school marks it excused.
 */
function AbsenceBlock({ mark, covering }: { mark: AbsenceMark; covering: AbsenceEntry[] }) {
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
  const tile = sent ? 'bg-butter text-butter-ink' : mark === 'absent' ? 'bg-blush text-blush-ink' : 'bg-sage text-sage-ink';
  return (
    <div className="flex items-start gap-3 rounded-[18px] bg-inset px-3.5 py-3">
      <span aria-hidden="true" className={`grid size-9 shrink-0 place-items-center rounded-full ${tile}`}>
        {sent ? <PaperPlaneTilt size={18} weight="bold" /> : <UserMinus size={18} weight="bold" />}
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-ink-2">{t('absent')}</p>
        <p className={`text-[15.5px] font-semibold ${mark === 'absent' && !sent ? 'text-danger' : 'text-ink'}`}>{sent ? t('markSent') : markLabel[mark]}</p>
        {sent && sent.recipients.length > 0 && (
          <p className="mt-0.5 text-[14px] text-ink-2">{sentDate ? t('sentTo', { names: sent.recipients.join(', '), date: sentDate }) : sent.recipients.join(', ')}</p>
        )}
        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[14px] text-ink-2">
          <Clock size={14} weight="bold" aria-hidden="true" className="shrink-0" />
          <span className="visually-hidden">{t('period')}: </span>
          {covering.map((a) => absenceRangeText(a, t('wholeDay'))).join(', ')}
        </p>
        {reasons.length > 0 && <p className="mt-0.5 text-[14px] text-ink-2">{t('reason')}: {reasons.join(', ')}</p>}
      </div>
    </div>
  );
}

/** "Stattdessen" from the cancelled original, "Statt" from the replacement. */
function InsteadBlock({ other }: { other: TimetableEntry }) {
  const t = useT(timetableDict);
  const cancelled = other.isCancelled;
  const meta = [other.teacherName, other.roomName].filter(Boolean).join(' · ');
  return (
    <div className="flex items-start gap-3 rounded-[18px] bg-inset px-3.5 py-3">
      <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-ink-2">
        <ArrowsLeftRight size={18} weight="bold" />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-ink-2">{cancelled ? t('insteadOf') : t('instead')}</p>
        <p className={`text-[15.5px] font-semibold ${cancelled ? 'text-ink-3 line-through' : 'text-ink'}`}>
          {other.subjectLong || other.subjectName || other.note || '–'}
        </p>
        {meta && <p className="text-[14px] text-ink-2">{meta}</p>}
      </div>
    </div>
  );
}

/** A text of the lesson (note, lesson content, homework): its name with a small glyph, then the text. */
function TextBlock({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-[18px] bg-inset px-4 py-3.5">
      <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-2">
        <span aria-hidden="true" className="text-[var(--tone-ink)]">{icon}</span>
        {title}
      </h3>
      <div className="mt-1.5 whitespace-pre-wrap text-[15.5px] leading-[1.5] text-ink [overflow-wrap:anywhere]">{children}</div>
    </section>
  );
}
