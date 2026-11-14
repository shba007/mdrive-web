export const MAX_FILE_BYTES = 4 * 1024 ** 3
export const ACCEPT = 'image/jpeg,image/png,video/mp4,video/quicktime'
export const ACCEPTED_LABEL = 'JPG, PNG, MP4, MOV · 4 GB max each'

const ALLOWED = new Set(['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime'])
const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
}

/** Browser-reported type, falling back to the extension (some OSes leave it empty). */
export function resolveMimeType(file: Pick<File, 'name' | 'type'>): string {
  if (file.type) return file.type
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return EXT_MIME[ext] ?? ''
}

/** Returns an error message, or null when the file can be uploaded. */
export function validateFile(file: Pick<File, 'name' | 'type' | 'size'>): string | null {
  if (!ALLOWED.has(resolveMimeType(file))) return 'Unsupported file type'
  if (file.size === 0) return 'File is empty'
  if (file.size > MAX_FILE_BYTES) return 'File is larger than 4 GB'
  return null
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[i]}`
}