import { request } from './http'

export interface UploadFileInput {
  filename: string
  mimeType: string
  sizeBytes: number
}

export interface UploadTarget {
  /** Server-assigned name (naming convention), not the original filename */
  filename: string
  uploadId: string
  /** Presigned R2 URL, accepts a PUT with the file's Content-Type */
  uploadUrl: string
}

export interface UploadBatch {
  batchId: string
  uploads: UploadTarget[]
}

export type UploadProcessStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface BatchStatus {
  projectId: string
  uploads: {
    uploadId: string
    filename: string
    status: UploadProcessStatus
    progressPercent: number
    mediaId: string | null
    error: string | null
  }[]
}

export const uploadsApi = {
  createBatch: (projectId: string, files: UploadFileInput[], signal?: AbortSignal) =>
    request<UploadBatch>('/media/uploads', { method: 'POST', body: { projectId, files }, signal }),

  batchStatus: (batchId: string, signal?: AbortSignal) =>
    request<BatchStatus>(`/media/uploads/${encodeURIComponent(batchId)}`, { signal }),
}

/** PUT a file to a presigned URL with progress (fetch cannot report upload progress). */
export function putFile(
  url: string,
  file: File,
  mimeType: string,
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', mimeType)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status})`))
    xhr.onerror = () => reject(new Error('Upload failed. Check your connection.'))
    xhr.onabort = () => reject(new DOMException('Aborted', 'AbortError'))
    signal?.addEventListener('abort', () => xhr.abort(), { once: true })
    xhr.send(file)
  })
}