import type { ReactNode } from 'react';

// A phone around a screenshot, drawn in CSS: an iPhone (Dynamic Island,
// action button, volume and side buttons) or an Android phone (punch-hole
// camera, buttons on the right). All sizes are relative to the frame's own
// width (container units), so it scales as one piece. The screen keeps the
// aspect of the screenshots (1179 × 2556 and 945 × 2048 are both 0.461).

type Platform = 'ios' | 'android';

const SHAPE: Record<Platform, { radius: string; bezel: string; screen: string }> = {
  ios: { radius: '16.5cqw', bezel: '3.6cqw', screen: '13.2cqw' },
  android: { radius: '11cqw', bezel: '3cqw', screen: '8.4cqw' },
};

// Side buttons: [side, top %, height %]
const BUTTONS: Record<Platform, ['left' | 'right', number, number][]> = {
  ios: [['left', 17, 5], ['left', 25, 9], ['left', 36, 9], ['right', 27, 14]],
  android: [['right', 21, 8], ['right', 33, 16]],
};

export default function DeviceFrame({ platform, children, className = '' }: { platform: Platform; children: ReactNode; className?: string }) {
  const shape = SHAPE[platform];
  return (
    <div className={`relative [container-type:inline-size] ${className}`}>
      {BUTTONS[platform].map(([side, top, height], i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute w-[1.1cqw] bg-[#2C2C31]"
          style={{
            [side]: '-0.8cqw',
            top: `${top}%`,
            height: `${height}%`,
            borderRadius: side === 'left' ? '1cqw 0 0 1cqw' : '0 1cqw 1cqw 0',
          }}
        />
      ))}
      <div
        className="relative bg-[#0B0B0D] shadow-[0_0_0_0.7cqw_#34343A,0_30px_60px_-20px_rgb(0_0_0/0.45),0_12px_24px_-12px_rgb(0_0_0/0.3)]"
        style={{ borderRadius: shape.radius, padding: shape.bezel }}
      >
        <div className="relative aspect-[1179/2556] overflow-hidden bg-black" style={{ borderRadius: shape.screen }}>
          {children}
          {platform === 'ios' ? (
            <span aria-hidden="true" className="absolute left-1/2 top-[2.4cqw] h-[8.6cqw] w-[30cqw] -translate-x-1/2 rounded-full bg-black" />
          ) : (
            <span aria-hidden="true" className="absolute left-1/2 top-[2.6cqw] size-[3.8cqw] -translate-x-1/2 rounded-full bg-black shadow-[0_0_0_0.5cqw_rgb(255_255_255/0.06)]" />
          )}
        </div>
      </div>
    </div>
  );
}
