// Pre-run validation for the optimisation search space.
//
// A Properties-tab row flagged `optimise: true` only produces a real search
// range if it carries start, stop AND step. When one of them is blank the row
// is still sent, but the payload builders drop the incomplete piece --
// `...(param.range && { range }) / ...(param.step && { step })` in
// properties-tab.tsx / optimisation-tab.tsx -- so the backend receives a
// parameter with no bounds and the run comes back with that parameter never
// optimised. Blocking the run with a message is far cheaper than a silent
// no-op (or, for droplets, a paid one).
//
// Row shape is the optimisation_form `parameters[]` entry: { encoding, name,
// indicator, type, optimise, range: [start, stop], step } -- see
// OptimisationFormParam in optimisation-form-merge.ts.

export type RangeField = "start" | "stop" | "step"

export interface MissingRangeRow {
  encoding: string
  /** "<indicator> <name>", for naming the offending row in the message. */
  label: string
  missing: RangeField[]
}

/**
 * Parse a form cell into a number, treating blank/whitespace-only input as
 * absent rather than as 0. Plain `Number("")` is 0, which is what let empty
 * start/stop/step cells slip through as a legitimate-looking bound.
 */
export function parseFormNumber(raw: unknown): number {
  if (raw === null || raw === undefined) return NaN
  if (typeof raw === "string" && raw.trim() === "") return NaN
  return Number(raw)
}

function isSet(raw: unknown): boolean {
  return Number.isFinite(parseFormNumber(raw))
}

function labelFor(param: any): string {
  const name = typeof param?.name === "string" ? param.name.trim() : ""
  const indicator = typeof param?.indicator === "string" ? param.indicator.trim() : ""
  const label = [indicator, name].filter(Boolean).join(" ")
  return label || String(param?.encoding ?? "parameter")
}

export interface FindMissingRangesOptions {
  /** Only consider rows whose encoding starts with this prefix. */
  encodingPrefix?: string
}

/**
 * Return every optimise-on numeric row that is missing part of its search
 * range. Rows the user hasn't flagged for optimisation, and text rows (which
 * have no range at all), are ignored.
 */
export function findMissingOptimisationRanges(
  form: any,
  options: FindMissingRangesOptions = {},
): MissingRangeRow[] {
  const params = Array.isArray(form) ? form : form?.parameters
  if (!Array.isArray(params)) return []

  const out: MissingRangeRow[] = []
  for (const param of params) {
    if (!param || param.optimise !== true) continue
    if (param.type !== "number") continue
    if (options.encodingPrefix && !String(param.encoding ?? "").startsWith(options.encodingPrefix)) continue

    const range = Array.isArray(param.range) ? param.range : []
    const missing: RangeField[] = []
    if (!isSet(range[0])) missing.push("start")
    if (!isSet(range[1])) missing.push("stop")
    // A 0 step is treated as unset: the payload builders drop it (`param.step &&`)
    // exactly as they would a missing one, so the backend ends up without a step.
    if (!isSet(param.step) || Number(param.step) === 0) missing.push("step")

    if (missing.length > 0) {
      out.push({ encoding: String(param.encoding ?? ""), label: labelFor(param), missing })
    }
  }
  return out
}

/** Toast-length prompt naming the rows the user still has to fill in. */
export function formatMissingRangeMessage(rows: MissingRangeRow[], maxNamed = 2): string {
  const named = rows.slice(0, maxNamed).map((r) => `${r.label} (${r.missing.join(", ")})`)
  const rest = rows.length - named.length
  const list = named.join("; ") + (rest > 0 ? `; +${rest} more` : "")
  return `Set the missing start/stop/step values in the Properties tab before optimising: ${list}.`
}
