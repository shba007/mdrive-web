<script setup lang="ts">
import { computed } from 'vue'
import { statusTone } from '@/domain/project'

const props = defineProps<{ status: string }>()

const toneClass = computed(
  () =>
    ({
      info: 'bg-info text-white',
      success: 'bg-success text-white',
      neutral: 'bg-border-strong text-white',
    })[statusTone(props.status)],
)
</script>

<template>
  <span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="toneClass">{{ status }}</span>
</template>