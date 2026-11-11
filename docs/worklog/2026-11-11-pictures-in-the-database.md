# 2026-11-11 · Every picture in the database, so every backup has it

Factual log. No credentials or personal data are recorded here.
Repositories: `pokyh-backend` (working tree on top of 988ebde), `pokyh-frontend`
(uncommitted at the time of writing).

## What the owner asked for

- Custom pictures can be uploaded and are there in the SQL export. Chosen:
  dishes, popups and subject pictures; pictures that are only linked are
  fetched by themselves; tests stay local. Then: check for security issues.

## Findings

- Uploaded dish and subject pictures already lay in the database, and the
  backup's mysqldump brought them back byte for byte (checked with the
  production image's client against MySQL 8.4). Missing were: pictures that
  are only links (all 29 of the owner's mensa.json), popups (links only),
  and the dump wrote blobs as raw bytes.
- Subject pictures were stored unturned at full size; a crop outside the
  picture gave a server error.
- A too large answer to a fetch left an uncaught error behind.

## What changed

- `src/utils/pictures.ts`: one way in for every picture: read for what its
  bytes are, drawn anew as WebP of at most 1600 px, upright, no EXIF.
- `src/services/dishPictures.ts`: linked dish pictures are fetched into
  `dish_images` (new column `source_url`), failed links retried and named in
  the panel; a source's new link replaces its old copy, never an upload.
- Popups: `popup_images` (new table), upload by button, paste or drop,
  served at `/popup-images/<id>`.
- Backups dump binary columns as hex.
- Website: popup picture paths get the API's address; `next dev` passes
  `/popup-images` on.

## Security check

- Fixed: links on the host of `MENSA_IMPORT_URL` were fetched from the
  internal network for whoever may edit dishes. Now public addresses only;
  internal hosts only by `MENSA_PICTURE_INTERNAL_HOSTS` (empty by default), no
  redirects there.
- Stored pictures are served only with a picture type, `nosniff` and a
  sandbox policy; popup HTML takes `<img>` only from web links or
  `/popup-images/<uuid>`.

## Verification

- MySQL 8.4.13 in Docker: unit 492/492; pictures e2e 10/10 (incl. backup and
  restore byte for byte); Mensa 16/16, PDF 11/11, two nodes 8/8, deploy
  rehearsal 4/4, cluster 66/66, admin 22/22. Frontend 83/83, static export
  clean.
- The real links of the mensa.json: 27 of 29 taken over (one 404, one 403).
- Not looked at in a browser: the new panel parts.

## Open

- Commit and deploy. Set `PUBLIC_BASE_URL` on the server for the apps.
