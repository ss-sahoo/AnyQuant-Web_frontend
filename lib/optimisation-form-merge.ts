// Per-param merge of a freshly fetched optimisation_form against whatever is
// already in localStorage. Without this, every revisit of the Strategy Tester
// overwrites the user's edited start/step/stop ranges with the backend's
// reconstruction — which, for `optimise: false` params, doesn't carry those
// edits at all (the strategy JSON only stores the bare scalar default for
// non-optimise params; see applyEdits in optimisation-form-persistence.ts).
//
// Merge rules per param (matched by paramMatchKey, never by `id`):
//   - If the saved param has a numeric `range` or `step` or `default` that
//     differs from the backend's, the saved values win (they reflect the
//     user's intent).
//   - All other fields (name, indicator, encoding, optimise flag, type, etc.)
//     come from the backend — the backend is authoritative on the param's
//     shape; the user only edits the numeric range.
//   - Params present only in the backend response are appended as-is.
//   - Params present only in the saved form (stale) are dropped — the strategy
//     may no longer carry that parameter.
//   - A param the optimiser cannot search (canOptimiseParam) is never ticked.
//   - A whole-number param (isWholeNumberParam) gets a whole-number range.

import { BBANDS_OPTIMISABLE_PARAMS } from "./indicator-contract"

export interface OptimisationFormParam {
  id: string
  encoding?: string
  name?: string
  indicator?: string
  type?: string
  default?: number | string
  range?: [number, number] | number[]
  step?: number
  optimise?: boolean
  [key: string]: any
}

export interface OptimisationFormShape {
  parameters?: OptimisationFormParam[]
  [key: string]: any
}

/**
 * Can the optimiser search this row? Text rows never can. Of a BBANDS block's
 * keys only Length and the deviation are searched: the engine pops `offset`
 * before the optimiser's lookup, so ticking it sweeps nothing.
 */
export function canOptimiseParam(p: { type?: string; indicator?: string; name?: string }): boolean {
  if (p.type != null && p.type !== "number") return false
  if (p.indicator === "BBANDS") return (BBANDS_OPTIMISABLE_PARAMS as readonly string[]).includes(String(p.name))
  return true
}

// Encodings of input_params keys end in the key's position among the block's
// sorted keys (param_0_2_timeperiod_4), and the row `id` is built from that
// position too. Adding or dropping a key moves every later position, so
// matching on either carried one setting's saved value onto another (a stale
// form wrote source: "2" and timeperiod: 0). The key name stays in the match.
const POSITION_INDEXED = /^(?:param_\d+_[12]|Equity_\d+_[12]|behavior|tm)_.+_\d+$/

export function paramMatchKey(p: OptimisationFormParam): string {
  const enc = p.encoding
  if (typeof enc !== "string" || !enc) return `id:${p.id}`
  return POSITION_INDEXED.test(enc) ? enc.replace(/_\d+$/, "") : enc
}

/**
 * Does the engine read this param as a whole number of bars? A fractional
 * range is truncated into duplicate candidates: the backend's default for a
 * Length of 25 (12.5 … 37.5, step 2.5) runs 12, 15, 17, 20 … Only Bollinger's
 * Length so far.
 */
export function isWholeNumberParam(p: { indicator?: string; name?: string }): boolean {
  return p.indicator === "BBANDS" && p.name === "timeperiod"
}

/** Round a range to whole numbers: start at least 2 (the shortest Length the
 *  builder allows), step at least 1, stop no lower than start. */
export function wholeNumberRange(start: number, step: number, stop: number) {
  const s = Math.max(2, Math.round(start))
  return { start: s, step: Math.max(1, Math.round(step)), stop: Math.max(s, Math.round(stop)) }
}

function searchableOnly(p: OptimisationFormParam): OptimisationFormParam {
  return p.optimise && !canOptimiseParam(p) ? { ...p, optimise: false } : p
}

function wholeNumberRanges(p: OptimisationFormParam): OptimisationFormParam {
  if (!isWholeNumberParam(p)) return p
  const [start, stop] = Array.isArray(p.range) && p.range.length === 2 ? p.range : []
  if (!Number.isFinite(start) || !Number.isFinite(stop)) return p
  const step = typeof p.step === "number" && Number.isFinite(p.step) ? p.step : 1
  const r = wholeNumberRange(start, step, stop)
  return { ...p, range: [r.start, r.stop], step: r.step }
}

/**
 * Returns a new optimisation_form whose param array is the per-param merge of
 * `incoming` (backend) against `saved` (localStorage). Top-level fields come
 * from `incoming` so the user always sees the backend's latest non-param
 * settings (maximise_options, algorithm_defaults, etc.).
 */
export function mergeOptimisationForm(
  incoming: OptimisationFormShape,
  saved: OptimisationFormShape | null | undefined,
): OptimisationFormShape {
  if (!Array.isArray(incoming.parameters)) return incoming
  const incomingParams = incoming.parameters.map(searchableOnly)
  if (!saved || !Array.isArray(saved.parameters)) {
    return { ...incoming, parameters: incomingParams.map(wholeNumberRanges) }
  }

  const savedByKey = new Map<string, OptimisationFormParam>()
  for (const p of saved.parameters) {
    if (p && (p.encoding || p.id)) savedByKey.set(paramMatchKey(p), p)
  }

  const mergedParams = incomingParams.map((bp) => {
    const sp = savedByKey.get(paramMatchKey(bp))
    if (!sp) return bp

    const out: OptimisationFormParam = { ...bp }

    // Preserve saved range when present and numerically valid — the backend's
    // reconstruction doesn't carry start/stop for `optimise: false` params, so
    // without this the user's edit gets clobbered.
    if (
      Array.isArray(sp.range) &&
      sp.range.length === 2 &&
      sp.range.every((n) => typeof n === "number" && Number.isFinite(n))
    ) {
      out.range = sp.range as [number, number]
    }

    if (typeof sp.step === "number" && Number.isFinite(sp.step)) {
      out.step = sp.step
    }

    if (sp.default !== undefined && sp.default !== "") {
      out.default = sp.default
    }

    return out
  })

  return { ...incoming, parameters: mergedParams.map(wholeNumberRanges) }
}
