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

export const GRADE_COLORS: Record<number, string> = {
  10: '#30D158',
  9: '#4ED87A',
  8: '#A3E650',
  7: '#FFD60A',
  6: '#FF9F0A',
  5: '#FF6B35',
  4: '#FF3B30',
};

export function gradeColor(value: number): string {
  return GRADE_COLORS[value] ?? '#8E8E93';
}

export function averageColor(avg: number): string {
  if (avg >= 8.5) return '#30D158';
  if (avg >= 6.5) return '#FFD60A';
  return '#FF3B30';
}
