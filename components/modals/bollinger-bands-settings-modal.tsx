"use client"

import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"
import { DraggableModal } from "./draggable-modal"

interface BollingerBandsSettingsModalProps {
  onClose: () => void
  onSave: (settings: any) => void
  initialSettings?: {
    timeperiod?: number
    input?: string
    nbdevup?: number
    nbdevdn?: number
    source?: string
    ma_type?: string
    offset?: number
  }
}

export function BollingerBandsSettingsModal({ onClose, onSave, initialSettings }: BollingerBandsSettingsModalProps) {
  const [level, setLevel] = useState(
    initialSettings?.input === "upperband" ? "upper" : initialSettings?.input === "middleband" ? "basis" : "lower",
  )
  const [length, setLength] = useState(String(initialSettings?.timeperiod ?? 20))
  const [maType, setMaType] = useState(initialSettings?.ma_type ?? "SMA")
  const [source, setSource] = useState(initialSettings?.source ?? "close")
  const [stdDev, setStdDev] = useState(String(initialSettings?.nbdevup ?? initialSettings?.nbdevdn ?? 2))
  const [offset, setOffset] = useState(String(initialSettings?.offset ?? 0))
  const [showMaTypeDropdown, setShowMaTypeDropdown] = useState(false)
  const [showSourceDropdown, setShowSourceDropdown] = useState(false)

  const maTypeDropdownRef = useRef<HTMLDivElement>(null)
  const sourceDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (maTypeDropdownRef.current && !maTypeDropdownRef.current.contains(event.target as Node)) {
        setShowMaTypeDropdown(false)
      }

      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(event.target as Node)) {
        setShowSourceDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSave = () => {
    const timeperiod = Number.parseInt(length, 10) || 20
    const stdDevValue = Number.parseFloat(stdDev) || 2.0
    const offsetValue = Number.parseInt(offset, 10) || 0

    // Determine input based on level
    let input = "lowerband"
    if (level === "upper") {
      input = "upperband"
    } else if (level === "basis") {
      input = "middleband"
    }

    // Build input_params based on band selection. ma_type and offset are
    // persisted here so they round-trip through the strategy JSON.
    const inputParams: any = {
      timeperiod: timeperiod,
      source: source,
      ma_type: maType,
      offset: offsetValue,
    }

    // Add deviation parameters based on band selection
    if (level === "upper") {
      inputParams.nbdevup = stdDevValue
    } else if (level === "lower") {
      inputParams.nbdevdn = stdDevValue
    } else if (level === "basis") {
      // For basis, send both with default values
      inputParams.nbdevup = 2.0
      inputParams.nbdevdn = 2.0
    }

    onSave({
      timeperiod: timeperiod,
      input: input,
      input_params: inputParams,
      level: level,
      maType: maType,
      source: source,
      stdDev: stdDevValue,
      offset: offsetValue,
    })
  }

  const maTypes = ["SMA", "EMA", "WMA", "VWMA", "TEMA", "DEMA"]
  const sources = ["close", "open", "high", "low", "hl2", "hlc3", "ohlc4"]

  return (
    <DraggableModal onClose={onClose} className="bg-[#f1f1f1] rounded-lg shadow-lg w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
      {/* min-h-0 lets this flex item shrink below its content height so the
          body scrolls and the footer stays inside the max-h-[90vh] box */}
      <div className="flex flex-col min-h-0">
        {/* Fixed Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-black">Bollinger Bands Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-800 mb-2">Bollinger Bands level</label>
            <div className="grid grid-cols-3 gap-0 border border-gray-300 rounded-md overflow-hidden">
              <button
                className={`py-3 px-4 text-center ${
                  level === "lower" ? "bg-gray-400 text-white" : "bg-white text-gray-700"
                }`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setLevel("lower")
                }}
              >
                Lower
              </button>
              <button
                className={`py-3 px-4 text-center ${
                  level === "basis" ? "bg-gray-400 text-white" : "bg-white text-gray-700"
                }`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setLevel("basis")
                }}
              >
                Basis
              </button>
              <button
                className={`py-3 px-4 text-center ${
                  level === "upper" ? "bg-gray-400 text-white" : "bg-white text-gray-700"
                }`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setLevel("upper")
                }}
              >
                Upper
              </button>
            </div>
          </div>

          <div className="border-t border-gray-300 my-6"></div>

          <div>
            <h3 className="text-xl font-medium text-gray-800 mb-4">Define Settings</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Length</label>
                <input
                  type="text"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded text-gray-700"
                />
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Basis MA Type</label>
                <div className="relative" ref={maTypeDropdownRef}>
                  <button
                    className="w-full p-3 border border-gray-300 rounded text-gray-700 bg-white flex justify-between items-center"
                    onClick={() => setShowMaTypeDropdown(!showMaTypeDropdown)}
                  >
                    {maType}
                    <span className="ml-2">▼</span>
                  </button>

                  {showMaTypeDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
                      {maTypes.map((type) => (
                        <button
                          key={type}
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            setMaType(type)
                            setShowMaTypeDropdown(false)
                          }}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Source</label>
                <div className="relative" ref={sourceDropdownRef}>
                  <button
                    className="w-full p-3 border border-gray-300 rounded text-gray-700 bg-white flex justify-between items-center"
                    onClick={() => setShowSourceDropdown(!showSourceDropdown)}
                  >
                    {source}
                    <span className="ml-2">▼</span>
                  </button>

                  {showSourceDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
                      {sources.map((src) => (
                        <button
                          key={src}
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            setSource(src)
                            setShowSourceDropdown(false)
                          }}
                        >
                          {src}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Std Dev</label>
                <input
                  type="text"
                  value={stdDev}
                  onChange={(e) => setStdDev(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded text-gray-700"
                />
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Offset</label>
                <input
                  type="text"
                  value={offset}
                  onChange={(e) => setOffset(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded text-gray-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
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
    </DraggableModal>
  )
}
