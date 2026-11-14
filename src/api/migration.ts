import type { MigrationPlan } from '@/domain/migration'

export interface MigrationProgress {
  moved: number
  total: number
  done: boolean
}

/** Per-kind file counts used by the mock. Replace with the real estimate endpoint. */
const MOCK_FILES_PER_KIND = 120

/**
 * MOCK: code-drive has no migration endpoints yet (see docs/api-contract-proposals.md).
 * It simulates a run client-side. Returns a function that cancels the run.
 */
export const migrationApi = {
  estimate(plan: MigrationPlan): { files: number } {
    return { files: plan.kinds.length * MOCK_FILES_PER_KIND }
  },

  run(plan: MigrationPlan, onProgress: (p: MigrationProgress) => void, stepMs = 300): () => void {
    const total = this.estimate(plan).files
    let moved = 0
    const timer = setInterval(() => {
      moved = Math.min(total, moved + Math.ceil(total / 12))
      const done = moved >= total
      onProgress({ moved, total, done })
      if (done) clearInterval(timer)
    }, stepMs)
    return () => clearInterval(timer)
  },
}