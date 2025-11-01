"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Edit, MoreVertical, Plus, ChevronDown, X } from 'lucide-react'
import { StochasticSettingsModal } from "@/components/modals/stochastic-settings-modal"
import { CrossingUpSettingsModal } from "@/components/modals/crossing-up-settings-modal"
import { BollingerBandsSettingsModal } from "@/components/modals/bollinger-bands-settings-modal"
import { VolumeSettingsModal } from "@/components/modals/volume-settings-modal"
import { AtrSettingsModal } from "@/components/modals/atr-settings-modal"
import { MacdSettingsModal } from "@/components/modals/macd-settings-modal"
import { RsiSettingsModal } from "@/components/modals/rsi-settings-modal"
import { ChannelSettingsModal } from "@/components/modals/channel-settings-modal"
import { SLTPSettingsModal, type SLTPSettings } from "@/components/modals/sl-tp-settings-modal"
import { PriceSettingsModal } from "@/components/modals/price-settings-modal"
import { AtCandleModal } from "@/components/modals/at-candle-modal"
import { DerivativeSettingsModal } from "@/components/modals/derivative-settings-modal"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createStatement, editStrategy } from "@/app/AllApiCalls"
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
}

// Update the StrategyStatement interface to include TradingType
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
}

export function StrategyBuilder({ initialName, initialInstrument, strategyData, strategyId }: StrategyBuilderProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("create")
  const [showStochasticModal, setShowStochasticModal] = useState(false)
  const [showCrossingUpModal, setShowCrossingUpModal] = useState(false)
  const [showCrossingDownModal, setShowCrossingDownModal] = useState(false)
  const [showAboveModal, setShowAboveModal] = useState(false)
  const [showBelowModal, setShowBelowModal] = useState(false)
  const [showBollingerModal, setShowBollingerModal] = useState(false)
  const [showVolumeModal, setShowVolumeModal] = useState(false)
  const [showAtrModal, setShowAtrModal] = useState(false)
  const [showMacdModal, setShowMacdModal] = useState(false)
  const [showRsiModal, setShowRsiModal] = useState(false)
  const [showChannelModal, setShowChannelModal] = useState(false)
  const [showSLTPSettings, setShowSLTPSettings] = useState<{ show: boolean; type: "SL" | "TP" }>({
    show: false,
    type: "SL",
  })
  const [showPartialTPModal, setShowPartialTPModal] = useState(false)
  const [showManageExitModal, setShowManageExitModal] = useState(false)
  const [showDerivativeModal, setShowDerivativeModal] = useState(false)

  const [showSaveStrategyModal, setShowSaveStrategyModal] = useState(false)
  const [strategyName, setStrategyName] = useState(initialName || "")
  const [showPriceSettingsModal, setShowPriceSettingsModal] = useState(false)
  const [showAtCandleModal, setShowAtCandleModal] = useState(false)
  const [selectedCandleNumber, setSelectedCandleNumber] = useState<number | null>(null)

  // Initialize with a statement structure that includes "if" and default TradingType settings
  const [statements, setStatements] = useState<StrategyStatement[]>([
    {
      side: "S",
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

  // Load strategy data if strategyId is provided
  useEffect(() => {
    if (strategyData && strategyId) {
      try {
        // If strategyData has the expected structure, use it
        if (strategyData.strategy) {
          const loadedStatements = [
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

          setStatements(loadedStatements)

          // Initialize waitStatus based on loaded strategy data
          const newWaitStatus: Record<number, { inp1: boolean; inp2: boolean }> = {}
          loadedStatements.forEach((statement, statementIndex) => {
            newWaitStatus[statementIndex] = { inp1: false, inp2: false }

            // Check each condition in the strategy for wait parameters
            statement.strategy.forEach((condition: StrategyCondition) => {
              // Check inp1 for wait parameter
              if (
                condition.inp1 &&
                typeof condition.inp1 === "object" &&
                "wait" in condition.inp1 &&
                condition.inp1.wait === "yes"
              ) {
                newWaitStatus[statementIndex].inp1 = true
              }

              // Check inp2 for wait parameter
              if (
                condition.inp2 &&
                typeof condition.inp2 === "object" &&
                "wait" in condition.inp2 &&
                condition.inp2.wait === "yes"
              ) {
                newWaitStatus[statementIndex].inp2 = true
              }
            })
          })

          setWaitStatus(newWaitStatus)
        }

        // Set strategy name if available
        if (strategyData.name) {
          setStrategyName(strategyData.name)
        }

        // Set instrument if available
        if (strategyData.instrument) {
          // You can add logic here to update instrument if needed
        }
      } catch (error) {
        console.error("Error loading strategy data:", error)
      }
    }
  }, [strategyData, strategyId])

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

    // Combine all component types for searching
    const allComponents = [
      ...basicComponents.map((c) => c.label),
      ...extraBasicComponents.map((c) => c.label),
      ...indicators.map((c) => c.label),
      ...extraIndicators.map((c) => c.label),
      ...behaviours.map((c) => c.label),
      ...actions.map((c) => c.label),
      ...tradeManagement.map((c) => c.label),
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
    // Handle backspace for component removal (existing functionality)
    if (e.key === "Backspace" && searchTerm === "") {
      e.preventDefault()

      const currentStatement = statements[statementIndex]
      const strategy = currentStatement.strategy

      if (strategy.length === 0) return

      // Find the last condition that has removable components
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
    }

    // Handle arrow keys for search result navigation
    else if (searchResults.length > 0) {
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
    { id: "high", label: "Price High" },
    { id: "low", label: "Price Low" },
    { id: "open", label: "Price Open" },
    { id: "close", label: "Price Close" },
    { id: "macd", label: "MACD" },
    { id: "bollinger", label: "Bollinger" },
    { id: "price", label: "Price" },
    { id: "stochastic", label: "Stochastic" },
    { id: "atr", label: "ATR" },
    { id: "general-pa", label: "GENERAL PA" },
    { id: "gradient", label: "Gradient" },
    { id: "derivative", label: "Derivative" },
  ]

  const extraIndicators = [
    { id: "ma", label: "MA" },
    { id: "volume-ma", label: "Volume_MA" },
    { id: "rsi-ma", label: "RSI_MA" },
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
    { id: "long", label: "Long" },
    { id: "short", label: "Short" },
    { id: "wait", label: "Wait" },
    { id: "sl", label: "SL" },
    { id: "tp", label: "TP" },
    { id: "partial-tp", label: "Partial TP" },
    { id: "manage-exit", label: "Manage Exit" },
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
    newStatements.push({
      side: "s",
      saveresult: `Statement ${statements.length + 1}`,
      strategy: [
        {
          statement: "if",
          // Remove default timeframe - let user add it explicitly
        },
      ],
      Equity: [],
    })
    setStatements(newStatements)
  }

  // Function to map component labels to statement structure
  const getStatementType = (component: string) => {
    if (component.toLowerCase() === "if") return "if"
    if (component.toLowerCase() === "and") return "and"
    if (component.toLowerCase() === "or") return "or"
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

    switch (componentType) {
      case "inp1":
        if (condition.inp1 && "name" in condition.inp1) {
          if (condition.inp1.name === "RSI" || condition.inp1.name === "RSI_MA") {
            setShowRsiModal(true)
          } else if (condition.inp1.name === "BBANDS") {
            setShowBollingerModal(true)
          } else if (condition.inp1.name === "MACD") {
            setShowMacdModal(true)
          } else if (condition.inp1.name === "Volume_MA") {
            setShowVolumeModal(true)
          } else if (condition.inp1.name === "ATR") {
            setShowAtrModal(true)
          } else if (condition.inp1.name === "Stochastic") {
            setShowStochasticModal(true)
          }
        } else if (condition.inp1 && "input" in condition.inp1) {
          if (condition.inp1.input === "volume") {
            setShowVolumeModal(true)
          } else if (["open", "close", "high", "low"].includes(condition.inp1.input?.toLowerCase() || "")) {
            setShowPriceSettingsModal(true)
          }
        }
        break

      case "inp2":
        if (condition.inp2 && "name" in condition.inp2) {
          if (condition.inp2.name === "RSI" || condition.inp2.name === "RSI_MA") {
            setShowRsiModal(true)
          } else if (condition.inp2.name === "BBANDS") {
            setShowBollingerModal(true)
          } else if (condition.inp2.name === "MACD") {
            setShowMacdModal(true)
          } else if (condition.inp2.name === "Volume_MA") {
            setShowVolumeModal(true)
          }
        } else if (condition.inp2 && "input" in condition.inp2) {
          if (condition.inp2.input === "volume") {
            setShowVolumeModal(true)
          } else if (typeof condition.inp2.input === "string" && ["open", "close", "high", "low"].includes(condition.inp2.input.toLowerCase())) {
            setShowPriceSettingsModal(true)
          }
        }
        break

      case "operator":
        if (condition.operator_name === "crossabove" || condition.operator_name === "crossbelow") {
          if (condition.operator_name === "crossabove") {
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
    const currentStatement = newStatements[activeStatementIndex]

    // Make sure Equity array exists
    if (!currentStatement.Equity) {
      currentStatement.Equity = []
    }

    // Create the new equity rule
    let equityRule: EquityRule

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
          operator: `${settings.type} = inp2 ${settings.direction} ${settings.value}pips`,
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
          const conditionOperator = { ...strategy[conditionIndex] }
          delete conditionOperator.operator_name
          delete conditionOperator.operator
          delete conditionOperator.Operator
          strategy[conditionIndex] = conditionOperator
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
        case "statement":
          console.log("Before splice - strategy length:", strategy.length, "conditionIndex:", conditionIndex)
          strategy.splice(conditionIndex, 1)
          console.log("After splice - strategy length:", strategy.length)
          break
        default:
          break
      }

      statement.strategy = strategy
      newStatements[statementIndex] = statement

      return newStatements
    })
  }

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

  // Update the handleAddComponent function to move the timeframe into inp1 and remove it from the condition
  const handleAddComponent = (statementIndex: number, component: string) => {
    const newStatements = [...statements]
    const currentStatement = newStatements[statementIndex]

    // If the component is a price option, add as inp1 with correct structure
    if (["Price Open", "Price Close", "Price Low", "Price High"].includes(component)) {
      const priceType = component.split(" ")[1].toLowerCase()
      const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]
      lastCondition.inp1 = {
        type: "C",
        input: priceType,
        timeframe: selectedTimeframe || "12min",
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
          console.warn("Please select a behavior first before adding a then condition")
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
      } else if ((statementType === "and" || statementType === "or") && currentStatement.strategy.length > 0) {
        // Add "and" or "or" statement
        currentStatement.strategy.push({
          statement: statementType,
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
      extraIndicators.some((c) => c.label.toLowerCase() === component.toLowerCase())
    ) {
      // Adding an indicator
      if (currentStatement.strategy.length > 0) {
        const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

        // Special handling for "price" component - it should go to inp1 if no inp1 exists
        if (component.toLowerCase() === "price") {
          // Show the Price Settings modal for inp1
          setShowPriceSettingsModal(true)
          setActiveStatementIndex(statementIndex)
        } else
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
            lastCondition.inp2 = {
              type: "C",
              input: "volume",
              timeframe: timeframe,
            }
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
          } else if (component.toLowerCase() === "gradient" || component.toLowerCase() === "derivative") {
            // Show the Derivative Settings modal
            setActiveStatementIndex(statementIndex)
            // Pass the current indicator data to the modal
            const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]
            if (lastCondition.inp1) {
              // We're adding derivative to an existing indicator
              setShowDerivativeModal(true)
            } else {
              // No indicator selected yet, show error or default behavior
              console.warn("Please select an indicator first before adding a derivative")
            }
          } else if (component.includes("MA") || component.includes("_MA")) {
            // Special handling for Volume_MA to preserve proper casing
            let indicatorName = component.toUpperCase().replace("-", "_");
            if (component.toLowerCase() === "volume_ma" || component.toLowerCase() === "volume-ma") {
              indicatorName = "Volume_MA";
            }
            
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
                lastCondition.inp2 = {
                  type: "C",
                  input: lastCondition.inp1.input || "close",
                  timeframe: timeframe,
                }
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
              lastCondition.inp2 = {
                type: "C",
                input: component.toLowerCase(),
                timeframe: timeframe,
              }
            } else {
              lastCondition.inp2 = {
                type: "C",
                input: component.toLowerCase(),
                timeframe: timeframe,
              }
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
            lastCondition.inp1 = {
              type: "C",
              input: "volume",
              timeframe: timeframe,
            }
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
          } else if (component.toLowerCase() === "gradient" || component.toLowerCase() === "derivative") {
            // Show the Derivative Settings modal
            setActiveStatementIndex(statementIndex)
            // Pass the current indicator data to the modal
            const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]
            if (lastCondition.inp1) {
              // We're adding derivative to an existing indicator
              setShowDerivativeModal(true)
            } else {
              // No indicator selected yet, show error or default behavior
              console.warn("Please select an indicator first before adding a derivative")
            }
          } else if (component.includes("MA") || component.includes("_MA")) {
            // Format for custom indicators like Volume_MA
            // Special handling for Volume_MA to preserve proper casing
            let indicatorName = component.toUpperCase().replace("-", "_");
            if (component.toLowerCase() === "volume_ma" || component.toLowerCase() === "volume-ma") {
              indicatorName = "Volume_MA";
            }
            
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
              lastCondition.inp1 = {
                type: "C",
                input: component.toLowerCase(),
                timeframe: timeframe,
              }
            } else if (component.toLowerCase() === "price") {
              // Show the Price Settings modal
              setShowPriceSettingsModal(true)
            } else {
              // Keep the existing handling for other indicators
              lastCondition.inp1 = {
                type: "C",
                input: component.toLowerCase(),
                timeframe: timeframe,
              }
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
          if (
            component.toLowerCase() === "rsi" ||
            component.toLowerCase() === "rsi_ma" ||
            component.toLowerCase() === "rsi-ma"
          ) {
            setShowRsiModal(true)
          } else if (component === "Stochastic") {
            setShowStochasticModal(true)
          } else if (component === "Bollinger") {
            setShowBollingerModal(true)
          } else if (component.toLowerCase() === "volume") {
            setShowVolumeModal(true)
          } else if (component === "ATR") {
            setShowAtrModal(true)
          } else if (component === "MACD") {
            setShowMacdModal(true)
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
          console.warn("Please select a behavior first before adding a then condition")
        }
      }
    } else if (behaviours.some((c) => c.label.toLowerCase() === component.toLowerCase())) {
      // Adding a behavior
      if (currentStatement.strategy.length > 0) {
        const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

        // Add the behavior to the last condition
        lastCondition.operator_name = getOperatorName(component)
        lastCondition.operator_display = component // Store the original display label

        // Handle moving operators with new structure
        if (lastCondition.operator_name === "moving_up" || lastCondition.operator_name === "moving_down") {
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
    } else if (component.toLowerCase() === "long" || component.toLowerCase() === "short") {
      // Set the side based on Long/Short selection
      currentStatement.side = component.toLowerCase() === "long" ? "B" : "S"
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
    }

    setStatements(newStatements)
    setActiveStatementIndex(statementIndex)

    // Clear search after adding component
    setSearchTerm("")
    setSearchResults([])
    searchInputRefs.current[statementIndex]?.focus()
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
              bb_stddev: inp1.input_params?.bb_stddev || 2.0,
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
        } else if (inp1.name === "MACD") {
          return {
            title: "MACD",
            details: {
              fastperiod: inp1.input_params?.fastperiod || 12,
              slowperiod: inp1.input_params?.slowperiod || 26,
              signalperiod: inp1.input_params?.signalperiod || 9,
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
        } else if (inp1.name === "GENERAL_PA") {
          return {
            title: "General PA",
            details: {
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
            bb_stddev: inp2.input_params?.bb_stddev || 2.0,
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
      } else if ("name" in inp2 && inp2.name === "BBANDS") {
        return {
          title: "Bollinger Bands",
          details: {
            timeperiod: inp2.input_params?.timeperiod || 17,
            input: inp2.input || "upperband",
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
    componentType: "inp1" | "inp2" | "timeframe" | "then",
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
        // Prevent timeframe changes for inp2
        if (activeInputType === "inp2") {
          setShowTimeframeDropdown(false)
          return;
        }
      
        const newStatements = [...statements]
        const currentStatement = newStatements[activeStatementIndex]
        const condition = currentStatement.strategy[activeConditionIndex]

        if (condition) {
          // Update the correct timeframe based on input type
          if (activeInputType === "inp1" && condition.inp1 && "timeframe" in condition.inp1) {
            condition.inp1.timeframe = timeframe
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
  // Prevent opening timeframe dropdown for inp2
  if (inputType === "inp2") {
    return;
  }
  
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

  const handleSaveDraft = async (name: string) => {
    try {
      setIsSavingDraft(true)
      const currentStatement = statements[activeStatementIndex]

      // Clean up any Volume_MA indicators before saving
      const cleanedStrategy = currentStatement.strategy.map((condition: any) => ({
        ...condition,
        inp1: cleanupVolumeMAIndicator(condition.inp1),
        inp2: cleanupVolumeMAIndicator(condition.inp2),
      }))

      // Create the statement object to send to the API with the structure you want
      const apiStatement: any = {
        name: name,
        side: currentStatement.side,
        saveresult: currentStatement.saveresult || "Statement 1",
        strategy: cleanedStrategy,
        Equity: currentStatement.Equity || [],
        instrument: initialInstrument,
        TradingType: currentStatement.TradingType || {
          NewTrade: "MTOOTAAT",
          commission: 0.00007,
          margin: 1,
          lot: "mini",
          cash: 100000,
          nTrade_max: 1,
        },
        // Add TradingSession if it exists in the current statement
        ...(currentStatement.TradingSession && { TradingSession: currentStatement.TradingSession }),
      }

      // Debug: Log the API statement to verify TradingType and TradingSession are included
      console.log("🔍 DEBUG: API Statement being sent:", JSON.stringify(apiStatement, null, 2))
      console.log("🔍 DEBUG: Strategy conditions with wait properties:")
      apiStatement.strategy.forEach((condition: any, index: number) => {
        console.log(`  Condition ${index}:`, {
          inp1_wait: condition.inp1?.wait,
          inp2_wait: condition.inp2?.wait,
          inp1: condition.inp1,
          inp2: condition.inp2
        })
      })

      let result

      // Rule: if localStorage has strategy_id, EDIT; else if URL has one, EDIT; otherwise CREATE
      let existingId: string | null = null
      try { existingId = localStorage.getItem("strategy_id") } catch {}
      if (!existingId) existingId = strategyId || null

      if (existingId) {
        result = await editStrategy(existingId, apiStatement)
      } else {
        const account = localStorage.getItem("user_id")
        if (!account) {
          throw new Error("No account found in localStorage")
        }
        result = await createStatement({ account, statement: apiStatement })
        if (result && result.id) {
          localStorage.setItem("strategy_id", result.id)
          // persist id so subsequent saves use edit
        }
      }

      setIsSavingDraft(false)
      setShowSaveStrategyModal(false)
    } catch (error) {
      console.error("Error saving strategy:", error)
      setIsSavingDraft(false)
    }
  }

  // Replace the handleContinue function with this updated version
  const handleContinue = () => {
    setShowSaveStrategyModal(true)
  }

  const handleProceedToTesting = async (name: string) => {
    try {
      setIsProceeding(true)
      const currentStatement = statements[activeStatementIndex]

      // Clean up any Volume_MA indicators before saving
      const cleanedStrategy = currentStatement.strategy.map((condition: any) => ({
        ...condition,
        inp1: cleanupVolumeMAIndicator(condition.inp1),
        inp2: cleanupVolumeMAIndicator(condition.inp2),
      }))

      // Create the statement object to send to the API with the structure you want
      const apiStatement: any = {
        name: name,
        side: currentStatement.side,
        saveresult: currentStatement.saveresult || "Statement 1",
        strategy: cleanedStrategy,
        Equity: currentStatement.Equity || [],
        instrument: initialInstrument,
        TradingType: currentStatement.TradingType || {
          NewTrade: "MTOOTAAT",
          commission: 0.00007,
          margin: 1,
          lot: "mini",
          cash: 100000,
          nTrade_max: 1,
        },
        // Add TradingSession if it exists in the current statement
        ...(currentStatement.TradingSession && { TradingSession: currentStatement.TradingSession }),
      }

      // Debug: Log the API statement to verify TradingType and TradingSession are included
      console.log("🔍 DEBUG: API Statement being sent (Proceed to Testing):", JSON.stringify(apiStatement, null, 2))
      console.log("🔍 DEBUG: Strategy conditions with wait properties (Proceed to Testing):")
      apiStatement.strategy.forEach((condition: any, index: number) => {
        console.log(`  Condition ${index}:`, {
          inp1_wait: condition.inp1?.wait,
          inp2_wait: condition.inp2?.wait,
          inp1: condition.inp1,
          inp2: condition.inp2
        })
      })

      // Save the complete statement for local use
      localStorage.setItem("savedStrategy", JSON.stringify(apiStatement))

      let result

      // Rule on proceed: if localStorage has strategy_id, EDIT; else if URL has one, EDIT; otherwise CREATE
      let existingId: string | null = null
      try { existingId = localStorage.getItem("strategy_id") } catch {}
      if (!existingId) existingId = strategyId || null

      if (existingId) {
        result = await editStrategy(existingId, apiStatement)
        localStorage.setItem("strategy_id", existingId)
      } else {
        const account = localStorage.getItem("user_id")
        if (!account) {
          throw new Error("No account found in localStorage")
        }
        result = await createStatement({ account, statement: apiStatement })
        if (result && result.id) {
          localStorage.setItem("strategy_id", result.id)
          // persist id so subsequent saves use edit
        }
      }

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
      } catch {}
      router.push("/strategy-testing")
    } catch (error) {
      console.error("Error processing strategy:", error)
      setIsProceeding(false)
    }
  }

  // Update the toggleWaitParameter function to handle adding wait parameter if it doesn't exist
  // This function should be around line 1500-1550

  function toggleWaitParameter(statementIndex: number, conditionIndex: number, inputType: "inp1" | "inp2") {
    const newStatements = [...statements]
    const currentStatement = newStatements[statementIndex]
    const condition = currentStatement.strategy[conditionIndex]

    // Initialize waitStatus for this statement if it doesn't exist
    if (!waitStatus[statementIndex]) {
      waitStatus[statementIndex] = { inp1: false, inp2: false }
    }

    if (inputType === "inp1" && condition.inp1) {
      // Add or toggle wait parameter for inp1
      if ("wait" in condition.inp1) {
        // Toggle if it already exists
        condition.inp1.wait = condition.inp1.wait === "yes" ? undefined : "yes"
      } else {
        // Add it if it doesn't exist
        if (typeof condition.inp1 === "object") {
          condition.inp1.wait = "yes"
        }
      }
    } else if (inputType === "inp2" && condition.inp2 && typeof condition.inp2 !== "string" && "type" in condition.inp2) {
      // Add or toggle wait for inp2
      if ("wait" in condition.inp2) {
        // Toggle if it already exists
        condition.inp2.wait = condition.inp2.wait === "yes" ? undefined : "yes"
      } else {
        // Add it if it doesn't exist
        condition.inp2.wait = "yes"
      }
    }

    // Update the waitStatus state to reflect the change
    const newWaitStatus = { ...waitStatus }
    if (!newWaitStatus[statementIndex]) {
      newWaitStatus[statementIndex] = { inp1: false, inp2: false }
    }
    
    // Update the specific input wait status
    if (inputType === "inp1") {
      newWaitStatus[statementIndex].inp1 = condition.inp1 && "wait" in condition.inp1 && condition.inp1.wait === "yes"
    } else if (inputType === "inp2") {
      newWaitStatus[statementIndex].inp2 = condition.inp2 && typeof condition.inp2 === "object" && "wait" in condition.inp2 && condition.inp2.wait === "yes"
    }

    setWaitStatus(newWaitStatus)
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

    // Create or update inp1 with the selected price type
    lastCondition.inp1 = {
      type: "C",
      input: priceType.toLowerCase(),
      timeframe: selectedTimeframe || "12min",
    }

    setStatements(newStatements)
  }

  // Update the renderStrategyConditions function to properly display At Candle components
  // Replace the existing At Candle rendering code with this:
  const renderStrategyConditions = (statement: StrategyStatement) => {
    const components: JSX.Element[] = []

    // Add each condition with appropriate background
    statement.strategy.forEach((condition, index) => {
      // Skip rendering "if" statements but keep "and" statements
      if (condition.statement && condition.statement.toLowerCase() !== "if") {
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
              className={`px-2 py-1 text-xs rounded-md transition-all duration-200 ${
                condition.inp1 && "wait" in condition.inp1 && condition.inp1.wait === "yes"
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
        
        // For moving operators with new structure, show the full configuration
        if (condition.Operator && (condition.operator_name === "moving_up" || condition.operator_name === "moving_down")) {
          const params = condition.Operator.params
          operatorDisplay = `${condition.Operator.operator_name.replace("_", " ")} ${params.logical_operator} ${params.value}${params.unit}`
        }
        
        components.push(
          <div
            key={`operator-${index}`}
            className="bg-[#C5C5C5] text-black px-3 py-2 mt-3 rounded-md mr-2 mb-2 relative group transition-all duration-200 hover:bg-[#D5D5D5] cursor-pointer"
            onMouseEnter={(e) => handleMouseEnter(e, condition, "operator", index)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleComponentClick(activeStatementIndex, index, "operator")}
          >
            {operatorDisplay}
            <button
              onClick={(e) => {
                e.stopPropagation()
                removeComponent(activeStatementIndex, index, "operator")
              }}
              className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <X className="w-3 h-3" />
            </button>
          </div>,
        )
      }

// Show timeframe for inp2 if it exists
if (
  condition.inp2 &&
  typeof condition.inp2 === "object" &&
  "timeframe" in condition.inp2 &&
  condition.inp2.timeframe
) {
  components.push(
    <div key={`inp2-timeframe-${index}`} className="mr-2 mb-2 relative group">
      <div className="text-xs text-gray-400 mb-1">Timeframe </div>
      <div
        className="bg-[#151718] text-white px-3 py-2 rounded-md flex items-center justify-between min-w-[160px] border border-[#2A2D42] opacity-60 cursor-not-allowed"
        data-inp2-timeframe-index={index}
      >
        <span className="text-gray-400">{condition.inp2.timeframe}</span>
      </div>
    </div>,
  )
}

      // Show inp2 value for all behaviors
      if (condition.inp2) {
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
          }
        } else if ("name" in condition.inp2) {
          // Handle cases where inp2 has a name property but no type
          let displayName = condition.inp2.name
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
              className={`px-2 py-1 text-xs rounded-md transition-all duration-200 ${
                condition.inp2 && "wait" in condition.inp2 && condition.inp2.wait === "yes"
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

    return components
  }

  // Function to render equity rules
  const renderEquityRules = (statement: StrategyStatement) => {
    if (!statement.Equity || statement.Equity.length === 0) {
      return null
    }

    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Equity Rules</h4>
        <div className="flex flex-wrap gap-2">
          {statement.Equity.map((rule, index) => {
            const isPartialTP = !!(rule.inp1 && rule.inp1.name === "partial_tp" && rule.inp1.partial_tp_list)
            const isManageExit = !!(rule.inp1 && rule.inp1.name === "manage_exit" && (rule.inp1 as any).manage_exit_list)

            const label = isPartialTP
              ? `Partial TP (${rule.inp1?.partial_tp_list?.length || 0})`
              : isManageExit
                ? `Manage Exit (${(rule.inp1 as any).manage_exit_list?.length || 0})`
                : (rule.operator || "Equity Rule")

            return (
              <div 
                key={index} 
                className="bg-[#2A2D42] text-white px-3 py-1 rounded-md relative group cursor-pointer hover:bg-[#3A3D52] transition-colors"
                onClick={() => {
                  if (isPartialTP) {
                    setEditingEquityRule({ statementIndex: activeStatementIndex, equityIndex: index })
                    setShowPartialTPModal(true)
                    return
                  }
                  if (isManageExit) {
                    setEditingEquityRule({ statementIndex: activeStatementIndex, equityIndex: index })
                    setShowManageExitModal(true)
                    return
                  }
                  handleEquityRuleClick(activeStatementIndex, index, rule)
                }}
                onMouseEnter={(e) => {
                  // Build tooltip content for partial TP / manage exit
                  if (isPartialTP || isManageExit) {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                    const details: Record<string, string> = {}

                    if (isPartialTP && rule.inp1?.partial_tp_list) {
                      rule.inp1.partial_tp_list.forEach((lvl, i) => {
                        details[`Level ${i + 1}`] = `${lvl.Price} | Close: ${lvl.Close}${lvl.Action ? ` | Action: ${lvl.Action}` : ""}`
                      })
                    }

                    if (isManageExit && (rule.inp1 as any).manage_exit_list) {
                      const list = (rule.inp1 as any).manage_exit_list as Array<{ Price: string; Action: string }>
                      list.forEach((it, i) => {
                        details[`Rule ${i + 1}`] = `${it.Price} | ${it.Action}`
                      })
                    }

                    setHoveredComponent({
                      show: true,
                      content: {
                        title: isPartialTP ? "Partial TP list" : "Manage Exit",
                        details,
                      },
                      position: {
                        x: rect.left + rect.width / 2,
                        y: rect.top - 3,
                      },
                    })
                  }
                }}
                onMouseLeave={handleMouseLeave}
              >
                {label}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const newStatements = [...statements]
                    newStatements[activeStatementIndex].Equity.splice(index, 1)
                    setStatements(newStatements)
                  }}
                  className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Function to handle equity rule click for editing
  const handleEquityRuleClick = (statementIndex: number, equityIndex: number, rule: EquityRule) => {
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

  // Listen for component selection events from the sidebar
  useEffect(() => {
    const handleComponentSelected = (e: CustomEvent) => {
      const { component, statementIndex } = e.detail
      handleAddComponent(statementIndex, component)
    }

    document.addEventListener("component-selected", handleComponentSelected as EventListener)

    return () => {
      document.removeEventListener("component-selected", handleComponentSelected as EventListener)
    }
  }, [statements]) // Re-add event listener when statements change

  // Track wait status for each input (inp1 and inp2) separately
  const [waitStatus, setWaitStatus] = useState<Record<number, { inp1: boolean; inp2: boolean }>>({})

  // Add state to store the latest RSI MA settings
  const [rsiMaSettings, setRsiMaSettings] = useState({
    rsi_length: 14,
    rsi_source: "Close",
    ma_type: "SMA",
    ma_length: 14,
    bb_stddev: 2.0,
  })

  // Add state for indicator modal at the parent level
  const [showIndicatorModal, setShowIndicatorModal] = useState(false)
  const [pendingOtherIndicator, setPendingOtherIndicator] = useState<string | null>(null)
  const [pendingTimeframe, setPendingTimeframe] = useState<string>("3h")

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

  // Utility function to clean up Volume_MA indicators that have extra parameters
  const cleanupVolumeMAIndicator = (indicator: any) => {
    if (indicator && indicator.name === "Volume_MA" && indicator.input_params) {
      console.log('🔍 DEBUG: Cleaning up Volume_MA indicator:', indicator);
      
      // Get saved Volume settings as fallback
      const savedVolumeSettings = getSavedVolumeSettings();
      const finalMaLength = indicator.input_params.ma_length || savedVolumeSettings?.maLength || 20;
      
      // Only keep ma_length, remove any other parameters like ma_type
      const cleanedIndicator = {
        ...indicator,
        input_params: {
          ma_length: finalMaLength,
        },
      }
      console.log('🔍 DEBUG: Cleaned Volume_MA indicator:', cleanedIndicator);
      return cleanedIndicator
    }
    return indicator
  }

  // Clean up any existing Volume_MA indicators that might have extra parameters
  useEffect(() => {
    if (strategyData && strategyData.strategy) {
      // strategyData is an object, not an array, so we need to work with its strategy property
      const cleanedStatements = [{
        ...strategyData,
        strategy: strategyData.strategy.map((condition: any) => ({
          ...condition,
          inp1: cleanupVolumeMAIndicator(condition.inp1),
          inp2: cleanupVolumeMAIndicator(condition.inp2),
        })),
      }]
      setStatements(cleanedStatements)
    }
  }, [strategyData])

  // Add this state near other useState hooks
  const [pendingBollingerForInp2, setPendingBollingerForInp2] = useState<null | { statementIndex: number; conditionIndex: number; timeframe: string }>(null);

  return (
    <div className="flex-1 flex flex-col">
      {/* Main content area with scrolling */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-medium">
              {strategyId
                ? `Editing Strategy: ${initialInstrument || strategyId}`
                : `Building algorithm for ${initialInstrument || "XAU/USD"}`}
            </h1>
            <button className="ml-2 p-1 hover:bg-gray-700 rounded-full">
              <Edit className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-3">
            {/* Buy/Sell selector */}
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
                  <h2 className="text-xl font-medium">{statement.saveresult}</h2>
                  {/* Display current side (Buy/Sell) */}
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${statement.side === "B" ? "bg-gray-500 text-white" : "bg-gray-500 text-white"}`}>
                    {statement.side === "B" ? "Buy" : "Sell"}
                  </span>
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
                  {renderStrategyConditions(statement)}

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
                            className={`w-full text-left px-4 py-2 ${
                              idx === selectedSearchIndex ? "bg-[#4A4D62] text-white" : "hover:bg-[#3A3D47] text-white"
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

                {/* Render equity rules if they exist */}
                {renderEquityRules(statement)}
              </div>
            </div>
          ))}
        </div>

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
                  className={`w-full text-left px-4 py-2 text-black hover:bg-gray-100 ${
                    selectedTimeframe === timeframe ? "bg-gray-200 font-semibold" : ""
                  }`}
                  onClick={() => handleTimeframeSelect(timeframe)}
                >
                  {timeframe}
                </button>
              ))}

              {customTimeframes.map((timeframe) => (
                <button
                  key={timeframe}
                  className={`w-full text-left px-4 py-2 text-black hover:bg-gray-100 ${
                    selectedTimeframe === timeframe ? "bg-gray-200 font-semibold" : ""
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
      {showStochasticModal && (
        <StochasticSettingsModal
          onClose={() => setShowStochasticModal(false)}
          onSave={(settings: any) => {
            setShowStochasticModal(false)
            const newStatements = [...statements]
            const currentStatement = newStatements[activeStatementIndex]
            const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]
            lastCondition.inp2 = {
              type: "I",
              name: "Stochastic",
              timeframe: pendingTimeframe,
              input_params: settings,
            }
            setStatements(newStatements)
          }}
        />
      )}
      {showCrossingUpModal && (
        <CrossingUpSettingsModal
          onClose={() => setShowCrossingUpModal(false)}
          currentInp1={
            statements[activeStatementIndex]?.strategy[statements[activeStatementIndex].strategy.length - 1]?.inp1
          }
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
                  const finalBbStdDev = settings.bbStdDev || savedRsiSettings?.bbStdDev || 2.0;
                  
                  console.log('🔧 Final RSI_MA inp2 values:', {
                    rsi_length: finalRsiLength,
                    rsi_source: finalRsiSource,
                    ma_length: finalMaLength,
                    ma_type: finalMaType,
                    bb_stddev: finalBbStdDev
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
                      bb_stddev: finalBbStdDev,
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
                  lastCondition.inp2 = {
                    type: "C",
                    input: settings.indicator,
                    timeframe: settings.timeframe || "3h",
                  }
                } else if (settings.indicator === "bollinger") {
                  // Check if inp1 is BBANDS to use special format
                  if (lastCondition.inp1 && "name" in lastCondition.inp1 && lastCondition.inp1.name === "BBANDS") {
                    // For BBANDS, use type "C" with input "close" format
                    lastCondition.inp2 = {
                      type: "C",
                      input: "close",
                      timeframe: "36min",
                    }
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
                  lastCondition.inp2 = {
                    type: "C",
                    input: "volume",
                    timeframe: settings.timeframe || "3h",
                  }
                } else {
                  // For other existing indicators
                  lastCondition.inp2 = {
                    type: "C",
                    input: settings.indicator,
                    timeframe: settings.timeframe || "3h",
                  }
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
                  lastCondition.inp2 = {
                    type: "C",
                    input: "volume",
                    timeframe: settings.timeframe || "3h",
                  }
                } else {
                  // For other indicators like price, close, open, etc.
                  lastCondition.inp2 = {
                    type: "C",
                    input: settings.indicator,
                    timeframe: settings.timeframe || "3h",
                  }
                }
              }
            }

            setStatements(newStatements)
            setShowCrossingUpModal(false)
            setTimeout(() => {
              searchInputRefs.current[activeStatementIndex]?.focus()
            }, 100)
          }}
          onNext={(indicator, timeframe) => {
            setShowCrossingUpModal(false)
            setPendingOtherIndicator(indicator)
            setPendingTimeframe(timeframe)
            if (indicator === "rsi") {
              setShowIndicatorModal(true)
            } else if (indicator === "rsi-ma") {
              setShowIndicatorModal(true)
            } else if (indicator === "bollinger") {
              // Track which statement/condition/timeframe to update
              setPendingBollingerForInp2({
                statementIndex: activeStatementIndex,
                conditionIndex: statements[activeStatementIndex].strategy.length - 1,
                timeframe,
              });
              setShowBollingerModal(true);
            } else if (indicator === "stochastic") {
              setShowStochasticModal(true)
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
                  const finalBbStdDev = settings.bbStdDev || savedRsiSettings?.bbStdDev || 2.0;
                  
                  console.log('🔧 Final RSI_MA inp2 values (crossing-down):', {
                    rsi_length: finalRsiLength,
                    rsi_source: finalRsiSource,
                    ma_length: finalMaLength,
                    ma_type: finalMaType,
                    bb_stddev: finalBbStdDev
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
                      bb_stddev: finalBbStdDev,
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
                  lastCondition.inp2 = {
                    type: "C",
                    input: settings.indicator,
                    timeframe: settings.timeframe || "3h",
                  }
                } else if (settings.indicator === "bollinger") {
                  // Check if inp1 is BBANDS to use special format
                  if (lastCondition.inp1 && "name" in lastCondition.inp1 && lastCondition.inp1.name === "BBANDS") {
                    // For BBANDS, use type "C" with input "close" format
                    lastCondition.inp2 = {
                      type: "C",
                      input: "close",
                      timeframe: "36min",
                    }
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
                  lastCondition.inp2 = {
                    type: "C",
                    input: "volume",
                    timeframe: settings.timeframe || "3h",
                  }
                } else {
                  // For other existing indicators
                  lastCondition.inp2 = {
                    type: "C",
                    input: settings.indicator,
                    timeframe: settings.timeframe || "3h",
                  }
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
                  lastCondition.inp2 = {
                    type: "C",
                    input: "volume",
                    timeframe: settings.timeframe || "3h",
                  }
                } else {
                  // For other indicators like price, close, open, etc.
                  lastCondition.inp2 = {
                    type: "C",
                    input: settings.indicator,
                    timeframe: settings.timeframe || "3h",
                  }
                }
              }

              setStatements(newStatements)
              setShowCrossingDownModal(false)
            }
          }}
          onNext={(indicator, timeframe) => {
            setShowCrossingDownModal(false)
            setPendingOtherIndicator(indicator)
            setPendingTimeframe(timeframe)
            if (indicator === "rsi") {
              setShowIndicatorModal(true)
            } else if (indicator === "rsi-ma") {
              setShowIndicatorModal(true)
            } else if (indicator === "bollinger") {
              setPendingBollingerForInp2({
                statementIndex: activeStatementIndex,
                conditionIndex: statements[activeStatementIndex].strategy.length - 1,
                timeframe,
              });
              setShowBollingerModal(true);
            } else if (indicator === "stochastic") {
              setShowStochasticModal(true)
            } else if (["close", "open", "high", "low", "price"].includes(indicator)) {
              setShowPriceSettingsModal(true)
            }
          }}
        />
      )}
      {showAboveModal && (
        <AboveSettingsModal
          onClose={() => setShowAboveModal(false)}
          currentInp1={
            statements[activeStatementIndex]?.strategy[statements[activeStatementIndex].strategy.length - 1]?.inp1
          }
          onSave={(settings) => {
            const newStatements = [...statements]
            const currentStatement = newStatements[activeStatementIndex]
            const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

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
                    const finalBbStdDev = settings.bbStdDev || savedRsiSettings?.bbStdDev || 2.0;
                    
                    console.log('🔧 Final RSI_MA inp2 values (above):', {
                      rsi_length: finalRsiLength,
                      rsi_source: finalRsiSource,
                      ma_length: finalMaLength,
                      ma_type: finalMaType,
                      bb_stddev: finalBbStdDev
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
                        bb_stddev: finalBbStdDev,
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
                    lastCondition.inp2 = {
                      type: "C",
                      input: "volume",
                      timeframe: tf,
                    }
                    break

                  case "open":
                  case "high":
                  case "low":
                  case "close":
                    lastCondition.inp2 = {
                      type: "C",
                      input: settings.indicator,
                      timeframe: tf,
                    }
                    break

                  default:
                    lastCondition.inp2 = {
                      type: "C",
                      input: settings.indicator,
                      timeframe: tf,
                    }
                    break
                }
              }
            }

            setStatements(newStatements)
            setShowBelowModal(false)
            setTimeout(() => {
              searchInputRefs.current[activeStatementIndex]?.focus()
            }, 100)
          }}
          onNext={(indicator, timeframe) => {
            setShowAboveModal(false)
            setPendingOtherIndicator(indicator)
            setPendingTimeframe(timeframe)
            if (indicator === "rsi") {
              setShowIndicatorModal(true)
            } else if (indicator === "rsi-ma") {
              setShowIndicatorModal(true)
            } else if (indicator === "bollinger") {
              setPendingBollingerForInp2({
                statementIndex: activeStatementIndex,
                conditionIndex: statements[activeStatementIndex].strategy.length - 1,
                timeframe,
              });
              setShowBollingerModal(true);
            } else if (indicator === "stochastic") {
              setShowStochasticModal(true)
            } else if (["close", "open", "high", "low", "price"].includes(indicator)) {
              setShowPriceSettingsModal(true)
            }
          }}
        />
      )}
      {showBelowModal && (
        <BelowSettingsModal
          onClose={() => setShowBelowModal(false)}
          currentInp1={
            statements[activeStatementIndex]?.strategy[statements[activeStatementIndex].strategy.length - 1]?.inp1
          }
          onSave={(settings) => {
            const newStatements = [...statements]
            const currentStatement = newStatements[activeStatementIndex]
            const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

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
                    const finalBbStdDev = settings.bbStdDev || savedRsiSettings?.bbStdDev || 2.0;
                    
                    console.log('🔧 Final RSI_MA inp2 values (below):', {
                      rsi_length: finalRsiLength,
                      rsi_source: finalRsiSource,
                      ma_length: finalMaLength,
                      ma_type: finalMaType,
                      bb_stddev: finalBbStdDev
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
                        bb_stddev: finalBbStdDev,
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
                    lastCondition.inp2 = {
                      type: "C",
                      input: "volume",
                      timeframe: tf,
                    }
                    break

                  case "open":
                  case "high":
                  case "low":
                  case "close":
                    lastCondition.inp2 = {
                      type: "C",
                      input: settings.indicator,
                      timeframe: tf,
                    }
                    break

                  default:
                    lastCondition.inp2 = {
                      type: "C",
                      input: settings.indicator,
                      timeframe: tf,
                    }
                    break
                }
              }
            }

            setStatements(newStatements)
            setShowBelowModal(false)
            setTimeout(() => {
              searchInputRefs.current[activeStatementIndex]?.focus()
            }, 100)
          }}
          onNext={(indicator, timeframe) => {
            setShowBelowModal(false)
            setPendingOtherIndicator(indicator)
            setPendingTimeframe(timeframe)
            if (indicator === "rsi") {
              setShowIndicatorModal(true)
            } else if (indicator === "rsi-ma") {
              setShowIndicatorModal(true)
            } else if (indicator === "bollinger") {
              setPendingBollingerForInp2({
                statementIndex: activeStatementIndex,
                conditionIndex: statements[activeStatementIndex].strategy.length - 1,
                timeframe,
              });
              setShowBollingerModal(true);
            } else if (indicator === "stochastic") {
              setShowStochasticModal(true)
            } else if (["close", "open", "high", "low", "price"].includes(indicator)) {
              setShowPriceSettingsModal(true)
            }
          }}
        />
      )}

      {showRsiModal && (
        <RsiSettingsModal
          onClose={() => setShowRsiModal(false)}
          initialSettings={(() => {
            if (editingComponent) {
              const condition = statements[editingComponent.statementIndex]?.strategy[editingComponent.conditionIndex]
              const indicator = editingComponent.componentType === "inp1" ? condition?.inp1 : condition?.inp2

              console.log("Editing RSI component:", editingComponent, "indicator:", indicator)

              if (indicator && "name" in indicator) {
                if (indicator.name === "RSI" && "input_params" in indicator) {
                  return {
                    indicatorType: "rsi",
                    rsiLength: String(indicator.input_params?.timeperiod || 14),
                    source: indicator.input_params?.source ? indicator.input_params.source.charAt(0).toUpperCase() + indicator.input_params.source.slice(1) : "Close",
                    
                    timeframe: indicator.timeframe || "3h",
                  }
                } else if (indicator.name === "RSI_MA" && "input_params" in indicator) {
                  const settings = {
                    indicatorType: "rsi-ma",
                    rsiLength: String(indicator.input_params?.rsi_length || 14),
                    source: indicator.input_params?.rsi_source || "Close",
                    maLength: String(indicator.input_params?.ma_length || 14),
                    maType: indicator.input_params?.ma_type || "SMA",
                    bbStdDev: String(indicator.input_params?.bb_stddev || 2.0),
                    timeframe: indicator.timeframe || "3h",
                  }
                  console.log("RSI_MA initialSettings:", settings)
                  return settings
                }
              }
            } else {
              // Fallback to original behavior
              const currentStatement = statements[activeStatementIndex]
              const lastCondition = currentStatement?.strategy[currentStatement.strategy.length - 1]
              const indicator = lastCondition?.inp1

              if (indicator && "name" in indicator) {
                if (indicator.name === "RSI" && "input_params" in indicator) {
                  return {
                    indicatorType: "rsi",
                    rsiLength: String(indicator.input_params?.timeperiod || 14),
                    source: indicator.input_params?.source ? indicator.input_params.source.charAt(0).toUpperCase() + indicator.input_params.source.slice(1) : "Close",
                  
                    timeframe: indicator.timeframe || "3h",
                  }
                } else if (indicator.name === "RSI_MA" && "input_params" in indicator) {
                  return {
                    indicatorType: "rsi-ma",
                    rsiLength: String(indicator.input_params?.rsi_length || 14),
                    source: indicator.input_params?.rsi_source || "Close",
                    maLength: String(indicator.input_params?.ma_length || 14),
                    maType: indicator.input_params?.ma_type || "SMA",
                    bbStdDev: String(indicator.input_params?.bb_stddev || 2.0),
                    timeframe: indicator.timeframe || "3h",
                  }
                }
              }
            }
            return undefined
          })()}
          onSave={(settings) => {
            // Always update the rsiMaSettings state with the latest MA settings
            setRsiMaSettings({
              rsi_length: Number(settings.rsiLength),
              rsi_source: settings.source || "Close",
              ma_type: settings.maType || "SMA",
              ma_length: Number(settings.maLength),
              bb_stddev: Number(settings.bbStdDev) || 2.0,
            })
            // Update RSI settings
            const newStatements = [...statements]
            const currentStatement = newStatements[activeStatementIndex]

            if (editingComponent) {
              const condition = currentStatement.strategy[editingComponent.conditionIndex]
              const targetIndicator = editingComponent.componentType === "inp1" ? condition.inp1 : condition.inp2

              if (targetIndicator && "timeframe" in targetIndicator) {
                if (settings.indicatorType === "rsi-ma") {
                  // Update to RSI_MA
                  const updatedIndicator = {
                    type: "CUSTOM_I",
                    name: "RSI_MA",
                    timeframe: settings.timeframe || "3h",
                    input_params: {
                      rsi_length: Number(settings.rsiLength),
                      rsi_source: settings.source || "Close",
                      ma_type: settings.maType || "SMA",
                      ma_length: Number(settings.maLength),
                      bb_stddev: Number(settings.bbStdDev) || 2.0,
                    },
                  }

                  if (editingComponent.componentType === "inp1") {
                    condition.inp1 = updatedIndicator
                  } else {
                    condition.inp2 = updatedIndicator
                  }
                } else {
                  // Regular RSI
                  const updatedIndicator = {
                    type: "I",
                    name: "RSI",
                    timeframe: targetIndicator.timeframe,
                    input_params: {
                      timeperiod: Number(settings.rsiLength),
                      source: settings.source?.toLowerCase() || "close",

                    },
                  }

                  if (editingComponent.componentType === "inp1") {
                    condition.inp1 = updatedIndicator
                  } else {
                    condition.inp2 = updatedIndicator
                  }
                }
              }
            } else {
              // Fallback to original behavior
              const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

              if (lastCondition.inp1 && "timeframe" in lastCondition.inp1) {
                if (settings.indicatorType === "rsi-ma") {
                  // Update to RSI_MA
                  lastCondition.inp1 = {
                    type: "CUSTOM_I",
                    name: "RSI_MA",
                    timeframe: settings.timeframe || "3h",
                    input_params: {
                      rsi_length: Number(settings.rsiLength),
                      rsi_source: settings.source || "Close",
                      ma_type: settings.maType || "SMA",
                      ma_length: Number(settings.maLength),
                      bb_stddev: Number(settings.bbStdDev) || 2.0,
                    },
                  }
                } else {
                  // Regular RSI
                  lastCondition.inp1 = {
                    type: "I",
                    name: "RSI",
                    timeframe: lastCondition.inp1.timeframe,
                    input_params: {
                      timeperiod: Number(settings.rsiLength),
                      source: settings.source?.toLowerCase() || "close",

                    },
                  }
                }
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
              // Fallback to original behavior
              const currentStatement = statements[activeStatementIndex]
              const lastCondition = currentStatement?.strategy[currentStatement.strategy.length - 1]
              const indicator = lastCondition?.inp2?.name === "BBANDS" ? lastCondition.inp2 : lastCondition?.inp1

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
                targetIndicator.input = settings.input
                targetIndicator.input_params = settings.input_params
              }
            } else {
              // Fallback to original behavior
              const currentStatement = newStatements[activeStatementIndex]
              const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

              let targetIndicator = null
              if (lastCondition.inp2 && "name" in lastCondition.inp2 && lastCondition.inp2.name === "BBANDS") {
                targetIndicator = lastCondition.inp2
              } else if (lastCondition.inp1 && "name" in lastCondition.inp1 && lastCondition.inp1.name === "BBANDS") {
                targetIndicator = lastCondition.inp1
              }

              if (targetIndicator) {
                targetIndicator.input = settings.input
                targetIndicator.input_params = settings.input_params
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
          onClose={() => setShowVolumeModal(false)}
          onSave={(settings) => {
            // Update Volume settings
            const newStatements = [...statements]
            const currentStatement = newStatements[activeStatementIndex]

            if (editingComponent) {
              const condition = currentStatement.strategy[editingComponent.conditionIndex]
              const targetIndicator = editingComponent.componentType === "inp1" ? condition.inp1 : condition.inp2

              if (targetIndicator && "timeframe" in targetIndicator) {
                if (settings.indicatorType === "volume-ma") {
                  // Update to Volume_MA
                  const updatedIndicator = {
                    type: "CUSTOM_I",
                    name: "Volume_MA",
                    timeframe: targetIndicator.timeframe,
                    input_params: {
                      ma_length: Number(settings.maLength),
                    },
                  }

                  if (editingComponent.componentType === "inp1") {
                    condition.inp1 = updatedIndicator
                  } else {
                    condition.inp2 = updatedIndicator
                  }
                } else {
                  // Regular Volume
                  const updatedIndicator = {
                    type: "C",
                    input: "volume",
                    timeframe: targetIndicator.timeframe,
                  }

                  if (editingComponent.componentType === "inp1") {
                    condition.inp1 = updatedIndicator
                  } else {
                    condition.inp2 = updatedIndicator
                  }
                }
              }
            } else {
              // Fallback to original behavior
              const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

              if (lastCondition.inp1 && "timeframe" in lastCondition.inp1) {
                if (settings.indicatorType === "volume-ma") {
                  // Update to Volume_MA
                  lastCondition.inp1 = {
                    type: "CUSTOM_I",
                    name: "Volume_MA",
                    timeframe: lastCondition.inp1.timeframe,
                    input_params: {
                      ma_length: Number(settings.maLength),
                    },
                  }
                } else {
                  // Regular Volume
                  lastCondition.inp1 = {
                    type: "C",
                    input: "volume",
                    timeframe: lastCondition.inp1.timeframe,
                  }
                }
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
      {showAtrModal && (
        <AtrSettingsModal
          onClose={() => setShowAtrModal(false)}
          onSave={(settings) => {
            // Update ATR settings
            const newStatements = [...statements]
            const currentStatement = newStatements[activeStatementIndex]

            if (editingComponent) {
              const condition = currentStatement.strategy[editingComponent.conditionIndex]
              const targetIndicator = editingComponent.componentType === "inp1" ? condition.inp1 : condition.inp2

              if (targetIndicator && "name" in targetIndicator && targetIndicator.name === "ATR") {
                targetIndicator.input_params = {
                  ...targetIndicator.input_params,
                  ...settings,
                }
              }
            } else {
              // Fallback to original behavior
              const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

              if (lastCondition.inp1 && "name" in lastCondition.inp1 && lastCondition.inp1.name === "ATR") {
                lastCondition.inp1.input_params = {
                  ...lastCondition.inp1.input_params,
                  ...settings,
                }
              }
            }

            setStatements(newStatements)
            setShowAtrModal(false)
            setEditingComponent(null)
            setTimeout(() => {
              searchInputRefs.current[activeStatementIndex]?.focus()
            }, 100)
          }}
        />
      )}
      {showMacdModal && (
        <MacdSettingsModal
          onClose={() => setShowMacdModal(false)}
          onSave={(settings) => {
            // Update MACD settings
            const newStatements = [...statements]
            const currentStatement = newStatements[activeStatementIndex]

            if (editingComponent) {
              const condition = currentStatement.strategy[editingComponent.conditionIndex]
              const targetIndicator = editingComponent.componentType === "inp1" ? condition.inp1 : condition.inp2

              if (targetIndicator && "name" in targetIndicator && targetIndicator.name === "MACD") {
                targetIndicator.input_params = {
                  ...targetIndicator.input_params,
                  ...settings,
                }
              }
            } else {
              // Fallback to original behavior
              const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

              if (lastCondition.inp1 && "name" in lastCondition.inp1 && lastCondition.inp1.name === "MACD") {
                lastCondition.inp1.input_params = {
                  ...lastCondition.inp1.input_params,
                  ...settings,
                }
              }
            }

            setStatements(newStatements)
            setShowMacdModal(false)
            setEditingComponent(null)
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
                        bb_stddev: settings.bbStdDev || 2.0,
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
                    currentCondition.inp2 = {
                      type: "C",
                      input: "volume",
                      timeframe: tf,
                    }
                    break

                  case "open":
                  case "high":
                  case "low":
                  case "close":
                    currentCondition.inp2 = {
                      type: "C",
                      input: settings.indicator,
                      timeframe: tf,
                    }
                    break

                  default:
                    currentCondition.inp2 = {
                      type: "C",
                      input: settings.indicator,
                      timeframe: tf,
                    }
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
            if (editingEquityRule) {
              const rule = statements[editingEquityRule.statementIndex]?.Equity[editingEquityRule.equityIndex]
              const list = (rule?.inp1 as any)?.manage_exit_list
              if (list && Array.isArray(list)) {
                return list.map((it: any) => ({ Price: it.Price, Action: it.Action }))
              }
            }
            return undefined
          })()}
          onSave={(settings: ManageExitSettings) => {
            const newStatements = [...statements]
            const targetStatementIndex = editingEquityRule ? editingEquityRule.statementIndex : activeStatementIndex
            const currentStatement = newStatements[targetStatementIndex]
            if (!currentStatement.Equity) currentStatement.Equity = []

            const newRule: EquityRule = {
              statement: "and",
              inp1: {
                name: "manage_exit",
                manage_exit_list: settings.items.map((it) => ({
                  Price: it.Price,
                  Action: it.Action,
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
            const newStatements = [...statements]
            const currentStatement = newStatements[activeStatementIndex]

            if (activeConditionIndex !== null) {
              const condition = currentStatement.strategy[activeConditionIndex]

              // Add index to the targeted input (inp1 or inp2)
              if (targetInput === "inp1" && condition.inp1 && typeof condition.inp1 === "object") {
                condition.inp1.index = -candleNumber // Store negative value of candle number
              } else if (targetInput === "inp2" && condition.inp2 && typeof condition.inp2 === "object") {
                condition.inp2.index = -candleNumber // Store negative value of candle number
              }

              setStatements(newStatements)
              setSelectedCandleNumber(candleNumber)
            } else {
              // Fall back to the original handleAtCandleSelection if no specific condition is targeted
              handleAtCandleSelection(candleNumber)
            }

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
          <div className="bg-[#C5C5C5] text-black px-3 py-2 mt-3 rounded-md mr-2 mb-2  px-3 py-2 rounded-lg shadow-lg border border-[#4A4D62] animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="text-xs space-y-1">
              {Object.entries(hoveredComponent.content.details).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-2">
                  <span className=" text-black capitalize">{key.replace("_", " ")}:</span>
                  <span className=" text-black">{String(value)}</span>
                </div>
              ))}
            </div>
            {/* Tooltip arrow pointing downward */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#2A2D42]"></div>
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
            indicatorType: "rsi",
            rsiLength: "14",
            source: "Close",
            maLength: "14",
            maType: "SMA",
            bbStdDev: "2.0",
            timeframe: pendingTimeframe,
          }}
          onSave={(settings: any) => {
            setShowIndicatorModal(false)
            // Save the indicator settings to inp2 as needed
            const newStatements = [...statements]
            const currentStatement = newStatements[activeStatementIndex]
            const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]
            
            if (settings.indicatorType === "rsi-ma") {
              lastCondition.inp2 = {
                type: "CUSTOM_I",
                name: "RSI_MA",
                timeframe: pendingTimeframe,
                input_params: {
                  rsi_length: Number(settings.rsiLength),
                  rsi_source: settings.source || "Close",
                  ma_type: settings.maType || "SMA",
                  ma_length: Number(settings.maLength) || 14,
                  bb_stddev: Number(settings.bbStdDev) || 2.0,
                },
              }
            } else {
              lastCondition.inp2 = {
                type: "I",
                name: "RSI",
                timeframe: pendingTimeframe,
                input_params: {
                  timeperiod: Number(settings.rsiLength),
                  source: settings.source?.toLowerCase() || "close",
                
                },
              }
            }
            setStatements(newStatements)
          }}
        />
      )}
      {showIndicatorModal && pendingOtherIndicator === "rsi-ma" && (
        <RsiSettingsModal
          onClose={() => setShowIndicatorModal(false)}
          initialSettings={{
            indicatorType: "rsi-ma",
            rsiLength: "14",
            source: "Close",
            maLength: "14",
            maType: "SMA",
            bbStdDev: "2.0",
            timeframe: pendingTimeframe,
          }}
          onSave={(settings: any) => {
            setShowIndicatorModal(false)
            // Save the indicator settings to inp2 as needed
            const newStatements = [...statements]
            const currentStatement = newStatements[activeStatementIndex]
            const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]
            
            if (settings.indicatorType === "rsi-ma") {
              lastCondition.inp2 = {
                type: "CUSTOM_I",
                name: "RSI_MA",
                timeframe: pendingTimeframe,
                input_params: {
                  rsi_length: Number(settings.rsiLength),
                  rsi_source: settings.source || "Close",
                  ma_type: settings.maType || "SMA",
                  ma_length: Number(settings.maLength) || 14,
                  bb_stddev: Number(settings.bbStdDev) || 2.0,
                },
              }
            } else {
              lastCondition.inp2 = {
                type: "I",
                name: "RSI",
                timeframe: pendingTimeframe,
                input_params: {
                  timeperiod: Number(settings.rsiLength),
                  source: settings.source?.toLowerCase() || "close",
                },
              }
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
          onClose={() => setShowStochasticModal(false)}
          onSave={(settings: any) => {
            setShowStochasticModal(false)
            const newStatements = [...statements]
            const currentStatement = newStatements[activeStatementIndex]
            const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]
            lastCondition.inp2 = {
              type: "I",
              name: "Stochastic",
              timeframe: pendingTimeframe,
              input_params: settings,
            }
            setStatements(newStatements)
          }}
        />
      )}


    </div>
  )
}
