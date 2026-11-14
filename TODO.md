# TODO

Design source: Figma "Modest Human Brands" > "Desktop - MDrive" (sections: Setup (connect, then move your media), Browse, Upload, Review, Release). Last compared with the code on 2026-11-14; backend sync (review, media detail, file facts) and the dev proxy port fix added after that.

## Done

- [x] Vue 3 + Vite-Plus single-page application setup
- [x] Browser credential access screen (`/access`) with localStorage persistence
- [x] Projects catalog grid with status filtering (`/projects`)
- [x] Project media browser with review status tabs and counts (`/projects/:projectId`)
- [x] Full-screen media viewer modal with zoom and filmstrip navigation
- [x] Pinned spatial review comments on images, with threaded replies
- [x] Direct-to-storage batch file uploader dialog (progress, retry, cancel)
- [x] Asset approval and rejection action triggers
- [x] Presigned asset download handler (released files only)
- [x] Submit review dialog, sends the note to `POST /api/projects/:id/review`; Submit is disabled while files are still in review (the API answers 409)
- [x] Lucide icons in the viewer toolbar, tiles, back link and upload dialog (replaces text glyphs)
- [x] Upload dialog polish: dropzone icon, per-file icon, "4 GB each" hint, Continue when finished
- [x] Reject dialog: a reason is required; it is posted as a comment, then the status becomes rejected (undoing a rejection skips the dialog)
- [x] Multi-select on released tiles with the bottom bar (N selected, Clear, Download N files); no zip yet, so each file downloads separately

## Cross-repo sync (see `docs/integration-audit.md`)

- [ ] Upload pipeline between code-drive and code-media does not complete today (missing `x-api-key` on both directions, file-name and `mediaId` mismatch, photo dimensions, media URL pointing at code-media). Needs fixes in the other two repos (plans, not applied: `docs/patch-plan-mdrive.md`, `docs/patch-plan-mmedia.md`, including GPU-with-CPU-fallback in MMedia and Docker verification); this app needs no change

## Design vs code gaps: frontend only (existing API is enough)

- [ ] Header search field (centered; "Search projects" / "Search media") with client-side filtering
- [ ] Media toolbar: Search and Filter controls next to the sort toggle (filter by type and status on loaded items)
- [ ] Floating upload progress card after the dialog is dismissed ("Uploading 3 files, 1.2 GB of 1.4 GB, 2 of 3 files, 1 min left")
- [ ] Upload dialog: start uploading as soon as files are added (design shows progress immediately and a single Continue button; the code still has a manual Upload step)
- [ ] Pin popovers on the stage: hover bubble (name, time, text), inline "Add a comment" composer at the pin, comment popover with Reply, resolve and close
- [ ] Activity timeline entries show the version ("on v2") and relative time; reply composer anchored at the bottom of the panel
- [ ] Project header subtitle shows "N projects, M awaiting your review" once the API provides the awaiting count (see below)
- [ ] Release request banner and tile chips (Awaiting, Held back, Released) once the API provides those states (see below)

## Needs API changes in code-drive first

- [x] Submit review endpoint `POST /api/projects/:id/review` (409 while pending; stores note and time in Notion "Review Note" and "Reviewed At") and dialog connected. Not yet run against real Notion
- [ ] Release flow: request release, team "Review release" dialog with per-file hold back, approve release, undo release; media states Awaiting and Held back; team vs client role on the access details
- [x] Media metadata API: `GET /api/media/:id` returns size, createdAt, uploader, EXIF (null until the media processor sends them to the upload webhook as `metadata.sizeBytes`, `durationSec`, `uploadedBy`, `exif`). Frontend: the viewer panel loads it and lists size, created, uploader, version and EXIF rows when present
- [x] Tile footer data API: list items carry `createdAt`, `version`, `sizeBytes`, `durationSec`, `uploadedBy`. Frontend: the tile footer shows uploader, video duration, version and resolution
- [ ] Versions: history, compare view, "Upload new version" dialog with a change note, filmstrip "+" button
- [ ] Video review: in-browser player with a timecoded scrub bar; comments need a `timecode` field
- [ ] Media search and filter query params on `GET /api/projects/:projectId/media`
- [ ] Create project: "New project" button, dialog and endpoint
- [ ] Bulk media selection for move and delete (endpoints exist, no design)
- [ ] Zip download with preparing and ready states ("Save zip"); the API only returns one presigned URL per file today
- [ ] Project list: per-project awaiting-review count for the subtitle

## Larger features designed but not started

- [x] First-run setup (Connect, Storage, Done) with the `onboarded` flag, like MConnect; `/access` kept for reconnecting
- [x] Storage migration wizard UI, mocked (`src/api/migration.ts`): source and destination, what to move, review, moving progress, done. Figma frames renamed into "Setup" order
- [ ] Migration wizard, real: needs a migration API (see `docs/api-contract-proposals.md`); destination check and integrity check, Verified and Failed counts, Pause, "Run in background"
- [ ] Migration review steps: "Three things need you" screen, duplicates review (Compare, Duplicate Photo and Video), assign project for unassigned files, file names preview, "View migration log"
- [ ] Setup design polish: the Storage frames use a three-tab header and the Access frame has no "Step 1 of 3" label, while the code uses one shared step shell; align the frames and the shell
- [ ] Storage landing screen (Figma "Setup 2 of 3 · Storage"): list connected storages, Add storage, reachable after setup (today migration is only reachable during first-run setup)