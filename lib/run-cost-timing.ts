// Cost and timing of one optimisation run (regular or walk-forward, local or
// on a droplet), read the same way from whichever payload the view holds.
//
// - A cloud run is an OptimizationJob: costs are its own, its start is when it
//   was submitted (`created_at`), and its total runs to `completed_at`, so the
//   droplet's boot time counts. `runtime_minutes` is not used: it is truncated
//   to whole minutes (a 40 s job reads 0) and starts at droplet boot.
// - A local run is an OptimizationResult / WalkForwardOptimizationResult: the
//   row is created as the run starts (`optimization_date`) and
//   `execution_time_seconds` is written when it ends. It runs on the app
//   server, so it has no droplet cost.

export interface RunCostTiming {
  local: boolean
  estimatedCost: number | null
  actualCost: number | null
  /** ISO timestamp, or null when unknown. */
  startedAt: string | null
  /** Null while unknown; for a run still going, the view shows elapsed time. */
  durationSeconds: number | null
  running: boolean
}

const ACTIVE = ['pending', 'creating', 'creating_droplet', 'running', 'started', 'in_progress', 'queued']

const toNumber = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

const secondsBetween = (from: string | null | undefined, to: string | null | undefined): number | null => {
  if (!from || !to) return null
  const ms = new Date(to).getTime() - new Date(from).getTime()
  return Number.isFinite(ms) && ms >= 0 ? ms / 1000 : null
}

const isRunning = (status: any) => ACTIVE.includes(String(status || '').toLowerCase().replace(/ /g, '_'))

/** From an optimisation job: the job record, job-status, or a cloud walk-forward detail. */
export function runCostTimingFromJob(job: any): RunCostTiming {
  const startedAt = job?.created_at || job?.optimization_date || job?.started_at || null
  const running = isRunning(job?.status)
  const exact = secondsBetween(startedAt, job?.completed_at)
  return {
    local: false,
    estimatedCost: toNumber(job?.estimated_cost),
    // Settled when the job ends; before that the column holds its 0 default.
    actualCost: running ? null : toNumber(job?.actual_cost),
    startedAt,
    durationSeconds: running ? null : exact ?? toNumber(job?.execution_time_seconds),
    running,
  }
}

/** From a local run's result row (or a just-finished run's own clock). */
export function runCostTimingFromLocal(result: any): RunCostTiming {
  const running = isRunning(result?.status)
  return {
    local: true,
    estimatedCost: null,
    actualCost: null,
    startedAt: result?.optimization_date || result?.created_at || null,
    durationSeconds: running ? null : toNumber(result?.execution_time_seconds ?? result?.elapsed_seconds),
    running,
  }
}

export function formatCost(value: number | null): string {
  if (value === null) return '-'
  // Short droplet runs cost fractions of a cent, which toFixed(2) shows as $0.00.
  return `$${value.toFixed(value !== 0 && Math.abs(value) < 0.01 ? 4 : 2)}`
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return '-'
  const total = Math.round(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

/** Calendar date and time in the viewer's own timezone. */
export function formatStart(iso: string | null): string {
  if (!iso) return '-'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString()
}
