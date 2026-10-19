import { Paths, SpritePalette } from '@/components/pixel/SceneSvg';
import { DIGITS, EYES, EYES_SHUT, FACE, GHOST_A, GHOST_B, GROUND, H, SHADOW_NARROW, SHADOW_WIDE, W } from '@/components/pixel/notFound';

// The 404 as sprites, in the manner of the Mensa plate (drawn in
// components/pixel/notFound.ts): three chunky digits that drop into place
// one after the other, and beside them the missing page as a little ghost.
// It floats up and down, squints happily now and then, waves its stubs and
// flutters its hem; its shadow on the ground shrinks as it rises. Plain SVG with CSS animation;
// the styles travel with the drawing, so the site's 404 and the standalone
// 404 document (app/global-not-found.tsx) share them.

const CSS = `
.nf-art{overflow:visible}
.nf-digit{animation:nf-drop .8s steps(8,end) both}
@keyframes nf-drop{0%{opacity:0;transform:translateY(-14px)}12%{opacity:1}70%{transform:translateY(1px)}100%{opacity:1;transform:none}}
.nf-ghost{animation:nf-float 2.4s steps(1,end) infinite}
@keyframes nf-float{0%,24%{transform:none}25%,49%{transform:translateY(-1px)}50%,74%{transform:translateY(-2px)}75%,100%{transform:translateY(-1px)}}
.nf-shadow{animation:nf-shadow 2.4s steps(1,end) infinite}
.nf-shadow-high{animation-name:nf-shadow-high}
@keyframes nf-shadow{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes nf-shadow-high{0%,49%{opacity:0}50%,100%{opacity:1}}
.nf-hem{animation:nf-flip .6s steps(1,end) infinite}
.nf-hem-alt{animation-direction:reverse}
@keyframes nf-flip{0%,49%{opacity:1}50%,100%{opacity:0}}
.nf-eyes{animation:nf-blink 4.2s steps(1,end) .8s infinite}
.nf-eyes-shut{opacity:0;animation-name:nf-blink-shut}
@keyframes nf-blink{0%,91%{opacity:1}92%,95%{opacity:0}96%,100%{opacity:1}}
@keyframes nf-blink-shut{0%,91%{opacity:0}92%,95%{opacity:1}96%,100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.nf-digit,.nf-ghost,.nf-shadow,.nf-hem,.nf-eyes{animation:none;opacity:1}.nf-shadow-high,.nf-hem-alt,.nf-eyes-shut{opacity:0}}`;

export default function Pixel404({ className = '', label }: { className?: string; label?: string }) {
  return (
    <>
      <SpritePalette />
      <style href="pokyh-404" precedence="low">{CSS}</style>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={`spr nf-art ${className}`}
        shapeRendering="crispEdges"
        role={label ? 'img' : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
      >
        <Paths sprite={GROUND} />
        {DIGITS.map((d, i) => (
          <g key={i} className="nf-digit" style={{ animationDelay: `${0.12 + i * 0.14}s` }}>
            <Paths sprite={d} />
          </g>
        ))}
        <g className="nf-shadow"><Paths sprite={SHADOW_WIDE} /></g>
        <g className="nf-shadow nf-shadow-high"><Paths sprite={SHADOW_NARROW} /></g>
        <g className="nf-ghost">
          <g>
            <g className="nf-hem"><Paths sprite={GHOST_A} /></g>
            <g className="nf-hem nf-hem-alt"><Paths sprite={GHOST_B} /></g>
            <Paths sprite={FACE} />
            <g className="nf-eyes"><Paths sprite={EYES} /></g>
            <g className="nf-eyes nf-eyes-shut"><Paths sprite={EYES_SHUT} /></g>
          </g>
        </g>
      </svg>
    </>
  );
}
