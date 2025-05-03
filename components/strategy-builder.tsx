"use client"

import { useState, useRef } from "react"
import { Edit, MoreVertical, Plus, ChevronDown } from "lucide-react"
import { ComponentsSidebar } from "@/components/components-sidebar"
import { TimeframeDropdown } from "@/components/timeframe-dropdown"
import { StochasticSettingsModal } from "@/components/modals/stochastic-settings-modal"
import { CrossingUpSettingsModal } from "@/components/modals/crossing-up-settings-modal"
import { BollingerBandsSettingsModal } from "@/components/modals/bollinger-bands-settings-modal"
import { VolumeSettingsModal } from "@/components/modals/volume-settings-modal"
import { AtrSettingsModal } from "@/components/modals/atr-settings-modal"
import { MacdSettingsModal } from "@/components/modals/macd-settings-modal"
import { RsiSettingsModal } from "@/components/modals/rsi-settings-modal"
import { ChannelSettingsModal } from "@/components/modals/channel-settings-modal"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createStatement } from "@/app/AllApiCalls"

interface StrategyBuilderProps {
  initialName: string
  initialInstrument: string
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
}

// Update the StrategyCondition interface to support inp2 and more complex structures
interface StrategyCondition {
  statement: string
  index?: number
  inp1?: IndicatorInput
  operator_name?: string
  inp2?: {
    type: string
    value: number
  }
  timeframe?: string // Added timeframe property to StrategyCondition
}

interface EquityRule {
  statement: string
  operator: string
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

export function StrategyBuilder({ initialName, initialInstrument }: StrategyBuilderProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("create")
  const [showStochasticModal, setShowStochasticModal] = useState(false)
  const [showCrossingUpModal, setShowCrossingUpModal] = useState(false)
  const [showBollingerModal, setShowBollingerModal] = useState(false)
  const [showVolumeModal, setShowVolumeModal] = useState(false)
  const [showAtrModal, setShowAtrModal] = useState(false)
  const [showMacdModal, setShowMacdModal] = useState(false)
  const [showRsiModal, setShowRsiModal] = useState(false)
  const [showChannelModal, setShowChannelModal] = useState(false)

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

  // Component lists for search functionality
  const basicComponents = [
    { id: "if", label: "If" },
    { id: "unless", label: "Unless" },
    { id: "then", label: "Then" },
    { id: "timeframe", label: "Timeframe" },
    { id: "duration", label: "Duration" },
    { id: "when", label: "When" },
    { id: "at-candle", label: "At Candle" },
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
  ]

  // Update the extraIndicators array to include Volume_MA and RSI_MA
  const extraIndicators = [
    { id: "ma", label: "MA" },
    { id: "volume-ma", label: "Volume_MA" },
    { id: "rsi-ma", label: "RSI_MA" },
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
  ]

  const actions = [
    { id: "long", label: "Long" },
    { id: "short", label: "Short" },
    { id: "wait", label: "Wait" },
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
    if (behavior.toLocaleLowerCase() === "abovee") return "above"
    return behavior.toLowerCase()
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
      } else if (statementType === "and" && currentStatement.strategy.length > 0) {
        // Add "and" statement
        currentStatement.strategy.push({
          statement: "and",
          timeframe: selectedTimeframe, // Add default timeframe
        })
      }
    } else if (
      indicators.some((c) => c.label.toLowerCase() === component.toLowerCase()) ||
      extraIndicators.some((c) => c.label.toLowerCase() === component.toLowerCase())
    ) {
      // Adding an indicator
      if (currentStatement.strategy.length > 0) {
        const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

        // Get the timeframe from the condition or use the selected timeframe
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
            timeframe: timeframe,
            input_params: {
              rsi_length: 14,
              ma_length: 14,
            },
          }
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

        // Show the appropriate settings modal
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
    } else if (behaviours.some((c) => c.label.toLowerCase() === component.toLowerCase())) {
      // Adding a behavior
      if (currentStatement.strategy.length > 0) {
        const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

        // Add the behavior to the last condition
        lastCondition.operator_name = getOperatorName(component)

        // Add default inp2 value for behaviors except moving_up and moving_down
        if (lastCondition.operator_name !== "moving_up" && lastCondition.operator_name !== "moving_down") {
          lastCondition.inp2 = {
            type: "value",
            value:
              lastCondition.operator_name === "crossabove"
                ? 60
                : lastCondition.operator_name === "crossbelow"
                  ? 40
                  : 50,
          }
        }

        // Show the appropriate settings modal
        if (component === "Crossing up" || component === "Crossing down") {
          setShowCrossingUpModal(true)
        } else if (component === "Inside Channel") {
          setShowChannelModal(true)
        }
      }
    } else if (component.toLowerCase() === "long" || component.toLowerCase() === "short") {
      // Set the side based on Long/Short selection
      currentStatement.side = component.toLowerCase() === "long" ? "B" : "S"
    } else if (component.toLowerCase() === "sl" || component.toLowerCase() === "tp") {
      // Adding equity rules
      const equityType = component.toUpperCase()
      const multiplier = equityType === "SL" ? 1.02 : 0.96

      if (!currentStatement.Equity) {
        currentStatement.Equity = []
      }

      currentStatement.Equity.push({
        statement: "and",
        operator: `${equityType} = Close * ${multiplier}`,
      })
    }

    setStatements(newStatements)
    setActiveStatementIndex(statementIndex)

    // Clear search after adding component
    setSearchTerm("")
    setSearchResults([])
    searchInputRefs.current[statementIndex]?.focus()
  }

  // Update the handleTimeframeSelect function to update the timeframe in inp1 if it exists
  const handleTimeframeSelect = (timeframe: string) => {
    setSelectedTimeframe(timeframe)

    // If we have an active condition, update its timeframe
    if (activeConditionIndex !== null) {
      const newStatements = [...statements]
      const currentStatement = newStatements[activeStatementIndex]
      const condition = currentStatement.strategy[activeConditionIndex]

      if (condition) {
        // If the condition has an indicator, update its timeframe
        if (condition.inp1) {
          condition.inp1.timeframe = timeframe
        } else {
          // Otherwise, update the condition's timeframe
          condition.timeframe = timeframe
        }

        setStatements(newStatements)
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

  // Remove the handleSideChange function
  // Remove this function entirely

  const handleContinue = async () => {
    try {
      const currentStatement = statements[activeStatementIndex]

      // Create a new object with only the required properties
      const formattedStatement = {
        side: currentStatement.side,
        saveresult: currentStatement.saveresult || "Statement 1",
        strategy: currentStatement.strategy,
      }

      // Only add Equity if it's not empty
      if (currentStatement.Equity && currentStatement.Equity.length > 0) {
        formattedStatement.Equity = currentStatement.Equity
      }

      // Only add TradingType if it has properties
      if (currentStatement.TradingType && Object.keys(currentStatement.TradingType).length > 0) {
        formattedStatement.TradingType = currentStatement.TradingType
      }

      const account = localStorage.getItem("user_id")
      localStorage.setItem("savedStrategy", JSON.stringify(formattedStatement))

      if (!account) {
        throw new Error("No account found in localStorage")
      }

      console.log("Formatted statement:", formattedStatement)

      // Call the API with the correct structure
      const result = await createStatement({
        account,
        statement: formattedStatement,
      })

      console.log("Statement created successfully:", result)

      // Store the strategy ID in localStorage if it exists in the response
      if (result && result.id) {
        localStorage.setItem("strategy_id", result.id)
      }

      router.push("/strategy-testing")
    } catch (error) {
      console.error("Error creating statement:", error)
    }
  }

  // Update the renderStrategyConditions function to handle the new structure
  const renderStrategyConditions = (statement: StrategyStatement) => {
    const components: JSX.Element[] = []

    // Add each condition with appropriate background
    statement.strategy.forEach((condition, index) => {
      if (condition.statement) {
        // Basic components (if, and, etc.) with dark background
        components.push(
          <div key={`statement-${index}`} className="bg-[#1A1D2D] text-white px-3 py-1 rounded-md mr-2 mb-2">
            {condition.statement.toUpperCase()}
          </div>,
        )
      }

      // Add timeframe component if it exists and there's no inp1
      // Or get timeframe from inp1 if it exists
      const timeframeValue = condition.inp1 ? condition.inp1.timeframe : condition.timeframe

      if (timeframeValue) {
        components.push(
          <div key={`timeframe-${index}`} className="flex flex-col mr-2 mb-2">
            <div className="text-xs text-gray-400 mb-1">Timeframe</div>
            <div className="relative">
              <button
                onClick={() => openTimeframeDropdown(activeStatementIndex, index)}
                className="bg-[#1A1D2D] text-white px-3 py-1 rounded-md flex items-center justify-between min-w-[80px]"
              >
                {timeframeValue} <ChevronDown className="ml-1 w-4 h-4" />
              </button>
            </div>
          </div>,
        )
      }

      if (condition.inp1) {
        // Indicators with white background
        const displayName = condition.inp1.name || condition.inp1.input?.toUpperCase() || ""
        components.push(
          <div key={`inp1-${index}`} className="bg-white text-black px-3 py-1 rounded-md mr-2 mb-2">
            {displayName}
          </div>,
        )
      }

      if (condition.operator_name) {
        // Behaviors with white background
        components.push(
          <div key={`operator-${index}`} className="bg-white text-black px-3 py-1 rounded-md mr-2 mb-2">
            {condition.operator_name.replace("_", " ")}
          </div>,
        )
      }

      // Show inp2 value for all behaviors
      if (condition.inp2) {
        // Values with white background
        components.push(
          <div key={`inp2-${index}`} className="bg-white text-black px-3 py-1 rounded-md mr-2 mb-2">
            {condition.inp2.value}
          </div>,
        )
      }
    })

    return components
  }

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  // Function to render equity rules
  const renderEquityRules = (statement: StrategyStatement) => {
    return statement.Equity.map((rule, index) => (
      <div key={index} className="bg-white text-black px-3 py-1 rounded-md">
        {rule.operator}
      </div>
    ))
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Tabs */}
      <div className="flex w-full">
        <div
          className={`flex-1 py-3 text-center font-medium cursor-pointer ${
            activeTab === "create" ? "bg-[#c7c7c7] text-black" : "bg-[#9d9d9d] text-white"
          }`}
          onClick={() => setActiveTab("create")}
        >
          CREATE
        </div>
        <div
          className={`flex-1 py-3 text-center font-medium cursor-pointer ${
            activeTab === "test" ? "bg-[#c7c7c7] text-black" : "bg-[#9d9d9d] text-white"
          }`}
          onClick={() => setActiveTab("test")}
        >
          TEST & OPTIMISE
        </div>
      </div>

      <div className="flex flex-1">
        {/* Main content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-medium">Building algorithm for {initialInstrument}</h1>
              <button className="ml-2 p-1 hover:bg-gray-700 rounded-full">
                <Edit className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-3">
              {/* Buy/Sell selector */}
              <button className="px-4 py-2 bg-[#1E2132] rounded-full text-white hover:bg-gray-700">Add Setup</button>
              <button
                className="px-4 py-2 bg-[#1E2132] rounded-full text-white hover:bg-gray-700"
                onClick={addStatement}
              >
                Add Statement
              </button>
            </div>
          </div>

          {/* Statements */}
          <div className="space-y-6">
            {statements.map((statement, index) => (
              <div key={index} className="bg-[#1E2132] rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <h2 className="text-xl font-medium">{statement.saveresult}</h2>
                    <span className="ml-3 px-3 py-1 bg-[#2A2D42] rounded-full text-sm">
                      {statement.side === "B" ? "Long " : "Short"}
                    </span>
                  </div>
                  <div className="relative flex items-center gap-4">
                    <button onClick={toggleDropdown} className="p-1 hover:bg-gray-700 rounded-full">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {isDropdownOpen && (
                      <div className="absolute right-0 top-3 bg-[#2A2D42] rounded-lg shadow-md p-2 mt-4">
                        <button className="w-full text-white p-2 hover:bg-red-600 rounded-lg">Delete</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Strategy section */}
                <div className="bg-[#1A1D2D] p-4 rounded-lg mb-4">
                  {/* Replace the existing flex flex-col space-y-4 div with this: */}
                  <div className="flex items-center flex-wrap gap-2">
                    {renderStrategyConditions(statement)}

                    <div className="relative flex-1 min-w-[200px]">
                      <input
                        ref={(el) => (searchInputRefs.current[index] = el)}
                        type="text"
                        placeholder="Start typing a component name..."
                        className="w-full bg-transparent border-none outline-none"
                        value={activeStatementIndex === index ? searchTerm : ""}
                        onChange={(e) => handleSearchInput(index, e.target.value)}
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
                </div>
              </div>
            ))}
          </div>

          {/* Add statement button */}
          <div className="flex justify-center mt-6">
            <button onClick={addStatement} className="p-3 rounded-full bg-[#1E2132] hover:bg-gray-700">
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* Bottom buttons */}
          <div className="flex justify-between mt-8">
            <Link href="/">
              <button className="px-8 py-3 bg-[#1E2132] rounded-full text-white hover:bg-gray-700">Cancel</button>
            </Link>
            <div className="flex gap-3">
              <button className="px-8 py-3 bg-[#1E2132] rounded-full text-white hover:bg-gray-700">
                Save for later
              </button>
              <button
                className="px-8 py-3 bg-[#85e1fe] rounded-full text-black hover:bg-[#5AB9D1]"
                onClick={handleContinue}
              >
                Continue
              </button>
            </div>
          </div>
        </div>

        {/* Components sidebar */}
        <ComponentsSidebar onComponentSelect={(component) => handleAddComponent(activeStatementIndex, component)} />
      </div>

      {/* Timeframe dropdown */}
      {showTimeframeDropdown && (
        <TimeframeDropdown onSelect={handleTimeframeSelect} onClose={() => setShowTimeframeDropdown(false)} />
      )}

      {/* Modals */}
      {showStochasticModal && (
        <StochasticSettingsModal
          onClose={() => setShowStochasticModal(false)}
          onSave={(settings) => {
            // Update stochastic settings
            setShowStochasticModal(false)
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
              } else if (settings.indicatorType) {
                // Handle indicator type if needed
                lastCondition.inp2 = {
                  type: "indicator",
                  value: 0, // This would be replaced with the actual indicator reference
                }
              }
            }

            setStatements(newStatements)
            setShowCrossingUpModal(false)
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

            if (lastCondition.inp1) {
              if (settings.indicatorType === "rsi-ma") {
                // Update to RSI_MA
                lastCondition.inp1 = {
                  type: "CUSTOM_I",
                  name: "RSI_MA",
                  timeframe: lastCondition.inp1.timeframe,
                  input_params: {
                    rsi_length: Number(settings.rsiLength),
                    ma_length: Number(settings.maLength),
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

            if (lastCondition.inp1 && lastCondition.inp1.name === "BBANDS") {
              // Only update the timeperiod parameter
              lastCondition.inp1.input_params = {
                timeperiod: settings.timeperiod,
              }
            }

            setStatements(newStatements)
            setShowBollingerModal(false)
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

            if (lastCondition.inp1) {
              if (settings.indicatorType === "volume-ma") {
                // Update to Volume_MA
                lastCondition.inp1 = {
                  type: "CUSTOM_I",
                  name: "VOLUME_MA",
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

            if (lastCondition.inp1 && lastCondition.inp1.name === "ATR") {
              // Update with settings from modal
              lastCondition.inp1.input_params = {
                ...lastCondition.inp1.input_params,
                ...settings,
              }
            }

            setStatements(newStatements)
            setShowAtrModal(false)
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

            if (lastCondition.inp1 && lastCondition.inp1.name === "MACD") {
              // Update with settings from modal
              lastCondition.inp1.input_params = {
                ...lastCondition.inp1.input_params,
                ...settings,
              }
            }

            setStatements(newStatements)
            setShowMacdModal(false)
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
          }}
        />
      )}
    </div>
  )
}
