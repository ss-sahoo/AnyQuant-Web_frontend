// Parameter schema model for Developer-Mode custom components.
//
// Shared by the Developer-Mode schema editor (where the user defines the
// parameter list for a component) and the runtime properties dialog (where
// the user configures a component dropped into a strategy).

export type ParameterType = "int" | "float" | "bool" | "string" | "select" | "source"

export interface ParameterSchema {
  name: string
  display_name?: string
  type: ParameterType
  default: number | string | boolean
  min?: number
  max?: number
  step?: number
  options?: string[]
  description?: string
  optimizable?: boolean
}

// Runtime value for a single parameter. An "optimizable" range looks like
// { start, step, stop, value } — the backend detects that shape and runs the
// optimizer over it. A bare number/string/bool is treated as fixed.
export interface OptimizableValue {
  start: number
  step: number
  stop: number
  value: number
}

export type ParamRuntimeValue = number | string | boolean | OptimizableValue

export const OHLCV_SOURCES: readonly string[] = ["Open", "High", "Low", "Close", "Volume"] as const

const PYTHON_IDENTIFIER_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/
const PYTHON_RESERVED = new Set([
  "False", "None", "True", "and", "as", "assert", "async", "await", "break",
  "class", "continue", "def", "del", "elif", "else", "except", "finally",
  "for", "from", "global", "if", "import", "in", "is", "lambda", "nonlocal",
  "not", "or", "pass", "raise", "return", "try", "while", "with", "yield",
])

export function isValidPythonIdentifier(name: string): boolean {
  if (!name) return false
  if (!PYTHON_IDENTIFIER_RE.test(name)) return false
  if (PYTHON_RESERVED.has(name)) return false
  return true
}

export interface SchemaValidationErrors {
  rowErrors: Record<number, string>
  globalErrors: string[]
}

export function validateSchemas(schemas: ParameterSchema[]): SchemaValidationErrors {
  const rowErrors: Record<number, string> = {}
  const globalErrors: string[] = []
  const seen = new Set<string>()

  schemas.forEach((p, i) => {
    if (!p.name || !p.name.trim()) {
      rowErrors[i] = "Name is required"
      return
    }
    if (!isValidPythonIdentifier(p.name)) {
      rowErrors[i] = `'${p.name}' is not a valid Python identifier`
      return
    }
    if (seen.has(p.name)) {
      rowErrors[i] = `Duplicate parameter name '${p.name}'`
      return
    }
    seen.add(p.name)

    if (p.type === "select") {
      if (!p.options || p.options.length === 0) {
        rowErrors[i] = "Select parameters require at least one option"
        return
      }
      if (p.default !== undefined && p.default !== "" && !p.options.includes(String(p.default))) {
        rowErrors[i] = "Default must be one of the select options"
        return
      }
    }

    if (p.type === "int" || p.type === "float") {
      if (p.default === "" || p.default === undefined || p.default === null) {
        rowErrors[i] = "Default value is required"
        return
      }
      const num = Number(p.default)
      if (!Number.isFinite(num)) {
        rowErrors[i] = "Default must be a number"
        return
      }
      if (p.type === "int" && !Number.isInteger(num)) {
        rowErrors[i] = "Default must be an integer"
        return
      }
      if (p.min !== undefined && num < p.min) {
        rowErrors[i] = `Default (${num}) is below min (${p.min})`
        return
      }
      if (p.max !== undefined && num > p.max) {
        rowErrors[i] = `Default (${num}) is above max (${p.max})`
        return
      }
    }

    if (p.type === "source") {
      if (!OHLCV_SOURCES.includes(String(p.default))) {
        rowErrors[i] = `Default must be one of ${OHLCV_SOURCES.join(", ")}`
        return
      }
    }
  })

  return { rowErrors, globalErrors }
}

// Coerce a user-entered default string into the declared type.
export function coerceDefault(type: ParameterType, raw: any): number | string | boolean {
  if (type === "int") {
    const n = parseInt(String(raw), 10)
    return Number.isFinite(n) ? n : 0
  }
  if (type === "float") {
    const n = parseFloat(String(raw))
    return Number.isFinite(n) ? n : 0
  }
  if (type === "bool") {
    if (typeof raw === "boolean") return raw
    return String(raw).toLowerCase() === "true"
  }
  return String(raw ?? "")
}

// Normalize whatever the backend gives us for a component's `parameters`
// field into a ParameterSchema[].
// Accepts the new nested shape `{ parameters: [ ...schemas ] }` and the old
// flat `{ name: value }` shape (upgrade path for components saved before
// this feature shipped).
export function normalizeStoredParameters(raw: any): ParameterSchema[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as ParameterSchema[]
  if (Array.isArray(raw.parameters)) return raw.parameters as ParameterSchema[]

  // Old flat shape: upgrade.
  if (typeof raw === "object") {
    return Object.entries(raw).map(([name, value]): ParameterSchema => {
      let type: ParameterType = "string"
      if (typeof value === "number") type = Number.isInteger(value) ? "int" : "float"
      else if (typeof value === "boolean") type = "bool"
      return { name, type, default: value as any }
    })
  }
  return []
}

// Default runtime values for the properties dialog on first open.
export function schemaToDefaults(schemas: ParameterSchema[]): Record<string, ParamRuntimeValue> {
  const out: Record<string, ParamRuntimeValue> = {}
  for (const p of schemas) {
    out[p.name] = p.default as ParamRuntimeValue
  }
  return out
}

// DRF returns per-field errors as arrays of strings.
// Our validator tags row-level failures with `parameters[<idx>] ('<name>') ...`,
// which we parse back out to highlight the offending row.
export interface DrfParameterErrors {
  rowErrors: Record<number, string[]>
  globalErrors: string[]
}

export function parseDrfParameterErrors(errorData: any): DrfParameterErrors {
  const rowErrors: Record<number, string[]> = {}
  const globalErrors: string[] = []
  if (!errorData) return { rowErrors, globalErrors }

  const raw = errorData.parameters
  const list: string[] = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
    ? [raw]
    : []

  const rowRe = /parameters\[(\d+)\]/

  for (const msg of list) {
    const m = rowRe.exec(msg)
    if (m) {
      const idx = parseInt(m[1], 10)
      if (!rowErrors[idx]) rowErrors[idx] = []
      rowErrors[idx].push(msg)
    } else {
      globalErrors.push(msg)
    }
  }

  // Also surface non-parameters field errors (e.g. "name", "code") so the
  // caller can show them in a banner.
  for (const key of Object.keys(errorData)) {
    if (key === "parameters") continue
    const v = errorData[key]
    if (Array.isArray(v)) {
      v.forEach((s) => globalErrors.push(`${key}: ${s}`))
    } else if (typeof v === "string") {
      globalErrors.push(`${key}: ${v}`)
    }
  }

  return { rowErrors, globalErrors }
}

export function isOptimizableValue(v: unknown): v is OptimizableValue {
  return (
    !!v &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    "start" in (v as any) &&
    "stop" in (v as any)
  )
}

// ---------------------------------------------------------------------------
// Bridge into the Strategy Tester "Properties" tab.
//
// The Properties tab is populated from `localStorage.getItem("optimisation_form")`
// whose `.parameters` array the backend emits for built-in indicators. The
// backend does not know how to walk a user-defined custom-component schema,
// so the frontend is responsible for synthesising rows for any CUSTOM_I /
// CUSTOM_B / CUSTOM_TM block (and for custom strategies).
// ---------------------------------------------------------------------------

export interface OptimisationFormRow {
  id: string
  encoding: string
  name: string
  indicator: string
  default: number | string
  type: "number" | "text"
  range?: [number, number]
  step?: number
  optimise: boolean
}

// Stable encoding for a custom-component parameter row. Includes the
// statement/condition/slot coordinates so the same custom indicator used
// twice in one strategy yields distinct rows.
export function encodeCustomParam(parts: {
  kind: "indicator" | "behavior" | "trade_management" | "strategy"
  componentName: string
  componentId?: number | string
  statementIndex?: number
  conditionIndex?: number
  slot?: string                 // "inp1" | "inp2" | "operator" | "trade_management" | "strategy"
  paramName: string
}): string {
  const id = parts.componentId ?? "na"
  const s = parts.statementIndex ?? 0
  const c = parts.conditionIndex ?? 0
  const slot = parts.slot ?? "x"
  return `custom:${parts.kind}:${id}:${s}:${c}:${slot}:${parts.paramName}`
}

// Convert one ParameterSchema + its current runtime value into the row shape
// the Properties tab consumes. `currentValue` may be absent (use schema
// default), a bare value (fixed), or an OptimizableValue (range mode).
export function schemaToOptimisationRow(
  schema: ParameterSchema,
  currentValue: ParamRuntimeValue | undefined,
  encoding: string,
  indicatorLabel: string,
): OptimisationFormRow {
  const isNumericType = schema.type === "int" || schema.type === "float"
  const rowType: "number" | "text" = isNumericType ? "number" : "text"

  let defaultValue: number | string
  let range: [number, number] | undefined
  let step: number | undefined
  let optimise = false

  if (isOptimizableValue(currentValue)) {
    defaultValue = currentValue.value
    range = [currentValue.start, currentValue.stop]
    step = currentValue.step
    optimise = true
  } else if (currentValue !== undefined) {
    defaultValue = typeof currentValue === "boolean" ? String(currentValue) : (currentValue as any)
  } else {
    defaultValue = typeof schema.default === "boolean" ? String(schema.default) : (schema.default as any)
  }

  // Seed range/step from the schema when the user hasn't put the value into
  // range mode yet — lets the Properties tab show sensible bounds.
  if (isNumericType && !range) {
    if (schema.min !== undefined && schema.max !== undefined) {
      range = [schema.min, schema.max]
    }
    if (schema.step !== undefined) {
      step = schema.step
    }
  }
  if (schema.optimizable && isNumericType) {
    // Keep `optimise=false` here if the user hasn't opted in yet — the tab
    // has a checkbox for the user to enable. But surface that it's allowed
    // by ensuring the row is editable (range/step present when known).
  }

  return {
    id: encoding,
    encoding,
    name: schema.display_name || schema.name,
    indicator: indicatorLabel,
    default: defaultValue,
    type: rowType,
    range,
    step,
    optimise,
  }
}

// Walk the strategy JSON and yield coordinates of every CUSTOM_* block, so
// the caller can fetch the schema for each and build rows.
export interface CustomBlockCoord {
  kind: "indicator" | "behavior" | "trade_management"
  componentName: string
  componentId?: number
  statementIndex: number
  conditionIndex: number
  slot: "inp1" | "inp2" | "operator" | "trade_management"
  inputParams: Record<string, ParamRuntimeValue>
}

export function findCustomBlocks(parsedStatement: any): CustomBlockCoord[] {
  const out: CustomBlockCoord[] = []
  if (!parsedStatement) return out
  const statements = Array.isArray(parsedStatement)
    ? parsedStatement
    : parsedStatement.strategy
      ? [parsedStatement]
      : []

  statements.forEach((stmt: any, statementIndex: number) => {
    const strat = Array.isArray(stmt?.strategy) ? stmt.strategy : []
    strat.forEach((cond: any, conditionIndex: number) => {
      for (const slot of ["inp1", "inp2"] as const) {
        const input = cond?.[slot]
        if (input && input.type === "CUSTOM_I") {
          out.push({
            kind: "indicator",
            componentName: input.name,
            componentId: input.custom_component_id,
            statementIndex,
            conditionIndex,
            slot,
            inputParams: input.input_params || {},
          })
        }
      }
      const op = cond?.Operator
      if (op && op.type === "CUSTOM_B") {
        out.push({
          kind: "behavior",
          componentName: op.name,
          componentId: op.custom_component_id,
          statementIndex,
          conditionIndex,
          slot: "operator",
          inputParams: op.params || {},
        })
      }
    })

    const equity = Array.isArray(stmt?.Equity) ? stmt.Equity : []
    equity.forEach((rule: any, ruleIndex: number) => {
      const tm = rule?.trade_management
      if (tm && tm.type === "CUSTOM_TM") {
        out.push({
          kind: "trade_management",
          componentName: tm.name,
          componentId: tm.custom_component_id,
          statementIndex,
          conditionIndex: ruleIndex,
          slot: "trade_management",
          inputParams: tm.params || {},
        })
      }
    })
  })

  return out
}
