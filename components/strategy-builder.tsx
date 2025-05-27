"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Edit, MoreVertical, Plus, ChevronDown, X } from "lucide-react"
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
import { AboveSettingsModal } from "@/components/modals/above-settings-modal"
import { BelowSettingsModal } from "@/components/modals/below-settings-modal"

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

// Update the IndicatorInput interface to match the required JSON structure
interface IndicatorInput {
  type: string
  input?: string
  name?: string
  timeframe: string
  input_params?: IndicatorParams
  wait?: string
  Derivative?: {
    order: number
  }
}

// Update the StrategyCondition interface to support inp2 and more complex structures
interface StrategyCondition {
  statement: string
  index?: number
  inp1?: IndicatorInput | { name: string }
  operator_name?: string
  inp2?:
    | {
        type: string
        value: number
        wait?: string
      }
    | { name: string }
  timeframe?: string // Added timeframe property to StrategyCondition
  operator?: string
  pips?: number
}

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
      Price: string
      Close: string
      name?: string
      operator?: string
      Action?: string
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

interface StrategyStatement {
  side: string
  saveresult: string
  strategy: StrategyCondition[]
  Equity: EquityRule[]
  TradingType?: {
    NewTrade?: string
    commission?: number
    margin?: number
    asset_type?: string
    lot?: string
    cash?: number
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
  const [showDerivativeModal, setShowDerivativeModal] = useState(false)

  const [showSaveStrategyModal, setShowSaveStrategyModal] = useState(false)
  const [strategyName, setStrategyName] = useState(initialName || "")
  const [showPriceSettingsModal, setShowPriceSettingsModal] = useState(false)
  const [showAtCandleModal, setShowAtCandleModal] = useState(false)
  const [selectedCandleNumber, setSelectedCandleNumber] = useState<number | null>(null)

  // Initialize with a statement structure that includes "if" and a timeframe
  const [statements, setStatements] = useState<StrategyStatement[]>([
    {
      side: "S",
      saveresult: "Statement 1",
      strategy: [
        {
          statement: "if",
          timeframe: "3h", // Initial timeframe for new statements
        },
      ],
      Equity: [],
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

  // Load strategy data if strategyId is provided
  useEffect(() => {
    if (strategyData && strategyId) {
      try {
        console.log("Loading strategy data:", strategyData)

        // If strategyData has the expected structure, use it
        if (strategyData.strategy) {
          setStatements([
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
            },
          ])
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

  // Add this function to handle search input
  const handleSearchInput = (statementIndex: number, value: string) => {
    setSearchTerm(value)
    setActiveStatementIndex(statementIndex)

    if (value.trim() === "") {
      setSearchResults([])
      return
    }

    // Combine all component types for searching
    const allComponents = [
      ...basicComponents.map((c) => c.label),
      ...extraBasicComponents.map((c) => c.label),
      ...indicators.map((c) => c.label),
      ...behaviours.map((c) => c.label),
      ...actions.map((c) => c.label),
      ...tradeManagement.map((c) => c.label),
    ]

    // Filter components based on search term
    const results = allComponents.filter((component) => component.toLowerCase().includes(value.toLowerCase()))

    setSearchResults(results)
  }

  // Add function to handle backspace removal
  const handleKeyDown = (statementIndex: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && searchTerm === "") {
      e.preventDefault()

      const currentStatement = statements[statementIndex]
      const strategy = currentStatement.strategy

      if (strategy.length === 0) return

      // Find the last condition that has removable components
      for (let i = strategy.length - 1; i >= 0; i--) {
        const condition = strategy[i]

        // Remove inp2 first if it exists
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
          removeComponent(statementIndex, i, "statement")
          return
        }
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
    { id: "high", label: "High" },
    { id: "low", label: "Low" },
    { id: "open", label: "Open" },
    { id: "close", label: "Close" },
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
    { id: "crossing-up", label: "Crossing up" },
    { id: "crossing-down", label: "Crossing down" },
    { id: "greater-than", label: "Greater than" },
    { id: "less-than", label: "Less than" },
    { id: "inside-channel", label: "Inside Channel" },
    { id: "moving-up", label: "Moving up" },
    { id: "moving-down", label: "Moving down" },
    { id: "crossabove", label: "Cross Above" },
    { id: "crossbelow", label: "Cross Below" },
    { id: "above", label: "Above" },
    { id: "below", label: "Below" },
    { id: "atmost-above-pips", label: "At most above pips" },
    { id: "atmost-below-pips", label: "At most below pips" },
  ]

  const actions = [
    { id: "long", label: "Long" },
    { id: "short", label: "Short" },
    { id: "wait", label: "Wait" },
    { id: "sl", label: "SL" },
    { id: "tp", label: "TP" },
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
          timeframe: "3h", // Initial timeframe for new statements
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
    if (behavior.toLowerCase() === "crossing up") return "crossabove"
    if (behavior.toLowerCase() === "crossing down") return "crossbelow"
    if (behavior.toLowerCase() === "moving up") return "moving_up"
    if (behavior.toLowerCase() === "moving down") return "moving_down"
    if (behavior.toLowerCase() === "greater than") return "greater_than"
    if (behavior.toLowerCase() === "less than") return "less_than"
    if (behavior.toLowerCase() === "inside channel") return "inside_channel"
    if (behavior.toLowerCase() === "above") return "above"
    if (behavior.toLowerCase() === "below") return "below"
    if (behavior.toLowerCase() === "at most above pips") return "atmost_above_pips"
    if (behavior.toLowerCase() === "at most below pips") return "atmost_below_pips"
    return behavior.toLowerCase()
  }

  // Handle derivative settings
  const handleDerivativeSettings = (settings: any) => {
    const newStatements = [...statements]
    const currentStatement = newStatements[activeStatementIndex]
    const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

    // Get the timeframe from the condition or use the selected timeframe
    const timeframe = lastCondition.timeframe || selectedTimeframe

    // Create the derivative indicator with the selected indicator's parameters
    if (settings.selectedIndicator === "RSI_MA") {
      lastCondition.inp1 = {
        type: "CUSTOM_I",
        name: "RSI_MA",
        timeframe: timeframe,
        input_params: settings.input_params,
        Derivative: {
          order: settings.order,
        },
      }
    } else if (settings.selectedIndicator === "GENERAL_PA") {
      lastCondition.inp1 = {
        type: "CUSTOM_I",
        name: "GENERAL_PA",
        timeframe: timeframe,
        Derivative: {
          order: settings.order,
        },
      }
    } else {
      // Handle other indicators
      lastCondition.inp1 = {
        type: "CUSTOM_I",
        name: settings.selectedIndicator,
        timeframe: timeframe,
        input_params: settings.input_params || {},
        Derivative: {
          order: settings.order,
        },
      }
    }

    // Remove the timeframe from the condition since it's now in inp1
    delete lastCondition.timeframe

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

    // Handle partial take profit
    if (settings.type === "partial_tp" && settings.partialTpList && settings.partialTpList.length > 0) {
      currentStatement.Equity.push({
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
      })
      setStatements(newStatements)
      return
    }

    // Rest of the function remains the same...
    const formatType = settings.formatType || "simple"

    if (formatType === "trailing" || settings.trailingStop) {
      // Create the equity rule with trailing stop parameters
      const equityRule: EquityRule = {
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

      currentStatement.Equity.push(equityRule)
    } else if (settings.useAdvanced) {
      // Advanced format with inp1 and inp2
      const equityRule: EquityRule = {
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

      currentStatement.Equity.push(equityRule)
    } else {
      // Simple format
      if (settings.valueType === "pips") {
        currentStatement.Equity.push({
          statement: "and",
          operator: `${settings.type} = Entry_Price ${settings.direction} ${settings.value}pips`,
        })
      } else if (settings.valueType === "percentage") {
        // For percentage, we use multiplication
        const actualMultiplier =
          settings.type === "SL" ? 1 - Number(settings.value) / 100 : 1 + Number(settings.value) / 100

        currentStatement.Equity.push({
          statement: "and",
          operator: `${settings.type} = Entry_Price * ${actualMultiplier}`,
        })
      } else if (settings.valueType === "fixed") {
        // For fixed price values
        currentStatement.Equity.push({
          statement: "and",
          operator: `${settings.type} = ${settings.value}`,
        })
      } else if (settings.valueType === "indicator") {
        // For indicator-based values
        currentStatement.Equity.push({
          statement: "and",
          operator: `${settings.type} = inp2 ${settings.direction} ${settings.value}pips`,
          inp2: {
            name: settings.indicatorParams?.name || "nperiod_hl",
            side: settings.indicatorParams?.side || "low",
            timeframe: settings.indicatorParams?.timeframe || "1h",
            input_params: {
              nperiod: settings.indicatorParams?.nperiod || 30,
            },
          },
        })
      } else if (settings.valueType === "close") {
        // For close price with multiplier
        currentStatement.Equity.push({
          statement: "and",
          operator: `${settings.type} = Close * ${settings.value}`,
        })
      }
    }

    setStatements(newStatements)
  }

  // Function to remove a component from a strategy
  const removeComponent = (
    statementIndex: number,
    conditionIndex: number,
    componentType: "statement" | "inp1" | "operator" | "inp2" | "timeframe",
  ) => {
    const newStatements = [...statements]
    const currentStatement = newStatements[statementIndex]
    const condition = currentStatement.strategy[conditionIndex]

    if (componentType === "statement" && condition.statement !== "if") {
      // Remove the entire condition if it's not an "if" statement
      currentStatement.strategy.splice(conditionIndex, 1)
    } else if (componentType === "inp1" && condition.inp1) {
      // Remove the inp1 component
      delete condition.inp1
    } else if (componentType === "operator" && condition.operator_name) {
      // Remove the operator and inp2 if it exists
      delete condition.operator_name
      delete condition.inp2
    } else if (componentType === "inp2" && condition.inp2) {
      // Remove just the inp2 component
      delete condition.inp2
    } else if (
      componentType === "timeframe" &&
      (condition.timeframe || (condition.inp1 && "timeframe" in condition.inp1))
    ) {
      // Remove the timeframe
      if (condition.timeframe) {
        delete condition.timeframe
      } else if (condition.inp1 && "timeframe" in condition.inp1) {
        // If timeframe is in inp1, we need to set a default
        condition.inp1.timeframe = "1h"
      }
    }

    // If the condition is now empty and it's not the first one, remove it
    if (conditionIndex > 0 && !condition.inp1 && !condition.operator_name && !condition.inp2 && !condition.timeframe) {
      currentStatement.strategy.splice(conditionIndex, 1)
    }

    setStatements(newStatements)
  }

  // Add a function to handle At Candle selection
  const handleAtCandleSelection = (candleNumber: number) => {
    const newStatements = [...statements]
    const currentStatement = newStatements[activeStatementIndex]

    // Add index: -1 to all strategy conditions
    currentStatement.strategy.forEach((condition) => {
      condition.index = -1
    })

    setSelectedCandleNumber(candleNumber)
    setStatements(newStatements)
  }

  // Update the handleAddComponent function to move the timeframe into inp1 and remove it from the condition
  const handleAddComponent = (statementIndex: number, component: string) => {
    const newStatements = [...statements]
    const currentStatement = newStatements[statementIndex]

    // Determine what type of component is being added
    if (component.toLowerCase() === "timeframe") {
      // Add a new timeframe component to the statement
      if (currentStatement.strategy.length === 0) {
        // If there are no conditions yet, create an "if" with a timeframe
        currentStatement.strategy.push({
          statement: "if",
          timeframe: selectedTimeframe,
        })
      } else {
        // Add a new timeframe to an existing condition or as a new condition
        const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

        // If the last condition already has an indicator, add a new "and" condition with timeframe
        if (lastCondition.inp1) {
          currentStatement.strategy.push({
            statement: "and",
            timeframe: selectedTimeframe,
          })
        } else {
          // Otherwise, add timeframe to the last condition
          lastCondition.timeframe = selectedTimeframe
        }
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
          timeframe: selectedTimeframe, // Add default timeframe
        })
      } else if ((statementType === "and" || statementType === "or") && currentStatement.strategy.length > 0) {
        // Add "and" or "or" statement
        currentStatement.strategy.push({
          statement: statementType,
          timeframe: selectedTimeframe, // Add default timeframe
        })
      } else if (component.toLowerCase() === "at candle" || component.toLowerCase() === "at-candle") {
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

        // Check if we already have inp1 and an operator - if so, we're adding to inp2
        if (lastCondition.inp1 && lastCondition.operator_name) {
          // Get the timeframe from the condition or use the selected timeframe
          const timeframe = lastCondition.timeframe || selectedTimeframe

          // We're adding to inp2
          if (component.toLowerCase() === "rsi") {
            lastCondition.inp2 = {
              type: "I",
              name: "RSI",
              timeframe: timeframe,
              input_params: {
                timeperiod: 14,
              },
            }
          } else if (component.toLowerCase() === "volume") {
            lastCondition.inp2 = {
              type: "C",
              input: "volume",
              timeframe: timeframe,
            }
          } else if (component.toLowerCase() === "rsi_ma" || component.toLowerCase() === "rsi-ma") {
            lastCondition.inp2 = {
              type: "CUSTOM_I",
              name: "RSI_MA",
              timeframe: "36min",
              input_params: {
                rsi_length: 14,
                rsi_source: "Close",
                ma_type: "SMA",
                ma_length: 14,
                bb_stddev: 2.0,
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
            setShowDerivativeModal(true)
          } else if (component.includes("MA") || component.includes("_MA")) {
            lastCondition.inp2 = {
              type: "CUSTOM_I",
              name: component.toUpperCase().replace("-", "_"),
              timeframe: timeframe,
              input_params: { ma_length: 20 },
            }
          } else {
            if (component === "Bollinger") {
              lastCondition.inp2 = {
                type: "I",
                name: "BBANDS",
                timeframe: timeframe,
                input: "upperband",
                input_params: {
                  timeperiod: 17,
                },
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
            lastCondition.inp1 = {
              type: "I",
              name: "RSI", // Uppercase name
              timeframe: timeframe,
              input_params: {
                timeperiod: 14, // Numeric value, not string
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
            lastCondition.inp1 = {
              type: "CUSTOM_I",
              name: "RSI_MA",
              timeframe: "36min",
              input_params: {
                rsi_length: 14,
                rsi_source: "Close",
                ma_type: "SMA",
                ma_length: 14,
                bb_stddev: 2.0,
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
            setShowDerivativeModal(true)
          } else if (component.includes("MA") || component.includes("_MA")) {
            // Format for custom indicators like Volume_MA
            lastCondition.inp1 = {
              type: "CUSTOM_I",
              name: component.toUpperCase().replace("-", "_"),
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
                input: "upperband",
                input_params: {
                  timeperiod: 17,
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

          // Remove the timeframe from the condition since it's now in inp1
          delete lastCondition.timeframe
        }

        // Show the appropriate settings modal - only for inp1 for now
        if (!lastCondition.operator_name) {
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
    } else if (behaviours.some((c) => c.label.toLowerCase() === component.toLowerCase())) {
      // Adding a behavior
      if (currentStatement.strategy.length > 0) {
        const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

        // Add the behavior to the last condition
        lastCondition.operator_name = getOperatorName(component)

        // Add default inp2 value for behaviors except moving_up and moving_down
        if (lastCondition.operator_name !== "moving_up" && lastCondition.operator_name !== "moving_down") {
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
        if (component === "Crossing up" || component === "Cross Above" || component === "Cross Below") {
          setShowCrossingUpModal(true)
        } else if (component === "Crossing down") {
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
    } else if (component.toLowerCase() === "long" || component.toLowerCase() === "short") {
      // Set the side based on Long/Short selection
      currentStatement.side = component.toLowerCase() === "long" ? "B" : "S"
    } else if (component.toLowerCase() === "wait") {
      // Adding wait parameter to the last condition
      if (currentStatement.strategy.length > 0) {
        const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

        // Add wait parameter to inp1 if it exists
        if (lastCondition.inp1) {
          // Add wait parameter to inp1 regardless of whether it already has one or not
          if ("wait" in lastCondition.inp1) {
            // Toggle if it already exists
            lastCondition.inp1.wait = lastCondition.inp1.wait === "yes" ? undefined : "yes"
          } else {
            // Add it if it doesn't exist
            if (typeof lastCondition.inp1 === "object") {
              lastCondition.inp1.wait = "yes"
            }
          }
        }
        // Or add wait parameter to inp2 if it exists and is not a simple value
        else if (lastCondition.inp2 && typeof lastCondition.inp2 !== "string" && "type" in lastCondition.inp2) {
          if ("wait" in lastCondition.inp2) {
            // Toggle if it already exists
            lastCondition.inp2.wait = lastCondition.inp2.wait === "yes" ? undefined : "yes"
          } else {
            // Add it if it doesn't exist
            lastCondition.inp2.wait = "yes"
          }
        }
      }
    } else if (component.toLowerCase() === "sl") {
      // Show SL settings modal
      setShowSLTPSettings({ show: true, type: "SL" })
    } else if (component.toLowerCase() === "tp") {
      // Show TP settings modal
      setShowSLTPSettings({ show: true, type: "TP" })
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
    componentType: "inp1" | "inp2" | "timeframe" | "operator",
    index: number,
  ) => {
    // if (componentType === "timeframe") {
    //   const timeframeValue =
    //     condition.inp1 && "timeframe" in condition.inp1 ? condition.inp1.timeframe : condition.timeframe
    //   return {
    //     title: "Timeframe",
    //     details: { timeframe: timeframeValue },
    //   }
    // }

    if (componentType === "operator" && condition.operator_name) {
      const details: any = {
        operator: condition.operator_name.replace("_", " "),
      }

      if (condition.inp2) {
        if ("type" in condition.inp2 && condition.inp2.type === "value") {
          details.value = condition.inp2.value
          if (condition.pips) {
            details.pips = condition.pips
          }
        } else if ("name" in condition.inp2) {
          details.indicator = condition.inp2.name
          if (condition.inp2.timeframe) {
            details.timeframe = condition.inp2.timeframe
          }
        }
      }

      return {
        title: "Behavior",
        details,
      }
    }

    if (componentType === "inp1" && condition.inp1) {
      const inp1 = condition.inp1

      // Handle different indicator types
      if ("name" in inp1) {
        if (inp1.name === "RSI") {
          return {
            title: "RSI",
            details: {
              timeframe: inp1.timeframe,
              rsi_length: inp1.input_params?.timeperiod || 14,
            },
          }
        } else if (inp1.name === "RSI_MA") {
          return {
            title: "RSI MA",
            details: {
              timeframe: inp1.timeframe,
              rsi_length: inp1.input_params?.rsi_length || 14,
              ma_length: inp1.input_params?.ma_length || 14,
              rsi_source: inp1.input_params?.rsi_source || "Close",
              ma_type: inp1.input_params?.ma_type || "SMA",
              bb_stddev: inp1.input_params?.bb_stddev || 2.0,
            },
          }
        } else if (inp1.name === "BBANDS") {
          return {
            title: "Bollinger Bands",
            details: {
              timeframe: inp1.timeframe,
              timeperiod: inp1.input_params?.timeperiod || 17,
              input: inp1.input || "upperband",
            },
          }
        } else if (inp1.name === "MACD") {
          return {
            title: "MACD",
            details: {
              timeframe: inp1.timeframe,
              fastperiod: inp1.input_params?.fastperiod || 12,
              slowperiod: inp1.input_params?.slowperiod || 26,
              signalperiod: inp1.input_params?.signalperiod || 9,
            },
          }
        } else if (inp1.name === "Volume_MA") {
          return {
            title: "Volume MA",
            details: {
              timeframe: inp1.timeframe,
              ma_length: inp1.input_params?.ma_length || 20,
            },
          }
        } else if (inp1.name === "GENERAL_PA") {
          return {
            title: "General PA",
            details: {
              timeframe: inp1.timeframe,
              ...(inp1.Derivative && { derivative_order: inp1.Derivative.order }),
            },
          }
        }
      } else if ("input" in inp1) {
        // Handle OHLC and other input-based indicators
        if (["open", "close", "high", "low"].includes(inp1.input?.toLowerCase() || "")) {
          return {
            title: "Price",
            details: {
              input: inp1.input,
              timeframe: inp1.timeframe,
            },
          }
        } else if (inp1.input === "volume") {
          return {
            title: "Volume",
            details: {
              input: inp1.input,
              timeframe: inp1.timeframe,
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
      } else if ("name" in inp2) {
        // Handle inp2 indicators similar to inp1
        if (inp2.name === "RSI") {
          return {
            title: "RSI",
            details: {
              timeframe: inp2.timeframe,
              rsi_length: inp2.input_params?.timeperiod || 14,
            },
          }
        }
      }
    }

    return null
  }

  // Add these functions after the getTooltipContent function
  const handleMouseEnter = (e: React.MouseEvent, condition: StrategyCondition, componentType: 'inp1' | 'inp2' | 'timeframe', index: number) => {
    const content = getTooltipContent(condition, componentType, index);
    if (content) {
      const rect = e.currentTarget.getBoundingClientRect();
      setHoveredComponent({
        show: true,
        content,
        position: {
          x: rect.left + rect.width / 2,
          y: rect.top -3
        }
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredComponent({
      show: false,
      content: null,
      position: { x: 0, y: 0 }
    });
  };

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
          // If the condition has an indicator, update its timeframe
          if (condition.inp1 && "timeframe" in condition.inp1) {
            condition.inp1.timeframe = timeframe
          } else {
            // Otherwise, update the condition's timeframe
            condition.timeframe = timeframe
          }

          setStatements(newStatements)
        }
      }
    }

    setShowTimeframeDropdown(false)
  }

  // New function to open timeframe dropdown for a specific condition
  const openTimeframeDropdown = (statementIndex: number, conditionIndex: number) => {
    setActiveStatementIndex(statementIndex)
    setActiveConditionIndex(conditionIndex)
    setShowTimeframeDropdown(true)
  }

  // Add a new function to open the AtCandleModal for editing
  const openAtCandleModal = (statementIndex: number, conditionIndex: number) => {
    setActiveStatementIndex(statementIndex)
    setActiveConditionIndex(conditionIndex)
    setShowAtCandleModal(true)
  }

  const handleSaveDraft = async (name: string) => {
    try {
      setIsSavingDraft(true)
      const currentStatement = statements[activeStatementIndex]

      // Create the statement object to send to the API with the structure you want
      const apiStatement = {
        name: name,
        side: currentStatement.side,
        saveresult: currentStatement.saveresult || "Statement 1",
        strategy: currentStatement.strategy,
        Equity: currentStatement.Equity || [],
        instrument: initialInstrument,
      }

      // Only add TradingType if it has properties
      if (currentStatement.TradingType && Object.keys(currentStatement.TradingType).length > 0) {
        apiStatement.TradingType = currentStatement.TradingType
      }

      let result

      // Check if we're editing an existing strategy
      if (strategyId && strategyData) {
        console.log("Updating existing strategy:", apiStatement)
        // Call editStrategy for existing strategies
        result = await editStrategy(strategyId, apiStatement)
        console.log("Strategy updated successfully:", result)
      } else {
        // Call createStatement for new strategies
        const account = localStorage.getItem("user_id")

        if (!account) {
          throw new Error("No account found in localStorage")
        }

        console.log("Creating new strategy:", apiStatement)
        result = await createStatement({
          account,
          statement: apiStatement,
        })
        console.log("Strategy created successfully:", result)
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

      // Create the statement object to send to the API with the structure you want
      const apiStatement = {
        name: name,
        side: currentStatement.side,
        saveresult: currentStatement.saveresult || "Statement 1",
        strategy: currentStatement.strategy,
        Equity: currentStatement.Equity || [],
        instrument: initialInstrument,
      }

      // Only add TradingType if it has properties
      if (currentStatement.TradingType && Object.keys(currentStatement.TradingType).length > 0) {
        apiStatement.TradingType = currentStatement.TradingType
      }

      // Save the complete statement for local use
      localStorage.setItem("savedStrategy", JSON.stringify(apiStatement))

      let result

      // Check if we're editing an existing strategy
      if (strategyId && strategyData) {
        console.log("Updating existing strategy for testing:", apiStatement)
        // Call editStrategy for existing strategies
        result = await editStrategy(strategyId, apiStatement)
        console.log("Strategy updated successfully:", result)

        // Store the existing strategy ID
        localStorage.setItem("strategy_id", strategyId)
      } else {
        // Call createStatement for new strategies
        const account = localStorage.getItem("user_id")

        if (!account) {
          throw new Error("No account found in localStorage")
        }

        console.log("Creating new strategy for testing:", apiStatement)
        result = await createStatement({
          account,
          statement: apiStatement,
        })
        console.log("Strategy created successfully:", result)

        // Store the new strategy ID if it exists in the response
        if (result && result.id) {
          localStorage.setItem("strategy_id", result.id)
        }
      }

      // Store timeframes_required if it exists in the response
      if (result && result.timeframes_required) {
        localStorage.setItem("timeframes_required", JSON.stringify(result.timeframes_required))
      }

      setIsProceeding(false)
      setShowSaveStrategyModal(false)
      router.push("/strategy-testing")
    } catch (error) {
      console.error("Error processing strategy:", error)
      setIsProceeding(false)
    }
  }

  // Update the toggleWaitParameter function to handle adding wait parameter if it doesn't exist
  function toggleWaitParameter(statementIndex: number, conditionIndex: number) {
    const newStatements = [...statements]
    const currentStatement = newStatements[statementIndex]
    const condition = currentStatement.strategy[conditionIndex]

    if (condition.inp1) {
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
      setStatements(newStatements)
    } else if (condition.inp2 && typeof condition.inp2 !== "string" && "type" in condition.inp2) {
      // Add or toggle wait for inp2
      if ("wait" in condition.inp2) {
        // Toggle if it already exists
        condition.inp2.wait = condition.inp2.wait === "yes" ? undefined : "yes"
      } else {
        // Add it if it doesn't exist
        condition.inp2.wait = "yes"
      }
      setStatements(newStatements)
    }
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
              onClick={() => openTimeframeDropdown(activeStatementIndex, index)}
              onMouseEnter={(e) => handleMouseEnter(e, condition, "timeframe", index)}
              onMouseLeave={handleMouseLeave}
              className="bg-[#151718] text-white px-3 py-2 rounded-md flex items-center justify-between min-w-[160px] border border-[#2A2D42] transition-all duration-200 hover:border-[#4A4D62]"
              data-timeframe-index={index}
            >
              <span className="text-gray-400">{timeframeValue || "Select timeframe"}</span>
              <ChevronDown className="ml-1 w-4 h-4" />
            </button>
            <button
              onClick={() => removeComponent(activeStatementIndex, index, "timeframe")}
              className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <X className="w-3 h-3" />
            </button>
          </div>,
        )
      }

      if (condition.index === -1) {
        components.push(
          <div key={`at-candle-${index}`} className="mr-2 mb-2 relative group">
            <div className="text-xs text-gray-400 mb-1">At Candle</div>
            <button
              onClick={() => openAtCandleModal(activeStatementIndex, index)}
              className="bg-[#151718] text-white px-3 py-2 rounded-md flex items-center justify-between min-w-[160px] border border-[#2A2D42]"
              data-candle-index={index}
            >
              <span className="text-gray-400">Candle {selectedCandleNumber || 1}</span>
              <ChevronDown className="ml-1 w-4 h-4" />
            </button>
            <button
              onClick={() => {
                // Remove the index property to remove the At Candle
                const newStatements = [...statements]
                const currentStatement = newStatements[activeStatementIndex]
                currentStatement.strategy.forEach((condition) => {
                  delete condition.index
                })
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

      if (condition.inp1) {
        // Indicators with light gray background
        let displayName = ""

        // Special handling for price indicators (type C with input like open, close, high, low)
        if (
          condition.inp1.type === "C" &&
          ["open", "close", "high", "low"].includes(condition.inp1.input?.toLowerCase() || "")
        ) {
          // Format as "Price / Type" with first letter capitalized
          const priceType = condition.inp1.input?.charAt(0).toUpperCase() + condition.inp1.input?.slice(1)
          displayName = `Price / ${priceType}`
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
              className="bg-[#C5C5C5] text-black px-3 py-1 rounded-md mr-2 mb-2 transition-all duration-200 hover:bg-[#D5D5D5] cursor-pointer"
              onMouseEnter={(e) => handleMouseEnter(e, condition, "inp1", index)}
              onMouseLeave={handleMouseLeave}
            >
              {displayName}
            </div>
            {"wait" in condition.inp1 && condition.inp1.wait && (
              <div className="ml-1 px-2 py-1 rounded-md text-xs text-white">Wait: Yes</div>
            )}
            <button
              onClick={() => removeComponent(activeStatementIndex, index, "inp1")}
              className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <X className="w-3 h-3" />
            </button>
          </div>,
        )
      }

      if (condition.operator_name) {
        // Behaviors with light gray background
        components.push(
          <div
            key={`operator-${index}`}
            className="bg-[#C5C5C5] text-black px-3 py-1 rounded-md mr-2 mb-2 relative group transition-all duration-200 hover:bg-[#D5D5D5] cursor-pointer"
            onMouseEnter={(e) => handleMouseEnter(e, condition, "operator", index)}
            onMouseLeave={handleMouseLeave}
          >
            {condition.operator_name.replace("_", " ")}
            <button
              onClick={() => removeComponent(activeStatementIndex, index, "operator")}
              className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <X className="w-3 h-3" />
            </button>
          </div>,
        )
      }

      // Show inp2 value for all behaviors
      if (condition.inp2) {
        // Values with light gray background
        if ("type" in condition.inp2 && condition.inp2.type === "value") {
          const isEditablePips =
            condition.operator_name === "atmost_above_pips" || condition.operator_name === "atmost_below_pips"

          if (isEditablePips) {
            components.push(
              <div key={`inp2-${index}`} className="flex items-center relative group">
                <button
                  className="bg-[#C5C5C5] text-black px-3 py-1 rounded-md mr-2 mb-2 flex items-center transition-all duration-200 hover:bg-[#D5D5D5]"
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
                  <span className="ml-1">pips</span>
                </button>
                {condition.inp2.wait && <div className="ml-1 px-2 py-1 rounded-md text-xs text-white">Wait: Yes</div>}
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
                  className="bg-[#C5C5C5] text-black px-3 py-1 rounded-md mr-2 mb-2 transition-all duration-200 hover:bg-[#D5D5D5] cursor-pointer"
                  onMouseEnter={(e) => handleMouseEnter(e, condition, "inp2", index)}
                  onMouseLeave={handleMouseLeave}
                >
                  {condition.inp2.value}
                </div>
                {condition.inp2.wait && <div className="ml-1 px-2 py-1 rounded-md text-xs text-white">Wait: Yes</div>}
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
          // Add "Derivative" label if it has a Derivative property
          let displayName = condition.inp2.name
          if (condition.inp2.Derivative) {
            displayName = `${displayName} (Derivative)`
          }

          components.push(
            <div key={`inp2-${index}`} className="flex items-center relative group">
              <div className="bg-[#C5C5C5] text-black px-3 py-1 rounded-md mr-2 mb-2">{displayName}</div>
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
          {statement.Equity.map((rule, index) => (
            <div key={index} className="bg-[#2A2D42] text-white px-3 py-1 rounded-md relative group">
              {rule.operator}
              <button
                onClick={() => {
                  const newStatements = [...statements]
                  newStatements[activeStatementIndex].Equity.splice(index, 1)
                  setStatements(newStatements)
                }}
                className="absolute -top-2 -right-2 bg-[#808080] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    )
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

  return (
    <div className="flex-1 flex flex-col">
      {/* Main content area with scrolling */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-medium">
              {strategyId
                ? `Editing Strategy: ${strategyName || strategyId}`
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
                <div className="flex items-center">
                  <h2 className="text-xl font-medium">{statement.saveresult}</h2>
                </div>
                <div className="relative flex items-center gap-4">
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
                        onClick={() => {
                          // If there's only one statement, navigate to home
                          if (statements.length === 1) {
                            router.push("/")
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
                        }}
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
                            className="w-full text-left px-4 py-2 hover:bg-[#3A3D47] text-white"
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
                  ? document.querySelector(`[data-timeframe-index="${activeConditionIndex}"]`)?.getBoundingClientRect()
                      .bottom +
                    window.scrollY +
                    5
                  : 0,
              left:
                activeConditionIndex !== null
                  ? document.querySelector(`[data-timeframe-index="${activeConditionIndex}"]`)?.getBoundingClientRect()
                      .left + window.scrollX
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
          onSave={(settings) => {
            // Update stochastic settings
            setShowStochasticModal(false)
            setTimeout(() => {
              searchInputRefs.current[activeStatementIndex]?.focus()
            }, 100)
          }}
        />
      )}
      {showCrossingUpModal && (
        <CrossingUpSettingsModal
          onClose={() => setShowCrossingUpModal(false)}
          onSave={(settings) => {
            // Update crossing up settings with the custom value
            const newStatements = [...statements]
            const currentStatement = newStatements[activeStatementIndex]
            const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

            if (lastCondition.operator_name === "crossabove" || lastCondition.operator_name === "crossbelow") {
              // Update the inp2 value with the settings from the modal
              if (settings.valueType === "value" && settings.customValue) {
                lastCondition.inp2 = {
                  type: "value",
                  value: Number(settings.customValue),
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
                      timeperiod: settings.timeperiod || 17,
                    },
                  }
                } else if (settings.indicator === "rsi") {
                  lastCondition.inp2 = {
                    type: "I",
                    name: "RSI",
                    timeframe: settings.timeframe || "3h",
                    input_params: {
                      timeperiod: settings.timeperiod || 14,
                    },
                  }
                } else {
                  // For other indicators like price, close, open, etc.
                  lastCondition.inp2 = {
                    type: "C",
                    input: settings.indicator,
                    timeframe: settings.timeframe || "3h",
                  }
                }
              } else if (settings.valueType === "indicator" && settings.indicator) {
                // Handle existing indicator selection
                if (settings.indicator === "bollinger") {
                  lastCondition.inp2 = {
                    type: "I",
                    name: "BBANDS",
                    timeframe: settings.timeframe || "3h",
                    input: settings.band || "upperband",
                    input_params: {
                      timeperiod: settings.timeperiod || 17,
                    },
                  }
                } else if (settings.indicator === "rsi") {
                  lastCondition.inp2 = {
                    type: "I",
                    name: "RSI",
                    timeframe: settings.timeframe || "3h",
                    input_params: {
                      timeperiod: settings.timeperiod || 14,
                    },
                  }
                } else {
                  // For other indicators
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
        />
      )}
      {showCrossingDownModal && (
        <CrossingDownSettingsModal
          onClose={() => setShowCrossingDownModal(false)}
          onSave={(settings) => {
            // Update crossing down settings with the custom value
            const newStatements = [...statements]
            const currentStatement = newStatements[activeStatementIndex]
            const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

            if (lastCondition.operator_name === "crossabove" || lastCondition.operator_name === "crossbelow") {
              // Update the inp2 value with the settings from the modal
              if (settings.valueType === "value" && settings.customValue) {
                lastCondition.inp2 = {
                  type: "value",
                  value: Number(settings.customValue),
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
                      timeperiod: settings.timeperiod || 17,
                    },
                  }
                } else if (settings.indicator === "rsi") {
                  lastCondition.inp2 = {
                    type: "I",
                    name: "RSI",
                    timeframe: settings.timeframe || "3h",
                    input_params: {
                      timeperiod: settings.timeperiod || 14,
                    },
                  }
                } else {
                  // For other indicators like price, close, open, etc.
                  lastCondition.inp2 = {
                    type: "C",
                    input: settings.indicator,
                    timeframe: settings.timeframe || "3h",
                  }
                }
              } else if (settings.valueType === "indicator" && settings.indicator) {
                // Handle existing indicator selection
                if (settings.indicator === "bollinger") {
                  lastCondition.inp2 = {
                    type: "I",
                    name: "BBANDS",
                    timeframe: settings.timeframe || "3h",
                    input: settings.band || "upperband",
                    input_params: {
                      timeperiod: settings.timeperiod || 17,
                    },
                  }
                } else if (settings.indicator === "rsi") {
                  lastCondition.inp2 = {
                    type: "I",
                    name: "RSI",
                    timeframe: settings.timeframe || "3h",
                    input_params: {
                      timeperiod: settings.timeperiod || 14,
                    },
                  }
                } else {
                  // For other indicators
                  lastCondition.inp2 = {
                    type: "C",
                    input: settings.indicator,
                    timeframe: settings.timeframe || "3h",
                  }
                }
              }
            }

            setStatements(newStatements)
            setShowCrossingDownModal(false)
            setTimeout(() => {
              searchInputRefs.current[activeStatementIndex]?.focus()
            }, 100)
          }}
        />
      )}
      {/* Above Settings Modal */}
      {showAboveModal && (
        <AboveSettingsModal
          onClose={() => setShowAboveModal(false)}
          onSave={(settings) => {
            // Update above settings with the custom value
            const newStatements = [...statements]
            const currentStatement = newStatements[activeStatementIndex]
            const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

            if (lastCondition.operator_name === "above") {
              // Update the inp2 value with the settings from the modal
              if (settings.valueType === "value" && settings.customValue) {
                lastCondition.inp2 = {
                  type: "value",
                  value: Number(settings.customValue),
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
                      timeperiod: settings.timeperiod || 17,
                    },
                  }
                } else if (settings.indicator === "rsi") {
                  lastCondition.inp2 = {
                    type: "I",
                    name: "RSI",
                    timeframe: settings.timeframe || "3h",
                    input_params: {
                      timeperiod: settings.timeperiod || 14,
                    },
                  }
                } else {
                  // For other indicators like price, close, open, etc.
                  lastCondition.inp2 = {
                    type: "C",
                    input: settings.indicator,
                    timeframe: settings.timeframe || "3h",
                  }
                }
              } else if (settings.valueType === "indicator" && settings.indicator) {
                // Handle existing indicator selection
                if (settings.indicator === "bollinger") {
                  lastCondition.inp2 = {
                    type: "I",
                    name: "BBANDS",
                    timeframe: settings.timeframe || "3h",
                    input: settings.band || "upperband",
                    input_params: {
                      timeperiod: settings.timeperiod || 17,
                    },
                  }
                } else if (settings.indicator === "rsi") {
                  lastCondition.inp2 = {
                    type: "I",
                    name: "RSI",
                    timeframe: settings.timeframe || "3h",
                    input_params: {
                      timeperiod: settings.timeperiod || 14,
                    },
                  }
                } else {
                  // For other indicators
                  lastCondition.inp2 = {
                    type: "C",
                    input: settings.indicator,
                    timeframe: settings.timeframe || "3h",
                  }
                }
              }
            }

            setStatements(newStatements)
            setShowAboveModal(false)
            setTimeout(() => {
              searchInputRefs.current[activeStatementIndex]?.focus()
            }, 100)
          }}
        />
      )}
      {/* Below Settings Modal */}
      {showBelowModal && (
        <BelowSettingsModal
          onClose={() => setShowBelowModal(false)}
          onSave={(settings) => {
            // Update below settings with the custom value
            const newStatements = [...statements]
            const currentStatement = newStatements[activeStatementIndex]
            const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

            if (lastCondition.operator_name === "below") {
              // Update the inp2 value with the settings from the modal
              if (settings.valueType === "value" && settings.customValue) {
                lastCondition.inp2 = {
                  type: "value",
                  value: Number(settings.customValue),
                }
              } else if (settings.valueType === "other" && settings.indicator) {
                // Handle indicator type for "other" option
                if (settings.indicator === "bollinger") {
                  lastCondition.inp2 = {
                    type: "I",
                    name: "BBANDS",
                    timeframe: settings.timeframe || "3h",
                    input: settings.band || "lowerband",
                    input_params: {
                      timeperiod: settings.timeperiod || 17,
                    },
                  }
                } else if (settings.indicator === "rsi") {
                  lastCondition.inp2 = {
                    type: "I",
                    name: "RSI",
                    timeframe: settings.timeframe || "3h",
                    input_params: {
                      timeperiod: settings.timeperiod || 14,
                    },
                  }
                } else {
                  // For other indicators like price, close, open, etc.
                  lastCondition.inp2 = {
                    type: "C",
                    input: settings.indicator,
                    timeframe: settings.timeframe || "3h",
                  }
                }
              } else if (settings.valueType === "indicator" && settings.indicator) {
                // Handle existing indicator selection
                if (settings.indicator === "bollinger") {
                  lastCondition.inp2 = {
                    type: "I",
                    name: "BBANDS",
                    timeframe: settings.timeframe || "3h",
                    input: settings.band || "lowerband",
                    input_params: {
                      timeperiod: settings.timeperiod || 17,
                    },
                  }
                } else if (settings.indicator === "rsi") {
                  lastCondition.inp2 = {
                    type: "I",
                    name: "RSI",
                    timeframe: settings.timeframe || "3h",
                    input_params: {
                      timeperiod: settings.timeperiod || 14,
                    },
                  }
                } else {
                  // For other indicators
                  lastCondition.inp2 = {
                    type: "C",
                    input: settings.indicator,
                    timeframe: settings.timeframe || "3h",
                  }
                }
              }
            }

            setStatements(newStatements)
            setShowBelowModal(false)
            setTimeout(() => {
              searchInputRefs.current[activeStatementIndex]?.focus()
            }, 100)
          }}
        />
      )}
      {showRsiModal && (
        <RsiSettingsModal
          onClose={() => setShowRsiModal(false)}
          onSave={(settings) => {
            // Update RSI settings
            const newStatements = [...statements]
            const currentStatement = newStatements[activeStatementIndex]
            const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

            if (lastCondition.inp1 && "timeframe" in lastCondition.inp1) {
              if (settings.indicatorType === "rsi-ma") {
                // Update to RSI_MA
                lastCondition.inp1 = {
                  type: "CUSTOM_I",
                  name: "RSI_MA",
                  timeframe: "36min",
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
                  },
                }
              }
            }

            setStatements(newStatements)
            setShowRsiModal(false)
            setTimeout(() => {
              searchInputRefs.current[activeStatementIndex]?.focus()
            }, 100)
          }}
        />
      )}
      {showBollingerModal && (
        <BollingerBandsSettingsModal
          onClose={() => setShowBollingerModal(false)}
          onSave={(settings) => {
            // Update Bollinger settings
            const newStatements = [...statements]
            const currentStatement = newStatements[activeStatementIndex]
            const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

            if (lastCondition.inp1 && "name" in lastCondition.inp1 && lastCondition.inp1.name === "BBANDS") {
              // Only update the timeperiod parameter
              lastCondition.inp1.input_params = {
                timeperiod: settings.timeperiod,
              }
            }

            setStatements(newStatements)
            setShowBollingerModal(false)
            setTimeout(() => {
              searchInputRefs.current[activeStatementIndex]?.focus()
            }, 100)
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

            setStatements(newStatements)
            setShowVolumeModal(false)
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
            const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

            if (lastCondition.inp1 && "name" in lastCondition.inp1 && lastCondition.inp1.name === "ATR") {
              // Update with settings from modal
              lastCondition.inp1.input_params = {
                ...lastCondition.inp1.input_params,
                ...settings,
              }
            }

            setStatements(newStatements)
            setShowAtrModal(false)
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
            const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

            if (lastCondition.inp1 && "name" in lastCondition.inp1 && lastCondition.inp1.name === "MACD") {
              // Update with settings from modal
              lastCondition.inp1.input_params = {
                ...lastCondition.inp1.input_params,
                ...settings,
              }
            }

            setStatements(newStatements)
            setShowMacdModal(false)
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
            const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

            if (lastCondition.operator_name === "inside_channel") {
              // Update with settings from modal
              if (settings) {
                lastCondition.inp2 = {
                  type: "channel",
                  value: settings.value || 0,
                }
              }
            }

            setStatements(newStatements)
            setShowChannelModal(false)
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
          onClose={() => setShowSLTPSettings({ show: false, type: "SL" })}
          onSave={(settings) => {
            handleSLTPSettings(settings)
            setShowSLTPSettings({ show: false, type: "SL" })
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
          onSave={(value) => {
            const newStatements = [...statements]
            const condition = newStatements[showPipsModal.statementIndex].strategy[showPipsModal.conditionIndex]

            // Update the pips property directly
            if (condition.operator_name === "atmost_above_pips" || condition.operator_name === "atmost_below_pips") {
              condition.pips = value
            }

            setStatements(newStatements)
            setShowPipsModal({ show: false, statementIndex: 0, conditionIndex: 0 })
            setTimeout(() => {
              searchInputRefs.current[activeStatementIndex]?.focus()
            }, 100)
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
        <PriceSettingsModal onClose={() => setShowPriceSettingsModal(false)} onSave={handlePriceSelection} />
      )}
      {/* At Candle Modal */}
      {showAtCandleModal && (
        <AtCandleModal
          initialValue={selectedCandleNumber || 1}
          onClose={() => setShowAtCandleModal(false)}
          onSave={handleAtCandleSelection}
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
          <div className="bg-[#C5C5C5] text-black px-3 py-1 rounded-md mr-2 mb-2  px-3 py-2 rounded-lg shadow-lg border border-[#4A4D62] animate-in fade-in-0 zoom-in-95 duration-200">
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
    </div>
  )
}
