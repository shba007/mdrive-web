<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MediaViewer from '@/components/MediaViewer.vue'
import AppHeader from '@/components/AppHeader.vue'
import MediaTile from '@/components/MediaTile.vue'
import UploadDialog from '@/components/UploadDialog.vue'
import { projectsApi } from '@/api/projects'
import { useProjectMedia } from '@/composables/useProjectMedia'
import ReviewDialog from '@/components/ReviewDialog.vue'
import IconChevronLeft from '~icons/lucide/chevron-left'
import SelectionBar from '@/components/SelectionBar.vue'
import {
  REVIEW_TABS,
  canDownload,
  formatProjectLine,
  reviewTotals,
  toggleId,
  type ReviewStatus,
} from '@/domain/media'

const route = useRoute()
const router = useRouter()
const projectId = computed(() => String(route.params.projectId))
const openMediaId = computed(() =>
  typeof route.query.media === 'string' ? route.query.media : undefined,
)

function openMedia(id: string | undefined) {
  const query = { ...route.query }
  if (id) query.media = id
  else delete query.media
  void router.push({ query })
}
const {
  project,
  items,
  loading,
  error,
  actionError,
  status,
  sort,
  counts,
  hasMore,
  load,
  loadMore,
  setStatus,
  download,
  ensureLoaded,
} = useProjectMedia(projectId)

const selected = ref<string[]>([])
/** Only released media can be selected, and only while it is still in the list. */
const selectedIds = computed(() =>
  selected.value.filter((id) => items.value.some((i) => i.id === id && canDownload(i.status))),
)

async function downloadSelected() {
  await download(selectedIds.value)
  selected.value = []
}

const reviewOpen = ref(false)
const notice = ref<string | null>(null)
const totals = computed(() =>
  project.value
    ? reviewTotals(project.value.mediaSummary)
    : { approved: 0, rejected: 0, pending: 0 },
)

/** Decisions are saved per file already; this sends the note and checks nothing is pending. */
async function submitReview(note: string) {
  reviewOpen.value = false
  notice.value = null
  try {
    await projectsApi.submitReview(projectId.value, note)
    notice.value = 'Review sent to the team.'
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : 'Could not submit the review.'
  }
}

onMounted(async () => {
  await load()
  if (openMediaId.value) await ensureLoaded(openMediaId.value)
})

const uploadOpen = ref(false)

function toggleTab(next: ReviewStatus) {
  status.value = status.value === next ? undefined : next
}
</script>

<template>
  <div class="min-h-screen">
    <AppHeader />

    <main class="space-y-5 px-6 pb-12">
      <div>
        <RouterLink
          to="/projects"
          class="inline-flex items-center gap-1 text-sm text-muted hover:text-white"
        >
          <IconChevronLeft aria-hidden="true" /> Projects
        </RouterLink>
        <h1 class="text-2xl font-semibold">{{ project?.name ?? '…' }}</h1>
        <p v-if="project" class="text-xs text-muted">
          {{ formatProjectLine(project.mediaSummary) }}
        </p>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap gap-2" role="tablist">
          <button
            v-for="tab in REVIEW_TABS"
            :key="tab.status"
            type="button"
            role="tab"
            :aria-selected="status === tab.status"
            class="cursor-pointer rounded-full border px-3 py-1 text-xs"
            :class="
              status === tab.status
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-raised text-muted hover:text-white'
            "
            @click="toggleTab(tab.status)"
          >
            {{ tab.label }}<template v-if="counts"> ({{ counts[tab.status] }})</template>
          </button>
        </div>
        <div class="flex items-center gap-4">
          <button
            type="button"
            class="cursor-pointer text-sm text-muted hover:text-white"
            @click="sort = sort === 'date_desc' ? 'date_asc' : 'date_desc'"
          >
            {{ sort === 'date_desc' ? 'Newest first' : 'Oldest first' }}
          </button>
          <button
            type="button"
            class="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm hover:bg-raised"
            @click="reviewOpen = true"
          >
            Submit review
          </button>
          <button
            type="button"
            class="cursor-pointer rounded-lg bg-white px-4 py-2 text-sm font-medium text-canvas"
            @click="uploadOpen = true"
          >
            + New
          </button>
        </div>
      </div>

      <p
        v-if="actionError"
        class="rounded-md border border-danger/50 p-3 text-sm text-danger"
        role="alert"
      >
        {{ actionError }}
      </p>
      <p
        v-if="notice"
        class="flex items-center justify-between rounded-md border border-border bg-raised p-3 text-sm"
        role="status"
      >
        {{ notice }}
        <button
          type="button"
          class="cursor-pointer text-muted hover:text-white"
          @click="notice = null"
        >
          Dismiss
        </button>
      </p>

      <p v-if="error" class="rounded-md border border-danger/50 p-4 text-sm text-danger">
        {{ error }}
        <button type="button" class="ml-2 cursor-pointer underline" @click="load">Retry</button>
      </p>
      <p v-else-if="loading && !items.length" class="text-sm text-muted">Loading media…</p>
      <p v-else-if="!items.length" class="text-sm text-muted">No media found.</p>

      <div v-else class="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
        <MediaTile
          v-for="item in items"
          :key="item.id"
          :item="item"
          :selected="selectedIds.includes(item.id)"
          :selecting="selectedIds.length > 0"
          @toggle="(id) => (selected = toggleId(selected, id))"
          @open="openMedia"
          @download="(id) => download([id])"
        />
      </div>

      <div v-if="hasMore && items.length" class="flex justify-center">
        <button
          type="button"
          :disabled="loading"
          class="cursor-pointer rounded-md border border-border px-4 py-2 text-sm hover:bg-raised disabled:opacity-40"
          @click="loadMore"
        >
          {{ loading ? 'Loading…' : 'Load more' }}
        </button>
      </div>
    </main>

    <MediaViewer
      v-if="openMediaId && items.some((i) => i.id === openMediaId)"
      :items="items"
      :media-id="openMediaId"
      :project-name="project?.name ?? ''"
      @close="openMedia(undefined)"
      @select="openMedia"
      @decide="setStatus"
      @download="(id) => download([id])"
    />

    <SelectionBar :count="selectedIds.length" @clear="selected = []" @download="downloadSelected" />

    <ReviewDialog
      :open="reviewOpen"
      :totals="totals"
      @close="reviewOpen = false"
      @submit="submitReview"
    />

    <UploadDialog
      :open="uploadOpen"
      :project-id="projectId"
      :project-name="project?.name ?? 'this project'"
      @close="uploadOpen = false"
      @uploaded="load"
    />
  </div>
</template>