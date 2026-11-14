import { describe, expect, it } from 'vite-plus/test'
import type { ProjectDetail } from '@/api/projects'
import {
  canDownload,
  canReview,
  cssAspectRatio,
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