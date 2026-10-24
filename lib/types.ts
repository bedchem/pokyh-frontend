/** The WebUntis school of a session (see lib/server/schools.ts). */
export interface SessionSchool {
  loginName: string;
  server: string;
  name?: string;
}

export interface Session {
  sessionId: string;
  /** Missing in sessions from before schools: the installation's default school. */
  school?: SessionSchool;
  bearerToken: string;
  studentId: number;
  klasseId: number;
  klasseName: string;
  username: string;
  personName?: string;
  personType?: number;
  isParent?: boolean;
  /** WebUntis profile-image URL, captured at login (session is freshest then). */
  imageUrl?: string;
}

export interface TimetableEntry {
  id: number;
  lessonId: number;
  date: number; // YYYYMMDD
  startTime: number; // HHMM
  endTime: number; // HHMM
  subjectName: string;
  subjectLong: string;
  teacherName: string;
  teacherLongName?: string;
  roomName: string;
  cellState: 'STANDARD' | 'CANCEL' | 'SUBSTITUTION' | 'ADDITIONAL' | 'FREE';
  isExam: boolean;
  isCancelled: boolean;
  isSubstitution: boolean;
  isAdditional: boolean;
  subjectDisplayName?: string;
  originalSubject?: string;
  originalSubjectLong?: string;
  originalSubjectDisplayName?: string;
  originalTeacher?: string;
  originalTeacherLong?: string;
  originalRoom?: string;
  homeworkText?: string;
  note?: string;
  examDescription?: string;
  /** Teachers/subjects/rooms WebUntis flags as not regular (position*.current.status). */
  addedTeachers?: string[];
  addedSubjects?: string[];
  addedRooms?: string[];
  /** WebUntis's raw `icons` array for the period (HOMEWORK, NOTES, EXAM, …). */
  icons?: string[];
  substitutionText?: string;
  lessonText?: string;
  /** Every text WebUntis sends with the period (LESSON_INFO, LESSON_TEXT, SUBSTITUTION, …). */
  texts?: Array<{ type: string; text: string }>;
}

export interface GradeEntry {
  id: number;
  text: string;
  date: number; // YYYYMMDD
  markName: string;
  markValue: number;
  markDisplayValue: number;
  examType: string;
  /** When WebUntis says the grade was entered (epoch ms), when its answer carries it (lib/grade-order.ts). */
  enteredAt?: number | null;
}

export interface SubjectGrades {
  lessonId: number;
  subjectName: string;
  teacherName: string;
  grades: GradeEntry[];
  average: number;
  positiveCount: number;
  negativeCount: number;
}

export interface AbsenceEntry {
  id: number;
  startDate: number; // YYYYMMDD
  endDate: number;
  startTime: number; // HHMM
  endTime: number;
  isExcused: boolean;
  reasonName?: string;
  absenceType?: string;
  hours: number;
  note?: string;
  excuseNote?: string;
  teacherName?: string;
  subjectName?: string;
}

// ─── Absence write features (report / excuse) ──────────────────────────────────

export interface AbsenceReason {
  id: number;
  name: string;
}

/**
 * An excuse sent to the class teachers as a WebUntis message, found again in
 * "Gesendet" (the API's /absences/excuses). Times are YYYYMMDDHHMM.
 */
export interface SentExcuse {
  start: number;
  end: number;
  /** ISO date-time WebUntis gives the message. */
  sentAt: string;
  recipients: string[];
  /** The sent message, to open it; null until "Gesendet" has it. */
  messageId: number | null;
}

export interface ReportAbsenceInput {
  startDate: string; // YYYYMMDD
  endDate: string; // YYYYMMDD
  startTime: string; // HHMM, e.g. "0750"
  endTime: string; // HHMM
  reasonId: number;
  text: string;
}

export interface UntisPermissions {
  canReportAbsence: boolean;
  personName: string | null;
}

// ─── Message compose (to teachers) ─────────────────────────────────────────────

export interface MessageRecipient {
  id: number;
  type: string; // TEACHER, STAFF, …
  name: string;
  role?: string;
  initials: string;
  category: 'classTeacher' | 'other';
}

export interface SendMessageInput {
  recipients: { id: number; type: string }[];
  subject: string;
  content: string;
  files?: File[];
  draftId?: number; // when set, update this existing draft in place (PUT)
}

export interface MessagePreview {
  id: number;
  subject: string;
  contentPreview: string;
  senderName: string;
  senderId: number;
  sentDate: string;
  isRead: boolean;
  hasAttachments: boolean;
  /** Inbox: the sender asks for a read confirmation that is not sent yet. */
  needsConfirmation?: boolean;
  /** Sent: how many recipients confirmed reading, of how many asked. */
  readStatus?: { confirmed: number; total: number } | null;
  /** Sent: taken back, its recipients no longer see it. */
  isRevoked?: boolean;
}

export interface MessageDetail extends MessagePreview {
  body: string;
  attachments: MessageAttachment[];
  /** Inbox: the sender asked for a read confirmation (sendable, or sent when and by whom). */
  requestConfirmation?: { canConfirm: boolean; confirmedAt: string | null; confirmedBy: string | null } | null;
  /** Sent: WebUntis lets the sender take the message back. */
  canRevoke?: boolean;
}

export interface MessageAttachment {
  id: number;
  storageId: string;
  name: string;
  url?: string;
  size: number;
}

export interface HomeworkEntry {
  id: number;
  lessonId: number;
  date: number;
  dueDate: number;
  text: string;
  completed: boolean;
}

export interface Dish {
  id: string;
  name: string | { de?: string; it?: string; en?: string };
  description?: string | { de?: string; it?: string; en?: string };
  category: string;
  date: string; // ISO date
  imageUrl?: string;
  price?: number;
  allergens?: string[];
  tags?: string[];
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface KlasseOption {
  id: number;
  name: string;
}
