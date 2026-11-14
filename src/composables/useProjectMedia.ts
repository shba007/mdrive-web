import { computed, ref, watch, type Ref } from 'vue'
import { ApiError } from '@/api/http'
import { mediaApi, type ReviewDecision } from '@/api/media'
import { projectsApi, type MediaItem, type MediaStatus, type ProjectDetail } from '@/api/projects'
import { reviewCounts } from '@/domain/media'

const PAGE_SIZE = 24

function startDownload(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.target = '_blank'
  document.body.append(a)
  a.click()
  a.remove()
}

function messageOf(e: unknown): string {
  return e instanceof ApiError ? e.message : 'Something went wrong. Try again.'
}

export function useProjectMedia(projectId: Ref<string>) {
  const project = ref<ProjectDetail | null>(null)
  const items = ref<MediaItem[]>([])
  const totalItems = ref(0)
  const page = ref(1)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const status = ref<MediaStatus | undefined>(undefined)
  const sort = ref<'date_desc' | 'date_asc'>('date_desc')

  const counts = computed(() => (project.value ? reviewCounts(project.value.mediaSummary) : null))
  const hasMore = computed(() => items.value.length < totalItems.value)

  let controller: AbortController | undefined

  async function loadPage(next: number) {
    controller?.abort()
    controller = new AbortController()
    loading.value = true
    error.value = null
    try {
      const result = await projectsApi.media(
        projectId.value,
        { status: status.value, sort: sort.value, page: next, limit: PAGE_SIZE },
        controller.signal,
      )
      items.value = next === 1 ? result.data : [...items.value, ...result.data]
      totalItems.value = result.totalItems
      page.value = next
      loading.value = false
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      error.value = messageOf(e)
      loading.value = false
    }
  }

  async function loadProject() {
    try {
      project.value = await projectsApi.get(projectId.value)
    } catch (e) {
      error.value = messageOf(e)
    }
  }

  async function load() {
    items.value = []
    await Promise.all([loadProject(), loadPage(1)])
  }

  const actionError = ref<string | null>(null)

  /** Optimistically sets the status, rolls back on failure, then refreshes the counts. */
  async function setStatus(id: string, next: ReviewDecision) {
    const item = items.value.find((i) => i.id === id)
    if (!item) return
    const previous = item.status
    item.status = next
    actionError.value = null
    try {
      await mediaApi.setStatus([id], next)
      await loadProject()
    } catch (e) {
      item.status = previous
      actionError.value = messageOf(e)
    }
  }

  /** Fetches presigned URLs and starts a browser download for each. */
  async function download(ids: string[]) {
    actionError.value = null
    try {
      const { assets } = await mediaApi.downloads(projectId.value, ids)
      for (const asset of assets) startDownload(asset.downloadUrl, asset.filename)
    } catch (e) {
      actionError.value = messageOf(e)
    }
  }

  /** Deep links: keeps loading pages (bounded) until the item is in the list. */
  async function ensureLoaded(id: string, maxPages = 10) {
    for (let i = 0; i < maxPages; i++) {
      if (items.value.some((item) => item.id === id) || !hasMore.value || error.value) return
      await loadPage(page.value + 1)
    }
  }

  const loadMore = () => (hasMore.value && !loading.value ? loadPage(page.value + 1) : undefined)

  watch([status, sort], () => void loadPage(1))
  watch(projectId, () => void load())

  return {
    project,
    items,
    loading,
    error,
    actionError,
    status,
    sort,
    counts,
    hasMore,
    load,
    loadMore,
    setStatus,
    download,
    ensureLoaded,
  }
}