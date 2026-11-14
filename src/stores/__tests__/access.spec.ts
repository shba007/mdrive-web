import { beforeEach, describe, expect, it } from 'vite-plus/test'
import { createPinia, setActivePinia } from 'pinia'
import { useAccessStore } from '../access'

describe('access store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('is not configured until all three values are set', () => {
    const access = useAccessStore()
    expect(access.isConfigured).toBe(false)
    access.save({ organizationId: 'org', userId: '', apiKey: 'k' })
    expect(access.isConfigured).toBe(false)
    access.save({ organizationId: ' org ', userId: 'u', apiKey: 'k' })
    expect(access.isConfigured).toBe(true)
    expect(access.organizationId).toBe('org')
  })

  it('persists and restores values', () => {
    useAccessStore().save({ organizationId: 'org', userId: 'u', apiKey: 'k' })
    setActivePinia(createPinia())
    expect(useAccessStore().apiKey).toBe('k')
  })

  it('clears values', () => {
    const access = useAccessStore()
    access.save({ organizationId: 'org', userId: 'u', apiKey: 'k' })
    access.clear()
    expect(access.isConfigured).toBe(false)
    setActivePinia(createPinia())
    expect(useAccessStore().organizationId).toBe('')
  })
})