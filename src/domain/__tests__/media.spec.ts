import { describe, expect, it } from 'vite-plus/test'
import type { ProjectDetail } from '@/api/projects'
import {
  canDownload,
  canReview,
  cssAspectRatio,
  detailRows,
  formatDuration,
  formatProjectLine,
  mediaStatusTone,
  nextStatus,
  reviewCounts,
  toggleId,
} from '../media'

const approval = (o: Partial<Record<string, number>> = {}) => ({
  total: 0,
  plan: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  release: 0,
  archive: 0,
  ...o,
})
const bd = (count: number, o: Partial<Record<string, number>> = {}) => ({
  count,
  storageBytes: 0,
  humanReadableStorage: '0 Bytes',
  approval: approval(o),
})
const summary: ProjectDetail['mediaSummary'] = {
  totals: { count: 5, storageBytes: 0, humanReadableStorage: '0 Bytes' },
  breakdown: {
    photo: bd(3, { pending: 2, approved: 1 }),
    video: bd(2, { pending: 1, release: 1 }),
    audio: bd(0),
  },
}

describe('media domain', () => {
  it('sums review counts across types', () => {
    expect(reviewCounts(summary)).toEqual({ pending: 3, approved: 1, rejected: 0, release: 1 })
  })
  it('formats the project line', () => {
    expect(formatProjectLine(summary)).toBe('3 photos · 2 videos · 3 awaiting your review')
  })
  it('converts aspect ratios', () => {
    expect(cssAspectRatio('16:9')).toBe('16 / 9')
    expect(cssAspectRatio(undefined)).toBe('3 / 4')
    expect(cssAspectRatio('bad')).toBe('3 / 4')
  })
  it('toggles review decisions', () => {
    expect(nextStatus('pending', 'approved')).toBe('approved')
    expect(nextStatus('approved', 'approved')).toBe('pending')
    expect(nextStatus('approved', 'rejected')).toBe('rejected')
  })
  it('gates download and review by status', () => {
    expect(canDownload('release')).toBe(true)
    expect(canDownload('approved')).toBe(false)
    expect(canReview('release')).toBe(false)
    expect(canReview('rejected')).toBe(true)
  })
  it('maps tones', () => {
    expect(mediaStatusTone('rejected')).toBe('danger')
    expect(mediaStatusTone('approved')).toBe('success')
    expect(mediaStatusTone('release')).toBe('info')
  })
})

describe('toggleId', () => {
  it('adds an id that is not selected', () => {
    expect(toggleId(['a'], 'b')).toEqual(['a', 'b'])
  })

  it('removes an id that is already selected', () => {
    expect(toggleId(['a', 'b'], 'a')).toEqual(['b'])
  })
})
describe('formatDuration', () => {
  it('formats seconds and ignores unknown values', () => {
    expect(formatDuration(69)).toBe('1:09')
    expect(formatDuration(3723)).toBe('1:02:03')
    expect(formatDuration(null)).toBe('')
    expect(formatDuration(0)).toBe('')
  })
})

describe('detailRows', () => {
  const base = {
    id: 'm1',
    url: 'u',
    filename: 'IMG_1.jpg',
    status: 'pending' as const,
    type: 'photo' as const,
    metadata: { resolution: '1080p' },
  }
  const label = (rows: { label: string }[]) => rows.map((r) => r.label)

  it('lists only the facts the list item has', () => {
    expect(label(detailRows(base, () => ''))).toEqual(['Type', 'Format', 'Resolution'])
  })

  it('adds file facts and EXIF from the detail response', () => {
    const rows = detailRows(
      {
        ...base,
        sizeBytes: 5242880,
        createdAt: '2026-11-14T00:00:00Z',
        uploadedBy: 'Maya',
        version: 2,
        exif: { camera: 'Sony A7 IV', iso: 200, location: 'Studio' },
      },
      () => '2h ago',
    )
    expect(rows).toContainEqual({ label: 'Size', value: '5.0 MB' })
    expect(rows).toContainEqual({ label: 'Created At', value: '2h ago' })
    expect(rows).toContainEqual({ label: 'Person', value: 'Maya' })
    expect(rows).toContainEqual({ label: 'Version', value: 'v2' })
    expect(rows).toContainEqual({ label: 'Camera', value: 'Sony A7 IV' })
    expect(rows).toContainEqual({ label: 'ISO', value: '200' })
  })

  it('shows no EXIF rows when exif is null', () => {
    expect(label(detailRows({ ...base, exif: null }, () => ''))).not.toContain('Camera')
  })
})