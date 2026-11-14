<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  filename: string
  posting?: boolean
  error?: string | null
}>()
const emit = defineEmits<{ close: []; submit: [reason: string] }>()

const reason = ref('')
const canSubmit = computed(() => !!reason.value.trim() && !props.posting)

watch(
  () => props.open,
  (open) => {
    if (open) reason.value = ''
  },
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-title"
      @keydown.esc="emit('close')"
    >
      <form
        class="w-full max-w-sm space-y-3 rounded-xl border border-border bg-raised p-5 shadow-2xl"
        @submit.prevent="canSubmit && emit('submit', reason.trim())"
      >
        <h2 id="reject-title" class="text-sm font-medium break-words">Reject {{ filename }}</h2>
        <label class="block space-y-1.5">
          <span class="text-sm">Why is it rejected? (visible to the team)</span>
          <textarea
            v-model="reason"
            rows="4"
            autofocus
            class="w-full resize-none rounded-md border border-danger bg-canvas px-3 py-2 text-sm outline-none"
          />
        </label>
        <p v-if="error" class="text-xs text-danger" role="alert">{{ error }}</p>
        <div class="flex items-center justify-end gap-3">
          <button type="button" class="cursor-pointer px-3 py-2 text-sm" @click="emit('close')">
            Cancel
          </button>
          <button
            type="submit"
            :disabled="!canSubmit"
            class="cursor-pointer rounded-md bg-danger px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {{ posting ? 'Sending…' : 'Send rejection' }}
          </button>
        </div>
      </form>
    </div>
  </Teleport>
</template>