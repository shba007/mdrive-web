# MDrive Web

Vue 3 + TypeScript + Tailwind v4 web app for MDrive, the media asset management service (`code-drive`): browse projects, upload media, review in a viewer with pinned comments, approve or reject, and download released files.

Design source: Figma file "Modest Human Brands", page "Desktop - MDrive".

## Screens

| Route                           | Screen                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------- |
| `/access`                       | Organization ID, user ID and API key. Stored only in this browser (localStorage). |
| `/projects`                     | Projects grid with search and status filter (Shoot, Edit, Delivered).             |
| `/projects/:projectId`          | Media grid with review tabs, sort, upload dialog and Submit review.               |
| `/projects/:projectId?media=ID` | Full-screen viewer: filmstrip, zoom, pinned comments, approve/reject, download.   |

If the API answers 401/403 the app returns to `/access` and asks for the details again.

## Getting started

```bash
bun install
cp .env.example .env.local
bun run dev   # http://localhost:5173, proxies /api and /media to VITE_MDRIVE_API_URL
```

Run the MDrive API first (default `http://localhost:3003`).

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
docker run -p 2000:8080 -e API_ORIGIN=http://host.docker.internal:3003 mdrive-web:dev
```

Unknown paths fall back to `index.html`, so deep links work.

## Required setup elsewhere

- **R2 CORS:** uploads PUT straight from the browser to presigned R2 URLs. The drive bucket needs a CORS rule that allows `PUT` with the `Content-Type` header from this app's origin.
- **Downloads:** released media opens via presigned R2 URLs. To force "save as", have R2 answer with a `Content-Disposition: attachment` header.

## Not connected yet (mocked or omitted)

- Submit review only closes the dialog; the API has no endpoint for submitting a review or a team note.
- Not built: bulk move/delete (endpoints exist, no design), creating projects, media search, video playback, camera/lens metadata.
- Comments are posted with the role "Client" (`DEFAULT_AUTHOR_ROLE`).