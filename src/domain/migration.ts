export type ProviderId = 'r2' | 's3' | 'gdrive' | 'local'
export type KindId = 'photos' | 'videos' | 'audio' | 'documents'

export interface Provider {
  id: ProviderId
  name: string
  hint: string
}

export const PROVIDERS: Provider[] = [
  { id: 'r2', name: 'Cloudflare R2', hint: 'S3-compatible object storage' },
  { id: 's3', name: 'Amazon S3', hint: 'Buckets in your AWS account' },
  { id: 'gdrive', name: 'Google Drive', hint: 'Folders in My Drive or a shared drive' },
  { id: 'local', name: 'This computer', hint: 'Files picked from a folder on this device' },
]

export const KINDS: { id: KindId; label: string; hint: string }[] = [
  { id: 'photos', label: 'Photos', hint: 'JPG, PNG, HEIC, RAW' },
  { id: 'videos', label: 'Videos', hint: 'MP4, MOV' },
  { id: 'audio', label: 'Audio', hint: 'WAV, MP3' },
  { id: 'documents', label: 'Documents', hint: 'PDF and design files' },
]

/** Wizard steps shown as "Step 2 of 3" in the setup shell: Connect, Storage, Done. */
export const SETUP_STEPS = ['Connect', 'Storage', 'Done'] as const

export interface MigrationPlan {
  source: ProviderId | null
  destination: ProviderId | null
  kinds: KindId[]
}

export function providerName(id: ProviderId | null): string {
  return PROVIDERS.find((p) => p.id === id)?.name ?? ''
}

/** A plan can start once source and destination differ and something is selected. */
export function planError(plan: MigrationPlan): string | null {
  if (!plan.source || !plan.destination) return 'Choose where to move from and where to move to.'
  if (plan.source === plan.destination) return 'Source and destination must be different.'
  if (plan.kinds.length === 0) return 'Choose at least one kind of media to move.'
  return null
}

export function toggleKind(kinds: KindId[], id: KindId): KindId[] {
  return kinds.includes(id) ? kinds.filter((k) => k !== id) : [...kinds, id]
}

/** Progress as a whole percentage, clamped to 0..100. */
export function percent(done: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((done / total) * 100)))
}