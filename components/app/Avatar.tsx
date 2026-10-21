'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { initialsOf } from './hooks';
import { useT } from '@/providers/LocaleProvider';
import { uiDict } from '@/lib/i18n/dictionaries/ui';
import { untisUrl } from '@/lib/backend';
import { useSession } from '@/providers/SessionProvider';

const MediaViewer = dynamic(() => import('@/components/ui/MediaViewer'), { ssr: false });

// The account's WebUntis picture (from the API's /webuntis/profile-image), or
// its initials on the periwinkle tone when there is none. A missing picture is
// remembered for the page load, so the initials don't flash on every screen.
// `expandable` (the profile): once the picture is there, a tap shows it full
// screen.
let pictureMissing = false;
const SRC = untisUrl('/api/webuntis/profile-image');

export default function Avatar({
  name,
  size = 40,
  picture = true,
  expandable = false,
  className = '',
}: {
  name: string;
  size?: number;
  /** Signed-in WebUntis accounts only; others have no picture to load. */
  picture?: boolean;
  expandable?: boolean;
  className?: string;
}) {
  const t = useT(uiDict);
  // Only a signed-in account has a picture: the page as built (and a guest)
  // asks the API for none.
  const { user } = useSession();
  const [failed, setFailed] = useState(pictureMissing);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const showPicture = picture && !failed && !!user;
  const fail = () => {
    pictureMissing = true;
    setFailed(true);
  };

  const face = (
    <span
      aria-hidden="true"
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-periwinkle font-bold text-periwinkle-ink select-none ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {initialsOf(name)}
      {showPicture && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={SRC}
          alt=""
          // Lazy: React preloads every other image of the page, which a
          // closed sidebar never shows (a console warning each time).
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
          // A picture that failed before the page came alive fires no error
          // event React sees; a loaded image without size has failed too.
          ref={(img) => {
            if (img?.complete && img.naturalWidth === 0) fail();
            else if (img?.complete && !loaded) setLoaded(true);
          }}
          onLoad={() => setLoaded(true)}
          onError={fail}
        />
      )}
    </span>
  );

  if (!expandable || !showPicture) return face;

  // Always the same button around the picture (so it isn't loaded twice),
  // usable once the picture is actually there.
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!loaded}
        aria-label={t('viewerOpenPicture')}
        className="shrink-0 cursor-zoom-in rounded-full transition-[filter] duration-200 hover:brightness-95 focus-visible:outline-offset-4 disabled:cursor-default disabled:hover:brightness-100"
      >
        {face}
      </button>
      {open && <MediaViewer item={{ kind: 'image', src: SRC, name }} onClose={() => setOpen(false)} />}
    </>
  );
}
