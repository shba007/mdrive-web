import { request } from './http'

export interface ProjectSummary {
  id: string
  slug: string
  title: string
  /** ISO date string */
  date: string
  /** Notion status: Shoot, Edit, Delivered, ... */
  status: string
  client?: { name: string; avatar?: string }
  mediaCount: { photo: number; video: number }
  /** Media slugs usable with `previewUrl` */
  previewImages: string[]
}

export interface ProjectList {
  data: ProjectSummary[]
  totalItems: number
}

export interface ProjectListParams {
  status?: string
  search?: string
  page?: number
  limit?: number
}

export const projectsApi = {
  list: (params: ProjectListParams = {}, signal?: AbortSignal) =>
    request<ProjectList>('/projects', { query: { ...params }, signal }),

  get: (projectId: string, signal?: AbortSignal) =>
    request<ProjectDetail>(`/projects/${encodeURIComponent(projectId)}`, { signal }),

  media: (projectId: string, params: MediaListParams = {}, signal?: AbortSignal) =>
    request<MediaList>(`/projects/${encodeURIComponent(projectId)}/media`, {
      query: { ...params },
      signal,
    }),
}

export type MediaType = 'photo' | 'video' | 'audio'
export type MediaStatus = 'plan' | 'pending' | 'approved' | 'rejected' | 'release' | 'archive'

export interface ApprovalCounts {
  total: number
  plan: number
  pending: number
  approved: number
  rejected: number
  release: number
  archive: number
}

export interface MediaBreakdown {
  count: number
  storageBytes: number
  humanReadableStorage: string
  approval: ApprovalCounts
}

export interface ProjectDetail {
  id: string
  name: string
  status: string
  createdAt: string
  updatedAt: string
  mediaSummary: {
    totals: { count: number; storageBytes: number; humanReadableStorage: string }
    breakdown: Record<MediaType, MediaBreakdown>
  }
}

export interface MediaItem {
  id: string
  url: string
  filename: string
  status: MediaStatus
  type: MediaType
  metadata: { resolution?: string; aspectRatio?: string }
}

export interface MediaList {
  data: MediaItem[]
  totalItems: number
}

export interface MediaListParams {
  status?: MediaStatus
  sort?: 'date_desc' | 'date_asc'
  page?: number
  limit?: number
}