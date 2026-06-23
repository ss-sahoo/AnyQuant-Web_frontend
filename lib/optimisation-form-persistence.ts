// Persist user-edited optimisation Properties-tab ranges into the strategy JSON.
//
// The Properties tab is populated from POST /api/optimisation/form/, whose
// parameters[] rows each carry an `encoding` string plus start/step/stop/value.
// To make edits stick across sessions we write the values back into the strategy
// JSON at a path that is deterministic from the encoding, then PATCH
// /api/strategies/<pk>/edit/. On reload optimisation_strategy_creator reads the
// same path back: a dict {start, step, stop, value} means "optimise on"; a bare
// scalar means "fixed". (Verified against helper/data_processing.py
// optimisation_strategy_creator: the row builder reads input_params[key] and
// branches on `isinstance(raw, dict) and 'start' in raw`.)
//
// Encoding -> JSON path (i / j are 0-based indices, slot is 1|2):
//   param_{i}_{slot}_{key}_{indx}     -> strategy[i].inp{slot}.input_params[key]
//   value_{i}_{slot}                  -> strategy[i].inp{slot}.value
//   operator_{i}_{key}_0             -> strategy[i].Operator.params[key]
//   Equity_{j}_{slot}_{key}_{indx}    -> Equity[j].inp{slot}.input_params[key]
//   behavior_{name}_{key}_{indx}      -> behavior.params[key]
//   tm_{name}_{key}_{indx}            -> equity.trade_management.params[key]  (lowercase equity)
//
// {key} is resolved via the trailing {indx} against the live params object
// (sorted(keys)[indx]) rather than by string-splitting, because both the
// component {name} and a {key} can contain underscores.
//
// StopLossPoint / TakeProfitPoint are special: the value lives inside the
// Equity block's `operator` STRING (e.g. "SL = Entry_Price - 90pips"), not a
// clean numeric path, and the GA reads the optimise RANGE from a separate
// Parameters config rather than the strategy JSON. We persist the edited fixed
// value by rewriting the trailing number in that operator string (so it
// round-trips on reload); the optimise range continues to flow to the GA via
// the existing /api/optimisation/save/ call. Note: because the strategy JSON
// only stores the scalar, an SL/TP row always reloads as optimise:false even if
// the user toggled it on (that toggle state lives in the transient GA config).
//
// Deliberately NOT persisted (return null from resolveEncoding):
//   param_{i}_then_count_0 / param_{i}_accumulate_period_0 -- Then.count /
//     Accumulate.forPeriod are stored as STRING expressions ("5periods") and the
//     creator calls .replace() on them on reload; writing a number/dict crashes
//     the form endpoint.
//   partialtp_*            -- opaque nested partial-take-profit list, no UI here.

export type FormRowType = "number" | "text"

export interface PersistableRow {
  encoding: string
  optimise: boolean
  type: FormRowType
  /** The "Value" column (dict `value` when optimising, bare scalar otherwise). */
  default: string
  start: string
  step: string
  stop: string
}

export type StrategyRoot = "strategy" | "Equity" | "behavior" | "equity"

export interface ResolvedPath {
  root: StrategyRoot
  /** Full path from the statement object, e.g. ["strategy", 0, "inp1", "input_params", "ma_length"]. */
  path?: (string | number)[]
  /**
   * SL/TP rows have no plain path -- the value is rewritten into the trailing
   * number of the matching Equity block's `operator` string instead.
   */
  sltp?: "SL" | "TP"
}

function sortedKeyAt(paramsObj: any, indx: number): string | undefined {
  if (!paramsObj || typeof paramsObj !== "object") return undefined
  const keys = Object.keys(paramsObj).sort()
  return keys[indx]
}

/**
 * Resolve an encoding to a concrete JSON path inside `statement`, or null if the
 * encoding is out of scope / cannot be resolved against the current strategy.
 */
export function resolveEncoding(encoding: string, statement: any): ResolvedPath | null {
  if (!encoding || !statement) return null

  // SL/TP: rewrite the value into the Equity operator string (see header).
  if (encoding === "StopLossPoint") return { root: "Equity", sltp: "SL" }
  if (encoding === "TakeProfitPoint") return { root: "Equity", sltp: "TP" }
  // Out of scope.
  if (encoding.startsWith("partialtp_")) return null

  const t = encoding.split("_")

  if (t[0] === "param") {
    const i = Number(t[1])
    const slot = t[2]
    // Then.count / Accumulate.forPeriod are string expressions -- not persistable here.
    if (slot === "then" || slot === "accumulate") return null
    if (slot !== "1" && slot !== "2") return null
    const indx = Number(t[t.length - 1])
    const ip = statement?.strategy?.[i]?.[`inp${slot}`]?.input_params
    const key = sortedKeyAt(ip, indx)
    if (key === undefined) return null
    return { root: "strategy", path: ["strategy", i, `inp${slot}`, "input_params", key] }
  }

  if (t[0] === "value") {
    const i = Number(t[1])
    const slot = t[2]
    if (slot !== "1" && slot !== "2") return null
    return { root: "strategy", path: ["strategy", i, `inp${slot}`, "value"] }
  }

  if (t[0] === "operator") {
    const i = Number(t[1])
    // operator_{i}_{key}_0 -- fixed "operator_<i>_" prefix and "_0" suffix, so the
    // middle is the key even when it contains underscores.
    const key = t.slice(2, -1).join("_")
    if (!key) return null
    return { root: "strategy", path: ["strategy", i, "Operator", "params", key] }
  }

  if (t[0] === "Equity") {
    const j = Number(t[1])
    const slot = t[2]
    if (slot !== "1" && slot !== "2") return null
    const indx = Number(t[t.length - 1])
    const ip = statement?.Equity?.[j]?.[`inp${slot}`]?.input_params
    const key = sortedKeyAt(ip, indx)
    if (key === undefined) return null
    return { root: "Equity", path: ["Equity", j, `inp${slot}`, "input_params", key] }
  }

  if (t[0] === "behavior") {
    const indx = Number(t[t.length - 1])
    const ip = statement?.behavior?.params
    const key = sortedKeyAt(ip, indx)
    if (key === undefined) return null
    return { root: "behavior", path: ["behavior", "params", key] }
  }

  if (t[0] === "tm") {
    const indx = Number(t[t.length - 1])
    const ip = statement?.equity?.trade_management?.params
    const key = sortedKeyAt(ip, indx)
    if (key === undefined) return null
    return { root: "equity", path: ["equity", "trade_management", "params", key] }
  }

  return null
}

// Matches an SL/TP operator string, capturing (prefix)(value)(suffix) so only
// the trailing number is replaced. Covers every structured form the FE emits:
// "SL = Entry_Price - 90pips", "SL = Entry_Price * 0.95", "TP = inp2 + 150points".
// The arithmetic operator [-+*] is REQUIRED: it anchors the value so the regex
// cannot backtrack the B token into the number, and it deliberately excludes the
// degenerate "SL = 90" form (no operand), which we leave untouched rather than
// risk corrupting (that form also has no separate value for the backend to read).
const SLTP_VALUE_RE = /^(\s*(?:SL|TP)\s*(?:<=|>=|<|>|==|=|!=)\s*[A-Za-z0-9_]+\s*[-+*]\s*)(\d+(?:\.\d+)?)(\s*(?:pips|points)?\s*)$/

/**
 * Rewrite the trailing numeric value of the first Equity block whose operator
 * is an SL/TP rule. Returns true if a block was rewritten. Leaves the string
 * untouched (returns false) if the format is unrecognised, to avoid corruption.
 */
function rewriteSltpOperatorValue(equity: any, sltp: "SL" | "TP", num: number): boolean {
  if (!Array.isArray(equity)) return false
  for (const block of equity) {
    const op = block?.operator
    if (typeof op !== "string") continue
    if (op.trim().split(/\s+/)[0] !== sltp) continue
    const m = SLTP_VALUE_RE.exec(op)
    if (!m) return false
    block.operator = `${m[1]}${num}${m[3]}`
    return true
  }
  return false
}

function setAtPath(obj: any, path: (string | number)[], value: any): void {
  let cur = obj
  for (let k = 0; k < path.length - 1; k++) {
    const seg = path[k]
    if (cur[seg] == null || typeof cur[seg] !== "object") cur[seg] = typeof path[k + 1] === "number" ? [] : {}
    cur = cur[seg]
  }
  cur[path[path.length - 1]] = value
}

/** The value to write for a row: dict-form when optimising a number, else bare. */
function rowValue(row: PersistableRow): number | string | { start: number; step: number; stop: number; value: number } {
  if (row.optimise && row.type === "number") {
    return {
      start: Number(row.start),
      step: Number(row.step),
      stop: Number(row.stop),
      value: Number(row.default),
    }
  }
  return row.type === "number" ? Number(row.default) : row.default
}

export interface ValidationResult {
  /** encoding -> human-readable error, for rows that fail. */
  errors: Record<string, string>
}

/**
 * Validate every dict-form (optimise-on numeric) row. Bare/fixed rows are not
 * range-validated. Integer-ness is left to the backend (the FE form row carries
 * no authoritative int flag).
 */
export function validateRows(rows: PersistableRow[]): ValidationResult {
  const errors: Record<string, string> = {}
  for (const row of rows) {
    if (!(row.optimise && row.type === "number")) continue
    const start = Number(row.start)
    const step = Number(row.step)
    const stop = Number(row.stop)
    const value = Number(row.default)

    if (![start, step, stop, value].every((n) => Number.isFinite(n))) {
      errors[row.encoding] = "Start, step, stop and value must all be numbers."
      continue
    }
    if (start > stop) {
      errors[row.encoding] = `Start (${start}) must be <= stop (${stop}).`
      continue
    }
    if (step <= 0) {
      errors[row.encoding] = `Step (${step}) must be > 0.`
      continue
    }
    if (value < start || value > stop) {
      errors[row.encoding] = `Value (${value}) must be within [${start}, ${stop}].`
      continue
    }
  }
  return errors ? { errors } : { errors: {} }
}

export interface AppliedEdits {
  strategy?: any[]
  Equity?: any[]
  behavior?: any
  equity?: any
}

/**
 * Apply the edited rows onto a deep clone of `statement` and return ONLY the
 * top-level roots that actually changed, ready to spread into the PATCH body.
 * Rows whose encoding is out of scope or unresolvable are skipped.
 */
export function applyEdits(statement: any, rows: PersistableRow[]): AppliedEdits {
  const clone = JSON.parse(JSON.stringify(statement ?? {}))
  const touched = new Set<StrategyRoot>()

  for (const row of rows) {
    const resolved = resolveEncoding(row.encoding, statement)
    if (!resolved) continue
    const value = rowValue(row)

    if (resolved.sltp) {
      // Operator string can only hold the scalar; use the dict's central value
      // when optimising, else the bare number.
      const num = typeof value === "object" ? value.value : value
      if (typeof num !== "number" || !Number.isFinite(num)) continue
      if (rewriteSltpOperatorValue(clone.Equity, resolved.sltp, num)) touched.add("Equity")
      continue
    }

    if (!resolved.path) continue
    if (typeof value === "number" && !Number.isFinite(value)) continue
    setAtPath(clone, resolved.path, value)
    touched.add(resolved.root)
  }

  const out: AppliedEdits = {}
  if (touched.has("strategy")) out.strategy = clone.strategy
  if (touched.has("Equity")) out.Equity = clone.Equity
  if (touched.has("behavior")) out.behavior = clone.behavior
  if (touched.has("equity")) out.equity = clone.equity
  return out
}
