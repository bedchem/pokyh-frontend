# 2026-11-11 · Excuses go to the class teacher only

Factual log. No credentials or personal data are recorded here.
Repositories: `pokyh-backend`, `pokyh-frontend`, `POKYH_IOS`, `POKYH_ANDROID`
(uncommitted).

## What the owner asked for

- When an absence is excused automatically and the message goes to the
  teacher, it must go ONLY to the class teacher, not also to the deputy class
  teacher.

## Findings

- Every client took all persons of WebUntis' recipient group `CLASS_TEACHERS`
  and wrote to each. That group holds the class teacher and the deputy alike:
  no flag, the `tags` are only the subjects they teach, the order is by name.
- WebUntis' class timetable picker (`GET /api/rest/view/v1/timetable/filter
  ?resourceType=CLASS`) names both per class: `classTeacher1` (class teacher)
  and `classTeacher2` (deputy), as teacher elements with `shortName`
  ("Gi-Wo") and `longName`. The class's long name agrees ("… / KL <name>").
  Checked read-only in the owner's signed-in WebUntis.
- The recipients' `userId` is not the teacher element id; the recipients'
  display name ends with the short name in brackets ("Name, Vorname
  (Gi-Wo)"), which ties the two lists together.
- `getKlassen` has `teacher1` / `teacher2` too, but only as element ids, with
  no names to match.

## What changed

- Backend: `src/webuntis/classTeacher.ts` reads the own class (preselected, or
  the only one) from the picker and picks the class teacher among the
  `CLASS_TEACHERS` recipients by short name, else by long name; without a
  name, the one left once the deputy is out. When it can't be told, nobody gets
  the excuse (`class_teacher_unclear`, 409) rather than the deputy.
  `POST /absences/excuse` sends one message to that teacher;
  `GET /messages/recipients` marks them `mainClassTeacher`. Tests in
  `tests/webuntisClassTeacher.test.mjs`; README updated.
- Website: the excuse sheet shows only the marked class teacher, and says so
  when WebUntis leaves it unclear; button and "sent" texts in the singular
  (de, it, en).
- iOS: same rule in `PokyhCore/Timetable/ClassTeacher.swift` (with tests);
  `UntisClient.mainClassTeacher` used by the send and the sheet; strings
  singular, `exTeacherUnclear` added.
- Android: same rule in `data/untis/ClassTeacher.kt`;
  `UntisClient.mainClassTeacher` used by the send and the sheet; strings
  singular, `exTeacherUnclear` added.

## Noted, not changed

- The "Weitere Stundenpläne" reader (`readTimetableFilter`, iOS
  `TimetableFilter`, Android `timetableFilters`) walks every object with an id
  and a short name and skips only the departments, so the class picker's
  `classTeacher1` / `classTeacher2` come out as classes too. The sign-in's
  class lookup uses the same reader ("the one class the picker offers"), so a
  fix changes class assignment: left for the owner to decide.

## Checks

- Backend: `tsc` clean, the new tests pass; the failing tests are the known
  Windows ones (schema read, file modes, tar, shell).
- Android: `compileDebugKotlin` passes (only older warnings).
- iOS: not compiled (no Swift toolchain on this machine).
- Backend and website `node_modules` were behind their lockfiles (Prisma 5 vs
  7, `dompurify` and `@simplewebauthn/browser` missing): reinstalled with
  `npm ci`.
- No excuse was sent: WebUntis writes are left to the owner.
