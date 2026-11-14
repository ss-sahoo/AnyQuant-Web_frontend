// Market Simulation V2 (robust optimisation) settings: the scoring fields
// POST /api/run-robust-optimisation/ takes. Bounds mirror the backend's
// (_robust_scoring in accountAPIs/views.py, cloud limits).

export interface RobustOptimisationSettings {
  alpha: number
  n_paths: number
  seed: number
  zero_drift: boolean
  time_budget_seconds: number
}

/** The form's raw inputs, as typed. */
export interface RobustOptimisationInputs {
  alpha: string
  n_paths: string
  seed: string
  zero_drift: boolean
  time_budget_seconds: string
}

export const ROBUST_DEFAULT_INPUTS: RobustOptimisationInputs = {
  alpha: "0.5",
  n_paths: "50",
  seed: "42",
  zero_drift: false,
  time_budget_seconds: "1500",
}

export const ROBUST_BUDGET_MIN = 60
export const ROBUST_BUDGET_MAX = 10000
export const ROBUST_PATHS_MIN = 10
export const ROBUST_PATHS_MAX = 200

const isInteger = (raw: string) => /^-?\d+$/.test(raw.trim())

/** `{ settings }` when every field is in range, else `{ error }` naming the first bad one. */
export function parseRobustInputs(
  inputs: RobustOptimisationInputs,
): { settings: RobustOptimisationSettings; error?: undefined } | { settings?: undefined; error: string } {
  const alpha = Number(inputs.alpha)
  if (inputs.alpha.trim() === "" || !Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
    return { error: "Alpha must be a number between 0 and 1" }
  }
  const nPaths = Number(inputs.n_paths)
  if (!isInteger(inputs.n_paths) || nPaths < ROBUST_PATHS_MIN || nPaths > ROBUST_PATHS_MAX) {
    return { error: `Paths must be a whole number between ${ROBUST_PATHS_MIN} and ${ROBUST_PATHS_MAX}` }
  }
  if (!isInteger(inputs.seed)) return { error: "Seed must be a whole number" }
  const budget = Number(inputs.time_budget_seconds)
  if (!isInteger(inputs.time_budget_seconds) || budget < ROBUST_BUDGET_MIN || budget > ROBUST_BUDGET_MAX) {
    return { error: `Time budget must be a whole number of seconds between ${ROBUST_BUDGET_MIN} and ${ROBUST_BUDGET_MAX.toLocaleString()}` }
  }
  return {
    settings: {
      alpha,
      n_paths: nPaths,
      seed: Number(inputs.seed),
      zero_drift: inputs.zero_drift,
      time_budget_seconds: budget,
    },
  }
}
