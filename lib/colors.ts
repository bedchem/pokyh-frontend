const SUBJECT_COLORS: Record<string, string> = {
  D: '#5AA0E8',
  M: '#4ED87A',
  IT: '#E73BDF',
  'Bew.Sport': '#AA8EE0',
  ENGL: '#3DC4CE',
  R: '#C6E84A',
  'M5-M7': '#E08899',
  M8: '#E89E6E',
  'Re-Wiku': '#6AB87A',
};

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function subjectColor(name: string): string {
  if (SUBJECT_COLORS[name]) return SUBJECT_COLORS[name];
  const hue = hashString(name) % 360;
  return `hsl(${hue}, 50%, 52%)`;
}

type RGB = [number, number, number];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function lerpColor(c1: RGB, c2: RGB, t: number): string {
  const r = Math.round(lerp(c1[0], c2[0], t));
  const g = Math.round(lerp(c1[1], c2[1], t));
  const b = Math.round(lerp(c1[2], c2[2], t));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// 6.4+ → light green (#86EFAC) to dark green (#15803D)
// 6.0–6.39 → orange (#F97316)
// <6.0 → light red (#FCA5A5) near 6.0, dark red (#991B1B) at 1
const GREEN_LIGHT: RGB = [134, 239, 172];
const GREEN_DARK: RGB = [21, 128, 61];
const RED_LIGHT: RGB = [252, 165, 165];
const RED_DARK: RGB = [153, 27, 27];

export function gradeColor(value: number): string {
  if (value >= 6.4) {
    return lerpColor(GREEN_LIGHT, GREEN_DARK, (value - 6.4) / (10 - 6.4));
  }
  if (value >= 6.0) {
    return '#F97316';
  }
  return lerpColor(RED_LIGHT, RED_DARK, (6.0 - value) / (6.0 - 1));
}

export function averageColor(avg: number): string {
  return gradeColor(avg);
}

// Integer grade → color map for the DonutChart (grades 1–10)
export const GRADE_COLORS: Record<number, string> = Object.fromEntries(
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => [g, gradeColor(g)])
);
