export interface Session {
  sessionId: string;
  bearerToken: string;
  studentId: number;
  klasseId: number;
  klasseName: string;
  username: string;
  personName?: string;
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
}

export interface GradeEntry {
  id: number;
  text: string;
  date: number; // YYYYMMDD
  markName: string;
  markValue: number;
  markDisplayValue: number;
  examType: string;
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

export interface MessagePreview {
  id: number;
  subject: string;
  contentPreview: string;
  senderName: string;
  senderId: number;
  sentDate: string;
  isRead: boolean;
  hasAttachments: boolean;
}

export interface MessageDetail extends MessagePreview {
  body: string;
  attachments: MessageAttachment[];
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
