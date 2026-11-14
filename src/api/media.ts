import { request } from './http'

export type ReviewDecision = 'approved' | 'rejected' | 'pending'

export interface DownloadAsset {
  mediaId: string
  filename: string
  downloadUrl: string
}

export const mediaApi = {
  /** Sets the review status of the given media. */
  setStatus: (mediaIds: string[], status: ReviewDecision, signal?: AbortSignal) =>
    request<{ success: boolean; updatedCount: number }>('/media/action', {
      method: 'POST',
      body: { action: 'approve', mediaIds, params: { status } },
      signal,
    }),

  /** Presigned download URLs (valid for `expiresIn` seconds). */
  downloads: (projectId: string, mediaIds: string[], signal?: AbortSignal) =>
    request<{ assets: DownloadAsset[]; expiresIn: number }>('/media/downloads', {
      method: 'POST',
      body: { projectId, mediaIds },
      signal,
    }),
}