import { describe, expect, it } from 'vite-plus/test'
import { initial, nextZoom, timeAgo, toPercent } from '../comments'

const now = new Date('2026-05-10T12:00:00Z').getTime()

describe('comments domain', () => {
  it('formats relative time', () => {
    expect(timeAgo('2026-05-10T11:59:40Z', now)).toBe('just now')
    expect(timeAgo('2026-05-10T11:30:00Z', now)).toBe('30m ago')
    expect(timeAgo('2026-05-10T10:00:00Z', now)).toBe('2h ago')
    expect(timeAgo('2026-05-08T12:00:00Z', now)).toBe('2d ago')
    expect(timeAgo('nope', now)).toBe('')
  })

  it('takes the first letter as initial', () => {
    expect(initial('sarah Connor')).toBe('S')
    expect(initial('  ')).toBe('?')
  })

  it('converts pointer to clamped percentages', () => {
    const rect = { left: 100, top: 50, width: 400, height: 200 }
    expect(toPercent({ x: 300, y: 150 }, rect)).toEqual({ x: 50, y: 50 })
    expect(toPercent({ x: 0, y: 999 }, rect)).toEqual({ x: 0, y: 100 })
    expect(toPercent({ x: 281, y: 100 }, rect)).toEqual({ x: 45.3, y: 25 })
  })

  it('clamps zoom', () => {
    expect(nextZoom(1, -1)).toBe(1)
    expect(nextZoom(1, 1)).toBe(1.5)
    expect(nextZoom(3, 1)).toBe(3)
  })
})