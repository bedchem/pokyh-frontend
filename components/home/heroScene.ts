import * as THREE from 'three';
import {
  drawPoster,
  drawTile,
  POSTER_BG,
  TILE_TONES,
  type ArtFonts,
  type PosterKind,
  type TileKind,
  type TileText,
} from '@/lib/landing-art';

// The hero's tunnel: thick tiles of a school day (timetable, grades,
// messages, exams …) hang in depth around the headline. The camera flies
// through them as you scroll; tiles lean towards the pointer, lift when
// hovered and turn over when clicked to show their name on the back.

export type HeroItem =
  | { type: 'tile'; art: TileKind; portrait: boolean; label: string }
  | { type: 'poster'; art: PosterKind; label: string };

export interface HeroFrame {
  camZ: number;
  /** -1..1 */
  px: number;
  py: number;
  /** Scroll velocity, px per frame. */
  velocity: number;
  /** 0..1 how far the tiles have arrived (entrance). */
  arrive: number;
  background: THREE.ColorRepresentation;
  /** 0..1 how much of the dark screen at the end of the tunnel shows. */
  portal: number;
  time: number;
}

export interface HeroScene {
  frame(f: HeroFrame): void;
  resize(): void;
  /** The tile under the pointer, or null. */
  pick(clientX: number, clientY: number): number | null;
  setHover(index: number | null): void;
  flip(index: number): void;
  dispose(): void;
}

/** Where the camera rests once the entrance is over. */
export const CAMERA_REST = 12;
/** The dark screen at the end of the tunnel, and the distance at which it fills the view. */
export const PORTAL_Z = -104;
export const PORTAL_FILL = 1.2;
const FOV = 36;

const TILE_W = { portrait: 1.9, landscape: 2.5, poster: 2.2 };

function roundedShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x0 = -w / 2;
  const y0 = -h / 2;
  s.moveTo(x0 + r, y0);
  s.lineTo(x0 + w - r, y0);
  s.absarc(x0 + w - r, y0 + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x0 + w, y0 + h - r);
  s.absarc(x0 + w - r, y0 + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x0 + r, y0 + h);
  s.absarc(x0 + r, y0 + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x0, y0 + r);
  s.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

/** A flat face for the shape, with UVs spanning the bounding box. */
function faceGeometry(shape: THREE.Shape, w: number, h: number): THREE.ShapeGeometry {
  const g = new THREE.ShapeGeometry(shape, 12);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const u = (pos.getX(i) + w / 2) / w;
    uv.setXY(i, u, (pos.getY(i) + h / 2) / h);
  }
  uv.needsUpdate = true;
  return g;
}

/** The back of a tile: its name, large, in the tile's own colours. */
function drawBack(label: string, bg: string, ink: string, w: number, h: number, fonts: ArtFonts): HTMLCanvasElement {
  const scale = 360 / w;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let size = canvas.width * 0.2;
  ctx.font = `700 ${size}px ${fonts.sans}`;
  while (ctx.measureText(label).width > canvas.width * 0.84 && size > 20) {
    size -= 2;
    ctx.font = `700 ${size}px ${fonts.sans}`;
  }
  ctx.fillText(label, canvas.width / 2, canvas.height / 2);
  ctx.globalAlpha = 0.55;
  ctx.font = `600 ${canvas.width * 0.05}px ${fonts.sans}`;
  ctx.fillText('POKYH', canvas.width / 2, canvas.height - canvas.width * 0.08);
  return canvas;
}

interface Tile {
  group: THREE.Group;
  spin: THREE.Group;
  meshes: THREE.Mesh[];
  base: THREE.Vector3;
  rot: THREE.Euler;
  phase: number;
  twist: number;
  delay: number;
  hover: number;
  flip: number;
  flipTarget: number;
  flipTimer: ReturnType<typeof setTimeout> | null;
}

export function createHeroScene(
  canvas: HTMLCanvasElement,
  items: HeroItem[],
  text: TileText,
  fonts: ArtFonts,
): HeroScene | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const scene = new THREE.Scene();
  const fog = new THREE.Fog(0xf5f2ed, 9, 34);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
  camera.position.set(0, 0, CAMERA_REST);

  scene.add(new THREE.AmbientLight(0xffffff, 1.9));
  const sun = new THREE.DirectionalLight(0xffffff, 1.5);
  sun.position.set(-5, 7, 10);
  scene.add(sun);

  const textures: THREE.Texture[] = [];
  const texture = (c: HTMLCanvasElement) => {
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = aniso;
    textures.push(tex);
    return tex;
  };

  const tiles: Tile[] = items.map((item, i) => {
    let w: number;
    let h: number;
    let radius: number;
    let face: HTMLCanvasElement;
    let bg: string;
    let ink: string;
    if (item.type === 'tile') {
      w = item.portrait ? TILE_W.portrait : TILE_W.landscape;
      h = (w * (item.portrait ? 256 : 164)) / 200;
      radius = (22 / 200) * w;
      face = drawTile(item.art, 520, item.portrait, text, fonts);
      [bg, ink] = TILE_TONES[item.art];
    } else {
      w = TILE_W.poster;
      h = (w * 496) / 400;
      radius = (30 / 400) * w;
      face = drawPoster(item.art, 560, fonts);
      bg = POSTER_BG[item.art];
      ink = '#FFFFFF';
    }

    const shape = roundedShape(w, h, radius);
    const depth = 0.07;
    const bevel = 0.035;
    const bodyGeo = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel * 0.7,
      bevelSegments: 3,
      curveSegments: 10,
    });
    bodyGeo.translate(0, 0, -(depth + bevel));
    const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: bg, roughness: 0.62, metalness: 0 }));

    const front = new THREE.Mesh(
      faceGeometry(shape, w, h),
      new THREE.MeshBasicMaterial({ map: texture(face), alphaTest: 0.5, toneMapped: false }),
    );
    front.position.z = 0.002;

    const back = new THREE.Mesh(
      faceGeometry(shape, w, h),
      new THREE.MeshBasicMaterial({ map: texture(drawBack(item.label, bg, ink, w, h, fonts)), toneMapped: false }),
    );
    back.rotation.y = Math.PI;
    back.position.z = -(depth + bevel * 2) - 0.002;

    const spin = new THREE.Group();
    spin.add(body, front, back);
    const group = new THREE.Group();
    group.add(spin);
    scene.add(group);
    [body, front, back].forEach((m) => { m.userData.tile = i; });

    return {
      group,
      spin,
      meshes: [body, front, back],
      base: new THREE.Vector3(),
      rot: new THREE.Euler(),
      phase: i * 1.7,
      twist: (((i * 53) % 17) / 17 - 0.5) * 2.4,
      delay: Math.min(1, i / items.length) * 0.55,
      hover: 0,
      flip: 0,
      flipTarget: 0,
      flipTimer: null,
    };
  });

  const halfH = (d: number) => d * Math.tan(THREE.MathUtils.degToRad(FOV / 2));

  // The end of the tunnel: a dark screen the camera flies into.
  const portalMat = new THREE.MeshBasicMaterial({ color: 0x111114, transparent: true, opacity: 0, fog: false, toneMapped: false });
  const portal = new THREE.Mesh(new THREE.ShapeGeometry(roundedShape(1, 1, 0.08), 16), portalMat);
  portal.position.z = PORTAL_Z;
  scene.add(portal);

  // Positions depend on the aspect ratio: hand-placed near tiles, then a
  // tunnel of constant radius behind them.
  const place = () => {
    const scale = camera.aspect >= 1 ? 1 : 0.72;
    const hRest = halfH(CAMERA_REST);
    const rx = hRest * camera.aspect * 1.08;
    const ry = hRest * 1.04;
    const cover = halfH(PORTAL_FILL) * 2.12;
    portal.scale.set(cover * camera.aspect, cover, 1);
    tiles.forEach((tile, i) => {
      tile.group.scale.setScalar(scale);
      // Beyond the fog at rest: the tunnel only appears once you fly.
      const z = -26 - i * 2.6;
      const a = i * 2.39996 + 0.5;
      const f = 0.8 + ((i * 37) % 10) / 28;
      const x = Math.cos(a) * rx * f;
      const y = Math.sin(a) * ry * f;
      tile.base.set(x, y, z);
      const nx = x / (rx || 1);
      const ny = y / (ry || 1);
      tile.rot.set(ny * 0.32, -nx * 0.42, (((i * 29) % 11) / 11 - 0.5) * 0.3);
    });
  };

  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    const small = Math.min(w, h) < 700;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.6 : 1.85));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    place();
  };
  resize();

  const bgColor = new THREE.Color();
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const meshes = tiles.flatMap((t) => t.meshes);
  let hovered: number | null = null;
  let spinBoost = 0;

  const frame = (f: HeroFrame) => {
    bgColor.set(f.background);
    renderer.setClearColor(bgColor, 1);
    fog.color.copy(bgColor);

    camera.position.x += (f.px * 0.9 - camera.position.x) * 0.05;
    camera.position.y += (f.py * 0.55 - camera.position.y) * 0.05;
    camera.position.z = f.camZ;
    camera.lookAt(camera.position.x * 0.25, camera.position.y * 0.25, f.camZ - 30);
    portalMat.opacity = f.portal;
    portal.visible = f.portal > 0.001;
    portal.position.x = camera.position.x * 0.25;
    portal.position.y = camera.position.y * 0.25;

    spinBoost += (Math.max(-60, Math.min(60, f.velocity)) * 0.004 - spinBoost) * 0.08;

    tiles.forEach((tile, i) => {
      // Arrival: each tile comes out of the depth, turning, a little after the last.
      const a = Math.min(1, Math.max(0, (f.arrive - tile.delay) / (1 - tile.delay)));
      const e = 1 - Math.pow(1 - a, 4);
      tile.hover += ((hovered === i ? 1 : 0) - tile.hover) * 0.1;
      tile.flip += (tile.flipTarget - tile.flip) * 0.085;

      const bob = Math.sin(f.time * 0.55 + tile.phase) * 0.12;
      tile.group.position.set(tile.base.x, tile.base.y + bob, tile.base.z - (1 - e) * 22 + tile.hover * 0.7);
      const calm = 1 - tile.hover * 0.85;
      tile.group.rotation.set(
        tile.rot.x * calm + f.py * 0.08,
        tile.rot.y * calm - f.px * 0.1,
        tile.rot.z * calm + (1 - e) * tile.twist,
      );
      tile.spin.rotation.set(
        Math.sin(f.time * 0.4 + tile.phase) * 0.05 * calm,
        Math.cos(f.time * 0.35 + tile.phase) * 0.07 * calm + tile.flip,
        spinBoost * (i % 2 ? 1 : -1),
      );
      tile.spin.scale.setScalar((0.55 + 0.45 * e) * (1 + tile.hover * 0.06));
    });

    renderer.render(scene, camera);
  };

  const pick = (clientX: number, clientY: number) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(meshes, false)[0];
    return hit && hit.distance < 40 ? (hit.object.userData.tile as number) : null;
  };

  const flip = (index: number) => {
    const tile = tiles[index];
    if (!tile) return;
    const turned = Math.round(tile.flipTarget / Math.PI) % 2 !== 0;
    tile.flipTarget += Math.PI;
    if (tile.flipTimer) clearTimeout(tile.flipTimer);
    tile.flipTimer = turned ? null : setTimeout(() => { tile.flipTarget += Math.PI; tile.flipTimer = null; }, 3200);
  };

  return {
    frame,
    resize,
    pick,
    setHover: (index) => { hovered = index; },
    flip,
    dispose: () => {
      tiles.forEach((t) => { if (t.flipTimer) clearTimeout(t.flipTimer); });
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
      textures.forEach((t) => t.dispose());
      renderer.dispose();
    },
  };
}
