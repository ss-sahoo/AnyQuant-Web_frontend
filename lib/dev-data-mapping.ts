// Data-file mapping for Developer-Mode complete strategies.
//
// A no-code strategy declares its timeframes on its conditions, so the tester
// can derive the upload slots from the statement itself. Code strategies say
// nothing about their data: the code just reads a variable. This mapping is the
// missing declaration — one row per dataset the strategy expects, binding the
// variable name used in the code to the timeframe of the file that fills it.
//
// It travels: Developer Mode editor -> localStorage (keyed by strategy id) ->
// Strategy Tester, which turns it into the upload slots and sends it alongside
// the files as the backtest payload's `data_mapping`, so the backend loads each
// file into the variable the code expects.

import { isValidPythonIdentifier, normalizeTimeframe } from "./custom-component-schema"

export interface DataBinding {
  /** Variable the strategy code reads this dataset from (e.g. `data`). */
  name: string
  /** Timeframe of the file that fills it (engine spelling — `15min`, not `15m`). */
  timeframe: string
}

// `min`, not `m` — see normalizeTimeframe(); bare-m values are rejected by the
// engine's validator and mis-route to 1d on MetaAPI.
export const DATA_TIMEFRAME_OPTIONS: { value: string; label: string }[] = [
  { value: "1min", label: "1 Minute" },
  { value: "5min", label: "5 Minutes" },
  { value: "15min", label: "15 Minutes" },
  { value: "30min", label: "30 Minutes" },
  { value: "1h", label: "1 Hour" },
  { value: "2h", label: "2 Hours" },
  { value: "4h", label: "4 Hours" },
  { value: "1d", label: "1 Day" },
  { value: "1w", label: "1 Week" },
]

/** Same grammar the engine validates against: `(\d+)(ms|s|min|h|d|w)`. */
const TIMEFRAME_RE = /^\d+(ms|s|min|h|d|w)$/

export function isPresetTimeframe(timeframe: string): boolean {
  return DATA_TIMEFRAME_OPTIONS.some((o) => o.value === timeframe)
}

/** What a strategy starts with: the single `self.data` series the template uses. */
export function defaultDataMapping(): DataBinding[] {
  return [{ name: "data", timeframe: "1h" }]
}

/** Coerce anything read from storage or an API into well-formed rows. */
export function normalizeDataMapping(raw: unknown): DataBinding[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((row): row is Record<string, unknown> => !!row && typeof row === "object")
    .map((row) => ({
      name: typeof row.name === "string" ? row.name.trim() : "",
      timeframe: normalizeTimeframe(typeof row.timeframe === "string" ? row.timeframe.trim() : ""),
    }))
    .filter((row) => row.name || row.timeframe)
}

export interface DataMappingErrors {
  rowErrors: Record<number, string>
  globalErrors: string[]
}

/**
 * Row-indexed validation, mirroring validateSchemas() so the editor can render
 * both the same way. Two rows may share a timeframe (both bind to the same
 * uploaded file); two rows may not share a name.
 */
export function validateDataMapping(rows: DataBinding[]): DataMappingErrors {
  const rowErrors: Record<number, string> = {}
  const globalErrors: string[] = []
  const seen = new Set<string>()

  if (rows.length === 0) {
    globalErrors.push("Add at least one data file so the backtest knows what to load.")
  }

  rows.forEach((row, i) => {
    if (!row.name) {
      rowErrors[i] = "Variable name is required"
      return
    }
    if (!isValidPythonIdentifier(row.name)) {
      rowErrors[i] = `'${row.name}' is not a valid Python identifier`
      return
    }
    if (seen.has(row.name)) {
      rowErrors[i] = `Duplicate variable name '${row.name}'`
      return
    }
    seen.add(row.name)

    if (!row.timeframe) {
      rowErrors[i] = "Timeframe is required"
      return
    }
    if (!TIMEFRAME_RE.test(row.timeframe)) {
      rowErrors[i] = `'${row.timeframe}' is not a valid timeframe (e.g. 15min, 1h, 1d)`
    }
  })

  return { rowErrors, globalErrors }
}

/** The distinct timeframes the tester must collect a file for, in row order. */
export function dataMappingTimeframes(rows: DataBinding[]): string[] {
  const out: string[] = []
  for (const row of rows) {
    if (row.timeframe && !out.includes(row.timeframe)) out.push(row.timeframe)
  }
  return out
}

/** Variables fed by a given timeframe — shown on that timeframe's upload slot. */
export function variablesForTimeframe(rows: DataBinding[], timeframe: string): string[] {
  return rows.filter((row) => row.timeframe === timeframe && row.name).map((row) => row.name)
}

const storageKey = (strategyId: number | string) => `custom_strategy_data_map_${strategyId}`

/**
 * Persisted per strategy id rather than on the strategy record: the backend's
 * custom-strategy resource has no field for it, and the tester only needs it on
 * this device between editing the code and running the backtest.
 */
export function loadDataMapping(strategyId: number | string): DataBinding[] | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(storageKey(strategyId))
    if (!raw) return null
    const rows = normalizeDataMapping(JSON.parse(raw))
    return rows.length > 0 ? rows : null
  } catch {
    return null
  }
}

export function saveDataMapping(strategyId: number | string, rows: DataBinding[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(storageKey(strategyId), JSON.stringify(normalizeDataMapping(rows)))
  } catch {
    /* storage full or unavailable — the editor state is still correct */
  }
}
