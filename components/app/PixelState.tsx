import type { ReactNode } from 'react';
import SceneSvg from '@/components/pixel/SceneSvg';
import { stateScene, type PixelSprite } from '@/components/pixel/states';

// Small pixel scenes for states where something went wrong or there is
// nothing to show, drawn as sprites in the manner of the Mensa plate (square
// pixels, outlines, light from the top left, dithered shadows; the drawings
// are in components/pixel/states.ts) and animated in steps (globals.css,
// .px-*). Reduced motion shows them still. Below each: the plain sentence,
// the technical reason in small type, and an action.
//
//   unplugged  a plug that keeps reaching for its socket — connection, loading
//   search     a magnifier going over a page, finding nothing — something isn't there
//   lock       a padlock whose shackle won't stay shut — the session ended
//   empty      a tumbleweed rolling past a cactus — nothing here yet
//   holiday    sun, a beach umbrella and waves rolling in — a week without school
//   sun        the sun in sunglasses, a cloud drifting by — a day without school
//   cancelled  a calendar page with a blinking cross — every lesson cancelled
//   event      a flag in the wind — a day-long event
//   swap       two arrows trading places — every lesson substituted
//   chat       a speech bubble typing, an answer popping up — no comments yet
//   mail       a mailbox, its flag going up and down — no messages
//   excused    someone asleep in bed, z's rising — a day excused from school
//   bell       a bell ringing — no reminders yet

export type { PixelSprite };

export function PixelSpriteArt({ sprite = 'unplugged', className = '', width }: { sprite?: PixelSprite; className?: string; width?: string }) {
  return <SceneSvg scene={stateScene(sprite)} className={className} style={width ? { width } : undefined} />;
}

export default function PixelState({
  title,
  note,
  detail,
  action,
  sprite = 'unplugged',
  compact = false,
  className = '',
}: {
  title: string;
  /** A second sentence for people, under the title. */
  note?: string;
  /** The technical reason, shown small under the sentence. */
  detail?: string;
  action?: ReactNode;
  sprite?: PixelSprite;
  /** Smaller, for use inside a list or a card. */
  compact?: boolean;
  className?: string;
}) {
  return (
    <div role="status" className={`rise flex flex-col items-center px-4 text-center ${compact ? 'py-6' : 'py-10'} ${className}`}>
      <PixelSpriteArt sprite={sprite} className={compact ? 'w-[120px]' : 'w-[160px]'} />
      <p className={`max-w-[36ch] font-bold tracking-[-0.015em] ${compact ? 'mt-4 text-[15px]' : 'mt-6 text-[16.5px]'}`}>{title}</p>
      {note && <p className="mt-1.5 max-w-[44ch] text-[14.5px] leading-relaxed text-ink-2">{note}</p>}
      {detail && <p className="mono mt-1.5 max-w-[48ch] text-[12.5px] text-ink-3 [overflow-wrap:anywhere]">{detail}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
