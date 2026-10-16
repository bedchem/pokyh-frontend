import type { TimetableEntry } from '@/lib/types';
import { dateNumOf, dateOf } from '@/lib/timetable-logic';

// A sample week for the homepage, fed to the real timetable grid. Fictional:
// subjects of a vocational class, initials instead of teachers' names.

type Row = [period: number, length: number, subject: string, long: string, teacher: string, room: string, mark?: 'cancel' | 'sub' | 'exam'];

const PERIOD_START = [0, 750, 840, 930, 1035, 1125, 1215, 1315, 1405];
const PERIOD_END = [0, 840, 930, 1020, 1125, 1215, 1305, 1405, 1455];

const WEEK: Row[][] = [
  [
    [1, 2, 'MAT', 'Mathematik', 'GRU', '204'],
    [3, 1, 'DEU', 'Deutsch', 'HOF', '204'],
    [4, 2, 'FK', 'Fachkunde', 'PLA', 'T2'],
    [6, 1, 'REL', 'Religion', 'MAI', '204'],
  ],
  [
    [1, 3, 'WST', 'Werkstatt', 'OBE', 'W1'],
    [4, 1, 'ENG', 'Englisch', 'KER', '108', 'sub'],
    [5, 2, 'ITA', 'Italienisch', 'ROS', '108'],
    [7, 2, 'SPO', 'Bewegung und Sport', 'WIE', 'TH'],
  ],
  [
    [1, 1, 'DEU', 'Deutsch', 'HOF', '204'],
    [2, 2, 'MAT', 'Mathematik', 'GRU', '204', 'exam'],
    [4, 2, 'FK', 'Fachkunde', 'PLA', 'T2'],
    [6, 1, 'WIR', 'Wirtschaft', 'STE', '112'],
  ],
  [
    [1, 2, 'ENG', 'Englisch', 'KER', '108'],
    [3, 1, 'PHY', 'Physik', 'LAN', 'L1', 'cancel'],
    [4, 3, 'WST', 'Werkstatt', 'OBE', 'W1'],
    [7, 1, 'ITA', 'Italienisch', 'ROS', '108'],
  ],
  [
    [1, 1, 'WIR', 'Wirtschaft', 'STE', '112'],
    [2, 2, 'FK', 'Fachkunde', 'PLA', 'T2'],
    [4, 1, 'MAT', 'Mathematik', 'GRU', '204'],
    [5, 1, 'DEU', 'Deutsch', 'HOF', '204'],
  ],
  [],
];

export function demoWeek(today = new Date()) {
  const dates = Array.from({ length: 6 }, (_, i) => dateOf(0, i));
  const dayNums = dates.map(dateNumOf);
  let id = 1;
  const dayEntries: TimetableEntry[][] = WEEK.map((rows, d) =>
    rows.flatMap(([period, length, subject, long, teacher, room, mark]) =>
      Array.from({ length }, (_, k): TimetableEntry => {
        const p = period + k;
        return {
          id: id++,
          lessonId: d * 100 + period,
          date: dayNums[d],
          startTime: PERIOD_START[p],
          endTime: PERIOD_END[p],
          subjectName: subject,
          subjectLong: long,
          teacherName: mark === 'sub' ? 'BAU' : teacher,
          roomName: room,
          cellState: mark === 'cancel' ? 'CANCEL' : mark === 'sub' ? 'SUBSTITUTION' : 'STANDARD',
          isExam: mark === 'exam',
          isCancelled: mark === 'cancel',
          isSubstitution: mark === 'sub',
          isAdditional: false,
          originalTeacher: mark === 'sub' ? teacher : undefined,
          examDescription: mark === 'exam' ? 'Schularbeit' : undefined,
        };
      }),
    ),
  );
  return { dates, dayNums, dayEntries, todayNum: dateNumOf(today) };
}
