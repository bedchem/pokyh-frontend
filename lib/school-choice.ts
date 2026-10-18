// The school picked on the sign-in page, remembered in this browser until the
// end of the school year (31 August), and for at least 30 days, so the next
// sign-in starts at the password. Only what WebUntis' public school search
// shows is kept (name, address, server), nothing about the person. Listed in
// the privacy policy (storage section) as `pokyh_school`.

export interface SchoolChoice {
  loginName: string;
  server: string;
  name: string;
  address: string;
}

interface Stored extends SchoolChoice {
  v: 1;
  expires: number;
}

export const SCHOOL_CHOICE_KEY = 'pokyh_school';

const MIN_DAYS = 30;

/** End of the school year the date lies in (31 August, 23:59:59 local time), at least 30 days ahead. */
export function schoolChoiceExpiry(now = new Date()): number {
  const year = now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear();
  const yearEnd = new Date(year, 7, 31, 23, 59, 59).getTime();
  return Math.max(yearEnd, now.getTime() + MIN_DAYS * 24 * 60 * 60 * 1000);
}

function valid(value: unknown): value is Stored {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<Stored>;
  return (
    v.v === 1 &&
    typeof v.loginName === 'string' && v.loginName.length > 0 && v.loginName.length <= 100 &&
    typeof v.server === 'string' && /^[a-z0-9.-]{3,253}$/.test(v.server) &&
    typeof v.name === 'string' && v.name.length <= 200 &&
    typeof v.address === 'string' && v.address.length <= 300 &&
    typeof v.expires === 'number'
  );
}

export function readSchoolChoice(now = Date.now()): SchoolChoice | null {
  try {
    const raw = localStorage.getItem(SCHOOL_CHOICE_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!valid(value) || value.expires <= now) {
      localStorage.removeItem(SCHOOL_CHOICE_KEY);
      return null;
    }
    return { loginName: value.loginName, server: value.server, name: value.name, address: value.address };
  } catch {
    // Storage blocked or unreadable: no remembered school.
    return null;
  }
}

export function saveSchoolChoice(school: SchoolChoice): void {
  try {
    const value: Stored = {
      v: 1,
      loginName: school.loginName,
      server: school.server,
      name: school.name.slice(0, 200),
      address: school.address.slice(0, 300),
      expires: schoolChoiceExpiry(),
    };
    localStorage.setItem(SCHOOL_CHOICE_KEY, JSON.stringify(value));
  } catch {
    // Storage blocked: the school is asked again next time.
  }
}

export function forgetSchoolChoice(): void {
  try {
    localStorage.removeItem(SCHOOL_CHOICE_KEY);
  } catch {
    // nothing stored
  }
}
