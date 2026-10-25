// Runs the WebGL test (lib/webgl-probe.ts) off the page: making the context
// takes several milliseconds exactly where there is no graphics card.
import { webglKind } from './webgl-probe';

self.onmessage = () => {
  self.postMessage(webglKind(new OffscreenCanvas(1, 1)));
};
