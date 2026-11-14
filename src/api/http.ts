import { config } from '@/config'
import { useAccessStore } from '@/stores/access'

/** Fired when the API rejects the saved access details (401/403). */
export const UNAUTHORIZED_EVENT = 'mdrive:unauthorized'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type Query = Record<string, string | number | boolean | undefined>

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  query?: Query
  body?: unknown
  signal?: AbortSignal
}

export function apiUrl(path: string, query?: Query): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  const qs = params.toString()
  return `${config.apiBaseUrl}/api${path}${qs ? `?${qs}` : ''}`
}

async function toApiError(response: Response): Promise<ApiError> {
  if (response.status === 401 || response.status === 403) {
    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT))
    return new ApiError(response.status, 'The API key was rejected. Check your access details.')
  }
  let message = response.statusText || `Request failed (${response.status})`
  try {
    const data = (await response.json()) as { statusMessage?: string; message?: string }
    message = data.statusMessage ?? data.message ?? message
  } catch {
    // body was not JSON
  }
  return new ApiError(response.status, message)
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, signal } = options
  const access = useAccessStore()
  const headers: Record<string, string> = {
    'x-api-key': access.apiKey,
    'x-org-id': access.organizationId,
  }
  const init: RequestInit = { method, signal, headers }
  if (body !== undefined) {
    init.body = JSON.stringify(body)
    headers['Content-Type'] = 'application/json'
  }

  let response: Response
  try {
    response = await fetch(apiUrl(path, query), init)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.')
  }
  if (!response.ok) throw await toApiError(response)
  return (await response.json()) as T
}