export interface Algorithm {
  strategy: boolean
  id: string
  name: string
  instrument: string
  /**
   * How the strategy was built (ANY-308). Rows from the custom-strategies API
   * are always "developer". Regular rows take the backend `builder_type` when
   * present, else the user's explicit choice, else "hybrid" if Developer Mode
   * has been used on them (per-browser memory), else "nocode".
   */
  type?: "nocode" | "developer" | "hybrid"
  /** Backend-persisted type, once the StrategyStatement field exists. */
  builder_type?: "nocode" | "developer" | "hybrid"
  /** Custom (code) strategy this regular strategy is paired with, if hybrid. */
  linked_custom_strategy_id?: number | null
}
