import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// The served dish of the Mensa page, rendered: a glazed ceramic plate turned
// on a lathe (dark speckled stoneware in the dark theme) between a polished
// steel fork and knife, lit by a soft room environment, with their shadows
// on the page. Seen from straight above the plate's centre, so its well stays
// a circle and the food photo can sit in it as an HTML layer (see
// FOOD_SHARE); dish photos come from other hosts without CORS and cannot be
// WebGL textures. A narrow perspective (instead of a flat projection) lets the
// steel catch changing reflections.

/** Width and height of the view in scene units (the canvas has this aspect). */
export const VIEW = { w: 8.6, h: 4.9 };
/** Diameter of the well where the food photo goes, as a share of the view width. */
export const FOOD_SHARE = 2.5 / VIEW.w;
/** Height of the well's floor; the view is exactly VIEW wide at this height. */
const WELL_Y = 0.1;
const FOV = 30;

// Outline of the plate (radius, height), from the centre of the underside
// out to the rim and back over the top to the centre. In this order the
// lathe's faces point outwards (up on the top surface).
const PROFILE: [number, number][] = [
  [0, 0], [1.2, 0], [1.3, 0.012], [1.45, 0.05], [1.7, 0.13], [1.95, 0.18], [2.02, 0.205],
  [2.03, 0.235], [2.0, 0.262], [1.94, 0.275], [1.8, 0.27], [1.62, 0.245], [1.52, 0.205],
  [1.42, 0.15], [1.33, 0.115], [1.25, 0.1], [0, 0.1],
];

// ── Cutlery ──────────────────────────────────────────────────────────────
// Modelled, not cut out: each piece is swept along its length (t = 0 at the
// top of the view, 1 at the bottom) with a rounded cross-section whose width,
// thickness and height change along the way, so the steel catches light
// across and along it like real cutlery.

const LENGTH = 4.4;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** Rounds an end: 0 at the very end, 1 after `span`. */
const cap = (d: number, span: number) => Math.sqrt(clamp01(d / span) * (2 - clamp01(d / span)));

type Section = { w: number; th: number; x?: number; y?: number };

/** A swept, closed mesh between t0 and t1 with cross-sections from `at`. */
function sweep(t0: number, t1: number, at: (t: number) => Section, segments = 160, ring = 32): THREE.BufferGeometry {
  const pos: number[] = [];
  const index: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = t0 + ((t1 - t0) * i) / segments;
    const { w, th, x = 0, y = 0 } = at(t);
    const z = -LENGTH / 2 + t * LENGTH;
    for (let j = 0; j < ring; j++) {
      const a = (j / ring) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      // A slightly squared ellipse: flatter on top, rounded at the edges.
      pos.push(
        x + Math.sign(c) * Math.pow(Math.abs(c), 0.75) * (w / 2),
        y + th / 2 + Math.sign(s) * Math.pow(Math.abs(s), 0.85) * (th / 2),
        z,
      );
    }
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < ring; j++) {
      const a = i * ring + j;
      const b = i * ring + ((j + 1) % ring);
      const c = (i + 1) * ring + j;
      const d = (i + 1) * ring + ((j + 1) % ring);
      index.push(a, b, c, b, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}

/** The handle shared by both pieces: narrow at the neck, wide and bowed at the end. */
function handle(t: number, from: number, neck: number): Section {
  const k = smooth(from, 0.9, t);
  const end = cap(1 - t, 0.07);
  return {
    w: mix(neck, 0.42, k) * end,
    th: mix(0.07, 0.11, k) * end,
    // The handle rises a little towards its end, as on a real fork or knife.
    y: 0.05 * smooth(from, 1, t),
  };
}

function knifeGeometry(): THREE.BufferGeometry[] {
  return [
    sweep(0, 1, (t) => {
      if (t < 0.47) {
        // The blade: a rounded tip, then almost straight, thin.
        const tip = cap(t, 0.07);
        return { w: mix(0.4, 0.36, t / 0.47) * tip, th: 0.035 * tip + 0.004, x: 0.02 * (1 - tip) };
      }
      if (t < 0.54) {
        // The bolster between blade and handle.
        const k = smooth(0.47, 0.54, t);
        return { w: mix(0.36, 0.24, k), th: mix(0.035, 0.09, k), y: 0 };
      }
      return handle(t, 0.54, 0.24);
    }),
  ];
}

function forkGeometry(): THREE.BufferGeometry[] {
  // The head curves up towards the tines.
  const lift = (t: number) => 0.09 * (1 - smooth(0.04, 0.36, t));
  const parts = [
    sweep(0.17, 1, (t) => {
      if (t < 0.36) {
        // The head below the tines, closing off at its top edge, narrowing into the neck.
        const top = cap(t - 0.17, 0.025);
        const k = smooth(0.2, 0.36, t);
        return { w: mix(0.46, 0.16, k) * top, th: mix(0.045, 0.07, k) * top + 0.004, y: lift(t) };
      }
      return handle(t, 0.36, 0.16);
    }),
  ];
  // Four tines with rounded tips.
  for (const x of [-0.17, -0.057, 0.057, 0.17]) {
    parts.push(sweep(0, 0.205, (t) => {
      const tip = cap(t, 0.03);
      return { w: 0.075 * tip + 0.003, th: 0.042 * tip + 0.003, x, y: lift(t) };
    }, 60, 20));
  }
  return parts;
}

function cutlery(parts: THREE.BufferGeometry[], material: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  for (const geo of parts) {
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    group.add(mesh);
  }
  return group;
}

export interface PlateScene {
  setTheme(dark: boolean): void;
  resize(): void;
  dispose(): void;
}

/** A faint speckle for the glaze, drawn once on a canvas. */
function speckle(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    const r = Math.random() * 1.3 + 0.3;
    ctx.fillStyle = `rgba(0,0,0,${(Math.random() * 0.18 + 0.04).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 512, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

export function createPlateScene(canvas: HTMLCanvasElement, dark: boolean): PlateScene | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.04).texture;
  scene.environment = env;
  // Seen from above, flat metal mirrors what is overhead: turn the room so it
  // shows walls and the edges of the lights instead of a white ceiling.
  scene.environmentRotation.set(1.05, 0.5, 0);

  // Straight above the plate's centre; the top of the view is -z.
  const camera = new THREE.PerspectiveCamera(FOV, VIEW.w / VIEW.h, 0.1, 60);
  camera.position.set(0, WELL_Y + VIEW.h / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2)), 0);
  camera.up.set(0, 0, -1);
  camera.lookAt(0, 0, 0);

  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffffff, 1.5);
  sun.position.set(-3.5, 9, -4.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 9;
  sun.shadow.blurSamples = 20;
  sun.shadow.bias = -0.0004;
  const sc = sun.shadow.camera as THREE.OrthographicCamera;
  sc.left = -6; sc.right = 6; sc.top = 4; sc.bottom = -4; sc.near = 1; sc.far = 30;
  scene.add(sun);

  // The page itself, only to catch the shadows.
  const floorMat = new THREE.ShadowMaterial({ opacity: 0.2 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const glaze = speckle();
  const plateMat = new THREE.MeshPhysicalMaterial({ roughness: 0.4, clearcoat: 1, clearcoatRoughness: 0.08 });
  const plate = new THREE.Mesh(
    new THREE.LatheGeometry(PROFILE.map(([r, y]) => new THREE.Vector2(r, y)), 128),
    plateMat,
  );
  plate.castShadow = true;
  plate.receiveShadow = true;
  scene.add(plate);

  const steel = new THREE.MeshPhysicalMaterial({ color: 0xc9cdd4, metalness: 1, roughness: 0.22 });
  const fork = cutlery(forkGeometry(), steel);
  fork.position.set(-3.05, 0, 0);
  const knife = cutlery(knifeGeometry(), steel);
  knife.position.set(3.05, 0, 0);
  scene.add(fork, knife);

  const render = () => renderer.render(scene, camera);

  const setTheme = (isDark: boolean) => {
    if (isDark) {
      // Dark speckled stoneware
      plateMat.color.set(0x232328);
      plateMat.map = glaze;
      plateMat.roughness = 0.62;
      plateMat.clearcoat = 0.45;
      plateMat.clearcoatRoughness = 0.32;
      scene.environmentIntensity = 0.5;
      floorMat.opacity = 0.55;
      ambient.intensity = 0.2;
      sun.intensity = 1.3;
      steel.color.set(0xb4b8c0);
    } else {
      // White porcelain
      plateMat.color.set(0xf5f3ef);
      plateMat.map = null;
      plateMat.roughness = 0.45;
      plateMat.clearcoat = 0.9;
      plateMat.clearcoatRoughness = 0.12;
      scene.environmentIntensity = 0.75;
      floorMat.opacity = 0.2;
      ambient.intensity = 0.35;
      sun.intensity = 1.5;
      steel.color.set(0xc9cdd4);
    }
    plateMat.needsUpdate = true;
    render();
  };

  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    render();
  };

  setTheme(dark);
  resize();

  return {
    setTheme,
    resize,
    dispose: () => {
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      plateMat.dispose();
      steel.dispose();
      floorMat.dispose();
      glaze.dispose();
      env.dispose();
      pmrem.dispose();
      room.dispose();
      renderer.dispose();
    },
  };
}
