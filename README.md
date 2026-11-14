# MDrive Web

Vue 3 + TypeScript + Tailwind v4 web app for MDrive, the media asset management service (`code-drive`): browse projects, upload media, review in a viewer with pinned comments, approve or reject, and download released files.

Design source: Figma file "Modest Human Brands", page "Desktop - MDrive".

## Screens

| Route                                        | Screen                                                                                                                  |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `/` (first run)                              | Redirects to `/setup` until setup is finished (flag `mdrive:setup` in localStorage), then to `/projects`.               |
| `/setup`                                     | Setup step 1 of 3: organization ID, user ID and API key. Stored only in this browser (localStorage).                    |
| `/setup/storage`                             | Step 2: move your media. Pick a source and a different destination (R2, S3, Google Drive, this computer), or skip.      |
| `/setup/storage/scope`, `/review`, `/moving` | What to move, review and start, progress. **Mocked**: no migration API exists yet, the run is simulated in the browser. |
| `/setup/done`                                | Step 3: done, marks setup finished and opens the projects.                                                              |
| `/access`                                    | Same form as setup step 1, used to reconnect (for example after a 401).                                                 |
| `/projects`                                  | Projects grid with search and status filter (Shoot, Edit, Delivered).                                                   |
| `/projects/:projectId`                       | Media grid (uploader, duration, version in the tile footer), review tabs, sort, upload dialog, Submit review.           |
| `/projects/:projectId?media=ID`              | Full-screen viewer: filmstrip, zoom, pinned comments, file details and EXIF, approve/reject, download.                  |

If the API answers 401/403 the app returns to `/access` and asks for the details again. Setup steps after the first need saved access details; the review and moving steps need a valid source and destination, otherwise they go back to `/setup/storage`. To see setup again, clear the `mdrive:setup` key in localStorage.

## Getting started

```bash
bun install
cp .env.example .env.local
bun run dev   # http://localhost:5173, proxies /api and /media to VITE_MDRIVE_API_URL
```

Run the MDrive API first (default `http://localhost:3004`).

## Scripts

`dev`, `build`, `preview`, `lint`, `format`, `test:unit`, `docker:build`, `docker:start`.

## Deploy (Docker)

The container serves the built app with nginx on port 8080 and reverse-proxies `/api` and `/media` to the API, so the browser never needs CORS on the API (it sends none on `/api`).

| Setting      | Where                | Purpose                                                                            |
| ------------ | -------------------- | ---------------------------------------------------------------------------------- |
| `SITE_URL`   | build arg            | Public URL of this app.                                                            |
| `API_ORIGIN` | container env (`-e`) | MDrive API origin to proxy to, no trailing slash (e.g. `https://api.example.com`). |

```bash
bun run docker:build
docker run -p 2000:8080 -e API_ORIGIN=http://host.docker.internal:3004 mdrive-web:dev
```

Unknown paths fall back to `index.html`, so deep links work.

## Required setup elsewhere

- **R2 CORS:** uploads PUT straight from the browser to presigned R2 URLs. The drive bucket needs a CORS rule that allows `PUT` with the `Content-Type` header from this app's origin.
- **Downloads:** released media opens via presigned R2 URLs. To force "save as", have R2 answer with a `Content-Disposition: attachment` header.

## Not connected yet (mocked or omitted)

- Submit review needs the "Review Note" (text) and "Reviewed At" (date) columns on the Notion Projects database, and has not been run against real Notion yet.
- Camera, lens and other EXIF rows stay empty until the media processor sends `metadata.exif` to the upload webhook.
- Not built: bulk move/delete (endpoints exist, no design), creating projects, media search, video playback.
- Comments are posted with the role "Client" (`DEFAULT_AUTHOR_ROLE`).