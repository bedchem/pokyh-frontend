'use client';

import { useMemo } from 'react';
import { useT } from '@/providers/LocaleProvider';
import { frontpageDict } from '@/lib/i18n/dictionaries/frontpage';
import { homepageDict } from '@/lib/i18n/dictionaries/homepage';
import type { TileText } from '@/lib/landing-art';

/** The sample content on the homepage's tiles and carousel cards, in the page's language. */
export function useTileText(): TileText {
  const t = useT(frontpageDict);
  const th = useT(homepageDict);
  return useMemo<TileText>(() => {
    const list = (s: string) => s.split('|');
    return {
      period: th('tPeriod'), subject: th('tSubject'), room: th('tRoom'),
      gradeSubject: th('tGradeSubject'), average: th('tAverage'),
      cancel: th('tCancel'), cancelSub: th('tCancelSub'),
      msgFrom: th('tMsgFrom'), msgText: th('tMsgText'),
      examDay: th('tExamDay'), exam: th('tExam'),
      weekdays: list(th('tWeekdays')),
      now: th('tNow'), examIn: th('tExamIn'), dish: th('tDish'),
      rate: th('tRate'), excused: th('tExcused'), open: th('tOpen'), overdue: th('tOverdue'),
      todos: list(th('tTodoList')), reminders: list(th('tReminderList')), subjects: list(th('tSubjectList')),
      senders: list(th('tSenders')), topics: list(th('tTopics')), examList: list(th('tExamList')), months: list(th('tMonths')),
      titles: {
        timetable: t('tileTimetable'), grades: t('tileGrades'), messages: t('tileMessages'), exams: t('tileExams'),
        absences: t('tileAbsences'), reminders: t('tileReminders'), todos: t('tileTodos'), mensa: th('tMensa'),
      },
    };
  }, [t, th]);
}
