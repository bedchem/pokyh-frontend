// A 5 × 7 pixel font for the recap (the big figures, the cards to share):
// capitals with Ä Ö Ü and ß, digits and the signs the figures need. Text is
// set in capitals; other accented letters fall back to their base letter. A
// text becomes one SVG path of horizontal runs, in font pixels, so it stays
// crisp at any whole-number size and needs no font file — the shared picture
// draws it exactly as the page shows it.

const GLYPHS: Record<string, string[]> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  Ä: ['.#.#.', '.###.', '#...#', '#...#', '#####', '#...#', '#...#'],
  Ö: ['.#.#.', '.###.', '#...#', '#...#', '#...#', '#...#', '.###.'],
  Ü: ['.#.#.', '.....', '#...#', '#...#', '#...#', '#...#', '.###.'],
  ẞ: ['.##..', '#..#.', '#..#.', '#.##.', '#...#', '#...#', '#.##.'],
  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  1: ['.#.', '##.', '.#.', '.#.', '.#.', '.#.', '###'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
  7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  9: ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
  ' ': ['...', '...', '...', '...', '...', '...', '...'],
  '.': ['.', '.', '.', '.', '.', '.', '#'],
  ',': ['..', '..', '..', '..', '..', '.#', '#.'],
  ':': ['.', '.', '#', '.', '.', '#', '.'],
  ';': ['..', '..', '.#', '..', '..', '.#', '#.'],
  '!': ['#', '#', '#', '#', '#', '.', '#'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  '%': ['##..#', '##..#', '...#.', '..#..', '.#...', '#..##', '#..##'],
  '-': ['...', '...', '...', '###', '...', '...', '...'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  '/': ['....#', '...#.', '...#.', '..#..', '.#...', '.#...', '#....'],
  "'": ['#', '#', '.', '.', '.', '.', '.'],
  '"': ['#.#', '#.#', '...', '...', '...', '...', '...'],
  '(': ['.#', '#.', '#.', '#.', '#.', '#.', '.#'],
  ')': ['#.', '.#', '.#', '.#', '.#', '.#', '#.'],
  '&': ['.##..', '#..#.', '#.#..', '.#...', '#.#.#', '#..#.', '.##.#'],
  '#': ['.#.#.', '#####', '.#.#.', '.#.#.', '#####', '.#.#.', '.....'],
  '=': ['.....', '.....', '#####', '.....', '#####', '.....', '.....'],
  '_': ['.....', '.....', '.....', '.....', '.....', '.....', '#####'],
  '·': ['.', '.', '.', '#', '.', '.', '.'],
  '*': ['..#..', '..#..', '#####', '.###.', '.#.#.', '#...#', '.....'],
  '♥': ['.....', '##.##', '#####', '#####', '.###.', '..#..', '.....'],
  '>': ['#...', '.#..', '..#.', '...#', '..#.', '.#..', '#...'],
  '<': ['...#', '..#.', '.#..', '#...', '.#..', '..#.', '...#'],
  '×': ['.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '.....'],
};

const ALIASES: Record<string, string> = { '–': '-', '—': '-', '’': "'", '‘': "'", '“': '"', '”': '"', '„': '"', '…': '...', '★': '*', ' ': ' ', ' ': ' ' };

export const GLYPH_HEIGHT = 7;
const GAP = 1;
const LINE_GAP = 3;

/** The characters of a text as the font has them. */
function chars(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.toUpperCase()) {
    const c = ALIASES[raw] ?? raw;
    if (c.length > 1) { out.push(...c); continue; }
    if (GLYPHS[c]) { out.push(c); continue; }
    // Other accents: the base letter (È → E).
    const base = c.normalize('NFD').replace(/[̀-ͯ]/g, '');
    out.push(GLYPHS[base] ? base : '?');
  }
  return out;
}

const glyphWidth = (c: string) => GLYPHS[c]![0]!.length;

/** The width of a line in font pixels. */
export function pixelWidth(text: string): number {
  const cs = chars(text);
  return cs.reduce((w, c) => w + glyphWidth(c), 0) + Math.max(0, cs.length - 1) * GAP;
}

/** Breaks a text into lines of at most `max` font pixels (a word longer than that keeps its own line). */
export function pixelLines(text: string, max = Infinity): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (line && pixelWidth(next) > max) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    lines.push(line);
  }
  return lines;
}

/** Cuts a line to `max` font pixels with "...", if it is longer. */
export function pixelClip(text: string, max: number): string {
  if (pixelWidth(text) <= max) return text;
  let t = text;
  while (t.length > 1 && pixelWidth(`${t}...`) > max) t = t.slice(0, -1);
  return `${t.trimEnd()}...`;
}

export interface PixelPath {
  /** One path of the text, in font pixels × size, starting at 0, 0. */
  d: string;
  width: number;
  height: number;
}

/**
 * The text as a path: each line at `size` units per font pixel, lines
 * aligned left, centred or right within the widest one.
 */
export function pixelPath(text: string | string[], size = 1, align: 'left' | 'center' | 'right' = 'left'): PixelPath {
  const lines = Array.isArray(text) ? text : [text];
  const widths = lines.map(pixelWidth);
  const width = Math.max(0, ...widths);
  let d = '';
  lines.forEach((line, row) => {
    let x = align === 'center' ? (width - widths[row]!) / 2 : align === 'right' ? width - widths[row]! : 0;
    x = Math.round(x);
    const top = row * (GLYPH_HEIGHT + LINE_GAP);
    for (const c of chars(line)) {
      const glyph = GLYPHS[c]!;
      glyph.forEach((bits, y) => {
        // Runs of set pixels in a row become one rectangle.
        let start = -1;
        for (let i = 0; i <= bits.length; i++) {
          const on = bits[i] === '#';
          if (on && start < 0) start = i;
          if (!on && start >= 0) {
            d += `M${(x + start) * size} ${(top + y) * size}h${(i - start) * size}v${size}h${-(i - start) * size}z`;
            start = -1;
          }
        }
      });
      x += glyph[0]!.length + GAP;
    }
  });
  return { d, width: width * size, height: (lines.length * (GLYPH_HEIGHT + LINE_GAP) - LINE_GAP) * size };
}
