import { describe, expect, it } from 'vite-plus/test'
import { formatDate, formatMediaCount, statusTone } from '../project'

describe('project domain', () => {
  it('formats media counts, omitting zeros and handling singular', () => {
    expect(formatMediaCount({ photo: 82, video: 20 })).toBe('82 photos · 20 videos')
    expect(formatMediaCount({ photo: 210, video: 0 })).toBe('210 photos')
    expect(formatMediaCount({ photo: 1, video: 1 })).toBe('1 photo · 1 video')
    expect(formatMediaCount({ photo: 0, video: 0 })).toBe('No media yet')
  })

  it('maps status to a tone', () => {
    expect(statusTone('Delivered')).toBe('success')
    expect(statusTone('shoot')).toBe('info')
    expect(statusTone('Draft')).toBe('neutral')
  })

  it('formats dates and tolerates invalid input', () => {
    expect(formatDate('2026-05-10T00:00:00Z')).toBe('10 May 2026')
    expect(formatDate('nope')).toBe('')
  })
})