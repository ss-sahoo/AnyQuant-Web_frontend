// Copy an optimised parameter set into the Properties tab's Value column, so a
// GA / grid / robust result row or a walk-forward fold can be saved and
// backtested as it is (ANY-388).
//
// Every source names a parameter by the key the optimiser searched: a no-code
// row's `encoding` (param_0_1_timeperiod_2, value_0_1, StopLossPoint, ...), or a
// Developer-Mode parameter's name, plain (walk-forward folds, cloud rows) or as
// param_<name> (adaptCustomOptimisationRows). Sets are matched to form rows by
// that key, never by position or Object.keys order: a by-position match is what
// wrote source: "2" / timeperiod: 0 into saved strategies (see
// optimisation-form-persistence.ts and the backend's
// docs/optimisation-form-contract.md).

import { resolveEncoding } from "./optimisation-form-persistence"
import { isWholeNumberParam, type OptimisationFormParam, type OptimisationFormShape } from "./optimisation-form-merge"

// Backtest-stat columns every optimisation row carries. Anything outside this
// set is a strategy parameter the run was optimising over.
export const STANDARD_STAT_COLUMNS = new Set([
  'Return [%]', 'Equity Final [$]', '# Trades', 'Win Rate [%]', 'Profit Factor',
  'Max. Drawdown [%]', 'Sharpe Ratio', 'Sortino Ratio', 'Calmar Ratio',
  'Return (Ann.) [%]', 'Volatility (Ann.) [%]', 'Start', 'End', 'Duration', 'SQN',
  'Exposure Time [%]', 'Equity Peak [$]', 'Avg. Trade [%]', 'Best Trade [%]',
  'Worst Trade [%]', 'Avg. Drawdown [%]', 'Avg. Drawdown Duration',
  'Max. Drawdown Duration', 'Avg. Trade Duration', 'Max. Trade Duration',
  'Buy & Hold Return [%]', 'Expectancy [%]', 'Unnamed: 0', 'generation',
])

// The synthetic-market scores a robust (GARCH) search records after the
// engine's own statistics (simulation/optimiser_scoring.py SCORING_STATS).
export const ROBUST_SCORE_COLUMNS = [
  'Robust Score', 'Synthetic Median', 'Synthetic P5', 'Synthetic Profitable [%]', 'Synthetic Failed Paths',
]

// `Time taken` rides along in optimised_parameters; `progressMsg` is a GA flag
// some runs recorded as a column.
const NON_PARAMETER_KEYS = new Set<string>([
  ...STANDARD_STAT_COLUMNS, ...ROBUST_SCORE_COLUMNS, 'Time taken', 'progressMsg',
])

// Parameter keys are Python identifiers (encodings, attribute names); engine
// statistics mostly are not ("Sharpe Ratio", "# Trades"). An underscore-led key
// is one of backtesting.py's private stats (_strategy, _equity_curve, _trades).
const PARAMETER_KEY = /^[A-Za-z][A-Za-z0-9_]*$/

// Developer-Mode strategy rows (buildCustomStrategyRows); `row.name` is the
// parameter name the code reads.
const DEV_MODE_ROW_PREFIX = "custom:strategy:"

export type ParameterSet = Record<string, number | string>

/** The parameter keys of a result row, fold or optimised_parameters dict, without its statistics. */
export function extractParameterSet(row: unknown): ParameterSet {
  const out: ParameterSet = {}
  if (!row || typeof row !== "object") return out
  for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
    if (NON_PARAMETER_KEYS.has(key) || !PARAMETER_KEY.test(key)) continue
    if ((typeof value === "number" && Number.isFinite(value)) || typeof value === "string") out[key] = value
  }
  return out
}

export interface ParameterCopyIssue {
  key: string
  reason: string
}

export interface ParameterCopyResult<F extends OptimisationFormShape> {
  form: F
  /** Encodings of the rows whose Value was set. */
  applied: string[]
  /** Keys left out, and why. */
  skipped: ParameterCopyIssue[]
  /**
   * Copied, but outside the [start, stop] of a row being optimised, so Save
   * Properties rejects them (validateRows) until the range or value changes.
   */
  outOfRange: ParameterCopyIssue[]
}

export interface ApplyParameterSetOptions {
  devMode: boolean
  /** The loaded strategy JSON, which every no-code key must be savable into. */
  statement?: any
}

function isDevModeRow(row: OptimisationFormParam | undefined): boolean {
  return typeof row?.encoding === "string" && row.encoding.startsWith(DEV_MODE_ROW_PREFIX)
}

function findDevModeRow(rows: OptimisationFormParam[], key: string): number {
  const exact = rows.findIndex((row) => isDevModeRow(row) && row.name === key)
  if (exact !== -1 || !key.startsWith("param_")) return exact
  const name = key.slice("param_".length)
  return rows.findIndex((row) => isDevModeRow(row) && row.name === name)
}

/**
 * Set each matched row's Value (`default`) from `set`. Start, step, stop and the
 * optimise flag are never touched. Returns a new form; `form` is not mutated.
 */
export function applyParameterSetToForm<F extends OptimisationFormShape>(
  form: F,
  set: ParameterSet,
  { devMode, statement }: ApplyParameterSetOptions,
): ParameterCopyResult<F> {
  const rows: OptimisationFormParam[] = Array.isArray(form?.parameters) ? form.parameters : []
  const updates = new Map<number, number | string>()
  const skipped: ParameterCopyIssue[] = []
  const outOfRange: ParameterCopyIssue[] = []

  for (const [key, raw] of Object.entries(set)) {
    const index = devMode ? findDevModeRow(rows, key) : rows.findIndex((row) => row?.encoding === key)
    if (index === -1) {
      skipped.push({ key, reason: "no matching row in the Properties tab" })
      continue
    }
    // Then.count, Accumulate.forPeriod and partial-TP keys have no place in the
    // strategy JSON that Save Properties writes (see resolveEncoding).
    if (!devMode && !resolveEncoding(key, statement)) {
      skipped.push({ key, reason: "Save Properties can't store this parameter in the strategy" })
      continue
    }

    const row = rows[index]
    let value: number | string
    if (row.type === "number") {
      const n = typeof raw === "number" ? raw : raw.trim() === "" ? NaN : Number(raw)
      if (!Number.isFinite(n)) {
        skipped.push({ key, reason: `${JSON.stringify(raw)} is not a number` })
        continue
      }
      // The GA reports whole-number params as floats (14.0).
      value = isWholeNumberParam(row) ? Math.round(n) : n
    } else {
      value = String(raw)
    }
    updates.set(index, value)

    const [start, stop] = Array.isArray(row.range) && row.range.length === 2 ? row.range.map(Number) : []
    if (row.optimise && typeof value === "number" && Number.isFinite(start) && Number.isFinite(stop) &&
        (value < start || value > stop)) {
      outOfRange.push({ key, reason: `${value} is outside the optimise range [${start}, ${stop}]` })
    }
  }

  const parameters = rows.map((row, i) => (updates.has(i) ? { ...row, default: updates.get(i)! } : row))
  const applied = Array.from(updates.keys()).map((i) => String(rows[i].encoding))
  return { form: { ...form, parameters }, applied, skipped, outOfRange }
}

/**
 * Does this saved result belong to a strategy other than the loaded one? A
 * detail names its owner by `custom_strategy` (Developer Mode) or
 * `strategy_statement`; the two id sequences are independent, so the kind must
 * match as well as the id. A payload naming neither (a live run, a cloud job's
 * results) counts as the loaded strategy's: results are cleared on a switch.
 */
export function isResultForAnotherStrategy(
  result: any,
  loaded: { id: string | number | null | undefined; devMode: boolean },
): boolean {
  const idOf = (v: any) => (v && typeof v === "object" ? v.id : v)
  const customId = idOf(result?.custom_strategy)
  const statementId = idOf(result?.strategy_statement)
  if (customId == null && statementId == null) return false
  if (loaded.id == null) return true
  if (customId != null) return !loaded.devMode || String(customId) !== String(loaded.id)
  return loaded.devMode || String(statementId) !== String(loaded.id)
}

/**
 * The `params` a Developer-Mode backtest sends: each strategy row's Value, by
 * parameter name. The engine sets them as class attributes of the strategy
 * without casting, so a number row goes as a number and a bool row, stored as
 * "true"/"false" (schemaToOptimisationRow), as a boolean; "false" would
 * otherwise arrive truthy. Rows of another strategy in the shared stored form
 * are ignored.
 */
export function devModeBacktestParams(
  form: OptimisationFormShape | null | undefined,
  customStrategyId: string | number | null | undefined,
): Record<string, number | string | boolean> {
  const out: Record<string, number | string | boolean> = {}
  if (customStrategyId == null || !Array.isArray(form?.parameters)) return out
  const prefix = `${DEV_MODE_ROW_PREFIX}${customStrategyId}:`
  for (const row of form.parameters) {
    if (typeof row?.encoding !== "string" || !row.encoding.startsWith(prefix) || !row.name) continue
    const value = row.default
    if (value === undefined || value === null || value === "") continue
    if (row.type === "number") {
      const n = Number(value)
      if (Number.isFinite(n)) out[row.name] = n
    } else {
      out[row.name] = value === "true" ? true : value === "false" ? false : String(value)
    }
  }
  return out
}
