# 2026-11-25 · Own dish photos: bigger on the pixel plate, whole elsewhere, no "outside photos" switch

Factual log. No credentials or personal data are recorded here.
Repository: `pokyh-frontend` (uncommitted at the time of writing).

## What the owner asked for

- POKYH now has its own dish photos (a white plate from above on a
  transparent ground). On the pixel plate the photo was too small; it has to
  fill the plate, the pixel plate stays.
- The dish page cut the photo off; it should stand bare, plate visible.
- Homepage: no turning and no 3D tilt on hover, just the image.
- Remove everything saying the photos send the visitor's IP address to other
  sites: they are POKYH's own photos on POKYH's server.

## Findings

- `GET /dishes`: every dish with a photo has `ownImage: true`, served from
  `api.pokyh.com/dishes/<id>/image` (WebP with alpha, 1254 × 1254, the plate
  filling 95–97 % of the square).

## What changed

- `components/mensa/PixelPlate.tsx`: the photo fills the whole well up to the
  step down from the rim (before: the smaller food circle), zoomed so its own
  white rim falls outside, cut to the pixel edge. Rim, shadow, cutlery and
  steam stay pixel art. The drawn meal hides once the photo is in.
- Dish page (`components/mensa/DishView.tsx`, `Food` in `parts.tsx`): the
  photo square and whole (`object-contain`, no frame); the pixel plate when
  there is no photo or it fails.
- Homepage (`components/home/MensaToday.tsx`): the photo square and whole;
  pointer tilt and scroll zoom removed.
- App dashboard Mensa card: photos whole instead of cropped into tiles.
- Removed the "outside photos" switch: `lib/external-media.ts`,
  `components/ExternalMediaNotice.tsx`, `lib/i18n/dictionaries/media.ts`.
- Legal texts (de/it/en): the dish photos item now says they are POKYH's own
  and load only from its server; recipe sites removed from the recipients and
  from transfers to third countries; `pokyh_external_media` removed from the
  storage and cookie lists. Version shown: 25 November 2026.
  `PRIVACY_NOTICE_VERSION` unchanged (only a recipient removed, nobody needs
  to be asked again).
- README security note and the nginx header comment no longer mention recipe
  sites.

## Verification

- `tsc` and ESLint clean on the changed files.
- Looked at in the browser (`next dev`): /de/mensa (plate and plan rows),
  a dish page, the homepage section; no console errors.
