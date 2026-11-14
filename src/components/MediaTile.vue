<script setup lang="ts">
import { computed } from 'vue'
import type { MediaItem } from '@/api/projects'
import IconCheck from '~icons/lucide/check'
import IconDownload from '~icons/lucide/download'
import { canDownload, cssAspectRatio, mediaStatusLabel, mediaStatusTone } from '@/domain/media'

const props = defineProps<{ item: MediaItem; selected?: boolean; selecting?: boolean }>()
const emit = defineEmits<{ open: [id: string]; download: [id: string]; toggle: [id: string] }>()

const toneClass = computed(
  () =>
    ({
      info: 'bg-info',
      success: 'bg-success',
      danger: 'bg-danger',
      neutral: 'bg-border-strong',
    })[mediaStatusTone(props.item.status)],
)
</script>

<template>
  <article
    class="group relative mb-4 cursor-pointer break-inside-avoid overflow-hidden rounded-xl border bg-raised transition-colors"
    :class="selected ? 'border-primary' : 'border-border hover:border-border-strong'"
  >
    <button
      type="button"
      class="block w-full cursor-pointer text-left"
      :aria-label="`Open ${item.filename}`"
      @click="emit('open', item.id)"
    >
      <div
        class="relative bg-canvas"
        :style="{ aspectRatio: cssAspectRatio(item.metadata.aspectRatio) }"
      >
        <img
          :src="item.url"
          :alt="item.filename"
          loading="lazy"
          class="h-full w-full object-cover"
        />
        <span
          class="absolute top-2 left-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium capitalize"
        >
          {{ item.type }}
        </span>
        <span
          class="absolute top-2 right-2 rounded-full px-2.5 py-1 text-xs font-medium text-white"
          :class="toneClass"
        >
          {{ mediaStatusLabel(item.status) }}
        </span>
      </div>
      <div class="space-y-0.5 px-3 py-2.5 pr-12">
        <p class="truncate text-sm">{{ item.filename }}</p>
        <p v-if="item.metadata.resolution" class="text-xs text-muted">
          {{ item.metadata.resolution }}
        </p>
      </div>
    </button>
    <button
      v-if="canDownload(item.status)"
      type="button"
      class="absolute top-11 left-2 grid size-6 cursor-pointer place-items-center rounded-full border"
      :class="[
        selected ? 'border-primary bg-primary text-white' : 'border-white/70 bg-black/50',
        selected || selecting
          ? 'opacity-100'
          : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
      ]"
      :aria-pressed="!!selected"
      :aria-label="`${selected ? 'Deselect' : 'Select'} ${item.filename}`"
      @click="emit('toggle', item.id)"
    >
      <IconCheck v-if="selected" aria-hidden="true" />
    </button>
    <button
      type="button"
      class="absolute right-2 bottom-2 grid size-8 cursor-pointer place-items-center rounded-md border border-border hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-30"
      :disabled="!canDownload(item.status)"
      :title="canDownload(item.status) ? 'Download' : 'Available once released'"
      :aria-label="`Download ${item.filename}`"
      @click="emit('download', item.id)"
    >
      <IconDownload aria-hidden="true" />
    </button>
  </article>
</template>