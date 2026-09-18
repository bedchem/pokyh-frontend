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
    let gestureLocked = false;
    let endTimer: ReturnType<typeof setTimeout> | undefined;

    const armGestureEnd = () => {
      if (endTimer) clearTimeout(endTimer);
      endTimer = setTimeout(() => {
        gestureLocked = false;
        horizontalDistance = 0;
      }, cooldownMs);
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;

      const absX = Math.abs(event.deltaX);
      const absY = Math.abs(event.deltaY);
      if (absX === 0 || absX <= absY * 1.2) {
        if (gestureLocked) armGestureEnd();
        else horizontalDistance = 0;
        return;
      }

      if (gestureLocked) {
        // Keep consuming momentum from the same gesture, but never navigate again.
        event.preventDefault();
        armGestureEnd();
        return;
      }

      horizontalDistance += event.deltaX;
      armGestureEnd();
      if (Math.abs(horizontalDistance) < threshold) return;

      // Positive wheel delta scrolls the content to the right: show the next week.
      onSwipe(horizontalDistance > 0 ? 'next' : 'previous');
      gestureLocked = true;
      horizontalDistance = 0;
      armGestureEnd();
      event.preventDefault();
    };

    target.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      target.removeEventListener('wheel', onWheel);
      if (endTimer) clearTimeout(endTimer);
    };
  }, [cooldownMs, disabled, onSwipe, targetRef, threshold]);
}
