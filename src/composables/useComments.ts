import { ref, watch, type Ref } from 'vue'
import { ApiError } from '@/api/http'
import { commentsApi, type Comment } from '@/api/comments'
import { DEFAULT_AUTHOR_ROLE } from '@/domain/comments'
import { useAccessStore } from '@/stores/access'

const messageOf = (e: unknown) =>
  e instanceof ApiError ? e.message : 'Something went wrong. Try again.'

export function useComments(mediaId: Ref<string | undefined>) {
  const access = useAccessStore()
  const comments = ref<Comment[]>([])
  const loading = ref(false)
  const posting = ref(false)
  const error = ref<string | null>(null)

  let controller: AbortController | undefined

  async function load() {
    controller?.abort()
    const id = mediaId.value
    error.value = null
    if (!id) return
    controller = new AbortController()
    loading.value = true
    try {
      const result = await commentsApi.query([id], controller.signal)
      comments.value = result.timelines[id] ?? []
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      error.value = messageOf(e)
    } finally {
      loading.value = false
    }
  }

  /** Adds a root comment (optionally pinned) or a reply; reloads the timeline. */
  async function post(
    text: string,
    options: { coordinates?: { x: number; y: number } | null; parentId?: string } = {},
  ): Promise<boolean> {
    const id = mediaId.value
    const body = text.trim()
    if (!id || !body) return false
    posting.value = true
    error.value = null
    try {
      await commentsApi.create({
        mediaIds: [id],
        text: body,
        parentId: options.parentId ?? null,
        coordinates: options.parentId ? null : (options.coordinates ?? null),
        author: { name: access.userId, role: DEFAULT_AUTHOR_ROLE },
      })
      await load()
      return true
    } catch (e) {
      error.value = messageOf(e)
      return false
    } finally {
      posting.value = false
    }
  }

  watch(
    mediaId,
    () => {
      comments.value = []
      void load()
    },
    { immediate: true },
  )

  return { comments, loading, posting, error, load, post }
}