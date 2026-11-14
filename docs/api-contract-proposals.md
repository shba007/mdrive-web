# code-drive API contract proposals

Status: **PROPOSAL, nothing implemented.** Each item needs approval before any backend code is written. Ordered by 80/20: the first cycles unblock the most UI per endpoint.

Conventions (same as the existing API): every request carries `x-api-key` and `x-org-id` (org slug); project and media ids are Notion page UUIDs; media status is one of `plan | pending | approved | rejected | release | archive`; errors use the standard `{ statusCode, message }` body (400 invalid input, 404 unknown id).

## Cycle 1: Submit review (unblocks the Submit review dialog)

`POST /api/projects/:projectId/review`

```json
// request
{ "note": "Great set, two to redo", "decisions": { "<mediaId>": "approved" } }
// response 200
{ "projectId": "<uuid>", "summary": { "pending": 4, "rejected": 2 }, "submittedAt": "2026-11-14T10:00:00Z" }
```

- `decisions` optional: when absent the server uses the current statuses (the UI already applies approve/reject per file).
- Side effect: stores `note` and `submittedAt` on the project so the team can see it.
- Open question: should submitting be blocked while `pending > 0`? (Proposed: allowed, the dialog already warns.)

## Cycle 2: Tile footer and viewer metadata (read-only, additive fields)

Extend items returned by `GET /api/projects/:projectId/media` and add one detail endpoint.

```json
// added to each media item
{
  "uploadedBy": "Ana",
  "durationSec": 42,
  "version": 2,
  "createdAt": "2026-11-10T08:00:00Z",
  "sizeBytes": 5242880
}
```

`GET /api/media/:mediaId` returns the item plus the EXIF block:

```json
{
  "...item": "",
  "exif": {
    "camera": "Canon R5",
    "lens": "RF 24-70",
    "shutter": "1/250",
    "iso": 400,
    "colorProfile": "sRGB",
    "location": "Mumbai"
  }
}
```

- `exif` is `null` for video or when unreadable. Source: parsed once at upload completion and cached in Notion/unstorage (not on every request).
- Open question: which Notion columns hold these, or do we store EXIF as a JSON text property?

## Cycle 3: Search and filter

`GET /api/projects/:projectId/media?q=beach&type=photo|video|audio&status=pending&sort=newest|oldest`

- All params optional, combinable; `status` accepts a comma list. Unknown values give 400.
- Also `GET /api/projects?q=` for the header search.
- Note: the frontend can filter loaded items client-side now, so this only matters once lists are paginated.

## Cycle 4: Project list awaiting count and create project

- `GET /api/projects`: add `awaitingReview` (count of media with status `pending`) per project, and top-level `totals: { projects, awaitingReview }` for the subtitle.
- `POST /api/projects` body `{ "name": "Spring shoot", "date": "2026-11-20", "location": "Pune" }` returns 201 with the project summary. Open question: which fields does the New project dialog need?

## Cycle 5: Release flow (needs a role concept first)

Access details (`GET /api/access` or the existing check) gains `"role": "client" | "team"`.

| Route                                           | Who    | Purpose                                                                                  |
| ----------------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| `POST /api/projects/:projectId/release-request` | client | body `{ "mediaIds": [...] }`; approved files become `awaiting`                           |
| `GET /api/projects/:projectId/release-request`  | both   | current request, per-file state                                                          |
| `POST /api/projects/:projectId/release`         | team   | body `{ "holdBack": ["<mediaId>"] }`; the rest become `release`, held ones become `held` |
| `DELETE /api/projects/:projectId/release`       | team   | undo release (back to `approved`)                                                        |

- New media states: `awaiting`, `held`. This changes the status vocabulary and the Notion select options, so it needs your explicit sign-off.
- Open question: how is `team` vs `client` decided (a second API key, or a field on the org)?

## Cycle 6: Video timecodes

- Comments gain optional `timecodeSec` (number). Pin coordinates (`x`, `y`) stay for images; video comments use `timecodeSec`.
- No new routes. Playback uses the existing presigned media URL.

## Cycle 7: Versions

- `GET /api/media/:mediaId/versions` returns `[{ "version": 2, "uploadedAt": "...", "uploadedBy": "Ana", "note": "Fixed crop", "url": "<presigned>" }]`.
- `POST /api/media/:mediaId/versions/upload` (presigned upload, body `{ filename, size, note }`) creates a new version; the media keeps its id.
- Compare view needs no extra route (it uses two version URLs).
- Open question: how are versions modeled in Notion (sub-items or a separate database)?

## Cycle 8: Bulk and zip

- Bulk move and delete already exist. Frontend only needs UI (no contract change).
- `POST /api/media/downloads/zip` body `{ "mediaIds": [...] }` returns 202 `{ "jobId": "<id>" }`; `GET /api/media/downloads/zip/:jobId` returns `{ "state": "preparing|ready", "url": "<presigned>" }`. Open question: where is the zip built (a worker or an R2 multipart stream)? This is the biggest backend item and likely not worth it until clients ask.

## Not proposed yet

Storage migration wizard: needs its own design pass (providers, integrity checks, duplicates). Suggest a separate scoping session.

## Decisions needed from you

1. Cycle order and which to start first (recommended: 1, then 2, then 4).
2. Role model for release (cycle 5).
3. Where EXIF and version data live in Notion (cycles 2 and 7).
4. Zip: build now, or keep per-file downloads (cycle 8).