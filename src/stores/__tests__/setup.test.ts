import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createPinia, setActivePinia } from 'pinia'
import { migrationApi } from '@/api/migration'
import { useSetupStore } from '../setup'

describe('setup store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts not onboarded and persists completion', () => {
    const setup = useSetupStore()
    expect(setup.onboarded).toBe(false)
    setup.complete()
    setActivePinia(createPinia())
    expect(useSetupStore().onboarded).toBe(true)
  })

  it('reset clears the flag and the choices', () => {
    const setup = useSetupStore()
    setup.source = 'r2'
    setup.complete()
    setup.reset()
    expect(setup.onboarded).toBe(false)
    expect(setup.source).toBeNull()
  })

  it('reports plan errors until source and destination differ', () => {
    const setup = useSetupStore()
    expect(setup.error()).not.toBeNull()
    setup.source = 's3'
    setup.destination = 'r2'
    expect(setup.error()).toBeNull()
    setup.toggle('photos')
    setup.toggle('videos')
    setup.toggle('audio')
    setup.toggle('documents')
    expect(setup.error()).toMatch(/at least one/)
  })
})

describe('mock migration run', () => {
  it('reports progress until done', () => {
    vi.useFakeTimers()
    const seen: number[] = []
    let done = false
    migrationApi.run({ source: 's3', destination: 'r2', kinds: ['photos'] }, (p) => {
      seen.push(p.moved)
      done = p.done
    })
    vi.advanceTimersByTime(300 * 20)
    vi.useRealTimers()
    expect(done).toBe(true)
    expect(seen[seen.length - 1]).toBe(120)
    expect(seen).toEqual([...seen].sort((a, b) => a - b))
  })
})