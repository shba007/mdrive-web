<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { MediaItem } from '@/api/projects'
import { useComments } from '@/composables/useComments'
import { initial, nextZoom, timeAgo, toPercent, ZOOM_MAX, ZOOM_MIN } from '@/domain/comments'
import type { ReviewDecision } from '@/api/media'
import RejectDialog from '@/components/RejectDialog.vue'
import IconCheck from '~icons/lucide/check'
import IconChevronLeft from '~icons/lucide/chevron-left'
import IconChevronRight from '~icons/lucide/chevron-right'
import IconDownload from '~icons/lucide/download'
import IconMaximize from '~icons/lucide/maximize'
import IconX from '~icons/lucide/x'
import IconZoomIn from '~icons/lucide/zoom-in'
import IconZoomOut from '~icons/lucide/zoom-out'
import {
  canDownload,
  canReview,
  mediaStatusLabel,
  mediaStatusTone,
  nextStatus,
} from '@/domain/media'

const props = defineProps<{ items: MediaItem[]; mediaId: string; projectName: string }>()
const emit = defineEmits<{
  close: []
  select: [id: string]
  decide: [id: string, status: ReviewDecision]
  download: [id: string]
}>()

const index = computed(() => props.items.findIndex((i) => i.id === props.mediaId))
const current = computed(() => props.items[index.value])
const currentId = computed(() => current.value?.id)

const { comments, loading, posting, error, post } = useComments(currentId)

const zoom = ref(1)
const stage = ref<HTMLElement>()
const pending = ref<{ x: number; y: number } | null>(null)
const draft = ref('')
const replyTo = ref<string | null>(null)
const replyDraft = ref('')
const rejectOpen = ref(false)

watch(currentId, () => {
  zoom.value = 1
  pending.value = null
  draft.value = ''
  replyTo.value = null
  rejectOpen.value = false
})

const pins = computed(() => comments.value.filter((c) => c.coordinates))

const toneClass = computed(() =>
  current.value
    ? {
        info: 'bg-info',
        success: 'bg-success',
        danger: 'bg-danger',
        neutral: 'bg-border-strong',
      }[mediaStatusTone(current.value.status)]
    : '',
)

const extension = computed(() => current.value?.filename.split('.').pop()?.toUpperCase() ?? '')

function decide(decision: 'approved' | 'rejected') {
  if (!current.value) return
  // A new rejection needs a reason; undoing one goes straight back to pending.
  if (decision === 'rejected' && current.value.status !== 'rejected') {
    rejectOpen.value = true
    return
  }
  emit('decide', current.value.id, nextStatus(current.value.status, decision))
}

/** Posts the reason as a comment so the team sees it, then rejects the file. */
async function submitRejection(reason: string) {
  if (!current.value) return
  if (await post(reason)) {
    rejectOpen.value = false
    emit('decide', current.value.id, 'rejected')
  }
}

function go(step: 1 | -1) {
  const next = props.items[index.value + step]
  if (next) emit('select', next.id)
}

function placePin(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return
  pending.value = toPercent({ x: e.clientX, y: e.clientY }, rect)
}

async function submitComment() {
  if (await post(draft.value, { coordinates: pending.value })) {
    draft.value = ''
    pending.value = null
  }
}

async function submitReply(parentId: string) {
  if (await post(replyDraft.value, { parentId })) {
    replyDraft.value = ''
    replyTo.value = null
  }
}

function onKey(e: KeyboardEvent) {
  const target = e.target as HTMLElement
  if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
    if (e.key === 'Escape') target.blur()
    return
  }
  if (e.key === 'Escape') emit('close')
  else if (e.key === 'ArrowRight') go(1)
  else if (e.key === 'ArrowLeft') go(-1)
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  document.body.style.overflow = 'hidden'
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <div
    v-if="current"
    class="fixed inset-0 z-40 flex flex-col bg-canvas"
    role="dialog"
    aria-modal="true"
    :aria-label="current.filename"
  >
    <div class="flex items-center justify-between px-5 py-4 text-sm">
      <button
        type="button"
        class="flex cursor-pointer items-center gap-2 hover:text-muted"
        @click="emit('close')"
      >
        <IconX aria-hidden="true" /> Close
      </button>
      <span class="text-muted">{{ projectName }} · {{ index + 1 }} / {{ items.length }}</span>
    </div>

    <div class="flex min-h-0 flex-1 flex-col gap-4 px-5 pb-5 lg:flex-row">
      <!-- Filmstrip -->
      <ul class="hidden w-28 shrink-0 space-y-2 overflow-y-auto md:block" aria-label="Media">
        <li v-for="item in items" :key="item.id">
          <button
            type="button"
            class="block w-full cursor-pointer overflow-hidden rounded-lg border-2"
            :class="item.id === current.id ? 'border-primary' : 'border-transparent opacity-70'"
            :aria-label="item.filename"
            :aria-current="item.id === current.id"
            @click="emit('select', item.id)"
          >
            <img :src="item.url" alt="" loading="lazy" class="aspect-[4/3] w-full object-cover" />
          </button>
        </li>
      </ul>

      <!-- Stage -->
      <div class="relative flex min-w-0 flex-1 flex-col rounded-xl bg-[#222226]">
        <div class="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4">
          <div
            ref="stage"
            class="relative inline-block cursor-crosshair"
            :style="{ transform: `scale(${zoom})`, transformOrigin: 'center' }"
            data-test="stage"
            @click="placePin"
          >
            <img
              :src="current.url"
              :alt="current.filename"
              class="block max-h-[55vh] max-w-full select-none lg:max-h-[70vh]"
              draggable="false"
            />
            <span
              v-for="c in pins"
              :key="c.commentId"
              class="absolute grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white bg-black text-xs font-medium"
              :style="{ left: `${c.coordinates!.x}%`, top: `${c.coordinates!.y}%` }"
              :title="c.text"
              data-test="pin"
            >
              {{ initial(c.author.name) }}
            </span>
            <span
              v-if="pending"
              class="absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-primary bg-primary/30"
              :style="{ left: `${pending.x}%`, top: `${pending.y}%` }"
              data-test="pending-pin"
            />
          </div>
        </div>

        <div class="flex justify-center pb-4">
          <div
            class="flex items-center gap-1 rounded-full border border-border bg-canvas px-3 py-2 text-sm"
          >
            <button
              type="button"
              class="cursor-pointer px-2 hover:text-muted disabled:opacity-30"
              :disabled="index <= 0"
              aria-label="Previous"
              @click="go(-1)"
            >
              <IconChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              class="cursor-pointer px-2 hover:text-muted disabled:opacity-30"
              :disabled="index >= items.length - 1"
              aria-label="Next"
              @click="go(1)"
            >
              <IconChevronRight aria-hidden="true" />
            </button>
            <span class="mx-1 h-4 w-px bg-border" />
            <button
              type="button"
              class="cursor-pointer px-2 hover:text-muted disabled:opacity-30"
              :disabled="zoom <= ZOOM_MIN"
              aria-label="Zoom out"
              @click="zoom = nextZoom(zoom, -1)"
            >
              <IconZoomOut aria-hidden="true" />
            </button>
            <button
              type="button"
              class="cursor-pointer px-2 hover:text-muted disabled:opacity-30"
              :disabled="zoom >= ZOOM_MAX"
              aria-label="Zoom in"
              @click="zoom = nextZoom(zoom, 1)"
            >
              <IconZoomIn aria-hidden="true" />
            </button>
            <button
              type="button"
              class="cursor-pointer px-2 hover:text-muted"
              aria-label="Fit to screen"
              title="Fit to screen"
              @click="zoom = 1"
            >
              <IconMaximize aria-hidden="true" />
            </button>
            <span class="mx-1 h-4 w-px bg-border" />
            <button
              type="button"
              class="cursor-pointer px-2 hover:text-muted disabled:cursor-not-allowed disabled:opacity-30"
              :disabled="!canDownload(current.status)"
              :title="canDownload(current.status) ? 'Download' : 'Available once released'"
              aria-label="Download"
              @click="emit('download', current.id)"
            >
              <IconDownload aria-hidden="true" />
            </button>
            <template v-if="canReview(current.status)">
              <button
                type="button"
                class="cursor-pointer rounded-full px-2.5 py-1 hover:bg-danger/20"
                :class="current.status === 'rejected' ? 'bg-danger text-white' : 'text-danger'"
                :aria-pressed="current.status === 'rejected'"
                aria-label="Not approved"
                @click="decide('rejected')"
              >
                <IconX aria-hidden="true" />
              </button>
              <button
                type="button"
                class="cursor-pointer rounded-full px-2.5 py-1"
                :class="
                  current.status === 'approved'
                    ? 'bg-primary text-white'
                    : 'text-white hover:bg-primary/30'
                "
                :aria-pressed="current.status === 'approved'"
                aria-label="Approve"
                @click="decide('approved')"
              >
                <IconCheck aria-hidden="true" />
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- Details + activity -->
      <aside
        class="flex w-full shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-raised max-lg:max-h-[45vh] lg:w-80"
      >
        <div class="space-y-4 overflow-y-auto p-5">
          <div class="flex items-start justify-between gap-2">
            <h2 class="min-w-0 break-words text-lg font-semibold">{{ current.filename }}</h2>
            <span
              class="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium text-white"
              :class="toneClass"
            >
              {{ mediaStatusLabel(current.status) }}
            </span>
          </div>

          <dl class="space-y-2 text-sm">
            <div class="flex justify-between gap-4">
              <dt class="text-muted">Type</dt>
              <dd class="capitalize">{{ current.type }}</dd>
            </div>
            <div v-if="extension" class="flex justify-between gap-4">
              <dt class="text-muted">Format</dt>
              <dd>{{ extension }}</dd>
            </div>
            <div v-if="current.metadata.resolution" class="flex justify-between gap-4">
              <dt class="text-muted">Resolution</dt>
              <dd>{{ current.metadata.resolution }}</dd>
            </div>
            <div v-if="current.metadata.aspectRatio" class="flex justify-between gap-4">
              <dt class="text-muted">Aspect ratio</dt>
              <dd>{{ current.metadata.aspectRatio }}</dd>
            </div>
          </dl>

          <section aria-labelledby="activity-title" class="space-y-3">
            <h3 id="activity-title" class="text-sm font-medium">
              Activity Timeline · {{ comments.length }}
            </h3>
            <p v-if="loading && !comments.length" class="text-xs text-muted">Loading…</p>
            <p v-else-if="!comments.length" class="text-xs text-muted">
              No comments yet. Click the image to pin one.
            </p>
            <ul class="space-y-4">
              <li v-for="c in comments" :key="c.commentId" class="space-y-2" data-test="comment">
                <div class="flex gap-3">
                  <span
                    class="grid size-6 shrink-0 place-items-center rounded-full border border-white text-xs"
                  >
                    {{ initial(c.author.name) }}
                  </span>
                  <div class="min-w-0 text-sm">
                    <p class="text-xs text-muted">
                      {{ c.author.name }} · {{ c.author.role }} · {{ timeAgo(c.createdAt) }}
                    </p>
                    <p class="break-words">{{ c.text }}</p>
                    <button
                      type="button"
                      class="cursor-pointer text-xs text-muted hover:text-white"
                      @click="replyTo = replyTo === c.commentId ? null : c.commentId"
                    >
                      Reply
                    </button>
                  </div>
                </div>
                <ul v-if="c.replies.length" class="ml-9 space-y-2 border-l border-border pl-3">
                  <li v-for="r in c.replies" :key="r.commentId" class="text-sm">
                    <p class="text-xs text-muted">
                      {{ r.author.name }} · {{ r.author.role }} · {{ timeAgo(r.createdAt) }}
                    </p>
                    <p class="break-words">{{ r.text }}</p>
                  </li>
                </ul>
                <form
                  v-if="replyTo === c.commentId"
                  class="ml-9 flex gap-2"
                  @submit.prevent="submitReply(c.commentId)"
                >
                  <input
                    v-model="replyDraft"
                    type="text"
                    placeholder="Write a reply"
                    aria-label="Reply"
                    class="min-w-0 flex-1 rounded-md border border-border bg-canvas px-2 py-1 text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    :disabled="posting || !replyDraft.trim()"
                    class="cursor-pointer text-sm disabled:opacity-40"
                  >
                    Send
                  </button>
                </form>
              </li>
            </ul>
          </section>
        </div>

        <form class="mt-auto space-y-2 border-t border-border p-4" @submit.prevent="submitComment">
          <p v-if="error" class="text-xs text-danger">{{ error }}</p>
          <p v-if="pending" class="flex items-center justify-between text-xs text-muted">
            Pinned at {{ pending.x }}%, {{ pending.y }}%
            <button type="button" class="cursor-pointer underline" @click="pending = null">
              Remove pin
            </button>
          </p>
          <textarea
            v-model="draft"
            rows="2"
            placeholder="Add a comment"
            aria-label="Comment"
            class="w-full resize-none rounded-md border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            :disabled="posting || !draft.trim()"
            class="w-full cursor-pointer rounded-md bg-white px-4 py-2 text-sm font-medium text-canvas disabled:cursor-not-allowed disabled:opacity-40"
          >
            {{ posting ? 'Posting…' : 'Comment' }}
          </button>
        </form>
      </aside>
    </div>
    <RejectDialog
      :open="rejectOpen"
      :filename="current.filename"
      :posting="posting"
      :error="error"
      @close="rejectOpen = false"
      @submit="submitRejection"
    />
  </div>
</template>