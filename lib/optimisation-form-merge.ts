// Per-param merge of a freshly fetched optimisation_form against whatever is
// already in localStorage. Without this, every revisit of the Strategy Tester
// overwrites the user's edited start/step/stop ranges with the backend's
// reconstruction — which, for `optimise: false` params, doesn't carry those
// edits at all (the strategy JSON only stores the bare scalar default for
// non-optimise params; see applyEdits in optimisation-form-persistence.ts).
//
// Merge rules per param (matched by `id`):
//   - If the saved param has a numeric `range` or `step` or `default` that
//     differs from the backend's, the saved values win (they reflect the
//     user's intent).
//   - All other fields (name, indicator, encoding, optimise flag, type, etc.)
//     come from the backend — the backend is authoritative on the param's
//     shape; the user only edits the numeric range.
//   - Params present only in the backend response are appended as-is.
//   - Params present only in the saved form (stale) are dropped — the strategy
//     may no longer carry that parameter.

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
 * Returns a new optimisation_form whose param array is the per-id merge of
 * `incoming` (backend) against `saved` (localStorage). Top-level fields come
 * from `incoming` so the user always sees the backend's latest non-param
 * settings (maximise_options, algorithm_defaults, etc.).
 */
export function mergeOptimisationForm(
  incoming: OptimisationFormShape,
  saved: OptimisationFormShape | null | undefined,
): OptimisationFormShape {
  if (!saved || !Array.isArray(saved.parameters)) return incoming
  if (!Array.isArray(incoming.parameters)) return incoming

  const savedById = new Map<string, OptimisationFormParam>()
  for (const p of saved.parameters) {
    if (p && p.id) savedById.set(p.id, p)
  }

  const mergedParams = incoming.parameters.map((bp) => {
    const sp = savedById.get(bp.id)
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

  return { ...incoming, parameters: mergedParams }
}
