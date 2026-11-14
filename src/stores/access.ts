import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'mdrive:access'

export interface Access {
  organizationId: string
  userId: string
  apiKey: string
}

function load(): Access {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Access>
      return {
        organizationId: parsed.organizationId ?? '',
        userId: parsed.userId ?? '',
        apiKey: parsed.apiKey ?? '',
      }
    }
  } catch {
    // storage unavailable or corrupted: start empty
  }
  return { organizationId: '', userId: '', apiKey: '' }
}

/**
 * The access page asks for: organization id (scope), current user id (identity)
 * and the API key (grants access). They live only in this browser.
 */
export const useAccessStore = defineStore('access', () => {
  const initial = load()
  const organizationId = ref(initial.organizationId)
  const userId = ref(initial.userId)
  const apiKey = ref(initial.apiKey)

  const isConfigured = computed(
    () => !!organizationId.value.trim() && !!userId.value.trim() && !!apiKey.value.trim(),
  )

  function persist() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          organizationId: organizationId.value,
          userId: userId.value,
          apiKey: apiKey.value,
        }),
      )
    } catch {
      // ignore: values stay in memory for this session
    }
  }

  /** Set when the API rejected the saved key; shown on the access page. */
  const rejected = ref(false)

  function save(next: Access) {
    rejected.value = false
    organizationId.value = next.organizationId.trim()
    userId.value = next.userId.trim()
    apiKey.value = next.apiKey.trim()
    persist()
  }

  function clear() {
    organizationId.value = ''
    userId.value = ''
    apiKey.value = ''
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  return { organizationId, userId, apiKey, isConfigured, rejected, save, clear }
})