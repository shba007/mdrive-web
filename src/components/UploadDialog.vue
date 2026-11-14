<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { useUploader, type UploadEntry } from '@/composables/useUploader'
import { ACCEPT, ACCEPTED_LABEL, formatBytes } from '@/domain/upload'

const props = defineProps<{ open: boolean; projectId: string; projectName: string }>()
const emit = defineEmits<{ close: []; uploaded: [] }>()

const uploader = useUploader(toRef(props, 'projectId'))
const { entries, pending, running, finished, hasUploaded, rejected } = uploader

const input = ref<HTMLInputElement>()
const dragging = ref(false)

const hasFailed = computed(() => entries.value.some((e) => e.status === 'failed'))
const primaryLabel = computed(() => {
  if (running.value) return 'Uploading…'
  if (pending.value.length) return `Upload ${pending.value.length}`
  if (hasFailed.value) return 'Retry failed'
  return finished.value ? 'Done' : 'Upload'
})
const primaryDisabled = computed(
  () => running.value || (!pending.value.length && !hasFailed.value && !finished.value),
)

function onPick(e: Event) {
  const el = e.target as HTMLInputElement
  uploader.add([...(el.files ?? [])])
  el.value = ''
}

function onDrop(e: DragEvent) {
  dragging.value = false
  uploader.add([...(e.dataTransfer?.files ?? [])])
}

function chip(entry: UploadEntry): { text: string; cls: string } {
  switch (entry.status) {
    case 'ready':
      return { text: 'Ready', cls: 'bg-border-strong' }
    case 'uploading':
      return { text: `Uploading ${entry.progress}%`, cls: 'bg-info' }
    case 'processing':
      return { text: 'Processing', cls: 'bg-info' }
    case 'done':
      return { text: 'Uploaded', cls: 'bg-success' }
    default:
      return { text: 'Upload failed', cls: 'bg-danger' }
  }
}

function actionFor(entry: UploadEntry): { label: string; run: () => void } | null {
  if (entry.status === 'failed') return { label: 'Retry', run: () => void uploader.retry(entry) }
  if (entry.status === 'uploading') return { label: 'Cancel', run: () => uploader.remove(entry) }
  if (entry.status === 'processing') return null
  return { label: 'Remove', run: () => uploader.remove(entry) }
}

function primary() {
  if (pending.value.length || hasFailed.value) return void uploader.start()
  finish()
}

function finish() {
  if (hasUploaded.value) emit('uploaded')
  close()
}

function close() {
  uploader.reset()
  emit('close')
}

watch(
  () => props.open,
  (open) => {
    if (!open) uploader.reset()
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
      aria-labelledby="upload-title"
      @keydown.esc="close"
    >
      <div class="w-full max-w-xl rounded-xl border border-border bg-raised shadow-2xl">
        <div class="relative px-6 pt-6 text-center">
          <h2 id="upload-title" class="text-lg font-semibold">Upload media</h2>
          <p class="mt-1 text-sm text-muted">Add photos and videos to {{ projectName }}.</p>
          <button
            type="button"
            class="absolute top-4 right-4 cursor-pointer text-muted hover:text-white"
            aria-label="Close"
            @click="close"
          >
            ✕
          </button>
        </div>

        <div class="space-y-3 px-6 py-5">
          <div
            class="grid place-items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center"
            :class="dragging ? 'border-primary bg-primary/10' : 'border-border-strong bg-canvas'"
            @dragover.prevent="dragging = true"
            @dragleave="dragging = false"
            @drop.prevent="onDrop"
          >
            <p class="text-sm font-medium">Drag and drop media to upload</p>
            <p class="text-xs text-muted">or, click to browse ({{ ACCEPTED_LABEL }})</p>
            <button
              type="button"
              class="mt-1 cursor-pointer rounded-md border border-border-strong px-4 py-2 text-sm hover:bg-raised"
              @click="input?.click()"
            >
              Select files
            </button>
            <input
              ref="input"
              type="file"
              multiple
              :accept="ACCEPT"
              class="hidden"
              data-test="file-input"
              @change="onPick"
            />
          </div>

          <ul v-if="rejected.length" class="space-y-0.5 text-xs text-danger">
            <li v-for="line in rejected" :key="line">{{ line }}</li>
          </ul>

          <ul v-if="entries.length" class="max-h-64 space-y-2 overflow-y-auto">
            <li
              v-for="entry in entries"
              :key="entry.key"
              class="space-y-1.5 rounded-lg border border-border px-4 py-3"
            >
              <div class="flex items-center gap-3">
                <span class="min-w-0 flex-1 truncate text-sm">{{ entry.file.name }}</span>
                <span class="text-xs text-muted">{{ formatBytes(entry.file.size) }}</span>
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-medium text-white"
                  :class="chip(entry).cls"
                >
                  {{ chip(entry).text }}
                </span>
                <button
                  v-if="actionFor(entry)"
                  type="button"
                  class="cursor-pointer text-sm text-muted hover:text-white"
                  @click="actionFor(entry)!.run()"
                >
                  {{ actionFor(entry)!.label }}
                </button>
              </div>
              <div
                v-if="entry.status === 'uploading'"
                class="h-1 overflow-hidden rounded bg-border"
                role="progressbar"
                :aria-valuenow="entry.progress"
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div
                  class="h-full bg-primary transition-[width]"
                  :style="{ width: `${entry.progress}%` }"
                />
              </div>
              <p v-if="entry.error" class="text-xs text-danger">{{ entry.error }}</p>
            </li>
          </ul>
        </div>

        <div class="flex items-center justify-between border-t border-border px-6 py-4">
          <button
            type="button"
            class="cursor-pointer rounded-md border border-border-strong px-4 py-2 text-sm hover:bg-canvas"
            @click="close"
          >
            Cancel
          </button>
          <button
            type="button"
            :disabled="primaryDisabled"
            class="cursor-pointer rounded-md bg-white px-4 py-2 text-sm font-medium text-canvas disabled:cursor-not-allowed disabled:opacity-40"
            @click="primary"
          >
            {{ primaryLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>