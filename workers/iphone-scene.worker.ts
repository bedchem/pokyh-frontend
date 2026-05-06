/// <reference lib="webworker" />

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// ── State ─────────────────────────────────────────────────────────────────────
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let phone: THREE.Group | null = null;
let ambLight: THREE.AmbientLight | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let timerObj: any = null;
let rafId: number | null = null;
let smoothP = 0;
let progressValue = 0;
let noMotion = false;
let firstFrameRendered = false;
let lightScreenTex: THREE.Texture | null = null;
let darkScreenTex: THREE.Texture | null = null;
let screenMaterials: THREE.MeshBasicMaterial[] = [];
let currentDark = false;

// requestAnimationFrame is available in dedicated workers in modern browsers.
// Fall back to setTimeout for older engines.
const rAF: (cb: FrameRequestCallback) => number =
  typeof requestAnimationFrame !== 'undefined'
    ? (cb) => requestAnimationFrame(cb)
    : (cb) => self.setTimeout(cb, 16) as unknown as number;
const cAF: (id: number) => void =
  typeof cancelAnimationFrame !== 'undefined'
    ? (id) => cancelAnimationFrame(id)
    : (id) => self.clearTimeout(id);

// ── Message handler ───────────────────────────────────────────────────────────
self.onmessage = (e: MessageEvent) => {
  const { type } = e.data as { type: string };
  if (type === 'init')     { initScene(e.data); return; }
  if (type === 'progress') { progressValue = (e.data as { value: number }).value; return; }
  if (type === 'theme')    { applyTheme((e.data as { dark: boolean }).dark); return; }
  if (type === 'resize')   { handleResize(e.data as { width: number; height: number; dpr: number }); return; }
  if (type === 'dispose')  { cleanup(); return; }
};

// ── Init ──────────────────────────────────────────────────────────────────────
function initScene(data: {
  canvas: OffscreenCanvas;
  lightScreenBitmap: ImageBitmap;
  darkScreenBitmap: ImageBitmap;
  dark: boolean;
  noReducedMotion: boolean;
  width: number;
  height: number;
  dpr: number;
}) {
  noMotion = !data.noReducedMotion;
  currentDark = data.dark;

  // OffscreenCanvas → THREE requires an `any` cast since Three.js types expect HTMLCanvasElement
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderer = new THREE.WebGLRenderer({
    canvas: data.canvas as unknown as HTMLCanvasElement,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(data.dpr, 2));
  renderer.setSize(data.width, data.height, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = data.dark ? 0.88 : 0.78;
  renderer.setClearColor(0x000000, 0);

  camera = new THREE.PerspectiveCamera(26, data.width / (data.height || 1), 0.1, 100);
  camera.position.set(0, -0.17, 7.0);
  camera.lookAt(0, 0, 0);

  scene = new THREE.Scene();

  // Environment map
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  // Lights (identical to original IPhoneScene)
  ambLight = new THREE.AmbientLight(0xffffff, data.dark ? 0.85 : 1);
  const fillLight  = new THREE.DirectionalLight(0xccd8ff, 1);   fillLight.position.set(-5, 0, 2);
  const rimLight   = new THREE.DirectionalLight(0x8899bb, 1);   rimLight.position.set(-2, -6, 0);
  const backLight  = new THREE.DirectionalLight(0xfff4d8, 1);   backLight.position.set(4, 3, -3);
  const frontLight = new THREE.DirectionalLight(0xffffff, 0.85); frontLight.position.set(-1.5, 1.8, 4);
  const topLight   = new THREE.DirectionalLight(0xffffff, 0.55); topLight.position.set(0, 5, 2);
  scene.add(ambLight, fillLight, rimLight, backLight, frontLight, topLight);

  // Screen textures from ImageBitmaps (transferred from main thread)
  function makeTex(bitmap: ImageBitmap): THREE.Texture {
    const t = new THREE.Texture(bitmap as unknown as HTMLImageElement);
    t.needsUpdate = true;
    // Trilinear + max anisotropy keeps thin/small text legible when the
    // hi-res screen bitmap is downsampled onto the small on-screen iPhone.
    // Anisotropy is a no-op without mipmaps, so both must be enabled together.
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer!.capabilities.getMaxAnisotropy();
    return t;
  }
  lightScreenTex = makeTex(data.lightScreenBitmap);
  darkScreenTex  = makeTex(data.darkScreenBitmap);

  let loadedModel: THREE.Group | null = null;

  function applyScreenTex() {
    if (!loadedModel) return;
    const tex = currentDark ? darkScreenTex! : lightScreenTex!;
    screenMaterials = [];
    loadedModel.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const mat = child.material as THREE.MeshStandardMaterial;
      const nm  = (child.name + (mat?.name ?? '')).toLowerCase();
      const isNamedScreen =
        nm.includes('screen') || nm.includes('display') ||
        nm.includes('glass_fr') || nm.includes('front_gl') ||
        nm.includes('oled')    || nm.includes('lcd') ||
        (mat?.name ?? '') === 'BsXHDwLKqtDOfrW';
      const img = mat?.map?.image as unknown as { width: number; height: number } | undefined;
      const isPortrait = img && img.width > 0 && img.height > img.width * 1.6;
      if (isNamedScreen || isPortrait) {
        // toneMapped:false keeps pure-white texels at full intensity so the
        // OLED-style contrast ("dark pixels stay dark, white pixels glow")
        // survives ACES tone mapping applied to the rest of the scene.
        const m = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
        child.material = m;
        screenMaterials.push(m);
      }
    });
  }

  // Load the GLB model
  const draco = new DRACOLoader();
  draco.setDecoderPath('/draco/gltf/');
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(draco);

  gltfLoader.load(
    '/models/iphone.glb',
    (gltf) => {
      const model = gltf.scene;
      const box    = new THREE.Box3().setFromObject(model);
      const size   = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const sf     = 1.9 / maxDim;

      model.position.set(-center.x, -center.y, -center.z);
      model.scale.setScalar(sf);

      const pivot = new THREE.Group();
      pivot.add(model);
      pivot.scale.setScalar(0.92);
      scene!.add(pivot);
      phone = pivot;
      loadedModel = model;
      applyScreenTex();

      model.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const mat = child.material as THREE.MeshStandardMaterial;
        if (mat?.isMeshStandardMaterial) {
          mat.envMapIntensity = 0.30;
          mat.needsUpdate = true;
        }
      });
    },
    undefined,
    (err) => console.error('[IPhoneWorker] GLB load error', err),
  );

  // Timer (THREE.Timer works in workers)
  timerObj = new THREE.Timer();

  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  // Render loop — off the main thread entirely
  function frame() {
    rafId = rAF(frame);
    timerObj.update();
    const dt = Math.min(timerObj.getDelta(), 0.05);

    if (phone) {
      const rawP = Math.max(0, Math.min(1, progressValue));
      const k = noMotion ? 1 : 1 - Math.exp(-2.4 * dt);
      smoothP += (rawP - smoothP) * k;

      const ROT_START = 0.15, ROT_END = 0.85;
      const rotRaw   = Math.min(1, Math.max(0, (smoothP - ROT_START) / (ROT_END - ROT_START)));
      const rotEased = easeInOutCubic(rotRaw);

      const ROT_AMOUNT = Math.PI * 0.85;
      const inv = 1 - rotEased;
      phone.rotation.y = inv * ROT_AMOUNT;
      phone.rotation.x = inv * 0.20 + Math.sin(rotEased * Math.PI) * 0.04;
      phone.rotation.z = inv * -0.16 + Math.sin(rotEased * Math.PI) * -0.03;

      const entry = easeOutCubic(Math.min(1, smoothP / 0.34));
      phone.scale.setScalar(0.74 + entry * 0.36);

      const t = timerObj.getElapsed();
      phone.position.y = 0.32 - inv * 0.10 +
        (Math.sin(t * 0.55) * 0.022 + Math.sin(t * 0.27 + 1.2) * 0.011) * entry;
      phone.position.x = inv * 0.06 +
        (Math.sin(t * 0.42) * 0.010 + Math.sin(t * 0.18 + 0.8) * 0.005) * entry;
    }

    renderer!.render(scene!, camera!);

    if (phone && !firstFrameRendered) {
      firstFrameRendered = true;
      self.postMessage({ type: 'ready' });
    }
  }
  frame();
}

// ── Resize ────────────────────────────────────────────────────────────────────
function handleResize({ width, height, dpr }: { width: number; height: number; dpr: number }) {
  if (!renderer || !camera || !width || !height) return;
  renderer.setPixelRatio(Math.min(dpr, 2));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

// ── Theme ─────────────────────────────────────────────────────────────────────
function applyTheme(dark: boolean) {
  currentDark = dark;
  if (ambLight)  ambLight.intensity           = dark ? 0.55 : 0.85;
  if (renderer)  renderer.toneMappingExposure = dark ? 0.88 : 0.78;
  const tex = dark ? darkScreenTex : lightScreenTex;
  if (tex && screenMaterials.length > 0) {
    for (const m of screenMaterials) { m.map = tex; m.needsUpdate = true; }
  }
}

// ── Cleanup ───────────────────────────────────────────────────────────────────
function cleanup() {
  if (rafId !== null) cAF(rafId);
  renderer?.dispose();
  timerObj?.dispose();
}
