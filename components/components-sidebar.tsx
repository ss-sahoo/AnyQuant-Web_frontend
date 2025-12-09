"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface ComponentsSidebarProps {
  onComponentSelect: (component: string) => void
}

export function ComponentsSidebar({ onComponentSelect }: ComponentsSidebarProps) {
  const [showAllBasic, setShowAllBasic] = useState(false)
  const [showAllIndicators, setShowAllIndicators] = useState(false)
  const [showAllBehaviors, setShowAllBehaviors] = useState(false)
  const [showAllActions, setShowAllActions] = useState(false)
  const [showAllTradeManagement, setShowAllTradeManagement] = useState(false)

  const [indicatorSearch, setIndicatorSearch] = useState("")
  const [behaviorSearch, setBehaviorSearch] = useState("")

  // Complete list of basic components
  const allBasicComponents = [
    "If",
    "Unless",
    // "Then",
    "Timeframe",
    "Duration",
    "When",
    "At Candle",
    "Is not",
    "And",
    "Or",
    "Not",
    "Else",
    "For Each",
    // "While",
    // "Until",
    // "After",
    // "Before",
    // "Between",
    // "Outside",
  ]

  // Complete list of indicators
  const allIndicators = [
    "RSI",
    "Volume",
     "MACD",
    "Bollinger",
    "Price",
    "Stochastic",
     "ATR",
     "SuperTrend",   
    "GENERAL PA",
    "Gradient",
    // "EMA",
    // "SMA",
    // "WMA",
    // "VWMA",
    // "RSI_MA",
    // "Volume_MA",
    // "ADX",
    // "CCI",
    // "ROC",
    // "MFI",
    // "OBV",
    // "Ichimoku",
    // "Parabolic SAR",
    // "Pivot Points",
    // "Fibonacci",
    // "Keltner Channel",
    // "Momentum",
    // "Williams %R",
    // "Awesome Oscillator",
    // "TRIX",
    // "Chaikin Money Flow",
  ]

  // Complete list of behaviors
  const allBehaviors = [
    "Cross Above",
    "Cross Below",
    
    // "Inside Channel",
    "Increasing",
    "Decreasing",
    "Above",
    "Below",
    "At most above points",
    "At most below points",
    "Accumulate",
    "Then",
    // "Rising",
   
    // "Equal to",
    // "Not equal to",
    // "Increasing",
    // "Decreasing",
    // "Flat",
    // "Diverging",
    // "Converging",
    // "Breaking out",
    // "Pulling back",
    // "Consolidating",
    // "Trending",
    // "Reversing",
    // "Oscillating",
    // "Oversold",
    // "Overbought",
    // "Neutral",
  ]

  // Complete list of actions
  const allActions = [
    "Long",
    "Short",
    "Wait",
    "SL",
    "TP",
    "Partial TP",
    "Manage Exit",
    "Buy",
    "Sell",
    "Hold",
    "Exit",
    "Scale in",
    "Scale out",
    "Hedge",
    "Reverse position",
    "Partial close",
  ]

  // Complete list of trade management options
  const allTradeManagement = [
    "Manage",
    "Close",
    "Cancel",
    "No Trade",
    "Reverse",
    // "SL",
    // "TP",
    "Trailing stop",
    "Break even",
    "Move stop",
    "Adjust target",
    "Lock profit",
    "Add to position",
    "Reduce position",
    "Split position",
    "Merge positions",
  ]

  // Filter indicators based on search
  const filteredIndicators = allIndicators.filter((indicator) =>
    indicator.toLowerCase().includes(indicatorSearch.toLowerCase()),
  )

  // Filter behaviors based on search
  const filteredBehaviors = allBehaviors.filter((behavior) =>
    behavior.toLowerCase().includes(behaviorSearch.toLowerCase()),
  )

  return (
    <div className="w-[300px] min-w-[300px] bg-[#141721] border-l border-gray-800 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-semibold">Components</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Basic Components */}
        <div className="mb-6 bg-black p-4 rounded-lg">
          <h3 className="font-medium mb-3">Basic Components</h3>
          <div className="flex flex-wrap gap-2">
            {(showAllBasic ? allBasicComponents : allBasicComponents.slice(0, 7)).map((component) => (
              <Button
                key={component}
                variant="outline"
                size="sm"
                className="bg-[#2B2E38] border-0 hover:bg-gray-700"
                onClick={() => onComponentSelect(component)}
              >
                {component}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="bg-black text-gray-400 border-gray-700 hover:bg-gray-900 hover:text-white"
              onClick={() => setShowAllBasic(!showAllBasic)}
            >
              {showAllBasic ? "Show less" : "Show all"}
            </Button>
          </div>
        </div>

        {/* Indicators */}
        <div className="mb-6 bg-black p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Indicators</h3>
            <Button size="sm" variant="outline" className="h-8 px-3 bg-[#2B2E38] border-0 hover:bg-gray-700">
              Create
            </Button>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              className="pl-8 bg-[#2B2E38] border-0"
              placeholder="Search indicators"
              value={indicatorSearch}
              onChange={(e) => setIndicatorSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(indicatorSearch !== ""
              ? filteredIndicators
              : showAllIndicators
                ? allIndicators
                : allIndicators.slice(0, 6)
            ).map((indicator) => (
              <Button
                key={indicator}
                variant="outline"
                size="sm"
                className="bg-[#2B2E38] border-0 hover:bg-gray-700"
                onClick={() => onComponentSelect(indicator)}
              >
                {indicator}
              </Button>
            ))}
            {indicatorSearch === "" && (
              <Button
                variant="outline"
                size="sm"
                className="bg-black text-gray-400 border-gray-700 hover:bg-gray-900 hover:text-white"
                onClick={() => setShowAllIndicators(!showAllIndicators)}
              >
                {showAllIndicators ? "Show less" : "Show all"}
              </Button>
            )}
          </div>
        </div>

        {/* Behaviours */}
        <div className="mb-6 bg-black p-4 rounded-lg">
          <h3 className="font-medium mb-3">Behaviours</h3>
          <div className="relative mb-3">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              className="pl-8 bg-[#2B2E38] border-0"
              placeholder="Search behaviours"
              value={behaviorSearch}
              onChange={(e) => setBehaviorSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(behaviorSearch !== ""
              ? filteredBehaviors
              : showAllBehaviors
                ? allBehaviors
                : allBehaviors.slice(0, 6)
            ).map((behavior) => (
              <Button
                key={behavior}
                variant="outline"
                size="sm"
                className="bg-[#2B2E38] border-0 hover:bg-gray-700"
                onClick={() => onComponentSelect(behavior)}
              >
                {behavior}
              </Button>
            ))}
            {behaviorSearch === "" && (
              <Button
                variant="outline"
                size="sm"
                className="bg-black text-gray-400 border-gray-700 hover:bg-gray-900 hover:text-white"
                onClick={() => setShowAllBehaviors(!showAllBehaviors)}
              >
                {showAllBehaviors ? "Show less" : "Show all"}
              </Button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6 bg-black p-4 rounded-lg">
          <h3 className="font-medium mb-3">Actions</h3>
          <div className="flex flex-wrap gap-2">
            {(showAllActions ? allActions : allActions.slice(0, 5)).map((action) => (
              <Button
                key={action}
                variant="outline"
                size="sm"
                className="bg-[#2B2E38] border-0 hover:bg-gray-700"
                onClick={() => onComponentSelect(action)}
              >
                {action}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="bg-black text-gray-400 border-gray-700 hover:bg-gray-900 hover:text-white"
              onClick={() => setShowAllActions(!showAllActions)}
            >
              {showAllActions ? "Show less" : "Show all"}
            </Button>
          </div>
        </div>

        {/* Trade Management */}
        <div className="mb-6 bg-black p-4 rounded-lg">
          <h3 className="font-medium mb-3">Trade Management</h3>
          <div className="flex flex-wrap gap-2">
            {(showAllTradeManagement ? allTradeManagement : allTradeManagement.slice(0, 5)).map((option) => (
              <Button
                key={option}
                variant="outline"
                size="sm"
                className="bg-[#2B2E38] border-0 hover:bg-gray-700"
                onClick={() => onComponentSelect(option)}
              >
                {option}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="bg-black text-gray-400 border-gray-700 hover:bg-gray-900 hover:text-white"
              onClick={() => setShowAllTradeManagement(!showAllTradeManagement)}
            >
              {showAllTradeManagement ? "Show less" : "Show all"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
