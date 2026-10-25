'use client';

import { webglKind, type WebGLKind } from './webgl-probe';

// Whether WebGL runs on a graphics card. Without one (no GPU, a driver the
// browser blocks) it is drawn by the processor, and the homepage's 3D
// scenes, drawn anew every frame, would take the processor the page needs:
// they stay off then, as with reduced motion.
//
// Where the browser can (OffscreenCanvas in a worker), the test runs in a
// worker of its own, so the page never waits for it; elsewhere, and where the
// worker has no WebGL at all (Safari 16), in the page.

const inPage = () => webglKind(document.createElement('canvas')) === 'gpu';

function inWorker(): Promise<boolean> | null {
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') return null;
  try {
    const worker = new Worker(new URL('./webgl.worker.ts', import.meta.url), { type: 'module' });
    return new Promise<boolean>((resolve) => {
      const done = (value: boolean) => {
        worker.terminate();
        resolve(value);
      };
      worker.onmessage = (e: MessageEvent<WebGLKind>) => done(e.data === 'none' ? inPage() : e.data === 'gpu');
      // A worker that cannot run leaves the test to the page.
      worker.onerror = () => done(inPage());
      worker.postMessage(null);
    });
  } catch {
    return null;
  }
}

let answer: Promise<boolean> | null = null;

/** Whether WebGL runs on a graphics card; tested once per page. */
export function hardwareWebGL(): Promise<boolean> {
  answer ??= inWorker() ?? Promise.resolve(inPage());
  return answer;
}
