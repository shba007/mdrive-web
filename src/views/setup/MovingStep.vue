<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SetupShell from '@/components/SetupShell.vue'
import { percent } from '@/domain/migration'
import { migrationApi, type MigrationProgress } from '@/api/migration'
import { useSetupStore } from '@/stores/setup'

const setup = useSetupStore()
const router = useRouter()
const progress = ref<MigrationProgress>({
  moved: 0,
  total: migrationApi.estimate(setup.plan()).files,
  done: false,
})
const pct = computed(() => percent(progress.value.moved, progress.value.total))
let cancel: (() => void) | undefined

onMounted(() => {
  cancel = migrationApi.run(setup.plan(), (p) => {
    progress.value = p
    if (p.done) void router.replace({ name: 'setup-done' })
  })
})
onBeforeUnmount(() => cancel?.())

function stop() {
  cancel?.()
  void router.replace({ name: 'setup-storage' })
}
</script>

<template>
  <SetupShell :step="2" title="Moving your media" lead="Keep this tab open until it finishes.">
    <div class="space-y-3 rounded-xl border border-border bg-raised p-5">
      <div class="flex justify-between text-sm">
        <span>{{ progress.moved }} of {{ progress.total }} files</span>
        <span>{{ pct }}%</span>
      </div>
      <div
        class="h-2 overflow-hidden rounded-full bg-border"
        role="progressbar"
        :aria-valuenow="pct"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div class="h-full bg-primary transition-all" :style="{ width: pct + '%' }" />
      </div>
    </div>
    <button
      type="button"
      class="cursor-pointer px-4 py-2 text-sm text-muted hover:text-white"
      @click="stop"
    >
      Cancel
    </button>
  </SetupShell>
</template>