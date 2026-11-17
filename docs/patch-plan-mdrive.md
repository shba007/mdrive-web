# Patch plan: MDrive backend (code-drive)

Status: **PLAN ONLY, nothing applied.** Follows `docs/integration-audit.md` and the decision that MDrive owns file names. Companion: `docs/patch-plan-mmedia.md`. Patches D1 to D3 are required for an upload to complete; D4 to D6 are quality, packaging and verification.

## Contract with MMedia

| Item                              | Value                                                                                                                                                |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Upload key (MDrive signs the PUT) | `upload/<orgSlug>/<projectKey>/<name>.<ext>`                                                                                                         |
| `<name>`                          | `<kind>-<org:4>-<project:4>-<media:4>-<version:3>`, set here (`server/api/media/uploads/index.post.ts`), never changed by MMedia                     |
| Processed key (MMedia writes)     | `processed/<orgSlug>/<projectKey>/<name>.<ext>`; downloads and thumbnails already read `processed/<org>/<project>/<Slug>.<ext>`                      |
| Callback in                       | `PUT /webhook/uploads/status`, header `x-api-key`, body `{ filename, projectId, status, progressPercent, mediaId: null, error, data: { metadata } }` |
| Calls out                         | `POST {MMEDIA}/media/transform` with header `x-api-key`                                                                                              |
| `metadata`                        | `{ kind, format: { width, height, size, duration?, aspectRatio, resolution }, exif?: { camera, lens, shutter, iso, colorProfile, location } }`       |

New env vars (`.env.example`, README, `nitro.config.ts` `runtimeConfig.private`):

- `NITRO_MDRIVE_PRIVATE_MMEDIA_URL` -> `mmediaUrl`
- `NITRO_MDRIVE_PRIVATE_MMEDIA_API_KEY` -> `mmediaApiKey` (MMedia's `MOTIA_MMEDIA_API_KEY`)
- optional `NOTION_API_BASE_URL` (used only for the Docker test stub, default is Notion's)

## D1: webhook finds the batch by filename and never trusts `mediaId` (audit items 3 and 4)

`server/routes/webhook/uploads/status.put.ts`, `server/api/media/uploads/index.post.ts`.

- Body schema: `batchId`, `uploadId`, `mediaId` optional; `mediaId` is ignored.
- In `uploads/index.post.ts` also store a reverse index `data:upload-file` key `<filename>` -> `{ batchId, uploadId }` when the batch is created. The webhook uses it when `batchId` is absent (no scan of all batches).
- Notion page: look up the media page by Project relation plus `Index` and `Version Index` (from the `data:resource:media` cache, then a Notion query as fallback). Update it if found; create it if not. Never pass MMedia's value as `page_id`. Save the real Notion page id into `uploads[].mediaId`, so the web keeps receiving a page id.
- 400 if any of the four indexes parsed from the name is `NaN`; 404 if the filename is unknown to the reverse index and `batchId` is absent.
- Make replays safe: the same callback twice updates the same page and does not create a second one.

## D2: authenticated calls to MMedia (audit item 2)

- Add the two private config values to `nitro.config.ts`.
- `server/routes/media/[kind]/[...rest].ts`: the three `$fetch('/media/transform')` calls (near lines 247, 409 and 468) move into `server/utils/mmedia-transform.ts`, which sets `baseURL: mmediaUrl` and `headers: { 'x-api-key': mmediaApiKey }` and throws a clear 502 when MMedia answers 401 or is unreachable. If either value is unset, answer 500 "MMedia is not configured".

## D3: public media URL points at MDrive (audit item 6)

- `NITRO_MDRIVE_PUBLIC_MEDIA_URL` must be the origin that serves `/media/:kind/**`: MDrive itself or the CDN in front of it. `.env.example` and `.env` default to `http://localhost:3004`; MMedia only appears as `mmediaUrl` (D2).
- Prefer returning relative `/media/image/...` from `media.get.ts` and `[mediaId].get.ts` so the web container's `/media` proxy handles it and no CORS is needed. `item.url` is used as is by the web app, so no web change.

## D4: photo metadata fallback and EXIF mapping

In `status.put.ts`: if `format.width/height` are missing, derive the ratio from `format.aspectRatio` and skip Resolution instead of defaulting to 16:9 and 4320p. Read the new `exif` object from MMedia first, then fall back to the old flat fields.

## D5: read-only storage and the transform hand-off (decisions, then patches)

Two open items from the audit; both change where code lives, so they need your decision before any patch:

- **Read-only bucket.** Today MDrive signs presigned PUT URLs and writes the CDN cache bucket (`r2PutFileStream(r2Cdn, ...)`). A read-only token would break uploads. Option A: MDrive keeps a write-capable token (simplest). Option B: MMedia issues the presigned PUT URLs and MDrive only reads (cleaner permissions, one more endpoint and call).
- **Transform output.** MMedia returns a local `streamPath` and MDrive reads that path from disk, which works only with a shared volume. Option A: shared volume in compose (simplest). Option B: MMedia writes the result to the CDN bucket and returns the key, MDrive streams it from R2.

## D6: packaging and tidy

- `Dockerfile`: `EXPOSE 3000` but the app runs on `PORT` 3004; set `ENV PORT=3004` and `EXPOSE 3004`; the `ARG SITE_URL` used for `NITRO_PUBLIC_SITE_URL` is never declared; add a `HEALTHCHECK` on `/api/health`.
- README: the env table uses `NITRO_PRIVATE_*` names, the code reads `NITRO_MDRIVE_PRIVATE_*`; fix and add the new variables.
- Remove `temp/motia` and `temp/nitro`; finish or drop the `sync:resource` task.

## D7: Docker verification of MDrive and the full chain

MDrive is CPU only (no GPU use). Docker 29.9 is running on this machine. All tests use local stand-ins, not real R2 or Notion: MinIO for the buckets, and a Notion stub (a small HTTP server answering the few Notion calls used: `pages.create`, `pages.update`, database/data source query), reached through `NOTION_API_BASE_URL`.

Compose file for the whole chain, kept outside both repos in `code-drive-web/e2e/docker-compose.yml` (build contexts `../../code-drive` and `../../code-media`), with `docker-compose.gpu.yml` as the NVIDIA override from the MMedia plan: services `minio`, `notion-stub`, `mdrive`, `mmedia`, `web` (this repo's nginx image), and a `tests` runner.

| #   | Case                | How                                                                                                             | Pass when                                                                                                                                                                          |
| --- | ------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Image starts        | `docker build` then run with env                                                                                | `GET /api/health` 200 on 3004                                                                                                                                                      |
| 2   | Auth                | call `/api/projects` without, wrong and right `x-api-key`; `/webhook/uploads/status` the same                   | 401, 403, 200                                                                                                                                                                      |
| 3   | Upload init         | `POST /api/media/uploads` with `x-org-id`                                                                       | presigned URLs for `upload/<org>/<project>/<name>.<ext>`; `GET /api/media/uploads/:batchId` is `pending`                                                                           |
| 4   | Webhook by filename | PUT callbacks without `batchId`                                                                                 | batch row moves to `processing` then `completed` with a Notion page id; exactly one page created; replay creates none                                                              |
| 5   | Bad input           | filename with non-numeric indexes; unknown filename                                                             | 400 and 404, nothing written to Notion                                                                                                                                             |
| 6   | MMedia auth         | thumbnail request with a cold cache                                                                             | MMedia receives the `x-api-key`; with a wrong key MDrive answers 502 with a clear message                                                                                          |
| 7   | Media URL           | `GET /api/projects/:id/media`                                                                                   | `url` is served by MDrive (or relative), not by the MMedia port; the URL returns an image                                                                                          |
| 8   | Full chain, CPU     | web (browser or Playwright) uploads a JPEG and an MP4 through nginx -> MDrive -> MinIO -> MMedia (no GPU flags) | both rows reach Done; Notion stub holds two pages with correct Type, Aspect ratio, Resolution; `processed/...` objects exist; tiles load thumbnails; Release-status file downloads |
| 9   | Full chain, GPU     | same with the GPU override                                                                                      | same results; MMedia log shows an `*_nvenc` encoder for the MP4; MDrive and web unchanged                                                                                          |
| 10  | Failure             | stop MMedia mid-upload                                                                                          | batch ends `failed` or stays `processing` with a visible error in the web, retry creates no duplicate page                                                                         |
| 11  | Web container       | `curl` through the web nginx for `/api/...` and `/media/...`                                                    | proxied to MDrive with the key from the browser, SPA fallback works                                                                                                                |

Record image sizes and the results table in the PR notes; keep the compose file so the same run works in CI (the GPU case is skipped where no GPU is present).

## Order of work

1. D1, D2, D3 together with MMedia M1, M2 (one integration branch each).
2. Run the Docker chain (cases 1 to 8) on CPU.
3. MMedia M4, M5 (GPU, Docker image), then case 9.
4. D4 to D6 and M3, M6; decide D5 first.