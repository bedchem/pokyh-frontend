'use client';

// Full-screen intro covers (components/LoadingCover.tsx) register here while
// they are up, so overlays such as the announcement popup can wait until the
// page is actually visible instead of opening (and counting down) underneath.

let covers = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** Marks the page as covered; call the returned function when the cover is gone. */
export function holdPageCover(): () => void {
  covers += 1;
  emit();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    covers -= 1;
    emit();
  };
}

export function isPageCovered(): boolean {
  return covers > 0;
}

/** For useSyncExternalStore. */
export function subscribePageCover(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
