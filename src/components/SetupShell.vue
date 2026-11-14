<script setup lang="ts">
import { SETUP_STEPS } from '@/domain/migration'

defineProps<{ step: 1 | 2 | 3; title: string; lead?: string }>()
</script>

<template>
  <div class="min-h-screen">
    <header class="flex items-center gap-2 px-8 py-6 font-medium">
      <span class="grid size-6 place-items-center rounded bg-white text-xs font-bold text-black">
        M
      </span>
      MDrive
    </header>
    <main class="mx-auto w-full max-w-[640px] space-y-5 px-4 pt-12 pb-16">
      <p class="font-mono text-xs tracking-widest text-muted uppercase">
        Step {{ step }} of {{ SETUP_STEPS.length }}
      </p>
      <h1 class="text-2xl font-semibold">{{ title }}</h1>
      <p v-if="lead" class="text-sm text-muted">{{ lead }}</p>
      <slot />
    </main>
  </div>
</template>