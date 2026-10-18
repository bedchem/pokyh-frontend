import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

// The served dish of the Mensa page, rendered, in a minimal style: a coupe
// plate (no rim, one soft curve from the flat centre up to a rounded edge,
// a foot ring underneath) turned on a lathe, between a one-piece fork and
// knife in brushed stainless steel with flat handles. Lit by a real photo
// studio (an HDR image, "Monochrome Studio 03" by Grzegorz Wronkowski,
// Poly Haven, CC0, public/hdr/studio.hdr), so glaze and steel show the
// reflections of its softboxes; soft shadows and a contact shadow ground them
// on the page. Until the image is loaded, a generated room stands in. In the
// dark theme the plate is dark speckled stoneware.
//
// Seen from straight above the plate's centre, so its well stays a circle and
// the food photo can lie in it as an HTML layer (see FOOD_SHARE): the dish
// photos are hotlinked from other sites and are neither copied nor turned
// into WebGL textures. A long lens keeps the cutlery true to shape while the
// steel still catches changing reflections.

/** Width and height of the view in scene units (the canvas has this aspect). */
export const VIEW = { w: 8.6, h: 4.9 };
/** Diameter of the well where the food photo goes, as a share of the view width. */
export const FOOD_SHARE = 2.5 / VIEW.w;
/** Height of the well's floor; the view is exactly VIEW wide at this height. */
const WELL_Y = 0.1;
const FOV = 22;
/** The studio lighting (CC0, see above); served with a long cache. */
const HDR_URL = '/hdr/studio.hdr';

// Outline of the coupe plate (radius, height), from the centre of the
// underside out over the foot ring to the rounded edge and back over the top
// to the centre of the well. Smoothed with a spline; in this order the
// lathe's faces point outwards.
const PROFILE: [number, number][] = [
  [0, 0.014], [1.1, 0.014], [1.18, 0.006], [1.24, 0], [1.34, 0], [1.4, 0.014],
  [1.66, 0.085], [1.86, 0.165], [1.99, 0.228], [2.055, 0.268],
  [2.074, 0.288], [2.066, 0.304], [2.04, 0.31],
  [1.94, 0.288], [1.78, 0.235], [1.6, 0.178], [1.44, 0.135], [1.32, 0.112],
  [1.22, 0.102], [1.0, 0.1], [0.5, 0.1], [0, 0.1],
];

function profilePoints(): THREE.Vector2[] {
  const curve = new THREE.SplineCurve(PROFILE.map(([r, y]) => new THREE.Vector2(r, y)));
  const pts = curve.getSpacedPoints(220);
  // The spline must neither cross the axis nor leave its ends.
  pts[0].set(0, PROFILE[0][1]);
  pts[pts.length - 1].set(0, PROFILE[PROFILE.length - 1][1]);
  return pts.map((p) => new THREE.Vector2(Math.max(0, p.x), p.y));
}

// ── Cutlery ──────────────────────────────────────────────────────────────
// Modelled, not cut out: each piece is swept along its length (t = 0 at the
// top of the view, 1 at the bottom) with a rounded cross-section whose
// width, thickness, height and offset change along the way. A blade section
// is a wedge (thick spine, fine edge), a fork head is dished.

const LENGTH = 4.5;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** Rounds an end: 0 at the very end, 1 after `span`. */
const cap = (d: number, span: number) => Math.sqrt(clamp01(d / span) * (2 - clamp01(d / span)));

type Section = {
  w: number;
  th: number;
  x?: number;
  y?: number;
  /** 0..1: how far the section thins towards its right edge (a blade). */
  wedge?: number;
  /** Upward bend across the width (a dished fork head). */
  dish?: number;
  /** 0 = round edges, 1 = nearly square (flat handles). */
  square?: number;
};

/** A swept, closed mesh between t0 and t1 with cross-sections from `at`; with UVs (u around, v along). */
function sweep(t0: number, t1: number, at: (t: number) => Section, segments = 180, ring = 40): THREE.BufferGeometry {
  const pos: number[] = [];
  const uv: number[] = [];
  const index: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = t0 + ((t1 - t0) * i) / segments;
    const { w, th, x = 0, y = 0, wedge = 0, dish = 0, square = 0 } = at(t);
    const z = -LENGTH / 2 + t * LENGTH;
    const ex = mix(0.7, 0.22, square);
    const ey = mix(0.8, 0.4, square);
    for (let j = 0; j <= ring; j++) {
      const a = ((j % ring) / ring) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const across = Math.sign(c) * Math.pow(Math.abs(c), ex); // -1 left … 1 right
      const thick = th * (1 - wedge * (across + 1) * 0.5 * 0.85);
      pos.push(
        x + across * (w / 2),
        y + thick / 2 + Math.sign(s) * Math.pow(Math.abs(s), ey) * (thick / 2) + dish * across * across,
        z,
      );
      uv.push(j / ring, t);
    }
  }
  const stride = ring + 1;
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < ring; j++) {
      const a = i * stride + j;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      index.push(a, b, c, b, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  geo.computeTangents();
  return geo;
}

/** A flat handle: slim at the neck, a little wider towards a rounded end, resting on the table there. */
function handle(t: number, from: number, neck: number, wide: number): Section {
  const k = smooth(from, 0.97, t);
  const end = cap(1 - t, 0.05);
  return {
    w: mix(neck, wide, k) * end,
    th: 0.07 * end + 0.004,
    y: 0.05 * Math.sin(Math.PI * smooth(from - 0.06, 1, t)),
    square: 0.85,
  };
}

function knifeGeometry(): THREE.BufferGeometry[] {
  // One piece: a straight spine on the left, the edge on the right curving up
  // into a rounded tip, then a flat handle of almost even width.
  const SPINE = -0.15;
  return [
    sweep(0, 1, (t) => {
      if (t < 0.46) {
        const width = 0.3 * Math.sqrt(clamp01(t / 0.18) * (2 - clamp01(t / 0.18)));
        const w = Math.max(0.012, width);
        return { w, th: 0.026 * cap(t, 0.04) + 0.005, x: SPINE + w / 2, wedge: 1, square: 0.2 };
      }
      if (t < 0.53) {
        // Blade flowing into the handle, without a bolster.
        const k = smooth(0.46, 0.53, t);
        return { w: mix(0.3, 0.2, k), th: mix(0.03, 0.07, k), x: mix(SPINE + 0.15, 0, k), wedge: 1 - k, square: mix(0.2, 0.85, k) };
      }
      return handle(t, 0.53, 0.2, 0.27);
    }),
  ];
}

function forkGeometry(): THREE.BufferGeometry[] {
  // The tines curve up off the table.
  const lift = (t: number) => 0.11 * Math.pow(1 - smooth(0, 0.33, t), 1.6);
  const parts = [
    sweep(0.15, 1, (t) => {
      if (t < 0.36) {
        // The head below the tines, slightly dished, narrowing into the neck.
        const top = cap(t - 0.15, 0.018);
        const k = smooth(0.18, 0.36, t);
        return { w: mix(0.44, 0.15, k) * top, th: mix(0.036, 0.062, k) * top + 0.004, y: lift(t), dish: 0.026 * (1 - k), square: 0.5 * k };
      }
      return handle(t, 0.36, 0.15, 0.27);
    }),
  ];
  // Four slim tines with rounded points.
  for (const x of [-0.165, -0.055, 0.055, 0.165]) {
    parts.push(sweep(0, 0.185, (t) => {
      const tip = cap(t, 0.03);
      return { w: mix(0.05, 0.062, t / 0.185) * tip + 0.004, th: 0.034 * tip + 0.004, x: x * mix(0.95, 1, t / 0.185), y: lift(t) + 0.026 * Math.pow(Math.abs(x) / 0.165, 2) };
    }, 70, 24));
  }
  return parts;
}

function cutlery(parts: THREE.BufferGeometry[], material: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  for (const geo of parts) {
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  return group;
}

export interface PlateScene {
  setTheme(dark: boolean): void;
  resize(): void;
  dispose(): void;
}

/** A faint speckle for the stoneware glaze, drawn once on a canvas. */
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

/** A soft round darkening, for the contact shadow where something meets the page. */
function softSpot(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.55)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
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
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  let env = pmrem.fromScene(room, 0.03).texture;
  scene.environment = env;
  let disposed = false;
  // The photo studio replaces the generated room once loaded.
  new HDRLoader().load(HDR_URL, (hdr) => {
    if (disposed) { hdr.dispose(); return; }
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    const studio = pmrem.fromEquirectangular(hdr).texture;
    hdr.dispose();
    env.dispose();
    env = studio;
    scene.environment = studio;
    render();
  });
  // Seen from above, flat steel and glaze mirror what is overhead: the studio
  // is turned so a softbox hangs above the table (its ceiling is dark, which
  // made flat blades look black), and its edges draw arcs on the plate.
  scene.environmentRotation.set(1.57, 0.4, 0);

  // Straight above the plate's centre; the top of the view is -z.
  const camera = new THREE.PerspectiveCamera(FOV, VIEW.w / VIEW.h, 0.1, 120);
  camera.position.set(0, WELL_Y + VIEW.h / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2)), 0);
  camera.up.set(0, 0, -1);
  camera.lookAt(0, 0, 0);

  const ambient = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xfff8f0, 1.6);
  sun.position.set(-3.2, 9, -4.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 14;
  sun.shadow.blurSamples = 24;
  sun.shadow.bias = -0.0006;
  const sc = sun.shadow.camera as THREE.OrthographicCamera;
  sc.left = -6; sc.right = 6; sc.top = 4.5; sc.bottom = -4.5; sc.near = 1; sc.far = 30;
  scene.add(sun);

  // The page itself, only to catch the shadows.
  const floorMat = new THREE.ShadowMaterial({ opacity: 0.18 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Contact shadows: darker right where plate and cutlery touch the page.
  const spot = softSpot();
  const contactMat = new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: spot, transparent: true, opacity: 0.16, depthWrite: false });
  const contact = (w: number, d: number, x: number, z: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), contactMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.002, z);
    scene.add(m);
  };
  contact(4.7, 4.7, 0.05, 0.05);

  const points = profilePoints();
  const glaze = speckle();
  const plateMat = new THREE.MeshPhysicalMaterial({ roughness: 0.34, clearcoat: 0.7, clearcoatRoughness: 0.12, ior: 1.5 });

  const plate = new THREE.Mesh(new THREE.LatheGeometry(points, 192), plateMat);
  plate.castShadow = true;
  plate.receiveShadow = true;
  scene.add(plate);

  const steel = new THREE.MeshPhysicalMaterial({
    color: 0xd9dce1,
    metalness: 1,
    roughness: 0.2,
    anisotropy: 0.6,
    // Brushed along the length of each piece (v runs along it).
    anisotropyRotation: Math.PI / 2,
    clearcoat: 0.3,
    clearcoatRoughness: 0.12,
  });
  const fork = cutlery(forkGeometry(), steel);
  fork.position.set(-3.1, 0, 0.05);
  fork.rotation.y = 0.02;
  const knife = cutlery(knifeGeometry(), steel);
  knife.position.set(3.08, 0, 0.1);
  knife.rotation.y = -0.015;
  scene.add(fork, knife);
  contact(0.7, 4.6, -3.1, 0.1);
  contact(0.6, 4.6, 3.08, 0.15);

  const render = () => renderer.render(scene, camera);

  const setTheme = (isDark: boolean) => {
    if (isDark) {
      // Dark speckled stoneware
      plateMat.color.set(0x26262c);
      plateMat.map = glaze;
      plateMat.roughness = 0.62;
      plateMat.clearcoat = 0.45;
      plateMat.clearcoatRoughness = 0.28;
      scene.environmentIntensity = 0.5;
      floorMat.opacity = 0.5;
      contactMat.opacity = 0.32;
      ambient.intensity = 0.18;
      sun.intensity = 1.35;
      steel.color.set(0xc2c6cd);
    } else {
      // White porcelain
      plateMat.color.set(0xf6f4f0);
      plateMat.map = null;
      plateMat.roughness = 0.36;
      plateMat.clearcoat = 0.75;
      plateMat.clearcoatRoughness = 0.1;
      scene.environmentIntensity = 0.8;
      floorMat.opacity = 0.18;
      contactMat.opacity = 0.16;
      ambient.intensity = 0.3;
      sun.intensity = 1.6;
      steel.color.set(0xd9dce1);
    }
    plateMat.needsUpdate = true;
    render();
  };

  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, w < 600 ? 2.5 : 2));
    renderer.setSize(w, h, false);
    render();
  };

  setTheme(dark);
  resize();

  return {
    setTheme,
    resize,
    dispose: () => {
      disposed = true;
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      plateMat.dispose();
      steel.dispose();
      floorMat.dispose();
      contactMat.dispose();
      glaze.dispose();
      spot.dispose();
      env.dispose();
      pmrem.dispose();
      room.dispose();
      renderer.dispose();
    },
  };
}
