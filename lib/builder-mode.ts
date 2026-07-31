/**
 * Per-strategy builder-mode memory (ANY-308).
 *
 * Records which editor view (no-code vs Developer Mode) a strategy was last
 * edited in, whether Developer Mode was ever used on it (Hybrid badge), and
 * the link between a regular strategy and the custom (code-based) strategy
 * created/edited from inside it. All values live in localStorage, so memory
 * is per-browser; a backend `last_edited_mode` field plus a regular<->custom
 * link would be needed for cross-device persistence.
 */

import { findCustomBlocks } from "./custom-component-schema"

export type BuilderMode = "developer" | "nocode"

/** The badge shown on the home table. Mirrors the backend `builder_type`. */
export type BuilderType = "nocode" | "developer" | "hybrid"

/**
 * The `strategy_type` field POST /api/run-backtest/ expects. Distinct from
 * `BuilderType`: this is the wire vocabulary, and the values differ
 * (`no_code`/`dev_mode`, not `nocode`/`developer`).
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
  // StrategyStatement for dev-mode strategies, so a hybrid statement can carry
  // a `custom_strategy_id` too, and hybrid is the more specific answer.
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

const LAST_MODE_PREFIX = "strategy_last_mode_"
const DEV_USED_PREFIX = "strategy_dev_used_"
const DEV_LINK_PREFIX = "strategy_dev_link_"
const BUILDER_TYPE_PREFIX = "strategy_builder_type_"
const PREFERRED_MODE_KEY = "preferred_builder_mode"

export function isBuilderType(value: unknown): value is BuilderType {
  return value === "nocode" || value === "developer" || value === "hybrid"
}

/**
 * Whether a home-table row came from the custom-strategies API rather than the
 * regular strategies API, told by the `-dev-` marker the list builder puts in
 * the display id. The two id sequences are independent, so this — not the
 * `developer` badge, which a regular strategy can also carry — is what decides
 * which endpoints and routes a row may use.
 */
export function isCustomStrategyRow(displayId: string | number): boolean {
  return String(displayId).includes("-dev-")
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

function safeRemove(key: string): void {
  try {
    if (typeof window !== "undefined") window.localStorage.removeItem(key)
  } catch { }
}

/** The view a regular strategy was last edited in, if recorded. */
export function getLastMode(strategyId: string | number): BuilderMode | null {
  const value = safeGet(`${LAST_MODE_PREFIX}${strategyId}`)
  return value === "developer" || value === "nocode" ? value : null
}

export function setLastMode(strategyId: string | number, mode: BuilderMode): void {
  safeSet(`${LAST_MODE_PREFIX}${strategyId}`, mode)
  // Dev usage is sticky: once Developer Mode has touched a strategy it stays
  // classified as Hybrid even after the user switches back to no-code.
  if (mode === "developer") safeSet(`${DEV_USED_PREFIX}${strategyId}`, "1")
}

/** Whether Developer Mode was ever used while editing this regular strategy. */
export function wasDevModeUsed(strategyId: string | number): boolean {
  return safeGet(`${DEV_USED_PREFIX}${strategyId}`) === "1"
}

/**
 * The user's explicit type choice for a regular strategy, if made. Local mirror
 * of the backend `builder_type`: it keeps the badge and the routing correct
 * while offline and on backends that predate the field.
 */
export function getBuilderType(strategyId: string | number): BuilderType | null {
  const value = safeGet(`${BUILDER_TYPE_PREFIX}${strategyId}`)
  return isBuilderType(value) ? value : null
}

/**
 * Record the chosen type and align the view memory with it, so the next open
 * lands in the editor the badge advertises: No-code opens the statements,
 * Developer and Hybrid reopen with the code editor.
 */
export function setBuilderType(strategyId: string | number, type: BuilderType): void {
  safeSet(`${BUILDER_TYPE_PREFIX}${strategyId}`, type)
  if (type === "nocode") {
    safeSet(`${LAST_MODE_PREFIX}${strategyId}`, "nocode")
    // Dropping the sticky dev-usage flag is what makes No-code stick: otherwise
    // the derived badge would fall straight back to Hybrid on the next reload.
    safeRemove(`${DEV_USED_PREFIX}${strategyId}`)
  } else {
    setLastMode(strategyId, "developer")
  }
}

/** The custom strategy linked to a regular strategy, if any. */
export function getDevLink(strategyId: string | number): number | null {
  const value = safeGet(`${DEV_LINK_PREFIX}${strategyId}`)
  if (value == null || value === "") return null
  const id = Number(value)
  return Number.isFinite(id) ? id : null
}

export function setDevLink(strategyId: string | number, customStrategyId: number): void {
  safeSet(`${DEV_LINK_PREFIX}${strategyId}`, String(customStrategyId))
}

/**
 * The regular strategy whose dev link points at this custom strategy, if any.
 * Used by the tester's "Back to Editor" to return a hybrid strategy to its
 * regular-strategy context instead of a detached Developer Mode session.
 */
export function findRegularStrategyLinkedTo(customStrategyId: number): string | null {
  try {
    if (typeof window === "undefined") return null
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key?.startsWith(DEV_LINK_PREFIX) && window.localStorage.getItem(key) === String(customStrategyId)) {
        return key.slice(DEV_LINK_PREFIX.length)
      }
    }
  } catch { }
  return null
}

/**
 * Drop every reference to a deleted custom strategy and fall the affected
 * regular strategies back to the no-code view.
 */
export function clearDevLinksTo(customStrategyId: number): void {
  try {
    if (typeof window === "undefined") return
    const staleKeys: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key?.startsWith(DEV_LINK_PREFIX) && window.localStorage.getItem(key) === String(customStrategyId)) {
        staleKeys.push(key)
      }
    }
    for (const key of staleKeys) {
      safeRemove(key)
      safeSet(`${LAST_MODE_PREFIX}${key.slice(DEV_LINK_PREFIX.length)}`, "nocode")
    }
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
