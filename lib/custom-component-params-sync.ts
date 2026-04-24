// Bridges user-defined custom-component parameter schemas into the Strategy
// Tester's "Properties" tab. The tab reads from
// `localStorage.getItem("optimisation_form")`, which the backend only
// populates for built-in indicators. This module synthesises the missing
// rows for CUSTOM_I / CUSTOM_B / CUSTOM_TM blocks and for custom strategies.

import { getCustomComponent } from "@/app/AllApiCalls"
import {
  findCustomBlocks,
  schemaToOptimisationRow,
  encodeCustomParam,
  normalizeStoredParameters,
  OptimisationFormRow,
  ParameterSchema,
} from "./custom-component-schema"

// Fetch schemas for every custom block in the strategy and return the
// corresponding Properties-tab rows.
export async function collectCustomComponentRows(parsedStatement: any): Promise<OptimisationFormRow[]> {
  const blocks = findCustomBlocks(parsedStatement)
  if (blocks.length === 0) return []

  // Cache schema fetches — a strategy may reference the same custom component
  // in multiple slots.
  const schemaCache = new Map<number | string, ParameterSchema[]>()
  const ids = Array.from(new Set(blocks.map((b) => b.componentId).filter((id): id is number => id !== undefined)))

  await Promise.all(
    ids.map(async (id) => {
      try {
        const full: any = await getCustomComponent(id)
        schemaCache.set(id, normalizeStoredParameters(full?.parameters))
      } catch (err) {
        // Silently skip — the tab simply won't have this component's rows.
        console.warn(`Failed to fetch schema for custom component ${id}:`, err)
      }
    })
  )

  const rows: OptimisationFormRow[] = []
  for (const block of blocks) {
    const schemas = block.componentId !== undefined ? schemaCache.get(block.componentId) : undefined
    if (!schemas || schemas.length === 0) continue

    const labelPrefix = block.kind === "indicator"
      ? block.componentName
      : block.kind === "behavior"
      ? `${block.componentName} (behavior)`
      : `${block.componentName} (trade mgmt)`

    for (const schema of schemas) {
      const encoding = encodeCustomParam({
        kind: block.kind,
        componentName: block.componentName,
        componentId: block.componentId,
        statementIndex: block.statementIndex,
        conditionIndex: block.conditionIndex,
        slot: block.slot,
        paramName: schema.name,
      })
      const currentValue = block.inputParams?.[schema.name]
      rows.push(schemaToOptimisationRow(schema, currentValue, encoding, labelPrefix))
    }
  }

  return rows
}

// For custom (complete) strategies: turn the strategy's own parameter schema
// into Properties-tab rows.
export function buildCustomStrategyRows(customStrategy: any): OptimisationFormRow[] {
  if (!customStrategy) return []
  const schemas = normalizeStoredParameters(customStrategy.parameters)
  if (schemas.length === 0) return []

  const label = customStrategy.name || "Custom Strategy"
  const currentValues: Record<string, any> = {}
  // A custom strategy stores its current param values either directly on
  // `parameters` (flat legacy shape) or on a sibling `param_values` field if
  // present. We fall back to schema defaults in schemaToOptimisationRow.
  if (customStrategy.param_values && typeof customStrategy.param_values === "object") {
    Object.assign(currentValues, customStrategy.param_values)
  }

  return schemas.map((schema) => {
    const encoding = encodeCustomParam({
      kind: "strategy",
      componentName: label,
      componentId: customStrategy.id,
      paramName: schema.name,
    })
    return schemaToOptimisationRow(schema, currentValues[schema.name], encoding, label)
  })
}

// Merge freshly synthesised rows into whatever the backend gave us — skip any
// that are already present by encoding (so we don't duplicate when backend
// and frontend both report the same param).
export function mergeOptimisationRows(
  existing: OptimisationFormRow[] | undefined,
  extras: OptimisationFormRow[],
): OptimisationFormRow[] {
  const out = Array.isArray(existing) ? [...existing] : []
  const seen = new Set(out.map((r) => r.encoding))
  for (const row of extras) {
    if (!seen.has(row.encoding)) {
      out.push(row)
      seen.add(row.encoding)
    }
  }
  return out
}
