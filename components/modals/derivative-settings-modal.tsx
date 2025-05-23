"use client"

import { useState, useRef, useEffect } from "react"
import { X, ChevronDown } from "lucide-react"

interface DerivativeSettingsModalProps {
  onClose: () => void
  onSave: (settings: any) => void
}

export function DerivativeSettingsModal({ onClose, onSave }: DerivativeSettingsModalProps) {
  const [selectedIndicator, setSelectedIndicator] = useState("RSI_MA")
  const [order, setOrder] = useState("1")
  const [showIndicatorDropdown, setShowIndicatorDropdown] = useState(false)

  // RSI_MA params
  const [rsiLength, setRsiLength] = useState("14")
  const [rsiSource, setRsiSource] = useState("Close")
  const [maType, setMaType] = useState("SMA")
  const [maLength, setMaLength] = useState("14")
  const [bbStdDev, setBbStdDev] = useState("2.0")

  const modalRef = useRef<HTMLDivElement>(null)
  const indicatorDropdownRef = useRef<HTMLDivElement>(null)

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
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSave = () => {
    const settings: any = {
      selectedIndicator,
      order: Number.parseInt(order),
    }

    // Add indicator-specific parameters
    if (selectedIndicator === "RSI_MA") {
      settings.input_params = {
        rsi_length: Number.parseInt(rsiLength),
        rsi_source: rsiSource,
        ma_type: maType,
        ma_length: Number.parseInt(maLength),
        bb_stddev: Number.parseFloat(bbStdDev),
      }
    }
    // Add other indicator parameters as needed

    onSave(settings)
  }

  const indicators = ["RSI", "RSI_MA", "MACD", "BBANDS", "ATR", "Volume_MA", "GENERAL_PA"]

  const sources = ["Close", "Open", "High", "Low", "HL2", "HLC3", "OHLC4"]
  const maTypes = ["SMA", "EMA", "WMA", "VWMA", "TEMA", "DEMA"]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-[#f1f1f1] rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-6">
          <h2 className="text-2xl font-bold text-black">Derivative Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-800 mb-2">Select Indicator</label>
            <div className="relative" ref={indicatorDropdownRef}>
              <button
                className="w-full p-3 border border-gray-300 rounded text-gray-700 bg-white flex justify-between items-center"
                onClick={() => setShowIndicatorDropdown(!showIndicatorDropdown)}
              >
                {selectedIndicator}
                <ChevronDown className="ml-2 w-4 h-4" />
              </button>

              {showIndicatorDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
                  {indicators.map((indicator) => (
                    <button
                      key={indicator}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        setSelectedIndicator(indicator)
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
            <label className="block text-lg font-medium text-gray-800 mb-2">Derivative Order</label>
            <input
              type="text"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded text-gray-700"
            />
          </div>

          <div className="border-t border-gray-300 my-6"></div>

          {/* Indicator-specific settings */}
          {selectedIndicator === "RSI_MA" && (
            <div>
              <h3 className="text-xl font-medium text-gray-800 mb-4">RSI_MA Settings</h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">RSI Length</label>
                  <input
                    type="text"
                    value={rsiLength}
                    onChange={(e) => setRsiLength(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">RSI Source</label>
                  <select
                    value={rsiSource}
                    onChange={(e) => setRsiSource(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded text-gray-700"
                  >
                    {sources.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">MA Length</label>
                  <input
                    type="text"
                    value={maLength}
                    onChange={(e) => setMaLength(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">MA Type</label>
                  <select
                    value={maType}
                    onChange={(e) => setMaType(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded text-gray-700"
                  >
                    {maTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">BB Std Dev</label>
                <input
                  type="text"
                  value={bbStdDev}
                  onChange={(e) => setBbStdDev(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded text-gray-700"
                />
              </div>
            </div>
          )}

          {/* Add other indicator settings here */}

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
