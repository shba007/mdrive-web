import { request } from './http'

export interface CommentAuthor {
  name: string
  role: string
}

export interface CommentReply {
  commentId: string
  parentId: string | null
  text: string
  coordinates: null
  author: CommentAuthor
  createdAt: string
}

export interface Comment {
  commentId: string
  parentId: null
  text: string
  /** Pin position as percentages (0-100) of the media, or null for a general comment */
  coordinates: { x: number; y: number } | null
  author: CommentAuthor
  createdAt: string
  replies: CommentReply[]
}

export interface NewComment {
  mediaIds: string[]
  text: string
  parentId?: string | null
  coordinates?: { x: number; y: number } | null
  author: CommentAuthor
}

export const commentsApi = {
  query: (mediaIds: string[], signal?: AbortSignal) =>
    request<{ timelines: Record<string, Comment[]> }>('/media/comments/query', {
      method: 'POST',
      body: { mediaIds },
      signal,
    }),

  create: (comment: NewComment, signal?: AbortSignal) =>
    request<{ comments: (Comment | CommentReply)[] }>('/media/comments', {
      method: 'POST',
      body: comment,
      signal,
    }),
}