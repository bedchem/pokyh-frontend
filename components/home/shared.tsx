'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { ensureGsap, prefersReducedMotion } from '@/lib/motion';

// Small pieces shared by the homepage sections.

// ── Intro gate ─────────────────────────────────────────────────────────────
// The hero holds its entrance until the intro curtain has lifted.

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

// ── Roll: the label slides up and a copy rolls in from below on hover ──────

export function Roll({ children, className = '' }: { children: string; className?: string }) {
  return (
    <span className={`roll ${className}`}>
      <span className="roll-a">{children}</span>
      <span className="roll-b" aria-hidden="true">{children}</span>
    </span>
  );
}

// ── Magnetic: the element leans towards the pointer ────────────────────────

export function Magnetic({ children, strength = 0.35, className = '' }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !window.matchMedia('(pointer: fine)').matches) return;
    const gsap = ensureGsap();
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const leave = () => {
      xTo(0);
      yTo(0);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, [strength]);
  return (
    <span ref={ref} className={`inline-block will-change-transform ${className}`}>
      {children}
    </span>
  );
}
