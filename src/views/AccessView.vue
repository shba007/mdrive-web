<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAccessStore } from '@/stores/access'

const access = useAccessStore()
const router = useRouter()

const form = reactive({
  organizationId: access.organizationId,
  userId: access.userId,
  apiKey: access.apiKey,
})

const canSubmit = computed(
  () => !!form.organizationId.trim() && !!form.userId.trim() && !!form.apiKey.trim(),
)

function submit() {
  if (!canSubmit.value) return
  access.save({ ...form })
  void router.push({ name: 'projects' })
}

function disconnect() {
  access.clear()
  form.organizationId = form.userId = form.apiKey = ''
}
</script>

<template>
  <main class="grid min-h-screen place-items-center px-4">
    <form
      class="w-full max-w-md space-y-5 rounded-xl border border-border bg-raised p-6"
      @submit.prevent="submit"
    >
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

      <p
        v-if="access.rejected"
        class="rounded-md border border-danger/50 p-3 text-sm text-danger"
        role="alert"
      >
        The server rejected these details. Check the API key and try again.
      </p>

      <label class="block space-y-1.5">
        <span class="text-sm">Organization ID</span>
        <input
          v-model="form.organizationId"
          type="text"
          autocomplete="off"
          placeholder="red-cat-pictures-3"
          class="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </label>

      <label class="block space-y-1.5">
        <span class="text-sm">User ID</span>
        <input
          v-model="form.userId"
          type="text"
          autocomplete="off"
          placeholder="Your user id"
          class="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </label>

      <label class="block space-y-1.5">
        <span class="text-sm">API key</span>
        <input
          v-model="form.apiKey"
          type="password"
          autocomplete="off"
          placeholder="x-api-key"
          class="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </label>

      <button
        type="submit"
        :disabled="!canSubmit"
        class="w-full cursor-pointer rounded-lg bg-white px-6 py-2 text-sm font-medium text-canvas disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continue
      </button>
      <button
        v-if="access.isConfigured"
        type="button"
        class="w-full cursor-pointer text-center text-sm text-muted hover:text-white"
        @click="disconnect"
      >
        Disconnect
      </button>
    </form>
  </main>
</template>