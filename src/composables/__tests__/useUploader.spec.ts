import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { ref } from 'vue'

const createBatch = vi.fn<(...args: unknown[]) => unknown>()
const batchStatus = vi.fn<(...args: unknown[]) => unknown>()
const putFile = vi.fn<(...args: unknown[]) => unknown>()

vi.mock('@/api/uploads', () => ({
  uploadsApi: { createBatch, batchStatus },
  putFile,
}))

const { useUploader } = await import('../useUploader')

const file = (name: string, type = 'image/jpeg', size = 10) =>
  new File([new Uint8Array(size)], name, { type })

describe('useUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  it('rejects unsupported files with a reason', () => {
    const u = useUploader(ref('p1'))
    u.add([file('a.jpg'), file('b.gif', 'image/gif')])
    expect(u.entries.value).toHaveLength(1)
    expect(u.rejected.value[0]).toContain('b.gif')
  })

  it('uploads, polls and marks files done', async () => {
    createBatch.mockResolvedValue({
      batchId: 'batch_1',
      uploads: [{ filename: 'photo-1.jpg', uploadId: 'up_1', uploadUrl: 'https://r2/x' }],
    })
    putFile.mockImplementation(async (...args) => (args[3] as (p: number) => void)(100))
    batchStatus.mockResolvedValue({
      projectId: 'p1',
      uploads: [
        {
          uploadId: 'up_1',
          filename: 'photo-1.jpg',
          status: 'completed',
          progressPercent: 100,
          mediaId: 'm',
          error: null,
        },
      ],
    })
    const u = useUploader(ref('p1'))
    u.add([file('a.jpg')])
    const done = u.start()
    await vi.advanceTimersByTimeAsync(2500)
    await done
    expect(createBatch).toHaveBeenCalledWith('p1', [
      { filename: 'a.jpg', mimeType: 'image/jpeg', sizeBytes: 10 },
    ])
    expect(u.entries.value[0]!.status).toBe('done')
    expect(u.finished.value).toBe(true)
  })

  it('marks a file failed when the PUT fails, then retries', async () => {
    createBatch.mockResolvedValue({
      batchId: 'b',
      uploads: [{ filename: 'p.jpg', uploadId: 'up_1', uploadUrl: 'https://r2/x' }],
    })
    putFile.mockRejectedValueOnce(new Error('Upload failed (403)'))
    const u = useUploader(ref('p1'))
    u.add([file('a.jpg')])
    await u.start()
    expect(u.entries.value[0]!.status).toBe('failed')
    expect(u.entries.value[0]!.error).toBe('Upload failed (403)')

    putFile.mockResolvedValueOnce(undefined)
    batchStatus.mockResolvedValue({
      projectId: 'p1',
      uploads: [
        {
          uploadId: 'up_1',
          filename: 'p.jpg',
          status: 'completed',
          progressPercent: 100,
          mediaId: 'm',
          error: null,
        },
      ],
    })
    const retried = u.retry(u.entries.value[0]!)
    await vi.advanceTimersByTimeAsync(2500)
    await retried
    expect(u.entries.value[0]!.status).toBe('done')
  })
})