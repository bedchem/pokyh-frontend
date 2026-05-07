// Fallback Three.js scene for browsers without OffscreenCanvas.
// Identical logic to original IPhoneScene — runs on main thread.
import type { RefObject } from 'react';
import * as THREE from 'three';
import { GLTFLoader }  from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

function rrect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y); g.lineTo(x + w - r, y);
  g.arcTo(x + w, y, x + w, y + r, r); g.lineTo(x + w, y + h - r);
  g.arcTo(x + w, y + h, x + w - r, y + h, r); g.lineTo(x + r, y + h);
  g.arcTo(x, y + h, x, y + h - r, r); g.lineTo(x, y + r);
  g.arcTo(x, y, x + r, y, r); g.closePath();
}

function buildScreenTexture(): THREE.CanvasTexture {
  const W = 600, H = 1300;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#050506'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#000'; rrect(g, (W - 168) / 2, 24, 168, 42, 21); g.fill();
  g.fillStyle = '#f5f5f7'; g.font = 'bold 28px -apple-system, Helvetica Neue, sans-serif'; g.textBaseline = 'alphabetic';
  g.fillText('9:41', 32, 78);
  g.font = '16px -apple-system, Helvetica Neue, sans-serif'; g.textAlign = 'right';
  g.fillText('●●●', W - 30, 75); g.textAlign = 'left';
  g.fillStyle = '#6e6e73'; g.font = '400 24px -apple-system, Helvetica Neue, sans-serif';
  g.fillText('Montag, 27. April', 30, 138);
  g.fillStyle = '#f5f5f7'; g.font = 'bold 54px -apple-system, Helvetica Neue, sans-serif';
  g.fillText('Hallo, Sabby', 30, 204);
  g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(18, 224); g.lineTo(W - 18, 224); g.stroke();
  const card = (y: number, h: number) => {
    g.fillStyle = '#0f0f11'; rrect(g, 16, y, W - 32, h, 28); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.09)'; g.lineWidth = 1; rrect(g, 16, y, W - 32, h, 28); g.stroke();
  };
  card(234, 136);
  g.fillStyle = '#6e6e73'; g.font = '600 17px -apple-system, sans-serif'; g.fillText('SCHNITT', 36, 274);
  g.fillStyle = '#f5f5f7'; g.font = 'bold 42px -apple-system, sans-serif'; g.fillText('8,42', 36, 328);
  g.textAlign = 'right'; g.fillStyle = '#6e6e73'; g.font = '600 17px -apple-system, sans-serif'; g.fillText('NÄCHSTE', W - 36, 274);
  g.fillStyle = '#f5f5f7'; g.font = '600 25px -apple-system, sans-serif'; g.fillText('Mathematik', W - 36, 308);
  g.fillStyle = '#6e6e73'; g.font = '400 20px -apple-system, sans-serif'; g.fillText('in 12 min · R204', W - 36, 342);
  g.textAlign = 'left';
  const LESSONS = [
    { time: '08:00', col: '#6366F1', title: 'Mathematik', room: 'R204 · Hofer' },
    { time: '09:00', col: '#10b981', title: 'Deutsch',    room: 'R112 · Mair'  },
    { time: '10:00', col: '#f97316', title: 'Fachpraxis', room: 'Werkstatt B'   },
    { time: '11:00', col: '#8b5cf6', title: 'Englisch',   room: 'R301 · Pichler'},
  ];
  card(388, 10 + LESSONS.length * 80);
  g.fillStyle = '#6e6e73'; g.font = '600 17px -apple-system, sans-serif'; g.fillText('HEUTE', 36, 428);
  LESSONS.forEach((l, i) => {
    const ly = 446 + i * 80;
    if (i > 0) { g.strokeStyle = 'rgba(255,255,255,0.06)'; g.lineWidth = 1; g.beginPath(); g.moveTo(54, ly - 6); g.lineTo(W - 32, ly - 6); g.stroke(); }
    g.fillStyle = '#6e6e73'; g.font = '400 20px -apple-system, sans-serif'; g.fillText(l.time, 32, ly + 28);
    g.fillStyle = l.col; rrect(g, 116, ly + 5, 4, 46, 2); g.fill();
    g.fillStyle = '#f5f5f7'; g.font = '600 23px -apple-system, sans-serif'; g.fillText(l.title, 134, ly + 28);
    g.fillStyle = '#6e6e73'; g.font = '400 19px -apple-system, sans-serif'; g.fillText(l.room, 134, ly + 53);
  });
  const tex = new THREE.CanvasTexture(cv); tex.minFilter = THREE.LinearFilter; return tex;
}

export function startScene(canvas: HTMLCanvasElement, progressRef: RefObject<number>, onReady?: () => void): () => void {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.88;
  renderer.setClearColor(0x000000, 0);
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  camera.position.set(0, -0.17, 7.0); camera.lookAt(0, 0, 0);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.fromScene(new RoomEnvironment(), 0.04).texture; pmrem.dispose();
  const isDark = document.documentElement.classList.contains('dark');
  const ambLight  = new THREE.AmbientLight(0xffffff, isDark ? 0.85 : 1);
  const fillLight = new THREE.DirectionalLight(0xccd8ff, 1); fillLight.position.set(-5, 0, 2);
  const rimLight  = new THREE.DirectionalLight(0x8899bb, 1); rimLight.position.set(-2, -6, 0);
  const backLight = new THREE.DirectionalLight(0xfff4d8, 1); backLight.position.set(4, 3, -3);
  const frontLight = new THREE.DirectionalLight(0xffffff, 0.85); frontLight.position.set(-1.5, 1.8, 4);
  const topLight  = new THREE.DirectionalLight(0xffffff, 0.55); topLight.position.set(0, 5, 2);
  scene.add(ambLight, fillLight, rimLight, backLight, frontLight, topLight);
  const screenTex = buildScreenTexture();
  let lightTex: THREE.Texture | null = null;
  let darkTex: THREE.Texture | null = null;
  let screenMeshMats: THREE.MeshBasicMaterial[] = [];
  let loadedModel: THREE.Group | null = null;
  let phone: THREE.Group | null = null;
  let curDark = isDark;
  function applyScreen() {
    if (!loadedModel) return;
    const tex = (curDark ? darkTex : lightTex) ?? screenTex;
    screenMeshMats = [];
    loadedModel.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const mat = child.material as THREE.MeshStandardMaterial;
      const nm = (child.name + (mat?.name ?? '')).toLowerCase();
      const isNamedScreen = nm.includes('screen') || nm.includes('display') || nm.includes('glass_fr') || nm.includes('oled') || (mat?.name ?? '') === 'BsXHDwLKqtDOfrW';
      const img = mat?.map?.image as unknown as { width: number; height: number } | undefined;
      const isPortrait = img && img.width > 0 && img.height > img.width * 1.6;
      if (isNamedScreen || isPortrait) {
        const m = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
        child.material = m;
        screenMeshMats.push(m);
      }
    });
  }
  const loader = new THREE.TextureLoader();
  function sharpTex(tex: THREE.Texture) {
    tex.colorSpace = THREE.SRGBColorSpace;
    // Trilinear + anisotropy preserves thin text when the screen bitmap is
    // downsampled. Anisotropy needs mipmaps to actually work.
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tex.needsUpdate = true;
  }
  loader.load('/models/white.webp', (tex) => { sharpTex(tex); lightTex = tex; applyScreen(); });
  loader.load('/models/dark.webp',  (tex) => { sharpTex(tex); darkTex  = tex; applyScreen(); });
  const draco = new DRACOLoader(); draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  const gltf = new GLTFLoader(); gltf.setDRACOLoader(draco);
  gltf.load('/models/iphone.glb', (g) => {
    const model = g.scene;
    const box = new THREE.Box3().setFromObject(model);
    const sz = box.getSize(new THREE.Vector3()); const ct = box.getCenter(new THREE.Vector3());
    model.position.set(-ct.x, -ct.y, -ct.z); model.scale.setScalar(1.9 / Math.max(sz.x, sz.y, sz.z));
    const pivot = new THREE.Group(); pivot.add(model); pivot.scale.setScalar(0.92); scene.add(pivot);
    phone = pivot; loadedModel = model; applyScreen();
    model.traverse((child) => { if (child instanceof THREE.Mesh) { const m = child.material as THREE.MeshStandardMaterial; if (m?.isMeshStandardMaterial) { m.envMapIntensity = 0.30; m.needsUpdate = true; } } });
  });
  function syncSize() { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  syncSize(); const ro = new ResizeObserver(syncSize); ro.observe(canvas);
  const moObs = new MutationObserver(() => {
    const dark = document.documentElement.classList.contains('dark');
    if (dark === curDark) return;
    curDark = dark;
    ambLight.intensity = dark ? 0.55 : 0.85;
    renderer.toneMappingExposure = dark ? 0.88 : 0.78;
    const tex = (dark ? darkTex : lightTex) ?? screenTex;
    for (const m of screenMeshMats) { m.map = tex; m.needsUpdate = true; }
  });
  moObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  let rafId: number; const timer = new THREE.Timer(); const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; let smoothP = 0; let firstFrameReported = false;
  function frame() {
    rafId = requestAnimationFrame(frame); timer.update(); syncSize();
    if (phone) {
      const rawP = Math.max(0, Math.min(1, progressRef.current ?? 0)); smoothP += (rawP - smoothP) * (noMotion ? 1 : 0.04);
      const rotF = Math.min(1, Math.max(0, (smoothP - 0.20) / 0.62));
      phone.rotation.y = rotF * Math.PI * 2; phone.rotation.x = Math.sin(rotF * Math.PI * 2) * 0.055;
      const entry = Math.min(1, smoothP / 0.30); phone.scale.setScalar(0.92 + entry * 0.18);
      phone.position.y = 0.32 + Math.sin(timer.getElapsed() * 0.75) * 0.026 * entry;
    }
    renderer.render(scene, camera);
    if (phone && !firstFrameReported) { firstFrameReported = true; onReady?.(); }
  }
  frame();
  return () => { cancelAnimationFrame(rafId); ro.disconnect(); moObs.disconnect(); renderer.dispose(); screenTex.dispose(); draco.dispose(); timer.dispose(); };
}
