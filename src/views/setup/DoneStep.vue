<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import SetupShell from '@/components/SetupShell.vue'
import { useSetupStore } from '@/stores/setup'

const setup = useSetupStore()
const router = useRouter()

onMounted(() => setup.complete())
</script>

<template>
  <SetupShell :step="3" title="You are all set" lead="Your projects are ready to open.">
    <button
      type="button"
      class="cursor-pointer rounded-lg bg-white px-6 py-2 text-sm font-medium text-canvas"
      @click="router.push({ name: 'projects' })"
    >
      Open projects
    </button>
  </SetupShell>
</template>