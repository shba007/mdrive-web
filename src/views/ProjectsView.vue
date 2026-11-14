<script setup lang="ts">
import { onMounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import ProjectCard from '@/components/ProjectCard.vue'
import { useProjects } from '@/composables/useProjects'
import { STATUS_FILTERS } from '@/domain/project'

const { projects, totalItems, loading, error, status, search, load } = useProjects()

onMounted(load)
</script>

<template>
  <div class="min-h-screen">
    <AppHeader />

    <main class="space-y-5 px-6 pb-12">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold">Projects</h1>
          <p class="text-xs text-muted">{{ totalItems }} projects</p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <input
            v-model="search"
            type="search"
            placeholder="Search projects"
            aria-label="Search projects"
            class="w-60 rounded-md border border-border bg-raised px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <div class="flex rounded-lg border border-border p-1" role="tablist">
            <button
              v-for="filter in STATUS_FILTERS"
              :key="filter"
              type="button"
              role="tab"
              :aria-selected="status === filter"
              class="cursor-pointer rounded-md px-3 py-1 text-sm"
              :class="status === filter ? 'bg-border text-white' : 'text-muted hover:text-white'"
              @click="status = filter"
            >
              {{ filter }}
            </button>
          </div>
        </div>
      </div>

      <p v-if="error" class="rounded-md border border-danger/50 p-4 text-sm text-danger">
        {{ error }}
        <button type="button" class="ml-2 cursor-pointer underline" @click="load">Retry</button>
      </p>

      <p v-else-if="loading && !projects.length" class="text-sm text-muted">Loading projects…</p>

      <p v-else-if="!projects.length" class="text-sm text-muted">No projects found.</p>

      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <ProjectCard v-for="project in projects" :key="project.id" :project="project" />
      </div>
    </main>
  </div>
</template>