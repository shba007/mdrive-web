<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ProviderPicker from '@/components/ProviderPicker.vue'
import SetupShell from '@/components/SetupShell.vue'
import { useSetupStore } from '@/stores/setup'

const setup = useSetupStore()
const router = useRouter()

const sameProvider = computed(
  () => !!setup.source && !!setup.destination && setup.source === setup.destination,
)
const ready = computed(() => !!setup.source && !!setup.destination && !sameProvider.value)
</script>

<template>
  <SetupShell
    :step="2"
    title="Move your media"
    lead="Bring existing files into MDrive from another storage. You can skip this and move files later."
  >
    <ProviderPicker v-model="setup.source" label="Move from" :disabled="setup.destination" />
    <ProviderPicker v-model="setup.destination" label="Move to" :disabled="setup.source" />
    <p v-if="sameProvider" class="text-sm text-danger" role="alert">
      Source and destination must be different.
    </p>
    <div class="flex items-center justify-between pt-2">
      <button
        type="button"
        class="cursor-pointer px-4 py-2 text-sm text-muted hover:text-white"
        @click="router.push({ name: 'setup-done' })"
      >
        Skip for now
      </button>
      <button
        type="button"
        :disabled="!ready"
        class="cursor-pointer rounded-lg bg-white px-6 py-2 text-sm font-medium text-canvas disabled:cursor-not-allowed disabled:opacity-40"
        @click="router.push({ name: 'setup-scope' })"
      >
        Continue
      </button>
    </div>
  </SetupShell>
</template>