<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import SetupShell from '@/components/SetupShell.vue'
import { KINDS, providerName } from '@/domain/migration'
import { migrationApi } from '@/api/migration'
import { useSetupStore } from '@/stores/setup'

const setup = useSetupStore()
const router = useRouter()
const files = migrationApi.estimate(setup.plan()).files
const kindLabels = computed(() =>
  KINDS.filter((k) => setup.kinds.includes(k.id))
    .map((k) => k.label)
    .join(', '),
)
</script>

<template>
  <SetupShell
    :step="2"
    title="Review and start"
    lead="Files are copied, not removed, from the source. Estimates are placeholders until the migration API exists."
  >
    <dl class="space-y-3 rounded-xl border border-border bg-raised p-5 text-sm">
      <div class="flex justify-between">
        <dt class="text-muted">From</dt>
        <dd>{{ providerName(setup.source) }}</dd>
      </div>
      <div class="flex justify-between">
        <dt class="text-muted">To</dt>
        <dd>{{ providerName(setup.destination) }}</dd>
      </div>
      <div class="flex justify-between">
        <dt class="text-muted">Moving</dt>
        <dd>{{ kindLabels }}</dd>
      </div>
      <div class="flex justify-between">
        <dt class="text-muted">Estimated files</dt>
        <dd>{{ files }}</dd>
      </div>
    </dl>
    <div class="flex items-center justify-between pt-2">
      <button
        type="button"
        class="cursor-pointer px-4 py-2 text-sm text-muted hover:text-white"
        @click="router.back()"
      >
        Back
      </button>
      <button
        type="button"
        class="cursor-pointer rounded-lg bg-white px-6 py-2 text-sm font-medium text-canvas"
        @click="router.push({ name: 'setup-moving' })"
      >
        Start moving
      </button>
    </div>
  </SetupShell>
</template>