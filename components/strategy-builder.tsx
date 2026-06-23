"use client"

import type React from "react"

import { useState, useRef, useEffect, useMemo } from "react"
import { Edit, MoreVertical, Plus, ChevronDown, X, Code, Undo2, Redo2 } from 'lucide-react'
import { useHistory } from "@/hooks/use-history"
import { StochasticSettingsModal } from "@/components/modals/stochastic-settings-modal"
import { CrossingUpSettingsModal } from "@/components/modals/crossing-up-settings-modal"
import { BollingerBandsSettingsModal } from "@/components/modals/bollinger-bands-settings-modal"
import { VolumeSettingsModal } from "@/components/modals/volume-settings-modal"
import { AtrSettingsModal } from "@/components/modals/atr-settings-modal"
import { MacdSettingsModal } from "@/components/modals/macd-settings-modal"
import { SuperTrendSettingsModal } from "@/components/modals/supertrend-settings-modal"
import { MaSettingsModal } from "@/components/modals/ma-settings-modal"
import { RsiSettingsModal } from "@/components/modals/rsi-settings-modal"
import { RsiMaSettingsModal } from "@/components/modals/rsi-ma-settings-modal"
import { VolumeMaSettingsModal } from "@/components/modals/volume-ma-settings-modal"
import { ChannelSettingsModal } from "@/components/modals/channel-settings-modal"
import { SLTPSettingsModal, type SLTPSettings } from "@/components/modals/sl-tp-settings-modal"
import { PriceSettingsModal } from "@/components/modals/price-settings-modal"
import { AtCandleModal } from "@/components/modals/at-candle-modal"
import { DerivativeSettingsModal } from "@/components/modals/derivative-settings-modal"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createStatement, editStrategy, createCustomComponent, validateCustomComponentCode, activateCustomComponent, listCustomComponents, createCustomStrategy, validateCustomStrategyCode, getCustomStrategyTemplate, updateCustomStrategy, listCustomStrategies, deleteCustomStrategy, getCustomStrategy, updateCustomComponent, fetchStatementDetail, validateStrategy } from "@/app/AllApiCalls"
import type { JSX } from "react/jsx-runtime"
import { PipsSettingsModal } from "@/components/modals/pips-settings-modal"
import { SaveStrategyModal } from "@/components/modals/save-strategy-modal"
import { CustomTimeframeModal } from "@/components/modals/custom-timeframe-modal"
import { CrossingDownSettingsModal } from "./modals/crossing-down-settings-modal"
import { BelowSettingsModal } from "@/components/modals/below-settings-modal"
import { AccumulatorSettingsModal } from "@/components/modals/accumulator-settings-modal"
import { ThenSettingsModal } from "@/components/modals/then-settings-modal"
import { AboveSettingsModal } from "./modals/above-settings-modal"
import { MovingOperatorSettingsModal } from "@/components/modals/moving-operator-settings-modal"
import { PartialTPSettingsModal, type PartialTPSettings } from "@/components/modals/partial-tp-settings-modal"
import { ManageExitSettingsModal, type ManageExitSettings } from "@/components/modals/manage-exit-settings-modal"
import type { TradeTimingSettings } from "@/components/modals/trade-timing-modal"
import { MaxTradeDurationModal } from "@/components/modals/max-trade-duration-modal"
import { VolumeDeltaSettingsModal } from "@/components/modals/volume-delta-settings-modal"
import { CumulativeVolumeDeltaSettingsModal } from "@/components/modals/cumulative-volume-delta-settings-modal"
import { HistoricalPriceLevelSettingsModal } from "@/components/modals/historical-price-level-settings-modal"
import { CandleSizeSettingsModal } from "@/components/modals/candle-size-settings-modal"
import { DeveloperModePage } from "@/components/developer-mode-page"
import { CustomIndicatorSettingsModal } from "@/components/modals/custom-indicator-settings-modal"
import { CustomComponentPropertiesDialog, type CustomComponentKind } from "@/components/modals/custom-component-properties-dialog"
import {
  ParameterSchema,
  ParamRuntimeValue,
  normalizeStoredParameters,
  parseDrfParameterErrors,
} from "@/lib/custom-component-schema"
import { EditStrategyModal } from "@/components/edit-strategy-modal"
import { TradingSessionModal } from "./trading-session-modal"
import type { Algorithm } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

interface StrategyBuilderProps {
  initialName?: string
  initialInstrument?: string
  strategyData?: any
  strategyId?: string | null
}

// Define the structure for our strategy statements
interface IndicatorParams {
  timeperiod?: number
  [key: string]: any
}

// Update the IndicatorInput interface to include all necessary properties
interface IndicatorInput {
  type: string
  input?: string
  name?: string
  timeframe: string
  input_params?: IndicatorParams
  index?: number
  wait?: string
  Derivative?: {
    order: number
  }
}

// Update the StrategyCondition interface to fix type issues
interface StrategyCondition {
  statement: string
  // When true, the row negates: the trade is blocked if this condition is met.
  // Encoded as a sibling of `statement` (statement stays "and"); backend accepts
  // it alongside the normal condition fields.
  no_trade?: boolean
  inp1?: IndicatorInput | { name: string }
  operator_name?: string
  operator_display?: string // Store the original display label for UI
  // New operator structure for moving_up and moving_down
  Operator?: {
    operator_name: string
    params: {
      logical_operator: string
      value: number
      unit: string
    }
  }
  inp2?:
  | {
    type: string
    value?: number
    wait?: string
    index?: number
    timeframe?: string
    input?: string
    name?: string
    input_params?: any
    Derivative?: {
      order: number
    }
  }
  | { name: string }
  timeframe?: string // Added timeframe property to StrategyCondition
  operator?: string
  pips?: number
  Accumulate?: {
    forPeriod: string
  }
  Then?: {
    Wait: string
    count: string
    candle: string
  }
  pendingAtCandle?: {
    inp1?: number
    inp2?: number
  }
  offset?: {
    logical_operator: string
    value: number
    unit: string
  }
}

// Update the EquityRule interface to fix partial_tp_list type
interface EquityRule {
  statement: string
  operator?: string
  inp1?: {
    name: string
    input_params?: {
      TrailingStop?: string
      TrailingStep?: string
      [key: string]: any
    }
    partial_tp_list?: Array<{
      Price?: string
      Close: string
      name?: string
      operator?: string
      Action?: string
    }>
    manage_exit_list?: Array<{
      Price: string
      Action: string
    }>
    [key: string]: any
  }
  inp2?: {
    name: string
    side?: string
    timeframe?: string
    input_params?: {
      nperiod?: number
      [key: string]: any
    }
    [key: string]: any
  }
  trade_management?: {
    type: string
    name: string
    params: {
      [key: string]: any
    }
  }
}

// Update the StrategyStatement interface to include TradingType and TradingSession
interface StrategyStatement {
  side: string
  saveresult: string
  strategy: StrategyCondition[]
  Equity: EquityRule[]
  TradingType?: {
    NewTrade?: string
    commission?: number
    margin?: number
    lot?: string
    cash?: number
    nTrade_max?: number
  }
  TradingSession?: {
    Timezone: string
    Day: {
      Operator: string
      input: string
    }
    Time: {
      Operator: string
      input: string[]
    }
  }
}

// Backend allowlist for CUSTOM_I names is case-sensitive. Naive
// `component.toUpperCase()` turned "Open_MA" → "OPEN_MA" etc., which the engine
// then failed to match (`Indicator 'OPEN_MA' not found`). Return the exact
// spelling the backend expects, falling back to the generic "MA" so the rule
// never emits an unknown name.
const VALID_MA_FAMILY: Record<string, string> = {
  "ma": "MA",
  "volume_ma": "Volume_MA",
  "volume-ma": "Volume_MA",
  "volumema": "Volume_MA",
  "open_ma": "Open_MA",
  "open-ma": "Open_MA",
  "openma": "Open_MA",
  "close_ma": "Close_MA",
  "close-ma": "Close_MA",
  "closema": "Close_MA",
  "rsi_ma": "RSI_MA",
  "rsi-ma": "RSI_MA",
  "rsima": "RSI_MA",
}
function normalizeMaFamilyName(component: string): string {
  const key = component.toLowerCase().trim()
  return VALID_MA_FAMILY[key] || "MA"
}

// MACD lives in its own panel on the backtest plot (engine registry routes it
// there regardless of the strategy). Comparing it against an OHLC price renders
// MACD (~±50) on the price axis (~4000) as a flat unreadable line. Block both
// directions of the comparison before the row is built.
function isPriceOhlcOperand(operand: any): boolean {
  if (!operand || typeof operand !== "object") return false
  const lc = (s: any) => String(s ?? "").toLowerCase()
  if (operand.type === "C" && ["open", "high", "low", "close"].includes(lc(operand.input))) return true
  // Generic safety net for operand shapes that store the price as `name` or
  // `input` without a `type` field (e.g. legacy serialised data).
  if (["open", "high", "low", "close"].includes(lc(operand.name))) return true
  if (["open", "high", "low", "close"].includes(lc(operand.input))) return true
  return false
}
function isMacdOperand(operand: any): boolean {
  return !!(operand && typeof operand === "object" && operand.name === "MACD")
}

export function StrategyBuilder({ initialName, initialInstrument, strategyData, strategyId }: StrategyBuilderProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("create")
  const [showStochasticModal, setShowStochasticModal] = useState(false)
  const [showCrossingUpModal, setShowCrossingUpModal] = useState(false)
  const [crossingUpInitialSettings, setCrossingUpInitialSettings] = useState<any>(undefined)
  const [showCrossingDownModal, setShowCrossingDownModal] = useState(false)
  const [showAboveModal, setShowAboveModal] = useState(false)
  const [showBelowModal, setShowBelowModal] = useState(false)
  const [showBollingerModal, setShowBollingerModal] = useState(false)
  const [showVolumeModal, setShowVolumeModal] = useState(false)
  const [showAtrModal, setShowAtrModal] = useState(false)
  const [showMacdModal, setShowMacdModal] = useState(false)
  const [showSuperTrendModal, setShowSuperTrendModal] = useState(false)
  const [showMaModal, setShowMaModal] = useState(false)
  const [showRsiModal, setShowRsiModal] = useState(false)
  const [showRsiMaModal, setShowRsiMaModal] = useState(false)
  const [showVolumeMaModal, setShowVolumeMaModal] = useState(false)
  const [showChannelModal, setShowChannelModal] = useState(false)
  const [showSLTPSettings, setShowSLTPSettings] = useState<{ show: boolean; type: "SL" | "TP" }>({
    show: false,
    type: "SL",
  })
  const [showPartialTPModal, setShowPartialTPModal] = useState(false)
  const [showManageExitModal, setShowManageExitModal] = useState(false)
  const [showMaxDurationModal, setShowMaxDurationModal] = useState(false)
  // tradeTiming is no longer editable from the strategy-builder UI (only the
  // strategy-testing page edits it). We still hold it so it round-trips through
  // the JSON payload when a strategy is loaded then re-saved.
  const [tradeTiming, setTradeTiming] = useState<TradeTimingSettings>({ entry_at: "bar close", exit_at: "bar close" })
  const [showVolumeDeltaModal, setShowVolumeDeltaModal] = useState(false)
  const [showCumulativeVolumeDeltaModal, setShowCumulativeVolumeDeltaModal] = useState(false)
  const [showHistoricalPriceLevelModal, setShowHistoricalPriceLevelModal] = useState(false)
  const [showCandleSizeModal, setShowCandleSizeModal] = useState(false)
  const [showDerivativeModal, setShowDerivativeModal] = useState(false)
  const [showDeveloperModeModal, setShowDeveloperModeModal] = useState(false)
  const [showTradingSessionModal, setShowTradingSessionModal] = useState(false)

  const [showSaveStrategyModal, setShowSaveStrategyModal] = useState(false)
  const [strategyName, setStrategyName] = useState(initialName || "")
  const [persistedId, setPersistedId] = useState<string | null>(strategyId || null)
  const [showPriceSettingsModal, setShowPriceSettingsModal] = useState(false)
  const [showAtCandleModal, setShowAtCandleModal] = useState(false)
  const [selectedCandleNumber, setSelectedCandleNumber] = useState<number | null>(null)

  // Initialize with a statement structure that includes "if" and default TradingType settings
  const [statements, setStatements] = useState<StrategyStatement[]>([
    {
      side: "", // Remove default Buy
      saveresult: "Statement 1",
      strategy: [
        {
          statement: "if",
          // Remove default timeframe - let user add it explicitly
        },
      ],
      Equity: [],
      TradingType: {
        NewTrade: "MTOOTAAT",
        commission: 0.00007,
        margin: 1,
        lot: "mini",
        cash: 100000,
        nTrade_max: 1,
      },
    },
  ])

  // Undo/redo for the strategy state. Tracks history externally because the
  // builder mutates statements in place before calling setStatements; the hook
  // snapshots via JSON.stringify to insulate history from later mutations.
  const { undo: undoStatements, redo: redoStatements, canUndo, canRedo, resetHistory: resetStatementsHistory, skipNextChange: skipNextHistoryChange } = useHistory(statements, setStatements)

  // Detect partially-built conditions — typically created when the user deletes
  // one half of a condition and hasn't refilled it yet. The Save / Continue
  // flow already refuses these, so we surface a visible warning explaining why.
  const strategyValidationIssues = useMemo(() => {
    const issues: { statement: string; conditionIndex: number; missing: string[] }[] = []
    statements.forEach((stmt, sIdx) => {
      const stmtLabel = stmt.saveresult || `Statement ${sIdx + 1}`
      stmt.strategy.forEach((cond, cIdx) => {
        const hasInp1 = !!cond.inp1
        const hasOp = !!cond.operator_name
        const hasInp2 = !!cond.inp2
        const hasAny = hasInp1 || hasOp || hasInp2
        const hasAll = hasInp1 && hasOp && hasInp2
        if (hasAny && !hasAll) {
          const missing: string[] = []
          if (!hasInp1) missing.push("first input")
          if (!hasOp) missing.push("operator")
          if (!hasInp2) missing.push("second input")
          issues.push({ statement: stmtLabel, conditionIndex: cIdx, missing })
        }
      })
    })
    return issues
  }, [statements])
  const isStrategyValid = strategyValidationIssues.length === 0

  const [activeStatementIndex, setActiveStatementIndex] = useState(0)
  const [selectedTimeframe, setSelectedTimeframe] = useState("3h")
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false)

  // Track which condition we're setting the timeframe for
  const [activeConditionIndex, setActiveConditionIndex] = useState<number | null>(null)

  // Search functionality
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<string[]>([])
  const searchInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Add a new state to track the pips modal
  const [showPipsModal, setShowPipsModal] = useState<{ show: boolean; statementIndex: number; conditionIndex: number }>(
    {
      show: false,
      statementIndex: 0,
      conditionIndex: 0,
    },
  )

  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isProceeding, setIsProceeding] = useState(false)

  // Add these new state variables inside the StrategyBuilder component
  const [showCustomTimeframeModal, setShowCustomTimeframeModal] = useState(false)
  const [customTimeframes, setCustomTimeframes] = useState<string[]>([])

  const createConstantInput = (inputValue: string, timeframe: string) => ({
    type: "C" as const,
    input: inputValue,
    name: inputValue,
    timeframe,
  })



  // Add this after the existing state declarations
  const [hoveredComponent, setHoveredComponent] = useState<{
    show: boolean
    content: any
    position: { x: number; y: number }
  }>({
    show: false,
    content: null,
    position: { x: 0, y: 0 },
  })

  const [showAccumulatorModal, setShowAccumulatorModal] = useState<{
    show: boolean
    statementIndex: number
    conditionIndex: number
  }>({
    show: false,
    statementIndex: 0,
    conditionIndex: 0,
  })

  const [showThenModal, setShowThenModal] = useState<{
    show: boolean
    statementIndex: number
    conditionIndex: number
  }>({
    show: false,
    statementIndex: 0,
    conditionIndex: 0,
  })

  const [showMovingOperatorModal, setShowMovingOperatorModal] = useState<{
    show: boolean
    statementIndex: number
    conditionIndex: number
  }>({
    show: false,
    statementIndex: 0,
    conditionIndex: 0,
  })

  // Add a new state variable to track which input (inp1 or inp2) is being targeted for At Candle
  const [targetInput, setTargetInput] = useState<"inp1" | "inp2">("inp1")

  // Add this state variable after the existing state declarations
  const [activeInputType, setActiveInputType] = useState<"inp1" | "inp2" | "condition">("condition")

  // Add state to track which component is being edited
  const [editingComponent, setEditingComponent] = useState<{
    statementIndex: number
    conditionIndex: number
    componentType: "inp1" | "inp2" | "operator" | "then" | "accumulate"
  } | null>(null)

  // Add state to track which equity rule is being edited
  const [editingEquityRule, setEditingEquityRule] = useState<{
    statementIndex: number
    equityIndex: number
  } | null>(null)

  // Add a new state variable to track the currently selected search result index
  const [selectedSearchIndex, setSelectedSearchIndex] = useState<number>(-1)

  // Add cursor position tracking for component navigation
  // cursorPosition tracks where the cursor is in the component sequence
  // -1 means at the end (default), 0 means before first component, etc.
  const [cursorPosition, setCursorPosition] = useState<Record<number, number>>({})
  
  // Helper to get cursor position for a statement (default to -1 = end)
  const getCursorPosition = (statementIndex: number) => {
    return cursorPosition[statementIndex] ?? -1
  }

  // Update localStorage whenever strategyId prop changes (from URL)
  // This ensures localStorage always matches the current strategy being edited
  useEffect(() => {
    if (strategyId && typeof window !== 'undefined') {
      try {
        localStorage.setItem('strategy_id', strategyId)
        setPersistedId(strategyId)
      } catch (error) {
        console.error('Error updating localStorage with strategy_id:', error)
      }
    }
  }, [strategyId])

  // Load strategy data if strategyId is provided
  useEffect(() => {
    if (strategyData && strategyId) {
      try {
        console.log("🔍 DEBUG: Loading strategy data:", JSON.stringify(strategyData, null, 2))

        // Handle the new nested Strategy.statements format
        let loadedStatements: StrategyStatement[] = []

        const allStmts = (strategyData.Strategy && Array.isArray(strategyData.Strategy.statements))
          ? strategyData.Strategy.statements
          : (Array.isArray(strategyData.statements))
            ? strategyData.statements
            : null;

        if (allStmts) {
          // Load signal statements with their independent equity and side
          loadedStatements = allStmts.map((s: any) => ({
            side: s.side || "B",
            saveresult: s.name || s.saveresult || "Statement",
            strategy: s.strategy || [{ statement: "if" }],
            Equity: s.Equity || [], // Preserve independent equity
            TradingType: strategyData.TradingType,
            TradingSession: s.TradingSession,
          }))

          // Add Global Equity if present as a dedicated block (statements with NO conditions)
          const topLevelEquity = (strategyData.Strategy?.Equity && Array.isArray(strategyData.Strategy.Equity) && strategyData.Strategy.Equity.length > 0)
            ? strategyData.Strategy.Equity
            : (strategyData.Equity && Array.isArray(strategyData.Equity) && strategyData.Equity.length > 0)
              ? strategyData.Equity
              : [];

          // Synthesize a "Global Exit Settings" pseudo-statement from the
          // root-level Equity *only* when there is at most one real statement.
          // With 2+ real statements the user owns equity per-statement, and
          // adding a pseudo row leaks into the UI as if it were a third
          // statement (and historically accumulated duplicates of per-statement
          // rules across save round-trips). Save behavior is unchanged.
          if (topLevelEquity.length > 0 && loadedStatements.length < 2) {
            loadedStatements.push({
              side: strategyData.side || "B",
              saveresult: "Global Exit Settings",
              strategy: [], // No entry conditions
              Equity: topLevelEquity,
              TradingType: strategyData.TradingType,
              TradingSession: strategyData.TradingSession,
            })
          }
        }
        else if (strategyData.strategy) {
          // Fallback for old format
          loadedStatements = [
            {
              side: strategyData.side || "S",
              saveresult: strategyData.saveresult || strategyData.name || "Statement 1",
              strategy: strategyData.strategy || [
                {
                  statement: "if",
                  timeframe: "3h",
                },
              ],
              Equity: strategyData.Equity || [],
              TradingType: strategyData.TradingType || undefined,
              TradingSession: strategyData.TradingSession || undefined,
            },
          ]
        }

        if (loadedStatements.length > 0) {
          // Skip pushing this onto undo history — initial load from server is
          // not a user action.
          skipNextHistoryChange()
          setStatements(loadedStatements)
        }

        // Set strategy name if available
        if (strategyData.name) {
          setStrategyName(strategyData.name)
        }
      } catch (error) {
        console.error("Error loading strategy data:", error)
      }
    }
  }, [strategyData, strategyId])

  // State for custom indicators - stores custom component data by name for lookup
  const [customIndicatorRegistry, setCustomIndicatorRegistry] = useState<Record<string, any>>({})

  // State for custom behaviors - stores custom behavior data by name for lookup
  const [customBehaviorRegistry, setCustomBehaviorRegistry] = useState<Record<string, any>>({})

  // State for custom trade management - stores custom trade management data by name for lookup
  const [customTradeManagementRegistry, setCustomTradeManagementRegistry] = useState<Record<string, any>>({})

  // Holds the pending custom-component insertion that's waiting on the
  // properties dialog. Set when the user picks a custom component in the
  // sidebar, cleared when they save or cancel.
  const [pendingCustomInsert, setPendingCustomInsert] = useState<{
    kind: CustomComponentKind
    statementIndex: number
    componentKey: string         // the `component` arg from the event (sidebar key)
    componentName: string
    componentId?: number
    schemas: ParameterSchema[]
    rawComponentData: any
  } | null>(null)

  // Opened when the user clicks an existing CUSTOM_I / CUSTOM_B / CUSTOM_TM
  // block to re-edit its parameters. Carries the exact coordinates of the
  // block so the save handler can write back in place instead of inserting.
  const [editingCustomBlock, setEditingCustomBlock] = useState<{
    kind: CustomComponentKind
    statementIndex: number
    conditionIndex: number
    slot: "inp1" | "inp2" | "operator" | "trade_management"
    equityIndex?: number
    componentName: string
    componentId?: number
    initialValues: Record<string, ParamRuntimeValue>
    initialTimeframe?: string
    initialInput?: string
  } | null>(null)

  // Commit a pending custom-component insertion with the values the user
  // picked in the properties dialog. Builds the correct runtime shape for
  // indicators (CUSTOM_I + input_params inside inp1/inp2), behaviors
  // (CUSTOM_B operator + params), and trade management (equity rule +
  // CUSTOM_TM + params), and tags each with `custom_component_id` so the
  // backend can look the schema back up.
  const commitCustomInsert = (
    pending: NonNullable<typeof pendingCustomInsert>,
    result: { values: Record<string, ParamRuntimeValue>; timeframe?: string; input?: string }
  ) => {
    const { kind, statementIndex, componentName, componentId, rawComponentData } = pending
    const params = result.values
    // Capture cursor position at commit time so insertion lands at the user's
    // cursor rather than always at the end of the strategy.
    const cursorPosAtCommit = getCursorPosition(statementIndex)
    const resolveTargetIdx = (stmt: StrategyStatement) =>
      resolveInsertionTargetIdx(stmt, cursorPosAtCommit)

    if (kind === "indicator") {
      setStatements(prev => {
        const next = [...prev]
        const stmt = next[statementIndex]
        if (!stmt || stmt.strategy.length === 0) return prev
        const targetIdx = resolveTargetIdx(stmt)
        const lastCondition = { ...stmt.strategy[targetIdx] }
        const timeframe = result.timeframe || lastCondition.timeframe || selectedTimeframe || "3h"

        const input: any = {
          type: "CUSTOM_I",
          name: componentName,
          ...(componentId !== undefined ? { custom_component_id: componentId } : {}),
          timeframe,
          input_params: params,
        }
        if (result.input) input.input = result.input

        if (lastCondition.inp1 && lastCondition.operator_name) {
          lastCondition.inp2 = input
        } else {
          lastCondition.inp1 = input
        }
        delete lastCondition.timeframe

        const strategy = [...stmt.strategy]
        strategy[targetIdx] = lastCondition
        next[statementIndex] = { ...stmt, strategy }
        return next
      })
    } else if (kind === "behavior") {
      setStatements(prev => {
        const next = [...prev]
        const stmt = { ...next[statementIndex] }
        const strategy = [...stmt.strategy]
        if (strategy.length === 0) return prev
        const targetIdx = resolveTargetIdx(stmt)
        const last = { ...strategy[targetIdx] }
        if (!last.inp1) {
          console.warn("Please add an indicator first before adding a behavior")
          return prev
        }
        last.operator_name = `CUSTOM_B:${componentName}`
        last.operator_display = componentName
        ;(last as any).Operator = {
          type: "CUSTOM_B",
          name: componentName,
          ...(componentId !== undefined ? { custom_component_id: componentId } : {}),
          params,
        }
        strategy[targetIdx] = last
        stmt.strategy = strategy
        next[statementIndex] = stmt
        return next
      })
    } else if (kind === "trade_management") {
      setStatements(prev => {
        const next = [...prev]
        const stmt = { ...next[statementIndex] }
        if (!stmt.Equity) stmt.Equity = []
        const equityRule: any = {
          trade_management: {
            type: "CUSTOM_TM",
            name: componentName,
            ...(componentId !== undefined ? { custom_component_id: componentId } : {}),
            params,
          },
        }
        stmt.Equity = [...stmt.Equity, equityRule]
        next[statementIndex] = stmt
        return next
      })
    }

    if (cursorPosAtCommit !== -1) {
      setCursorPosition(prev => ({ ...prev, [statementIndex]: -1 }))
    }

    setTimeout(() => {
      searchInputRefs.current[statementIndex]?.focus()
    }, 100)
  }

  // Write the dialog's edited values back into the existing CUSTOM_* block at
  // the recorded coordinates. Preserves `custom_component_id`, type tag, and
  // any other fields the original block carried.
  const applyCustomBlockEdit = (
    edit: NonNullable<typeof editingCustomBlock>,
    result: { values: Record<string, ParamRuntimeValue>; timeframe?: string; input?: string }
  ) => {
    setStatements(prev => {
      const next = [...prev]
      const stmt = next[edit.statementIndex]
      if (!stmt) return prev

      if (edit.slot === "inp1" || edit.slot === "inp2") {
        const strategy = [...stmt.strategy]
        const cond = { ...strategy[edit.conditionIndex] }
        const existing = (cond as any)[edit.slot]
        if (!existing) return prev
        const updated: any = {
          ...existing,
          input_params: result.values,
          ...(result.timeframe ? { timeframe: result.timeframe } : {}),
          ...(result.input !== undefined ? { input: result.input } : {}),
        }
        ;(cond as any)[edit.slot] = updated
        strategy[edit.conditionIndex] = cond
        next[edit.statementIndex] = { ...stmt, strategy }
      } else if (edit.slot === "operator") {
        const strategy = [...stmt.strategy]
        const cond: any = { ...strategy[edit.conditionIndex] }
        if (!cond.Operator) return prev
        cond.Operator = { ...cond.Operator, params: result.values }
        strategy[edit.conditionIndex] = cond
        next[edit.statementIndex] = { ...stmt, strategy }
      } else if (edit.slot === "trade_management" && edit.equityIndex !== undefined) {
        const equity = [...(stmt.Equity || [])]
        const rule: any = { ...equity[edit.equityIndex] }
        if (!rule.trade_management) return prev
        rule.trade_management = { ...rule.trade_management, params: result.values }
        equity[edit.equityIndex] = rule
        next[edit.statementIndex] = { ...stmt, Equity: equity }
      }
      return next
    })
  }

  // Open the properties dialog in "edit existing block" mode. The dialog
  // fetches the schema by componentId so we don't need to pre-load it.
  const openCustomBlockEditor = (
    statementIndex: number,
    conditionIndex: number,
    slot: "inp1" | "inp2" | "operator" | "trade_management",
    block: any,
    equityIndex?: number,
  ) => {
    if (!block) return
    const kind: CustomComponentKind =
      slot === "operator" ? "behavior"
      : slot === "trade_management" ? "trade_management"
      : "indicator"
    const initialValues =
      slot === "inp1" || slot === "inp2"
        ? (block.input_params || {})
        : (block.params || {})
    setEditingCustomBlock({
      kind,
      statementIndex,
      conditionIndex,
      slot,
      equityIndex,
      componentName: block.name,
      componentId: block.custom_component_id,
      initialValues,
      initialTimeframe: block.timeframe,
      initialInput: block.input,
    })
  }

  // Listen for component selection events from the sidebar
  useEffect(() => {
    const handleComponentSelected = (e: CustomEvent) => {
      const { component, statementIndex, customComponentData } = e.detail

      // Set the active statement index first
      setActiveStatementIndex(statementIndex)

      // If this is a custom component (has customComponentData), open the
      // properties dialog first; we only commit the insertion once the user
      // saves the dialog.
      if (customComponentData) {
        const componentType = customComponentData.type as CustomComponentKind

        // Track in the appropriate registry up front so later lookups work.
        if (componentType === "indicator") {
          setCustomIndicatorRegistry(prev => ({ ...prev, [component]: customComponentData }))
        } else if (componentType === "behavior") {
          setCustomBehaviorRegistry(prev => ({ ...prev, [component]: customComponentData }))
        } else if (componentType === "trade_management") {
          setCustomTradeManagementRegistry(prev => ({ ...prev, [component]: customComponentData }))
        }

        setPendingCustomInsert({
          kind: componentType,
          statementIndex,
          componentKey: component,
          componentName: customComponentData.name,
          componentId: customComponentData.id,
          schemas: normalizeStoredParameters(customComponentData.parameters),
          rawComponentData: customComponentData,
        })
      } else {
        // For regular components, call handleAddComponent
        handleAddComponent(statementIndex, component)

        // Focus the search input after adding
        setTimeout(() => {
          searchInputRefs.current[statementIndex]?.focus()
        }, 100)
      }
    }

    document.addEventListener("component-selected", handleComponentSelected as EventListener)

    return () => {
      document.removeEventListener("component-selected", handleComponentSelected as EventListener)
    }
  }, [statements, selectedTimeframe]) // Re-add event listener when statements or timeframe change

  // Ctrl/Cmd+Z to undo, Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z to redo. Skip when
  // focus is in a text field so the browser's native input undo still works.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement | null
      if (tgt) {
        const tag = tgt.tagName
        if (tag === "INPUT" || tag === "TEXTAREA" || tgt.isContentEditable) return
      }
      if (!(e.ctrlKey || e.metaKey)) return
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault()
        undoStatements()
      } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
        e.preventDefault()
        redoStatements()
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [undoStatements, redoStatements])

  // State for editing custom component in developer mode
  const [editingCustomComponent, setEditingCustomComponent] = useState<any>(null)

  // Listen for edit-custom-component events from the sidebar
  useEffect(() => {
    const handleEditCustomComponent = (e: CustomEvent) => {
      const component = e.detail
      setEditingCustomComponent(component)
      setCurrentComponentId(component.id)
      setShowDeveloperModeModal(true)
    }

    document.addEventListener("edit-custom-component", handleEditCustomComponent as EventListener)

    return () => {
      document.removeEventListener("edit-custom-component", handleEditCustomComponent as EventListener)
    }
  }, [])

  // Define allowed price options as in PriceSettingsModal
  const allowedPriceOptions = [
    { id: "open", label: "Price Open" },
    { id: "close", label: "Price Close" },
    { id: "low", label: "Price Low" },
    { id: "high", label: "Price High" },
  ];

  // Modify the handleSearchInput function to reset the selected index when search results change
  const handleSearchInput = (statementIndex: number, value: string) => {
    setSearchTerm(value)
    setActiveStatementIndex(statementIndex)
    setSelectedSearchIndex(-1)

    if (value.trim() === "") {
      setSearchResults([])
      return
    }

    // Declare searchLower once
    const searchLower = value.toLowerCase()

    // If searching for price, only show allowed price options
    if (searchLower.includes("price")) {
      const priceResults = allowedPriceOptions
        .filter(opt => opt.label.toLowerCase().includes(searchLower))
        .map(opt => opt.label)
      setSearchResults(priceResults)
      return
    }

    // Combine all component types for searching, including custom indicators and behaviors
    const customIndicatorNames = Object.keys(customIndicatorRegistry)
    const customBehaviorNames = Object.keys(customBehaviorRegistry)
    const customTradeManagementNames = Object.keys(customTradeManagementRegistry)
    const allComponents = [
      ...basicComponents.map((c) => c.label),
      ...extraBasicComponents.map((c) => c.label),
      ...indicators.map((c) => c.label),
      ...extraIndicators.map((c) => c.label),
      ...behaviours.map((c) => c.label),
      ...actions.map((c) => c.label),
      ...tradeManagement.map((c) => c.label),
      ...customIndicatorNames, // Add custom indicators to search
      ...customBehaviorNames, // Add custom behaviors to search
      ...customTradeManagementNames, // Add custom trade management to search
    ]

    // Filter components based on search term with parent-child relationships
    const results = allComponents.filter((component) => {
      const componentLower = component.toLowerCase()

      // Direct match (includes partial matches)
      if (componentLower.includes(searchLower)) {
        return true
      }

      // Handle specific searches for MA variants
      if (searchLower === "volume ma" || searchLower === "volume_ma") {
        return componentLower === "volume_ma" || componentLower === "volume"
      }

      if (searchLower === "rsi ma" || searchLower === "rsi_ma") {
        return componentLower === "rsi_ma" || componentLower === "rsi"
      }

      // Handle searches with spaces converted to underscores
      const searchWithUnderscore = searchLower.replace(/\s+/g, "_")
      if (componentLower.includes(searchWithUnderscore)) {
        return true
      }

      // Handle searches with underscores converted to spaces
      const searchWithSpaces = searchLower.replace(/_/g, " ")
      if (componentLower.replace(/_/g, " ").includes(searchWithSpaces)) {
        return true
      }

      // Parent-child relationships
      // If searching for "rsi", show both "RSI" and "RSI MA"
      if (searchLower === "rsi" && (componentLower === "rsi" || componentLower === "rsi_ma")) {
        return true
      }

      // If searching for "volume", show both "Volume" and "Volume_MA"
      if (searchLower === "volume" && (componentLower === "volume" || componentLower === "volume_ma")) {
        return true
      }

      // If searching for "ma", show all MA variants
      if (searchLower === "ma" && componentLower.includes("ma")) {
        return true
      }

      // If searching for "gradient", show gradient and derivative
      if (searchLower === "gradient" && (componentLower === "gradient" || componentLower === "derivative")) {
        return true
      }

      // If searching for "accumulator", show accumulator and accumulate
      if (searchLower === "accumulator" && (componentLower === "accumulator" || componentLower === "accumulate")) {
        return true
      }

      // If searching for "accumulate", show accumulator and accumulate
      if (searchLower === "accumulate" && (componentLower === "accumulator" || componentLower === "accumulate")) {
        return true
      }

      // If searching for "stochastic", show both "Stochastic" and "Stochastic"
      if (searchLower === "stochastic" && (componentLower === "stochastic" || componentLower === "Stochastic")) {
        return true
      }

      // If searching for "Stochastic" or "stochastic-oscillator", show it
      if ((searchLower === "Stochastic" || searchLower === "stochastic-oscillator") && componentLower === "Stochastic") {
        return true
      }

      // Reverse relationships - if searching for child, show parent too
      // If searching for "rsi ma", also show "RSI"
      if (searchLower.includes("rsi") && componentLower === "rsi") {
        return true
      }

      // If searching for "volume ma", also show "Volume"
      if (searchLower.includes("volume") && componentLower === "volume") {
        return true
      }

      return false
    })

    // Remove duplicates and sort to show parent components first
    const uniqueResults = [...new Set(results)]
    const sortedResults = uniqueResults.sort((a, b) => {
      const aLower = a.toLowerCase()
      const bLower = b.toLowerCase()

      // Prioritize exact matches
      if (aLower === searchLower) return -1
      if (bLower === searchLower) return 1

      // Then prioritize parent components (shorter names typically)
      if (aLower.length !== bLower.length) {
        return aLower.length - bLower.length
      }

      return a.localeCompare(b)
    })

    setSearchResults(sortedResults)
  }

  // Modify the handleKeyDown function to handle arrow keys and Enter key
  const handleKeyDown = (statementIndex: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const currentStatement = statements[statementIndex]
    const strategy = currentStatement.strategy
    const currentCursorPos = getCursorPosition(statementIndex)

    // Handle arrow keys for component navigation when search is empty
    if (searchTerm === "" && searchResults.length === 0) {
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        // Count total components to determine valid cursor positions
        const totalComponents = countComponents(currentStatement)
        const newPos = Math.max(0, currentCursorPos === -1 ? totalComponents - 1 : currentCursorPos - 1)
        setCursorPosition(prev => ({ ...prev, [statementIndex]: newPos }))
        return
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        const totalComponents = countComponents(currentStatement)
        const newPos = currentCursorPos >= totalComponents - 1 ? -1 : currentCursorPos + 1
        setCursorPosition(prev => ({ ...prev, [statementIndex]: newPos }))
        return
      }
    }

    // Handle backspace for component removal
    if (e.key === "Backspace" && searchTerm === "") {
      e.preventDefault()

      // If cursor is at the end (-1), use the old behavior (remove from right to left)
      if (currentCursorPos === -1) {
        // First, try to remove Trading Session if set (appears at end of components)
        if (currentStatement.TradingSession) {
          const newStatements = [...statements]
          delete newStatements[statementIndex].TradingSession
          setStatements(newStatements)
          return
        }

        // Then, try to remove equity rules (last to first)
        if (currentStatement.Equity && currentStatement.Equity.length > 0) {
          const newStatements = [...statements]
          newStatements[statementIndex].Equity.pop()
          setStatements(newStatements)
          return
        }

        /// Buy/Sell renders at the start of the statement, so it must be the
        /// last thing backspace removes - only after every strategy condition
        /// has already been peeled off the right. We try conditions first and
        /// fall through to side removal if nothing in the strategy was
        /// removable (e.g. only an empty default `{ statement: "if" }` row).
        for (let i = strategy.length - 1; i >= 0; i--) {
          const condition = strategy[i]

          // Remove Then first if it exists
          if (condition.Then) {
            removeComponent(statementIndex, i, "then")
            return
          }

          // Remove Accumulate if it exists
          if (condition.Accumulate) {
            removeComponent(statementIndex, i, "accumulate")
            return
          }

          // Remove inp2 if it exists
          if (condition.inp2) {
            removeComponent(statementIndex, i, "inp2")
            return
          }

          // Then remove operator if it exists
          if (condition.operator_name) {
            removeComponent(statementIndex, i, "operator")
            return
          }

          // Then remove inp1 if it exists
          if (condition.inp1) {
            removeComponent(statementIndex, i, "inp1")
            return
          }

          // Then remove timeframe if it exists and it's not the first condition
          if (i > 0 && (condition.timeframe || (condition.inp1 && "timeframe" in condition.inp1))) {
            removeComponent(statementIndex, i, "timeframe")
            return
          }

          // Finally remove the entire condition if it's not the first "if" statement
          if (i > 0 && condition.statement && condition.statement.toLowerCase() !== "if") {
            console.log("Removing statement:", condition.statement, "at index:", i)
            removeComponent(statementIndex, i, "statement")
            return
          }
        }

        // Nothing in the strategy body was removable - clear Buy/Sell last.
        if (currentStatement.side === "B" || currentStatement.side === "S") {
          const newStatements = [...statements]
          newStatements[statementIndex].side = ""
          setStatements(newStatements)
        }
      } else {
        // Cursor is at a specific position - delete the component to the left of cursor
        if (currentCursorPos > 0) {
          const componentToDelete = getComponentAtPosition(currentStatement, currentCursorPos - 1)
          if (componentToDelete) {
            removeComponent(statementIndex, componentToDelete.conditionIndex, componentToDelete.componentType)
            // Move cursor left after deletion
            setCursorPosition(prev => ({ ...prev, [statementIndex]: currentCursorPos - 1 }))
          }
        }
      }
      return
    }

    // Handle arrow keys for search result navigation
    if (searchResults.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        // Move selection down, wrapping around to the top if at the bottom
        setSelectedSearchIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        // Move selection up, wrapping around to the bottom if at the top
        setSelectedSearchIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1))
      } else if (e.key === "Enter" && selectedSearchIndex >= 0) {
        e.preventDefault()
        // Select the currently highlighted search result
        handleAddComponent(statementIndex, searchResults[selectedSearchIndex])
        // Reset search and selection
        setSearchTerm("")
        setSearchResults([])
        setSelectedSearchIndex(-1)
      }
    }
  }

  // Component lists for search functionality
  const basicComponents = [
    { id: "if", label: "If" },
    { id: "unless", label: "Unless" },
    { id: "then", label: "Then" },
    { id: "timeframe", label: "Timeframe" },
    { id: "duration", label: "Duration" },
    { id: "when", label: "When" },
    { id: "at-candle", label: "At Candle" },
    { id: "or", label: "Or" },
  ]

  const extraBasicComponents = [
    { id: "is-not", label: "Is not" },
    { id: "and", label: "And" },
    { id: "at-least", label: "At Least" },
    { id: "at-most", label: "At Most" },
  ]

  const indicators = [
    { id: "rsi", label: "RSI" },
    { id: "volume", label: "Volume" },
    { id: "volume-delta", label: "Volume Delta" },
    { id: "cumulative-volume-delta", label: "Cumulative Volume Delta" },
    { id: "historical-price-level", label: "Historical Price Level" },
    { id: "candle-size", label: "Candle Size" },
    { id: "high", label: "Price High" },
    { id: "low", label: "Price Low" },
    { id: "open", label: "Price Open" },
    { id: "close", label: "Price Close" },
    { id: "macd", label: "MACD" },
    { id: "supertrend", label: "SuperTrend" },
    { id: "bollinger", label: "Bollinger" },
    { id: "price", label: "Price" },
    { id: "stochastic", label: "Stochastic" },
    { id: "stochastic-oscillator", label: "Stochastic" },
    { id: "atr", label: "ATR" },
    { id: "general-pa", label: "GENERAL PA" },
    { id: "gradient", label: "Gradient" },
    { id: "derivative", label: "Derivative" },
  ]

  const extraIndicators = [
    { id: "ma", label: "MA" },
    { id: "volume-ma", label: "Volume_MA" },
    { id: "rsi-ma", label: "RSI_MA" },
    { id: "volume-delta", label: "Volume Delta" },
    { id: "cumulative-volume-delta", label: "Cumulative Volume Delta" },
    { id: "historical-price-level", label: "Historical Price Level" },
    { id: "candle-size", label: "Candle Size" },
    { id: "general-pa", label: "GENERAL PA" },
    { id: "gradient", label: "Gradient" },
    { id: "derivative", label: "Derivative" },
  ]

  // Update the behaviours array to include crossabove and crossbelow
  const behaviours = [
    { id: "crossabove", label: "Cross Above" },
    { id: "crossbelow", label: "Cross Below" },
    { id: "greater-than", label: "Greater Than" },
    { id: "less-than", label: "Less Than" },
    { id: "inside-channel", label: "Inside Channel" },
    { id: "moving-up", label: "Increasing" },
    { id: "moving-down", label: "Decreasing" },
    { id: "above", label: "Above" },
    { id: "below", label: "Below" },
    { id: "atmost-above-pips", label: "At most above points" },
    { id: "atmost-below-pips", label: "At most below points" },
    { id: "accumulator", label: "Accumulator" },
  ]

  const actions = [
    { id: "buy", label: "Buy" },
    { id: "sell", label: "Sell" },
    { id: "long", label: "Long" },
    { id: "short", label: "Short" },
    { id: "wait", label: "Wait" },
    { id: "sl", label: "SL" },
    { id: "tp", label: "TP" },
    { id: "partial-tp", label: "Partial TP" },
    { id: "manage-exit", label: "Manage Exit" },
    { id: "trading-session", label: "Trading Session" },
  ]

  const tradeManagement = [
    { id: "manage", label: "Manage" },
    { id: "close", label: "Close" },
    { id: "cancel", label: "Cancel" },
    { id: "no-trade", label: "No Trade" },
    { id: "reverse", label: "Reverse" },
    { id: "sl", label: "SL" },
    { id: "tp", label: "TP" },
  ]

  const addStatement = () => {
    const newStatements = [...statements]
    const newStatementIndex = statements.length
    newStatements.push({
      side: "", // Remove default Buy for new signal blocks
      saveresult: `Statement ${statements.length + 1}`,
      strategy: [
        {
          statement: "if",
        },
      ],
      Equity: [],
    })
    setStatements(newStatements)
    // Set the new statement as active so components are added to it
    setActiveStatementIndex(newStatementIndex)
  }

  // Function to map component labels to statement structure
  const getStatementType = (component: string) => {
    if (component.toLowerCase() === "if") return "if"
    if (component.toLowerCase() === "and") return "and"
    if (component.toLowerCase() === "or") return "or"
    if (component.toLowerCase() === "unless") return "unless"
    if (component.toLowerCase() === "sl") return "SL"
    if (component.toLowerCase() === "tp") return "TP"
    return component.toLowerCase()
  }

  // Update the getOperatorName function to support new operators
  const getOperatorName = (behavior: string) => {
    if (behavior.toLowerCase() === "crossing up" || behavior.toLowerCase() === "cross above") return "crossabove"
    if (behavior.toLowerCase() === "crossing down" || behavior.toLowerCase() === "cross below") return "crossbelow"
    if (behavior.toLowerCase() === "moving up" || behavior.toLowerCase() === "increasing") return "moving_up"
    if (behavior.toLowerCase() === "moving down" || behavior.toLowerCase() === "decreasing") return "moving_down"
    if (behavior.toLowerCase() === "greater than") return "above"
    if (behavior.toLowerCase() === "less than") return "below"
    if (behavior.toLowerCase() === "inside channel") return "inside_channel"
    if (behavior.toLowerCase() === "above") return "above"
    if (behavior.toLowerCase() === "below") return "below"
    if (behavior.toLowerCase() === "at most above pips" || behavior.toLowerCase() === "at most above points") return "atmost_above_pips"
    if (behavior.toLowerCase() === "at most below pips" || behavior.toLowerCase() === "at most below points") return "atmost_below_pips"
    return behavior.toLowerCase()
  }

  // Helper function to extract initial settings from inp2
  const extractInp2Settings = (inp2: any, inp1: any) => {
    if (!inp2) return undefined;

    const settings: any = {};

    // Check if it's a value type
    if (inp2.type === "value") {
      settings.valueType = "value";
      settings.customValue = String(inp2.value || "50");
      return settings;
    }

    // Check if it's an indicator type
    if (inp2.type === "I" || inp2.type === "CUSTOM_I" || inp2.type === "C") {
      // Determine indicator name
      let indicatorName = "";
      if (inp2.name === "RSI") {
        indicatorName = "rsi";
      } else if (inp2.name === "RSI_MA") {
        indicatorName = "rsi-ma";
      } else if (inp2.name === "BBANDS") {
        indicatorName = "bollinger";
      } else if (inp2.name === "Volume_MA") {
        indicatorName = "volume-ma";
      } else if (inp2.input === "volume") {
        indicatorName = "volume";
      } else if (["open", "close", "high", "low"].includes(inp2.input?.toLowerCase() || "")) {
        indicatorName = inp2.input?.toLowerCase();
      }

      // If we couldn't determine the indicator name, return undefined
      if (!indicatorName) {
        return undefined;
      }

      // Determine if it's an existing indicator or other
      const isExistingIndicator = inp1 && (
        (inp1.name === "RSI" || inp1.name === "RSI_MA") && (indicatorName === "rsi" || indicatorName === "rsi-ma") ||
        (inp1.name === "BBANDS") && (indicatorName === "high" || indicatorName === "low" || indicatorName === "mid") ||
        (inp1.name === "Volume_MA" || inp1.input === "volume") && (indicatorName === "volume" || indicatorName === "volume-ma") ||
        (["open", "close", "high", "low"].includes(inp1.input?.toLowerCase() || "")) && ["open", "close", "high", "low"].includes(indicatorName)
      );

      settings.valueType = isExistingIndicator ? "indicator" : "other";
      settings.indicator = indicatorName;

      // Extract indicator-specific parameters
      if (inp2.name === "RSI") {
        settings.rsiLength = inp2.input_params?.timeperiod || 14;
        settings.rsiSource = inp2.input_params?.source ?
          inp2.input_params.source.charAt(0).toUpperCase() + inp2.input_params.source.slice(1) : "Close";
      } else if (inp2.name === "RSI_MA") {
        settings.rsiMaLength = inp2.input_params?.rsi_length || 14;
        settings.maLength = inp2.input_params?.ma_length || 14;
        settings.rsiSource = inp2.input_params?.rsi_source || "Close";
        settings.maType = inp2.input_params?.ma_type || "SMA";
        // bb_stddev no longer read — only used by the Bollinger Bands ma_type,
        // which has been removed from MA_TYPES.
      } else if (inp2.name === "BBANDS") {
        settings.band = inp2.input || "upperband";
        settings.timeperiod = inp2.input_params?.timeperiod || 20;
        settings.bbSource = inp2.input_params?.source || "close";
        settings.bbStdDev = inp2.input_params?.nbdevup || inp2.input_params?.nbdevdn || 2.0;
      } else if (inp2.name === "Volume_MA") {
        settings.volumeMaLength = inp2.input_params?.ma_length || 20;
      }

      if (inp2.timeframe) {
        settings.timeframe = inp2.timeframe;
      }

      return settings;
    }

    // If inp2.type is not recognized, return undefined
    return undefined;
  };

  // Add function to handle component clicks for editing
  const handleComponentClick = (
    statementIndex: number,
    conditionIndex: number,
    componentType: "inp1" | "inp2" | "operator" | "then" | "accumulate",
  ) => {
    setActiveStatementIndex(statementIndex)
    setActiveConditionIndex(conditionIndex)
    setEditingComponent({ statementIndex, conditionIndex, componentType })

    const condition = statements[statementIndex].strategy[conditionIndex]

    // Predefined indicator names that have dedicated settings modals. Many of
    // these are stored as `type: "CUSTOM_I"` in the strategy JSON (MACD, ATR,
    // Stochastic, SuperTrend, MA, CandleSize, HistoricalPriceLevel,
    // VolumeDelta, CumulativeVolumeDelta, RSI_MA, GENERAL_PA), so the generic
    // `type === "CUSTOM_I"` branch below must NOT intercept them — otherwise
    // the user gets the generic dialog that says "no configurable parameters".
    const MA_FAMILY = new Set(["MA", "SMA", "EMA", "HMA", "WMA", "VWMA", "TEMA", "DEMA"])
    const routePredefinedIndicator = (
      slot: "inp1" | "inp2",
      block: any,
    ): boolean => {
      if (!block || typeof block !== "object" || !("name" in block)) return false
      // A user-defined custom indicator carries a custom_component_id from the
      // backend. Don't intercept those — they own their own schema.
      if (block.custom_component_id != null) return false
      const name = block.name
      if (name === "RSI") { setShowRsiModal(true); return true }
      if (name === "RSI_MA") { setShowRsiMaModal(true); return true }
      if (name === "BBANDS") { setShowBollingerModal(true); return true }
      if (name === "MACD") { setShowMacdModal(true); return true }
      if (name === "SupertrendIndicator") { setShowSuperTrendModal(true); return true }
      if (name === "Volume_MA") { setShowVolumeMaModal(true); return true }
      if (name === "VolumeDelta") { setShowVolumeDeltaModal(true); return true }
      if (name === "CumulativeVolumeDelta") { setShowCumulativeVolumeDeltaModal(true); return true }
      if (name === "HistoricalPriceLevel") { setShowHistoricalPriceLevelModal(true); return true }
      if (name === "CandleSize") { setShowCandleSizeModal(true); return true }
      if (name === "ATR") { openAtrModal(statementIndex, conditionIndex, slot); return true }
      if (name === "Stochastic") { openStochasticModal(statementIndex, conditionIndex, slot); return true }
      if (MA_FAMILY.has(name)) { setShowMaModal(true); return true }
      return false
    }

    switch (componentType) {
      case "inp1":
        if (routePredefinedIndicator("inp1", condition.inp1)) break
        if (condition.inp1 && (condition.inp1 as any).type === "CUSTOM_I") {
          openCustomBlockEditor(statementIndex, conditionIndex, "inp1", condition.inp1)
          break
        }
        if (condition.inp1 && "input" in condition.inp1) {
          if (condition.inp1.input === "volume") {
            setShowVolumeModal(true)
          } else if (["open", "close", "high", "low"].includes(condition.inp1.input?.toLowerCase() || "")) {
            setShowPriceSettingsModal(true)
          }
        }
        break

      case "inp2":
        if (routePredefinedIndicator("inp2", condition.inp2)) break
        if (condition.inp2 && (condition.inp2 as any).type === "CUSTOM_I") {
          openCustomBlockEditor(statementIndex, conditionIndex, "inp2", condition.inp2)
          break
        }
        if (condition.inp2 && "input" in condition.inp2) {
          if (condition.inp2.input === "volume") {
            setShowVolumeModal(true)
          } else if (typeof condition.inp2.input === "string" && ["open", "close", "high", "low"].includes(condition.inp2.input.toLowerCase())) {
            setShowPriceSettingsModal(true)
          }
        }
        break

      case "operator":
        if (
          condition.operator_name?.startsWith("CUSTOM_B:") &&
          (condition as any).Operator
        ) {
          openCustomBlockEditor(statementIndex, conditionIndex, "operator", (condition as any).Operator)
          break
        }
        if (condition.operator_name === "crossabove" || condition.operator_name === "crossbelow") {
          if (condition.operator_name === "crossabove") {
            const initialSettings = extractInp2Settings(condition.inp2, condition.inp1)
            setCrossingUpInitialSettings(initialSettings)
            setShowCrossingUpModal(true)
          } else {
            setShowCrossingDownModal(true)
          }
        } else if (condition.operator_name === "above") {
          setShowAboveModal(true)
        } else if (condition.operator_name === "below") {
          setShowBelowModal(true)
        } else if (condition.operator_name === "inside_channel") {
          setShowChannelModal(true)
        } else if (condition.operator_name === "atmost_above_pips" || condition.operator_name === "atmost_below_pips") {
          setShowPipsModal({
            show: true,
            statementIndex,
            conditionIndex,
          })
        } else if (condition.operator_name === "moving_up" || condition.operator_name === "moving_down") {
          setShowMovingOperatorModal({
            show: true,
            statementIndex,
            conditionIndex,
          })
        }
        break

      case "then":
        setShowThenModal({
          show: true,
          statementIndex,
          conditionIndex,
        })
        break

      case "accumulate":
        setShowAccumulatorModal({
          show: true,
          statementIndex,
          conditionIndex,
        })
        break
    }
  }

  // Handle derivative settings
  const handleDerivativeSettings = (settings: any) => {
    const newStatements = [...statements]
    const currentStatement = newStatements[activeStatementIndex]
    const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

    // If we have an existing indicator in inp1, add the derivative to it
    if (lastCondition.inp1) {
      // Add the Derivative property to the existing indicator
      lastCondition.inp1.Derivative = {
        order: settings.order,
      }
    }

    setStatements(newStatements)
  }

  // Update the handleSLTPSettings function to handle all the different equity formats
  const handleSLTPSettings = (settings: SLTPSettings) => {
    const newStatements = [...statements]
    // When editing an existing rule, route the write to the rule's owner row
    // (set by handleEquityRuleClick). Without this, edits on a non-active
    // statement's SL/TP get written into whatever statement was last focused.
    const targetStatementIndex = editingEquityRule ? editingEquityRule.statementIndex : activeStatementIndex
    const currentStatement = newStatements[targetStatementIndex]

    // Make sure Equity array exists
    if (!currentStatement.Equity) {
      currentStatement.Equity = []
    }

    // Create the new equity rule
    let equityRule: EquityRule | undefined = undefined

    // Handle partial take profit
    if (settings.type === "partial_tp" && settings.partialTpList && settings.partialTpList.length > 0) {
      equityRule = {
        statement: "and",
        inp1: {
          name: "partial_tp",
          partial_tp_list: settings.partialTpList.map((item) => {
            // For price-based partial TP
            if (!item.name) {
              return {
                Price: item.Price,
                Close: item.Close,
                ...(item.Action ? { Action: item.Action } : {}),
              }
            }
            // For equity-based partial TP
            else {
              return {
                name: item.name,
                operator: item.operator,
                Close: item.Close,
                ...(item.Action ? { Action: item.Action } : {}),
              }
            }
          }),
        },
      }
    } else {
      // Rest of the function remains the same...
      const formatType = settings.formatType || "simple"

      if (formatType === "trailing" || settings.trailingStop) {
        // Create the equity rule with trailing stop parameters
        equityRule = {
          statement: "and",
          operator: `inp1 = inp2 ${settings.direction} ${settings.value}pips`,
          inp1: {
            name: settings.type,
            input_params: {
              TrailingStop: "yes",
              // Only add TrailingStep if it has a value and is not "0"
              ...(settings.trailingStep && settings.trailingStep !== "0"
                ? { TrailingStep: `${settings.trailingStep}pips` }
                : {}),
            },
          },
          inp2: { name: settings.inp2 || "Entry_Price" },
        }
      } else if (settings.useAdvanced) {
        // Advanced format with inp1 and inp2
        equityRule = {
          statement: "and",
          operator: `inp1 = inp2 ${settings.direction} ${settings.value}pips`,
          inp1: { name: settings.type },
          inp2: { name: settings.inp2 || "Entry_Price" },
        }

        // Add indicator parameters if provided
        if (settings.valueType === "indicator" && settings.indicatorParams) {
          equityRule.inp2 = {
            name: settings.indicatorParams.name || "nperiod_hl",
            side: settings.indicatorParams.side || "low",
            timeframe: settings.indicatorParams.timeframe || "1h",
            input_params: {
              nperiod: settings.indicatorParams.nperiod || 30,
            },
          }
        }
      } else {
        // Simple format
        if (settings.valueType === "pips") {
          equityRule = {
            statement: "and",
            inp1: { name: settings.type },
            operator: `${settings.type} = Entry_Price ${settings.direction} ${settings.value}pips`,
          }
        } else if (settings.valueType === "percentage") {
          // For percentage, we use multiplication
          const actualMultiplier =
            settings.type === "SL" ? 1 - Number(settings.value) / 100 : 1 + Number(settings.value) / 100

          equityRule = {
            statement: "and",
            operator: `${settings.type} = Entry_Price * ${actualMultiplier}`,
          }
        } else if (settings.valueType === "fixed") {
          // For fixed price values
          equityRule = {
            statement: "and",
            inp1: { name: settings.type },
            operator: `${settings.type} = ${settings.value}`,
          }
        } else if (settings.valueType === "indicator") {
          // For indicator-based values
          const indName = settings.indicatorParams?.name || "nperiod_hl"
          const timeframe = settings.indicatorParams?.timeframe || "1h"
          let inputParams: any = {}

          if (indName === "nperiod_hl") {
            inputParams = { nperiod: settings.indicatorParams?.nperiod || 30, side: settings.indicatorParams?.side || "low" }
          } else if (indName === "ma") {
            inputParams = {
              ma_type: (settings.indicatorParams as any)?.ma_type || "SMA",
              ma_length: (settings.indicatorParams as any)?.ma_length || 20,
              ...(settings.indicatorParams as any)?.ma_offset !== undefined
                ? { ma_offset: (settings.indicatorParams as any)?.ma_offset }
                : {},
            }
          } else if (indName === "atr") {
            inputParams = {
              atr_length: (settings.indicatorParams as any)?.atr_length || 14,
              atr_smoothing: (settings.indicatorParams as any)?.atr_smoothing || "SMA",
              atr_multiple: (settings.indicatorParams as any)?.atr_multiple || 1,
            }
          }

          equityRule = {
            statement: "and",
            inp1: { name: settings.type },
            operator: `${settings.type} = inp2 ${settings.direction} ${settings.value}points`,
            inp2: {
              name: indName,
              timeframe,
              input_params: inputParams,
            },
          }
        } else if (settings.valueType === "close") {
          // For close price with multiplier
          equityRule = {
            statement: "and",
            inp1: { name: settings.type },
            operator: `${settings.type} = Close * ${settings.value}`,
          }
        }
      }
    }

    // Check if we're editing an existing rule or adding a new one
    if (editingEquityRule && equityRule) {
      // Update the existing rule
      currentStatement.Equity[editingEquityRule.equityIndex] = equityRule
    } else if (equityRule) {
      // Add new rule
      currentStatement.Equity.push(equityRule)
    }

    setStatements(newStatements)
  }

  // Function to remove a component from a strategy
  const removeComponent = (statementIndex: number, conditionIndex: number, componentType: string) => {
    setStatements((prevStatements) => {
      const newStatements = [...prevStatements]
      const statement = { ...newStatements[statementIndex] }
      const strategy = [...statement.strategy]

      switch (componentType) {
        case "side":
          // Remove Buy/Sell
          statement.side = ""
          break
        case "then":
          const conditionThen = { ...strategy[conditionIndex] }
          delete conditionThen.Then
          strategy[conditionIndex] = conditionThen
          break
        case "accumulate":
          const conditionAccumulate = { ...strategy[conditionIndex] }
          delete conditionAccumulate.Accumulate
          strategy[conditionIndex] = conditionAccumulate
          break
        case "inp2":
          const conditionInp2 = { ...strategy[conditionIndex] }
          delete conditionInp2.inp2
          strategy[conditionIndex] = conditionInp2
          break
        case "operator":
          const conditionOp = { ...strategy[conditionIndex] }
          delete conditionOp.operator_name
          delete conditionOp.operator_display
          delete conditionOp.Operator
          strategy[conditionIndex] = conditionOp
          break
        case "inp1":
          const conditionInp1 = { ...strategy[conditionIndex] }
          delete conditionInp1.inp1
          strategy[conditionIndex] = conditionInp1
          break
        case "timeframe":
          const conditionTimeframe = { ...strategy[conditionIndex] }
          // Remove timeframe from both condition level and inp1 level
          delete conditionTimeframe.timeframe
          if (conditionTimeframe.inp1 && typeof conditionTimeframe.inp1 === "object" && "timeframe" in conditionTimeframe.inp1) {
            delete conditionTimeframe.inp1.timeframe
          }
          if (conditionTimeframe.inp2 && typeof conditionTimeframe.inp2 === "object" && "timeframe" in conditionTimeframe.inp2) {
            delete conditionTimeframe.inp2.timeframe
          }
          strategy[conditionIndex] = conditionTimeframe
          break
        case "at-candle-inp1":
          const conditionAtCandleInp1 = { ...strategy[conditionIndex] }
          if (conditionAtCandleInp1.inp1 && typeof conditionAtCandleInp1.inp1 === "object") {
            delete conditionAtCandleInp1.inp1.index
          }
          strategy[conditionIndex] = conditionAtCandleInp1
          break
        case "at-candle-inp2":
          const conditionAtCandleInp2 = { ...strategy[conditionIndex] }
          if (conditionAtCandleInp2.inp2 && typeof conditionAtCandleInp2.inp2 === "object") {
            delete conditionAtCandleInp2.inp2.index
          }
          strategy[conditionIndex] = conditionAtCandleInp2
          break
        case "wait-inp1":
        case "wait-inp2":
          // Wait buttons are not deletable via backspace, only toggleable
          break
        case "statement":
          console.log("Before splice - strategy length:", strategy.length, "conditionIndex:", conditionIndex)
          strategy.splice(conditionIndex, 1)
          console.log("After splice - strategy length:", strategy.length)
          break
        default:
          // Handle pending at candle cases
          if (componentType.startsWith("pending-at-candle-")) {
            const inputType = componentType.replace("pending-at-candle-", "")
            const conditionPending = { ...strategy[conditionIndex] }
            if (conditionPending.pendingAtCandle) {
              delete conditionPending.pendingAtCandle[inputType]
              if (Object.keys(conditionPending.pendingAtCandle).length === 0) {
                delete conditionPending.pendingAtCandle
              }
            }
            strategy[conditionIndex] = conditionPending
          }
          break
      }

      statement.strategy = strategy
      newStatements[statementIndex] = statement

      return newStatements
    })
  }

  // Function to remove an equity rule
  const removeEquityRule = (statementIndex: number, equityIndex: number) => {
    setStatements((prevStatements) => {
      const newStatements = [...prevStatements]
      const statement = { ...newStatements[statementIndex] }
      const equity = [...(statement.Equity || [])] // Ensure Equity array exists
      equity.splice(equityIndex, 1)
      statement.Equity = equity
      newStatements[statementIndex] = statement
      return newStatements
    })
  }

  // Helper function to count total components in a statement
  const countComponents = (statement: StrategyStatement): number => {
    let count = 0
    
    // Count side (Buy/Sell)
    if (statement.side === "B" || statement.side === "S") count++
    
    // Count each condition's components
    statement.strategy.forEach((condition) => {
      // Count statement (AND, OR, etc.) - but not IF
      if (condition.statement && condition.statement.toLowerCase() !== "if") count++
      
      // Count timeframe
      const timeframeValue = condition.inp1 && "timeframe" in condition.inp1 ? condition.inp1.timeframe : condition.timeframe
      if (timeframeValue) count++
      
      // Count pending at candle
      if (condition.pendingAtCandle) {
        count += Object.keys(condition.pendingAtCandle).length
      }
      
      // Count at candle for inp1
      if (condition.inp1 && typeof condition.inp1 === "object" && condition.inp1.index !== undefined) count++
      
      // Count inp1
      if (condition.inp1) count++
      
      // Count wait button for inp1
      if (condition.inp1) count++
      
      // Count operator
      if (condition.operator_name) count++
      
      // Count inp2 timeframe
      if (condition.inp2 && typeof condition.inp2 === "object" && "timeframe" in condition.inp2 && condition.inp2.timeframe) count++
      
      // Count inp2
      if (condition.inp2) count++
      
      // Count wait button for inp2
      if (condition.inp2 && typeof condition.inp2 === "object" && "type" in condition.inp2) count++
      
      // Count at candle for inp2
      if (condition.inp2 && typeof condition.inp2 === "object" && condition.inp2.index !== undefined) count++
      
      // Count accumulator
      if (condition.Accumulate) count++
      
      // Count then
      if (condition.Then) count++
    })
    
    return count
  }

  // Helper function to get component at a specific position
  const getComponentAtPosition = (statement: StrategyStatement, position: number): { conditionIndex: number, componentType: string } | null => {
    let currentPos = 0
    
    // Check side (Buy/Sell)
    if (statement.side === "B" || statement.side === "S") {
      if (currentPos === position) return { conditionIndex: -1, componentType: "side" }
      currentPos++
    }
    
    // Check each condition's components
    for (let i = 0; i < statement.strategy.length; i++) {
      const condition = statement.strategy[i]
      
      // Check statement (AND, OR, etc.) - but not IF
      if (condition.statement && condition.statement.toLowerCase() !== "if") {
        if (currentPos === position) return { conditionIndex: i, componentType: "statement" }
        currentPos++
      }
      
      // Check timeframe
      const timeframeValue = condition.inp1 && "timeframe" in condition.inp1 ? condition.inp1.timeframe : condition.timeframe
      if (timeframeValue) {
        if (currentPos === position) return { conditionIndex: i, componentType: "timeframe" }
        currentPos++
      }
      
      // Check pending at candle
      if (condition.pendingAtCandle) {
        for (const inputType of Object.keys(condition.pendingAtCandle)) {
          if (currentPos === position) return { conditionIndex: i, componentType: `pending-at-candle-${inputType}` }
          currentPos++
        }
      }
      
      // Check at candle for inp1
      if (condition.inp1 && typeof condition.inp1 === "object" && condition.inp1.index !== undefined) {
        if (currentPos === position) return { conditionIndex: i, componentType: "at-candle-inp1" }
        currentPos++
      }
      
      // Check inp1
      if (condition.inp1) {
        if (currentPos === position) return { conditionIndex: i, componentType: "inp1" }
        currentPos++
      }
      
      // Check wait button for inp1
      if (condition.inp1) {
        if (currentPos === position) return { conditionIndex: i, componentType: "wait-inp1" }
        currentPos++
      }
      
      // Check operator
      if (condition.operator_name) {
        if (currentPos === position) return { conditionIndex: i, componentType: "operator" }
        currentPos++
      }
      
      // Check inp2 timeframe
      if (condition.inp2 && typeof condition.inp2 === "object" && "timeframe" in condition.inp2 && condition.inp2.timeframe) {
        if (currentPos === position) return { conditionIndex: i, componentType: "inp2-timeframe" }
        currentPos++
      }
      
      // Check inp2
      if (condition.inp2) {
        if (currentPos === position) return { conditionIndex: i, componentType: "inp2" }
        currentPos++
      }
      
      // Check wait button for inp2
      if (condition.inp2 && typeof condition.inp2 === "object" && "type" in condition.inp2) {
        if (currentPos === position) return { conditionIndex: i, componentType: "wait-inp2" }
        currentPos++
      }
      
      // Check at candle for inp2
      if (condition.inp2 && typeof condition.inp2 === "object" && condition.inp2.index !== undefined) {
        if (currentPos === position) return { conditionIndex: i, componentType: "at-candle-inp2" }
        currentPos++
      }
      
      // Check accumulator
      if (condition.Accumulate) {
        if (currentPos === position) return { conditionIndex: i, componentType: "accumulate" }
        currentPos++
      }
      
      // Check then
      if (condition.Then) {
        if (currentPos === position) return { conditionIndex: i, componentType: "then" }
        currentPos++
      }
    }
    
    return null
  }

  // Resolve which condition a newly added component should land in given the
  // cursor's position. The user's intent is "fill the slot the cursor sits
  // in/before" — e.g. they deleted an inp2 and want the next indicator to
  // refill that same slot. So we scan BACKWARD from the cursor's condition
  // first (catches "fill before cursor"), then forward as fallback for the
  // case where the cursor is parked at the start of an incomplete trailing
  // condition. Falls back to the last condition.
  const resolveInsertionTargetIdx = (stmt: StrategyStatement, cursorPos: number): number => {
    if (!stmt.strategy.length) return -1
    let scanFrom = stmt.strategy.length - 1
    if (cursorPos !== -1) {
      const compAt = getComponentAtPosition(stmt, cursorPos)
      if (compAt && compAt.conditionIndex >= 0) {
        scanFrom = compAt.conditionIndex
      }
    }
    for (let i = scanFrom; i >= 0; i--) {
      const c = stmt.strategy[i]
      if (!c.inp1 || !c.operator_name || !c.inp2) return i
    }
    for (let i = scanFrom + 1; i < stmt.strategy.length; i++) {
      const c = stmt.strategy[i]
      if (!c.inp1 || !c.operator_name || !c.inp2) return i
    }
    return stmt.strategy.length - 1
  }

  // Reset cursor position when adding a new component
  useEffect(() => {
    // Reset cursor to end when statements change
    setStatements(prev => {
      // This effect just monitors changes, doesn't modify
      return prev
    })
  }, [statements])

  // Add a function to handle At Candle selection
  const handleAtCandleSelection = (candleNumber: number) => {
    const newStatements = [...statements]
    const currentStatement = newStatements[activeStatementIndex]

    // If we have an active condition index, use that to target a specific condition
    if (activeConditionIndex !== null) {
      const condition = currentStatement.strategy[activeConditionIndex]

      // If the target input already exists, apply the index immediately
      if (targetInput === "inp1" && condition.inp1 && typeof condition.inp1 === "object") {
        condition.inp1.index = -candleNumber
      } else if (targetInput === "inp2" && condition.inp2 && typeof condition.inp2 === "object") {
        condition.inp2.index = -candleNumber
      } else {
        // Store the candle number for later application when indicator is added
        if (!condition.pendingAtCandle) {
          condition.pendingAtCandle = {}
        }
        condition.pendingAtCandle[targetInput] = -candleNumber
      }
    } else {
      // If no specific condition is targeted, find the most recent one
      for (let i = currentStatement.strategy.length - 1; i >= 0; i--) {
        const condition = currentStatement.strategy[i]

        // If condition has inp2, add index to inp2
        if (condition.inp2 && typeof condition.inp2 === "object") {
          condition.inp2.index = -candleNumber
          break
        }
        // If condition has inp1 but no inp2, add index to inp1
        else if (condition.inp1 && typeof condition.inp1 === "object") {
          condition.inp1.index = -candleNumber
          break
        }
      }
    }

    setSelectedCandleNumber(candleNumber)
    setStatements(newStatements)
  }

  /**
   * Entry point for inserting a new component from the sidebar or search
   * box. This is always an "insert" flow, never an "edit". editingComponent
   * is the chip-click flag for the edit flow, so we clear it here to keep
   * the two flows disjoint - otherwise a stale conditionIndex from a prior
   * chip click leaks into modal onSave handlers and they misroute the save
   * (worst case: writes to the wrong condition; previously crashed when the
   * stale index pointed past the end of the array).
   */
  const handleAddComponent = (statementIndex: number, component: string) => {
    setEditingComponent(null)
    const newStatements = [...statements]
    const currentStatement = newStatements[statementIndex]
    let lastAddedStochasticTarget: { target: "inp1" | "inp2"; timeframe?: string } | null = null

    // Cursor-aware insertion: if the user has positioned the cursor mid-statement,
    // splice trailing conditions out so the existing "last condition" insertion
    // logic operates on the cursor's target. Trailing is restored in the
    // finally block — within a single synchronous handler React doesn't render
    // between setStatements and finally, so the mutation lands before commit.
    // We resolve the target via resolveInsertionTargetIdx, which scans forward
    // from the cursor's condition for the first incomplete one — handling the
    // common case where the user just deleted slots in a later condition and
    // the cursor drifted back into an earlier full one.
    const cursorPosForInsert = getCursorPosition(statementIndex)
    let trailingConditions: StrategyCondition[] = []
    let cursorWasMidStatement = false
    if (cursorPosForInsert !== -1 && currentStatement.strategy.length > 0) {
      const targetIdx = resolveInsertionTargetIdx(currentStatement, cursorPosForInsert)
      if (targetIdx >= 0 && targetIdx < currentStatement.strategy.length - 1) {
        cursorWasMidStatement = true
        trailingConditions = currentStatement.strategy.splice(targetIdx + 1)
      } else if (targetIdx >= 0) {
        cursorWasMidStatement = true
      }
    }

    try {
    // If the component is a price option, add as inp1 or inp2 with correct structure
    if (["Price Open", "Price Close", "Price Low", "Price High"].includes(component)) {
      const priceType = component.split(" ")[1].toLowerCase()
      const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

      // Check if we already have inp1 and an operator - if so, we're adding to inp2
      if (lastCondition.inp1 && lastCondition.operator_name) {
        // MACD ↔ price comparison is unreadable on the backtest plot — block
        // the reverse direction (inp1 = MACD, user clicks a Price OHLC for
        // inp2). The forward direction is blocked at the MACD add path.
        if (isMacdOperand(lastCondition.inp1)) {
          toast({
            variant: "destructive",
            title: "Can't compare price with MACD",
            description: "MACD renders in its own subplot (values ~±50) and is unreadable on the price axis. Replace MACD on the left with a price-scale indicator, or compare MACD against a value or another oscillator.",
          })
          return
        }
        // We're adding to inp2
        const timeframe = lastCondition.timeframe || selectedTimeframe
        lastCondition.inp2 = createConstantInput(priceType, timeframe)
      } else {
        // Create or update inp1 with the selected price type
        lastCondition.inp1 = createConstantInput(priceType, selectedTimeframe || "12min")
      }

      setStatements(newStatements)
      setActiveStatementIndex(statementIndex)
      setSearchTerm("")
      setSearchResults([])
      searchInputRefs.current[statementIndex]?.focus()
      return
    }

    // Determine what type of component is being added
    if (component.toLowerCase() === "then") {
      // Adding then to the last condition that has a behavior
      if (currentStatement.strategy.length > 0) {
        const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

        if (lastCondition.operator_name) {
          // Show then modal
          setShowThenModal({
            show: true,
            statementIndex: activeStatementIndex,
            conditionIndex: currentStatement.strategy.length - 1,
          })
        } else {
          // Then needs an operator on the current row to bind to.
          toast({
            variant: "destructive",
            title: "Pick a behaviour first",
            description: "Add an operator (e.g. Cross Above, Above, Below) on this row before adding a Then.",
          })
        }
      }
    } else if (component.toLowerCase() === "timeframe") {
      // Add a new timeframe component to the statement
      if (currentStatement.strategy.length === 0) {
        // If there are no conditions yet, create an "if" condition first
        currentStatement.strategy.push({
          statement: "if",
        })
      }

      const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

      // Always add timeframe to the last condition, don't create new conditions for timeframes
      if (!lastCondition.timeframe && (!lastCondition.inp1 || !lastCondition.inp1.timeframe)) {
        lastCondition.timeframe = selectedTimeframe
      }
    } else if (
      basicComponents.some((c) => c.label.toLowerCase() === component.toLowerCase()) ||
      extraBasicComponents.some((c) => c.label.toLowerCase() === component.toLowerCase())
    ) {
      // Adding a basic component (if, and, etc.)
      const statementType = getStatementType(component)

      // If it's the first component, it should be "if"
      if (currentStatement.strategy.length === 0 && statementType === "if") {
        currentStatement.strategy.push({
          statement: "if",
        })
      } else if (statementType === "if") {
        // Statement already starts with an If row (added by addStatement). The
        // row is invisible until it has inp1/operator/inp2, which can make a
        // second "If" click feel like nothing happened — surface a hint.
        toast({
          title: "If row already exists",
          description: "Pick an indicator, behaviour, or value to fill in this statement's If row.",
        })
        return
      } else if ((statementType === "and" || statementType === "or") && currentStatement.strategy.length > 0) {
        // Add "and" or "or" statement
        currentStatement.strategy.push({
          statement: statementType,
        })
      } else if (statementType === "unless") {
        // "unless X" = enter only when X is NOT met. Only valid after the
        // first "if" row; the first row must stay "statement": "if".
        if (currentStatement.strategy.length === 0) {
          toast({
            variant: "destructive",
            title: "Unless needs an If first",
            description: "Start the statement with an If row, then add Unless to negate the next condition.",
          })
          return
        }
        currentStatement.strategy.push({
          statement: "unless",
        })
      } else if (component.toLowerCase() === "at candle" || component.toLowerCase() === "at-candle") {
        // If we have an active condition, set it as the target
        if (currentStatement.strategy.length > 0) {
          const lastConditionIndex = currentStatement.strategy.length - 1
          const lastCondition = currentStatement.strategy[lastConditionIndex]

          // Determine which input to target based on what's available
          if (lastCondition.inp1 && lastCondition.operator_name && lastCondition.inp2) {
            // If both inp1 and inp2 exist, target inp2 unless it already has an index
            if (lastCondition.inp2.index !== undefined) {
              setTargetInput("inp1")
            } else {
              setTargetInput("inp2")
            }
          } else if (lastCondition.inp1 && !lastCondition.operator_name) {
            // If only inp1 exists and no operator, target inp1
            setTargetInput("inp1")
          } else if (lastCondition.inp1 && lastCondition.operator_name) {
            // If inp1 and operator exist but no inp2 yet, store for future inp2
            setTargetInput("inp2")
          } else {
            // No inputs yet, default to inp1 - it will be applied when indicator is added
            setTargetInput("inp1")
          }

          setActiveConditionIndex(lastConditionIndex)
        } else {
          // No conditions yet, create a new "if" condition and target inp1
          currentStatement.strategy.push({
            statement: "if",
          })
          setActiveConditionIndex(0)
          setTargetInput("inp1")
        }

        // Show the At Candle modal
        setShowAtCandleModal(true)
      }
    } else if (
      indicators.some((c) => c.label.toLowerCase() === component.toLowerCase()) ||
      extraIndicators.some((c) => c.label.toLowerCase() === component.toLowerCase()) ||
      customIndicatorRegistry[component] // Check if it's a custom indicator
    ) {
      // Adding an indicator (including custom indicators)
      if (currentStatement.strategy.length > 0) {
        const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

        // Check if this is a custom indicator
        const customIndicatorData = customIndicatorRegistry[component]

        // Special handling for "price" component - it should go to inp1 if no inp1 exists
        if (component.toLowerCase() === "price") {
          // Show the Price Settings modal - handlePriceSelection will determine inp1 vs inp2
          setShowPriceSettingsModal(true)
          setActiveStatementIndex(statementIndex)
          return
        }

        // Handle custom indicators — defer insertion until the user confirms
        // parameters in the properties dialog.
        if (customIndicatorData) {
          setPendingCustomInsert({
            kind: "indicator",
            statementIndex,
            componentKey: component,
            componentName: customIndicatorData.name,
            componentId: customIndicatorData.id,
            schemas: normalizeStoredParameters(customIndicatorData.parameters),
            rawComponentData: customIndicatorData,
          })
          setActiveStatementIndex(statementIndex)
          setSearchTerm("")
          setSearchResults([])
          return
        }

        // Check if we already have inp1 and an operator - if so, we're adding to inp2
        if (lastCondition.inp1 && lastCondition.operator_name) {
          // Get the timeframe from the condition or use the selected timeframe
          const timeframe = lastCondition.timeframe || selectedTimeframe

          // We're adding to inp2
          if (component.toLowerCase() === "rsi") {
            // Safely extract previous inp1 input_params if they exist
            let prevParams = {};
            if (
              lastCondition.inp1 &&
              typeof lastCondition.inp1 === "object" &&
              lastCondition.inp1.input_params &&
              typeof lastCondition.inp1.input_params === "object"
            ) {
              prevParams = lastCondition.inp1.input_params;
            }

            lastCondition.inp2 = {
              type: "I",
              name: "RSI",
              timeframe: timeframe,
              input_params: {
                timeperiod: prevParams.timeperiod || 14,
                source: prevParams.source || "close",
              },
            }
          } else if (component.toLowerCase() === "volume") {
            lastCondition.inp2 = createConstantInput("volume", timeframe)
          } else if (component.toLowerCase() === "volume delta" || component.toLowerCase() === "volume-delta") {
            lastCondition.inp2 = {
              type: "CUSTOM_I",
              name: "VolumeDelta",
              timeframe: timeframe,
              input_params: {
                lower_timeframe: "1min",
              },
            }
          } else if (component.toLowerCase() === "cumulative volume delta" || component.toLowerCase() === "cumulative-volume-delta") {
            lastCondition.inp2 = {
              type: "CUSTOM_I",
              name: "CumulativeVolumeDelta",
              timeframe: timeframe,
              input_params: {
                lower_timeframe: "1min",
                reset_period: "D",
              },
            }
          } else if (component.toLowerCase() === "historical price level" || component.toLowerCase() === "historical-price-level") {
            lastCondition.inp2 = {
              type: "CUSTOM_I",
              name: "HistoricalPriceLevel",
              timeframe: timeframe,
              input_params: {
                period: "W",
                level: "High",
              },
            }
          } else if (component.toLowerCase() === "candle size" || component.toLowerCase() === "candle-size") {
            lastCondition.inp2 = {
              type: "CUSTOM_I",
              name: "CandleSize",
              timeframe: timeframe,
              input_params: {
                asset_type: "gold",
                output: "pips",
              },
            }
          } else if (component.toLowerCase() === "stochastic" || component.toLowerCase() === "stochastic-oscillator") {
            lastCondition.inp2 = {
              type: "CUSTOM_I",
              name: "Stochastic",
              timeframe: timeframe,
              input_params: {
                fastk_period: 14,
                slowk_period: 3,
                slowd_period: 3,
                output: "slowk",
              },
            }
            lastAddedStochasticTarget = { target: "inp2", timeframe }
          } else if (component.toLowerCase() === "rsi_ma" || component.toLowerCase() === "rsi-ma") {
            // Special handling for RSI_MA
            let rsiLength = 14;
            if (lastCondition.inp1 && lastCondition.inp1.name === "RSI" && lastCondition.inp1.input_params?.timeperiod) {
              rsiLength = lastCondition.inp1.input_params.timeperiod;
            }
            lastCondition.inp2 = {
              type: "CUSTOM_I",
              name: "RSI_MA",
              timeframe: timeframe,
              input_params: {
                rsi_length: rsiLength,
                rsi_source: "Close",
              },
            }
          } else if (component.toLowerCase() === "general pa" || component.toLowerCase() === "general-pa") {
            lastCondition.inp2 = {
              type: "CUSTOM_I",
              name: "GENERAL_PA",
              timeframe: timeframe,
            }
          } else if (component.toLowerCase() === "macd") {
            // MACD lives in its own panel — comparing it against OHLC is
            // unreadable and the backend ignores any overlay intent.
            if (isPriceOhlcOperand(lastCondition.inp1)) {
              toast({
                variant: "destructive",
                title: "Can't compare MACD with price",
                description: "MACD renders in its own subplot (values ~±50) and is unreadable on the price axis. Use MACD vs MACD, a value, or another oscillator.",
              })
              return
            }
            lastCondition.inp2 = {
              type: "CUSTOM_I",
              name: "MACD",
              timeframe: timeframe,
              input_params: {
                macd_fast_length: 12,
                macd_slow_length: 26,
                macd_source: "close",
                macd_signal_smoothing: 9,
                macd_oscillator_ma_type: "EMA",
                macd_signal_ma_type: "EMA",
                macd_indicator_type: "MACD",
              },
            }
          } else if (component.toLowerCase() === "supertrend") {
            lastCondition.inp2 = {
              type: "CUSTOM_I",
              name: "SupertrendIndicator",
              timeframe: timeframe,
              input_params: {
                period: 10,
                multiplier: 3.0,
                change_atr_method: true,
                output: "SellSignal",
              },
            }
          } else if (component.toLowerCase() === "gradient" || component.toLowerCase() === "derivative") {
            // Show the Derivative Settings modal
            setActiveStatementIndex(statementIndex)
            // Pass the current indicator data to the modal
            const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]
            if (lastCondition.inp1) {
              // We're adding derivative to an existing indicator
              setShowDerivativeModal(true)
            } else {
              // Derivative/Gradient wraps an existing indicator — the user
              // must add one first.
              toast({
                variant: "destructive",
                title: "Pick an indicator first",
                description: "Add an indicator on this row before adding a Derivative / Gradient — it wraps the existing indicator.",
              })
            }
          } else if (component.includes("MA") || component.includes("_MA")) {
            // Normalise to one of the backend's case-sensitive MA-family
            // names: MA, Volume_MA, Open_MA, Close_MA, RSI_MA. Naive
            // toUpperCase() turned "Open_MA" into "OPEN_MA" which the engine
            // doesn't recognise.
            const indicatorName = normalizeMaFamilyName(component)

            lastCondition.inp2 = {
              type: "CUSTOM_I",
              name: indicatorName,
              timeframe: timeframe,
              input_params: { ma_length: 20 },
            }
          } else {
            if (component === "Bollinger") {
              // Check if inp1 is BBANDS to use special format
              if (lastCondition.inp1 && "name" in lastCondition.inp1 && lastCondition.inp1.name === "BBANDS") {
                // For BBANDS, use type "C" with input "close" format
                lastCondition.inp2 = createConstantInput(lastCondition.inp1.input || "close", timeframe)
              } else {
                lastCondition.inp2 = {
                  type: "I",
                  name: "BBANDS",
                  timeframe: timeframe,
                  input: "lowerband", // Default to lowerband for inp2
                  input_params: {
                    timeperiod: 20,
                    nbdevdn: 2.0, // Default for lowerband
                    source: "close",
                  },
                }
              }
            } else if (["high", "low", "open", "close"].includes(component.toLowerCase())) {
              lastCondition.inp2 = createConstantInput(component.toLowerCase(), timeframe)
            } else {
              lastCondition.inp2 = createConstantInput(component.toLowerCase(), timeframe)
            }
          }
        } else {
          // We're adding to inp1 (original behavior)
          const timeframe = lastCondition.timeframe || selectedTimeframe

          // Special case for RSI indicator
          if (component.toLowerCase() === "rsi") {
            // Safely extract previous inp1 input_params if they exist
            let prevParams = {};
            if (
              lastCondition.inp1 &&
              typeof lastCondition.inp1 === "object" &&
              lastCondition.inp1.input_params &&
              typeof lastCondition.inp1.input_params === "object"
            ) {
              prevParams = lastCondition.inp1.input_params;
            }

            lastCondition.inp1 = {
              type: "I",
              name: "RSI",
              timeframe: timeframe,
              input_params: {
                timeperiod: prevParams.timeperiod || 14,
                source: prevParams.source || "close",
              },
            }
          } else if (component.toLowerCase() === "volume") {
            lastCondition.inp1 = createConstantInput("volume", timeframe)
          } else if (component.toLowerCase() === "volume delta" || component.toLowerCase() === "volume-delta") {
            lastCondition.inp1 = {
              type: "CUSTOM_I",
              name: "VolumeDelta",
              timeframe: timeframe,
              input_params: {
                lower_timeframe: "1min",
              },
            }
          } else if (component.toLowerCase() === "cumulative volume delta" || component.toLowerCase() === "cumulative-volume-delta") {
            lastCondition.inp1 = {
              type: "CUSTOM_I",
              name: "CumulativeVolumeDelta",
              timeframe: timeframe,
              input_params: {
                lower_timeframe: "1min",
                reset_period: "D",
              },
            }
          } else if (component.toLowerCase() === "historical price level" || component.toLowerCase() === "historical-price-level") {
            lastCondition.inp1 = {
              type: "CUSTOM_I",
              name: "HistoricalPriceLevel",
              timeframe: timeframe,
              input_params: {
                period: "W",
                level: "High",
              },
            }
          } else if (component.toLowerCase() === "candle size" || component.toLowerCase() === "candle-size") {
            lastCondition.inp1 = {
              type: "CUSTOM_I",
              name: "CandleSize",
              timeframe: timeframe,
              input_params: {
                asset_type: "gold",
                output: "pips",
              },
            }
          } else if (component.toLowerCase() === "stochastic" || component.toLowerCase() === "stochastic-oscillator") {
            lastCondition.inp1 = {
              type: "CUSTOM_I",
              name: "Stochastic",
              timeframe: timeframe,
              input_params: {
                fastk_period: 14,
                slowk_period: 3,
                slowd_period: 3,
                output: "slowk",
              },
            }
            lastAddedStochasticTarget = { target: "inp1", timeframe }
          } else if (component.toLowerCase() === "rsi_ma" || component.toLowerCase() === "rsi-ma") {
            // Special handling for RSI_MA
            let rsiLength = 14;
            if (lastCondition.inp1 && lastCondition.inp1.name === "RSI" && lastCondition.inp1.input_params?.timeperiod) {
              rsiLength = lastCondition.inp1.input_params.timeperiod;
            }
            lastCondition.inp1 = {
              type: "CUSTOM_I",
              name: "RSI_MA",
              timeframe: timeframe,
              input_params: {
                rsi_length: rsiLength,
                rsi_source: "Close",
              },
            }
          } else if (component.toLowerCase() === "general pa" || component.toLowerCase() === "general-pa") {
            lastCondition.inp1 = {
              type: "CUSTOM_I",
              name: "GENERAL_PA",
              timeframe: timeframe,
            }
          } else if (component.toLowerCase() === "atr") {
            lastCondition.inp1 = {
              type: "CUSTOM_I",
              name: "ATR",
              timeframe: timeframe,
              input_params: {
                atr_length: 14,
                atr_smoothing: "RMA",
              },
            }
          } else if (component.toLowerCase() === "macd") {
            lastCondition.inp1 = {
              type: "CUSTOM_I",
              name: "MACD",
              timeframe: timeframe,
              input_params: {
                macd_fast_length: 12,
                macd_slow_length: 26,
                macd_source: "close",
                macd_signal_smoothing: 9,
                macd_oscillator_ma_type: "EMA",
                macd_signal_ma_type: "EMA",
                macd_indicator_type: "MACD",
              },
            }
          } else if (component.toLowerCase() === "supertrend") {
            lastCondition.inp1 = {
              type: "CUSTOM_I",
              name: "SupertrendIndicator",
              timeframe: timeframe,
              input_params: {
                period: 10,
                multiplier: 3.0,
                change_atr_method: true,
                output: "SellSignal",
              },
            }
          } else if (component.toLowerCase() === "gradient" || component.toLowerCase() === "derivative") {
            // Show the Derivative Settings modal
            setActiveStatementIndex(statementIndex)
            // Pass the current indicator data to the modal
            const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]
            if (lastCondition.inp1) {
              // We're adding derivative to an existing indicator
              setShowDerivativeModal(true)
            } else {
              // Derivative/Gradient wraps an existing indicator — the user
              // must add one first.
              toast({
                variant: "destructive",
                title: "Pick an indicator first",
                description: "Add an indicator on this row before adding a Derivative / Gradient — it wraps the existing indicator.",
              })
            }
          } else if (component.includes("MA") || component.includes("_MA")) {
            // Normalise to the case-sensitive backend allowlist (see comment
            // on the inp2 branch above).
            const indicatorName = normalizeMaFamilyName(component)

            lastCondition.inp1 = {
              type: "CUSTOM_I",
              name: indicatorName,
              timeframe: timeframe,
              input_params: { ma_length: 20 },
            }
          } else {
            // Format for regular indicators
            // Special handling for OHLC indicators
            if (component === "Bollinger") {
              lastCondition.inp1 = {
                type: "I",
                name: "BBANDS",
                timeframe: timeframe,
                input: "upperband", // Default to upperband for inp1
                input_params: {
                  timeperiod: 20,
                  nbdevup: 2.0, // Default for upperband
                  source: "close",
                },
              }
            } else if (["high", "low", "open", "close"].includes(component.toLowerCase())) {
              // Keep the existing OHLC handling
              lastCondition.inp1 = createConstantInput(component.toLowerCase(), timeframe)
            } else if (component.toLowerCase() === "price") {
              // Show the Price Settings modal
              setShowPriceSettingsModal(true)
            } else {
              // Keep the existing handling for other indicators
              lastCondition.inp1 = createConstantInput(component.toLowerCase(), timeframe)
            }
          }

          // Apply any pending At Candle selections
          if (lastCondition.pendingAtCandle) {
            if (lastCondition.pendingAtCandle.inp1 && lastCondition.inp1 && typeof lastCondition.inp1 === "object") {
              lastCondition.inp1.index = lastCondition.pendingAtCandle.inp1
              delete lastCondition.pendingAtCandle.inp1
            }
            if (lastCondition.pendingAtCandle.inp2 && lastCondition.inp2 && typeof lastCondition.inp2 === "object") {
              lastCondition.inp2.index = lastCondition.pendingAtCandle.inp2
              delete lastCondition.pendingAtCandle.inp2
            }

            // Clean up if no more pending selections
            if (Object.keys(lastCondition.pendingAtCandle).length === 0) {
              delete lastCondition.pendingAtCandle
            }
          }

          // Move timeframe to inp1 and preserve it in the condition for display
          if (lastCondition.timeframe && lastCondition.inp1 && "timeframe" in lastCondition.inp1) {
            lastCondition.inp1.timeframe = lastCondition.timeframe
            // Keep timeframe in condition for display purposes, don't delete it
          }

          // Remove the timeframe from the condition since it's now in inp1
          delete lastCondition.timeframe
        }

        // Show the appropriate settings modal - only for inp1 for now
        const shouldShowModal = !lastCondition.operator_name || (lastCondition.inp1 && lastCondition.operator_name)

        if (shouldShowModal) {
          if (component.toLowerCase() === "rsi") {
            setShowRsiModal(true)
          } else if (
            component.toLowerCase() === "rsi_ma" ||
            component.toLowerCase() === "rsi-ma"
          ) {
            setShowRsiMaModal(true)
          } else if (component.toLowerCase() === "atr") {
            const conditionIndex = currentStatement.strategy.length - 1
            const targetInput = lastCondition.operator_name && lastCondition.inp2 ? "inp2" : "inp1"
            const timeframeForModal = lastCondition.timeframe || selectedTimeframe
            openAtrModal(statementIndex, conditionIndex, targetInput, timeframeForModal)
          } else if (component === "Stochastic") {
            const conditionIndex = currentStatement.strategy.length - 1
            const targetInput =
              lastAddedStochasticTarget?.target ||
              (lastCondition.operator_name && lastCondition.inp2 ? "inp2" : "inp1")
            const timeframeForModal =
              lastAddedStochasticTarget?.timeframe ||
              (targetInput === "inp1"
                ? (lastCondition.inp1 && "timeframe" in lastCondition.inp1 ? lastCondition.inp1.timeframe : undefined)
                : (lastCondition.inp2 && typeof lastCondition.inp2 === "object" && "timeframe" in lastCondition.inp2
                  ? lastCondition.inp2.timeframe
                  : undefined)) ||
              lastCondition.timeframe ||
              selectedTimeframe
            openStochasticModal(statementIndex, conditionIndex, targetInput, timeframeForModal)
          } else if (component.toLowerCase() === "stochastic" || component.toLowerCase() === "stochastic-oscillator") {
            const conditionIndex = currentStatement.strategy.length - 1
            const targetInput =
              lastAddedStochasticTarget?.target ||
              (lastCondition.operator_name && lastCondition.inp2 ? "inp2" : "inp1")
            const timeframeForModal =
              lastAddedStochasticTarget?.timeframe ||
              (targetInput === "inp1"
                ? (lastCondition.inp1 && "timeframe" in lastCondition.inp1 ? lastCondition.inp1.timeframe : undefined)
                : (lastCondition.inp2 && typeof lastCondition.inp2 === "object" && "timeframe" in lastCondition.inp2
                  ? lastCondition.inp2.timeframe
                  : undefined)) ||
              lastCondition.timeframe ||
              selectedTimeframe
            openStochasticModal(statementIndex, conditionIndex, targetInput, timeframeForModal)
          } else if (component === "Bollinger") {
            setShowBollingerModal(true)
          } else if (component.toLowerCase() === "volume") {
            setShowVolumeModal(true)
          } else if (
            component.toLowerCase() === "volume_ma" ||
            component.toLowerCase() === "volume-ma"
          ) {
            setShowVolumeMaModal(true)
          } else if (component.toLowerCase() === "volume delta" || component.toLowerCase() === "volume-delta") {
            setShowVolumeDeltaModal(true)
          } else if (component.toLowerCase() === "cumulative volume delta" || component.toLowerCase() === "cumulative-volume-delta") {
            setShowCumulativeVolumeDeltaModal(true)
          } else if (component.toLowerCase() === "historical price level" || component.toLowerCase() === "historical-price-level") {
            setShowHistoricalPriceLevelModal(true)
          } else if (component.toLowerCase() === "candle size" || component.toLowerCase() === "candle-size") {
            setShowCandleSizeModal(true)
          } else if (component === "ATR" || component.toLowerCase() === "atr") {
            const conditionIndex = currentStatement.strategy.length - 1
            const targetInput = lastCondition.operator_name && lastCondition.inp2 ? "inp2" : "inp1"
            const timeframeForModal = lastCondition.timeframe || selectedTimeframe
            openAtrModal(statementIndex, conditionIndex, targetInput, timeframeForModal)
          } else if (component === "MACD" || component.toLowerCase() === "macd") {
            setShowMacdModal(true)
          } else if (component === "SuperTrend" || component.toLowerCase() === "supertrend") {
            setShowSuperTrendModal(true)
          } else if (component === "MA" || component.toLowerCase() === "ma") {
            setShowMaModal(true)
          }
        }
      }
    } else if (component.toLowerCase() === "then") {
      // Adding then to the last condition that has a behavior
      if (currentStatement.strategy.length > 0) {
        const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

        if (lastCondition.operator_name) {
          // Show then modal
          setShowThenModal({
            show: true,
            statementIndex: activeStatementIndex,
            conditionIndex: currentStatement.strategy.length - 1,
          })
        } else {
          // Then needs an operator on the current row to bind to.
          toast({
            variant: "destructive",
            title: "Pick a behaviour first",
            description: "Add an operator (e.g. Cross Above, Above, Below) on this row before adding a Then.",
          })
        }
      }
    } else if (customBehaviorRegistry[component]) {
      // Defer insertion until the user confirms parameters in the dialog.
      const customBehaviorData = customBehaviorRegistry[component]
      if (currentStatement.strategy.length > 0 &&
          currentStatement.strategy[currentStatement.strategy.length - 1].inp1) {
        setPendingCustomInsert({
          kind: "behavior",
          statementIndex,
          componentKey: component,
          componentName: customBehaviorData.name,
          componentId: customBehaviorData.id,
          schemas: normalizeStoredParameters(customBehaviorData.parameters),
          rawComponentData: customBehaviorData,
        })
      } else {
        console.warn("Please add an indicator first before adding a behavior")
      }
      return
    } else if (customTradeManagementRegistry[component]) {
      const customTMData = customTradeManagementRegistry[component]
      setPendingCustomInsert({
        kind: "trade_management",
        statementIndex,
        componentKey: component,
        componentName: customTMData.name,
        componentId: customTMData.id,
        schemas: normalizeStoredParameters(customTMData.parameters),
        rawComponentData: customTMData,
      })
      return
    } else if (
      // Important: treat "Accumulator" via the dedicated accumulator handler below,
      // not as a generic behaviour. Otherwise the accumulator modal won't open
      // when selected from the search bar.
      component.toLowerCase() !== "accumulator" &&
      component.toLowerCase() !== "accumulate" &&
      behaviours.some((c) => c.label.toLowerCase() === component.toLowerCase())
    ) {
      // Adding a behavior
      if (currentStatement.strategy.length > 0) {
        const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

        // Add the behavior to the last condition
        lastCondition.operator_name = getOperatorName(component)
        lastCondition.operator_display = component // Store the original display label

        // Handle moving operators with new structure
        if (lastCondition.operator_name === "moving_up" || lastCondition.operator_name === "moving_down") {
          // Explicitly clear inp2 to prevent redundant "0" block display
          delete lastCondition.inp2

          // Show moving operator settings modal
          setShowMovingOperatorModal({
            show: true,
            statementIndex: activeStatementIndex,
            conditionIndex: currentStatement.strategy.length - 1,
          })
        } else {
          // Add default inp2 value for other behaviors
          // For atmost_above_pips and atmost_below_pips, add pips property
          if (
            lastCondition.operator_name === "atmost_above_pips" ||
            lastCondition.operator_name === "atmost_below_pips"
          ) {
            lastCondition.pips = 500 // Default pips value

            // Default to a numeric value for inp2
            lastCondition.inp2 = {
              type: "value",
              value: 0, // This will be ignored for pips operators, but we need it for the structure
            }
          } else {
            // Default to a numeric value for other operators
            lastCondition.inp2 = {
              type: "value",
              value:
                lastCondition.operator_name === "crossabove"
                  ? 60
                  : lastCondition.operator_name === "crossbelow"
                    ? 40
                    : lastCondition.operator_name === "above"
                      ? 70
                      : lastCondition.operator_name === "below"
                        ? 30
                        : 50,
            }
          }
        }

        // Show the appropriate settings modal
        if (component === "Cross Above") {
          setShowCrossingUpModal(true)
        } else if (component === "Cross Below") {
          setShowCrossingDownModal(true)
        } else if (component === "Above") {
          setShowAboveModal(true)
        } else if (component === "Below") {
          setShowBelowModal(true)
        } else if (component === "Inside Channel") {
          setShowChannelModal(true)
        } else if (component === "At most above pips" || component === "At most below pips") {
          // Open pips modal for these operators
          setShowPipsModal({
            show: true,
            statementIndex: activeStatementIndex,
            conditionIndex: currentStatement.strategy.length - 1,
          })
        }
      }
    } else if (component.toLowerCase() === "accumulator" || component.toLowerCase() === "accumulate") {
      // Adding accumulator to the last condition that has a behavior
      if (currentStatement.strategy.length > 0) {
        const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

        if (lastCondition.operator_name) {
          // Show accumulator modal
          setShowAccumulatorModal({
            show: true,
            statementIndex: activeStatementIndex,
            conditionIndex: currentStatement.strategy.length - 1,
          })
        } else {
          console.warn("Please select a behavior first before adding an accumulator")
        }
      }
    } else if (component.toLowerCase() === "long" || component.toLowerCase() === "short" || component.toLowerCase() === "buy" || component.toLowerCase() === "sell") {
      // Set the side based on Buy/Sell or Long/Short selection
      currentStatement.side = (component.toLowerCase() === "long" || component.toLowerCase() === "buy") ? "B" : "S"
    } else if (component.toLowerCase() === "wait") {
      // This is now handled by individual wait buttons for inp1 and inp2
      // The old single wait functionality is deprecated
      console.log("Wait component is now handled by individual wait buttons for inp1 and inp2")
    } else if (component.toLowerCase() === "sl") {
      // Show SL settings modal
      setShowSLTPSettings({ show: true, type: "SL" })
    } else if (component.toLowerCase() === "tp") {
      // Show TP settings modal
      setShowSLTPSettings({ show: true, type: "TP" })
    } else if (component.toLowerCase() === "partial tp" || component.toLowerCase() === "partial-tp") {
      setShowPartialTPModal(true)
    } else if (component.toLowerCase() === "manage exit" || component.toLowerCase() === "manage-exit") {
      setShowManageExitModal(true)
    } else if (
      component.toLowerCase() === "max trade duration" ||
      component.toLowerCase() === "max-trade-duration"
    ) {
      setShowMaxDurationModal(true)
    } else if (component.toLowerCase() === "trading session" || component.toLowerCase() === "trading-session") {
      // Open Trading Session modal
      setShowTradingSessionModal(true)
    } else if (component.toLowerCase() === "no trade" || component.toLowerCase() === "no-trade") {
      // "..., no trade" = block the trade when this condition is met.
      // Encoded as a normal "and" row with a sibling `no_trade: true` flag.
      // Only valid after the first "if" row.
      if (currentStatement.strategy.length === 0) {
        toast({
          variant: "destructive",
          title: "No Trade needs an If first",
          description: "Start the statement with an If row, then add No Trade to block the trade when this condition is met.",
        })
        return
      }
      currentStatement.strategy.push({
        statement: "and",
        no_trade: true,
      })
    }

    setStatements(newStatements)
    setActiveStatementIndex(statementIndex)

    // Clear search after adding component
    setSearchTerm("")
    setSearchResults([])
    searchInputRefs.current[statementIndex]?.focus()
    } finally {
      // Restore trailing conditions in-place. Within a single synchronous
      // event handler React batches updates and doesn't render until the
      // handler returns, so mutating the strategy array here lands before
      // React reads it for the upcoming commit. If the body exited without
      // calling setStatements (e.g. it only opened a modal), this simply
      // un-rotates the array back to its original shape — no state change.
      if (trailingConditions.length > 0) {
        currentStatement.strategy.push(...trailingConditions)
        trailingConditions = []
      }
      if (cursorWasMidStatement) {
        setCursorPosition(prev => ({ ...prev, [statementIndex]: -1 }))
      }
    }
  }

  // Add this function after the existing helper functions
  const getTooltipContent = (
    condition: StrategyCondition,
    componentType: "inp1" | "inp2" | "timeframe" | "operator" | "then" | "accumulate",
    index: number,
  ) => {
    // Handle "Then" component tooltip
    if (componentType === "then" && condition.Then) {
      return {
        title: "Then",
        details: {
          Wait: condition.Then.Wait,
          count: condition.Then.count,
          candle: condition.Then.candle,
        },
      }
    }

    if (componentType === "inp1" && condition.inp1) {
      const inp1 = condition.inp1

      if ("name" in inp1) {
        if (inp1.name === "RSI") {
          return {
            title: "RSI",
            details: {
              rsi_length: inp1.input_params?.timeperiod || 14,
              source: inp1.input_params?.source || "close", // Add source to tooltip
              ...(inp1.Derivative && { derivative_order: inp1.Derivative.order }),

            },
          }
        } else if (inp1.name === "RSI_MA") {
          return {
            title: "RSI MA",
            details: {
              rsi_length: inp1.input_params?.rsi_length || 14,
              ma_length: inp1.input_params?.ma_length || 14,
              rsi_source: inp1.input_params?.rsi_source || "Close",
              ma_type: inp1.input_params?.ma_type || "SMA",
              // Only reveal bb_stddev if the saved data actually carries it
              // (legacy strategies); new RSI_MA blocks don't include it.
              ...(inp1.input_params?.bb_stddev != null && { bb_stddev: inp1.input_params.bb_stddev }),
              ...(inp1.Derivative && { derivative_order: inp1.Derivative.order }),
            },
          }
        } else if (inp1.name === "BBANDS") {
          return {
            title: "Bollinger Bands",
            details: {
              timeperiod: inp1.input_params?.timeperiod || 17,
              input: inp1.input || "upperband",
              ...(inp1.Derivative && { derivative_order: inp1.Derivative.order }),
            },
          }
        } else if (inp1.name === "Stochastic") {
          const indicatorTypeValue = (inp1.input_params?.indicatorType ||
            (inp1.input_params?.output === "slowd" ? "d" : "k") ||
            "k").toLowerCase()
          return {
            title: "Stochastic",
            details: {
              indicator_type: indicatorTypeValue === "k" ? "%K" : "%D",
              k_length:
                inp1.input_params?.kLength ??
                inp1.input_params?.fastk_period ??
                14,
              k_smoothing:
                inp1.input_params?.kSmoothing ??
                inp1.input_params?.slowk_period ??
                3,
              d_smoothing:
                inp1.input_params?.dSmoothing ??
                inp1.input_params?.slowd_period ??
                3,
              ...(inp1.Derivative && { derivative_order: inp1.Derivative.order }),
            },
          }
        } else if (inp1.name === "Stochastic") {
          const outputValue = inp1.input_params?.output || "slowk"
          return {
            title: "Stochastic Oscillator",
            details: {
              fastk_period:
                inp1.input_params?.fastk_period ??
                inp1.input_params?.kLength ??
                14,
              slowk_period:
                inp1.input_params?.slowk_period ??
                inp1.input_params?.kSmoothing ??
                3,
              slowd_period:
                inp1.input_params?.slowd_period ??
                inp1.input_params?.dSmoothing ??
                3,
              output: outputValue === "slowk" ? "%K" : "%D",
              ...(inp1.Derivative && { derivative_order: inp1.Derivative.order }),
            },
          }
        } else if (inp1.name === "MACD") {
          return {
            title: "MACD",
            details: {
              indicator_type: inp1.input_params?.macd_indicator_type || "MACD",
              fast_length: inp1.input_params?.macd_fast_length || 12,
              slow_length: inp1.input_params?.macd_slow_length || 26,
              source: inp1.input_params?.macd_source || "close",
              signal_smoothing: inp1.input_params?.macd_signal_smoothing || 9,
              oscillator_ma_type: inp1.input_params?.macd_oscillator_ma_type || "EMA",
              signal_ma_type: inp1.input_params?.macd_signal_ma_type || "EMA",
              ...(inp1.Derivative && { derivative_order: inp1.Derivative.order }),
            },
          }
        } else if (inp1.name === "SupertrendIndicator") {
          return {
            title: "SuperTrend",
            details: {
              period: inp1.input_params?.period || 10,
              multiplier: inp1.input_params?.multiplier || 3.0,
              change_atr_method: inp1.input_params?.change_atr_method ? "Yes" : "No",
              output: inp1.input_params?.output || "SellSignal",
              ...(inp1.Derivative && { derivative_order: inp1.Derivative.order }),
            },
          }
        } else if (inp1.name === "ATR") {
          return {
            title: "ATR",
            details: {
              atr_length: inp1.input_params?.atr_length || 14,
              atr_smoothing: inp1.input_params?.atr_smoothing || "RMA",
              ...(inp1.Derivative && { derivative_order: inp1.Derivative.order }),
            },
          }
        } else if (inp1.name === "Volume_MA") {
          return {
            title: "Volume MA",
            details: {
              ma_length: inp1.input_params?.ma_length || 20,
              ...(inp1.Derivative && { derivative_order: inp1.Derivative.order }),
            },
          }
        } else if (inp1.name === "VolumeDelta") {
          return {
            title: "Volume Delta",
            details: {
              lower_timeframe: inp1.input_params?.lower_timeframe || "1min",
              ...(inp1.Derivative && { derivative_order: inp1.Derivative.order }),
            },
          }
        } else if (inp1.name === "CumulativeVolumeDelta") {
          return {
            title: "Cumulative Volume Delta",
            details: {
              lower_timeframe: inp1.input_params?.lower_timeframe || "1min",
              reset_period: inp1.input_params?.reset_period || "D",
              ...(inp1.Derivative && { derivative_order: inp1.Derivative.order }),
            },
          }
        } else if (inp1.name === "HistoricalPriceLevel") {
          return {
            title: "Historical Price Level",
            details: {
              period: inp1.input_params?.period || "W",
              level: inp1.input_params?.level || "High",
              ...(inp1.Derivative && { derivative_order: inp1.Derivative.order }),
            },
          }
        } else if (inp1.name === "CandleSize") {
          return {
            title: "Candle Size",
            details: {
              asset_type: inp1.input_params?.asset_type || "gold",
              output: inp1.input_params?.output || "pips",
              ...(inp1.Derivative && { derivative_order: inp1.Derivative.order }),
            },
          }
        } else if (inp1.name === "GENERAL_PA") {
          return {
            title: "General PA",
            details: {
              ...(inp1.Derivative && { derivative_order: inp1.Derivative.order }),
            },
          }
        } else if ((inp1 as any).type === "CUSTOM_I") {
          return {
            title: inp1.name,
            details: {
              ...((inp1 as any).input_params || {}),
              ...(inp1.Derivative && { derivative_order: inp1.Derivative.order }),
            },
          }
        }
      } else if ("input" in inp1 && inp1.Derivative) {
        if (["open", "close", "high", "low"].includes(inp1.input?.toLowerCase() || "")) {
          return {
            title: "Price",
            details: {
              ...(inp1.Derivative && { derivative_order: inp1.Derivative.order }),
            },
          }
        } else if (inp1.input === "volume" && inp1.Derivative) {
          return {
            title: "Volume",
            details: {
              ...(inp1.Derivative && { derivative_order: inp1.Derivative.order }),
            },
          }
        }
      }
    }

    if (componentType === "inp2" && condition.inp2) {
      const inp2 = condition.inp2

      if ("type" in inp2 && inp2.type === "value") {
        return {
          title: "Value",
          details: {
            value: inp2.value,
            ...(condition.pips && { pips: condition.pips }),
          },
        }
      } else if ("name" in inp2 && inp2.name == "RSI") {
        return {
          title: "RSI",
          details: {
            rsi_length: inp2.input_params?.timeperiod || 14,
            source: inp2.input_params?.source || "close", // Add source to tooltip
            ...(inp2.Derivative && { derivative_order: inp2.Derivative.order }),

          },
        }
      } else if ("name" in inp2 && inp2.name === "RSI_MA") {
        return {
          title: "RSI MA",
          details: {
            rsi_length: inp2.input_params?.rsi_length || 14,
            ma_length: inp2.input_params?.ma_length || 14,
            rsi_source: inp2.input_params?.rsi_source || "Close",
            ma_type: inp2.input_params?.ma_type || "SMA",
            // Only reveal bb_stddev if legacy data carries it.
            ...(inp2.input_params?.bb_stddev != null && { bb_stddev: inp2.input_params.bb_stddev }),
            ...(inp2.Derivative && { derivative_order: inp2.Derivative.order }),
          },
        }
      } else if ("name" in inp2 && inp2.name === "Volume_MA") {
        return {
          title: "Volume MA",
          details: {
            ma_length: inp2.input_params?.ma_length || 20,
            ...(inp2.Derivative && { derivative_order: inp2.Derivative.order }),
          },
        }
      } else if ("name" in inp2 && inp2.name === "VolumeDelta") {
        return {
          title: "Volume Delta",
          details: {
            lower_timeframe: inp2.input_params?.lower_timeframe || "1min",
            ...(inp2.Derivative && { derivative_order: inp2.Derivative.order }),
          },
        }
      } else if ("name" in inp2 && inp2.name === "CumulativeVolumeDelta") {
        return {
          title: "Cumulative Volume Delta",
          details: {
            lower_timeframe: inp2.input_params?.lower_timeframe || "1min",
            reset_period: inp2.input_params?.reset_period || "D",
            ...(inp2.Derivative && { derivative_order: inp2.Derivative.order }),
          },
        }
      } else if ("name" in inp2 && inp2.name === "HistoricalPriceLevel") {
        return {
          title: "Historical Price Level",
          details: {
            period: inp2.input_params?.period || "W",
            level: inp2.input_params?.level || "High",
            ...(inp2.Derivative && { derivative_order: inp2.Derivative.order }),
          },
        }
      } else if ("name" in inp2 && inp2.name === "CandleSize") {
        return {
          title: "Candle Size",
          details: {
            asset_type: inp2.input_params?.asset_type || "gold",
            output: inp2.input_params?.output || "pips",
            ...(inp2.Derivative && { derivative_order: inp2.Derivative.order }),
          },
        }
      } else if ("name" in inp2 && inp2.name === "BBANDS") {
        return {
          title: "Bollinger Bands",
          details: {
            timeperiod: inp2.input_params?.timeperiod || 17,
            input: inp2.input || "upperband",
            ...(inp2.Derivative && { derivative_order: inp2.Derivative.order }),
          },
        }
      } else if ("name" in inp2 && inp2.name === "MACD") {
        return {
          title: "MACD",
          details: {
            indicator_type: inp2.input_params?.macd_indicator_type || "MACD",
            fast_length: inp2.input_params?.macd_fast_length || 12,
            slow_length: inp2.input_params?.macd_slow_length || 26,
            source: inp2.input_params?.macd_source || "close",
            signal_smoothing: inp2.input_params?.macd_signal_smoothing || 9,
            oscillator_ma_type: inp2.input_params?.macd_oscillator_ma_type || "EMA",
            signal_ma_type: inp2.input_params?.macd_signal_ma_type || "EMA",
            ...(inp2.Derivative && { derivative_order: inp2.Derivative.order }),
          },
        }
      } else if ("name" in inp2 && inp2.name === "ATR") {
        return {
          title: "ATR",
          details: {
            atr_length: inp2.input_params?.atr_length || 14,
            atr_smoothing: inp2.input_params?.atr_smoothing || "RMA",
            ...(inp2.Derivative && { derivative_order: inp2.Derivative.order }),
          },
        }
      } else if ("name" in inp2 && inp2.name === "SupertrendIndicator") {
        return {
          title: "SuperTrend",
          details: {
            period: inp2.input_params?.period || 10,
            multiplier: inp2.input_params?.multiplier || 3.0,
            change_atr_method: inp2.input_params?.change_atr_method ? "Yes" : "No",
            output: inp2.input_params?.output || "SellSignal",
            ...(inp2.Derivative && { derivative_order: inp2.Derivative.order }),
          },
        }
      } else if ("name" in inp2 && inp2.name === "Stochastic") {
        const indicatorTypeValue = (inp2.input_params?.indicatorType ||
          (inp2.input_params?.output === "slowd" ? "d" : "k") ||
          "k").toLowerCase()
        return {
          title: "Stochastic",
          details: {
            indicator_type: indicatorTypeValue === "k" ? "%K" : "%D",
            k_length:
              inp2.input_params?.kLength ??
              inp2.input_params?.fastk_period ??
              14,
            k_smoothing:
              inp2.input_params?.kSmoothing ??
              inp2.input_params?.slowk_period ??
              3,
            d_smoothing:
              inp2.input_params?.dSmoothing ??
              inp2.input_params?.slowd_period ??
              3,
            ...(inp2.Derivative && { derivative_order: inp2.Derivative.order }),
          },
        }
      } else if ("name" in inp2 && inp2.name === "Stochastic") {
        const outputValue = inp2.input_params?.output || "slowk"
        return {
          title: "Stochastic Oscillator",
          details: {
            fastk_period:
              inp2.input_params?.fastk_period ??
              inp2.input_params?.kLength ??
              14,
            slowk_period:
              inp2.input_params?.slowk_period ??
              inp2.input_params?.kSmoothing ??
              3,
            slowd_period:
              inp2.input_params?.slowd_period ??
              inp2.input_params?.dSmoothing ??
              3,
            output: outputValue === "slowk" ? "%K" : "%D",
            ...(inp2.Derivative && { derivative_order: inp2.Derivative.order }),
          },
        }
      } else if ("type" in inp2 && (inp2 as any).type === "CUSTOM_I" && "name" in inp2) {
        return {
          title: inp2.name,
          details: {
            ...((inp2 as any).input_params || {}),
            ...(inp2.Derivative && { derivative_order: inp2.Derivative.order }),
          },
        }
      }
    }
    if (
      componentType === "operator" &&
      ["atmost_above_pips", "atmost_below_pips"].includes(condition.operator_name) &&
      condition.pips
    ) {
      return {
        title: "Points Condition",
        details: {
          points: condition.pips,
        },
      }
    }

    if (
      componentType === "operator" &&
      condition.Operator &&
      (condition.Operator.operator_name === "moving_up" || condition.Operator.operator_name === "moving_down")
    ) {
      return {
        title: "Moving Operator",
        details: {
          operator: condition.Operator.operator_name.replace("_", " "),
          logical_operator: condition.Operator.params.logical_operator,
          value: condition.Operator.params.value,
          unit: condition.Operator.params.unit,
        },
      }
    }

    // Handle custom behaviors
    if (
      componentType === "operator" &&
      condition.operator_name?.startsWith("CUSTOM_B:") &&
      condition.Operator
    ) {
      return {
        title: condition.operator_display || "Custom Behavior",
        details: condition.Operator.params || {},
      }
    }

    if (componentType === "operator" && condition.offset && (condition.offset.value !== 0 || condition.offset.unit !== "")) {
      return {
        title: "Offset Details",
        details: {
          operator: condition.offset.logical_operator,
          value: pipsToPointsDisplay(`${condition.offset.value}${condition.offset.unit}`),
        },
      }
    }

    if (componentType === "accumulate" && condition.Accumulate?.forPeriod) {
      return {
        title: "Accumulate Condition",
        details: {
          forPeriod: condition.Accumulate.forPeriod,
        },
      }
    }

    return null
  }

  // Add these functions after the getTooltipContent function
  const handleMouseEnter = (
    e: React.MouseEvent,
    condition: StrategyCondition,
    componentType: "inp1" | "inp2" | "timeframe" | "then" | "operator" | "accumulate", // Added operator and accumulate
    index: number,
  ) => {
    const content = getTooltipContent(condition, componentType, index)
    if (content) {
      const rect = e.currentTarget.getBoundingClientRect()
      setHoveredComponent({
        show: true,
        content,
        position: {
          x: rect.left + rect.width / 2,
          y: rect.top - 3,
        },
      })
    }
  }

  const handleMouseLeave = () => {
    setHoveredComponent({
      show: false,
      content: null,
      position: { x: 0, y: 0 },
    })
  }

  const handleSaveCustomTimeframe = (timeframe: string) => {
    setCustomTimeframes((prev) => (prev.includes(timeframe) ? prev : [...prev, timeframe]))

    setSelectedTimeframe(timeframe)
    setShowCustomTimeframeModal(false)
    setShowTimeframeDropdown(false)
  }



  // Modify the handleTimeframeSelect function to handle the "Add Custom" option
  const handleTimeframeSelect = (timeframe: string) => {
    if (timeframe === "add-custom") {
      setShowCustomTimeframeModal(true)
    } else {
      setSelectedTimeframe(timeframe)

      // If we have an active condition, update its timeframe
      if (activeConditionIndex !== null) {
        const newStatements = [...statements]
        const currentStatement = newStatements[activeStatementIndex]
        const condition = currentStatement.strategy[activeConditionIndex]

        if (condition) {
          // Update the correct timeframe based on input type. inp1 and inp2
          // each carry their own timeframe and must be independently editable
          // (per backend contract — every non-"value" operand has its own tf).
          if (activeInputType === "inp1" && condition.inp1 && "timeframe" in condition.inp1) {
            condition.inp1.timeframe = timeframe
          } else if (activeInputType === "inp2" && condition.inp2 && typeof condition.inp2 === "object" && "timeframe" in condition.inp2) {
            condition.inp2.timeframe = timeframe
          } else if (activeInputType === "condition") {
            // For condition-level timeframes
            if (condition.inp1 && "timeframe" in condition.inp1) {
              condition.inp1.timeframe = timeframe
            } else {
              condition.timeframe = timeframe
            }
          }

          setStatements(newStatements)
        }
      }
    }

    setShowTimeframeDropdown(false)
  }

  // New function to open timeframe dropdown for a specific condition
  const openTimeframeDropdown = (
    statementIndex: number,
    conditionIndex: number,
    inputType: "inp1" | "inp2" | "condition" = "condition",
  ) => {
    // inp1 and inp2 both have independently editable timeframes per the
    // backend contract — no early bail for inp2.
    setActiveStatementIndex(statementIndex)
    setActiveConditionIndex(conditionIndex)
    setActiveInputType(inputType)
    setShowTimeframeDropdown(true)
  }

  // Add a new function to open the AtCandleModal for editing
  const openAtCandleModal = (statementIndex: number, conditionIndex: number, targetInput?: "inp1" | "inp2") => {
    setActiveStatementIndex(statementIndex)
    setActiveConditionIndex(conditionIndex)

    // If a specific input is targeted, store it in state
    if (targetInput) {
      setTargetInput(targetInput)
    } else {
      // Otherwise, try to determine which input to target based on existing indices
      const condition = statements[statementIndex].strategy[conditionIndex]
      if (condition.inp1?.index !== undefined) {
        setTargetInput("inp1")
        setSelectedCandleNumber(condition.inp1.index ? Math.abs(condition.inp1.index) : 1)
      } else if (condition.inp2?.index !== undefined) {
        setTargetInput("inp2")
        setSelectedCandleNumber(condition.inp2.index ? Math.abs(condition.inp2.index) : 1)
      } else {
        // Default to inp1 if no existing index
        setTargetInput("inp1")
      }
    }

    setShowAtCandleModal(true)
  }

  /**
   * Run backend validation as a preflight. Returns true when the caller should
   * proceed (valid; warnings are surfaced but don't block). Returns false when
   * the action should be aborted (network failure or valid === false). Toasts
   * the first error or all warnings as appropriate.
   *
   * Used at exactly the two checkpoints in the spec — Save Draft and Proceed
   * to Strategy Testing — and nowhere else.
   */
  const preflightValidate = async (
    payload: any,
    context: "save" | "proceed",
  ): Promise<boolean> => {
    let result: Awaited<ReturnType<typeof validateStrategy>>
    try {
      result = await validateStrategy(payload)
    } catch (err: any) {
      // Network / endpoint failure — block the action so we never persist a
      // strategy that hasn't been verified.
      toast({
        variant: "destructive",
        title: "Could not validate strategy",
        description: err?.message || "Validation service is unreachable. Please try again.",
      })
      return false
    }

    if (!result?.valid) {
      // Backend reports the first failing check only; surface it verbatim and
      // let the user fix-and-re-validate iteratively.
      const first = result?.errors?.[0] || "Strategy is invalid."
      toast({
        variant: "destructive",
        title: context === "save" ? "Cannot save invalid strategy" : "Cannot proceed — strategy is invalid",
        description: first,
      })
      return false
    }

    // Warnings are non-blocking but should still be visible.
    if (Array.isArray(result.warnings) && result.warnings.length > 0) {
      toast({
        title: "Strategy validated with warnings",
        description: result.warnings.join("\n"),
      })
    }
    return true
  }

  const handleSaveDraft = async (name: string) => {
    try {
      const needsTf = tradeTiming.entry_at === "tick" || tradeTiming.exit_at === "tick"
      if (needsTf && !tradeTiming.execution_timeframe?.trim()) {
        toast({
          variant: "destructive",
          title: "Execution timeframe required",
          description:
            "Trade execution timing uses tick-level — please set the execution timeframe in the Strategy Tester before saving.",
        })
        return
      }

      // Save all statements, not just the active one
      // If there's only one statement, save it normally
      // If there are multiple statements, save each one separately
      let result
      let firstStatementId: string | null = null

      const unifiedPayload = buildUnifiedPayload(name)

      // Debug: Log the unified payload
      console.log("🔍 DEBUG: Unified payload for Save Draft:", JSON.stringify(unifiedPayload, null, 2))

      // Backend preflight — single source of truth. Blocks the save if the
      // backend reports `valid: false` (includes missing/inactive CUSTOM_I,
      // CUSTOM_B:, CUSTOM_TM: references once backend enforces those).
      const ok = await preflightValidate(unifiedPayload, "save")
      if (!ok) return

      setIsSavingDraft(true)

      // Rule: if persistedId exists, use it; otherwise CREATE
      let existingId: string | null = persistedId

      if (existingId) {
        result = await editStrategy(existingId, unifiedPayload)
        firstStatementId = existingId
      } else {
        result = await createStatement({ statement: unifiedPayload })
        if (result && result.id) {
          firstStatementId = result.id
          setPersistedId(result.id)
          localStorage.setItem("strategy_id", result.id)
        }
      }

      // Update local state immediately for better UX
      setStrategyName(name)

      // Update localStorage with the first statement ID for subsequent edits
      if (firstStatementId) {
        localStorage.setItem("strategy_id", firstStatementId)

        // Persist trade-timing fallback keyed by this strategy id (backend may drop these fields)
        try {
          const fallback: any = {
            entry_at: tradeTiming.entry_at,
            exit_at: tradeTiming.exit_at,
          }
          const needsTf = tradeTiming.entry_at === "tick" || tradeTiming.exit_at === "tick"
          if (needsTf && tradeTiming.execution_timeframe) {
            fallback.execution_timeframe = tradeTiming.execution_timeframe
          }
          localStorage.setItem(`trade_timing_${firstStatementId}`, JSON.stringify(fallback))
        } catch { }

        // Refresh strategy data to ensure UI is in sync
        try {
          const freshData = await fetchStatementDetail(firstStatementId)
          if (freshData) {
            // Update strategy name and statements from fresh data
            if (freshData.name) setStrategyName(freshData.name)
            // The useEffect that depends on strategyData and strategyId will handle the rest
            // if we were able to pass the fresh data back up, but since we're inside StrategyBuilder,
            // we'll manually trigger the same logic or ensure the prop update triggers it.
            // Actually, strategyData is a prop from the parent. 
            // If we can't update the prop, we should at least update local state.
          }
        } catch (refreshError) {
          console.error("Error refreshing strategy data after save draft:", refreshError)
        }
      }

      setIsSavingDraft(false)
      setShowSaveStrategyModal(false)
    } catch (error: any) {
      console.error("Error saving strategy:", error)
      setIsSavingDraft(false)
      toast({
        variant: "destructive",
        title: "Error Saving Strategy",
        description: error.message || "Something went wrong while saving your strategy draft.",
      })
    }
  }

  // Replace the handleContinue function with this updated version
  const handleContinue = () => {
    if (!isStrategyValid) {
      const first = strategyValidationIssues[0]
      const more = strategyValidationIssues.length - 1
      const detail = `${first.statement}, condition ${first.conditionIndex + 1} is missing ${first.missing.join(", ")}` +
        (more > 0 ? ` (and ${more} more incomplete ${more === 1 ? "condition" : "conditions"}).` : ".")
      toast({
        variant: "destructive",
        title: "Strategy is incomplete",
        description: `${detail} Complete every condition before saving or proceeding to testing.`,
      })
      return
    }
    setShowSaveStrategyModal(true)
  }

  // Interface types for Developer Mode
  interface CompileData {
    code: string
    codeType: "component" | "strategy"
    language: string
    componentName?: string
    strategyName?: string
    componentType?: "indicator" | "behavior" | "trade_management"
    parameters?: ParameterSchema[]
    componentId?: number  // For editing existing components
  }

  interface CompileError {
    line?: number
    column?: number
    message: string
    type: "error" | "warning"
  }

  interface CompileResult {
    success: boolean
    message: string
    errors?: CompileError[]
    warnings?: string[]
    strategyId?: number
    parameterErrors?: Record<number, string[]>
  }

  // State to track the current component being edited
  const [currentComponentId, setCurrentComponentId] = useState<number | null>(null)

  // State to track the current strategy being edited
  const [currentStrategyId, setCurrentStrategyId] = useState<number | null>(null)

  // Helper function to handle Complete Strategy compilation
  const handleStrategyCompile = async (data: CompileData): Promise<CompileResult> => {
    try {
      // Create or update the strategy
      let strategyId = currentStrategyId

      if (!strategyId) {
        // Create a new strategy - use provided name or generate one
        const strategyName = data.strategyName || `custom_strategy_${Date.now()}`
        const createResult = await createCustomStrategy({
          name: strategyName,
          code: data.code,
        })
        strategyId = createResult.id
        setCurrentStrategyId(strategyId)
        console.log("Created custom strategy:", createResult)
      }

      // Validate the strategy code
      const validationResult = await validateCustomStrategyCode({
        code: data.code,
        component_id: strategyId,
      })

      console.log("Strategy validation result:", validationResult)

      if (!validationResult.is_valid) {
        const errors: CompileError[] = []

        // Parse syntax errors
        if (validationResult.syntax_errors?.length > 0) {
          validationResult.syntax_errors.forEach((err: string) => {
            const lineMatch = err.match(/(?:at\s+)?line\s+(\d+)/i)
            errors.push({
              line: lineMatch ? parseInt(lineMatch[1]) : undefined,
              message: err,
              type: "error",
            })
          })
        }

        // Parse security errors
        if (validationResult.security_errors?.length > 0) {
          validationResult.security_errors.forEach((err: string) => {
            const lineMatch = err.match(/\(?line\s+(\d+)\)?/i)
            errors.push({
              line: lineMatch ? parseInt(lineMatch[1]) : undefined,
              message: err,
              type: "error",
            })
          })
        }

        // Parse contract errors
        if (validationResult.contract_errors?.length > 0) {
          validationResult.contract_errors.forEach((err: string) => {
            errors.push({
              message: err,
              type: "error",
            })
          })
        }

        return {
          success: false,
          message: "Strategy compilation failed - see errors below",
          errors: errors.length > 0 ? errors : [{ message: "Strategy validation failed", type: "error" }],
        }
      }

      // Strategy compiled successfully
      return {
        success: true,
        message: `Strategy compiled successfully! You can now run backtests on this strategy.`,
        strategyId: strategyId,
      }
    } catch (error: any) {
      console.error("Strategy compile error:", error)
      return {
        success: false,
        message: "Strategy compilation failed",
        errors: [{ message: error.message || String(error), type: "error" }],
      }
    }
  }

  // Handler for Developer Mode code compilation
  const handleDeveloperModeCompile = async (data: CompileData): Promise<CompileResult> => {
    try {
      // Basic validation checks first
      if (!data.code.trim()) {
        return {
          success: false,
          message: "No code provided",
          errors: [{ message: "Please enter some code to compile", type: "error" }],
        }
      }

      // Handle Complete Strategy compilation separately
      if (data.codeType === "strategy") {
        return await handleStrategyCompile(data)
      }

      // Handle Component compilation
      if (!data.componentName?.trim()) {
        return {
          success: false,
          message: "Component name required",
          errors: [{ message: "Please enter a component name", type: "error" }],
        }
      }

      // Send the full schema: { parameters: { parameters: [ParameterSchema, ...] } }
      const parametersPayload = { parameters: (data.parameters as ParameterSchema[] | undefined) ?? [] }

      // If we have a component ID (from editing or from state), update and validate the existing component
      const componentId = data.componentId || currentComponentId
      if (componentId) {
        // First, update the component with new data (name, type, language, parameters, code)
        try {
          await updateCustomComponent(componentId, {
            name: data.componentName || "Custom Component",
            type: data.componentType || "indicator",
            language: data.language,
            code: data.code,
            parameters: parametersPayload,
          })
        } catch (apiErr: any) {
          const { rowErrors, globalErrors } = parseDrfParameterErrors(apiErr?.response)
          const errMessages: CompileError[] = [
            ...Object.values(rowErrors).flat().map((m) => ({ message: m, type: "error" as const })),
            ...globalErrors.map((m) => ({ message: m, type: "error" as const })),
          ]
          if (errMessages.length === 0) errMessages.push({ message: apiErr?.message || "Update failed", type: "error" })
          return {
            success: false,
            message: "Failed to save parameter schema — fix the errors below.",
            errors: errMessages,
            parameterErrors: rowErrors,
          }
        }

        // Then validate the code
        const validationResult = await validateCustomComponentCode({
          code: data.code,
          component_id: componentId,
        })

        console.log("Validation result:", validationResult)

        if (!validationResult.is_valid) {
          const errors: CompileError[] = []

          // Parse syntax errors - match formats like "Syntax error at line 3:" or "line 3"
          if (validationResult.syntax_errors?.length > 0) {
            validationResult.syntax_errors.forEach((err: string) => {
              const lineMatch = err.match(/(?:at\s+)?line\s+(\d+)/i)
              errors.push({
                line: lineMatch ? parseInt(lineMatch[1]) : undefined,
                message: err,
                type: "error",
              })
            })
          }

          // Parse security errors - match formats like "(line 3)" or "line 3"
          if (validationResult.security_errors?.length > 0) {
            validationResult.security_errors.forEach((err: string) => {
              const lineMatch = err.match(/\(?line\s+(\d+)\)?/i)
              errors.push({
                line: lineMatch ? parseInt(lineMatch[1]) : undefined,
                message: err,
                type: "error",
              })
            })
          }

          // Parse contract errors
          if (validationResult.contract_errors?.length > 0) {
            validationResult.contract_errors.forEach((err: string) => {
              errors.push({
                message: err,
                type: "error",
              })
            })
          }

          return {
            success: false,
            message: "Compilation failed - see errors below",
            errors: errors.length > 0 ? errors : [{ message: "Code validation failed", type: "error" }],
          }
        }

        // If validation passed and component was updated, try to activate it
        if (validationResult.component_status === "compiled") {
          try {
            await activateCustomComponent(componentId)
            return {
              success: true,
              message: `Compilation successful! Your custom component '${data.componentName}' is now active and available in the strategy builder.`,
            }
          } catch (activateError) {
            return {
              success: true,
              message: `Code compiled successfully! Component '${data.componentName}' is ready but needs manual activation.`,
              warnings: ["Component compiled but activation failed. You can activate it later."],
            }
          }
        }

        return {
          success: true,
          message: `Code validated successfully for '${data.componentName}'.`,
        }
      } else {
        // Create a new component
        let createResult: any
        try {
          createResult = await createCustomComponent({
            name: data.componentName || "Custom Component",
            type: data.componentType || "indicator",
            language: data.language,
            code: data.code,
            parameters: parametersPayload,
          })
        } catch (apiErr: any) {
          const { rowErrors, globalErrors } = parseDrfParameterErrors(apiErr?.response)
          const errMessages: CompileError[] = [
            ...Object.values(rowErrors).flat().map((m) => ({ message: m, type: "error" as const })),
            ...globalErrors.map((m) => ({ message: m, type: "error" as const })),
          ]
          if (errMessages.length === 0) errMessages.push({ message: apiErr?.message || "Create failed", type: "error" })
          return {
            success: false,
            message: "Failed to save parameter schema — fix the errors below.",
            errors: errMessages,
            parameterErrors: rowErrors,
          }
        }

        // Store the component ID for future updates
        setCurrentComponentId(createResult.id)

        // Now validate the code
        const validationResult = await validateCustomComponentCode({
          code: data.code,
          component_id: createResult.id,
        })

        console.log("Validation result for new component:", validationResult)

        if (!validationResult.is_valid) {
          const errors: CompileError[] = []

          // Parse syntax errors - match formats like "Syntax error at line 3:" or "line 3"
          if (validationResult.syntax_errors?.length > 0) {
            validationResult.syntax_errors.forEach((err: string) => {
              const lineMatch = err.match(/(?:at\s+)?line\s+(\d+)/i)
              errors.push({
                line: lineMatch ? parseInt(lineMatch[1]) : undefined,
                message: err,
                type: "error",
              })
            })
          }

          // Parse security errors - match formats like "(line 3)" or "line 3"
          if (validationResult.security_errors?.length > 0) {
            validationResult.security_errors.forEach((err: string) => {
              const lineMatch = err.match(/\(?line\s+(\d+)\)?/i)
              errors.push({
                line: lineMatch ? parseInt(lineMatch[1]) : undefined,
                message: err,
                type: "error",
              })
            })
          }

          // Parse contract errors
          if (validationResult.contract_errors?.length > 0) {
            validationResult.contract_errors.forEach((err: string) => {
              errors.push({
                message: err,
                type: "error",
              })
            })
          }

          return {
            success: false,
            message: "Compilation failed - see errors below",
            errors: errors.length > 0 ? errors : [{ message: "Code validation failed", type: "error" }],
          }
        }

        // If validation passed, activate the component
        if (validationResult.component_status === "compiled") {
          try {
            await activateCustomComponent(createResult.id)
            return {
              success: true,
              message: `Compilation successful! Your custom component '${data.componentName}' is now active and available in the strategy builder.`,
            }
          } catch (activateError) {
            return {
              success: true,
              message: `Component '${data.componentName}' created and compiled successfully!`,
              warnings: ["Component is compiled but needs manual activation to use in strategies."],
            }
          }
        }

        return {
          success: true,
          message: `Component '${data.componentName}' created successfully!`,
        }
      }
    } catch (error: any) {
      console.error("Developer Mode compile error:", error)
      return {
        success: false,
        message: "Compilation failed",
        errors: [{ message: error.message || String(error), type: "error" }],
      }
    }
  }

  // Handler for Developer Mode save (draft)
  const handleDeveloperModeSave = async (data: CompileData & { isDraft: boolean }): Promise<void> => {
    try {
      // Handle Complete Strategy save separately
      if (data.codeType === "strategy") {
        if (currentStrategyId) {
          // Update existing strategy
          await updateCustomStrategy(currentStrategyId, {
            code: data.code,
          })
          console.log("Updated custom strategy:", currentStrategyId)
        } else {
          // Create a new strategy as draft - use provided name or generate one
          const strategyName = data.strategyName || `custom_strategy_${Date.now()}`
          const createResult = await createCustomStrategy({
            name: strategyName,
            code: data.code,
          })
          setCurrentStrategyId(createResult.id)
          console.log("Created custom strategy draft:", createResult)
        }
        console.log("Saved developer mode strategy:", data)
        return
      }

      // Handle Component save — send the full schema.
      const parametersPayload = { parameters: (data.parameters as ParameterSchema[] | undefined) ?? [] }

      const componentId = data.componentId || currentComponentId
      if (componentId) {
        await updateCustomComponent(componentId, {
          name: data.componentName || "Custom Component",
          type: data.componentType || "indicator",
          language: data.language,
          code: data.code,
          parameters: parametersPayload,
        })
      } else {
        const createResult = await createCustomComponent({
          name: data.componentName || "Custom Component",
          type: data.componentType || "indicator",
          language: data.language,
          code: data.code,
          parameters: parametersPayload,
        })
        setCurrentComponentId(createResult.id)
      }
    } catch (error: any) {
      // Try to surface DRF parameter errors so the editor can highlight rows.
      const { rowErrors, globalErrors } = parseDrfParameterErrors(error?.response)
      if (Object.keys(rowErrors).length || globalErrors.length) {
        const msg = [
          ...Object.values(rowErrors).flat(),
          ...globalErrors,
        ].join("; ")
        const wrapped = new Error(msg || error.message || "Failed to save")
        ;(wrapped as any).response = error?.response
        throw wrapped
      }
      throw new Error(error.message || "Failed to save")
    }
  }

  const handleProceedToTesting = async (name: string) => {
    try {
      const needsTf = tradeTiming.entry_at === "tick" || tradeTiming.exit_at === "tick"
      if (needsTf && !tradeTiming.execution_timeframe?.trim()) {
        toast({
          variant: "destructive",
          title: "Execution timeframe required",
          description:
            "Trade execution timing uses tick-level — please set the execution timeframe in the Strategy Tester before proceeding.",
        })
        return
      }

      // Build the unified multi-statement Strategy payload
      const unifiedPayload = buildUnifiedPayload(name)

      // Debug: Log the unified payload
      console.log("🔍 DEBUG: Unified payload for Proceed to Testing:", JSON.stringify(unifiedPayload, null, 2))

      // Backend preflight — same source of truth as Save Draft. Block the
      // transition to Strategy Testing on `valid: false` so we never enter
      // testing with an invalid strategy.
      const ok = await preflightValidate(unifiedPayload, "proceed")
      if (!ok) return

      setIsProceeding(true)

      // Save the complete statement for local use
      localStorage.setItem("savedStrategy", JSON.stringify(unifiedPayload))

      // Rule: if persistedId exists, use it; otherwise CREATE
      let existingId: string | null = persistedId

      let result
      let firstStatementId: string | null = null

      if (existingId) {
        result = await editStrategy(existingId, unifiedPayload)
        firstStatementId = existingId
      } else {
        const createResult = await createStatement({ statement: unifiedPayload })
        if (createResult && createResult.id) {
          firstStatementId = createResult.id
          setPersistedId(createResult.id)
          result = createResult
        }
      }

      // Update localStorage with the first statement ID
      if (firstStatementId) {
        localStorage.setItem("strategy_id", firstStatementId)

        // Persist trade-timing fallback keyed by this strategy id
        try {
          const fallback: any = {
            entry_at: tradeTiming.entry_at,
            exit_at: tradeTiming.exit_at,
          }
          const needsTf2 = tradeTiming.entry_at === "tick" || tradeTiming.exit_at === "tick"
          if (needsTf2 && tradeTiming.execution_timeframe) {
            fallback.execution_timeframe = tradeTiming.execution_timeframe
          }
          localStorage.setItem(`trade_timing_${firstStatementId}`, JSON.stringify(fallback))
        } catch { }

        // Refresh strategy data to ensure UI is in sync
        try {
          const freshData = await fetchStatementDetail(firstStatementId)
          if (freshData) {
            if (freshData.name) setStrategyName(freshData.name)
          }
        } catch (refreshError) {
          console.error("Error refreshing strategy data after proceed to testing:", refreshError)
        }
      }

      // Update local state immediately for better UX
      setStrategyName(name)

      // Store timeframes_required if it exists in the response
      if (result && result.optimisation_form) {
        localStorage.setItem("optimisation_form", JSON.stringify(result.optimisation_form))
      }
      if (result && result.timeframes_required) {
        localStorage.setItem("timeframes_required", JSON.stringify(result.timeframes_required))
      }

      setIsProceeding(false)
      setShowSaveStrategyModal(false)
      try {
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('builder_return', '1')
        }
      } catch { }
      router.push("/strategy-testing")
    } catch (error: any) {
      console.error("Error processing strategy:", error)
      setIsProceeding(false)
      toast({
        variant: "destructive",
        title: "Error Processing Strategy",
        description: error.message || "Something went wrong while preparing your strategy for testing.",
      })
    }
  }

  const handleEditStrategyName = async (newName: string) => {
    try {
      // Get strategy ID from localStorage if not in URL
      let id = strategyId
      if (!id) {
        id = localStorage.getItem("strategy_id")
      }

      if (!id) {
        console.error("No strategy ID available for editing")
        return
      }

      const idToUpdate = id
      const unifiedPayload = buildUnifiedPayload(newName)

      await editStrategy(idToUpdate, unifiedPayload)

      // Refresh strategy data to ensure UI is in sync
      try {
        const freshData = await fetchStatementDetail(idToUpdate)
        if (freshData && freshData.name) {
          setStrategyName(freshData.name)
        }
      } catch (refreshError) {
        console.error("Error refreshing strategy data after name edit:", refreshError)
      }

      setShowEditNameModal(false)
    } catch (error: any) {
      console.error("Error editing strategy name:", error)
      toast({
        variant: "destructive",
        title: "Error Renaming Strategy",
        description: error.message || "Failed to update strategy name.",
      })
    }
  }

  // Update the toggleWaitParameter function to handle adding wait parameter if it doesn't exist
  // This function should be around line 1500-1550

  function toggleWaitParameter(statementIndex: number, conditionIndex: number, inputType: "inp1" | "inp2") {
    const newStatements = [...statements]
    const currentStatement = newStatements[statementIndex]
    const condition = currentStatement.strategy[conditionIndex]

    if (inputType === "inp1" && condition.inp1) {
      if ("wait" in condition.inp1) {
        condition.inp1.wait = condition.inp1.wait === "yes" ? undefined : "yes"
      } else if (typeof condition.inp1 === "object") {
        condition.inp1.wait = "yes"
      }
    } else if (inputType === "inp2" && condition.inp2 && typeof condition.inp2 !== "string" && "type" in condition.inp2) {
      if ("wait" in condition.inp2) {
        condition.inp2.wait = condition.inp2.wait === "yes" ? undefined : "yes"
      } else {
        condition.inp2.wait = "yes"
      }
    }

    setStatements(newStatements)
  }

  // New function to handle pips value editing:
  const handlePipsValueChange = (statementIndex: number, conditionIndex: number, newValue: number) => {
    const newStatements = [...statements]
    const currentStatement = newStatements[statementIndex]
    const condition = currentStatement.strategy[conditionIndex]

    // Update the pips property directly
    if (condition.operator_name === "atmost_above_pips" || condition.operator_name === "atmost_below_pips") {
      condition.pips = newValue
      setStatements(newStatements)
    }
  }

  const handlePriceSelection = (priceType: string) => {
    const newStatements = [...statements]
    const currentStatement = newStatements[activeStatementIndex]
    const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

    // Check if we already have inp1 and an operator - if so, we're adding to inp2
    if (lastCondition.inp1 && lastCondition.operator_name) {
      // We're adding to inp2
      const timeframe = lastCondition.timeframe || selectedTimeframe
      lastCondition.inp2 = createConstantInput(priceType.toLowerCase(), timeframe)
    } else {
      // Create or update inp1 with the selected price type
      const timeframe = lastCondition.timeframe || selectedTimeframe
      lastCondition.inp1 = createConstantInput(priceType.toLowerCase(), timeframe)
    }

    setStatements(newStatements)
  }

  const openStochasticModal = (
    statementIndex: number,
    conditionIndex: number,
    inputType: "inp1" | "inp2",
    timeframeOverride?: string,
  ) => {
    setStochasticModalTarget({
      statementIndex,
      conditionIndex,
      inputType,
      timeframeOverride,
    })
    setShowStochasticModal(true)
  }

  const resolveStochasticTarget = () => {
    if (stochasticModalTarget) {
      return stochasticModalTarget
    }

    if (editingComponent && (editingComponent.componentType === "inp1" || editingComponent.componentType === "inp2")) {
      return {
        statementIndex: editingComponent.statementIndex,
        conditionIndex: editingComponent.conditionIndex,
        inputType: editingComponent.componentType,
      }
    }

    const fallbackStatement = statements[activeStatementIndex]
    if (!fallbackStatement) return null
    const fallbackConditionIndex = Math.max(0, fallbackStatement.strategy.length - 1)
    const fallbackCondition = fallbackStatement.strategy[fallbackConditionIndex]
    const fallbackInput: "inp1" | "inp2" =
      fallbackCondition?.inp1 && fallbackCondition?.operator_name && !fallbackCondition?.inp2 ? "inp2" : "inp1"

    return {
      statementIndex: activeStatementIndex,
      conditionIndex: fallbackConditionIndex,
      inputType: fallbackInput,
    }
  }

  const getStochasticInitialSettings = () => {
    const target = resolveStochasticTarget()
    if (!target) return undefined
    const condition = statements[target.statementIndex]?.strategy[target.conditionIndex]
    if (!condition) return undefined
    const indicator =
      target.inputType === "inp1"
        ? condition?.inp1
        : condition?.inp2

    if (indicator && "name" in indicator) {
      if (indicator.name === "Stochastic" || indicator.name === "Stochastic") {
        const fastk = indicator.input_params?.fastk_period ?? indicator.input_params?.kLength ?? 14
        const slowk = indicator.input_params?.slowk_period ?? indicator.input_params?.kSmoothing ?? 3
        const slowd = indicator.input_params?.slowd_period ?? indicator.input_params?.dSmoothing ?? 3
        const outputValue = indicator.input_params?.output || "slowk"
        const indicatorTypeValue =
          (indicator.input_params?.indicatorType || (outputValue === "slowd" ? "d" : "k")) ?? "k"

        return {
          fastk_period: fastk,
          slowk_period: slowk,
          slowd_period: slowd,
          output: outputValue,
          indicatorType: indicatorTypeValue,
          kLength: indicator.input_params?.kLength ?? fastk,
          kSmoothing: indicator.input_params?.kSmoothing ?? slowk,
          dSmoothing: indicator.input_params?.dSmoothing ?? slowd,
          timeframe: indicator.timeframe || "3h",
        }
      }
    }

    return undefined
  }

  const applyStochasticSettings = (settings: any) => {
    const target = resolveStochasticTarget()
    if (!target) return

    const newStatements = [...statements]
    const targetStatement = newStatements[target.statementIndex]
    const condition = targetStatement?.strategy[target.conditionIndex]
    if (!condition) return

    const getExistingTimeframe = () => {
      const existing =
        target.inputType === "inp1"
          ? condition.inp1 && typeof condition.inp1 === "object" && "timeframe" in condition.inp1
            ? condition.inp1.timeframe
            : undefined
          : condition.inp2 && typeof condition.inp2 === "object" && "timeframe" in condition.inp2
            ? condition.inp2.timeframe
            : undefined
      return existing
    }

    const timeframe =
      target.timeframeOverride ||
      pendingTimeframe ||
      getExistingTimeframe() ||
      condition.timeframe ||
      selectedTimeframe

    const normalizedIndicatorType =
      typeof settings.indicatorType === "string"
        ? settings.indicatorType.toLowerCase()
        : undefined
    const derivedFastk = Number(settings.fastk_period ?? settings.kLength ?? 14)
    const derivedSlowk = Number(settings.slowk_period ?? settings.kSmoothing ?? 3)
    const derivedSlowd = Number(settings.slowd_period ?? settings.dSmoothing ?? 3)
    const outputValue =
      settings.output ||
      (normalizedIndicatorType === "d" ? "slowd" : "slowk")

    const indicatorData = {
      type: "CUSTOM_I" as const,
      name: "Stochastic" as const,
      timeframe,
      input_params: {
        fastk_period: derivedFastk,
        slowk_period: derivedSlowk,
        slowd_period: derivedSlowd,
        output: outputValue,
      },
    }

    if (target.inputType === "inp1") {
      condition.inp1 = indicatorData
    } else {
      condition.inp2 = indicatorData
    }

    if (condition.pendingAtCandle) {
      if (target.inputType === "inp1" && condition.pendingAtCandle.inp1 && condition.inp1 && typeof condition.inp1 === "object") {
        condition.inp1.index = condition.pendingAtCandle.inp1
        delete condition.pendingAtCandle.inp1
      }
      if (target.inputType === "inp2" && condition.pendingAtCandle.inp2 && condition.inp2 && typeof condition.inp2 === "object") {
        condition.inp2.index = condition.pendingAtCandle.inp2
        delete condition.pendingAtCandle.inp2
      }
      if (Object.keys(condition.pendingAtCandle).length === 0) {
        delete condition.pendingAtCandle
      }
    }

    setStatements(newStatements)
    setEditingComponent(null)
    setStochasticModalTarget(null)
    setShowStochasticModal(false)
    setPendingTimeframe("3h")
    setTimeout(() => {
      searchInputRefs.current[activeStatementIndex]?.focus()
    }, 100)
  }

  // ATR Modal Helper Functions
  const openAtrModal = (
    statementIndex: number,
    conditionIndex: number,
    inputType: "inp1" | "inp2",
    timeframeOverride?: string,
  ) => {
    setAtrModalTarget({
      statementIndex,
      conditionIndex,
      inputType,
      timeframeOverride,
    })
    setShowAtrModal(true)
  }

  const resolveAtrTarget = () => {
    if (atrModalTarget) {
      return atrModalTarget
    }

    if (editingComponent && (editingComponent.componentType === "inp1" || editingComponent.componentType === "inp2")) {
      return {
        statementIndex: editingComponent.statementIndex,
        conditionIndex: editingComponent.conditionIndex,
        inputType: editingComponent.componentType,
      }
    }

    const fallbackStatement = statements[activeStatementIndex]
    if (!fallbackStatement) return null
    const fallbackConditionIndex = Math.max(0, fallbackStatement.strategy.length - 1)
    const fallbackCondition = fallbackStatement.strategy[fallbackConditionIndex]
    const fallbackInput: "inp1" | "inp2" =
      fallbackCondition?.inp1 && fallbackCondition?.operator_name && !fallbackCondition?.inp2 ? "inp2" : "inp1"

    return {
      statementIndex: activeStatementIndex,
      conditionIndex: fallbackConditionIndex,
      inputType: fallbackInput,
    }
  }

  const getAtrInitialSettings = () => {
    const target = resolveAtrTarget()
    if (!target) return undefined
    const condition = statements[target.statementIndex]?.strategy[target.conditionIndex]
    if (!condition) return undefined
    const indicator =
      target.inputType === "inp1"
        ? condition?.inp1
        : condition?.inp2

    if (indicator && "name" in indicator && indicator.name === "ATR" && "input_params" in indicator) {
      return {
        atr_length: String(indicator.input_params?.atr_length || 14),
        atr_smoothing: indicator.input_params?.atr_smoothing || "RMA",
      }
    }

    return undefined
  }

  const applyAtrSettings = (settings: any) => {
    const target = resolveAtrTarget()
    if (!target) return

    const newStatements = [...statements]
    const targetStatement = newStatements[target.statementIndex]
    const condition = targetStatement?.strategy[target.conditionIndex]
    if (!condition) return

    const getExistingTimeframe = () => {
      const existing =
        target.inputType === "inp1"
          ? condition.inp1 && typeof condition.inp1 === "object" && "timeframe" in condition.inp1
            ? condition.inp1.timeframe
            : undefined
          : condition.inp2 && typeof condition.inp2 === "object" && "timeframe" in condition.inp2
            ? condition.inp2.timeframe
            : undefined
      return existing
    }

    const timeframe =
      target.timeframeOverride ||
      pendingTimeframe ||
      getExistingTimeframe() ||
      condition.timeframe ||
      selectedTimeframe

    const indicatorData = {
      type: "CUSTOM_I" as const,
      name: "ATR" as const,
      timeframe,
      input_params: {
        atr_length: Number(settings.atr_length),
        atr_smoothing: settings.atr_smoothing,
      },
    }

    if (target.inputType === "inp1") {
      condition.inp1 = indicatorData
    } else {
      condition.inp2 = indicatorData
    }

    if (condition.pendingAtCandle) {
      if (target.inputType === "inp1" && condition.pendingAtCandle.inp1 && condition.inp1 && typeof condition.inp1 === "object") {
        condition.inp1.index = condition.pendingAtCandle.inp1
        delete condition.pendingAtCandle.inp1
      }
      if (target.inputType === "inp2" && condition.pendingAtCandle.inp2 && condition.inp2 && typeof condition.inp2 === "object") {
        condition.inp2.index = condition.pendingAtCandle.inp2
        delete condition.pendingAtCandle.inp2
      }
      if (Object.keys(condition.pendingAtCandle).length === 0) {
        delete condition.pendingAtCandle
      }
    }

    setStatements(newStatements)
    setEditingComponent(null)
    setAtrModalTarget(null)
    setShowAtrModal(false)
    setPendingTimeframe("3h")
    setTimeout(() => {
      searchInputRefs.current[activeStatementIndex]?.focus()
    }, 100)
  }

  // A partial_tp Equity rule is a Manage Exit (UI-wise) when every entry is a
  // price-level full exit: only `Price` + `Close: "100%"`, with no `name`,
  // `operator`, or `Action`. Backend stores both features under partial_tp; the
  // frontend uses shape to route to the right modal/label.
  const isManageExitPartialTpShape = (rule: any): boolean => {
    if (!rule?.inp1 || rule.inp1.name !== "partial_tp") return false
    const list = rule.inp1.partial_tp_list
    if (!Array.isArray(list) || list.length === 0) return false
    return list.every((it: any) =>
      it && typeof it.Price === "string" &&
      !it.name && !it.operator && !it.Action &&
      /^(100%|1(\.0+)?)$/.test(String(it.Close ?? ""))
    )
  }

  // Update the renderStrategyConditions function to properly display At Candle components
  // Replace the existing At Candle rendering code with this:
  const renderStrategyConditions = (statement: StrategyStatement, statementIndex: number) => {
    // Every handler below was originally written against the outer
    // `activeStatementIndex` state, which routes mutations to the focused
    // statement instead of the row being rendered — so clicking a delete on
    // statement #2 would mutate statement #1. Shadowing the name with the
    // per-row index fixes all those handlers in one shot.
    const activeStatementIndex = statementIndex
    const components: JSX.Element[] = []

    // Render Buy/Sell component FIRST, based on statement.side
    // Only display if side has been explicitly set by user (not empty)
    if (statement.side === "B" || statement.side === "S") {
      const sideLabel = statement.side === "B" ? "Buy" : "Sell"
      components.push(
        <div key="side-component" className="flex items-center relative group">
          <div
            className="bg-[#C5C5C5] text-black px-3 py-2 mt-3 rounded-md mr-2 mb-2 transition-all duration-200 hover:bg-[#D5D5D5] cursor-pointer"
            onClick={() => {
              // Toggle between Buy and Sell on click
              const newStatements = [...statements]
              const currentStatement = newStatements[statementIndex]
              currentStatement.side = currentStatement.side === "B" ? "S" : "B"
              setStatements(newStatements)
            }}
          >
            {sideLabel}
          </div>
          <button
            onClick={() => {
              // Remove the Buy/Sell component by clearing the side
              const newStatements = [...statements]
              const currentStatement = newStatements[statementIndex]
              currentStatement.side = ""
              setStatements(newStatements)
            }}
            className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <X className="w-3 h-3" />
          </button>
        </div>,
      )
    }

    // Add each condition with appropriate background
    statement.strategy.forEach((condition, index) => {
      // Skip rendering "if" statements but keep "and"/"or"/"unless".
      // For no_trade rows the wire format is { statement: "and", no_trade: true },
      // but the UI represents the row with a single NO TRADE chip — don't show
      // a separate AND chip alongside it.
      if (
        condition.statement &&
        condition.statement.toLowerCase() !== "if" &&
        !condition.no_trade
      ) {
        // Basic components (and, etc.) with dark background
        components.push(
          <div
            key={`statement-${index}`}
            className="bg-[#151718] text-white px-3 py-1 rounded-md mr-2 mb-2 relative group"
          >
            {condition.statement.toUpperCase()}
            <button
              onClick={() => {
                console.log("Removing statement:", condition.statement, "at index:", index, "activeStatementIndex:", activeStatementIndex)
                removeComponent(activeStatementIndex, index, "statement")
              }}
              className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <X className="w-3 h-3" />
            </button>
          </div>,
        )
      }

      // NO TRADE chip — the sole visual representation of the row. Removing it
      // removes the whole condition (matches AND/UNLESS chip behaviour), since
      // there's no AND chip to anchor the row when no_trade is set.
      if (condition.no_trade) {
        components.push(
          <div
            key={`no-trade-${index}`}
            className="bg-[#151718] text-white px-3 py-1 rounded-md mr-2 mb-2 relative group"
            title="Trade is blocked when this condition is met"
          >
            NO TRADE
            <button
              onClick={() => removeComponent(activeStatementIndex, index, "statement")}
              className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <X className="w-3 h-3" />
            </button>
          </div>,
        )
      }

      // Add timeframe component if it exists and there's no inp1
      // Or get timeframe from inp1 if it exists
      const timeframeValue =
        condition.inp1 && "timeframe" in condition.inp1 ? condition.inp1.timeframe : condition.timeframe

      if (timeframeValue) {
        components.push(
          <div key={`timeframe-${index}`} className="mr-2 mb-2 relative group">
            <div className="text-xs text-gray-400 mb-1">Timeframe</div>
            <button
              onClick={() => openTimeframeDropdown(activeStatementIndex, index, "condition")}
              onMouseEnter={(e) => handleMouseEnter(e, condition, "timeframe", index)}
              onMouseLeave={handleMouseLeave}
              className="bg-[#151718] text-white px-3 py-2 rounded-md flex items-center justify-between min-w-[160px] border border-[#2A2D42] transition-all duration-200 hover:border-[#4A4D62]"
              data-timeframe-index={index}
            >
              <span className="text-gray-400">{timeframeValue || "Select timeframe"}</span>
              <ChevronDown className="ml-1 w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                // Remove timeframe from both condition and inp1 if it exists
                const newStatements = [...statements]
                const currentStatement = newStatements[activeStatementIndex]
                const condition = currentStatement.strategy[index]

                if (condition.timeframe) {
                  delete condition.timeframe
                }
                if (condition.inp1 && condition.inp1.timeframe) {
                  delete condition.inp1.timeframe
                }

                setStatements(newStatements)
              }}
              className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <X className="w-3 h-3" />
            </button>
          </div>,
        )
      }

      // Show pending At Candle if it exists
      if (condition.pendingAtCandle) {
        Object.entries(condition.pendingAtCandle).forEach(([inputType, candleNumber]) => {
          const displayNumber = Math.abs(candleNumber as number)
          components.push(
            <div key={`pending-at-candle-${inputType}-${index}`} className="mr-2 mb-2 relative group">
              <div className="text-xs text-gray-400 mb-1">Pending At Candle ({inputType})</div>
              <button
                onClick={() => openAtCandleModal(activeStatementIndex, index, inputType as "inp1" | "inp2")}
                className="bg-[#4A4D62] text-white px-3 py-2 rounded-md flex items-center justify-between min-w-[160px] border border-[#2A2D42] opacity-70"
                data-candle-index={index}
              >
                <span className="text-gray-300">Candle -{displayNumber} (pending)</span>
                <ChevronDown className="ml-1 w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const newStatements = [...statements]
                  const currentStatement = newStatements[activeStatementIndex]
                  const condition = currentStatement.strategy[index]
                  if (condition.pendingAtCandle) {
                    delete condition.pendingAtCandle[inputType as "inp1" | "inp2"]
                    if (Object.keys(condition.pendingAtCandle).length === 0) {
                      delete condition.pendingAtCandle
                    }
                  }
                  setStatements(newStatements)
                }}
                className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <X className="w-3 h-3" />
              </button>
            </div>,
          )
        })
      }

      // Check for index in inp1
      if (condition.inp1 && typeof condition.inp1 === "object" && condition.inp1.index !== undefined) {
        const candleNumber = Math.abs(condition.inp1.index || 1)

        components.push(
          <div key={`at-candle-inp1-${index}`} className="mr-2 mb-2 relative group">
            <div className="text-xs text-gray-400 mb-1">At Candle (inp1)</div>
            <button
              onClick={() => openAtCandleModal(activeStatementIndex, index, "inp1")}
              className="bg-[#151718] text-white px-3 py-2 rounded-md flex items-center justify-between min-w-[160px] border border-[#2A2D42]"
              data-candle-index={index}
            >
              <span className="text-gray-400">Candle -{candleNumber}</span>
              <ChevronDown className="ml-1 w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const newStatements = [...statements]
                const currentStatement = newStatements[activeStatementIndex]
                const condition = currentStatement.strategy[index]
                if (condition.inp1 && typeof condition.inp1 === "object") {
                  delete condition.inp1.index
                }
                setStatements(newStatements)
              }}
              className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <X className="w-3 h-3" />
            </button>
          </div>,
        )
      }

      if (condition.inp1) {
        // Indicators with light gray background
        let displayName = ""

        // Special handling for price indicators (type C with input like open, close, high, low)
        if (
          condition.inp1.type === "C" &&
          ["open", "close", "high", "low"].includes(condition.inp1.input?.toLowerCase() || "")
        ) {
          // Format as "Price Type" with first letter capitalized
          const priceType = condition.inp1.input?.charAt(0).toUpperCase() + condition.inp1.input?.slice(1)
          displayName = `Price ${priceType}`
        } else if (
          ("name" in condition.inp1 && condition.inp1.name === "BBANDS") ||
          (condition.inp1.type === "I" && condition.inp1.input && ["upperband", "lowerband", "middleband"].includes(condition.inp1.input?.toLowerCase()))
        ) {
          // Always show "Bollinger" for BBANDS indicators
          // Check by name or by type+input combination to catch all cases
          displayName = "Bollinger"
        } else {
          // For other indicators, use the existing logic
          displayName =
            "name" in condition.inp1
              ? condition.inp1.name
              : condition.inp1.name || condition.inp1.input?.toUpperCase() || ""
        }

        // Add "Derivative" label if it has a Derivative property
        if (condition.inp1.Derivative) {
          displayName = `${displayName} (Derivative)`
        }

        components.push(
          <div key={`inp1-${index}`} className="flex items-center relative group">
            <div
              className="bg-[#C5C5C5] text-black px-3 py-2 mt-3 rounded-md mr-2 mb-2 transition-all duration-200 hover:bg-[#D5D5D5] cursor-pointer"
              onMouseEnter={(e) => handleMouseEnter(e, condition, "inp1", index)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleComponentClick(activeStatementIndex, index, "inp1")}
            >
              {displayName}
            </div>
            <button
              onClick={() => removeComponent(activeStatementIndex, index, "inp1")}
              className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <X className="w-3 h-3" />
            </button>
          </div>,
        )

        // Add wait button for inp1
        components.push(
          <div key={`wait-inp1-${index}`} className="mr-2 mb-2">
            <button
              onClick={() => toggleWaitParameter(activeStatementIndex, index, "inp1")}
              className={`px-2 py-1 text-xs rounded-md transition-all duration-200 ${condition.inp1 && "wait" in condition.inp1 && condition.inp1.wait === "yes"
                ? "bg-[#85e1fe] text-black"
                : "bg-[#2A2D42] text-white hover:bg-[#3A3D47]"
                }`}
            >
              Wait
            </button>
          </div>,
        )
      }

      if (condition.operator_name) {
        // Behaviors with light gray background
        let operatorDisplay = condition.operator_display || condition.operator_name.replace("_", " ")

        // Handle custom behaviors
        if (condition.operator_name.startsWith("CUSTOM_B:")) {
          operatorDisplay = condition.operator_display || condition.operator_name.replace("CUSTOM_B:", "")
        }
        // For moving operators with new structure, show the full configuration
        else if (condition.Operator && (condition.operator_name === "moving_up" || condition.operator_name === "moving_down")) {
          const params = condition.Operator.params
          operatorDisplay = pipsToPointsDisplay(`${condition.Operator.operator_name.replace("_", " ")} ${params.logical_operator} ${params.value}${params.unit}`)
        }
        // For Above/Below operators with offset
        else if (condition.offset && (
          condition.operator_name.toLowerCase() === "above" ||
          condition.operator_name.toLowerCase() === "below" ||
          condition.operator_name.toLowerCase() === "crosses_above" ||
          condition.operator_name.toLowerCase() === "crosses_below"
        )) {
          const offset = condition.offset
          const offsetStr = offset.value !== 0 ? ` by ${offset.logical_operator} ${offset.value}${offset.unit}` : ""
          operatorDisplay = pipsToPointsDisplay(`${condition.operator_name.replace("_", " ")}${offsetStr}`)
        }

        components.push(
          <div key={`operator-${index}`} className="flex items-center relative group">
            <div
              className="bg-[#C5C5C5] text-black px-3 py-2 mt-3 rounded-md mr-2 mb-2 transition-all duration-200 hover:bg-[#D5D5D5] cursor-pointer"
              onMouseEnter={(e) => handleMouseEnter(e, condition, "operator", index)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleComponentClick(activeStatementIndex, index, "operator")}
            >
              {operatorDisplay}
            </div>
            <button
              onClick={() => removeComponent(activeStatementIndex, index, "operator")}
              className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <X className="w-3 h-3" />
            </button>
          </div>,
        )
      }

      // Show timeframe for inp2 if it exists. Editable, same as inp1.
      if (
        condition.inp2 &&
        typeof condition.inp2 === "object" &&
        "timeframe" in condition.inp2 &&
        condition.inp2.timeframe
      ) {
        components.push(
          <div key={`inp2-timeframe-${index}`} className="mr-2 mb-2 relative group">
            <div className="text-xs text-gray-400 mb-1">Timeframe</div>
            <button
              onClick={() => openTimeframeDropdown(activeStatementIndex, index, "inp2")}
              onMouseEnter={(e) => handleMouseEnter(e, condition, "timeframe", index)}
              onMouseLeave={handleMouseLeave}
              className="bg-[#151718] text-white px-3 py-2 rounded-md flex items-center justify-between min-w-[160px] border border-[#2A2D42] transition-all duration-200 hover:border-[#4A4D62]"
              data-inp2-timeframe-index={index}
            >
              <span className="text-gray-400">{condition.inp2.timeframe}</span>
              <ChevronDown className="ml-1 w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                // Remove only inp2's timeframe (keeps inp1's tf untouched).
                const newStatements = [...statements]
                const currentStatement = newStatements[activeStatementIndex]
                const cond = currentStatement.strategy[index]
                if (cond.inp2 && typeof cond.inp2 === "object" && "timeframe" in cond.inp2) {
                  delete (cond.inp2 as any).timeframe
                }
                setStatements(newStatements)
              }}
              className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              title="Clear inp2 timeframe"
            >
              <X className="w-3 h-3" />
            </button>
          </div>,
        )
      }

      // Show inp2 value for all behaviors (except moving_up/down which includes the value in operator)
      const isMovingOperator = condition.operator_name === "moving_up" || condition.operator_name === "moving_down"
      if (condition.inp2 && !isMovingOperator) {
        // Values with light gray background
        if ("type" in condition.inp2) {
          if (condition.inp2.type === "value") {
            const isEditablePips =
              condition.operator_name === "atmost_above_pips" || condition.operator_name === "atmost_below_pips"

            if (isEditablePips) {
              components.push(
                <div key={`inp2-${index}`} className="flex items-center relative group">
                  <button
                    className="bg-[#C5C5C5] text-black px-3 py-2 mt-3 rounded-md mr-2 mb-2 flex items-center transition-all duration-200 hover:bg-[#D5D5D5]"
                    onClick={() =>
                      setShowPipsModal({
                        show: true,
                        statementIndex: activeStatementIndex,
                        conditionIndex: index,
                      })
                    }
                    onMouseEnter={(e) => handleMouseEnter(e, condition, "inp2", index)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <span>{condition.pips || 500}</span>
                    <span className="ml-1">points</span>
                  </button>
                  <button
                    onClick={() => removeComponent(activeStatementIndex, index, "inp2")}
                    className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>,
              )
            } else {
              // Rest of the existing code for non-editable values
              components.push(
                <div key={`inp2-${index}`} className="flex items-center relative group">
                  <div
                    className="bg-[#C5C5C5] text-black px-3 py-2 mt-3 rounded-md mr-2 mb-2 transition-all duration-200 hover:bg-[#D5D5D5] cursor-pointer"
                    onMouseEnter={(e) => handleMouseEnter(e, condition, "inp2", index)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleComponentClick(activeStatementIndex, index, "inp2")}
                  >
                    {condition.inp2.value}
                  </div>
                  <button
                    onClick={() => removeComponent(activeStatementIndex, index, "inp2")}
                    className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>,
              )
            }
          } else if (condition.inp2.type === "C" && "input" in condition.inp2) {
            // Handle price indicators (type C with input like open, close, high, low)
            if (["open", "close", "high", "low"].includes(condition.inp2.input?.toLowerCase() || "")) {
              const priceType = condition.inp2.input?.charAt(0).toUpperCase() + condition.inp2.input?.slice(1)
              const displayName = `Price ${priceType}`

              components.push(
                <div key={`inp2-${index}`} className="flex items-center relative group">
                  <div
                    className="bg-[#C5C5C5] text-black px-3 py-2 mt-3 rounded-md mr-2 mb-2 transition-all duration-200 hover:bg-[#D5D5D5] cursor-pointer"
                    onMouseEnter={(e) => handleMouseEnter(e, condition, "inp2", index)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleComponentClick(activeStatementIndex, index, "inp2")}
                  >
                    {displayName}
                  </div>
                  <button
                    onClick={() => removeComponent(activeStatementIndex, index, "inp2")}
                    className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>,
              )
            } else {
              const priceType = condition.inp2.input?.charAt(0).toUpperCase() + condition.inp2.input?.slice(1)

              components.push(
                <div key={`inp2-${index}`} className="flex items-center relative group">
                  <div
                    className="bg-[#C5C5C5] text-black px-3 py-2 mt-3 rounded-md mr-2 mb-2 transition-all duration-200 hover:bg-[#D5D5D5] cursor-pointer"
                    onMouseEnter={(e) => handleMouseEnter(e, condition, "inp2", index)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleComponentClick(activeStatementIndex, index, "inp2")}
                  >
                    {priceType}
                  </div>
                  <button
                    onClick={() => removeComponent(activeStatementIndex, index, "inp2")}
                    className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>,
              )
            }
          } else if (condition.inp2.type === "CUSTOM_I" && "name" in condition.inp2) {
            // Handle CUSTOM_I indicators like RSI_MA, Volume_MA, etc.
            const displayName = condition.inp2.name

            components.push(
              <div key={`inp2-${index}`} className="flex items-center relative group">
                <div
                  className="bg-[#C5C5C5] text-black px-3 py-2 mt-3 rounded-md mr-2 mb-2 transition-all duration-200 hover:bg-[#D5D5D5] cursor-pointer"
                  onMouseEnter={(e) => handleMouseEnter(e, condition, "inp2", index)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleComponentClick(activeStatementIndex, index, "inp2")}
                >
                  {displayName}
                </div>
                <button
                  onClick={() => removeComponent(activeStatementIndex, index, "inp2")}
                  className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>,
            )
          } else if (condition.inp2.type === "I" && "name" in condition.inp2) {
            // Handle regular indicators like RSI, BBANDS, etc.
            // Always show "Bollinger" for BBANDS, not "BBANDS" or the input value
            // Check by name or by type+input combination to catch all cases
            const displayName =
              condition.inp2.name === "BBANDS" ||
                (condition.inp2.input && ["upperband", "lowerband", "middleband"].includes(condition.inp2.input?.toLowerCase()))
                ? "Bollinger"
                : condition.inp2.name

            components.push(
              <div key={`inp2-${index}`} className="flex items-center relative group">
                <div
                  className="bg-[#C5C5C5] text-black px-3 py-2 mt-3 rounded-md mr-2 mb-2 transition-all duration-200 hover:bg-[#D5D5D5] cursor-pointer"
                  onMouseEnter={(e) => handleMouseEnter(e, condition, "inp2", index)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleComponentClick(activeStatementIndex, index, "inp2")}
                >
                  {displayName}
                </div>
                <button
                  onClick={() => removeComponent(activeStatementIndex, index, "inp2")}
                  className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>,
            )
          }
        } else if ("name" in condition.inp2) {
          // Handle cases where inp2 has a name property but no type
          // Always show "Bollinger" for BBANDS, not "BBANDS" or the input value
          // Check by name or by input value to catch all cases
          let displayName =
            condition.inp2.name === "BBANDS" ||
              (condition.inp2.input && ["upperband", "lowerband", "middleband"].includes(condition.inp2.input?.toLowerCase()))
              ? "Bollinger"
              : condition.inp2.name
          if (condition.inp2.Derivative) {
            displayName = `${displayName} (Derivative)`
          }

          components.push(
            <div key={`inp2-${index}`} className="flex items-center relative group">
              <div
                className="bg-[#C5C5C5] text-black px-3 py-2 mt-3 rounded-md mr-2 mb-2 transition-all duration-200 hover:bg-[#D5D5D5] cursor-pointer"
                onClick={() => handleComponentClick(activeStatementIndex, index, "inp2")}
              >
                {displayName}
              </div>
              <button
                onClick={() => removeComponent(activeStatementIndex, index, "inp2")}
                className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <X className="w-3 h-3" />
              </button>
            </div>,
          )
        }
      }

      // Add wait button for inp2 if inp2 exists
      if (condition.inp2 && typeof condition.inp2 === "object" && "type" in condition.inp2) {
        components.push(
          <div key={`wait-inp2-${index}`} className="mr-2 mb-2">
            <button
              onClick={() => toggleWaitParameter(activeStatementIndex, index, "inp2")}
              className={`px-2 py-1 text-xs rounded-md transition-all duration-200 ${condition.inp2 && "wait" in condition.inp2 && condition.inp2.wait === "yes"
                ? "bg-[#85e1fe] text-black"
                : "bg-[#2A2D42] text-white hover:bg-[#3A3D47]"
                }`}
            >
              Wait
            </button>
          </div>,
        )
      }

      // Render At Candle for inp2 if it has index
      if (condition.inp2 && typeof condition.inp2 === "object" && condition.inp2.index !== undefined) {
        const candleNumber = Math.abs(condition.inp2.index || 1)

        components.push(
          <div key={`at-candle-inp2-${index}`} className="mr-2 mb-2 relative group">
            <div className="text-xs text-gray-400 mb-1">At Candle (inp2)</div>
            <button
              onClick={() => openAtCandleModal(activeStatementIndex, index, "inp2")}
              className="bg-[#151718] text-white px-3 py-2 rounded-md flex items-center justify-between min-w-[160px] border border-[#2A2D42]"
              data-candle-index={index}
            >
              <span className="text-gray-400">Candle -{candleNumber}</span>
              <ChevronDown className="ml-1 w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const newStatements = [...statements]
                const currentStatement = newStatements[activeStatementIndex]
                const condition = currentStatement.strategy[index]
                if (condition.inp2 && typeof condition.inp2 === "object") {
                  delete condition.inp2.index
                }
                setStatements(newStatements)
                setSelectedCandleNumber(null)
              }}
              className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <X className="w-3 h-3" />
            </button>
          </div>,
        )
      }

      // Show accumulator if it exists
      if (condition.Accumulate) {
        components.push(
          <div key={`accumulator-${index}`} className="flex items-center relative group">
            <div
              className="bg-[#C5C5C5] text-black px-3 py-2 mt-3 rounded-md mr-2 mb-2 transition-all duration-200 hover:bg-[#D5D5D5] cursor-pointer"
              onClick={() => handleComponentClick(activeStatementIndex, index, "accumulate")}
              onMouseEnter={(e) => handleMouseEnter(e, condition, "accumulate", index)}
              onMouseLeave={handleMouseLeave}
            >
              {`Accumulate${condition.Accumulate.forPeriod ? `: ${condition.Accumulate.forPeriod}` : ""}`}
            </div>
            <button
              onClick={() => {
                const newStatements = [...statements]
                const currentStatement = newStatements[activeStatementIndex]
                delete currentStatement.strategy[index].Accumulate
                setStatements(newStatements)
              }}
              className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <X className="w-3 h-3" />
            </button>
          </div>,
        )
      }

      // Show then if it exists
      if (condition.Then) {
        components.push(
          <div key={`then-${index}`} className="flex items-center relative group">
            <div
              className="bg-[#C5C5C5] text-black px-3 py-2 mt-3 rounded-md mr-2 mb-2 transition-all duration-200 hover:bg-[#D5D5D5] cursor-pointer"
              onMouseEnter={(e) => handleMouseEnter(e, condition, "then", index)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleComponentClick(activeStatementIndex, index, "then")}
            >
              Then
            </div>
            <button
              onClick={() => {
                const newStatements = [...statements]
                const currentStatement = newStatements[activeStatementIndex]
                delete currentStatement.strategy[index].Then
                setStatements(newStatements)
              }}
              className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <X className="w-3 h-3" />
            </button>
          </div>,
        )
      }
    })

    // Inline rendering for ALL Equity (trade-management) rules. They live in
    // the same statement node flow as conditions/actions — no separate footer
    // block. Click routes to the correct modal/editor based on rule shape.
    if (statement.Equity && statement.Equity.length > 0) {
      statement.Equity.forEach((rule, equityIndex) => {
        const operator = rule.operator || ""
        const isSL = operator.includes("SL") || (rule.inp1 && "name" in rule.inp1 && rule.inp1.name === "SL")
        const isTP = operator.includes("TP") || (rule.inp1 && "name" in rule.inp1 && rule.inp1.name === "TP")
        const isManageExitNew = isManageExitPartialTpShape(rule)
        const isPartialTP = !!(rule.inp1 && rule.inp1.name === "partial_tp" && rule.inp1.partial_tp_list) && !isManageExitNew
        const isManageExitLegacy = !!(rule.inp1 && rule.inp1.name === "manage_exit" && (rule.inp1 as any).manage_exit_list)
        const isManageExit = isManageExitNew || isManageExitLegacy
        const customTm = (rule as any).trade_management

        let label = ""
        let onClickHandler: () => void = () => handleEquityRuleClick(activeStatementIndex, equityIndex, rule)
        let tooltipBuilder: (() => Record<string, string>) | null = null
        let tooltipTitle = ""

        if (isSL || isTP) {
          label = pipsToPointsDisplay(rule.operator || (isSL ? "SL" : "TP"))
        } else if (isPartialTP) {
          label = `Partial TP (${rule.inp1?.partial_tp_list?.length || 0})`
          onClickHandler = () => {
            setEditingEquityRule({ statementIndex: activeStatementIndex, equityIndex })
            setShowPartialTPModal(true)
          }
          tooltipTitle = "Partial TP list"
          tooltipBuilder = () => {
            const details: Record<string, string> = {}
            rule.inp1?.partial_tp_list?.forEach((lvl, i) => {
              details[`Level ${i + 1}`] = `${pipsToPointsDisplay(lvl.Price || "")} | Close: ${lvl.Close}${lvl.Action ? ` | Action: ${pipsToPointsDisplay(lvl.Action)}` : ""}`
            })
            return details
          }
        } else if (isManageExit) {
          const count = isManageExitNew
            ? (rule.inp1?.partial_tp_list?.length || 0)
            : ((rule.inp1 as any)?.manage_exit_list?.length || 0)
          label = `Manage Exit (${count})`
          onClickHandler = () => {
            setEditingEquityRule({ statementIndex: activeStatementIndex, equityIndex })
            setShowManageExitModal(true)
          }
          tooltipTitle = "Manage Exit"
          tooltipBuilder = () => {
            const details: Record<string, string> = {}
            if (isManageExitNew && rule.inp1?.partial_tp_list) {
              rule.inp1.partial_tp_list.forEach((lvl, i) => {
                details[`Rule ${i + 1}`] = `${pipsToPointsDisplay(lvl.Price || "")} | Closes 100%`
              })
            } else if (isManageExitLegacy) {
              const list = (rule.inp1 as any).manage_exit_list as Array<{ Price: string; Action: string }>
              list.forEach((it, i) => {
                details[`Rule ${i + 1}`] = `${pipsToPointsDisplay(it.Price)} | ${pipsToPointsDisplay(it.Action)}`
              })
            }
            return details
          }
        } else if (customTm && customTm.type === "CUSTOM_TM") {
          label = customTm.name || "Custom TM"
          tooltipTitle = customTm.name || "Custom Trade Management"
          tooltipBuilder = () => {
            const details: Record<string, string> = {}
            const params = customTm.params || {}
            Object.entries(params).forEach(([k, v]) => {
              details[k] = String(v)
            })
            return details
          }
        } else {
          // Fallback for any other equity-rule shape (e.g. operator-only rules).
          label = pipsToPointsDisplay(rule.operator || "Equity Rule")
        }

        components.push(
          <div key={`equity-inline-${equityIndex}`} className="flex items-center relative group">
            <div
              className="bg-[#C5C5C5] text-black px-3 py-2 mt-3 rounded-md mr-2 mb-2 transition-all duration-200 hover:bg-[#D5D5D5] cursor-pointer"
              onClick={onClickHandler}
              onMouseEnter={tooltipBuilder ? (e) => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                setHoveredComponent({
                  show: true,
                  content: { title: tooltipTitle, details: tooltipBuilder!() },
                  position: { x: rect.left + rect.width / 2, y: rect.top - 3 },
                })
              } : undefined}
              onMouseLeave={tooltipBuilder ? handleMouseLeave : undefined}
            >
              {label}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                removeEquityRule(activeStatementIndex, equityIndex)
              }}
              className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <X className="w-3 h-3" />
            </button>
          </div>,
        )

        // Wait button after each equity rule for visual consistency
        components.push(
          <div key={`wait-equity-${equityIndex}`} className="mr-2 mb-2">
            <button className="bg-[#2A2D42] text-white px-2 py-1 text-xs rounded-md hover:bg-[#3A3D47] transition-all duration-200">
              Wait
            </button>
          </div>,
        )
      })
    }

    // Render Trading Session component at the end if it exists
    if (statement.TradingSession) {
      const session = statement.TradingSession
      components.push(
        <div key="trading-session-component" className="mr-2 mb-2 relative group">
          <div className="text-xs text-gray-400 mb-1">Trading Session</div>
          <div
            className="bg-[#151718] text-white px-3 py-2 rounded-md flex items-center justify-between min-w-[160px] cursor-pointer transition-all duration-200 hover:bg-[#252728]"
            onClick={() => setShowTradingSessionModal(true)}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              setHoveredComponent({
                show: true,
                content: {
                  title: "Trading Session",
                  details: {
                    Timezone: session.Timezone,
                    Days: session.Day.input,
                    "Start Time": session.Time.input[0],
                    "End Time": session.Time.input[1],
                  },
                },
                position: {
                  x: rect.left + rect.width / 2,
                  y: rect.top - 3,
                },
              })
            }}
            onMouseLeave={handleMouseLeave}
          >
            <span className="text-gray-300">{session.Time.input.join(' - ')}</span>
            <ChevronDown className="ml-1 w-4 h-4" />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              const newStatements = [...statements]
              const currentStatement = newStatements[activeStatementIndex]
              delete currentStatement.TradingSession
              setStatements(newStatements)
            }}
            className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <X className="w-3 h-3" />
          </button>
        </div>,
      )
    }

    // Max Trade Duration is a strategy-wide cap (stored on
    // statements[0].TradingType.Max_Duration) and applies to every statement,
    // so it renders once below all statements rather than inside any single
    // statement's tree. See the chip rendered next to the Add-statement
    // button below the statements map.

    return components.reduce((acc: JSX.Element[], component, idx) => {
      const currentCursorPos = getCursorPosition(statementIndex)
      
      // Add cursor indicator before this component if cursor is at this position
      if (currentCursorPos === idx) {
        acc.push(
          <div 
            key={`cursor-${idx}`} 
            className="w-0.5 h-5 bg-[#85e1fe] animate-pulse mx-0.5"
            style={{ alignSelf: 'flex-end', marginBottom: '0.5rem' }}
          />
        )
      }
      
      // Add clickable gap before component to position cursor.
      // Wider hit area + a thin blue bar on hover so users can discover that
      // they can click between components to reposition the caret.
      acc.push(
        <div
          key={`gap-${idx}`}
          className="group flex items-center justify-center w-2 self-stretch cursor-text"
          onClick={() => {
            setCursorPosition(prev => ({ ...prev, [statementIndex]: idx }))
            searchInputRefs.current[statementIndex]?.focus()
          }}
        >
          <div className="w-0.5 h-5 rounded-full bg-transparent group-hover:bg-[#85e1fe]/70 transition-colors" />
        </div>
      )
      
      // Add the actual component
      acc.push(component)
      
      // Add cursor indicator after last component if cursor is at end
      if (idx === components.length - 1 && currentCursorPos === -1) {
        acc.push(
          <div 
            key="cursor-end" 
            className="w-0.5 h-5 bg-[#85e1fe] animate-pulse mx-0.5"
            style={{ alignSelf: 'flex-end', marginBottom: '0.5rem' }}
          />
        )
      }
      
      return acc
    }, [] as JSX.Element[])
  }

  // Function to render equity rules
  // Display pips as points without conversion (show exact value)
  const pipsToPointsDisplay = (text: string): string => {
    return text.replace(/(\d+)pips/g, (match, num) => {
      return `${num}points`
    })
  }

  // Function to handle equity rule click for editing
  const handleEquityRuleClick = (statementIndex: number, equityIndex: number, rule: EquityRule) => {
    // Custom Trade-Management blocks reuse the properties dialog so the user
    // can re-edit the params they originally set.
    const tm = (rule as any).trade_management
    if (tm && tm.type === "CUSTOM_TM") {
      openCustomBlockEditor(statementIndex, equityIndex, "trade_management", tm, equityIndex)
      return
    }

    // Determine if this is SL or TP
    const operator = rule.operator || ""
    const isSL = operator.includes("SL") || (rule.inp1 && "name" in rule.inp1 && rule.inp1.name === "SL")
    const isTP = operator.includes("TP") || (rule.inp1 && "name" in rule.inp1 && rule.inp1.name === "TP")

    if (!isSL && !isTP) return

    // Set editing state
    setEditingEquityRule({ statementIndex, equityIndex })

    // Open the appropriate modal
    setShowSLTPSettings({ show: true, type: isSL ? "SL" : "TP" })
  }

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleDeleteStatement = (index: number) => {
    // If there's only one statement, navigate to home
    if (statements.length === 1) {
      router.push("/home")
    } else {
      // Otherwise, remove just this statement
      const newStatements = [...statements]
      newStatements.splice(index, 1)
      setStatements(newStatements)

      // If we're deleting the active statement, set a new active statement
      if (activeStatementIndex === index) {
        setActiveStatementIndex(Math.max(0, index - 1))
      } else if (activeStatementIndex > index) {
        // If we're deleting a statement before the active one, adjust the index
        setActiveStatementIndex(activeStatementIndex - 1)
      }

      setIsDropdownOpen(false)
    }
  }

  // Legacy state for custom indicator modal (kept for backward compatibility)
  const [pendingCustomIndicator, setPendingCustomIndicator] = useState<any>(null)

  // Track wait status for each input (inp1 and inp2) separately
  // Derive the per-statement Wait inp1 / Wait inp2 badge state directly from
  // `statements` so undo/redo updates the badges automatically. Previously this
  // was parallel state, which the history hook didn't track — so undoing the
  // toggle left the badge stuck on screen.
  const waitStatus = useMemo<Record<number, { inp1: boolean; inp2: boolean }>>(() => {
    const result: Record<number, { inp1: boolean; inp2: boolean }> = {}
    statements.forEach((statement, statementIndex) => {
      let inp1 = false
      let inp2 = false
      statement.strategy.forEach(condition => {
        if (
          condition.inp1 &&
          typeof condition.inp1 === "object" &&
          "wait" in condition.inp1 &&
          (condition.inp1 as any).wait === "yes"
        ) {
          inp1 = true
        }
        if (
          condition.inp2 &&
          typeof condition.inp2 === "object" &&
          "wait" in condition.inp2 &&
          (condition.inp2 as any).wait === "yes"
        ) {
          inp2 = true
        }
      })
      result[statementIndex] = { inp1, inp2 }
    })
    return result
  }, [statements])

  // Add state to store the latest RSI MA settings.
  // bb_stddev is no longer collected — it was only consumed by the engine
  // when ma_type == "Bollinger Bands", which is no longer in MA_TYPES.
  const [rsiMaSettings, setRsiMaSettings] = useState({
    rsi_length: 14,
    rsi_source: "Close",
    ma_type: "SMA",
    ma_length: 14,
  })

  // Add state for indicator modal at the parent level
  const [showIndicatorModal, setShowIndicatorModal] = useState(false)
  const [pendingOtherIndicator, setPendingOtherIndicator] = useState<string | null>(null)
  const [pendingTimeframe, setPendingTimeframe] = useState<string>("3h")
  const [pendingVolumeIndicatorType, setPendingVolumeIndicatorType] = useState<"volume" | "volume-ma" | null>(null)

  // Utility function to ensure Volume_MA only gets ma_length parameter
  // Volume_MA should NEVER have ma_type, bb_stddev, or any other parameters
  const createVolumeMAIndicator = (timeframe: string, maLength: number) => {
    // Get saved Volume settings as fallback
    const savedVolumeSettings = getSavedVolumeSettings();
    const finalMaLength = maLength || savedVolumeSettings?.maLength || 20;

    return {
      type: "CUSTOM_I" as const,
      name: "Volume_MA" as const,
      timeframe,
      input_params: {
        ma_length: finalMaLength,
      },
    }
  }

  // Utility function to get saved Volume settings from localStorage
  const getSavedVolumeSettings = () => {
    try {
      const savedVolumeSettings = localStorage.getItem('volumeSettings');
      if (savedVolumeSettings) {
        const parsedSettings = JSON.parse(savedVolumeSettings);
        console.log('🔍 DEBUG: Retrieved saved Volume settings:', parsedSettings);
        return parsedSettings;
      }
    } catch (error) {
      console.log('Error reading saved Volume settings:', error);
    }
    return null;
  }

  // Helper to normalize the flat strategy array for the backend
  const getNormalizedStrategy = (strategyStatements: any[]) => {
    return strategyStatements.reduce((acc: any[], s: any) => {
      // Return ONLY strategy rules (indicators/conditions), excluding equity rules
      return acc.concat(s.strategy || []);
    }, []);
  };

  // Utility function to clean up Volume_MA indicators that have extra parameters
  const cleanupVolumeMAIndicator = (indicator: any) => {
    if (indicator && indicator.name === "Volume MA" && indicator.input_params) {
      // Get saved Volume settings as fallback
      const savedVolumeSettings = getSavedVolumeSettings();
      const finalMaLength = indicator.input_params.ma_length || savedVolumeSettings?.maLength || 20;

      return {
        ...indicator,
        input_params: {
          ma_length: finalMaLength,
        },
      }
    }
    return indicator
  }

  // Unified builder to generate one of three backend-compatible JSON formats
  const buildUnifiedPayload = (name: string) => {
    // Helper to transform flat offset state to backend-expected nested format
    const transformOffset = (condition: any) => {
      if (!condition.offset) return condition

      const { logical_operator, value, unit } = condition.offset
      if (!logical_operator && value === 0 && !unit) {
        const { offset, ...rest } = condition
        return rest
      }

      const params: any = {
        logical_operator: logical_operator || ">=",
        value: value || 0,
        unit: unit || "",
      }

      // Add boolean flag based on unit
      if (unit === "%") {
        params["%"] = true
      } else if (unit === "points") {
        params["points"] = true
      }

      const { offset, ...rest } = condition
      const transformed = {
        ...rest,
        operator: {
          params
        }
      }

      return transformed
    }

    // 1. Prepare all statements with cleanup
    const allStatementsRaw = statements.map((s, i) => ({
      name: s.saveresult || `Statement ${i + 1}`,
      side: s.side || "B",
      strategy: s.strategy.map((condition: any) => {
        const cleaned: any = {
          ...condition,
          inp1: cleanupVolumeMAIndicator(condition.inp1),
          inp2: cleanupVolumeMAIndicator(condition.inp2),
        }
        // Engine contract: moving_up / moving_down are unary — they read inp1
        // only. Drop any stale inp2 (e.g. left over from switching from a
        // binary operator) so the JSON matches the contract regardless of
        // whichever UI path produced this condition.
        if (cleaned.operator_name === "moving_up" || cleaned.operator_name === "moving_down") {
          delete cleaned.inp2
        }
        return transformOffset(cleaned)
      }),
      Equity: s.Equity || [],
      ...(s.TradingSession && { TradingSession: s.TradingSession }),
    }))

    // 2. All statements are preserved to maintain user order and names
    const signalStatements = allStatementsRaw.filter(s =>
      s.strategy && s.strategy.length > 0 &&
      s.strategy.some((cond: any) => cond.inp1 || cond.operator_name)
    )

    const globalStatements = allStatementsRaw.filter(s =>
      (!s.strategy || s.strategy.length === 0 || !s.strategy.some((cond: any) => cond.inp1 || cond.operator_name)) &&
      s.Equity && s.Equity.length > 0
    )

    // 3. Determine Format
    const isSingleStatement = signalStatements.length === 1 && globalStatements.length === 0
    const hasGlobalEquity = globalStatements.length > 0
    const topLevelEquity = globalStatements.reduce((acc: any[], s: any) => acc.concat(s.Equity || []), [])

    // 4. Global parameters (TradingType)
    const firstStatement = statements[0]
    const nTradeMax = signalStatements.length || 1
    const globalTradingType = {
      ...(firstStatement.TradingType || {
        NewTrade: "MTOOTAAT",
        commission: 0.00007,
        margin: 1,
        lot: "mini",
        cash: 100000,
      }),
      nTrade_max: nTradeMax,
    }

    const basePayload: any = {
      name: name,
      saveresult: name,
      instrument: initialInstrument,
      side: signalStatements.length > 0 ? signalStatements[0].side : (allStatementsRaw[0]?.side || "B"),
      TradingType: globalTradingType,
      ...(strategyData?.df_pickle_path && { df_pickle_path: strategyData.df_pickle_path }),
      entry_at: tradeTiming.entry_at,
      exit_at: tradeTiming.exit_at,
      ...((tradeTiming.entry_at === "tick" || tradeTiming.exit_at === "tick") && tradeTiming.execution_timeframe
        ? { execution_timeframe: tradeTiming.execution_timeframe }
        : {}),
    }

    if (isSingleStatement) {
      // FORMAT 1: Single Statement
      const s = signalStatements[0]
      return {
        ...basePayload,
        saveresult: s.name, // Preserve the statement's logical name (e.g. "Statement 1")
        strategy: s.strategy,
        Equity: s.Equity,
      }
    } else if (hasGlobalEquity) {
      // FORMAT 3: Multi-Statement Shared (at least one global exit block)
      return {
        ...basePayload,
        strategy: [], // Explicitly clear root strategy to avoid leftover data
        statements: signalStatements.map(s => {
          const stmt: any = {
            name: s.name,
            side: s.side,
            strategy: s.strategy.filter((cond: any) => cond.inp1 || cond.operator_name || cond.statement),
          }
          // FALLBACK: Omit Equity if empty so backend uses root-level Equity
          if (s.Equity && s.Equity.length > 0) {
            stmt.Equity = s.Equity
          }
          return stmt
        }),
        Equity: topLevelEquity,
      }
    } else {
      // FORMAT 2: Multi-Statement Independent
      return {
        ...basePayload,
        strategy: [], // Explicitly clear root strategy
        // editStrategy uses PATCH, so omitted fields persist server-side.
        // FORMAT 2 owns equity per-statement; force the root Equity to [] so
        // any stale rules from earlier single-statement saves are cleared.
        Equity: [],
        statements: signalStatements.map(s => ({
          name: s.name,
          side: s.side,
          strategy: s.strategy.filter((cond: any) => cond.inp1 || cond.operator_name || cond.statement),
          Equity: s.Equity
        }))
      }
    }
  }

  // Clean up any existing Volume_MA indicators and load initial data
  useEffect(() => {
    if (strategyData) {
      if (strategyData.statements && strategyData.statements.length > 0) {
        // Multi-statement format
        const cleanedStatements = strategyData.statements.map((s: any) => ({
          ...s,
          strategy: (s.strategy || []).map((condition: any) => ({
            ...condition,
            inp1: cleanupVolumeMAIndicator(condition.inp1),
            inp2: cleanupVolumeMAIndicator(condition.inp2),
          })),
          Equity: s.Equity || []
        }))

        // Synthesize a "Global Exit Block" virtual statement from root-level
        // Equity only when there's at most one real statement. With 2+ real
        // statements the user owns equity per-statement; adding a virtual row
        // here surfaces as a stray third statement (and historically picked up
        // duplicates accumulated by older save bugs).
        if (
          strategyData.Equity &&
          strategyData.Equity.length > 0 &&
          cleanedStatements.length < 2
        ) {
          // Check if this equity is already represented in any statement
          const isAlreadyRepresented = cleanedStatements.some((ps: any) =>
            JSON.stringify(ps.Equity) === JSON.stringify(strategyData.Equity) && (ps.strategy || []).length === 0
          )

          if (!isAlreadyRepresented) {
            cleanedStatements.push({
              name: `Statement ${cleanedStatements.length + 1}`,
              side: "",
              strategy: [],
              Equity: strategyData.Equity,
              TradingType: strategyData.TradingType // Keep global trading type settings
            })
          }
        }

        setStatements(cleanedStatements)
      } else if (strategyData.strategy) {
        // Single-statement format (root strategy/Equity)
        const cleanedStatements = [{
          ...strategyData,
          strategy: strategyData.strategy.map((condition: any) => ({
            ...condition,
            inp1: cleanupVolumeMAIndicator(condition.inp1),
            inp2: cleanupVolumeMAIndicator(condition.inp2),
          })),
          Equity: strategyData.Equity || []
        }]
        setStatements(cleanedStatements)
      }

      // Rehydrate trade-execution-timing fields from saved strategy.
      // Backend may strip unknown fields, so fall back to a per-strategy localStorage entry.
      const readTiming = (src: any): TradeTimingSettings | null => {
        if (!src || typeof src !== "object") return null
        const e = src.entry_at
        const x = src.exit_at
        if ((e === "bar close" || e === "tick") && (x === "bar close" || x === "tick")) {
          const out: TradeTimingSettings = { entry_at: e, exit_at: x }
          if ((e === "tick" || x === "tick") && typeof src.execution_timeframe === "string") {
            out.execution_timeframe = src.execution_timeframe
          }
          return out
        }
        return null
      }

      let resolvedTiming: TradeTimingSettings | null = readTiming(strategyData)
      if (!resolvedTiming) {
        try {
          const sid =
            (typeof strategyId === "string" && strategyId) ||
            (typeof window !== "undefined" ? localStorage.getItem("strategy_id") : "") ||
            ""
          if (sid && typeof window !== "undefined") {
            const raw = localStorage.getItem(`trade_timing_${sid}`)
            if (raw) resolvedTiming = readTiming(JSON.parse(raw))
          }
        } catch { }
      }
      if (resolvedTiming) {
        setTradeTiming(resolvedTiming)
      }
    }
  }, [strategyData])

  // Add this state near other useState hooks
  const [pendingBollingerForInp2, setPendingBollingerForInp2] = useState<null | { statementIndex: number; conditionIndex: number; timeframe: string }>(null);
  const [stochasticModalTarget, setStochasticModalTarget] = useState<{
    statementIndex: number
    conditionIndex: number
    inputType: "inp1" | "inp2"
    timeframeOverride?: string
  } | null>(null)
  const [atrModalTarget, setAtrModalTarget] = useState<{
    statementIndex: number
    conditionIndex: number
    inputType: "inp1" | "inp2"
    timeframeOverride?: string
  } | null>(null)
  const [showEditNameModal, setShowEditNameModal] = useState(false)

  return (
    <TooltipProvider>
      <div className="flex-1 flex flex-col">
        {/* Main content area with scrolling */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-medium">
                {strategyName || (persistedId
                  ? (initialInstrument || persistedId)
                  : `Building algorithm for ${initialInstrument || "XAU/USD"}`)}
              </h1>
              {persistedId && (
                <button
                  onClick={() => setShowEditNameModal(true)}
                  className="ml-2 p-1 hover:bg-gray-700 rounded-full"
                  title="Edit strategy name"
                >
                  <Edit className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="flex gap-3">
              {/* Buy/Sell selector */}
              <button
                onClick={() => setShowDeveloperModeModal(true)}
                className="px-4 py-2 bg-[#151718] rounded-full text-white hover:bg-gray-700 flex items-center gap-2"
              >
                <Code className="w-4 h-4" />
                Developer Mode
              </button>
              <button
                onClick={undoStatements}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                className="px-3 py-2 bg-[#151718] rounded-full text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={redoStatements}
                disabled={!canRedo}
                title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
                className="px-3 py-2 bg-[#151718] rounded-full text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center"
              >
                <Redo2 className="w-4 h-4" />
              </button>
              <button className="px-4 py-2 bg-[#151718] rounded-full text-white hover:bg-gray-700">Add Setup</button>
              <button className="px-4 py-2 bg-[#151718] rounded-full text-white hover:bg-gray-700" onClick={addStatement}>
                Add Statement
              </button>
            </div>
          </div>

          {/* Statements */}
          <div className="space-y-6">
            {statements.map((statement, index) => (
              <div
                key={index}
                className="bg-[#151718] rounded-lg p-4"
                data-active-statement={activeStatementIndex === index}
                data-active-index={index}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-medium">{statement.saveresult || statement.name || `Statement ${index + 1}`}</h2>
                  </div>
                  <div className="relative flex items-center gap-4">
                    {/* Wait for closes only indicators - show for inp1 and inp2 separately */}
                    {(waitStatus[index]?.inp1 || waitStatus[index]?.inp2) && (
                      <div className="flex items-center gap-4 text-sm text-gray-300">
                        {waitStatus[index]?.inp1 && (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border border-gray-300 bg-transparent flex items-center justify-center">
                              <div className="w-2 h-2 bg-gray-300"></div>
                            </div>
                            <span>Wait inp1</span>
                          </div>
                        )}
                        {waitStatus[index]?.inp2 && (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border border-gray-300 bg-transparent flex items-center justify-center">
                              <div className="w-2 h-2 bg-gray-300"></div>
                            </div>
                            <span>Wait inp2</span>
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setIsDropdownOpen(index === activeStatementIndex ? !isDropdownOpen : true)
                        setActiveStatementIndex(index)
                      }}
                      className="p-1 hover:bg-gray-700 rounded-full"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {isDropdownOpen && activeStatementIndex === index && (
                      <div className="absolute right-0 top-3 bg-[#2A2D42] rounded-lg shadow-md p-2 mt-4 z-10">
                        <button
                          className="w-full text-white p-2 hover:bg-red-600 rounded-lg"
                          onClick={() => handleDeleteStatement(index)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Strategy section */}
                <div className="bg-[#151718] p-4 rounded-lg mb-4">
                  {/* Replace the existing flex flex-col space-y-4 div with this: */}
                  <div className="flex items-center flex-wrap gap-2">
                    {renderStrategyConditions(statement, index)}

                    <div className="relative flex-1 min-w-[200px]">
                      <input
                        ref={(el) => (searchInputRefs.current[index] = el)}
                        type="text"
                        placeholder="Start typing a component name..."
                        className="w-full bg-transparent border-b border-white pb-1 outline-none focus:border-white"
                        value={activeStatementIndex === index ? searchTerm : ""}
                        onChange={(e) => handleSearchInput(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onClick={() => setActiveStatementIndex(index)}
                      />

                      {/* Search results dropdown */}
                      {activeStatementIndex === index && searchResults.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-[#2B2E38] border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                          {searchResults.map((result, idx) => (
                            <button
                              key={idx}
                              className={`w-full text-left px-4 py-2 ${idx === selectedSearchIndex ? "bg-[#4A4D62] text-white" : "hover:bg-[#3A3D47] text-white"
                                }`}
                              onClick={() => {
                                handleAddComponent(index, result)
                              }}
                            >
                              {result}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Trade-management rules render inline inside
                      renderStrategyConditions — no separate footer block. */}
                </div>
              </div>
            ))}
          </div>

          {/* Max Trade Duration — strategy-wide cap shared by every statement.
              Stored once on statements[0].TradingType.Max_Duration, so it
              renders here rather than inside any single statement's tree. */}
          {(() => {
            const dur = (statements[0]?.TradingType as any)?.Max_Duration
            if (typeof dur !== "string" || !dur || dur === "00:00:00") return null
            return (
              <div className="flex flex-wrap items-center gap-2 mt-4 px-1">
                <div className="mr-2 mb-2 relative group">
                  <div className="text-xs text-gray-400 mb-1">Max Trade Duration (all statements)</div>
                  <div
                    className="bg-[#151718] text-white px-3 py-2 rounded-md flex items-center justify-between min-w-[180px] cursor-pointer transition-all duration-200 hover:bg-[#252728]"
                    onClick={() => setShowMaxDurationModal(true)}
                    title="Auto-close trades after this duration (resolution: one check per bar). Applies to every statement."
                  >
                    <span className="text-gray-300">{dur}</span>
                    <ChevronDown className="ml-2 w-4 h-4" />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setStatements((prev) => {
                        if (prev.length === 0) return prev
                        const next = [...prev]
                        const first = { ...(next[0] as any) }
                        const tt: any = { ...(first.TradingType || {}) }
                        delete tt.Max_Duration
                        first.TradingType = tt
                        next[0] = first
                        return next
                      })
                    }}
                    className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    title="Clear Max Trade Duration"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )
          })()}

          {/* Add statement button */}
          <div className="flex justify-center mt-6">
            <button onClick={addStatement} className="p-3 rounded-full bg-[#151718] hover:bg-gray-700">
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>
        {/* Fixed bottom buttons */}
        <div className="flex justify-between p-6 bg-[#141721] sticky bottom-0 border-t border-gray-800">
          <Link href="/home">
            <button className="px-8 py-3 bg-[#151718] rounded-full text-white hover:bg-gray-700">Cancel</button>
          </Link>
          <div className="flex gap-3">
            <button onClick={handleContinue} className="px-8 py-3 bg-[#151718] rounded-full text-white hover:bg-gray-700">
              Save
            </button>
            <button
              className="px-8 py-3 bg-[#85e1fe] rounded-full text-black hover:bg-[#5AB9D1]"
              onClick={handleContinue}
            >
              Continue
            </button>
          </div>
        </div>
        {/* Timeframe dropdown */}
        {showTimeframeDropdown && (
          <div className="fixed inset-0 z-50" onClick={() => setShowTimeframeDropdown(false)}>
            <div
              className="absolute bg-white rounded-md shadow-lg w-[160px] border border-[#2A2D42]"
              style={{
                top:
                  activeConditionIndex !== null
                    ? (() => {
                      const selector =
                        activeInputType === "inp2"
                          ? `[data-inp2-timeframe-index="${activeConditionIndex}"]`
                          : `[data-timeframe-index="${activeConditionIndex}"]`
                      const element = document.querySelector(selector)
                      return element ? element.getBoundingClientRect().bottom + window.scrollY + 5 : 0
                    })()
                    : 0,
                left:
                  activeConditionIndex !== null
                    ? (() => {
                      const selector =
                        activeInputType === "inp2"
                          ? `[data-inp2-timeframe-index="${activeConditionIndex}"]`
                          : `[data-timeframe-index="${activeConditionIndex}"]`
                      const element = document.querySelector(selector)
                      return element ? element.getBoundingClientRect().left + window.scrollX : 0
                    })()
                    : 0,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Scrollable area */}
              <div className="max-h-48 overflow-y-auto">
                {["15min", "20min", "30min", "45min", "1h", "3h"].map((timeframe) => (
                  <button
                    key={timeframe}
                    className={`w-full text-left px-4 py-2 text-black hover:bg-gray-100 ${selectedTimeframe === timeframe ? "bg-gray-200 font-semibold" : ""
                      }`}
                    onClick={() => handleTimeframeSelect(timeframe)}
                  >
                    {timeframe}
                  </button>
                ))}

                {customTimeframes.map((timeframe) => (
                  <button
                    key={timeframe}
                    className={`w-full text-left px-4 py-2 text-black hover:bg-gray-100 ${selectedTimeframe === timeframe ? "bg-gray-200 font-semibold" : ""
                      }`}
                    onClick={() => handleTimeframeSelect(timeframe)}
                  >
                    {timeframe}
                  </button>
                ))}
              </div>

              {/* Divider and Add Custom always visible */}
              <div className="border-t border-gray-200" />
              <button
                className="w-full text-left px-4 py-2 text-black hover:bg-gray-100 font-medium"
                onClick={() => handleTimeframeSelect("add-custom")}
              >
                Add Custom
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        {showCrossingUpModal && (
          <CrossingUpSettingsModal
            onClose={() => {
              setShowCrossingUpModal(false)
              setCrossingUpInitialSettings(undefined)
            }}
            currentInp1={
              statements[activeStatementIndex]?.strategy[statements[activeStatementIndex].strategy.length - 1]?.inp1
            }
            initialSettings={crossingUpInitialSettings}
            onSave={(settings) => {
              console.log('🔍 DEBUG: Strategy builder received settings:', settings);
              console.log('🔍 DEBUG: settings.indicator:', settings.indicator);
              console.log('🔍 DEBUG: settings.maType:', settings.maType);
              console.log('🔍 DEBUG: settings.volumeMaLength:', settings.volumeMaLength);

              // Update crossing up settings with the custom value
              const newStatements = [...statements]
              const currentStatement = newStatements[activeStatementIndex]
              const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

              // Update the handleCrossingUpSettings function in strategy-builder.tsx to handle Volume-MA

              // Find this section in the file where it handles the CrossingUpModal save action
              if (lastCondition.operator_name === "crossabove" || lastCondition.operator_name === "crossbelow") {
                // Update the inp2 value with the settings from the modal
                if (settings.valueType === "value" && settings.customValue) {
                  lastCondition.inp2 = {
                    type: "value",
                    value: Number(settings.customValue),
                  }
                } else if (settings.valueType === "indicator" && settings.indicator) {
                  // Handle existing indicator selection with proper JSON structure
                  if (settings.indicator === "rsi") {
                    let rsiLength = 14;
                    let rsiSource = "close";
                    if (lastCondition.inp1 && lastCondition.inp1.name === "RSI") {
                      rsiLength = lastCondition.inp1.input_params?.timeperiod || 14;
                      rsiSource = lastCondition.inp1.input_params?.source || "close";
                    } else if (lastCondition.inp1 && lastCondition.inp1.name === "RSI_MA") {
                      rsiLength = lastCondition.inp1.input_params?.rsi_length || 14;
                      rsiSource = lastCondition.inp1.input_params?.rsi_source || "close";
                    }
                    lastCondition.inp2 = {
                      type: "I",
                      name: "RSI",
                      timeframe: settings.timeframe || "3h",
                      input_params: {
                        timeperiod: rsiLength,
                        source: rsiSource,
                      },
                    };
                  } else if (settings.indicator === "rsi-ma") {
                    console.log('🔍 Received settings for RSI_MA from crossing-up modal:', settings);

                    // Get saved RSI settings from localStorage for better defaults
                    let savedRsiSettings = null;
                    try {
                      const savedSettings = localStorage.getItem('rsiSettings');
                      if (savedSettings) {
                        savedRsiSettings = JSON.parse(savedSettings);
                        console.log('🔍 Retrieved saved RSI settings for RSI_MA inp2:', savedRsiSettings);
                      }
                    } catch (error) {
                      console.log('Error reading saved RSI settings:', error);
                    }

                    // Priority order: settings from modal > saved settings > defaults
                    const finalRsiLength = settings.rsiMaLength || savedRsiSettings?.rsiLength || 14;
                    const finalRsiSource = settings.rsiSource || savedRsiSettings?.source || "Close";
                    const finalMaLength = settings.maLength || savedRsiSettings?.maLength || 14;
                    const finalMaType = settings.maType || savedRsiSettings?.maType || "SMA";
                    // bb_stddev removed — only used by "Bollinger Bands" ma_type, no longer offered.

                    console.log('🔧 Final RSI_MA inp2 values:', {
                      rsi_length: finalRsiLength,
                      rsi_source: finalRsiSource,
                      ma_length: finalMaLength,
                      ma_type: finalMaType,
                    });

                    lastCondition.inp2 = {
                      type: "CUSTOM_I",
                      name: "RSI_MA",
                      timeframe: settings.timeframe || "3h",
                      input_params: {
                        rsi_length: finalRsiLength,
                        rsi_source: finalRsiSource,
                        ma_length: finalMaLength,
                        ma_type: finalMaType,
                      },
                    }
                  } else if (settings.indicator === "volume-ma") {
                    lastCondition.inp2 = {
                      type: "CUSTOM_I",
                      name: "Volume_MA",
                      timeframe: settings.timeframe || "3h",
                      input_params: {
                        ma_length: settings.volumeMaLength || 20,
                      },
                    }
                  } else if (["open", "high", "low", "close"].includes(settings.indicator)) {
                    // Handle OHLC price indicators
                    lastCondition.inp2 = createConstantInput(settings.indicator, settings.timeframe || "3h")
                  } else if (settings.indicator === "bollinger") {
                    // Check if inp1 is BBANDS to use special format
                    if (lastCondition.inp1 && "name" in lastCondition.inp1 && lastCondition.inp1.name === "BBANDS") {
                      // For BBANDS, use type "C" with input "close" format
                      lastCondition.inp2 = createConstantInput("close", "36min")
                    } else {
                      // Default behavior for other cases
                      lastCondition.inp2 = {
                        type: "I",
                        name: "BBANDS",
                        timeframe: settings.timeframe || "3h",
                        input: settings.band || "upperband",
                        input_params: {
                          timeperiod: settings.timeperiod || 20,
                          source: settings.bbSource || "close",
                          // Add appropriate std dev parameter based on band type
                          ...(settings.band === "upperband" ? { nbdevup: settings.bbStdDev || 2.0 } : {}),
                          ...(settings.band === "lowerband" ? { nbdevdn: settings.bbStdDev || 2.0 } : {}),
                          ...(settings.band === "middleband" ? { nbdevup: 2.0, nbdevdn: 2.0 } : {}),
                        },
                      }
                    }
                  } else if (settings.indicator === "volume") {
                    lastCondition.inp2 = createConstantInput("volume", settings.timeframe || "3h")
                  } else if (settings.indicator === "atr") {
                    // Use the same settings from inp1 if it's an ATR indicator (for existing indicator selection)
                    if (lastCondition.inp1 && lastCondition.inp1.name === "ATR") {
                      const inp1Params = lastCondition.inp1.input_params || {}
                      lastCondition.inp2 = {
                        type: "CUSTOM_I",
                        name: "ATR",
                        timeframe: settings.timeframe || lastCondition.inp1.timeframe || "3h",
                        input_params: {
                          atr_length: inp1Params.atr_length || 14,
                          atr_smoothing: inp1Params.atr_smoothing || "RMA",
                        },
                      }
                    } else {
                      // Default ATR settings
                      lastCondition.inp2 = {
                        type: "CUSTOM_I",
                        name: "ATR",
                        timeframe: settings.timeframe || "3h",
                        input_params: {
                          atr_length: 14,
                          atr_smoothing: "RMA",
                        },
                      }
                    }
                  } else if (settings.indicator === "stochastic" || settings.indicator === "stochastic-oscillator" || settings.indicator === "Stochastic") {
                    // Use the same settings from inp1 if it's a Stochastic indicator (for existing indicator selection)
                    if (lastCondition.inp1 && lastCondition.inp1.name === "Stochastic") {
                      const inp1Params = lastCondition.inp1.input_params || {}
                      // Use stochasticOutput if provided (for %K/%D selection), otherwise use inp1's output
                      const outputValue = (settings as any).stochasticOutput || inp1Params.output || "slowk"
                      lastCondition.inp2 = {
                        type: "CUSTOM_I",
                        name: "Stochastic",
                        timeframe: settings.timeframe || lastCondition.inp1.timeframe || "3h",
                        input_params: {
                          fastk_period: settings.fastk_period || inp1Params.fastk_period || inp1Params.kLength || 14,
                          slowk_period: settings.slowk_period || inp1Params.slowk_period || inp1Params.kSmoothing || 3,
                          slowd_period: settings.slowd_period || inp1Params.slowd_period || inp1Params.dSmoothing || 3,
                          output: outputValue,
                        },
                      }
                    } else {
                      // Default Stochastic settings
                      lastCondition.inp2 = {
                        type: "CUSTOM_I",
                        name: "Stochastic",
                        timeframe: settings.timeframe || "3h",
                        input_params: {
                          fastk_period: settings.fastk_period || 14,
                          slowk_period: settings.slowk_period || 3,
                          slowd_period: settings.slowd_period || 3,
                          output: (settings as any).stochasticOutput || "slowk",
                        },
                      }
                    }
                  } else {
                    // For other existing indicators
                    lastCondition.inp2 = createConstantInput(settings.indicator, settings.timeframe || "3h")
                  }
                } else if (settings.valueType === "other" && settings.indicator) {
                  // Handle indicator type for "other" option
                  if (settings.indicator === "bollinger") {
                    lastCondition.inp2 = {
                      type: "I",
                      name: "BBANDS",
                      timeframe: settings.timeframe || "3h",
                      input: settings.band || "upperband",
                      input_params: {
                        timeperiod: settings.timeperiod || 20,
                        source: settings.bbSource || "close",
                        // Add appropriate std dev parameter based on band type
                        ...(settings.band === "upperband" ? { nbdevup: settings.bbStdDev || 2.0 } : {}),
                        ...(settings.band === "lowerband" ? { nbdevdn: settings.bbStdDev || 2.0 } : {}),
                        ...(settings.band === "middleband" ? { nbdevup: 2.0, nbdevdn: 2.0 } : {}),
                      },
                    }
                  } else if (settings.indicator === "rsi") {
                    lastCondition.inp2 = {
                      type: "I",
                      name: "RSI",
                      timeframe: settings.timeframe || "3h",
                      input_params: {
                        timeperiod: settings.rsiLength || 14,
                      },
                    }
                  } else if (settings.indicator === "volume-ma") {
                    lastCondition.inp2 = {
                      type: "CUSTOM_I",
                      name: "Volume_MA",
                      timeframe: settings.timeframe || "3h",
                      input_params: {
                        ma_length: settings.volumeMaLength || 20,
                      },
                    }
                  } else if (settings.indicator === "volume") {
                    lastCondition.inp2 = createConstantInput("volume", settings.timeframe || "3h")
                  } else if (settings.indicator === "atr") {
                    // Use the same settings from inp1 if it's an ATR indicator
                    if (lastCondition.inp1 && lastCondition.inp1.name === "ATR") {
                      const inp1Params = lastCondition.inp1.input_params || {}
                      lastCondition.inp2 = {
                        type: "CUSTOM_I",
                        name: "ATR",
                        timeframe: settings.timeframe || lastCondition.inp1.timeframe || "3h",
                        input_params: {
                          atr_length: inp1Params.atr_length || 14,
                          atr_smoothing: inp1Params.atr_smoothing || "RMA",
                        },
                      }
                    } else {
                      // Default ATR settings
                      lastCondition.inp2 = {
                        type: "CUSTOM_I",
                        name: "ATR",
                        timeframe: settings.timeframe || "3h",
                        input_params: {
                          atr_length: 14,
                          atr_smoothing: "RMA",
                        },
                      }
                    }
                  } else if (settings.indicator === "stochastic" || settings.indicator === "stochastic-oscillator" || settings.indicator === "Stochastic") {
                    // Use the same settings from inp1 if it's a Stochastic indicator
                    if (lastCondition.inp1 && lastCondition.inp1.name === "Stochastic") {
                      const inp1Params = lastCondition.inp1.input_params || {}
                      // Use stochasticOutput if provided (for %K/%D selection), otherwise use inp1's output
                      const outputValue = (settings as any).stochasticOutput || inp1Params.output || "slowk"
                      lastCondition.inp2 = {
                        type: "CUSTOM_I",
                        name: "Stochastic",
                        timeframe: settings.timeframe || lastCondition.inp1.timeframe || "3h",
                        input_params: {
                          fastk_period: (settings as any).fastk_period || inp1Params.fastk_period || inp1Params.kLength || 14,
                          slowk_period: (settings as any).slowk_period || inp1Params.slowk_period || inp1Params.kSmoothing || 3,
                          slowd_period: (settings as any).slowd_period || inp1Params.slowd_period || inp1Params.dSmoothing || 3,
                          output: outputValue,
                        },
                      }
                    } else {
                      // Default Stochastic settings
                      lastCondition.inp2 = {
                        type: "CUSTOM_I",
                        name: "Stochastic",
                        timeframe: settings.timeframe || "3h",
                        input_params: {
                          fastk_period: (settings as any).fastk_period || 14,
                          slowk_period: (settings as any).slowk_period || 3,
                          slowd_period: (settings as any).slowd_period || 3,
                          output: (settings as any).stochasticOutput || "slowk",
                        },
                      }
                    }
                  } else {
                    // For other indicators like price, close, open, etc.
                    lastCondition.inp2 = createConstantInput(settings.indicator, settings.timeframe || "3h")
                  }
                }

                // Save the offset configuration
                lastCondition.offset = {
                  logical_operator: (settings as any).offsetLogicalOperator || ">=",
                  value: (settings as any).offsetValue || 0,
                  unit: (settings as any).offsetUnit || ""
                }
              }

              setStatements(newStatements)
              setShowCrossingUpModal(false)
              setCrossingUpInitialSettings(undefined)
              setTimeout(() => {
                searchInputRefs.current[activeStatementIndex]?.focus()
              }, 100)
            }}
            onNext={(indicator, timeframe) => {
              setShowCrossingUpModal(false)
              setCrossingUpInitialSettings(undefined)
              setPendingOtherIndicator(indicator)
              setPendingTimeframe(timeframe)

              const conditionIndex =
                activeConditionIndex ?? (statements[activeStatementIndex]?.strategy.length ?? 1) - 1

              if (indicator === "rsi") {
                setShowIndicatorModal(true)
              } else if (indicator === "rsi-ma") {
                setShowIndicatorModal(true)
              } else if (indicator === "bollinger") {
                setPendingBollingerForInp2({
                  statementIndex: activeStatementIndex,
                  conditionIndex,
                  timeframe,
                });
                setShowBollingerModal(true);
              } else if (indicator === "stochastic" || indicator === "stochastic-oscillator" || indicator === "Stochastic") {
                openStochasticModal(activeStatementIndex, conditionIndex, "inp2", timeframe)
              } else if (indicator === "volume-ma" || indicator === "volume") {
                // Open Volume modal for volume-ma or volume indicators
                setPendingVolumeIndicatorType(indicator === "volume-ma" ? "volume-ma" : "volume")
                setShowVolumeModal(true)
              } else if (indicator === "atr") {
                // Open ATR modal for ATR indicator
                openAtrModal(activeStatementIndex, conditionIndex, "inp2", timeframe)
              } else if (indicator === "macd") {
                // Open MACD modal for MACD indicator
                setEditingComponent({
                  statementIndex: activeStatementIndex,
                  conditionIndex,
                  componentType: "inp2",
                })
                setPendingTimeframe(timeframe)
                setShowMacdModal(true)
              } else if (indicator === "supertrend") {
                // Open Super Trend modal for Super Trend indicator
                setEditingComponent({
                  statementIndex: activeStatementIndex,
                  conditionIndex,
                  componentType: "inp2",
                })
                setPendingTimeframe(timeframe)
                setShowSuperTrendModal(true)
              } else if (indicator === "ma") {
                // Open MA modal for MA indicator
                setEditingComponent({
                  statementIndex: activeStatementIndex,
                  conditionIndex,
                  componentType: "inp2",
                })
                setPendingTimeframe(timeframe)
                setShowMaModal(true)
              } else if (["close", "open", "high", "low", "price"].includes(indicator)) {
                setShowPriceSettingsModal(true)
              }
            }}
          />
        )}
        {showCrossingDownModal && (
          <CrossingDownSettingsModal
            onClose={() => setShowCrossingDownModal(false)}
            currentInp1={
              statements[activeStatementIndex]?.strategy[statements[activeStatementIndex].strategy.length - 1]?.inp1
            }
            onSave={(settings) => {
              // Update crossing down settings with the custom value
              const newStatements = [...statements]
              const currentStatement = newStatements[activeStatementIndex]
              const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

              // Update the handleCrossingDownSettings function in strategy-builder.tsx to handle Volume-MA

              // Find this section in the file where it handles the CrossingDownModal save action
              if (lastCondition.operator_name === "crossabove" || lastCondition.operator_name === "crossbelow") {
                // Update the inp2 value with the settings from the modal
                if (settings.valueType === "value" && settings.customValue) {
                  lastCondition.inp2 = {
                    type: "value",
                    value: Number(settings.customValue),
                  }
                } else if (settings.valueType === "indicator" && settings.indicator) {
                  // Handle existing indicator selection with proper JSON structure
                  if (settings.indicator === "rsi") {
                    let rsiLength = 14;
                    let rsiSource = "close";
                    if (lastCondition.inp1 && lastCondition.inp1.name === "RSI") {
                      rsiLength = lastCondition.inp1.input_params?.timeperiod || 14;
                      rsiSource = lastCondition.inp1.input_params?.source || "close";
                    } else if (lastCondition.inp1 && lastCondition.inp1.name === "RSI_MA") {
                      rsiLength = lastCondition.inp1.input_params?.rsi_length || 14;
                      rsiSource = lastCondition.inp1.input_params?.rsi_source || "close";
                    }
                    lastCondition.inp2 = {
                      type: "I",
                      name: "RSI",
                      timeframe: settings.timeframe || "3h",
                      input_params: {
                        timeperiod: rsiLength,
                        source: rsiSource,
                      },
                    };
                  } else if (settings.indicator === "rsi-ma") {
                    console.log('🔍 Received settings for RSI_MA from crossing-down modal:', settings);

                    // Get saved RSI settings from localStorage for better defaults
                    let savedRsiSettings = null;
                    try {
                      const savedSettings = localStorage.getItem('rsiSettings');
                      if (savedSettings) {
                        savedRsiSettings = JSON.parse(savedSettings);
                        console.log('🔍 Retrieved saved RSI settings for RSI_MA inp2 (crossing-down):', savedRsiSettings);
                      }
                    } catch (error) {
                      console.log('Error reading saved RSI settings:', error);
                    }

                    // Priority order: settings from modal > saved settings > defaults
                    const finalRsiLength = settings.rsiMaLength || savedRsiSettings?.rsiLength || 14;
                    const finalRsiSource = settings.rsiSource || savedRsiSettings?.source || "Close";
                    const finalMaLength = settings.maLength || savedRsiSettings?.maLength || 14;
                    const finalMaType = settings.maType || savedRsiSettings?.maType || "SMA";
                    // bb_stddev removed — only used by "Bollinger Bands" ma_type, no longer offered.

                    console.log('🔧 Final RSI_MA inp2 values (crossing-down):', {
                      rsi_length: finalRsiLength,
                      rsi_source: finalRsiSource,
                      ma_length: finalMaLength,
                      ma_type: finalMaType,
                    });

                    lastCondition.inp2 = {
                      type: "CUSTOM_I",
                      name: "RSI_MA",
                      timeframe: settings.timeframe || "3h",
                      input_params: {
                        rsi_length: finalRsiLength,
                        rsi_source: finalRsiSource,
                        ma_length: finalMaLength,
                        ma_type: finalMaType,
                      },
                    }
                  } else if (settings.indicator === "volume-ma") {
                    lastCondition.inp2 = {
                      type: "CUSTOM_I",
                      name: "Volume_MA",
                      timeframe: settings.timeframe || "3h",
                      input_params: {
                        ma_length: settings.volumeMaLength || 20,
                      },
                    }
                  } else if (["open", "high", "low", "close"].includes(settings.indicator)) {
                    // Handle OHLC price indicators
                    lastCondition.inp2 = createConstantInput(settings.indicator, settings.timeframe || "3h")
                  } else if (settings.indicator === "bollinger") {
                    // Check if inp1 is BBANDS to use special format
                    if (lastCondition.inp1 && "name" in lastCondition.inp1 && lastCondition.inp1.name === "BBANDS") {
                      // For BBANDS, use type "C" with input "close" format
                      lastCondition.inp2 = createConstantInput("close", "36min")
                    } else {
                      // Default behavior for other cases
                      lastCondition.inp2 = {
                        type: "I",
                        name: "BBANDS",
                        timeframe: settings.timeframe || "3h",
                        input: settings.band || "upperband",
                        input_params: {
                          timeperiod: settings.timeperiod || 20,
                          source: settings.bbSource || "close",
                          // Add appropriate std dev parameter based on band type
                          ...(settings.band === "upperband" ? { nbdevup: settings.bbStdDev || 2.0 } : {}),
                          ...(settings.band === "lowerband" ? { nbdevdn: settings.bbStdDev || 2.0 } : {}),
                          ...(settings.band === "middleband" ? { nbdevup: 2.0, nbdevdn: 2.0 } : {}),
                        },
                      }
                    }
                  } else if (settings.indicator === "volume") {
                    lastCondition.inp2 = createConstantInput("volume", settings.timeframe || "3h")
                  } else if (settings.indicator === "atr") {
                    // Use the same settings from inp1 if it's an ATR indicator (for existing indicator selection)
                    if (lastCondition.inp1 && lastCondition.inp1.name === "ATR") {
                      const inp1Params = lastCondition.inp1.input_params || {}
                      lastCondition.inp2 = {
                        type: "CUSTOM_I",
                        name: "ATR",
                        timeframe: settings.timeframe || lastCondition.inp1.timeframe || "3h",
                        input_params: {
                          atr_length: inp1Params.atr_length || 14,
                          atr_smoothing: inp1Params.atr_smoothing || "RMA",
                        },
                      }
                    } else {
                      // Default ATR settings
                      lastCondition.inp2 = {
                        type: "CUSTOM_I",
                        name: "ATR",
                        timeframe: settings.timeframe || "3h",
                        input_params: {
                          atr_length: 14,
                          atr_smoothing: "RMA",
                        },
                      }
                    }
                  } else if (settings.indicator === "stochastic" || settings.indicator === "stochastic-oscillator" || settings.indicator === "Stochastic") {
                    // Use the same settings from inp1 if it's a Stochastic indicator (for existing indicator selection)
                    if (lastCondition.inp1 && lastCondition.inp1.name === "Stochastic") {
                      const inp1Params = lastCondition.inp1.input_params || {}
                      // Use stochasticOutput if provided (for %K/%D selection), otherwise use inp1's output
                      const outputValue = (settings as any).stochasticOutput || inp1Params.output || "slowk"
                      lastCondition.inp2 = {
                        type: "CUSTOM_I",
                        name: "Stochastic",
                        timeframe: settings.timeframe || lastCondition.inp1.timeframe || "3h",
                        input_params: {
                          fastk_period: (settings as any).fastk_period || inp1Params.fastk_period || inp1Params.kLength || 14,
                          slowk_period: (settings as any).slowk_period || inp1Params.slowk_period || inp1Params.kSmoothing || 3,
                          slowd_period: (settings as any).slowd_period || inp1Params.slowd_period || inp1Params.dSmoothing || 3,
                          output: outputValue,
                        },
                      }
                    } else {
                      // Default Stochastic settings
                      lastCondition.inp2 = {
                        type: "CUSTOM_I",
                        name: "Stochastic",
                        timeframe: settings.timeframe || "3h",
                        input_params: {
                          fastk_period: (settings as any).fastk_period || 14,
                          slowk_period: (settings as any).slowk_period || 3,
                          slowd_period: (settings as any).slowd_period || 3,
                          output: (settings as any).stochasticOutput || "slowk",
                        },
                      }
                    }
                  } else {
                    // For other existing indicators
                    lastCondition.inp2 = createConstantInput(settings.indicator, settings.timeframe || "3h")
                  }
                } else if (settings.valueType === "other" && settings.indicator) {
                  // Handle indicator type for "other" option
                  if (settings.indicator === "bollinger") {
                    lastCondition.inp2 = {
                      type: "I",
                      name: "BBANDS",
                      timeframe: settings.timeframe || "3h",
                      input: settings.band || "upperband",
                      input_params: {
                        timeperiod: settings.timeperiod || 20,
                        source: settings.bbSource || "close",
                        // Add appropriate std dev parameter based on band type
                        ...(settings.band === "upperband" ? { nbdevup: settings.bbStdDev || 2.0 } : {}),
                        ...(settings.band === "lowerband" ? { nbdevdn: settings.bbStdDev || 2.0 } : {}),
                        ...(settings.band === "middleband" ? { nbdevup: 2.0, nbdevdn: 2.0 } : {}),
                      },
                    }
                  } else if (settings.indicator === "rsi") {
                    lastCondition.inp2 = {
                      type: "I",
                      name: "RSI",
                      timeframe: settings.timeframe || "3h",
                      input_params: {
                        timeperiod: settings.rsiLength || 14,
                      },
                    }
                  } else if (settings.indicator === "volume-ma") {
                    lastCondition.inp2 = {
                      type: "CUSTOM_I",
                      name: "Volume_MA",
                      timeframe: settings.timeframe || "3h",
                      input_params: {
                        ma_length: settings.volumeMaLength || 20,
                      },
                    }
                  } else if (settings.indicator === "volume") {
                    lastCondition.inp2 = createConstantInput("volume", settings.timeframe || "3h")
                  } else if (settings.indicator === "atr") {
                    // Use the same settings from inp1 if it's an ATR indicator
                    if (lastCondition.inp1 && lastCondition.inp1.name === "ATR") {
                      const inp1Params = lastCondition.inp1.input_params || {}
                      lastCondition.inp2 = {
                        type: "CUSTOM_I",
                        name: "ATR",
                        timeframe: settings.timeframe || lastCondition.inp1.timeframe || "3h",
                        input_params: {
                          atr_length: inp1Params.atr_length || 14,
                          atr_smoothing: inp1Params.atr_smoothing || "RMA",
                        },
                      }
                    } else {
                      // Default ATR settings
                      lastCondition.inp2 = {
                        type: "CUSTOM_I",
                        name: "ATR",
                        timeframe: settings.timeframe || "3h",
                        input_params: {
                          atr_length: 14,
                          atr_smoothing: "RMA",
                        },
                      }
                    }
                  } else if (settings.indicator === "stochastic" || settings.indicator === "stochastic-oscillator" || settings.indicator === "Stochastic") {
                    // Use the same settings from inp1 if it's a Stochastic indicator
                    if (lastCondition.inp1 && lastCondition.inp1.name === "Stochastic") {
                      const inp1Params = lastCondition.inp1.input_params || {}
                      // Use stochasticOutput if provided (for %K/%D selection), otherwise use inp1's output
                      const outputValue = (settings as any).stochasticOutput || inp1Params.output || "slowk"
                      lastCondition.inp2 = {
                        type: "CUSTOM_I",
                        name: "Stochastic",
                        timeframe: settings.timeframe || lastCondition.inp1.timeframe || "3h",
                        input_params: {
                          fastk_period: (settings as any).fastk_period || inp1Params.fastk_period || inp1Params.kLength || 14,
                          slowk_period: (settings as any).slowk_period || inp1Params.slowk_period || inp1Params.kSmoothing || 3,
                          slowd_period: (settings as any).slowd_period || inp1Params.slowd_period || inp1Params.dSmoothing || 3,
                          output: outputValue,
                        },
                      }
                    } else {
                      // Default Stochastic settings
                      lastCondition.inp2 = {
                        type: "CUSTOM_I",
                        name: "Stochastic",
                        timeframe: settings.timeframe || "3h",
                        input_params: {
                          fastk_period: (settings as any).fastk_period || 14,
                          slowk_period: (settings as any).slowk_period || 3,
                          slowd_period: (settings as any).slowd_period || 3,
                          output: (settings as any).stochasticOutput || "slowk",
                        },
                      }
                    }
                  } else {
                    // For other indicators like price, close, open, etc.
                    lastCondition.inp2 = createConstantInput(settings.indicator, settings.timeframe || "3h")
                  }
                }

                // Save the offset configuration
                lastCondition.offset = {
                  logical_operator: (settings as any).offsetLogicalOperator || ">=",
                  value: (settings as any).offsetValue || 0,
                  unit: (settings as any).offsetUnit || ""
                }
              }

              setStatements(newStatements)
              setShowCrossingDownModal(false)
            }}
            onNext={(indicator, timeframe) => {
              setShowCrossingDownModal(false)
              setPendingOtherIndicator(indicator)
              setPendingTimeframe(timeframe)

              const conditionIndex =
                activeConditionIndex ?? (statements[activeStatementIndex]?.strategy.length ?? 1) - 1

              if (indicator === "rsi") {
                setShowIndicatorModal(true)
              } else if (indicator === "rsi-ma") {
                setShowIndicatorModal(true)
              } else if (indicator === "bollinger") {
                setPendingBollingerForInp2({
                  statementIndex: activeStatementIndex,
                  conditionIndex,
                  timeframe,
                });
                setShowBollingerModal(true);
              } else if (indicator === "stochastic" || indicator === "stochastic-oscillator" || indicator === "Stochastic") {
                openStochasticModal(activeStatementIndex, conditionIndex, "inp2", timeframe)
              } else if (indicator === "volume-ma" || indicator === "volume") {
                // Open Volume modal for volume-ma or volume indicators
                setPendingVolumeIndicatorType(indicator === "volume-ma" ? "volume-ma" : "volume")
                setShowVolumeModal(true)
              } else if (indicator === "atr") {
                // Open ATR modal for ATR indicator
                openAtrModal(activeStatementIndex, conditionIndex, "inp2", timeframe)
              } else if (indicator === "macd") {
                // Open MACD modal for MACD indicator
                setEditingComponent({
                  statementIndex: activeStatementIndex,
                  conditionIndex,
                  componentType: "inp2",
                })
                setPendingTimeframe(timeframe)
                setShowMacdModal(true)
              } else if (indicator === "supertrend") {
                // Open Super Trend modal for Super Trend indicator
                setEditingComponent({
                  statementIndex: activeStatementIndex,
                  conditionIndex,
                  componentType: "inp2",
                })
                setPendingTimeframe(timeframe)
                setShowSuperTrendModal(true)
              } else if (indicator === "ma") {
                // Open MA modal for MA indicator
                setEditingComponent({
                  statementIndex: activeStatementIndex,
                  conditionIndex,
                  componentType: "inp2",
                })
                setPendingTimeframe(timeframe)
                setShowMaModal(true)
              } else if (["close", "open", "high", "low", "price"].includes(indicator)) {
                setShowPriceSettingsModal(true)
              }
            }}
          />
        )}
        {showAboveModal && (
          <AboveSettingsModal
            onClose={() => { setShowAboveModal(false); setEditingComponent(null) }}
            currentInp1={
              (editingComponent
                ? statements[editingComponent.statementIndex]?.strategy[editingComponent.conditionIndex]
                : statements[activeStatementIndex]?.strategy[statements[activeStatementIndex].strategy.length - 1]
              )?.inp1
            }
            onSave={(settings) => {
              const newStatements = [...statements]
              // Target the condition the user actually clicked to edit. Without
              // this the edit always landed on the last condition, so editing
              // the first of two "above" rows wrote to the second.
              const stmtIdx = editingComponent ? editingComponent.statementIndex : activeStatementIndex
              const currentStatement = newStatements[stmtIdx]
              const condIdx = editingComponent ? editingComponent.conditionIndex : currentStatement.strategy.length - 1
              const lastCondition = currentStatement.strategy[condIdx]

              if (lastCondition.operator_name === "above") {
                const tf = settings.timeframe || "3h"

                if (settings.valueType === "value" && settings.customValue) {
                  lastCondition.inp2 = {
                    type: "value",
                    value: Number(settings.customValue),
                  }
                } else if ((settings.valueType === "indicator" || settings.valueType === "other") && settings.indicator) {
                  switch (settings.indicator) {
                    case "rsi":
                      lastCondition.inp2 = {
                        type: "I",
                        name: "RSI",
                        timeframe: tf,
                        input_params: {
                          timeperiod: settings.rsiLength || 14,
                          source: settings.rsiSource?.toLowerCase() || "close",
                        },
                      }
                      break

                    case "rsi-ma":
                      console.log('🔍 Received settings for RSI_MA from above modal:', settings);

                      // Get saved RSI settings from localStorage for better defaults
                      let savedRsiSettings = null;
                      try {
                        const savedSettings = localStorage.getItem('rsiSettings');
                        if (savedSettings) {
                          savedRsiSettings = JSON.parse(savedSettings);
                          console.log('🔍 Retrieved saved RSI settings for RSI_MA inp2 (above):', savedRsiSettings);
                        }
                      } catch (error) {
                        console.log('Error reading saved RSI settings:', error);
                      }

                      // Priority order: settings from modal > saved settings > defaults
                      const finalRsiLength = settings.rsiMaLength || savedRsiSettings?.rsiLength || 14;
                      const finalRsiSource = settings.rsiSource || savedRsiSettings?.source || "Close";
                      const finalMaLength = settings.maLength || savedRsiSettings?.maLength || 14;
                      const finalMaType = settings.maType || savedRsiSettings?.maType || "SMA";
                      // bb_stddev removed — only used by "Bollinger Bands" ma_type, no longer offered.

                      console.log('🔧 Final RSI_MA inp2 values (above):', {
                        rsi_length: finalRsiLength,
                        rsi_source: finalRsiSource,
                        ma_length: finalMaLength,
                        ma_type: finalMaType,
                      });

                      lastCondition.inp2 = {
                        type: "CUSTOM_I",
                        name: "RSI_MA",
                        timeframe: tf,
                        input_params: {
                          rsi_length: finalRsiLength,
                          rsi_source: finalRsiSource,
                          ma_type: finalMaType,
                          ma_length: finalMaLength,
                          },
                      }
                      break

                    case "volume-ma":
                      lastCondition.inp2 = {
                        type: "CUSTOM_I",
                        name: "Volume_MA",
                        timeframe: tf,
                        input_params: {
                          ma_length: settings.volumeMaLength || 20,
                        },
                      }
                      break

                    case "bollinger":
                      lastCondition.inp2 = {
                        type: "I",
                        name: "BBANDS",
                        timeframe: tf,
                        input: settings.band || "lowerband",
                        input_params: {
                          timeperiod: settings.timeperiod || 17,
                          source: settings.bbSource || "close",
                          // Add appropriate std dev parameter based on band type
                          ...(settings.band === "upperband" ? { nbdevup: settings.bbStdDev || 2.0 } : {}),
                          ...(settings.band === "lowerband" ? { nbdevdn: settings.bbStdDev || 2.0 } : {}),
                          ...(settings.band === "middleband" ? { nbdevup: 2.0, nbdevdn: 2.0 } : {}),
                        },
                      }
                      break

                    case "volume":
                      lastCondition.inp2 = createConstantInput("volume", tf)
                      break

                    case "atr":
                      // Use the same settings from inp1 if it's an ATR indicator
                      if (lastCondition.inp1 && lastCondition.inp1.name === "ATR") {
                        const inp1Params = lastCondition.inp1.input_params || {}
                        lastCondition.inp2 = {
                          type: "CUSTOM_I",
                          name: "ATR",
                          timeframe: tf || lastCondition.inp1.timeframe || "3h",
                          input_params: {
                            atr_length: inp1Params.atr_length || 14,
                            atr_smoothing: inp1Params.atr_smoothing || "RMA",
                          },
                        }
                      } else {
                        // Default ATR settings
                        lastCondition.inp2 = {
                          type: "CUSTOM_I",
                          name: "ATR",
                          timeframe: tf,
                          input_params: {
                            atr_length: 14,
                            atr_smoothing: "RMA",
                          },
                        }
                      }
                      break

                    case "stochastic":
                    case "Stochastic":
                    case "stochastic-oscillator":
                      // Use the same settings from inp1 if it's a Stochastic indicator
                      if (lastCondition.inp1 && lastCondition.inp1.name === "Stochastic") {
                        const inp1Params = lastCondition.inp1.input_params || {}
                        // Use stochasticOutput if provided (for %K/%D selection), otherwise use inp1's output
                        const outputValue = (settings as any).stochasticOutput || inp1Params.output || "slowk"
                        lastCondition.inp2 = {
                          type: "CUSTOM_I",
                          name: "Stochastic",
                          timeframe: tf || lastCondition.inp1.timeframe || "3h",
                          input_params: {
                            fastk_period: (settings as any).fastk_period || inp1Params.fastk_period || inp1Params.kLength || 14,
                            slowk_period: (settings as any).slowk_period || inp1Params.slowk_period || inp1Params.kSmoothing || 3,
                            slowd_period: (settings as any).slowd_period || inp1Params.slowd_period || inp1Params.dSmoothing || 3,
                            output: outputValue,
                          },
                        }
                      } else {
                        // Default Stochastic settings
                        lastCondition.inp2 = {
                          type: "CUSTOM_I",
                          name: "Stochastic",
                          timeframe: tf,
                          input_params: {
                            fastk_period: (settings as any).fastk_period || 14,
                            slowk_period: (settings as any).slowk_period || 3,
                            slowd_period: (settings as any).slowd_period || 3,
                            output: (settings as any).stochasticOutput || "slowk",
                          },
                        }
                      }
                      break

                    case "open":
                    case "high":
                    case "low":
                    case "close":
                      lastCondition.inp2 = createConstantInput(settings.indicator, tf)
                      break

                    default:
                      lastCondition.inp2 = createConstantInput(settings.indicator, tf)
                      break
                  }
                }

                // Save the offset configuration
                lastCondition.offset = {
                  logical_operator: (settings as any).offsetLogicalOperator || ">=",
                  value: (settings as any).offsetValue || 0,
                  unit: (settings as any).offsetUnit || ""
                }
              }

              setStatements(newStatements)
              setShowAboveModal(false)
              setEditingComponent(null)
              setTimeout(() => {
                searchInputRefs.current[activeStatementIndex]?.focus()
              }, 100)
            }}
            onNext={(indicator, timeframe) => {
              setShowAboveModal(false)
              setPendingOtherIndicator(indicator)
              setPendingTimeframe(timeframe)

              const conditionIndex =
                activeConditionIndex ?? (statements[activeStatementIndex]?.strategy.length ?? 1) - 1

              if (indicator === "rsi") {
                setShowIndicatorModal(true)
              } else if (indicator === "rsi-ma") {
                setShowIndicatorModal(true)
              } else if (indicator === "bollinger") {
                setPendingBollingerForInp2({
                  statementIndex: activeStatementIndex,
                  conditionIndex,
                  timeframe,
                });
                setShowBollingerModal(true);
              } else if (indicator === "stochastic" || indicator === "stochastic-oscillator" || indicator === "Stochastic") {
                openStochasticModal(activeStatementIndex, conditionIndex, "inp2", timeframe)
              } else if (indicator === "volume-ma" || indicator === "volume") {
                // Open Volume modal for volume-ma or volume indicators
                setShowVolumeModal(true)
              } else if (indicator === "atr") {
                // Open ATR modal for ATR indicator
                openAtrModal(activeStatementIndex, conditionIndex, "inp2", timeframe)
              } else if (indicator === "macd") {
                // Open MACD modal for MACD indicator
                setEditingComponent({
                  statementIndex: activeStatementIndex,
                  conditionIndex,
                  componentType: "inp2",
                })
                setPendingTimeframe(timeframe)
                setShowMacdModal(true)
              } else if (indicator === "supertrend") {
                // Open Super Trend modal for Super Trend indicator
                setEditingComponent({
                  statementIndex: activeStatementIndex,
                  conditionIndex,
                  componentType: "inp2",
                })
                setPendingTimeframe(timeframe)
                setShowSuperTrendModal(true)
              } else if (indicator === "ma") {
                // Open MA modal for MA indicator
                setEditingComponent({
                  statementIndex: activeStatementIndex,
                  conditionIndex,
                  componentType: "inp2",
                })
                setPendingTimeframe(timeframe)
                setShowMaModal(true)
              } else if (["close", "open", "high", "low", "price"].includes(indicator)) {
                setShowPriceSettingsModal(true)
              }
            }}
          />
        )}
        {showBelowModal && (
          <BelowSettingsModal
            onClose={() => { setShowBelowModal(false); setEditingComponent(null) }}
            currentInp1={
              (editingComponent
                ? statements[editingComponent.statementIndex]?.strategy[editingComponent.conditionIndex]
                : statements[activeStatementIndex]?.strategy[statements[activeStatementIndex].strategy.length - 1]
              )?.inp1
            }
            onSave={(settings) => {
              const newStatements = [...statements]
              // Target the clicked condition (see the "above" handler above) so
              // editing one of several "below" rows updates the right one.
              const stmtIdx = editingComponent ? editingComponent.statementIndex : activeStatementIndex
              const currentStatement = newStatements[stmtIdx]
              const condIdx = editingComponent ? editingComponent.conditionIndex : currentStatement.strategy.length - 1
              const lastCondition = currentStatement.strategy[condIdx]

              if (lastCondition.operator_name === "below") {
                const tf = settings.timeframe || "3h"

                if (settings.valueType === "value" && settings.customValue) {
                  lastCondition.inp2 = {
                    type: "value",
                    value: Number(settings.customValue),
                  }
                } else if ((settings.valueType === "indicator" || settings.valueType === "other") && settings.indicator) {
                  switch (settings.indicator) {
                    case "rsi":
                      lastCondition.inp2 = {
                        type: "I",
                        name: "RSI",
                        timeframe: tf,
                        input_params: {
                          timeperiod: settings.rsiLength || 14,
                          source: settings.rsiSource?.toLowerCase() || "close",
                        },
                      }
                      break

                    case "rsi-ma":
                      console.log('🔍 Received settings for RSI_MA from below modal:', settings);

                      // Get saved RSI settings from localStorage for better defaults
                      let savedRsiSettings = null;
                      try {
                        const savedSettings = localStorage.getItem('rsiSettings');
                        if (savedSettings) {
                          savedRsiSettings = JSON.parse(savedSettings);
                          console.log('🔍 Retrieved saved RSI settings for RSI_MA inp2 (below):', savedRsiSettings);
                        }
                      } catch (error) {
                        console.log('Error reading saved RSI settings:', error);
                      }

                      // Priority order: settings from modal > saved settings > defaults
                      const finalRsiLength = settings.rsiMaLength || savedRsiSettings?.rsiLength || 14;
                      const finalRsiSource = settings.rsiSource || savedRsiSettings?.source || "Close";
                      const finalMaLength = settings.maLength || savedRsiSettings?.maLength || 14;
                      const finalMaType = settings.maType || savedRsiSettings?.maType || "SMA";
                      // bb_stddev removed — only used by "Bollinger Bands" ma_type, no longer offered.

                      console.log('🔧 Final RSI_MA inp2 values (below):', {
                        rsi_length: finalRsiLength,
                        rsi_source: finalRsiSource,
                        ma_length: finalMaLength,
                        ma_type: finalMaType,
                      });

                      lastCondition.inp2 = {
                        type: "CUSTOM_I",
                        name: "RSI_MA",
                        timeframe: tf,
                        input_params: {
                          rsi_length: finalRsiLength,
                          rsi_source: finalRsiSource,
                          ma_type: finalMaType,
                          ma_length: finalMaLength,
                          },
                      }
                      break

                    case "volume-ma":
                      lastCondition.inp2 = {
                        type: "CUSTOM_I",
                        name: "Volume_MA",
                        timeframe: tf,
                        input_params: {
                          ma_length: settings.volumeMaLength || 20,
                        },
                      }
                      break

                    case "bollinger":
                      lastCondition.inp2 = {
                        type: "I",
                        name: "BBANDS",
                        timeframe: tf,
                        input: settings.band || "lowerband",
                        input_params: {
                          timeperiod: settings.timeperiod || 17,
                          source: settings.bbSource || "close",
                          // Add appropriate std dev parameter based on band type
                          ...(settings.band === "upperband" ? { nbdevup: settings.bbStdDev || 2.0 } : {}),
                          ...(settings.band === "lowerband" ? { nbdevdn: settings.bbStdDev || 2.0 } : {}),
                          ...(settings.band === "middleband" ? { nbdevup: 2.0, nbdevdn: 2.0 } : {}),
                        },
                      }
                      break

                    case "volume":
                      lastCondition.inp2 = createConstantInput("volume", tf)
                      break

                    case "atr":
                      // Use the same settings from inp1 if it's an ATR indicator
                      if (lastCondition.inp1 && lastCondition.inp1.name === "ATR") {
                        const inp1Params = lastCondition.inp1.input_params || {}
                        lastCondition.inp2 = {
                          type: "CUSTOM_I",
                          name: "ATR",
                          timeframe: tf || lastCondition.inp1.timeframe || "3h",
                          input_params: {
                            atr_length: inp1Params.atr_length || 14,
                            atr_smoothing: inp1Params.atr_smoothing || "RMA",
                          },
                        }
                      } else {
                        // Default ATR settings
                        lastCondition.inp2 = {
                          type: "CUSTOM_I",
                          name: "ATR",
                          timeframe: tf,
                          input_params: {
                            atr_length: 14,
                            atr_smoothing: "RMA",
                          },
                        }
                      }
                      break

                    case "stochastic":
                    case "Stochastic":
                    case "stochastic-oscillator":
                      // Use the same settings from inp1 if it's a Stochastic indicator
                      if (lastCondition.inp1 && lastCondition.inp1.name === "Stochastic") {
                        const inp1Params = lastCondition.inp1.input_params || {}
                        // Use stochasticOutput if provided (for %K/%D selection), otherwise use inp1's output
                        const outputValue = (settings as any).stochasticOutput || inp1Params.output || "slowk"
                        lastCondition.inp2 = {
                          type: "CUSTOM_I",
                          name: "Stochastic",
                          timeframe: tf || lastCondition.inp1.timeframe || "3h",
                          input_params: {
                            fastk_period: (settings as any).fastk_period || inp1Params.fastk_period || inp1Params.kLength || 14,
                            slowk_period: (settings as any).slowk_period || inp1Params.slowk_period || inp1Params.kSmoothing || 3,
                            slowd_period: (settings as any).slowd_period || inp1Params.slowd_period || inp1Params.dSmoothing || 3,
                            output: outputValue,
                          },
                        }
                      } else {
                        // Default Stochastic settings
                        lastCondition.inp2 = {
                          type: "CUSTOM_I",
                          name: "Stochastic",
                          timeframe: tf,
                          input_params: {
                            fastk_period: (settings as any).fastk_period || 14,
                            slowk_period: (settings as any).slowk_period || 3,
                            slowd_period: (settings as any).slowd_period || 3,
                            output: (settings as any).stochasticOutput || "slowk",
                          },
                        }
                      }
                      break

                    case "open":
                    case "high":
                    case "low":
                    case "close":
                      lastCondition.inp2 = createConstantInput(settings.indicator, tf)
                      break

                    default:
                      lastCondition.inp2 = createConstantInput(settings.indicator, tf)
                      break
                  }
                }

                // Save the offset configuration
                lastCondition.offset = {
                  logical_operator: (settings as any).offsetLogicalOperator || ">=",
                  value: (settings as any).offsetValue || 0,
                  unit: (settings as any).offsetUnit || ""
                }
              }

              setStatements(newStatements)
              setShowBelowModal(false)
              setEditingComponent(null)
              setTimeout(() => {
                searchInputRefs.current[activeStatementIndex]?.focus()
              }, 100)
            }}
            onNext={(indicator, timeframe) => {
              setShowBelowModal(false)
              setPendingOtherIndicator(indicator)
              setPendingTimeframe(timeframe)

              const conditionIndex =
                activeConditionIndex ?? (statements[activeStatementIndex]?.strategy.length ?? 1) - 1

              if (indicator === "rsi") {
                setShowIndicatorModal(true)
              } else if (indicator === "rsi-ma") {
                setShowIndicatorModal(true)
              } else if (indicator === "bollinger") {
                setPendingBollingerForInp2({
                  statementIndex: activeStatementIndex,
                  conditionIndex,
                  timeframe,
                });
                setShowBollingerModal(true);
              } else if (indicator === "stochastic" || indicator === "stochastic-oscillator" || indicator === "Stochastic") {
                openStochasticModal(activeStatementIndex, conditionIndex, "inp2", timeframe)
              } else if (indicator === "volume-ma" || indicator === "volume") {
                // Open Volume modal for volume-ma or volume indicators
                setPendingVolumeIndicatorType(indicator === "volume-ma" ? "volume-ma" : "volume")
                setShowVolumeModal(true)
              } else if (indicator === "atr") {
                // Open ATR modal for ATR indicator
                openAtrModal(activeStatementIndex, conditionIndex, "inp2", timeframe)
              } else if (["close", "open", "high", "low", "price"].includes(indicator)) {
                setShowPriceSettingsModal(true)
              }
            }}
          />
        )}

        {showRsiModal && (
          <RsiSettingsModal
            onClose={() => { setShowRsiModal(false); setEditingComponent(null) }}
            initialSettings={(() => {
              const condition = editingComponent
                ? statements[editingComponent.statementIndex]?.strategy[editingComponent.conditionIndex]
                : statements[activeStatementIndex]?.strategy[statements[activeStatementIndex].strategy.length - 1]
              const indicator: any = editingComponent
                ? (editingComponent.componentType === "inp1" ? condition?.inp1 : condition?.inp2)
                : condition?.inp1
              if (indicator && "name" in indicator && indicator.name === "RSI" && "input_params" in indicator) {
                const src = indicator.input_params?.source
                return {
                  rsiLength: String(indicator.input_params?.timeperiod || 14),
                  source: typeof src === "string" && src.length > 0 ? src.charAt(0).toUpperCase() + src.slice(1) : "Close",
                  timeframe: indicator.timeframe || "3h",
                }
              }
              return undefined
            })()}
            onSave={(settings) => {
              const newStatements = [...statements]
              const currentStatement = newStatements[activeStatementIndex]
              const buildBlock = (timeframe: string) => ({
                type: "I" as const,
                name: "RSI" as const,
                timeframe,
                input_params: {
                  timeperiod: Number(settings.rsiLength),
                  source: settings.source?.toLowerCase() || "close",
                },
              })

              if (editingComponent) {
                const condition = currentStatement.strategy[editingComponent.conditionIndex]
                const targetIndicator: any =
                  editingComponent.componentType === "inp1" ? condition.inp1 : condition.inp2
                if (targetIndicator && "timeframe" in targetIndicator) {
                  const block = buildBlock(targetIndicator.timeframe || settings.timeframe || "3h")
                  if (editingComponent.componentType === "inp1") condition.inp1 = block
                  else condition.inp2 = block
                }
              } else {
                const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]
                if (lastCondition.inp1 && "timeframe" in lastCondition.inp1) {
                  lastCondition.inp1 = buildBlock(lastCondition.inp1.timeframe || settings.timeframe || "3h")
                }
              }

              setStatements(newStatements)
              setShowRsiModal(false)
              setEditingComponent(null)
              setTimeout(() => {
                searchInputRefs.current[activeStatementIndex]?.focus()
              }, 100)
            }}
          />
        )}
        {showRsiMaModal && (
          <RsiMaSettingsModal
            onClose={() => { setShowRsiMaModal(false); setEditingComponent(null) }}
            initialSettings={(() => {
              const condition = editingComponent
                ? statements[editingComponent.statementIndex]?.strategy[editingComponent.conditionIndex]
                : statements[activeStatementIndex]?.strategy[statements[activeStatementIndex].strategy.length - 1]
              const indicator: any = editingComponent
                ? (editingComponent.componentType === "inp1" ? condition?.inp1 : condition?.inp2)
                : condition?.inp1
              if (indicator && "name" in indicator && indicator.name === "RSI_MA" && "input_params" in indicator) {
                return {
                  rsiLength: String(indicator.input_params?.rsi_length || 14),
                  source: indicator.input_params?.rsi_source || "Close",
                  maLength: String(indicator.input_params?.ma_length || 14),
                  maType: indicator.input_params?.ma_type || "SMA",
                  timeframe: indicator.timeframe || "3h",
                }
              }
              return undefined
            })()}
            onSave={(settings) => {
              // Mirror the RSI_MA params into rsiMaSettings so other callers
              // (e.g. crossing-up modal indicator dropdown) can pre-fill.
              setRsiMaSettings({
                rsi_length: Number(settings.rsiLength),
                rsi_source: settings.source || "Close",
                ma_type: settings.maType || "SMA",
                ma_length: Number(settings.maLength),
              })

              const newStatements = [...statements]
              const currentStatement = newStatements[activeStatementIndex]
              const buildBlock = (timeframe: string) => ({
                type: "CUSTOM_I" as const,
                name: "RSI_MA" as const,
                timeframe,
                input_params: {
                  rsi_length: Number(settings.rsiLength),
                  rsi_source: settings.source || "Close",
                  ma_type: settings.maType || "SMA",
                  ma_length: Number(settings.maLength),
                },
              })

              if (editingComponent) {
                const condition = currentStatement.strategy[editingComponent.conditionIndex]
                const targetIndicator: any =
                  editingComponent.componentType === "inp1" ? condition.inp1 : condition.inp2
                if (targetIndicator && "timeframe" in targetIndicator) {
                  const block = buildBlock(targetIndicator.timeframe || settings.timeframe || "3h")
                  if (editingComponent.componentType === "inp1") condition.inp1 = block
                  else condition.inp2 = block
                }
              } else {
                const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]
                if (lastCondition.inp1 && "timeframe" in lastCondition.inp1) {
                  lastCondition.inp1 = buildBlock(lastCondition.inp1.timeframe || settings.timeframe || "3h")
                }
              }

              setStatements(newStatements)
              setShowRsiMaModal(false)
              setEditingComponent(null)
              setTimeout(() => {
                searchInputRefs.current[activeStatementIndex]?.focus()
              }, 100)
            }}
          />
        )}
        {showBollingerModal && (
          <BollingerBandsSettingsModal
            onClose={() => setShowBollingerModal(false)}
            initialSettings={(() => {
              if (editingComponent) {
                const condition = statements[editingComponent.statementIndex]?.strategy[editingComponent.conditionIndex]
                const indicator = editingComponent.componentType === "inp1" ? condition?.inp1 : condition?.inp2

                if (indicator && "input_params" in indicator) {
                  return {
                    timeperiod: indicator.input_params?.timeperiod || 20,
                    input: indicator.input || "upperband",
                    nbdevup: indicator.input_params?.nbdevup,
                    nbdevdn: indicator.input_params?.nbdevdn,
                    source: indicator.input_params?.source || "high",
                  }
                }
              } else {
                // Fallback: determine which indicator to use based on the same logic as handleAddComponent
                // If there's an operator_name, we're editing inp2, otherwise inp1
                const currentStatement = statements[activeStatementIndex]
                const lastCondition = currentStatement?.strategy[currentStatement.strategy.length - 1]

                let indicator = null

                // Use the same logic as handleAddComponent: if inp1 exists and has operator, we're editing inp2
                if (lastCondition?.inp1 && lastCondition?.operator_name) {
                  // We're editing inp2
                  if (lastCondition.inp2 && "name" in lastCondition.inp2 && lastCondition.inp2.name === "BBANDS") {
                    indicator = lastCondition.inp2
                  }
                  // If inp2 doesn't have BBANDS yet, don't use inp1's settings - return undefined for new indicator
                } else {
                  // We're editing inp1
                  if (lastCondition?.inp1 && "name" in lastCondition.inp1 && lastCondition.inp1.name === "BBANDS") {
                    indicator = lastCondition.inp1
                  }
                  // If inp1 doesn't have BBANDS yet, return undefined for new indicator
                }

                if (indicator && "input_params" in indicator) {
                  return {
                    timeperiod: indicator.input_params?.timeperiod || 20,
                    input: indicator.input || "upperband",
                    nbdevup: indicator.input_params?.nbdevup,
                    nbdevdn: indicator.input_params?.nbdevdn,
                    source: indicator.input_params?.source || "high",
                  }
                }
              }
              return undefined
            })()}
            onSave={(settings) => {
              const newStatements = [...statements];

              if (pendingBollingerForInp2) {
                // Set inp2 of the correct condition
                const { statementIndex, conditionIndex, timeframe } = pendingBollingerForInp2;
                const condition = newStatements[statementIndex].strategy[conditionIndex];
                condition.inp2 = {
                  type: "I",
                  name: "BBANDS",
                  timeframe: timeframe,
                  input: settings.input,
                  input_params: settings.input_params,
                };
                setPendingBollingerForInp2(null);
              } else if (editingComponent) {
                const condition = newStatements[editingComponent.statementIndex].strategy[editingComponent.conditionIndex]
                const targetIndicator = editingComponent.componentType === "inp1" ? condition.inp1 : condition.inp2

                if (targetIndicator && "name" in targetIndicator && targetIndicator.name === "BBANDS") {
                  // Preserve the name and type when updating
                  targetIndicator.input = settings.input
                  targetIndicator.input_params = settings.input_params
                  // Ensure name is always "BBANDS" (should already be set, but ensure it)
                  targetIndicator.name = "BBANDS"
                  if (!targetIndicator.type) {
                    targetIndicator.type = "I"
                  }
                }
              } else {
                // Fallback: determine which input to update based on the same logic as handleAddComponent
                // If there's an operator_name, we're updating inp2, otherwise inp1
                const currentStatement = newStatements[activeStatementIndex]
                const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

                let targetIndicator = null

                // Use the same logic as handleAddComponent: if inp1 exists and has operator, we're adding to inp2
                if (lastCondition.inp1 && lastCondition.operator_name) {
                  // We're updating inp2
                  if (lastCondition.inp2 && "name" in lastCondition.inp2 && lastCondition.inp2.name === "BBANDS") {
                    targetIndicator = lastCondition.inp2
                  } else if (!lastCondition.inp2) {
                    // inp2 doesn't exist yet, create it
                    lastCondition.inp2 = {
                      type: "I",
                      name: "BBANDS",
                      timeframe: settings.timeframe || "3h",
                      input: settings.input,
                      input_params: settings.input_params,
                    }
                    setStatements(newStatements)
                    setShowBollingerModal(false)
                    setEditingComponent(null)
                    setTimeout(() => {
                      searchInputRefs.current[activeStatementIndex]?.focus()
                    }, 100)
                    return
                  }
                } else {
                  // We're updating inp1
                  if (lastCondition.inp1 && "name" in lastCondition.inp1 && lastCondition.inp1.name === "BBANDS") {
                    targetIndicator = lastCondition.inp1
                  } else if (!lastCondition.inp1) {
                    // inp1 doesn't exist yet, create it
                    lastCondition.inp1 = {
                      type: "I",
                      name: "BBANDS",
                      timeframe: settings.timeframe || "3h",
                      input: settings.input,
                      input_params: settings.input_params,
                    }
                    setStatements(newStatements)
                    setShowBollingerModal(false)
                    setEditingComponent(null)
                    setTimeout(() => {
                      searchInputRefs.current[activeStatementIndex]?.focus()
                    }, 100)
                    return
                  }
                }

                if (targetIndicator) {
                  // Preserve the name and type when updating
                  targetIndicator.input = settings.input
                  targetIndicator.input_params = settings.input_params
                  // Ensure name is always "BBANDS" (should already be set, but ensure it)
                  if ("name" in targetIndicator) {
                    targetIndicator.name = "BBANDS"
                  }
                  if (!targetIndicator.type) {
                    targetIndicator.type = "I"
                  }
                } else {
                  // Creating a new indicator - determine if it should be inp1 or inp2
                  if (lastCondition.inp1 && lastCondition.operator_name) {
                    // We're adding to inp2
                    lastCondition.inp2 = {
                      type: "I",
                      name: "BBANDS",
                      timeframe: settings.timeframe || "3h",
                      input: settings.input,
                      input_params: settings.input_params,
                    }
                  } else {
                    // We're adding to inp1
                    lastCondition.inp1 = {
                      type: "I",
                      name: "BBANDS",
                      timeframe: settings.timeframe || "3h",
                      input: settings.input,
                      input_params: settings.input_params,
                    }
                  }
                }
              }

              setStatements(newStatements);
              setShowBollingerModal(false);
              setEditingComponent(null);
              setTimeout(() => {
                searchInputRefs.current[activeStatementIndex]?.focus();
              }, 100);
            }}
          />
        )}
        {showVolumeModal && (
          <VolumeSettingsModal
            onClose={() => {
              setShowVolumeModal(false)
              setPendingVolumeIndicatorType(null)
              setEditingComponent(null)
            }}
            onSave={() => {
              // Volume = raw OHLCV column, no params. Build a type:"C" /
              // input:"volume" block targeting the right slot and slot owner.
              const newStatements = [...statements]
              const currentStatement = newStatements[activeStatementIndex]

              if (editingComponent) {
                const condition = currentStatement.strategy[editingComponent.conditionIndex]
                const targetIndicator: any =
                  editingComponent.componentType === "inp1" ? condition.inp1 : condition.inp2
                if (targetIndicator && "timeframe" in targetIndicator) {
                  const block = createConstantInput("volume", targetIndicator.timeframe)
                  if (editingComponent.componentType === "inp1") condition.inp1 = block
                  else condition.inp2 = block
                }
              } else if (pendingVolumeIndicatorType && pendingTimeframe) {
                const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]
                lastCondition.inp2 = createConstantInput("volume", pendingTimeframe)
                setPendingVolumeIndicatorType(null)
                setPendingTimeframe("3h")
              } else {
                const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]
                if (lastCondition.inp1 && "timeframe" in lastCondition.inp1) {
                  lastCondition.inp1 = createConstantInput("volume", lastCondition.inp1.timeframe)
                }
              }

              setStatements(newStatements)
              setShowVolumeModal(false)
              setEditingComponent(null)
              setTimeout(() => {
                searchInputRefs.current[activeStatementIndex]?.focus()
              }, 100)
            }}
          />
        )}
        {showVolumeMaModal && (
          <VolumeMaSettingsModal
            onClose={() => { setShowVolumeMaModal(false); setEditingComponent(null) }}
            initialSettings={(() => {
              const condition = editingComponent
                ? statements[editingComponent.statementIndex]?.strategy[editingComponent.conditionIndex]
                : statements[activeStatementIndex]?.strategy[statements[activeStatementIndex].strategy.length - 1]
              const indicator: any = editingComponent
                ? (editingComponent.componentType === "inp1" ? condition?.inp1 : condition?.inp2)
                : condition?.inp1
              if (indicator && "name" in indicator && indicator.name === "Volume_MA" && "input_params" in indicator) {
                return { maLength: String(indicator.input_params?.ma_length || 20) }
              }
              return undefined
            })()}
            onSave={(settings) => {
              const newStatements = [...statements]
              const currentStatement = newStatements[activeStatementIndex]
              const buildBlock = (timeframe: string) => ({
                type: "CUSTOM_I" as const,
                name: "Volume_MA" as const,
                timeframe,
                input_params: { ma_length: Number(settings.maLength) },
              })

              if (editingComponent) {
                const condition = currentStatement.strategy[editingComponent.conditionIndex]
                const targetIndicator: any =
                  editingComponent.componentType === "inp1" ? condition.inp1 : condition.inp2
                if (targetIndicator && "timeframe" in targetIndicator) {
                  const block = buildBlock(targetIndicator.timeframe || selectedTimeframe)
                  if (editingComponent.componentType === "inp1") condition.inp1 = block
                  else condition.inp2 = block
                }
              } else if (pendingVolumeIndicatorType && pendingTimeframe) {
                const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]
                lastCondition.inp2 = buildBlock(pendingTimeframe)
                setPendingVolumeIndicatorType(null)
                setPendingTimeframe("3h")
              } else {
                const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]
                if (lastCondition.inp1 && "timeframe" in lastCondition.inp1) {
                  lastCondition.inp1 = buildBlock(lastCondition.inp1.timeframe || selectedTimeframe)
                }
              }

              setStatements(newStatements)
              setShowVolumeMaModal(false)
              setEditingComponent(null)
              setTimeout(() => {
                searchInputRefs.current[activeStatementIndex]?.focus()
              }, 100)
            }}
          />
        )}
        {showVolumeDeltaModal && (
          <VolumeDeltaSettingsModal
            onClose={() => {
              setShowVolumeDeltaModal(false)
              setEditingComponent(null)
            }}
            initialSettings={(() => {
              if (!editingComponent) return undefined
              const condition = statements[editingComponent.statementIndex]?.strategy[editingComponent.conditionIndex]
              const ind: any = editingComponent.componentType === "inp1" ? condition?.inp1 : condition?.inp2
              if (ind && "name" in ind && ind.name === "VolumeDelta") {
                return { lowerTimeframe: ind.input_params?.lower_timeframe || "1min" }
              }
              return undefined
            })()}
            onSave={(settings) => {
              const newStatements = [...statements]
              const currentStatement = newStatements[activeStatementIndex]
              const buildBlock = (timeframe: string) => ({
                type: "CUSTOM_I" as const,
                name: "VolumeDelta" as const,
                timeframe,
                input_params: { lower_timeframe: settings.lowerTimeframe },
              })

              if (editingComponent) {
                const condition = currentStatement.strategy[editingComponent.conditionIndex]
                const targetIndicator = editingComponent.componentType === "inp1" ? condition.inp1 : condition.inp2
                if (targetIndicator && "timeframe" in targetIndicator) {
                  const block = buildBlock(targetIndicator.timeframe || selectedTimeframe)
                  if (editingComponent.componentType === "inp1") condition.inp1 = block
                  else condition.inp2 = block
                }
              } else {
                const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]
                const block = buildBlock(lastCondition.inp1?.timeframe || selectedTimeframe)
                if (lastCondition.inp1 && lastCondition.operator_name) lastCondition.inp2 = block
                else lastCondition.inp1 = block
              }

              setStatements(newStatements)
              setShowVolumeDeltaModal(false)
              setEditingComponent(null)
              setTimeout(() => {
                searchInputRefs.current[activeStatementIndex]?.focus()
              }, 100)
            }}
          />
        )}
        {showCumulativeVolumeDeltaModal && (
          <CumulativeVolumeDeltaSettingsModal
            onClose={() => {
              setShowCumulativeVolumeDeltaModal(false)
              setEditingComponent(null)
            }}
            initialSettings={(() => {
              if (!editingComponent) return undefined
              const condition = statements[editingComponent.statementIndex]?.strategy[editingComponent.conditionIndex]
              const ind: any = editingComponent.componentType === "inp1" ? condition?.inp1 : condition?.inp2
              if (ind && "name" in ind && ind.name === "CumulativeVolumeDelta") {
                return {
                  lowerTimeframe: ind.input_params?.lower_timeframe || "1min",
                  resetPeriod: ind.input_params?.reset_period || "D",
                }
              }
              return undefined
            })()}
            onSave={(settings) => {
              const newStatements = [...statements]
              const currentStatement = newStatements[activeStatementIndex]
              const buildBlock = (timeframe: string) => ({
                type: "CUSTOM_I" as const,
                name: "CumulativeVolumeDelta" as const,
                timeframe,
                input_params: {
                  lower_timeframe: settings.lowerTimeframe,
                  reset_period: settings.resetPeriod,
                },
              })

              if (editingComponent) {
                const condition = currentStatement.strategy[editingComponent.conditionIndex]
                const targetIndicator = editingComponent.componentType === "inp1" ? condition.inp1 : condition.inp2
                if (targetIndicator && "timeframe" in targetIndicator) {
                  const block = buildBlock(targetIndicator.timeframe || selectedTimeframe)
                  if (editingComponent.componentType === "inp1") condition.inp1 = block
                  else condition.inp2 = block
                }
              } else {
                const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]
                const block = buildBlock(lastCondition.inp1?.timeframe || selectedTimeframe)
                if (lastCondition.inp1 && lastCondition.operator_name) lastCondition.inp2 = block
                else lastCondition.inp1 = block
              }

              setStatements(newStatements)
              setShowCumulativeVolumeDeltaModal(false)
              setEditingComponent(null)
              setTimeout(() => {
                searchInputRefs.current[activeStatementIndex]?.focus()
              }, 100)
            }}
          />
        )}
        {showHistoricalPriceLevelModal && (
          <HistoricalPriceLevelSettingsModal
            onClose={() => {
              setShowHistoricalPriceLevelModal(false)
              setEditingComponent(null)
            }}
            initialSettings={(() => {
              if (!editingComponent) return undefined
              const condition = statements[editingComponent.statementIndex]?.strategy[editingComponent.conditionIndex]
              const ind: any = editingComponent.componentType === "inp1" ? condition?.inp1 : condition?.inp2
              if (ind && "name" in ind && ind.name === "HistoricalPriceLevel") {
                return {
                  period: ind.input_params?.period || "W",
                  level: ind.input_params?.level || "High",
                }
              }
              return undefined
            })()}
            onSave={(settings) => {
              const newStatements = [...statements]
              const currentStatement = newStatements[activeStatementIndex]

              if (editingComponent) {
                const condition = currentStatement.strategy[editingComponent.conditionIndex]
                const targetIndicator = editingComponent.componentType === "inp1" ? condition.inp1 : condition.inp2

                if (targetIndicator && "timeframe" in targetIndicator) {
                  const updatedIndicator: any = {
                    type: "CUSTOM_I",
                    name: "HistoricalPriceLevel",
                    timeframe: targetIndicator.timeframe,
                    input_params: {
                      period: settings.period,
                      level: settings.level,
                    },
                  }

                  if (editingComponent.componentType === "inp1") {
                    condition.inp1 = updatedIndicator
                  } else {
                    condition.inp2 = updatedIndicator
                  }
                }
              } else {
                // Adding new indicator
                const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]
                const timeframe = lastCondition.inp1?.timeframe || selectedTimeframe

                const newIndicator: any = {
                  type: "CUSTOM_I",
                  name: "HistoricalPriceLevel",
                  timeframe: timeframe,
                  input_params: {
                    period: settings.period,
                    level: settings.level,
                  },
                }

                // Determine if we're adding to inp1 or inp2
                if (lastCondition.inp1 && lastCondition.operator_name) {
                  lastCondition.inp2 = newIndicator
                } else {
                  lastCondition.inp1 = newIndicator
                }
              }

              setStatements(newStatements)
              setShowHistoricalPriceLevelModal(false)
              setEditingComponent(null)
              setTimeout(() => {
                searchInputRefs.current[activeStatementIndex]?.focus()
              }, 100)
            }}
          />
        )}
        {showCandleSizeModal && (
          <CandleSizeSettingsModal
            onClose={() => {
              setShowCandleSizeModal(false)
              setEditingComponent(null)
            }}
            initialSettings={(() => {
              if (!editingComponent) return undefined
              const condition = statements[editingComponent.statementIndex]?.strategy[editingComponent.conditionIndex]
              const ind: any = editingComponent.componentType === "inp1" ? condition?.inp1 : condition?.inp2
              if (ind && "name" in ind && ind.name === "CandleSize") {
                return {
                  assetType: ind.input_params?.asset_type || "gold",
                  output: ind.input_params?.output || "pips",
                }
              }
              return undefined
            })()}
            onSave={(settings) => {
              const newStatements = [...statements]
              const currentStatement = newStatements[activeStatementIndex]

              if (editingComponent) {
                const condition = currentStatement.strategy[editingComponent.conditionIndex]
                const targetIndicator = editingComponent.componentType === "inp1" ? condition.inp1 : condition.inp2

                if (targetIndicator && "timeframe" in targetIndicator) {
                  const updatedIndicator: any = {
                    type: "CUSTOM_I",
                    name: "CandleSize",
                    timeframe: targetIndicator.timeframe,
                    input_params: {
                      asset_type: settings.assetType,
                      output: settings.output,
                    },
                  }

                  if (editingComponent.componentType === "inp1") {
                    condition.inp1 = updatedIndicator
                  } else {
                    condition.inp2 = updatedIndicator
                  }
                }
              } else {
                // Adding new indicator
                const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]
                const timeframe = lastCondition.inp1?.timeframe || selectedTimeframe

                const newIndicator: any = {
                  type: "CUSTOM_I",
                  name: "CandleSize",
                  timeframe: timeframe,
                  input_params: {
                    asset_type: settings.assetType,
                    output: settings.output,
                  },
                }

                // Determine if we're adding to inp1 or inp2
                if (lastCondition.inp1 && lastCondition.operator_name) {
                  lastCondition.inp2 = newIndicator
                } else {
                  lastCondition.inp1 = newIndicator
                }
              }

              setStatements(newStatements)
              setShowCandleSizeModal(false)
              setEditingComponent(null)
              setTimeout(() => {
                searchInputRefs.current[activeStatementIndex]?.focus()
              }, 100)
            }}
          />
        )}
        {showAtrModal && (
          <AtrSettingsModal
            onClose={() => {
              setShowAtrModal(false)
              setEditingComponent(null)
              setAtrModalTarget(null)
              setPendingTimeframe("3h")
            }}
            initialSettings={getAtrInitialSettings()}
            onSave={applyAtrSettings}
          />
        )}
        {showMacdModal && (
          <MacdSettingsModal
            onClose={() => {
              setShowMacdModal(false)
              setEditingComponent(null)
            }}
            initialSettings={(() => {
              if (editingComponent) {
                const condition = statements[editingComponent.statementIndex]?.strategy[editingComponent.conditionIndex]
                const indicator = editingComponent.componentType === "inp1" ? condition?.inp1 : condition?.inp2

                if (indicator && "name" in indicator && indicator.name === "MACD" && "input_params" in indicator) {
                  return {
                    indicatorType: indicator.input_params?.macd_indicator_type || "MACD",
                    fastLength: String(indicator.input_params?.macd_fast_length || 12),
                    slowLength: String(indicator.input_params?.macd_slow_length || 26),
                    source: indicator.input_params?.macd_source || "close",
                    signalSmoothing: String(indicator.input_params?.macd_signal_smoothing || 9),
                    oscillatorMaType: indicator.input_params?.macd_oscillator_ma_type || "EMA",
                    signalLineMaType: indicator.input_params?.macd_signal_ma_type || "EMA",
                  }
                }
              } else {
                const currentStatement = statements[activeStatementIndex]
                const lastCondition = currentStatement?.strategy[currentStatement.strategy.length - 1]
                const indicator = lastCondition?.inp1

                if (indicator && "name" in indicator && indicator.name === "MACD" && "input_params" in indicator) {
                  return {
                    indicatorType: indicator.input_params?.macd_indicator_type || "MACD",
                    fastLength: String(indicator.input_params?.macd_fast_length || 12),
                    slowLength: String(indicator.input_params?.macd_slow_length || 26),
                    source: indicator.input_params?.macd_source || "close",
                    signalSmoothing: String(indicator.input_params?.macd_signal_smoothing || 9),
                    oscillatorMaType: indicator.input_params?.macd_oscillator_ma_type || "EMA",
                    signalLineMaType: indicator.input_params?.macd_signal_ma_type || "EMA",
                  }
                }
              }
              return undefined
            })()}
            onSave={(settings) => {
              const newStatements = [...statements]
              const currentStatement = newStatements[activeStatementIndex]

              if (editingComponent) {
                const condition = currentStatement.strategy[editingComponent.conditionIndex]
                const targetIndicator = editingComponent.componentType === "inp1" ? condition.inp1 : condition.inp2
                const timeframe = pendingTimeframe || "3h"

                if (targetIndicator && "name" in targetIndicator && targetIndicator.name === "MACD") {
                  // Update existing MACD indicator
                  targetIndicator.input_params = {
                    macd_fast_length: Number(settings.fastLength),
                    macd_slow_length: Number(settings.slowLength),
                    macd_source: settings.source,
                    macd_signal_smoothing: Number(settings.signalSmoothing),
                    macd_oscillator_ma_type: settings.oscillatorMaType,
                    macd_signal_ma_type: settings.signalLineMaType,
                    macd_indicator_type: settings.indicatorType,
                  }
                } else if (editingComponent.componentType === "inp2") {
                  // Create new MACD indicator in inp2
                  condition.inp2 = {
                    type: "CUSTOM_I",
                    name: "MACD",
                    timeframe: timeframe,
                    input_params: {
                      macd_fast_length: Number(settings.fastLength),
                      macd_slow_length: Number(settings.slowLength),
                      macd_source: settings.source,
                      macd_signal_smoothing: Number(settings.signalSmoothing),
                      macd_oscillator_ma_type: settings.oscillatorMaType,
                      macd_signal_ma_type: settings.signalLineMaType,
                      macd_indicator_type: settings.indicatorType,
                    },
                  }
                }
              } else {
                const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

                if (lastCondition.inp1 && "name" in lastCondition.inp1 && lastCondition.inp1.name === "MACD") {
                  lastCondition.inp1.input_params = {
                    macd_fast_length: Number(settings.fastLength),
                    macd_slow_length: Number(settings.slowLength),
                    macd_source: settings.source,
                    macd_signal_smoothing: Number(settings.signalSmoothing),
                    macd_oscillator_ma_type: settings.oscillatorMaType,
                    macd_signal_ma_type: settings.signalLineMaType,
                    macd_indicator_type: settings.indicatorType,
                  }
                }
              }

              setStatements(newStatements)
              setShowMacdModal(false)
              setEditingComponent(null)
              setPendingTimeframe("3h")
              setTimeout(() => {
                searchInputRefs.current[activeStatementIndex]?.focus()
              }, 100)
            }}
          />
        )}
        {showSuperTrendModal && (
          <SuperTrendSettingsModal
            onClose={() => {
              setShowSuperTrendModal(false)
              setEditingComponent(null)
            }}
            initialSettings={(() => {
              if (editingComponent) {
                const condition = statements[editingComponent.statementIndex]?.strategy[editingComponent.conditionIndex]
                const indicator = editingComponent.componentType === "inp1" ? condition?.inp1 : condition?.inp2

                if (indicator && "name" in indicator && indicator.name === "SupertrendIndicator" && "input_params" in indicator) {
                  return {
                    period: indicator.input_params?.period || 10,
                    multiplier: indicator.input_params?.multiplier || 3.0,
                    change_atr_method: indicator.input_params?.change_atr_method ?? true,
                    output: indicator.input_params?.output || "SellSignal",
                  }
                }
              } else {
                const currentStatement = statements[activeStatementIndex]
                const lastCondition = currentStatement?.strategy[currentStatement.strategy.length - 1]
                const indicator = lastCondition?.inp1

                if (indicator && "name" in indicator && indicator.name === "SupertrendIndicator" && "input_params" in indicator) {
                  return {
                    period: indicator.input_params?.period || 10,
                    multiplier: indicator.input_params?.multiplier || 3.0,
                    change_atr_method: indicator.input_params?.change_atr_method ?? true,
                    output: indicator.input_params?.output || "SellSignal",
                  }
                }
              }
              return undefined
            })()}
            onSave={(settings) => {
              const newStatements = [...statements]
              const currentStatement = newStatements[activeStatementIndex]

              if (editingComponent) {
                const condition = currentStatement.strategy[editingComponent.conditionIndex]
                const targetIndicator = editingComponent.componentType === "inp1" ? condition.inp1 : condition.inp2
                const timeframe = pendingTimeframe || "3h"

                if (targetIndicator && "name" in targetIndicator && targetIndicator.name === "SupertrendIndicator") {
                  // Update existing Super Trend indicator
                  targetIndicator.input_params = {
                    period: settings.period,
                    multiplier: settings.multiplier,
                    change_atr_method: settings.change_atr_method,
                    output: settings.output,
                  }
                } else if (editingComponent.componentType === "inp2") {
                  // Create new Super Trend indicator in inp2
                  condition.inp2 = {
                    type: "CUSTOM_I",
                    name: "SupertrendIndicator",
                    timeframe: timeframe,
                    input_params: {
                      period: settings.period,
                      multiplier: settings.multiplier,
                      change_atr_method: settings.change_atr_method,
                      output: settings.output,
                    },
                  }
                }
              } else {
                const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

                if (lastCondition.inp1 && "name" in lastCondition.inp1 && lastCondition.inp1.name === "SupertrendIndicator") {
                  lastCondition.inp1.input_params = {
                    period: settings.period,
                    multiplier: settings.multiplier,
                    change_atr_method: settings.change_atr_method,
                    output: settings.output,
                  }
                }
              }

              setStatements(newStatements)
              setShowSuperTrendModal(false)
              setEditingComponent(null)
              setPendingTimeframe("3h")
              setTimeout(() => {
                searchInputRefs.current[activeStatementIndex]?.focus()
              }, 100)
            }}
          />
        )}
        {showMaModal && (
          <MaSettingsModal
            onClose={() => {
              setShowMaModal(false)
              setEditingComponent(null)
            }}
            initialSettings={(() => {
              const isMaIndicator = (ind: any) =>
                ind && "name" in ind && (ind.name === "MA" || ind.name === "SMA" || ind.name === "EMA" || ind.name === "HMA") && "input_params" in ind

              if (editingComponent) {
                const condition = statements[editingComponent.statementIndex]?.strategy[editingComponent.conditionIndex]
                const indicator = editingComponent.componentType === "inp1" ? condition?.inp1 : condition?.inp2

                if (isMaIndicator(indicator)) {
                  return {
                    maType: indicator.input_params?.ma_type || indicator.input_params?.maType || "SMA",
                    maLength: indicator.input_params?.ma_length || indicator.input_params?.maLength || 20,
                  }
                }
              } else {
                const currentStatement = statements[activeStatementIndex]
                if (currentStatement) {
                  for (const cond of currentStatement.strategy) {
                    if (isMaIndicator(cond.inp1)) {
                      return {
                        maType: (cond.inp1 as any).input_params?.ma_type || (cond.inp1 as any).input_params?.maType || "SMA",
                        maLength: (cond.inp1 as any).input_params?.ma_length || (cond.inp1 as any).input_params?.maLength || 20,
                      }
                    }
                    if (isMaIndicator(cond.inp2)) {
                      return {
                        maType: (cond.inp2 as any).input_params?.ma_type || (cond.inp2 as any).input_params?.maType || "SMA",
                        maLength: (cond.inp2 as any).input_params?.ma_length || (cond.inp2 as any).input_params?.maLength || 20,
                      }
                    }
                  }
                }
              }
              return undefined
            })()}
            onSave={(settings) => {
              const newStatements = [...statements]
              const currentStatement = newStatements[activeStatementIndex]

              // Backend's CUSTOM_I allowlist only contains "MA" — the SMA/EMA/
              // HMA/etc. distinction belongs in `input_params.ma_type`, never
              // in the indicator name. Earlier versions emitted name:"SMA"
              // which the engine rejected with "Indicator 'SMA' not found".
              // We always write name:"MA" now. The READ-side helpers still
              // recognise the legacy bad names so old strategies migrate on
              // first save.
              const MA_NAME = "MA"

              if (editingComponent) {
                const condition = currentStatement.strategy[editingComponent.conditionIndex]
                const targetIndicator = editingComponent.componentType === "inp1" ? condition.inp1 : condition.inp2
                const timeframe = pendingTimeframe || "3h"

                if (targetIndicator && "name" in targetIndicator && (targetIndicator.name === "MA" || targetIndicator.name === "SMA" || targetIndicator.name === "EMA" || targetIndicator.name === "HMA")) {
                  // Update existing MA indicator — normalise the name on save.
                  targetIndicator.name = MA_NAME
                  targetIndicator.input_params = {
                    ma_type: settings.maType,
                    ma_length: settings.maLength,
                  }
                } else if (editingComponent.componentType === "inp2") {
                  condition.inp2 = {
                    type: "CUSTOM_I",
                    name: MA_NAME,
                    timeframe: timeframe,
                    input_params: {
                      ma_type: settings.maType,
                      ma_length: settings.maLength,
                    },
                  }
                } else if (editingComponent.componentType === "inp1") {
                  condition.inp1 = {
                    type: "CUSTOM_I",
                    name: MA_NAME,
                    timeframe: timeframe,
                    input_params: {
                      ma_type: settings.maType,
                      ma_length: settings.maLength,
                    },
                  }
                }
              } else {
                // Find the MA placeholder that handleAddComponent just inserted.
                // Scan every condition's inp1 / inp2 — earlier code only looked at
                // the last condition's inp1, which silently dropped MA inserts
                // landing in any other slot (e.g. inp2 of an earlier condition
                // when the cursor was mid-statement).
                const isMaPlaceholder = (ind: any) =>
                  ind && "name" in ind && (ind.name === "MA" || ind.name === "SMA" || ind.name === "EMA" || ind.name === "HMA")
                const applyTo = (ind: any) => {
                  ind.name = MA_NAME
                  ind.input_params = { ma_type: settings.maType, ma_length: settings.maLength }
                }
                let applied = false
                for (const cond of currentStatement.strategy) {
                  if (isMaPlaceholder(cond.inp1)) { applyTo(cond.inp1); applied = true; break }
                  if (isMaPlaceholder(cond.inp2)) { applyTo(cond.inp2); applied = true; break }
                }
                if (!applied) {
                  const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]
                  if (lastCondition && isMaPlaceholder(lastCondition.inp1)) {
                    applyTo(lastCondition.inp1)
                  }
                }
              }

              setStatements(newStatements)
              setShowMaModal(false)
              setEditingComponent(null)
              setPendingTimeframe("3h")
              setTimeout(() => {
                searchInputRefs.current[activeStatementIndex]?.focus()
              }, 100)
            }}
          />
        )}
        {showChannelModal && (
          <ChannelSettingsModal
            onClose={() => setShowChannelModal(false)}
            onSave={(settings) => {
              // Update Channel settings
              const newStatements = [...statements]
              const currentStatement = newStatements[activeStatementIndex]

              if (editingComponent) {
                const condition = currentStatement.strategy[editingComponent.conditionIndex]

                if (condition.operator_name === "inside_channel") {
                  if (settings) {
                    condition.inp2 = {
                      type: "channel",
                      value: settings.value || 0,
                    }
                  }
                }
              } else {
                // Fallback to original behavior
                const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

                if (lastCondition.operator_name === "inside_channel") {
                  if (settings) {
                    lastCondition.inp2 = {
                      type: "channel",
                      value: settings.value || 0,
                    }
                  }
                }
              }

              setStatements(newStatements)
              setShowChannelModal(false)
              setEditingComponent(null)
              setTimeout(() => {
                searchInputRefs.current[activeStatementIndex]?.focus()
              }, 100)
            }}
          />
        )}
        {/* Derivative Settings Modal */}
        {showDerivativeModal && (
          <DerivativeSettingsModal
            onClose={() => setShowDerivativeModal(false)}
            onSave={(settings) => {
              handleDerivativeSettings(settings)
              setShowDerivativeModal(false)
              setTimeout(() => {
                searchInputRefs.current[activeStatementIndex]?.focus()
              }, 100)
            }}
          />
        )}
        {/* SL/TP Settings Modal */}
        {showSLTPSettings.show && (
          <SLTPSettingsModal
            type={showSLTPSettings.type}
            onClose={() => {
              setShowSLTPSettings({ show: false, type: "SL" })
              setEditingEquityRule(null)
            }}
            initialSettings={editingEquityRule ? (() => {
              const rule = statements[editingEquityRule.statementIndex]?.Equity[editingEquityRule.equityIndex]
              if (!rule) return undefined

              // Parse the operator string to extract settings
              const operator = rule.operator || ""
              const type = showSLTPSettings.type

              // Parse different formats:
              // Simple: "SL = Entry_Price - 100pips"
              // Trailing: "inp1 = inp2 - 100pips" with TrailingStop
              // Percentage: "SL = Entry_Price * 0.95"
              // Fixed: "SL = 1800"

              if (rule.inp1 && "name" in rule.inp1 && rule.inp1.input_params?.TrailingStop) {
                // Trailing format
                const pipsMatch = operator.match(/([+-])\s*(\d+)pips/)
                return {
                  formatType: "trailing",
                  value: pipsMatch ? pipsMatch[2] : "100",
                  direction: pipsMatch ? pipsMatch[1] : "-",
                  trailingStop: true,
                  trailingStep: rule.inp1.input_params.TrailingStep?.replace("pips", "") || "0",
                  inp2: rule.inp2 && "name" in rule.inp2 ? rule.inp2.name : "Entry_Price",
                }
              } else if (operator.includes("pips")) {
                // Simple pips format
                const pipsMatch = operator.match(/([+-])\s*(\d+)pips/)
                return {
                  formatType: "simple",
                  valueType: "pips",
                  value: pipsMatch ? pipsMatch[2] : "100",
                  direction: pipsMatch ? pipsMatch[1] : "-",
                }
              } else if (operator.includes("*")) {
                // Percentage format
                const multiplierMatch = operator.match(/\*\s*([\d.]+)/)
                if (multiplierMatch) {
                  const multiplier = parseFloat(multiplierMatch[1])
                  const percentage = type === "SL" ? (1 - multiplier) * 100 : (multiplier - 1) * 100
                  return {
                    formatType: "simple",
                    valueType: "percentage",
                    value: percentage.toFixed(2),
                  }
                }
              } else if (operator.match(/=\s*\d+/)) {
                // Fixed price format
                const valueMatch = operator.match(/=\s*(\d+)/)
                return {
                  formatType: "simple",
                  valueType: "fixed",
                  value: valueMatch ? valueMatch[1] : "1800",
                }
              }

              return undefined
            })() : undefined}
            onSave={(settings) => {
              handleSLTPSettings(settings)
              setShowSLTPSettings({ show: false, type: "SL" })
              setEditingEquityRule(null)
              setTimeout(() => {
                searchInputRefs.current[activeStatementIndex]?.focus()
              }, 100)
            }}
          />
        )}
        {/* Pips Settings Modal */}
        {showPipsModal.show && (
          <PipsSettingsModal
            initialValue={statements[showPipsModal.statementIndex]?.strategy[showPipsModal.conditionIndex]?.pips || 500}
            onClose={() => setShowPipsModal({ show: false, statementIndex: 0, conditionIndex: 0 })}
            currentInp1={statements[showPipsModal.statementIndex]?.strategy[showPipsModal.conditionIndex]?.inp1}
            onSave={(settings) => {
              const newStatements = [...statements]
              const currentStatement = newStatements[showPipsModal.statementIndex]
              const currentCondition = currentStatement.strategy[showPipsModal.conditionIndex]

              if (
                currentCondition.operator_name === "atmost_above_pips" ||
                currentCondition.operator_name === "atmost_below_pips"
              ) {
                const tf = settings.timeframe || "3h"

                if (settings.valueType === "value" && settings.customValue) {
                  currentCondition.inp2 = {
                    type: "value",
                    value: Number(settings.customValue),
                  }
                } else if ((settings.valueType === "indicator" || settings.valueType === "other") && settings.indicator) {
                  switch (settings.indicator) {
                    case "rsi":
                      currentCondition.inp2 = {
                        type: "I",
                        name: "RSI",
                        timeframe: tf,
                        input_params: {
                          timeperiod: settings.rsiLength || 14,
                          source: settings.rsiSource?.toLowerCase() || "close",
                        },
                      }
                      break

                    case "rsi-ma":
                      currentCondition.inp2 = {
                        type: "CUSTOM_I",
                        name: "RSI_MA",
                        timeframe: tf,
                        input_params: {
                          rsi_length: settings.rsiMaLength || 14,
                          rsi_source: settings.rsiSource || "Close",
                          ma_type: settings.maType || "SMA",
                          ma_length: settings.maLength || 14,
                        },
                      }
                      break

                    case "volume-ma":
                      currentCondition.inp2 = {
                        type: "CUSTOM_I",
                        name: "Volume_MA",
                        timeframe: tf,
                        input_params: {
                          ma_length: settings.volumeMaLength || 20,
                        },
                      }
                      break

                    case "bollinger":
                      currentCondition.inp2 = {
                        type: "I",
                        name: "BBANDS",
                        timeframe: tf,
                        input: settings.band || "lowerband",
                        input_params: {
                          timeperiod: settings.timeperiod || 17,
                          source: settings.bbSource || "close",
                          ...(settings.band === "upperband" ? { nbdevup: settings.bbStdDev || 2.0 } : {}),
                          ...(settings.band === "lowerband" ? { nbdevdn: settings.bbStdDev || 2.0 } : {}),
                          ...(settings.band === "middleband" ? { nbdevup: 2.0, nbdevdn: 2.0 } : {}),
                        },
                      }
                      break

                    case "volume":
                      currentCondition.inp2 = createConstantInput("volume", tf)
                      break

                    case "atr":
                      // Use the same settings from inp1 if it's an ATR indicator
                      if (currentCondition.inp1 && currentCondition.inp1.name === "ATR") {
                        const inp1Params = currentCondition.inp1.input_params || {}
                        currentCondition.inp2 = {
                          type: "CUSTOM_I",
                          name: "ATR",
                          timeframe: tf || currentCondition.inp1.timeframe || "3h",
                          input_params: {
                            atr_length: inp1Params.atr_length || 14,
                            atr_smoothing: inp1Params.atr_smoothing || "RMA",
                          },
                        }
                      } else {
                        // Default ATR settings
                        currentCondition.inp2 = {
                          type: "CUSTOM_I",
                          name: "ATR",
                          timeframe: tf,
                          input_params: {
                            atr_length: 14,
                            atr_smoothing: "RMA",
                          },
                        }
                      }
                      break

                    case "stochastic":
                    case "Stochastic":
                    case "stochastic-oscillator":
                      // Use the same settings from inp1 if it's a Stochastic indicator
                      if (currentCondition.inp1 && currentCondition.inp1.name === "Stochastic") {
                        const inp1Params = currentCondition.inp1.input_params || {}
                        // Use stochasticOutput if provided (for %K/%D selection), otherwise use inp1's output
                        const outputValue = (settings as any).stochasticOutput || inp1Params.output || "slowk"
                        currentCondition.inp2 = {
                          type: "CUSTOM_I",
                          name: "Stochastic",
                          timeframe: tf || currentCondition.inp1.timeframe || "3h",
                          input_params: {
                            fastk_period: (settings as any).fastk_period || inp1Params.fastk_period || inp1Params.kLength || 14,
                            slowk_period: (settings as any).slowk_period || inp1Params.slowk_period || inp1Params.kSmoothing || 3,
                            slowd_period: (settings as any).slowd_period || inp1Params.slowd_period || inp1Params.dSmoothing || 3,
                            output: outputValue,
                          },
                        }
                      } else {
                        // Default Stochastic settings
                        currentCondition.inp2 = {
                          type: "CUSTOM_I",
                          name: "Stochastic",
                          timeframe: tf,
                          input_params: {
                            fastk_period: (settings as any).fastk_period || 14,
                            slowk_period: (settings as any).slowk_period || 3,
                            slowd_period: (settings as any).slowd_period || 3,
                            output: (settings as any).stochasticOutput || "slowk",
                          },
                        }
                      }
                      break

                    case "open":
                    case "high":
                    case "low":
                    case "close":
                      currentCondition.inp2 = createConstantInput(settings.indicator, tf)
                      break

                    default:
                      currentCondition.inp2 = createConstantInput(settings.indicator, tf)
                      break
                  }
                }

                currentCondition.pips = Number(settings.pips || 500)
              }

              setStatements(newStatements)
              setShowPipsModal({ show: false, statementIndex: 0, conditionIndex: 0 })

              setTimeout(() => {
                searchInputRefs.current[activeStatementIndex]?.focus()
              }, 100)
            }}
            onNext={(indicator, timeframe) => {
              setShowPipsModal({ show: false, statementIndex: 0, conditionIndex: 0 })
              setPendingOtherIndicator(indicator)
              setPendingTimeframe(timeframe)

              const conditionIndex = showPipsModal.conditionIndex

              if (indicator === "rsi") {
                setShowIndicatorModal(true)
              } else if (indicator === "rsi-ma") {
                setShowIndicatorModal(true)
              } else if (indicator === "bollinger") {
                setPendingBollingerForInp2({
                  statementIndex: showPipsModal.statementIndex,
                  conditionIndex,
                  timeframe,
                });
                setShowBollingerModal(true);
              } else if (indicator === "stochastic" || indicator === "stochastic-oscillator" || indicator === "Stochastic") {
                openStochasticModal(showPipsModal.statementIndex, conditionIndex, "inp2", timeframe)
              } else if (indicator === "volume-ma" || indicator === "volume") {
                setPendingVolumeIndicatorType(indicator === "volume-ma" ? "volume-ma" : "volume")
                setShowVolumeModal(true)
              } else if (indicator === "atr") {
                // Open ATR modal for ATR indicator
                openAtrModal(showPipsModal.statementIndex, conditionIndex, "inp2", timeframe)
              } else if (indicator === "macd") {
                // Open MACD modal for MACD indicator
                setEditingComponent({
                  statementIndex: showPipsModal.statementIndex,
                  conditionIndex,
                  componentType: "inp2",
                })
                setPendingTimeframe(timeframe)
                setShowMacdModal(true)
              } else if (indicator === "supertrend") {
                // Open Super Trend modal for Super Trend indicator
                setEditingComponent({
                  statementIndex: showPipsModal.statementIndex,
                  conditionIndex,
                  componentType: "inp2",
                })
                setPendingTimeframe(timeframe)
                setShowSuperTrendModal(true)
              } else if (indicator === "ma") {
                // Open MA modal for MA indicator
                setEditingComponent({
                  statementIndex: showPipsModal.statementIndex,
                  conditionIndex,
                  componentType: "inp2",
                })
                setPendingTimeframe(timeframe)
                setShowMaModal(true)
              } else if (["close", "open", "high", "low", "price"].includes(indicator)) {
                setShowPriceSettingsModal(true)
              }
            }}
          />
        )}
        {/* Partial TP Modal */}
        {showPartialTPModal && (
          <PartialTPSettingsModal
            onClose={() => setShowPartialTPModal(false)}
            initialLevels={(() => {
              if (editingEquityRule) {
                const rule = statements[editingEquityRule.statementIndex]?.Equity[editingEquityRule.equityIndex]
                const levels = rule?.inp1?.partial_tp_list
                if (levels && Array.isArray(levels)) {
                  return levels.map((lvl: any) => ({ Price: lvl.Price, Close: lvl.Close, Action: lvl.Action }))
                }
              }
              return undefined
            })()}
            onSave={(settings: PartialTPSettings) => {
              const newStatements = [...statements]
              const targetStatementIndex = editingEquityRule ? editingEquityRule.statementIndex : activeStatementIndex
              const currentStatement = newStatements[targetStatementIndex]
              if (!currentStatement.Equity) currentStatement.Equity = []

              // Backend allows only ONE partial_tp block per Equity array
              // (StrategyHelper.py:918). Manage Exit also serializes as
              // partial_tp, so adding a Partial TP alongside a Manage Exit
              // would create a second block and fail validation.
              const conflictIndex = currentStatement.Equity.findIndex((r, i) =>
                i !== editingEquityRule?.equityIndex &&
                (r as any)?.inp1?.name === "partial_tp"
              )
              if (conflictIndex !== -1) {
                toast({
                  variant: "destructive",
                  title: "Only one Partial TP / Manage Exit per statement",
                  description: "Remove the existing Partial TP or Manage Exit rule first, or edit it instead.",
                })
                return
              }

              const newRule: EquityRule = {
                statement: "and",
                inp1: {
                  name: "partial_tp",
                  partial_tp_list: settings.partialTpList.map((lvl) => ({
                    Price: lvl.Price,
                    Close: lvl.Close,
                    ...(lvl.Action ? { Action: lvl.Action } : {}),
                  })),
                },
              }

              if (editingEquityRule) {
                currentStatement.Equity[editingEquityRule.equityIndex] = newRule
              } else {
                currentStatement.Equity.push(newRule)
              }
              setStatements(newStatements)
              setShowPartialTPModal(false)
              setEditingEquityRule(null)
            }}
          />
        )}
        {/* Manage Exit Modal */}
        {showManageExitModal && (
          <ManageExitSettingsModal
            onClose={() => setShowManageExitModal(false)}
            initialItems={(() => {
              if (!editingEquityRule) return undefined
              const rule = statements[editingEquityRule.statementIndex]?.Equity[editingEquityRule.equityIndex]
              // New shape: stored as partial_tp with Close === "100%".
              const ptList = (rule?.inp1 as any)?.partial_tp_list
              if (Array.isArray(ptList) && isManageExitPartialTpShape(rule)) {
                return ptList.map((it: any) => ({ Price: it.Price }))
              }
              // Legacy shape: manage_exit_list with Price + Action. Drop Action.
              const legacy = (rule?.inp1 as any)?.manage_exit_list
              if (Array.isArray(legacy)) {
                return legacy.map((it: any) => ({ Price: it.Price }))
              }
              return undefined
            })()}
            onSave={(settings: ManageExitSettings) => {
              const newStatements = [...statements]
              const targetStatementIndex = editingEquityRule ? editingEquityRule.statementIndex : activeStatementIndex
              const currentStatement = newStatements[targetStatementIndex]
              if (!currentStatement.Equity) currentStatement.Equity = []

              // Backend allows only ONE partial_tp block per Equity array
              // (StrategyHelper.py:918 assertion). Manage Exit now serializes
              // as partial_tp, so block adding/editing a Manage Exit if another
              // partial_tp rule already exists on the same statement.
              const conflictIndex = currentStatement.Equity.findIndex((r, i) =>
                i !== editingEquityRule?.equityIndex &&
                (r as any)?.inp1?.name === "partial_tp"
              )
              if (conflictIndex !== -1) {
                toast({
                  variant: "destructive",
                  title: "Only one Partial TP / Manage Exit per statement",
                  description: "Remove the existing Partial TP or Manage Exit rule first, or edit it instead.",
                })
                return
              }

              const newRule: EquityRule = {
                statement: "and",
                inp1: {
                  name: "partial_tp",
                  partial_tp_list: settings.items.map((it) => ({
                    Price: it.Price,
                    Close: "100%",
                  })),
                },
              }

              if (editingEquityRule) {
                currentStatement.Equity[editingEquityRule.equityIndex] = newRule
              } else {
                currentStatement.Equity.push(newRule)
              }
              setStatements(newStatements)
              setShowManageExitModal(false)
              setEditingEquityRule(null)
            }}
          />
        )}
        {/* Max Trade Duration Modal — writes to statements[0].TradingType.Max_Duration */}
        {showMaxDurationModal && (
          <MaxTradeDurationModal
            onClose={() => setShowMaxDurationModal(false)}
            initialDuration={(statements[0]?.TradingType as any)?.Max_Duration}
            onSave={(value) => {
              setShowMaxDurationModal(false)
              setStatements((prev) => {
                if (prev.length === 0) return prev
                const next = [...prev]
                const first = { ...(next[0] as any) }
                const tt: any = { ...(first.TradingType || {}) }
                if (value && /^\d+:\d+:\d+$/.test(value) && value !== "00:00:00") {
                  tt.Max_Duration = value
                } else {
                  delete tt.Max_Duration
                }
                first.TradingType = tt
                next[0] = first
                return next
              })
              // Reflect immediately in localStorage so other pages see the new cap.
              try {
                const existingRaw = localStorage.getItem("savedStrategy")
                if (existingRaw) {
                  const existing = JSON.parse(existingRaw)
                  const tt: any = { ...(existing.TradingType || {}) }
                  if (value && /^\d+:\d+:\d+$/.test(value) && value !== "00:00:00") {
                    tt.Max_Duration = value
                  } else {
                    delete tt.Max_Duration
                  }
                  existing.TradingType = tt
                  localStorage.setItem("savedStrategy", JSON.stringify(existing))
                }
              } catch (err) {
                console.error("Failed to sync Max_Duration to savedStrategy:", err)
              }
            }}
          />
        )}
        {/* Save Strategy Modal */}
        {showSaveStrategyModal && (
          <SaveStrategyModal
            initialName={strategyName}
            onClose={() => setShowSaveStrategyModal(false)}
            onSaveDraft={handleSaveDraft}
            onProceedToTesting={handleProceedToTesting}
            isSaving={isSavingDraft}
          />
        )}
        {/* Price Settings Modal */}
        {showPriceSettingsModal && (
          <PriceSettingsModal
            onClose={() => setShowPriceSettingsModal(false)}
            onSave={(priceType: string) => {
              setShowPriceSettingsModal(false)
              handlePriceSelection(priceType)
            }}
          />
        )}
        {/* At Candle Modal */}
        {showAtCandleModal && (
          <AtCandleModal
            initialValue={selectedCandleNumber || 1}
            onClose={() => setShowAtCandleModal(false)}
            onSave={(candleNumber) => {
              // Delegate to handleAtCandleSelection — it correctly stores
              // `pendingAtCandle` when the target inp1/inp2 doesn't exist
              // yet (e.g. clicking At Candle on a fresh If row). The earlier
              // inline path silently dropped that case.
              handleAtCandleSelection(candleNumber)
              setShowAtCandleModal(false)
            }}
          />
        )}
        {/* Add the CustomTimeframeModal to the JSX, right before the closing div of the component */}
        {showCustomTimeframeModal && (
          <CustomTimeframeModal
            handleTimeframeSelect={handleTimeframeSelect}
            onClose={() => setShowCustomTimeframeModal(false)}
            setSelectedTimeframe={setSelectedTimeframe}
            selectedTimeframe={selectedTimeframe}
            onSave={handleSaveCustomTimeframe}
          />
        )}
        {/* Trading Session Modal */}
        {showTradingSessionModal && (
          <TradingSessionModal
            onClose={() => setShowTradingSessionModal(false)}
            initial={
              statements[activeStatementIndex]?.TradingSession
                ? {
                  startTime: statements[activeStatementIndex].TradingSession?.Time.input[0] || "09:00",
                  endTime: statements[activeStatementIndex].TradingSession?.Time.input[1] || "17:00",
                  selectedDays: statements[activeStatementIndex].TradingSession?.Day.input.split("") || ["M", "t", "W", "T", "F"],
                }
                : undefined
            }
            onSave={(config: { startTime: string; endTime: string; selectedDays: string[] }) => {
              const newStatements = [...statements]
              const currentStatement = newStatements[activeStatementIndex]
              currentStatement.TradingSession = {
                Timezone: "US/Eastern", // Default timezone
                Day: {
                  Operator: "within",
                  input: config.selectedDays.join(""),
                },
                Time: {
                  Operator: "within",
                  input: [config.startTime, config.endTime],
                },
              }
              setStatements(newStatements)
              setShowTradingSessionModal(false)
            }}
          />
        )}
        {/* Tooltip */}
        {hoveredComponent.show && hoveredComponent.content && (
          <div
            className="fixed z-50 pointer-events-none "
            style={{
              left: hoveredComponent.position.x,
              top: hoveredComponent.position.y,
              transform: "translate(-50%, -100%)", // Position above the element
            }}
          >
            <div className="bg-[#C5C5C5] text-black px-4 py-2 rounded-lg shadow-xl border border-[#4A4D62] animate-in fade-in-0 zoom-in-95 duration-200">
              <div className="text-xs space-y-1">
                {Object.entries(hoveredComponent.content.details).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-4">
                    <span className="text-black/60 capitalize font-medium">{key.replace("_", " ")}:</span>
                    <span className="text-black font-semibold">{String(value)}</span>
                  </div>
                ))}
              </div>
              {/* Tooltip arrow pointing downward */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-[#C5C5C5]"></div>
              </div>
            </div>
          </div>
        )}
        {/* Accumulator Settings Modal */}
        {showAccumulatorModal.show && (
          <AccumulatorSettingsModal
            onClose={() => setShowAccumulatorModal({ show: false, statementIndex: 0, conditionIndex: 0 })}
            initialSettings={(() => {
              const cond = statements[showAccumulatorModal.statementIndex]?.strategy[showAccumulatorModal.conditionIndex]
              const fp = cond?.Accumulate?.forPeriod as string | undefined
              if (!fp) return undefined
              if (fp.startsWith("exactly ")) return { type: "exactly" as const, value: Number(fp.replace("exactly ", "")) }
              if (fp.startsWith("at least ")) return { type: "at least" as const, value: Number(fp.replace("at least ", "")) }
              if (fp.startsWith("up to ")) return { type: "up to" as const, value: Number(fp.replace("up to ", "")) }
              return undefined
            })()}
            onSave={(settings) => {
              const newStatements = [...statements]
              const condition =
                newStatements[showAccumulatorModal.statementIndex].strategy[showAccumulatorModal.conditionIndex]

              // Add the accumulator to the condition
              condition.Accumulate = {
                forPeriod: `${settings.type} ${settings.value}`,
              }

              setStatements(newStatements)
              setShowAccumulatorModal({ show: false, statementIndex: 0, conditionIndex: 0 })
              setTimeout(() => {
                searchInputRefs.current[activeStatementIndex]?.focus()
              }, 100)
            }}
          />
        )}
        {/* Then Settings Modal */}
        {showThenModal.show && (
          <ThenSettingsModal
            onClose={() => setShowThenModal({ show: false, statementIndex: 0, conditionIndex: 0 })}
            onSave={(settings) => {
              const newStatements = [...statements]
              const condition = newStatements[showThenModal.statementIndex].strategy[showThenModal.conditionIndex]

              // Add the then to the condition
              condition.Then = {
                Wait: settings.wait,
                count: settings.count,
                candle: settings.candle,
              }

              setStatements(newStatements)
              setShowThenModal({ show: false, statementIndex: 0, conditionIndex: 0 })
              setTimeout(() => {
                searchInputRefs.current[activeStatementIndex]?.focus()
              }, 100)
            }}
            customTimeframes={customTimeframes}
            onSaveCustomTimeframe={handleSaveCustomTimeframe}
          />
        )}
        {showIndicatorModal && pendingOtherIndicator === "rsi" && (
          <RsiSettingsModal
            onClose={() => setShowIndicatorModal(false)}
            initialSettings={{
              rsiLength: "14",
              source: "Close",
              timeframe: pendingTimeframe,
            }}
            onSave={(settings) => {
              setShowIndicatorModal(false)
              const newStatements = [...statements]
              const currentStatement = newStatements[activeStatementIndex]
              const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]
              lastCondition.inp2 = {
                type: "I",
                name: "RSI",
                timeframe: pendingTimeframe,
                input_params: {
                  timeperiod: Number(settings.rsiLength),
                  source: settings.source?.toLowerCase() || "close",
                },
              }
              setStatements(newStatements)
            }}
          />
        )}
        {showIndicatorModal && pendingOtherIndicator === "rsi-ma" && (
          <RsiMaSettingsModal
            onClose={() => setShowIndicatorModal(false)}
            initialSettings={{
              rsiLength: "14",
              source: "Close",
              maLength: "14",
              maType: "SMA",
              timeframe: pendingTimeframe,
            }}
            onSave={(settings) => {
              setShowIndicatorModal(false)
              const newStatements = [...statements]
              const currentStatement = newStatements[activeStatementIndex]
              const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]
              lastCondition.inp2 = {
                type: "CUSTOM_I",
                name: "RSI_MA",
                timeframe: pendingTimeframe,
                input_params: {
                  rsi_length: Number(settings.rsiLength),
                  rsi_source: settings.source || "Close",
                  ma_type: settings.maType || "SMA",
                  ma_length: Number(settings.maLength) || 14,
                },
              }
              setStatements(newStatements)
            }}
          />
        )}

        {/* Moving Operator Settings Modal */}
        {showMovingOperatorModal.show && (
          <MovingOperatorSettingsModal
            onClose={() => setShowMovingOperatorModal({ show: false, statementIndex: 0, conditionIndex: 0 })}
            operatorType={(() => {
              const condition = statements[showMovingOperatorModal.statementIndex]?.strategy[showMovingOperatorModal.conditionIndex]
              return condition?.operator_name as "moving_up" | "moving_down"
            })()}
            initialSettings={(() => {
              const condition = statements[showMovingOperatorModal.statementIndex]?.strategy[showMovingOperatorModal.conditionIndex]
              if (condition?.Operator) {
                return {
                  logical_operator: condition.Operator.params.logical_operator,
                  value: condition.Operator.params.value,
                  unit: condition.Operator.params.unit,
                }
              }
              return undefined
            })()}
            onSave={(settings) => {
              const newStatements = [...statements]
              const condition = newStatements[showMovingOperatorModal.statementIndex].strategy[showMovingOperatorModal.conditionIndex]
              const operatorType = condition.operator_name as "moving_up" | "moving_down"

              // Update the operator structure
              condition.Operator = {
                operator_name: operatorType,
                params: {
                  logical_operator: settings.logical_operator,
                  value: settings.value,
                  unit: settings.unit,
                },
              }

              setStatements(newStatements)
              setShowMovingOperatorModal({ show: false, statementIndex: 0, conditionIndex: 0 })
              setTimeout(() => {
                searchInputRefs.current[activeStatementIndex]?.focus()
              }, 100)
            }}
          />
        )}

        {showStochasticModal && (
          <StochasticSettingsModal
            onClose={() => {
              setShowStochasticModal(false)
              setEditingComponent(null)
              setStochasticModalTarget(null)
              setPendingTimeframe("3h")
            }}
            initialSettings={getStochasticInitialSettings()}
            onSave={applyStochasticSettings}
          />
        )}

        {/* Edit Strategy Name Modal */}
        {showEditNameModal && (
          <EditStrategyModal
            strategy={{
              id: strategyId || localStorage.getItem("strategy_id") || "0",
              name: strategyName,
              instrument: initialInstrument || "XAU/USD",
              side: statements[0]?.side || "S",
              strategy: statements[0]?.strategy || [],
              equity: statements[0]?.Equity || [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }}
            isEdit={true}
            onClose={() => setShowEditNameModal(false)}
            onSave={handleEditStrategyName}
          />
        )}

        {/* Developer Mode Full Page */}
        {showDeveloperModeModal && (
          <div className="fixed inset-0 z-50 bg-[#141721]">
            <DeveloperModePage
              onBack={async () => {
                setShowDeveloperModeModal(false)
                setEditingCustomComponent(null)
                setCurrentComponentId(null)
                // Refresh custom components list when returning from developer mode
                try {
                  const components = await listCustomComponents()
                  // Dispatch event to notify sidebar to refresh
                  window.dispatchEvent(new CustomEvent('refresh-custom-components', { detail: components }))
                } catch (error) {
                  console.error('Failed to refresh custom components:', error)
                }
              }}
              onCompile={handleDeveloperModeCompile}
              onSave={handleDeveloperModeSave}
              onGoToBacktest={(strategyId) => {
                // Close developer mode and navigate to backtesting
                setShowDeveloperModeModal(false)
                setEditingCustomComponent(null)
                setCurrentComponentId(null)
                // Navigate to strategy testing page with the custom strategy ID
                router.push(`/strategy-testing?id=${strategyId}&custom=true`)
              }}
              onLoadStrategies={async () => {
                // Load custom strategies list
                const strategies = await listCustomStrategies()
                return strategies
              }}
              onDeleteStrategy={async (strategyId) => {
                // Delete a custom strategy
                await deleteCustomStrategy(strategyId)
              }}
              onLoadStrategy={async (strategyId) => {
                // Load a specific custom strategy for editing
                const strategy = await getCustomStrategy(strategyId)
                return { code: strategy.code || strategy.compiled_code || "", name: strategy.name }
              }}
              editingComponent={editingCustomComponent}
            />
          </div>
        )}

        {pendingCustomInsert && (
          <CustomComponentPropertiesDialog
            open={true}
            componentName={pendingCustomInsert.componentName}
            componentType={pendingCustomInsert.kind}
            parameterSchemas={pendingCustomInsert.schemas}
            componentId={pendingCustomInsert.componentId}
            initialTimeframe={selectedTimeframe || "1h"}
            onClose={() => setPendingCustomInsert(null)}
            onSave={(result) => {
              commitCustomInsert(pendingCustomInsert, result)
              setPendingCustomInsert(null)
            }}
          />
        )}

        {editingCustomBlock && (
          <CustomComponentPropertiesDialog
            open={true}
            componentName={editingCustomBlock.componentName}
            componentType={editingCustomBlock.kind}
            componentId={editingCustomBlock.componentId}
            initialValues={editingCustomBlock.initialValues}
            initialTimeframe={editingCustomBlock.initialTimeframe}
            initialInput={editingCustomBlock.initialInput}
            onClose={() => setEditingCustomBlock(null)}
            onSave={(result) => {
              applyCustomBlockEdit(editingCustomBlock, result)
              setEditingCustomBlock(null)
            }}
          />
        )}
      </div>
    </TooltipProvider>
  )
}
