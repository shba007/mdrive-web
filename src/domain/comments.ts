/** "just now", "5m ago", "2h ago", "3d ago", else a short date. */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const seconds = Math.max(0, Math.round((now - then) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(then).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}

const round1 = (n: number) => Math.round(n * 10) / 10

/** Pointer position inside a rect as clamped percentages with one decimal. */
export function toPercent(
  point: { x: number; y: number },
  rect: { left: number; top: number; width: number; height: number },
): { x: number; y: number } {
  const clamp = (v: number) => Math.min(100, Math.max(0, v))
  return {
    x: round1(clamp(((point.x - rect.left) / rect.width) * 100)),
    y: round1(clamp(((point.y - rect.top) / rect.height) * 100)),
  }
}

export const ZOOM_MIN = 1
export const ZOOM_MAX = 3
export const ZOOM_STEP = 0.5

export function nextZoom(current: number, direction: 1 | -1): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, current + direction * ZOOM_STEP))
}

/** Role sent with comments until the access page captures one. */
export const DEFAULT_AUTHOR_ROLE = 'Client'