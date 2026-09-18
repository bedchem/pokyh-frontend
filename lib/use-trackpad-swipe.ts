'use client';

import { useEffect, type RefObject } from 'react';

type SwipeDirection = 'next' | 'previous';

interface TrackpadSwipeOptions {
  threshold?: number;
  cooldownMs?: number;
  disabled?: boolean;
}

/**
 * Turns a deliberate horizontal two-finger trackpad gesture into one navigation action.
 * Vertical scrolling is left untouched, as is horizontal movement below the threshold.
 */
export function useTrackpadSwipe(
  targetRef: RefObject<HTMLElement | null>,
  onSwipe: (direction: SwipeDirection) => void,
  { threshold = 90, cooldownMs = 550, disabled = false }: TrackpadSwipeOptions = {},
) {
  useEffect(() => {
    const target = targetRef.current;
    if (!target || disabled) return;

    let horizontalDistance = 0;
    let lastSwipeAt = 0;

    const onWheel = (event: WheelEvent) => {
      const absX = Math.abs(event.deltaX);
      const absY = Math.abs(event.deltaY);
      if (absX === 0 || absX <= absY * 1.2) {
        horizontalDistance = 0;
        return;
      }

      horizontalDistance += event.deltaX;
      if (Math.abs(horizontalDistance) < threshold) return;

      const now = Date.now();
      if (now - lastSwipeAt >= cooldownMs) {
        // Positive wheel delta scrolls the content to the right: show the next week.
        onSwipe(horizontalDistance > 0 ? 'next' : 'previous');
        lastSwipeAt = now;
      }
      horizontalDistance = 0;
      event.preventDefault();
    };

    target.addEventListener('wheel', onWheel, { passive: false });
    return () => target.removeEventListener('wheel', onWheel);
  }, [cooldownMs, disabled, onSwipe, targetRef, threshold]);
}
