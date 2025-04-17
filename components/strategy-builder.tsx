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

interface StrategyBuilderProps {
  initialName: string
  initialInstrument: string
}

// Define the structure for our strategy statements
interface IndicatorParams {
  timeperiod?: number
  [key: string]: any
}

interface IndicatorInput {
  type: string
  name: string
  timeframe: string
  input_params: IndicatorParams
}

interface StrategyCondition {
  statement: string
  index?: number
  inp1?: IndicatorInput
  operator_name?: string
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
  const [showSideDropdown, setShowSideDropdown] = useState(false)

  // Initialize with a sample statement structure
  const [statements, setStatements] = useState<StrategyStatement[]>([
    {
      side: "S",
      saveresult: "Statement_1",
      strategy: [],
      Equity: [],
    },
  ])

  const [activeStatementIndex, setActiveStatementIndex] = useState(0)
  const [selectedTimeframe, setSelectedTimeframe] = useState("3h")
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false)

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
    { id: "macd", label: "MACD" },
    { id: "bollinger", label: "Bollinger" },
    { id: "price", label: "Price" },
    { id: "stochastic", label: "Stochastic" },
    { id: "atr", label: "ATR" },
  ]

  const extraIndicators = [{ id: "ma", label: "MA" }]

  const behaviours = [
    { id: "crossing-up", label: "Crossing up" },
    { id: "crossing-down", label: "Crossing down" },
    { id: "greater-than", label: "Greater than" },
    { id: "less-than", label: "Less than" },
    { id: "inside-channel", label: "Inside Channel" },
    { id: "moving-up", label: "Moving up" },
    { id: "moving-down", label: "Moving down" },
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
      side: "S",
      saveresult: `Statement_${statements.length + 1}`,
      strategy: [],
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

  // Function to map behavior labels to operator names
  const getOperatorName = (behavior: string) => {
    if (behavior.toLowerCase() === "crossing up") return "crossing_up"
    if (behavior.toLowerCase() === "crossing down") return "crossing_down"
    if (behavior.toLowerCase() === "moving up") return "moving_up"
    if (behavior.toLowerCase() === "moving down") return "moving_down"
    if (behavior.toLowerCase() === "greater than") return "greater_than"
    if (behavior.toLowerCase() === "less than") return "less_than"
    if (behavior.toLowerCase() === "inside channel") return "inside_channel"
    return behavior.toLowerCase()
  }

  // Handle adding components to the strategy
  const handleAddComponent = (statementIndex: number, component: string) => {
    const newStatements = [...statements]
    const currentStatement = newStatements[statementIndex]

    // Determine what type of component is being added
    if (
      basicComponents.some((c) => c.label.toLowerCase() === component.toLowerCase()) ||
      extraBasicComponents.some((c) => c.label.toLowerCase() === component.toLowerCase())
    ) {
      // Adding a basic component (if, and, etc.)
      const statementType = getStatementType(component)

      // If it's the first component, it should be "if"
      if (currentStatement.strategy.length === 0 && statementType === "if") {
        currentStatement.strategy.push({
          statement: "if",
          index: -1,
        })
      } else if (statementType === "and" && currentStatement.strategy.length > 0) {
        // Add "and" statement
        currentStatement.strategy.push({
          statement: "and",
        })
      }
    } else if (
      indicators.some((c) => c.label.toLowerCase() === component.toLowerCase()) ||
      extraIndicators.some((c) => c.label.toLowerCase() === component.toLowerCase())
    ) {
      // Adding an indicator
      if (currentStatement.strategy.length > 0) {
        const lastCondition = currentStatement.strategy[currentStatement.strategy.length - 1]

        // Add the indicator to the last condition
        lastCondition.inp1 = {
          type: "I",
          name: component.toUpperCase(),
          timeframe: selectedTimeframe,
          input_params: {
            timeperiod: 14, // Default value
          },
        }

        // Show the appropriate settings modal
        if (component === "RSI") {
          setShowRsiModal(true)
        } else if (component === "Stochastic") {
          setShowStochasticModal(true)
        } else if (component === "Bollinger") {
          setShowBollingerModal(true)
        } else if (component === "Volume") {
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

        // Show the appropriate settings modal
        if (component === "Crossing up") {
          setShowCrossingUpModal(true)
        } else if (component === "Inside Channel") {
          setShowChannelModal(true)
        }
      }
    } else if (component.toLowerCase() === "sl" || component.toLowerCase() === "tp") {
      // Adding equity rules
      const equityType = component.toUpperCase()
      const multiplier = equityType === "SL" ? 1.02 : 0.96

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

  const handleTimeframeSelect = (timeframe: string) => {
    setSelectedTimeframe(timeframe)
    setShowTimeframeDropdown(false)

    // Update timeframe for the current statement's indicators
    const newStatements = [...statements]
    const currentStatement = newStatements[activeStatementIndex]

    currentStatement.strategy.forEach((condition) => {
      if (condition.inp1) {
        condition.inp1.timeframe = timeframe
      }
    })

    setStatements(newStatements)
  }

  const handleSideChange = (side: string) => {
    const newStatements = [...statements]
    newStatements[activeStatementIndex].side = side
    setStatements(newStatements)
    setShowSideDropdown(false)
  }

  const handleContinue = () => {
    router.push("/strategy-testing")
  }

  // Function to render the strategy conditions
  const renderStrategyConditions = (statement: StrategyStatement) => {
    return statement.strategy.map((condition, index) => {
      let display = condition.statement.toUpperCase()

      if (condition.inp1) {
        display += ` ${condition.inp1.name}`

        if (condition.operator_name) {
          display += ` ${condition.operator_name.replace("_", " ")}`
        }
      }

      return (
        <div key={index} className="bg-white text-black px-3 py-1 rounded-md">
          {display}
        </div>
      )
    })
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
                  <h2 className="text-xl font-medium">{statement.saveresult}</h2>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <button
                        onClick={() => {
                          setActiveStatementIndex(index)
                          setShowSideDropdown(!showSideDropdown && activeStatementIndex === index)
                        }}
                        className="bg-[#2B2E38] px-3 py-1 rounded-md flex items-center"
                      >
                        Side: {statement.side === "S" ? "Sell" : "Buy"} <ChevronDown className="ml-1 w-4 h-4" />
                      </button>

                      {showSideDropdown && activeStatementIndex === index && (
                        <div className="absolute z-10 mt-1 w-full bg-[#2B2E38] border border-gray-700 rounded-md shadow-lg">
                          <button
                            className="w-full text-left px-4 py-2 hover:bg-[#3A3D47] text-white"
                            onClick={() => handleSideChange("B")}
                          >
                            Buy
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 hover:bg-[#3A3D47] text-white"
                            onClick={() => handleSideChange("S")}
                          >
                            Sell
                          </button>
                        </div>
                      )}
                    </div>
                    <button className="p-1 hover:bg-gray-700 rounded-full">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Strategy section */}
                <div className="bg-[#1A1D2D] p-4 rounded-lg mb-4">
                  <h3 className="text-sm font-medium mb-2">Strategy</h3>
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center flex-wrap gap-2">
                      <div className="text-xs text-gray-400 mr-2">Timeframe</div>
                      <div className="relative">
                        <button
                          onClick={() => {
                            setActiveStatementIndex(index)
                            setShowTimeframeDropdown(!showTimeframeDropdown)
                          }}
                          className="bg-[#2B2E38] px-3 py-1 rounded-md flex items-center"
                        >
                          {selectedTimeframe} <ChevronDown className="ml-1 w-4 h-4" />
                        </button>

                        {showTimeframeDropdown && activeStatementIndex === index && (
                          <TimeframeDropdown
                            onSelect={handleTimeframeSelect}
                            onClose={() => setShowTimeframeDropdown(false)}
                          />
                        )}
                      </div>

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

                {/* Equity section */}
                <div className="bg-[#1A1D2D] p-4 rounded-lg">
                  <h3 className="text-sm font-medium mb-2">Equity Management</h3>
                  <div className="flex flex-wrap gap-2">
                    {renderEquityRules(statement)}

                    <button
                      className="bg-[#2B2E38] px-3 py-1 rounded-md text-sm"
                      onClick={() => handleAddComponent(index, "SL")}
                    >
                      Add SL
                    </button>
                    <button
                      className="bg-[#2B2E38] px-3 py-1 rounded-md text-sm"
                      onClick={() => handleAddComponent(index, "TP")}
                    >
                      Add TP
                    </button>
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
            // Update crossing up settings
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

            if (lastCondition.inp1 && lastCondition.inp1.name === "RSI") {
              lastCondition.inp1.input_params.timeperiod = settings.rsiLength
            }

            setStatements(newStatements)
            setShowRsiModal(false)
          }}
        />
      )}

      {showBollingerModal && (
        <BollingerBandsSettingsModal
          onClose={() => setShowBollingerModal(false)}
          onSave={() => setShowBollingerModal(false)}
        />
      )}

      {showVolumeModal && (
        <VolumeSettingsModal onClose={() => setShowVolumeModal(false)} onSave={() => setShowVolumeModal(false)} />
      )}

      {showAtrModal && (
        <AtrSettingsModal onClose={() => setShowAtrModal(false)} onSave={() => setShowAtrModal(false)} />
      )}

      {showMacdModal && (
        <MacdSettingsModal onClose={() => setShowMacdModal(false)} onSave={() => setShowMacdModal(false)} />
      )}

      {showChannelModal && (
        <ChannelSettingsModal onClose={() => setShowChannelModal(false)} onSave={() => setShowChannelModal(false)} />
      )}
    </div>
  )
}
