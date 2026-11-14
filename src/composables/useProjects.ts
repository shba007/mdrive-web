import { ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { ApiError } from '@/api/http'
import { projectsApi, type ProjectSummary } from '@/api/projects'
import type { StatusFilter } from '@/domain/project'

export function useProjects() {
  const projects = ref<ProjectSummary[]>([])
  const totalItems = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const status = ref<StatusFilter>('All')
  const search = ref('')

  let controller: AbortController | undefined

  async function load() {
    controller?.abort()
    controller = new AbortController()
    loading.value = true
    error.value = null
    try {
      const result = await projectsApi.list(
        {
          status: status.value === 'All' ? undefined : status.value,
          search: search.value.trim() || undefined,
        },
        controller.signal,
      )
      projects.value = result.data
      totalItems.value = result.totalItems
      loading.value = false
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      error.value = e instanceof ApiError ? e.message : 'Something went wrong. Try again.'
      loading.value = false
    }
  }

  const debouncedLoad = useDebounceFn(load, 300)
  watch(status, () => void load())
  watch(search, () => void debouncedLoad())

  return { projects, totalItems, loading, error, status, search, load }
}