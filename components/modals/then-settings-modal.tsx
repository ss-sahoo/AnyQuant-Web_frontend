"use client"

import { useState } from "react"
import { X, ChevronDown } from "lucide-react"
import { CustomTimeframeModal } from "./custom-timeframe-modal"

interface ThenSettingsModalProps {
  onClose: () => void
  onSave: (settings: {
    wait: "Yes" | "No"
    count: string
    candle: string
  }) => void
  customTimeframes?: string[]
  onSaveCustomTimeframe?: (timeframe: string) => void
}

export function ThenSettingsModal({
  onClose,
  onSave,
  customTimeframes = [],
  onSaveCustomTimeframe,
}: ThenSettingsModalProps) {
  const [wait, setWait] = useState<"Yes" | "No">("Yes")
  const [countType, setCountType] = useState("at least")
  const [countValue, setCountValue] = useState("4")
  const [candle, setCandle] = useState("6min")
  const [showWaitDropdown, setShowWaitDropdown] = useState(false)
  const [showCountTypeDropdown, setShowCountTypeDropdown] = useState(false)
  const [showCandleDropdown, setShowCandleDropdown] = useState(false)
  const [showCustomTimeframeModal, setShowCustomTimeframeModal] = useState(false)

  const waitOptions = ["Yes", "No"]
  const countTypeOptions = ["at least", "at most", "exactly"]
  const defaultCandleOptions = ["1min", "5min", "6min", "15min", "30min", "1h", "4h", "1d"]

  const handleSave = () => {
    onSave({
      wait,
      count: `${countType} ${countValue}`,
      candle,
    })
    onClose()
  }

  const handleCandleSelect = (selectedCandle: string) => {
    if (selectedCandle === "add-custom") {
      setShowCustomTimeframeModal(true)
    } else {
      setCandle(selectedCandle)
      setShowCandleDropdown(false)
    }
  }

  const handleCustomTimeframeSave = (timeframe: string) => {
    setCandle(timeframe)
    if (onSaveCustomTimeframe) {
      onSaveCustomTimeframe(timeframe)
    }
    setShowCustomTimeframeModal(false)
    setShowCandleDropdown(false)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-[500px] p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium text-black">Then Settings</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Wait Parameter */}
            <div>
              <label className="block text-sm font-medium mb-2 text-black">Wait</label>
              <div className="relative">
                <button
                  onClick={() => setShowWaitDropdown(!showWaitDropdown)}
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-left flex justify-between items-center text-black hover:border-gray-400"
                >
                  <span>{wait}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showWaitDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                    {waitOptions.map((option) => (
                      <button
                        key={option}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-black"
                        onClick={() => {
                          setWait(option as "Yes" | "No")
                          setShowWaitDropdown(false)
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Count Parameter */}
            <div>
              <label className="block text-sm font-medium mb-2 text-black">Count</label>
              <div className="grid grid-cols-2 gap-3">
                {/* Count Type Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowCountTypeDropdown(!showCountTypeDropdown)}
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-left flex justify-between items-center text-black hover:border-gray-400"
                  >
                    <span>{countType}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showCountTypeDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                      {countTypeOptions.map((option) => (
                        <button
                          key={option}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-black"
                          onClick={() => {
                            setCountType(option)
                            setShowCountTypeDropdown(false)
                          }}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Count Value Input */}
                <div>
                  <input
                    type="number"
                    value={countValue}
                    onChange={(e) => setCountValue(e.target.value)}
                    placeholder="Enter number"
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-black hover:border-gray-400"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Candle Parameter */}
            <div>
              <label className="block text-sm font-medium mb-2 text-black">Candle</label>
              <div className="relative">
                <button
                  onClick={() => setShowCandleDropdown(!showCandleDropdown)}
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-left flex justify-between items-center text-black hover:border-gray-400"
                >
                  <span>{candle}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showCandleDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {/* Default options */}
                    {defaultCandleOptions.map((option) => (
                      <button
                        key={option}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-black ${
                          candle === option ? "bg-gray-200 font-semibold" : ""
                        }`}
                        onClick={() => handleCandleSelect(option)}
                      >
                        {option}
                      </button>
                    ))}

                    {/* Custom timeframes */}
                    {customTimeframes.map((timeframe) => (
                      <button
                        key={timeframe}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-black ${
                          candle === timeframe ? "bg-gray-200 font-semibold" : ""
                        }`}
                        onClick={() => handleCandleSelect(timeframe)}
                      >
                        {timeframe}
                      </button>
                    ))}

                    {/* Add Custom option */}
                    <div className="border-t border-gray-200" />
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-black font-medium"
                      onClick={() => handleCandleSelect("add-custom")}
                    >
                      Add Custom
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-[#85e1fe] rounded-full text-black hover:bg-[#5AB9D1]">
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Custom Timeframe Modal */}
      {showCustomTimeframeModal && (
        <CustomTimeframeModal
          onClose={() => setShowCustomTimeframeModal(false)}
          onSave={handleCustomTimeframeSave}
          handleTimeframeSelect={handleCandleSelect}
        />
      )}
    </>
  )
}
