import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { ref } from 'vue'

const setStatusApi = vi.fn<(...args: unknown[]) => unknown>()
const downloads = vi.fn<(...args: unknown[]) => unknown>()
const get = vi.fn<(...args: unknown[]) => unknown>()
const media = vi.fn<(...args: unknown[]) => unknown>()

vi.mock('@/api/media', () => ({ mediaApi: { setStatus: setStatusApi, downloads } }))
vi.mock('@/api/projects', () => ({ projectsApi: { get, media } }))

const { useProjectMedia } = await import('../useProjectMedia')

const item = (id: string, status: string) => ({
  id,
  url: 'u',
  filename: `${id}.jpg`,
  status,
  type: 'photo',
  metadata: {},
})

async function setup() {
  media.mockResolvedValue({ data: [item('m1', 'pending')], totalItems: 1 })
  get.mockResolvedValue({ id: 'p1', mediaSummary: { breakdown: {} } })
  const m = useProjectMedia(ref('p1'))
  await m.load()
  return m
}

describe('useProjectMedia actions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates status optimistically and refreshes the summary', async () => {
    const m = await setup()
    setStatusApi.mockResolvedValue({ success: true, updatedCount: 1 })
    await m.setStatus('m1', 'approved')
    expect(setStatusApi).toHaveBeenCalledWith(['m1'], 'approved')
    expect(m.items.value[0]!.status).toBe('approved')
    expect(get).toHaveBeenCalledTimes(2)
  })

  it('rolls back and reports when the update fails', async () => {
    const m = await setup()
    setStatusApi.mockRejectedValue(new Error('boom'))
    await m.setStatus('m1', 'rejected')
    expect(m.items.value[0]!.status).toBe('pending')
    expect(m.actionError.value).toBe('Something went wrong. Try again.')
  })

  it('keeps loading pages until a deep-linked item appears', async () => {
    media.mockResolvedValueOnce({ data: [item('m1', 'pending')], totalItems: 3 })
    get.mockResolvedValue({ id: 'p1', mediaSummary: { breakdown: {} } })
    const m = useProjectMedia(ref('p1'))
    await m.load()
    media.mockResolvedValueOnce({ data: [item('m2', 'pending')], totalItems: 3 })
    media.mockResolvedValueOnce({ data: [item('m3', 'pending')], totalItems: 3 })
    await m.ensureLoaded('m3')
    expect(m.items.value.map((i) => i.id)).toEqual(['m1', 'm2', 'm3'])
    expect(media).toHaveBeenCalledTimes(3)
  })

  it('starts a download per presigned asset', async () => {
    const m = await setup()
    downloads.mockResolvedValue({
      assets: [{ mediaId: 'm1', filename: 'a.jpg', downloadUrl: 'https://r2/x' }],
      expiresIn: 3600,
    })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    await m.download(['m1'])
    expect(downloads).toHaveBeenCalledWith('p1', ['m1'])
    expect(click).toHaveBeenCalledTimes(1)
    click.mockRestore()
  })
})