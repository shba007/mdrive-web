import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  planError,
  toggleKind,
  type KindId,
  type MigrationPlan,
  type ProviderId,
} from '@/domain/migration'

const STORAGE_KEY = 'mdrive:setup'

function loadOnboarded(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'done'
  } catch {
    return false
  }
}

/**
 * First-run setup: the `onboarded` flag decides whether `/` opens setup or the
 * projects, and the migration plan is held across the storage steps.
 */
export const useSetupStore = defineStore('setup', () => {
  const onboarded = ref(loadOnboarded())
  const source = ref<ProviderId | null>(null)
  const destination = ref<ProviderId | null>(null)
  const kinds = ref<KindId[]>(['photos', 'videos', 'audio', 'documents'])

  function plan(): MigrationPlan {
    return { source: source.value, destination: destination.value, kinds: [...kinds.value] }
  }

  function error(): string | null {
    return planError(plan())
  }

  function toggle(id: KindId) {
    kinds.value = toggleKind(kinds.value, id)
  }

  function complete() {
    onboarded.value = true
    try {
      localStorage.setItem(STORAGE_KEY, 'done')
    } catch {
      // ignore: the flag stays in memory for this session
    }
  }

  function reset() {
    onboarded.value = false
    source.value = destination.value = null
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  return { onboarded, source, destination, kinds, plan, error, toggle, complete, reset }
})