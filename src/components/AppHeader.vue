<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAccessStore } from '@/stores/access'

const access = useAccessStore()
const router = useRouter()

function changeAccess() {
  void router.push({ name: 'access' })
}
</script>

<template>
  <header class="flex items-center justify-between gap-4 px-6 py-4">
    <RouterLink to="/projects" class="flex items-center gap-2 font-medium">
      <span class="grid size-6 place-items-center rounded bg-white text-xs font-bold text-black">
        M
      </span>
      MDrive
    </RouterLink>
    <nav class="hidden text-sm font-medium sm:block">
      <RouterLink to="/projects">Projects</RouterLink>
    </nav>
    <button
      type="button"
      class="cursor-pointer rounded-md border border-border px-4 py-2 text-sm hover:bg-raised"
      title="Change access details"
      @click="changeAccess"
    >
      {{ access.userId || 'Access' }}
    </button>
  </header>
</template>