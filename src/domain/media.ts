import type {
  ApprovalCounts,
  MediaDetail,
  MediaItem,
  MediaStatus,
  ProjectDetail,
} from '@/api/projects'
import { formatBytes } from '@/domain/upload'

/** Review tabs from the design, mapped to API statuses. */
export const REVIEW_TABS = [
  { label: 'Review', status: 'pending' },
  { label: 'Approved', status: 'approved' },
  { label: 'Not Approved', status: 'rejected' },
  { label: 'Release', status: 'release' },
] as const satisfies readonly { label: string; status: MediaStatus }[]

export type ReviewStatus = (typeof REVIEW_TABS)[number]['status']

const STATUS_LABEL: Record<MediaStatus, string> = {
  plan: 'Plan',
  pending: 'Review',
  approved: 'Approved',
  rejected: 'Not Approved',
  release: 'Release',
  archive: 'Archive',
}

export function mediaStatusLabel(status: MediaStatus): string {
  return STATUS_LABEL[status] ?? status
}

export type MediaTone = 'info' | 'success' | 'danger' | 'neutral'

export function mediaStatusTone(status: MediaStatus): MediaTone {
  switch (status) {
    case 'pending':
    case 'release':
      return 'info'
    case 'approved':
      return 'success'
    case 'rejected':
      return 'danger'
    default:
      return 'neutral'
  }
}

function sumApproval(summary: ProjectDetail['mediaSummary'], key: keyof ApprovalCounts): number {
  return Object.values(summary.breakdown).reduce((n, b) => n + b.approval[key], 0)
}

/** Count per review tab, summed over photo/video/audio. */
export function reviewCounts(summary: ProjectDetail['mediaSummary']): Record<ReviewStatus, number> {
  return {
    pending: sumApproval(summary, 'pending'),
    approved: sumApproval(summary, 'approved'),
    rejected: sumApproval(summary, 'rejected'),
    release: sumApproval(summary, 'release'),
  }
}

/** "82 photos · 20 videos · 3 awaiting your review" */
export function formatProjectLine(summary: ProjectDetail['mediaSummary']): string {
  const { photo, video } = summary.breakdown
  const parts: string[] = []
  if (photo.count) parts.push(`${photo.count} ${photo.count === 1 ? 'photo' : 'photos'}`)
  if (video.count) parts.push(`${video.count} ${video.count === 1 ? 'video' : 'videos'}`)
  const awaiting = sumApproval(summary, 'pending')
  if (awaiting) parts.push(`${awaiting} awaiting your review`)
  return parts.join(' · ') || 'No media yet'
}

/**
 * Status after the reviewer presses approve or reject. Pressing the same
 * decision again undoes it (back to pending).
 */
export function nextStatus(
  current: MediaStatus,
  decision: 'approved' | 'rejected',
): 'approved' | 'rejected' | 'pending' {
  return current === decision ? 'pending' : decision
}

/** Only released media can be downloaded. */
export function canDownload(status: MediaStatus): boolean {
  return status === 'release'
}

/** Only these statuses are part of the client's review. */
export function canReview(status: MediaStatus): boolean {
  return status === 'pending' || status === 'approved' || status === 'rejected'
}

export interface ReviewTotals {
  approved: number
  rejected: number
  pending: number
}

export function reviewTotals(summary: ProjectDetail['mediaSummary']): ReviewTotals {
  const counts = reviewCounts(summary)
  return { approved: counts.approved, rejected: counts.rejected, pending: counts.pending }
}

/** Adds the id when absent, removes it when present. */
export function toggleId(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]
}

/** "3 files · go to release" style label. */
export function fileCount(n: number): string {
  return `${n} ${n === 1 ? 'file' : 'files'}`
}

/** Seconds as "1:09" or "1:02:03"; empty when unknown. */
export function formatDuration(totalSeconds?: number | null): string {
  if (!totalSeconds || totalSeconds <= 0 || !Number.isFinite(totalSeconds)) return ''
  const s = Math.round(totalSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

export interface DetailRow {
  label: string
  value: string
}

/**
 * Rows for the viewer panel. Only values the API actually has are listed,
 * so missing EXIF (null until the media processor sends it) simply shows nothing.
 */
export function detailRows(
  item: MediaDetail | MediaItem,
  relativeTime: (iso: string) => string,
): DetailRow[] {
  const exif = 'exif' in item ? item.exif : null
  const ext = item.filename.split('.').pop()?.toUpperCase()
  const rows: (DetailRow | null)[] = [
    { label: 'Type', value: item.type.charAt(0).toUpperCase() + item.type.slice(1) },
    ext ? { label: 'Format', value: ext } : null,
    item.metadata.resolution ? { label: 'Resolution', value: item.metadata.resolution } : null,
    item.metadata.aspectRatio ? { label: 'Aspect ratio', value: item.metadata.aspectRatio } : null,
    item.sizeBytes ? { label: 'Size', value: formatBytes(item.sizeBytes) } : null,
    item.durationSec ? { label: 'Duration', value: formatDuration(item.durationSec) } : null,
    item.createdAt ? { label: 'Created At', value: relativeTime(item.createdAt) } : null,
    item.uploadedBy ? { label: 'Person', value: item.uploadedBy } : null,
    item.version && item.version > 1 ? { label: 'Version', value: `v${item.version}` } : null,
    exif?.location ? { label: 'Location', value: exif.location } : null,
    exif?.camera ? { label: 'Camera', value: exif.camera } : null,
    exif?.lens ? { label: 'Lens', value: exif.lens } : null,
    exif?.shutter ? { label: 'Shutter', value: exif.shutter } : null,
    exif?.iso ? { label: 'ISO', value: String(exif.iso) } : null,
    exif?.colorProfile ? { label: 'Color Profile', value: exif.colorProfile } : null,
  ]
  return rows.filter((row): row is DetailRow => row !== null)
}

/** "3:4" -> "3 / 4"; falls back to portrait 3 / 4. */
export function cssAspectRatio(ratio?: string): string {
  const match = /^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/.exec(ratio ?? '')
  return match ? `${match[1]} / ${match[2]}` : '3 / 4'
}