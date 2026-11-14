import { describe, expect, it } from 'vite-plus/test'
import { percent, planError, providerName, toggleKind } from '../migration'

describe('migration domain', () => {
  it('validates a plan', () => {
    expect(planError({ source: null, destination: 'r2', kinds: ['photos'] })).toMatch(
      /Choose where/,
    )
    expect(planError({ source: 'r2', destination: 'r2', kinds: ['photos'] })).toMatch(/different/)
    expect(planError({ source: 's3', destination: 'r2', kinds: [] })).toMatch(/at least one/)
    expect(planError({ source: 's3', destination: 'r2', kinds: ['audio'] })).toBeNull()
  })

  it('toggles kinds', () => {
    expect(toggleKind(['photos'], 'videos')).toEqual(['photos', 'videos'])
    expect(toggleKind(['photos', 'videos'], 'photos')).toEqual(['videos'])
  })

  it('computes a clamped percentage', () => {
    expect(percent(0, 0)).toBe(0)
    expect(percent(30, 120)).toBe(25)
    expect(percent(200, 100)).toBe(100)
  })

  it('names providers', () => {
    expect(providerName('gdrive')).toBe('Google Drive')
    expect(providerName(null)).toBe('')
  })
})