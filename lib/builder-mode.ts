/**
 * Strategy-type helpers (ANY-308).
 *
 * A strategy's type is fixed by which API it comes from — regular strategies
 * (`/api/strategies/`) are no-code, custom strategies (`/api/custom-strategies/`)
 * are Developer Mode — and never changes. The only value stored here is the
 * user's default builder view for brand-new strategies.
 */

import { findCustomBlocks } from "./custom-component-schema"

export type BuilderMode = "developer" | "nocode"

/**
 * The `strategy_type` field POST /api/run-backtest/ expects. This is the
 * backtest engine's wire vocabulary (`no_code`/`dev_mode`/`hybrid`), separate
 * from the home-screen strategy type: `hybrid` here flags a no-code strategy
 * that embeds a user-defined Developer-Mode component so the backend preloads
 * it — it is not a third strategy type on the home table.
 */
export type StrategyTypeWire = "no_code" | "dev_mode" | "hybrid"

/**
 * Classify a strategy for the backtest API.
 *
 * The backend trusts a declared `strategy_type` outright — its own detection is
 * only a fallback for older clients — so a wrong declaration is worse than
 * sending nothing at all.
 *
 * The subtlety is `hybrid`: it means the JSON statement references a
 * *user-defined* Developer-Mode component. Built-in indicators are serialised
 * with the same `CUSTOM_I` tag (MA, MACD, SupertrendIndicator, …) and must not
 * count — declaring hybrid on those makes the backend's pre-flight component
 * check reject an ordinary no-code strategy. `custom_component_id` is what
 * separates the two, the same test used in `indicator-contract.ts` and the
 * builder's modal routing.
 */
export function detectStrategyType(parsedStatement: any): StrategyTypeWire {
  if (!parsedStatement) return "no_code"
  // The tester's own marker for a strategy loaded from the custom-strategies
  // API — the only unambiguous dev_mode signal.
  if (parsedStatement.is_custom_strategy) return "dev_mode"

  // Checked before the bare id below: the backend auto-creates a linked
  // StrategyStatement for dev-mode strategies, so a statement that embeds a
  // user-defined component can carry a `custom_strategy_id` too, and hybrid is
  // the more specific answer.
  const usesUserDefinedComponent = findCustomBlocks(parsedStatement).some(
    (block) => block.componentId != null,
  )
  if (usesUserDefinedComponent) return "hybrid"

  if (parsedStatement.custom_strategy_id != null) return "dev_mode"
  return "no_code"
}

/** The id `strategy_type: "dev_mode"` requires alongside it, if resolvable. */
export function resolveCustomStrategyId(parsedStatement: any): number | null {
  const raw = parsedStatement?.custom_strategy_id ?? parsedStatement?.strategy?.custom_strategy_id
  if (raw == null) return null
  const id = Number(raw)
  return Number.isFinite(id) ? id : null
}

const PREFERRED_MODE_KEY = "preferred_builder_mode"

/**
 * Whether a home-table row came from the custom-strategies API rather than the
 * regular strategies API, told by the `-dev-` marker the list builder puts in
 * the display id. The two id sequences are independent, so this — not the
 * `developer` badge — is what decides which endpoints and routes a row may use.
 */
export function isCustomStrategyRow(displayId: string | number): boolean {
  return String(displayId).includes("-dev-")
}

/**
 * The builder route that opens a home-table row, from its display id.
 *
 * Custom (code-based) strategies open straight in Developer Mode — there is no
 * regular strategy behind them to show (ANY-308) — while regular rows open by
 * path. The two id sequences are unrelated, so the branch is on the row's
 * origin, never on its `developer` badge: a regular strategy labelled Developer
 * still opens by its own id.
 */
export function builderRouteForRow(displayId: string | number): string {
  const id = String(displayId).split("-")[0]
  // Trailing slash before the query: next.config has `trailingSlash: true`, so
  // `/strategy-builder?…` takes a redirect on the way in — and the query is
  // what carries the Developer-Mode intent.
  return isCustomStrategyRow(displayId)
    ? `/strategy-builder/?mode=developer&custom=${id}`
    : `/strategy-builder/${id}/`
}

function safeGet(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value)
  } catch { }
}

/** The default view chosen in the one-time first-launch dialog, if set. */
export function getPreferredMode(): BuilderMode | null {
  const value = safeGet(PREFERRED_MODE_KEY)
  return value === "developer" || value === "nocode" ? value : null
}

export function setPreferredMode(mode: BuilderMode): void {
  safeSet(PREFERRED_MODE_KEY, mode)
}
