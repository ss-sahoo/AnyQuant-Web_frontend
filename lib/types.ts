export interface Algorithm {
  strategy: boolean
  id: string
  name: string
  instrument: string
  /**
   * How the strategy was built (ANY-308). Rows from the custom-strategies API
   * are "developer"; regular rows are "nocode". Fixed at creation and
   * display-only — a strategy never changes type.
   */
  type?: "nocode" | "developer"
}
