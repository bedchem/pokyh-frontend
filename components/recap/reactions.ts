import type { Look, Wear } from '@/components/pixel/MascotFigure';
import type { Mood } from '@/lib/recap-story';

// How the mascot takes each figure of the recap (lib/recap-story.ts picks
// the mood): its face, what its arms do, the sign above its head, what it
// wears from room A+2/05's collection, how it moves in (once, then
// `settle`, again every `repeat` ms) and what flies around it.
//
//   legend   star eyes, the crown, a somersault, confetti — not one hour missed
//   great    cheering, jumping, sparkles
//   good     thumb up, a hop
//   ok       a wave, blinking
//   meh      looks aside, wobbly mouth, a drop of sweat
//   worried  peeks through its hands, "!" and sweat, shakes, rain
//   alarm    covers its eyes, "!", shakes again and again, red alarm light
//   proud    graduation cap, thumb up
//   love     heart eyes, waving, hearts rising
//   focused  the magnifier
//   sleepy   eyes shut, a thought bubble, z's rising
//   party    party hat, cheering, confetti
//   cool     sunglasses, thumb up
//   curious  magnifier and "?"
//   peek     peeks through its fingers
//   angry    brows down, fists, steam
//   angel    eyes shut, content, sparkles
//   zap      fizzing with energy, bolts
//   night    headphones, eyes shut, stars
//   early    wide awake, waving, sparkles
//   cheer    both arms up, confetti

export type FieldParticles = 'confetti' | 'stars' | 'rain' | 'alarm';
export type LocalParticles = 'sparkle' | 'zzz' | 'hearts';

export interface Reaction {
  look: Look;
  wear?: Wear;
  field?: FieldParticles;
  local?: LocalParticles;
  /** The motion after the first one. */
  settle?: Look['motion'];
  /** Plays the first motion again every … ms. */
  repeat?: number;
}

const O = [0, 0] as [number, number];

export const REACTIONS: Record<Mood, Reaction> = {
  wave: { look: { pose: { eyes: 'happy', look: O, mouth: 'grin', arms: 'wave' }, wave: true, motion: 'hop' }, field: 'stars' },
  legend: { look: { pose: { eyes: 'stars', look: O, mouth: 'grin', arms: 'cheer' }, motion: 'flip' }, wear: { head: 'crown' }, field: 'confetti', local: 'sparkle', repeat: 3400 },
  great: { look: { pose: { eyes: 'happy', look: O, mouth: 'grin', arms: 'cheer' }, motion: 'jump' }, local: 'sparkle', field: 'stars', repeat: 2600 },
  good: { look: { pose: { eyes: 'happy', look: O, mouth: 'grin', arms: 'thumb' }, motion: 'hop' }, local: 'sparkle' },
  ok: { look: { pose: { eyes: 'open', look: [1, 0], mouth: 'smile', arms: 'wave' }, wave: true, blink: true, motion: 'bob' } },
  meh: { look: { pose: { eyes: 'open', look: [-1, 0], mouth: 'wobble', arms: 'down' }, sweat: true, blink: true, motion: 'bob' } },
  worried: { look: { pose: { eyes: 'wide', look: O, mouth: 'o', arms: 'peek' }, mark: '!', sweat: true, motion: 'shake' }, field: 'rain', repeat: 2400 },
  alarm: { look: { pose: { eyes: 'closed', look: O, mouth: 'frown', arms: 'cover' }, mark: '!', sweat: true, motion: 'shake' }, field: 'alarm', repeat: 1600 },
  proud: { look: { pose: { eyes: 'happy', look: O, mouth: 'grin', arms: 'thumb' }, motion: 'hop' }, wear: { head: 'gradcap' }, local: 'sparkle', repeat: 3000 },
  love: { look: { pose: { eyes: 'hearts', look: O, mouth: 'grin', arms: 'wave' }, wave: true, motion: 'hop' }, local: 'hearts' },
  focused: { look: { pose: { eyes: 'open', look: [1, 0], mouth: 'flat', arms: 'lens' }, blink: true, motion: 'bob' } },
  sleepy: { look: { pose: { eyes: 'closed', look: O, mouth: 'o', arms: 'down' }, think: true, motion: 'bob' }, local: 'zzz' },
  party: { look: { pose: { eyes: 'happy', look: O, mouth: 'grin', arms: 'cheer' }, motion: 'jump' }, wear: { head: 'partyhat' }, field: 'confetti', repeat: 2600 },
  cool: { look: { pose: { eyes: 'open', look: [1, 0], mouth: 'smile', arms: 'thumb' }, motion: 'hop' }, wear: { face: 'shades' }, local: 'sparkle' },
  curious: { look: { pose: { eyes: 'open', look: [1, -1], mouth: 'o', arms: 'lens' }, mark: '?', motion: 'bob' } },
  peek: { look: { pose: { eyes: 'open', look: [1, 1], mouth: 'o', arms: 'peek' }, blink: true, motion: 'bob' } },
  angry: { look: { pose: { eyes: 'angry', look: O, mouth: 'frown', arms: 'fists' }, anger: true, motion: 'fume' } },
  angel: { look: { pose: { eyes: 'closed', look: O, mouth: 'smile', arms: 'down' }, motion: 'hop' }, local: 'sparkle', field: 'stars' },
  zap: { look: { pose: { eyes: 'wide', look: O, mouth: 'grin', arms: 'cheer' }, zap: true, motion: 'buzz' }, local: 'sparkle' },
  night: { look: { pose: { eyes: 'closed', look: O, mouth: 'smile', arms: 'down' }, motion: 'bob' }, wear: { head: 'headphones' }, field: 'stars', local: 'zzz' },
  early: { look: { pose: { eyes: 'wide', look: O, mouth: 'grin', arms: 'wave' }, wave: true, motion: 'jump' }, local: 'sparkle' },
  cheer: { look: { pose: { eyes: 'happy', look: O, mouth: 'grin', arms: 'cheer' }, motion: 'hop' }, field: 'confetti', repeat: 3000 },
};

/** Motions that keep going by themselves; the others play once. */
export const ONGOING: ReadonlySet<Look['motion']> = new Set(['bob', 'fume', 'buzz']);
