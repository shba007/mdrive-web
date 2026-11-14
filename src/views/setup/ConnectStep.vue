<script setup lang="ts">
import { useRouter } from 'vue-router'
import AccessForm from '@/components/AccessForm.vue'
import SetupShell from '@/components/SetupShell.vue'

const router = useRouter()
</script>

<template>
  <SetupShell
    :step="1"
    title="Connect to MDrive"
    lead="The organization scopes what you see. The API key grants access. Details are stored only in this browser."
  >
    <AccessForm @saved="router.push({ name: 'setup-storage' })" />
  </SetupShell>
</template>