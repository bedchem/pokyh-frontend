'use client';

// Small pieces shared by the homepage sections.

// ── Intro gate ─────────────────────────────────────────────────────────────
// Used by the former intro curtain (Intro.tsx, no longer rendered).

let introFinished = false;
const introWaiters: Array<() => void> = [];

export function finishIntro() {
  if (introFinished) return;
  introFinished = true;
  introWaiters.splice(0).forEach((fn) => fn());
}

export function afterIntro(fn: () => void): () => void {
  if (introFinished) {
    fn();
    return () => {};
  }
  introWaiters.push(fn);
  return () => {
    const i = introWaiters.indexOf(fn);
    if (i >= 0) introWaiters.splice(i, 1);
  };
}
