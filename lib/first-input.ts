'use client';

// Work that only matters once the visitor does something: the scroll-driven
// animations of sections further down a page, smooth scrolling. Until the
// first scroll, touch, click, key or pointer move none of it can be seen, so
// loading the page leaves it out (it would only hold up the page coming
// alive). From then on each piece runs in a task of its own when the browser
// is idle, so none of them holds up the input that started it.

const INPUTS = ['scroll', 'wheel', 'touchstart', 'pointerdown', 'pointermove', 'keydown'] as const;

type Job = { run: () => void };

let started = false;
let listening = false;
let pending = false;
const queue: Job[] = [];

type IdleWindow = Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };

function next() {
  if (pending || !queue.length) return;
  pending = true;
  const step = () => {
    pending = false;
    queue.shift()?.run();
    next();
  };
  const idle = (window as IdleWindow).requestIdleCallback;
  if (idle) idle(step, { timeout: 300 });
  else window.setTimeout(step, 1);
}

function start() {
  if (started) return;
  started = true;
  for (const type of INPUTS) window.removeEventListener(type, start, true);
  next();
}

/**
 * Runs `run` after the visitor's first input on this page (at once if that
 * has happened, or the page opened scrolled down), in an idle task of its
 * own. Returns a function that drops it again if it has not run yet.
 */
export function afterFirstInput(run: () => void): () => void {
  const job: Job = { run };
  queue.push(job);
  if (!started && window.scrollY > 0) start();
  if (started) {
    next();
  } else if (!listening) {
    listening = true;
    for (const type of INPUTS) window.addEventListener(type, start, { capture: true, passive: true });
  }
  return () => {
    const i = queue.indexOf(job);
    if (i >= 0) queue.splice(i, 1);
  };
}
