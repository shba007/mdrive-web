<script setup lang="ts">
import { useRouter } from 'vue-router'
import SetupShell from '@/components/SetupShell.vue'
import { KINDS } from '@/domain/migration'
import { useSetupStore } from '@/stores/setup'

const setup = useSetupStore()
const router = useRouter()
</script>

<template>
  <SetupShell
    :step="2"
    title="What should we move?"
    lead="Choose the kinds of media to bring over."
  >
    <ul class="space-y-2">
      <li v-for="k in KINDS" :key="k.id">
        <label
          class="flex cursor-pointer items-center gap-3 rounded-xl border bg-raised px-4 py-3"
          :class="setup.kinds.includes(k.id) ? 'border-primary' : 'border-border'"
        >
          <input
            type="checkbox"
            class="accent-primary"
            :checked="setup.kinds.includes(k.id)"
            @change="setup.toggle(k.id)"
          />
          <span class="flex-1">
            <span class="block text-sm font-medium">{{ k.label }}</span>
            <span class="block text-xs text-muted">{{ k.hint }}</span>
          </span>
        </label>
      </li>
    </ul>
    <div class="flex items-center justify-between pt-2">
      <button
        type="button"
        class="cursor-pointer px-4 py-2 text-sm text-muted hover:text-white"
        @click="router.back()"
      >
        Back
      </button>
      <button
        type="button"
        :disabled="setup.kinds.length === 0"
        class="cursor-pointer rounded-lg bg-white px-6 py-2 text-sm font-medium text-canvas disabled:cursor-not-allowed disabled:opacity-40"
        @click="router.push({ name: 'setup-review' })"
      >
        Continue
      </button>
    </div>
  </SetupShell>
</template>