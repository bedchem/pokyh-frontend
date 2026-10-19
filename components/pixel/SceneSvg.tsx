import type { CSSProperties, ReactNode } from 'react';
import { SPRITE_CSS } from './palette';
import type { Scene, SceneLayer, Sprite } from './sprite';

// Draws sprites (./sprite.ts) as SVG: one path per tone, crisp edges, the
// palette as CSS custom properties. The palette's style travels with the
// drawing; React keeps one copy per page (same href) and puts it in the head.

export function SpritePalette() {
  return <style href="pokyh-sprites" precedence="low">{SPRITE_CSS}</style>;
}

export function Paths({ sprite }: { sprite: Sprite }) {
  return (
    <>
      {sprite.paths().map(([tone, d]) => <path key={tone} d={d} fill={`var(--s-${tone})`} />)}
    </>
  );
}

/** A layer inside the groups its animations need, outermost first. */
export function Layer({ layer }: { layer: SceneLayer }) {
  return (layer.cls ?? []).reduceRight<ReactNode>((inner, cls) => <g className={cls}>{inner}</g>, <Paths sprite={layer.sprite} />);
}

export default function SceneSvg({
  scene,
  className = '',
  style,
  label,
  children,
}: {
  scene: Scene;
  className?: string;
  style?: CSSProperties;
  /** Read out instead of hiding the drawing from screen readers. */
  label?: string;
  children?: ReactNode;
}) {
  return (
    <>
      <SpritePalette />
      <svg
        viewBox={`0 0 ${scene.w} ${scene.h}`}
        className={`spr ${className}`}
        style={style}
        shapeRendering="crispEdges"
        role={label ? 'img' : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
      >
        {scene.layers.map((l) => <Layer key={l.name} layer={l} />)}
        {children}
      </svg>
    </>
  );
}
