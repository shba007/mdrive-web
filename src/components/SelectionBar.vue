<script setup lang="ts">
import { fileCount } from '@/domain/media'

defineProps<{ count: number }>()
const emit = defineEmits<{ clear: []; download: [] }>()
</script>

<template>
  <div
    v-if="count > 0"
    class="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4 rounded-full border border-border bg-raised py-2 pr-2 pl-5 text-sm shadow-2xl"
    role="region"
    aria-label="Selection"
  >
    <span>{{ count }} selected</span>
    <button type="button" class="cursor-pointer text-muted hover:text-white" @click="emit('clear')">
      Clear
    </button>
    <button
      type="button"
      class="cursor-pointer rounded-full bg-white px-4 py-2 font-medium text-canvas"
      @click="emit('download')"
    >
      Download {{ fileCount(count) }}
    </button>
  </div>
</template>