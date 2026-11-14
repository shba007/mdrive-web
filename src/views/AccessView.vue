<script setup lang="ts">
import { useRouter } from 'vue-router'
import AccessForm from '@/components/AccessForm.vue'

const router = useRouter()
</script>

<template>
  <main class="grid min-h-screen place-items-center px-4">
    <div class="w-full max-w-md space-y-5">
      <div class="space-y-1">
        <div class="mb-3 flex items-center gap-2 font-medium">
          <span
            class="grid size-6 place-items-center rounded bg-white text-xs font-bold text-black"
          >
            M
          </span>
          MDrive
        </div>
        <h1 class="text-xl font-semibold">Connect to MDrive</h1>
        <p class="text-sm text-muted">
          The organization scopes what you see. The API key grants access. Details are stored only
          in this browser.
        </p>
      </div>
      <AccessForm @saved="router.push({ name: 'projects' })" />
    </div>
  </main>
</template>