# Patch plan: MMedia (code-media)

Status: **PLAN ONLY, nothing applied.** Follows `docs/integration-audit.md` and the decision that MDrive owns file names. Companion: `docs/patch-plan-mdrive.md` (shared contract is repeated below so each doc stands alone). Patches M1 to M3 are required for an upload to complete; M4 to M7 are quality, GPU and Docker.

## Contract with MDrive

| Item                              | Value                                                                                                                                                                                                                |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Upload key (MDrive signs the PUT) | `upload/<orgSlug>/<projectKey>/<name>.<ext>`                                                                                                                                                                         |
| `<name>`                          | `<kind>-<org:4>-<project:4>-<media:4>-<version:3>`, set by MDrive, never changed by MMedia                                                                                                                           |
| Processed key (MMedia writes)     | `processed/<orgSlug>/<projectKey>/<name>.<ext>`                                                                                                                                                                      |
| Callback                          | `PUT {MDRIVE}/webhook/uploads/status`, header `x-api-key: <MDrive key>`, body `{ filename, projectId, status, progressPercent, mediaId: null, error, data: { metadata } }` (`batchId` and `uploadId` no longer sent) |
| Inbound from MDrive               | `POST /media/transform` with header `x-api-key: <MMedia key>` (already enforced here)                                                                                                                                |
| `metadata`                        | `{ kind, format: { width, height, size, duration?, aspectRatio, resolution }, exif?: { camera, lens, shutter, iso, colorProfile, location } }`                                                                       |

New env var: `MOTIA_MMEDIA_DRIVE_API_KEY` (MDrive's `NITRO_MDRIVE_PRIVATE_SERVER_VALIDATION_KEY`). Add to `.env.example`, `.env.prod` template and README.

## M1: keep MDrive's name and send the key (audit items 1 and 3)

- `src/hook/media/uploads.step.ts`: keep parsing `[, orgId, projectId, filenameWithExt]`; set `filename = filenameWithExt` (drop the `batchId`/`uploadId` and suffix stripping). Queue payload: `bucket`, `sourceKey`, `orgId`, `projectId`, `filename`.
- `src/job/media/media-process.step.ts`: delete the numbering block (`r2GetAllFiles` scan, `patternRegex`, `nextMediaId`, `nextVariantId`, `newMediaId`, `getMediaKind`). `destinationKey = processed/${orgId}/${projectId}/${filename}`.
- New `src/utils/notify-drive.ts`: one helper that PUTs the callback with `x-api-key`, `mediaId: null`, a 10 s timeout and 2 retries. All three call sites (initial, 60%, 100%, failure) use it. If `MOTIA_MMEDIA_DRIVE_API_KEY` is unset, log an error and fail the job.
- Move `r2DriveStorage.del(sourceKey)` to after the 100% callback succeeds, so a failed callback does not leave a processed file with no record.
- Make the job idempotent: if `processed/.../<name>` already exists, skip the copy and only resend the callbacks (queue retries, duplicate R2 events).

Check: upload one file; MMedia log shows authorised callbacks and `processed/.../photo-0003-0008-0001-001.jpg` exists.

## M2: metadata drive can use (audit item 5)

`src/utils/get-media-metadata.ts`:

- Add `width` and `height` to `format` for photos and videos (already local: `meta.width/height`, `videoStream.width/height`).
- `resolution` uses the short side: `${Math.min(width, height)}p` (today it is `${width}p`).
- Return `exif { camera, lens, shutter, iso, colorProfile, location }` for photos from the `exifr` result already parsed; keep the flat fields for one release.
- Keep `size` and `duration`; MDrive reads both.

## M3: R2 event scope (audit "R2 event rule")

Config, not code: limit the bucket event notification to prefix `upload/` and object-create only; record this in the README. As a code guard, `uploads.step.ts` ignores keys whose first segment is not `upload` (answers 202 with `ignored: true`). This stops `processed/` writes re-triggering the webhook.

## M4: GPU when available, CPU otherwise

Today `src/utils/transcode-video.ts` already probes `h264/hevc/av1_nvenc` and `_qsv` with a one-frame test and falls back to `libx264`, `libx265`, `libsvtav1`, `libvpx-vp9`, and adds `-hwaccel auto` if any hardware encoder works. Gaps:

1. **The probe runs on every call** (up to six ffmpeg launches per transform). Cache the result once per process (module-level promise) and re-probe only on a hardware error.
2. **No runtime fallback.** If a hardware encode fails mid-run (session limit, out of memory), the job fails. Wrap the encode: on a non-zero ffmpeg exit with a hardware encoder selected, log it, mark that encoder bad for the process, and rerun with the software encoder.
3. **No control or visibility.** Add `MOTIA_MMEDIA_HW_ACCEL=auto|off|nvenc|qsv` (default `auto`) and log one line at startup and per job: `encoders: nvenc=[h264,hevc,av1] qsv=[] chosen=hevc_nvenc`. Add the detected encoders to `GET /health`.
4. **`-hwaccel auto` for decode** can fail on formats the GPU cannot decode; the fallback in point 2 covers it, and add `-hwaccel_output_format` only when filters support it (otherwise keep frames on the CPU).
5. **Images stay on the CPU.** Image transforms use Sharp/IPX and there is no useful GPU path; the plan only covers FFmpeg video work (DASH transcode, thumbnails from video).
6. **NVENC availability varies by codec and card** (for example AV1 needs an Ada or newer GPU). The per-codec probe already handles this; keep a per-codec fallback, not an all-or-nothing switch.

## M5: Docker image that can transcode (new finding)

The current `Dockerfile` runner is `oven/bun:1-alpine` and installs no `ffmpeg` or `ffprobe`, so metadata extraction and every video transform fail inside the container. It is also musl, which cannot load NVIDIA's encoder libraries.

- Runner stage: use a glibc base (`oven/bun:1-debian`, or `debian:bookworm-slim` plus Bun) and install a real FFmpeg build with NVENC and QSV support. Options: Debian's `ffmpeg` package (QSV via `intel-media-va-driver`, NVENC loads `libnvidia-encode` from the host), or copy a static build (for example BtbN/ jellyfin-ffmpeg) with `--enable-nvenc --enable-libsvtav1 --enable-libx265 --enable-libvpx`. Pick one and pin the version.
- GPU is provided by the host, not baked in: run with the NVIDIA Container Toolkit (`--gpus all`, env `NVIDIA_DRIVER_CAPABILITIES=compute,video,utility`); for Intel QSV pass `--device /dev/dri`. The image must still start and transcode with neither (CPU).
- Keep `iii` install, ports 3111, 3112, 49134, and the `CMD`.
- Add a `HEALTHCHECK` calling `GET /health`.
- Add `docker-compose.gpu.yml` (override) with `deploy.resources.reservations.devices` for NVIDIA, so the base compose file stays CPU only.

## M6: tidy

- Delete `src/job/media/notion-sync.step.ts` (orphaned, no imports, nothing enqueues its topic; MDrive is the only Notion writer).
- `.env.example`: `PORT` to 3111 (matches `iii-config.yaml` and MDrive), add the new env vars.
- README: bump the example version, document the event-rule scope and GPU variables.

## M7: Docker verification of MMedia (run before declaring done)

Environment on this machine: Docker 29.9 is running with the `nvidia` runtime registered, and `nvidia-smi` reports an RTX 5060 Ti, so the GPU path can be tested for real. If a runner has no GPU the GPU cases are skipped, not failed.

Local stand-ins (no real R2 or Notion): MinIO as the S3/R2 endpoint with buckets `development-media-origin` and `development-media-transform`; a tiny stub HTTP server playing MDrive that records every `PUT /webhook/uploads/status` (and checks the `x-api-key`). Sample inputs: one JPEG with EXIF, one short H.264 MP4 (ffmpeg `testsrc`, 5 s), one WAV.

| #   | Case                    | How                                                                                                                            | Pass when                                                                                                                                                                                            |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Image builds and starts | `docker build` then `docker run` (no GPU flags)                                                                                | `GET /health` 200; `ffmpeg -version` and `ffprobe -version` work inside                                                                                                                              |
| 2   | CPU fallback            | run without `--gpus`; transform the MP4                                                                                        | log shows `chosen=libx264` (or the software encoder per codec), DASH output created, job succeeds                                                                                                    |
| 3   | GPU path                | run with `--gpus all`; transform the same MP4                                                                                  | log shows an `*_nvenc` encoder chosen, output plays, job succeeds; `nvidia-smi` shows an encode session during the run                                                                               |
| 4   | Forced off              | `MOTIA_MMEDIA_HW_ACCEL=off` with `--gpus all`                                                                                  | software encoder chosen even though a GPU is present                                                                                                                                                 |
| 5   | Runtime fallback        | with `--gpus all`, make the hardware encoder fail (for example env `MOTIA_MMEDIA_TEST_FAIL_HW=1` test hook, or limit sessions) | first attempt logs a hardware error, second attempt succeeds on CPU, one callback `completed`                                                                                                        |
| 6   | Upload pipeline         | PUT a file to `upload/<org>/<proj>/<name>.jpg` in MinIO, POST the event to `/webhook/media/uploads` with the key               | stub receives `processing` 20, 60, `completed` 100 with `x-api-key`, `filename == <name>.jpg`, `mediaId: null`, `format.width/height` set; `processed/.../<name>.jpg` exists, `upload/` copy removed |
| 7   | Metadata shape          | `GET /media/:id/metadata` and the callback body                                                                                | width, height, `resolution` from the short side, `exif` present for the JPEG                                                                                                                         |
| 8   | Auth                    | call `/media/transform` and the webhook without or with a wrong key                                                            | 401                                                                                                                                                                                                  |
| 9   | Loop guard              | send an event for a `processed/...` key                                                                                        | 202 `ignored`, no callback                                                                                                                                                                           |
| 10  | Idempotency             | send the same upload event twice                                                                                               | one processed file, callbacks resent, no error                                                                                                                                                       |

Record the encoder chosen, wall-clock time of CPU vs GPU for case 2 vs 3, and the image size in the PR notes.