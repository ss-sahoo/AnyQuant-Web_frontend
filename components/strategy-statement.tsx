"use client"

import { useState } from "react"
import { ChevronDown, MoreVertical } from "lucide-react"

export function StrategyStatement() {
  const [timeframe, setTimeframe] = useState("45 minute")
  const [timeframeDropdown, setTimeframeDropdown] = useState(false)
  const [candle, setCandle] = useState("Candle 1")
  const [candleDropdown, setCandleDropdown] = useState(false)
  const [indicator, setIndicator] = useState("Price / Close")
  const [behavior, setBehavior] = useState("Crossing Up")
  const [compareWith, setCompareWith] = useState("Bands / Basis")
  const [compareWithDropdown, setCompareWithDropdown] = useState(false)
  const [timeframe2, setTimeframe2] = useState("3 Hourly")
  const [timeframe2Dropdown, setTimeframe2Dropdown] = useState(false)

  const timeframeOptions = ["1 minute", "5 minute", "15 minute", "30 minute", "45 minute", "1 hour", "4 hour", "1 day"]
  const candleOptions = ["Candle 1", "Candle 2", "Candle 3", "Previous Candle"]
  const compareWithOptions = ["Bands / Basis", "Bands / Upper", "Bands / Lower", "MA / 20", "MA / 50", "MA / 200"]
  const timeframe2Options = ["1 minute", "5 minute", "15 minute", "30 minute", "1 hour", "3 Hourly", "4 hour", "1 day"]

  return (
    <div className="bg-[#1A1D2D] p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Statement 1</h3>
        <button className="p-1 hover:bg-gray-700 rounded-full">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Timeframe dropdown */}
        <div className="relative">
          <div className="text-xs text-gray-400 mb-1">Timeframe</div>
          <button
            onClick={() => setTimeframeDropdown(!timeframeDropdown)}
            className="w-full flex justify-between items-center bg-[#2B2E38] p-2 rounded-md"
          >
            <span>{timeframe}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {timeframeDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-[#2B2E38] rounded-md shadow-lg max-h-60 overflow-auto">
              {timeframeOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setTimeframe(option)
                    setTimeframeDropdown(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#3A3D47]"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* At Candle dropdown */}
        <div className="relative">
          <div className="text-xs text-gray-400 mb-1">At Candle</div>
          <button
            onClick={() => setCandleDropdown(!candleDropdown)}
            className="w-full flex justify-between items-center bg-[#2B2E38] p-2 rounded-md"
          >
            <span>{candle}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {candleDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-[#2B2E38] rounded-md shadow-lg max-h-60 overflow-auto">
              {candleOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setCandle(option)
                    setCandleDropdown(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#3A3D47]"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Indicator button */}
        <button className="bg-[#2B2E38] p-2 rounded-md">{indicator}</button>

        {/* Behavior button */}
        <button className="bg-[#2B2E38] p-2 rounded-md">{behavior}</button>

        {/* Compare with dropdown */}
        <div className="relative">
          <button
            onClick={() => setCompareWithDropdown(!compareWithDropdown)}
            className="w-full flex justify-between items-center bg-[#2B2E38] p-2 rounded-md"
          >
            <span>{compareWith}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {compareWithDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-[#2B2E38] rounded-md shadow-lg max-h-60 overflow-auto">
              {compareWithOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setCompareWith(option)
                    setCompareWithDropdown(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#3A3D47]"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Timeframe 2 dropdown */}
        <div className="relative md:col-start-4">
          <div className="text-xs text-gray-400 mb-1">Timeframe</div>
          <button
            onClick={() => setTimeframe2Dropdown(!timeframe2Dropdown)}
            className="w-full flex justify-between items-center bg-[#2B2E38] p-2 rounded-md"
          >
            <span>{timeframe2}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {timeframe2Dropdown && (
            <div className="absolute z-10 mt-1 w-full bg-[#2B2E38] rounded-md shadow-lg max-h-60 overflow-auto">
              {timeframe2Options.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setTimeframe2(option)
                    setTimeframe2Dropdown(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#3A3D47]"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input field */}
        <div className="md:col-start-5">
          <input
            type="text"
            placeholder="Start typing ..."
            className="w-full bg-[#2B2E38] p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6BCAE2]"
          />
        </div>
      </div>
    </div>
  )
}
