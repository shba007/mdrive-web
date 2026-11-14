import { ref, watch, type Ref } from 'vue'
import { projectsApi, type MediaDetail } from '@/api/projects'

/**
 * Loads `GET /api/media/:id` (file facts and EXIF) for the open media.
 * Failures are silent: the viewer falls back to the fields already in the list.
 */
export function useMediaDetail(mediaId: Ref<string | undefined>) {
  const detail = ref<MediaDetail | null>(null)
  let controller: AbortController | undefined

  watch(
    mediaId,
    async (id) => {
      controller?.abort()
      detail.value = null
      if (!id) return
      controller = new AbortController()
      try {
        const result = await projectsApi.mediaDetail(id, controller.signal)
        if (mediaId.value === id) detail.value = result
      } catch {
        // aborted or failed: keep using the list item
      }
    },
    { immediate: true },
  )

  return { detail }
}