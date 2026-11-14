import { computed, reactive, ref, type Ref } from 'vue'
import { ApiError } from '@/api/http'
import { putFile, uploadsApi, type UploadTarget } from '@/api/uploads'
import { resolveMimeType, validateFile } from '@/domain/upload'

export type EntryStatus = 'ready' | 'uploading' | 'processing' | 'done' | 'failed'

export interface UploadEntry {
  key: string
  file: File
  status: EntryStatus
  progress: number
  error: string | null
  uploadId: string | null
}

const CONCURRENCY = 3
const POLL_MS = 2000
const POLL_MAX = 30

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const messageOf = (e: unknown) =>
  e instanceof ApiError || e instanceof Error ? e.message : 'Upload failed'

export function useUploader(projectId: Ref<string>) {
  const entries = ref<UploadEntry[]>([])
  const running = ref(false)
  const rejected = ref<string[]>([])
  const controllers = new Map<string, AbortController>()
  let seq = 0

  const pending = computed(() => entries.value.filter((e) => e.status === 'ready'))
  const finished = computed(
    () =>
      entries.value.length > 0 &&
      entries.value.every((e) => e.status === 'done' || e.status === 'failed'),
  )
  const hasUploaded = computed(() => entries.value.some((e) => e.status === 'done'))

  function add(files: File[]) {
    rejected.value = []
    for (const file of files) {
      const problem = validateFile(file)
      if (problem) {
        rejected.value.push(`${file.name}: ${problem}`)
        continue
      }
      entries.value.push(
        reactive({
          key: `f${++seq}`,
          file,
          status: 'ready',
          progress: 0,
          error: null,
          uploadId: null,
        }) as UploadEntry,
      )
    }
  }

  function remove(entry: UploadEntry) {
    controllers.get(entry.key)?.abort()
    controllers.delete(entry.key)
    entries.value = entries.value.filter((e) => e.key !== entry.key)
  }

  function fail(entry: UploadEntry, message: string) {
    entry.status = 'failed'
    entry.error = message
  }

  async function sendOne(entry: UploadEntry, target: UploadTarget) {
    const controller = new AbortController()
    controllers.set(entry.key, controller)
    entry.uploadId = target.uploadId
    entry.status = 'uploading'
    entry.progress = 0
    try {
      await putFile(
        target.uploadUrl,
        entry.file,
        resolveMimeType(entry.file),
        (p) => (entry.progress = p),
        controller.signal,
      )
      entry.progress = 100
      entry.status = 'processing'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      fail(entry, messageOf(e))
    } finally {
      controllers.delete(entry.key)
    }
  }

  async function poll(batchId: string, batch: UploadEntry[]) {
    for (let i = 0; i < POLL_MAX; i++) {
      const waiting = batch.filter((e) => e.status === 'processing')
      if (!waiting.length) return
      await sleep(POLL_MS)
      try {
        const status = await uploadsApi.batchStatus(batchId)
        for (const entry of waiting) {
          const remote = status.uploads.find((u) => u.uploadId === entry.uploadId)
          if (remote?.status === 'completed') entry.status = 'done'
          else if (remote?.status === 'failed') fail(entry, remote.error ?? 'Processing failed')
        }
      } catch {
        // transient: try again on the next tick
      }
    }
    // Still processing after the poll window: the file is stored, so treat as done.
    for (const entry of batch) if (entry.status === 'processing') entry.status = 'done'
  }

  /** Uploads every ready (or failed, on retry) entry as one batch. */
  async function start(only?: UploadEntry[]) {
    const batch = (
      only ?? entries.value.filter((e) => e.status === 'ready' || e.status === 'failed')
    ).filter((e) => e.status === 'ready' || e.status === 'failed')
    if (!batch.length || running.value) return
    running.value = true
    for (const e of batch) {
      e.status = 'ready'
      e.error = null
    }
    try {
      const created = await uploadsApi.createBatch(
        projectId.value,
        batch.map((e) => ({
          filename: e.file.name,
          mimeType: resolveMimeType(e.file),
          sizeBytes: e.file.size,
        })),
      )
      const queue = batch.map((entry, i) => ({ entry, target: created.uploads[i] }))
      let next = 0
      const worker = async () => {
        while (next < queue.length) {
          const job = queue[next++]!
          if (!job.target) fail(job.entry, 'No upload URL returned')
          else await sendOne(job.entry, job.target)
        }
      }
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker))
      await poll(created.batchId, batch)
    } catch (e) {
      for (const entry of batch) if (entry.status === 'ready') fail(entry, messageOf(e))
    } finally {
      running.value = false
    }
  }

  const retry = (entry: UploadEntry) => start([entry])

  function reset() {
    for (const c of controllers.values()) c.abort()
    controllers.clear()
    entries.value = []
    rejected.value = []
    running.value = false
  }

  return {
    entries,
    pending,
    running,
    finished,
    hasUploaded,
    rejected,
    add,
    remove,
    start,
    retry,
    reset,
  }
}