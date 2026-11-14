<script setup lang="ts">
import { computed } from 'vue'
import type { ProjectSummary } from '@/api/projects'
import { formatMediaCount, formatProjectMeta, previewUrl } from '@/domain/project'
import StatusBadge from './StatusBadge.vue'

const props = defineProps<{ project: ProjectSummary }>()

const previews = computed(() => props.project.previewImages.slice(0, 3))
</script>

<template>
  <RouterLink
    :to="{ name: 'project', params: { projectId: project.id } }"
    class="block overflow-hidden rounded-xl border border-border bg-raised transition-colors hover:border-border-strong"
  >
    <div class="grid h-38 grid-cols-3 gap-px bg-border">
      <template v-if="previews.length">
        <img
          v-for="slug in previews"
          :key="slug"
          :src="previewUrl(slug)"
          alt=""
          loading="lazy"
          class="h-full w-full bg-canvas object-cover"
        />
      </template>
      <div v-else class="col-span-3 grid place-items-center bg-canvas text-sm text-subtle">
        No previews yet
      </div>
    </div>
    <div class="space-y-1.5 p-3">
      <div class="flex items-center justify-between gap-2">
        <h3 class="truncate text-sm font-medium">{{ project.title }}</h3>
        <StatusBadge :status="project.status" />
      </div>
      <p class="truncate text-xs text-muted">{{ formatProjectMeta(project) }}</p>
      <p class="text-xs text-muted">{{ formatMediaCount(project.mediaCount) }}</p>
    </div>
  </RouterLink>
</template>