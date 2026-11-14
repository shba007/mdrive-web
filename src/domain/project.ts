import { config } from '@/config'
import type { ProjectSummary } from '@/api/projects'

export const STATUS_FILTERS = ['All', 'Shoot', 'Edit', 'Delivered'] as const
export type StatusFilter = (typeof STATUS_FILTERS)[number]

export type StatusTone = 'info' | 'success' | 'neutral'

export function statusTone(status: string): StatusTone {
  const s = status.toLowerCase()
  if (s === 'delivered') return 'success'
  if (s === 'shoot' || s === 'edit') return 'info'
  return 'neutral'
}

/** "82 photos · 20 videos"; zero counts are omitted, singular handled. */
export function formatMediaCount(count: ProjectSummary['mediaCount']): string {
  const parts: string[] = []
  if (count.photo > 0) parts.push(`${count.photo} ${count.photo === 1 ? 'photo' : 'photos'}`)
  if (count.video > 0) parts.push(`${count.video} ${count.video === 1 ? 'video' : 'videos'}`)
  return parts.length ? parts.join(' · ') : 'No media yet'
}

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : dateFormat.format(date)
}

/** "Acme Studios · 10 May 2026" */
export function formatProjectMeta(project: ProjectSummary): string {
  return [project.client?.name, formatDate(project.date)].filter(Boolean).join(' · ')
}

/** Transformed image served by the MDrive API (public route, IPX args). */
export function previewUrl(slug: string, args = 'w_480&f_auto&q_75'): string {
  return `${config.apiBaseUrl}/media/image/${args}/${encodeURIComponent(slug)}`
}