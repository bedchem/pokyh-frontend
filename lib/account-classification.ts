export interface WebUntisStudentClass {
  id?: unknown;
  klasseId?: unknown;
  classId?: unknown;
  klasse?: unknown;
  class?: unknown;
}

export const DEFAULT_PARENT_ROLE_TAGS = [
  'PARENT',
  'GUARDIAN',
  'LEGAL_GUARDIAN',
  'LEGALGUARDIAN',
  'ERZIEHUNGSBERECHTIGT',
  'ELTERNACCOUNT',
  'PARENT_ROLE',
  'PERSONTYPE_PARENT',
] as const;

function normalizedTag(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase();
}

function collectStrings(node: unknown, out: string[], depth = 0): void {
  if (depth > 8 || node == null) return;
  if (typeof node === 'string') {
    out.push(node);
    return;
  }
  if (Array.isArray(node)) {
    for (const value of node) collectStrings(value, out, depth + 1);
    return;
  }
  if (typeof node === 'object') {
    for (const value of Object.values(node as Record<string, unknown>)) {
      collectStrings(value, out, depth + 1);
    }
  }
}

export function containsParentRoleTag(
  json: unknown,
  additionalRoleTags: readonly string[] = [],
): boolean {
  const markers = new Set(
    [...DEFAULT_PARENT_ROLE_TAGS, ...additionalRoleTags]
      .map(normalizedTag)
      .filter(Boolean),
  );
  const values: string[] = [];
  collectStrings(json, values);
  return values.some((value) => markers.has(normalizedTag(value)));
}

function positiveInteger(value: unknown): number {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

export function studentClassId(student: WebUntisStudentClass | undefined): number {
  if (!student) return 0;
  const klasse = student.klasse && typeof student.klasse === 'object'
    ? (student.klasse as { id?: unknown }).id
    : student.klasse;
  const nestedClass = student.class && typeof student.class === 'object'
    ? (student.class as { id?: unknown }).id
    : student.class;
  return positiveInteger(student.klasseId)
    || positiveInteger(student.classId)
    || positiveInteger(klasse)
    || positiveInteger(nestedClass);
}

/**
 * `authenticate` occasionally returns klasseId=0 even though `getStudents`
 * already contains the student's class. Prefer the authenticated positive id,
 * then recover the class from the record that belongs to the logged-in student.
 */
export function resolveOwnStudentClassId(
  authenticatedKlasseId: unknown,
  personId: unknown,
  students: readonly WebUntisStudentClass[],
): number {
  const authenticated = positiveInteger(authenticatedKlasseId);
  if (authenticated > 0) return authenticated;

  const normalizedPersonId = positiveInteger(personId);
  const ownStudent = students.find((student) => positiveInteger(student.id) === normalizedPersonId);
  return studentClassId(ownStudent);
}

/** Finds class data nested beside the matching student/person in app-data. */
export function findStudentClassIdInData(json: unknown, personId: unknown): number {
  const targetId = positiveInteger(personId);
  if (targetId === 0) return 0;

  let found = 0;
  function walk(node: unknown, depth = 0): void {
    if (found > 0 || depth > 8 || node == null) return;
    if (Array.isArray(node)) {
      for (const value of node) walk(value, depth + 1);
      return;
    }
    if (typeof node !== 'object') return;

    const value = node as Record<string, unknown>;
    const ids = [value.id, value.personId, value.studentId].map(positiveInteger);
    if (ids.includes(targetId)) {
      found = studentClassId(value);
      if (found > 0) return;
    }
    for (const child of Object.values(value)) walk(child, depth + 1);
  }

  walk(json);
  return found;
}

export function normalizedPositiveId(value: unknown): number {
  return positiveInteger(value);
}

export function accountClassForRole(
  isParent: boolean,
  klasseId: number,
  klasseName: string,
): { klasseId: number; klasseName: string } {
  return isParent
    ? { klasseId: 0, klasseName: '' }
    : { klasseId: positiveInteger(klasseId), klasseName: klasseName.trim() };
}
