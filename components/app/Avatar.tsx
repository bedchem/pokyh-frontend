'use client';

import { useState } from 'react';
import { initialsOf } from './hooks';

// The account's WebUntis picture (proxied by /api/webuntis/profile-image), or
// its initials on the periwinkle tone when there is none. A missing picture is
// remembered for the page load, so the initials don't flash on every screen.
let pictureMissing = false;

export default function Avatar({
  name,
  size = 40,
  picture = true,
  className = '',
}: {
  name: string;
  size?: number;
  /** Signed-in WebUntis accounts only; others have no picture to load. */
  picture?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(pictureMissing);
  const showPicture = picture && !failed;

  return (
    <span
      aria-hidden="true"
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-periwinkle font-bold text-periwinkle-ink select-none ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {initialsOf(name)}
      {showPicture && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/api/webuntis/profile-image"
          alt=""
          className="absolute inset-0 size-full object-cover"
          onError={() => {
            pictureMissing = true;
            setFailed(true);
          }}
        />
      )}
    </span>
  );
}
