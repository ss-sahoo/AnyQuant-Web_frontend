// Single source of truth for the strategy engine's indicator-block contract.
//
// Every entry on a strategy condition's inp1 / inp2 side must take one of five
// shapes. The engine reads `inp.type` first and dispatches on it — there is no
// other path:
//
//   { type: "value",      value }                                  fixed number
//   { type: "C",          input, name, timeframe }                 OHLCV column
//   { type: "I",          name, timeframe, input?, input_params }  TA-Lib indicator
//   { type: "nperiod_hl", side, timeframe, input_params }          N-period high/low
//   { type: "CUSTOM_I",   name, timeframe, input_params }          built-in / user indicator
//
// The allowed indicator names and per-indicator parameter keys / enum values
// below are extracted verbatim from the engine source:
//   AnyQuantDiracAI/helper/StrategyHelper.py      -> BUILTIN_CUSTOM_INDICATORS
//   AnyQuantDiracAI/helper/CustomIndicatorHelper.py -> indicator_methods +
//     each class's calculate(...) signature
//   AnyQuantDiracAI/helper/data_processing.py     -> engine-side default fills
//
// This is the ONLY place an indicator name or a parameter key/enum value is
// allowed to appear as a literal in the frontend. UI dropdowns, serialisers and
// the pre-submit validator all read from here so they can never drift apart
// (which is exactly the bug this file exists to kill: divergent hardcoded lists
// that offered engine-invalid values like "TEMA"/"DEMA"/"HMA").

// ---------------------------------------------------------------------------
// Shared enums — define once, reuse everywhere.
// ---------------------------------------------------------------------------

/** OHLCV source columns, capitalised — used by MA-family `ma_source`/`rsi_source`. */
export const SOURCES = ["Open", "High", "Low", "Close", "Volume"] as const

/** OHLCV `input` for a `type: "C"` column block (lowercase — engine reads inp.input). */
export const OHLCV_INPUTS = ["open", "high", "low", "close", "volume"] as const

/** MA types accepted by TechnicalIndicators.moving_average (the MA family).
 *  "Bollinger Bands" was removed from this set — when it was selected as an
 *  ma_type it acted as a band rather than a moving average, which doesn't fit
 *  the MA-family dropdowns. The engine still accepts it as a string value, so
 *  legacy strategies that picked it continue to load; it's just no longer
 *  offered as an option in the UI. */
export const MA_TYPES = ["SMA", "EMA", "WMA", "VWMA", "SMMA (RMA)"] as const

/**
 * MA types accepted by MACD._moving_average_custom. NOTE this is a *subset* of
 * MA_TYPES — MACD does not support VWMA or "Bollinger Bands".
 */
export const MACD_MA_TYPES = ["SMA", "EMA", "WMA", "SMMA (RMA)"] as const

/** ATR smoothing — engine only accepts these two. */
export const ATR_SMOOTHING = ["RMA", "SMA"] as const

/** MACD source price (lowercase — engine normalises but stick to this). */
export const MACD_SOURCES = ["open", "high", "low", "close"] as const

/** MACD output selector. */
export const MACD_INDICATOR_TYPES = ["MACD", "Signal", "Histogram"] as const

/** Stochastic MA-type codes: 0=SMA, 1=EMA, 2=WMA. */
export const STOCH_MATYPES = [0, 1, 2] as const

/** Stochastic output selector. */
export const STOCH_OUTPUTS = ["slowk", "slowd", "fastk", "fastd"] as const

/** HistoricalPriceLevel period / level. Engine also accepts "Q" (Quarterly). */
export const HPL_PERIODS = ["D", "W", "M", "Q"] as const
export const HPL_LEVELS = ["High", "Low"] as const

// The three enums below were VERIFIED against the engine source rather than the
// task brief, which had them wrong:
//   - Supertrend output is trend/up/dn/BuySignal/SellSignal (not "buy_sell").
//   - CandleSize output is price/pips (not "pip"); asset_type has 5 values.
//   - SmoothedHeikenAshi output is signal/close/open/high/low (not "ha_close").

/** SupertrendIndicator.calculate output_map keys (engine lowercases input). */
export const SUPERTREND_OUTPUTS = ["trend", "up", "dn", "BuySignal", "SellSignal"] as const

/** CandleSize.calculate asset_type / output. */
export const CANDLESIZE_ASSET_TYPES = ["forex", "gold", "forex_jpy", "crypto", "stocks"] as const
export const CANDLESIZE_OUTPUTS = ["price", "pips"] as const

/** SmoothedHeikenAshi.calculate output. */
export const SHA_OUTPUTS = ["signal", "close", "open", "high", "low"] as const

/**
 * HullTrendIndicator output columns. The engine special-case pops `output`
 * (default "HMA") and raises if it isn't one of these. "HMA" is the price-line
 * default; the signal/trend columns are booleans. Case-sensitive on the engine
 * (it does a column-name lookup), so emit these spellings verbatim.
 */
export const HULL_OUTPUTS = [
  "HMA", "Diff", "Smoothed Diff", "Uptrend", "Downtrend", "Trend Reversal", "Long", "Short",
] as const

/** CumulativeVolumeDelta reset_period (null = no reset). */
export const CVD_RESET_PERIODS = ["D", "W", "M", "Q"] as const

/** Inner indicators a Derivative can wrap (calculate_derivative.nth_derivative). */
export const DERIVATIVE_COLS = ["RSI", "RSI_MA", "Close_MA", "Open_MA", "Volume_MA", "GENERAL_PA"] as const

// ---------------------------------------------------------------------------
// CUSTOM_I contract — every built-in indicator, every parameter.
// ---------------------------------------------------------------------------

export type ParamFieldType = "select" | "int" | "float" | "bool" | "str"

export interface ParamSpec {
  name: string                         // verbatim input_params key
  type: ParamFieldType
  default: number | string | boolean | null
  options?: readonly (string | number)[]
  nullable?: boolean                   // value may be null (e.g. fastd_period)
  /**
   * The engine silently DEFAULTS an out-of-range value here rather than
   * raising (e.g. ATR treats any non-"SMA" smoothing as "RMA"; MACD maps an
   * unknown source to Close; Stochastic matype falls back to SMA). `options`
   * is still kept for documentation / UI, but the pre-submit validator must
   * NOT hard-fail on it — doing so would block strategies the engine runs
   * fine, including legacy data saved from older, wider dropdowns.
   * Enforcement is reserved for fields the engine actually rejects.
   */
  softDefault?: boolean
}

export interface IndicatorSpec {
  params: ParamSpec[]
  /**
   * When true, input_params keys not listed in `params` are tolerated rather
   * than rejected. Only Derivative needs this — it passes the wrapped inner
   * indicator's own params straight through (nth_derivative(**kwargs)).
   */
  allowExtraParams?: boolean
}

export const INDICATOR_CONTRACT: Record<string, IndicatorSpec> = {
  MA: {
    params: [
      { name: "ma_source", type: "select", default: "Close", options: SOURCES },
      { name: "ma_type", type: "select", default: "SMA", options: MA_TYPES },
      { name: "ma_length", type: "int", default: 14 },
    ],
  },
  // ma_source is implied by the indicator name — do NOT send it.
  Open_MA: {
    params: [
      { name: "ma_type", type: "select", default: "SMA", options: MA_TYPES },
      { name: "ma_length", type: "int", default: 14 },
    ],
  },
  Close_MA: {
    params: [
      { name: "ma_type", type: "select", default: "SMA", options: MA_TYPES },
      { name: "ma_length", type: "int", default: 14 },
    ],
  },
  Volume_MA: {
    params: [
      { name: "ma_type", type: "select", default: "SMA", options: MA_TYPES },
      { name: "ma_length", type: "int", default: 14 },
    ],
  },
  RSI_MA: {
    params: [
      { name: "rsi_source", type: "select", default: "Close", options: SOURCES },
      { name: "rsi_length", type: "int", default: 14 },
      { name: "ma_type", type: "select", default: "SMA", options: MA_TYPES },
      { name: "ma_length", type: "int", default: 14 },
      // bb_stddev only used when ma_type == "Bollinger Bands"; omit otherwise.
      { name: "bb_stddev", type: "float", default: 2.0 },
    ],
  },
  ATR: {
    params: [
      { name: "atr_length", type: "int", default: 14 },
      // Engine: `if atr_smoothing == "SMA" ... else RMA` — any other value is
      // silently treated as RMA, never rejected.
      { name: "atr_smoothing", type: "select", default: "RMA", options: ATR_SMOOTHING, softDefault: true },
    ],
  },
  MACD: {
    // MACD never raises on a bad enum: source is run through a lookup that
    // defaults to Close, and ma_type / indicator_type fall back to EMA / the
    // MACD line. So none of its selects are hard-enforced.
    params: [
      { name: "macd_fast_length", type: "int", default: 12 },
      { name: "macd_slow_length", type: "int", default: 26 },
      { name: "macd_source", type: "select", default: "close", options: MACD_SOURCES, softDefault: true },
      { name: "macd_signal_smoothing", type: "int", default: 9 },
      { name: "macd_oscillator_ma_type", type: "select", default: "EMA", options: MACD_MA_TYPES, softDefault: true },
      { name: "macd_signal_ma_type", type: "select", default: "EMA", options: MACD_MA_TYPES, softDefault: true },
      { name: "macd_indicator_type", type: "select", default: "MACD", options: MACD_INDICATOR_TYPES, softDefault: true },
    ],
  },
  Stochastic: {
    params: [
      { name: "fastk_period", type: "int", default: 14 },
      { name: "slowk_period", type: "int", default: 3 },
      { name: "slowd_period", type: "int", default: 3 },
      { name: "fastd_period", type: "int", default: null, nullable: true },
      // matypes: engine's _moving_average implements 0/1/2 and falls back to
      // SMA for anything else — never rejected.
      { name: "slowk_matype", type: "int", default: 0, options: STOCH_MATYPES, softDefault: true },
      { name: "slowd_matype", type: "int", default: 0, options: STOCH_MATYPES, softDefault: true },
      { name: "fastd_matype", type: "int", default: 0, options: STOCH_MATYPES, softDefault: true },
      // output IS hard-validated by the engine (raises ValueError).
      { name: "output", type: "select", default: "slowk", options: STOCH_OUTPUTS },
    ],
  },
  HullTrendIndicator: {
    // Engine special-case (mirrors Supertrend): pops `period` for the
    // constructor and `output` to pick a result column. Both belong in
    // input_params — the FE should send `period`, and `output` if exposed.
    params: [
      { name: "period", type: "int", default: 9 },
      // Omitting output defaults to "HMA" (the price line). Engine RAISES on an
      // unknown output, so this is hard-enforced.
      { name: "output", type: "select", default: "HMA", options: HULL_OUTPUTS },
    ],
  },
  SupertrendIndicator: {
    params: [
      { name: "period", type: "int", default: 10 },
      { name: "multiplier", type: "float", default: 3.0 },
      { name: "change_atr_method", type: "bool", default: true },
      { name: "output", type: "select", default: "trend", options: SUPERTREND_OUTPUTS },
    ],
  },
  VolumeDelta: {
    params: [{ name: "lower_timeframe", type: "str", default: "1min" }],
  },
  CumulativeVolumeDelta: {
    params: [
      { name: "lower_timeframe", type: "str", default: "1min" },
      // Engine only acts on exact 'D'/'W'/'M'; any other value just means
      // "no reset", never an error.
      { name: "reset_period", type: "select", default: null, options: CVD_RESET_PERIODS, nullable: true, softDefault: true },
    ],
  },
  HistoricalPriceLevel: {
    params: [
      { name: "period", type: "select", default: "W", options: HPL_PERIODS },
      { name: "level", type: "select", default: "High", options: HPL_LEVELS },
    ],
  },
  CandleSize: {
    params: [
      { name: "asset_type", type: "select", default: "forex", options: CANDLESIZE_ASSET_TYPES },
      { name: "output", type: "select", default: "price", options: CANDLESIZE_OUTPUTS },
    ],
  },
  SmoothedHeikenAshi: {
    params: [
      { name: "len1", type: "int", default: 10 },
      { name: "len2", type: "int", default: 10 },
      // emaLen only used when output == "signal"; omit otherwise.
      { name: "emaLen", type: "int", default: 21 },
      // Engine returns the signal series for any unrecognised output (no raise).
      { name: "output", type: "select", default: "signal", options: SHA_OUTPUTS, softDefault: true },
    ],
  },
  Derivative: {
    // col + order, PLUS the wrapped inner indicator's own params (passed
    // through verbatim to nth_derivative(**kwargs)).
    allowExtraParams: true,
    params: [
      { name: "col", type: "select", default: "RSI", options: DERIVATIVE_COLS },
      { name: "order", type: "int", default: 1 },
    ],
  },
  GENERAL_PA: {
    params: [],
  },
}

/** Names of every built-in CUSTOM_I indicator (for pickers). */
export const BUILTIN_INDICATOR_NAMES = Object.keys(INDICATOR_CONTRACT)

// ---------------------------------------------------------------------------
// Pre-submit validator.
//
// Run on every inp1 / inp2 block right before the strategy is POSTed to
// run-backtest. Throws a precise Error on the first non-conforming block so the
// caller can show an inline message and refuse to submit. This isn't a
// safeguard for one indicator — it proves every block conforms before the
// engine ever sees it.
// ---------------------------------------------------------------------------

/** Treat optimisable range objects { start, stop, step, value } as "a number". */
function isRangeValue(v: unknown): boolean {
  return !!v && typeof v === "object" && !Array.isArray(v) && "start" in (v as any) && "stop" in (v as any)
}

/**
 * Does `v` match one of `options`? Numeric options compare strictly; string
 * options compare case-insensitively, because many engine fields (e.g.
 * macd_indicator_type, macd_source, Supertrend/Stochastic/CandleSize outputs)
 * call `.lower()` before matching — so 'histogram' is as valid as 'Histogram'.
 * Genuinely-invalid values (TEMA, HMA, pip, ...) are absent under any casing,
 * so this stays strict where it matters while not blocking valid mixed case.
 */
function optionMatches(options: readonly (string | number)[], v: unknown): boolean {
  return options.some((opt) =>
    typeof opt === "number" ? opt === v : String(opt).toLowerCase() === String(v).toLowerCase(),
  )
}

export function validateIndicatorBlock(inp: any): void {
  if (!inp || typeof inp !== "object") return
  const type = inp.type

  switch (type) {
    case "value": {
      const v = inp.value
      if (typeof v !== "number" && !isRangeValue(v) && !(typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)))) {
        throw new Error(`value block must carry a numeric 'value' (got ${JSON.stringify(v)})`)
      }
      return
    }

    case "C": {
      const col = String(inp.input ?? "").toLowerCase()
      if (!(OHLCV_INPUTS as readonly string[]).includes(col)) {
        throw new Error(`OHLCV column 'input' must be one of ${OHLCV_INPUTS.join(", ")} (got '${inp.input}')`)
      }
      return
    }

    case "I": {
      // TA-Lib indicator. The engine owns the full TA-Lib name set; we only
      // assert a name is present and, for BBANDS, that the band selector is valid.
      if (!inp.name || typeof inp.name !== "string") {
        throw new Error(`I block is missing an indicator 'name'`)
      }
      if (inp.name === "BBANDS" && inp.input != null) {
        const bands = ["upperband", "middleband", "lowerband"]
        if (!bands.includes(String(inp.input))) {
          throw new Error(`BBANDS 'input' must be one of ${bands.join(", ")} (got '${inp.input}')`)
        }
      }
      return
    }

    case "nperiod_hl": {
      if (inp.side !== "high" && inp.side !== "low") {
        throw new Error(`nperiod_hl 'side' must be 'high' or 'low' (got '${inp.side}')`)
      }
      const nperiod = inp.input_params?.nperiod
      if (nperiod == null || (typeof nperiod !== "number" && !isRangeValue(nperiod) && !Number.isFinite(Number(nperiod)))) {
        throw new Error(`nperiod_hl requires a numeric input_params.nperiod`)
      }
      return
    }

    case "CUSTOM_I": {
      // User-defined Developer-Mode indicators carry a custom_component_id and
      // own their own schema — the contract here covers built-ins only.
      if (inp.custom_component_id != null) return

      const spec = INDICATOR_CONTRACT[inp.name]
      if (!spec) {
        throw new Error(
          `Unknown indicator '${inp.name}'. Built-in options: ${BUILTIN_INDICATOR_NAMES.join(", ")}.`,
        )
      }

      const params = inp.input_params || {}
      const allowed = new Set(spec.params.map((p) => p.name))

      if (!spec.allowExtraParams) {
        for (const key of Object.keys(params)) {
          if (!allowed.has(key)) {
            throw new Error(
              `Unknown parameter '${key}' for ${inp.name}. Allowed: ${[...allowed].join(", ") || "(none)"}.`,
            )
          }
        }
      }

      for (const p of spec.params) {
        const v = params[p.name]
        if (v == null) continue // unset / null — engine default-fills.
        // Only hard-fail where the engine itself rejects the value. softDefault
        // fields are silently defaulted by the engine, so blocking them would
        // be a false positive (and break legacy data from older dropdowns).
        if (p.softDefault) continue
        if (p.options && !isRangeValue(v) && !optionMatches(p.options, v)) {
          throw new Error(
            `${inp.name}.${p.name}='${v}' is not allowed. Choose from ${p.options.join(", ")}.`,
          )
        }
      }
      return
    }

    default:
      throw new Error(`Unknown indicator block type '${type}'. Expected value | C | I | nperiod_hl | CUSTOM_I.`)
  }
}

/**
 * Walk a parsed strategy statement (single object or array of statements) and
 * validate every inp1 / inp2 block. Throws on the first non-conforming block.
 */
export function validateStrategyStatement(parsed: any): void {
  if (!parsed) return
  const statements = Array.isArray(parsed) ? parsed : parsed.strategy ? [parsed] : []

  statements.forEach((stmt: any, si: number) => {
    const conds = Array.isArray(stmt?.strategy) ? stmt.strategy : []
    conds.forEach((cond: any, ci: number) => {
      for (const slot of ["inp1", "inp2"] as const) {
        const inp = cond?.[slot]
        if (inp && typeof inp === "object" && "type" in inp) {
          try {
            validateIndicatorBlock(inp)
          } catch (e: any) {
            throw new Error(`Statement ${si + 1}, condition ${ci + 1} (${slot}): ${e.message}`)
          }
        }
      }
    })
  })
}
