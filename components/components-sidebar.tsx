"use client"

import { useState } from "react"
import { Search } from "lucide-react"

interface ComponentsSidebarProps {
  onComponentSelect: (component: string) => void
}

export function ComponentsSidebar({ onComponentSelect }: ComponentsSidebarProps) {
  const [activeSearch, setActiveSearch] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: false,
    indicators: false,
    behaviours: false,
    actions: false,
    trade: false,
  })

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
  ]

  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    })
  }

  return (
    <div className="w-80 bg-[#141721] border-l border-gray-800 p-4 overflow-y-auto">
      <h2 className="text-2xl font-medium mb-6">Components</h2>

      {/* Basic Components */}
      <div className="mb-6 bg-[#1A1D2D] rounded-lg p-4">
        <h3 className="text-xl font-medium mb-4">Basic Components</h3>
        <div className="flex flex-wrap gap-2">
          {basicComponents.map((component) => (
            <button
              key={component.id}
              className="bg-[#2B2E38] hover:bg-[#3A3D47] px-4 py-2 rounded-md"
              onClick={() => onComponentSelect(component.label)}
            >
              {component.label}
            </button>
          ))}
          {expandedSections.basic &&
            extraBasicComponents.map((component) => (
              <button
                key={component.id}
                className="bg-[#2B2E38] hover:bg-[#3A3D47] px-4 py-2 rounded-md"
                onClick={() => onComponentSelect(component.label)}
              >
                {component.label}
              </button>
            ))}
          <button
            className="bg-black hover:bg-gray-900 px-4 py-2 rounded-full border border-gray-700"
            onClick={() => toggleSection("basic")}
          >
            {expandedSections.basic ? "Show less" : "Show all"}
          </button>
        </div>
      </div>

      {/* Indicators */}
      <div className="mb-6 bg-[#1A1D2D] rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-medium">Indicators</h3>
          <button className="bg-black hover:bg-gray-900 px-4 py-1 rounded-full border border-gray-700 text-sm">
            Create
          </button>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search indicators"
            className="w-full bg-[#2B2E38] pl-10 pr-3 py-2 rounded-md focus:outline-none"
            onFocus={() => setActiveSearch("indicators")}
            onBlur={() => setActiveSearch(null)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {indicators.map((indicator) => (
            <button
              key={indicator.id}
              className="bg-[#2B2E38] hover:bg-[#3A3D47] px-4 py-2 rounded-md"
              onClick={() => onComponentSelect(indicator.label)}
            >
              {indicator.label}
            </button>
          ))}
          {expandedSections.indicators &&
            extraIndicators.map((indicator) => (
              <button
                key={indicator.id}
                className="bg-[#2B2E38] hover:bg-[#3A3D47] px-4 py-2 rounded-md"
                onClick={() => onComponentSelect(indicator.label)}
              >
                {indicator.label}
              </button>
            ))}
          <button
            className="bg-black hover:bg-gray-900 px-4 py-2 rounded-full border border-gray-700"
            onClick={() => toggleSection("indicators")}
          >
            {expandedSections.indicators ? "Show less" : "Show all"}
          </button>
        </div>
      </div>

      {/* Behaviours */}
      <div className="mb-6 bg-[#1A1D2D] rounded-lg p-4">
        <h3 className="text-xl font-medium mb-4">Behaviours</h3>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search behaviours"
            className="w-full bg-[#2B2E38] pl-10 pr-3 py-2 rounded-md focus:outline-none"
            onFocus={() => setActiveSearch("behaviours")}
            onBlur={() => setActiveSearch(null)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {behaviours.map((behaviour) => (
            <button
              key={behaviour.id}
              className="bg-[#2B2E38] hover:bg-[#3A3D47] px-4 py-2 rounded-md"
              onClick={() => onComponentSelect(behaviour.label)}
            >
              {behaviour.label}
            </button>
          ))}
          <button
            className="bg-black hover:bg-gray-900 px-4 py-2 rounded-full border border-gray-700"
            onClick={() => toggleSection("behaviours")}
          >
            {expandedSections.behaviours ? "Show less" : "Show all"}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6 bg-[#1A1D2D] rounded-lg p-4">
        <h3 className="text-xl font-medium mb-4">Actions</h3>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.id}
              className="bg-[#2B2E38] hover:bg-[#3A3D47] px-4 py-2 rounded-md"
              onClick={() => onComponentSelect(action.label)}
            >
              {action.label}
            </button>
          ))}
          <button
            className="bg-black hover:bg-gray-900 px-4 py-2 rounded-full border border-gray-700"
            onClick={() => toggleSection("actions")}
          >
            {expandedSections.actions ? "Show less" : "Show all"}
          </button>
        </div>
      </div>

      {/* Trade Management */}
      <div className="mb-6 bg-[#1A1D2D] rounded-lg p-4">
        <h3 className="text-xl font-medium mb-4">Trade Management</h3>
        <div className="flex flex-wrap gap-2">
          {tradeManagement.map((item) => (
            <button
              key={item.id}
              className="bg-[#2B2E38] hover:bg-[#3A3D47] px-4 py-2 rounded-md"
              onClick={() => onComponentSelect(item.label)}
            >
              {item.label}
            </button>
          ))}
          <button
            className="bg-black hover:bg-gray-900 px-4 py-2 rounded-full border border-gray-700"
            onClick={() => toggleSection("trade")}
          >
            {expandedSections.trade ? "Show less" : "Show all"}
          </button>
        </div>
      </div>
    </div>
  )
}
