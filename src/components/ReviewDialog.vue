<script setup lang="ts">
import { ref, watch } from 'vue'
import { fileCount, type ReviewTotals } from '@/domain/media'

const props = defineProps<{ open: boolean; totals: ReviewTotals }>()
const emit = defineEmits<{ close: []; submit: [note: string] }>()

const note = ref('')

watch(
  () => props.open,
  (open) => {
    if (open) note.value = ''
  },
)

const rows = [
  { key: 'approved', label: 'Approved', tail: 'go to release', cls: 'bg-success' },
  { key: 'rejected', label: 'Not approved', tail: 'back to the team to fix', cls: 'bg-danger' },
  { key: 'pending', label: 'Still in review', tail: 'stay in review', cls: 'bg-info' },
] as const
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-title"
      @keydown.esc="emit('close')"
    >
      <form
        class="w-full max-w-md space-y-4 rounded-xl border border-border bg-raised p-6 shadow-2xl"
        @submit.prevent="emit('submit', note.trim())"
      >
        <h2 id="review-title" class="text-lg font-semibold">Submit your review</h2>
        <p class="text-sm text-muted">
          Approved files are sent to the team for release. You can download them once the team
          approves the release.
        </p>

        <ul class="space-y-2 text-sm">
          <li v-for="row in rows" :key="row.key" class="flex items-center justify-between gap-3">
            <span class="rounded-full px-2.5 py-1 text-xs font-medium text-white" :class="row.cls">
              {{ row.label }}
            </span>
            <span>{{ fileCount(totals[row.key]) }} · {{ row.tail }}</span>
          </li>
        </ul>

        <label class="block space-y-1.5">
          <span class="text-sm">Note for the team (optional)</span>
          <textarea
            v-model="note"
            rows="3"
            class="w-full resize-none rounded-md border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>

        <p v-if="totals.pending > 0" class="text-sm text-warning" role="status">
          Approve or reject the {{ fileCount(totals.pending) }} still in review before submitting.
        </p>

        <div class="flex items-center justify-end gap-3">
          <button type="button" class="cursor-pointer px-3 py-2 text-sm" @click="emit('close')">
            Cancel
          </button>
          <button
            type="submit"
            :disabled="totals.pending > 0"
            class="cursor-pointer rounded-md bg-white px-4 py-2 text-sm font-medium text-canvas disabled:cursor-not-allowed disabled:opacity-40"
          >
            Submit review
          </button>
        </div>
      </form>
    </div>
  </Teleport>
</template>