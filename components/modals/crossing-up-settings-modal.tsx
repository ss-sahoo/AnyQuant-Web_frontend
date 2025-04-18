"use client"

import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"

interface CrossingUpSettingsModalProps {
  onClose: () => void
  onSave: (settings: any) => void
}

export function CrossingUpSettingsModal({ onClose, onSave }: CrossingUpSettingsModalProps) {
  const [valueType, setValueType] = useState("value")
  const [customValue, setCustomValue] = useState("60")
  const [indicatorType, setIndicatorType] = useState("")
  const [timeframe, setTimeframe] = useState("")
  const [showIndicatorDropdown, setShowIndicatorDropdown] = useState(false)
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false)
  const [upperBound, setUpperBound] = useState("")
  const [lowerBound, setLowerBound] = useState("")
  const [periods, setPeriods] = useState("")

  const modalRef = useRef<HTMLDivElement>(null)
  const indicatorDropdownRef = useRef<HTMLDivElement>(null)
  const timeframeDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    function handleEscKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscKey)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscKey)
    }
  }, [onClose])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (indicatorDropdownRef.current && !indicatorDropdownRef.current.contains(event.target as Node)) {
        setShowIndicatorDropdown(false)
      }

      if (timeframeDropdownRef.current && !timeframeDropdownRef.current.contains(event.target as Node)) {
        setShowTimeframeDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSave = () => {
    onSave({
      valueType,
      customValue: Number.parseInt(customValue),
      indicatorType,
      timeframe,
      upperBound,
      lowerBound,
      periods,
    })
  }

  const indicators = ["RSI", "RSI MA", "MACD", "Bollinger Bands", "Stochastic", "Price", "Volume", "ATR"]
  const timeframes = [
    "1 minute",
    "5 minute",
    "15 minute",
    "20min",
    "30 minute",
    "45 minute",
    "1 hour",
    "3 Hourly",
    "4 hour",
    "1 day",
  ]

  const renderContent = () => {
    if (valueType === "value") {
      return (
        <div className="mb-6">
          <label className="block text-lg font-medium text-gray-800 mb-2">Custom Value</label>
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="Custom Value"
            className="w-full p-3 border border-gray-300 rounded text-gray-700"
          />
        </div>
      )
    } else if (valueType === "existing") {
      return (
        <>
          <div className="mb-4">
            <label className="block text-lg font-medium text-gray-800 mb-2">Indicator Type</label>
            <div className="relative" ref={indicatorDropdownRef}>
              <button
                className="w-full p-3 border border-gray-300 rounded text-gray-700 bg-white flex justify-between items-center"
                onClick={() => setShowIndicatorDropdown(!showIndicatorDropdown)}
              >
                {indicatorType || "Select indicator"}
                <span className="ml-2">▼</span>
              </button>

              {showIndicatorDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
                  {indicators.map((indicator) => (
                    <button
                      key={indicator}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        setIndicatorType(indicator)
                        setShowIndicatorDropdown(false)
                      }}
                    >
                      {indicator}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )
    } else if (valueType === "other") {
      return (
        <>
          <div className="mb-4">
            <label className="block text-lg font-medium text-gray-800 mb-2">Indicator Type</label>
            <div className="relative" ref={indicatorDropdownRef}>
              <button
                className="w-full p-3 border border-gray-300 rounded text-gray-700 bg-white flex justify-between items-center"
                onClick={() => setShowIndicatorDropdown(!showIndicatorDropdown)}
              >
                {indicatorType || "Select indicator"}
                <span className="ml-2">▼</span>
              </button>

              {showIndicatorDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
                  {indicators.map((indicator) => (
                    <button
                      key={indicator}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        setIndicatorType(indicator)
                        setShowIndicatorDropdown(false)
                      }}
                    >
                      {indicator}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-800 mb-2">Timeframe</label>
            <div className="relative" ref={timeframeDropdownRef}>
              <button
                className="w-full p-3 border border-gray-300 rounded text-gray-700 bg-white flex justify-between items-center"
                onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
              >
                {timeframe || "Select timeframe"}
                <span className="ml-2">▼</span>
              </button>

              {showTimeframeDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
                  {timeframes.map((tf) => (
                    <button
                      key={tf}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        setTimeframe(tf)
                        setShowTimeframeDropdown(false)
                      }}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )
    }
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-[#f1f1f1] rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-6">
          <h2 className="text-2xl font-bold text-black">Cross Above/Below Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-800 mb-2">Value type</label>
            <div className="grid grid-cols-3 gap-0 border border-gray-300 rounded-md overflow-hidden">
              <button
                className={`py-3 px-4 text-center ${
                  valueType === "value" ? "bg-gray-400 text-white" : "bg-white text-gray-700"
                }`}
                onClick={() => setValueType("value")}
              >
                Value
              </button>
              <button
                className={`py-3 px-4 text-center ${
                  valueType === "existing" ? "bg-gray-400 text-white" : "bg-white text-gray-700"
                }`}
                onClick={() => setValueType("existing")}
              >
                Existing Indicator
              </button>
              <button
                className={`py-3 px-4 text-center ${
                  valueType === "other" ? "bg-gray-400 text-white" : "bg-white text-gray-700"
                }`}
                onClick={() => setValueType("other")}
              >
                Other Indicator
              </button>
            </div>
          </div>

          <div className="border-t border-gray-300 my-6"></div>

          {renderContent()}

          <div className="flex justify-end space-x-3 mt-8">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button onClick={handleSave} className="px-6 py-3 bg-[#85e1fe] rounded-full text-black hover:bg-[#6bcae2]">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
