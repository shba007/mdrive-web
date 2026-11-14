import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const query = vi.fn<(...args: unknown[]) => unknown>()
const create = vi.fn<(...args: unknown[]) => unknown>()

vi.mock('@/api/comments', () => ({ commentsApi: { query, create } }))

const { useComments } = await import('../useComments')
const { useAccessStore } = await import('@/stores/access')

const flush = () => new Promise((r) => setTimeout(r, 0))

describe('useComments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    setActivePinia(createPinia())
    useAccessStore().save({ organizationId: 'org', userId: 'Sarah', apiKey: 'k' })
  })

  it('loads the timeline for the media', async () => {
    query.mockResolvedValue({ timelines: { m1: [{ commentId: 'c1', text: 'hi', replies: [] }] } })
    const c = useComments(ref('m1'))
    await flush()
    expect(query).toHaveBeenCalledWith(['m1'], expect.anything())
    expect(c.comments.value).toHaveLength(1)
  })

  it('posts a pinned comment with the current user as author, then reloads', async () => {
    query.mockResolvedValue({ timelines: { m1: [] } })
    create.mockResolvedValue({ comments: [] })
    const c = useComments(ref('m1'))
    await flush()
    const ok = await c.post('  warmer  ', { coordinates: { x: 10, y: 20 } })
    expect(ok).toBe(true)
    expect(create).toHaveBeenCalledWith({
      mediaIds: ['m1'],
      text: 'warmer',
      parentId: null,
      coordinates: { x: 10, y: 20 },
      author: { name: 'Sarah', role: 'Client' },
    })
    expect(query).toHaveBeenCalledTimes(2)
  })

  it('drops coordinates on replies and ignores blank text', async () => {
    query.mockResolvedValue({ timelines: { m1: [] } })
    create.mockResolvedValue({ comments: [] })
    const c = useComments(ref('m1'))
    await flush()
    expect(await c.post('   ')).toBe(false)
    await c.post('ok', { parentId: 'c1', coordinates: { x: 1, y: 1 } })
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ parentId: 'c1', coordinates: null }),
    )
  })
})