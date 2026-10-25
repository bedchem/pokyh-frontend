// The test behind hardwareWebGL() (lib/webgl.ts), on any canvas: in the page,
// or in the worker that runs it off the page (lib/webgl.worker.ts).

const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render/i;

/** How WebGL 2 is drawn on this canvas: by a graphics card, by the processor, or not at all. */
export type WebGLKind = 'gpu' | 'software' | 'none';

export function webglKind(canvas: HTMLCanvasElement | OffscreenCanvas): WebGLKind {
  try {
    const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) as WebGL2RenderingContext | null;
    if (!gl) {
      // Refused for being slow, or no WebGL 2 here at all (as in a worker of Safari 16).
      const plain = canvas.getContext('webgl2') as WebGL2RenderingContext | null;
      plain?.getExtension('WEBGL_lose_context')?.loseContext();
      return plain ? 'software' : 'none';
    }
    // Chrome hands out its software renderer (SwiftShader) despite the flag;
    // its name gives it away. Firefox names the renderer itself, Chrome only
    // through the extension (asked only then: Firefox warns about it).
    let renderer = String(gl.getParameter(gl.RENDERER));
    if (/^webkit webgl$/i.test(renderer)) {
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      if (info) renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL));
    }
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return SOFTWARE.test(renderer) ? 'software' : 'gpu';
  } catch {
    return 'none';
  }
}
