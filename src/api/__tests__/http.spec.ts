import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError, UNAUTHORIZED_EVENT, request } from '../http'
import { useAccessStore } from '@/stores/access'

describe('request', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useAccessStore().save({ organizationId: 'org-1', userId: 'u', apiKey: 'secret' })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('sends the api key and organization headers', async () => {
    const fetchMock = vi.fn<(...args: unknown[]) => Promise<Response>>(
      async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    await request('/projects', { query: { status: 'Shoot', search: '' } })
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/projects?status=Shoot')
    expect(init.headers).toMatchObject({ 'x-api-key': 'secret', 'x-org-id': 'org-1' })
  })

  it('signals unauthorized on 401 and 403', async () => {
    vi.stubGlobal('fetch', async () => new Response('{}', { status: 403, statusText: 'Forbidden' }))
    const listener = vi.fn<() => void>()
    window.addEventListener(UNAUTHORIZED_EVENT, listener)
    await expect(request('/projects')).rejects.toMatchObject({ status: 403 })
    window.removeEventListener(UNAUTHORIZED_EVENT, listener)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('maps network failures to an ApiError', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('network')
    })
    await expect(request('/projects')).rejects.toBeInstanceOf(ApiError)
  })
})