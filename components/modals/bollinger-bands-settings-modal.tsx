"use client"

import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"

interface BollingerBandsSettingsModalProps {
  onClose: () => void
  onSave: (settings: any) => void
}

export function BollingerBandsSettingsModal({ onClose, onSave }: BollingerBandsSettingsModalProps) {
  const [level, setLevel] = useState("lower")
  const [length, setLength] = useState("17")
  // const [maType, setMaType] = useState("SMA")
  // const [source, setSource] = useState("close")
  // const [stdDev, setStdDev] = useState("2")
  // const [offset, setOffset] = useState("2")
  const [showMaTypeDropdown, setShowMaTypeDropdown] = useState(false)
  const [showSourceDropdown, setShowSourceDropdown] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)
  const maTypeDropdownRef = useRef<HTMLDivElement>(null)
  const sourceDropdownRef = useRef<HTMLDivElement>(null)

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
    onSave({
      timeperiod: Number.parseInt(length, 10) || 17,
    })
  }

  const maTypes = ["SMA", "EMA", "WMA", "VWMA", "TEMA", "DEMA"]
  const sources = ["close", "open", "high", "low", "hl2", "hlc3", "ohlc4"]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-[#f1f1f1] rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-6">
          <h2 className="text-2xl font-bold text-black">Bollinger Bands Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-800 mb-2">Bollinger Bands level</label>
            <div className="grid grid-cols-3 gap-0 border border-gray-300 rounded-md overflow-hidden">
              <button
                className={`py-3 px-4 text-center ${
                  level === "lower" ? "bg-gray-400 text-white" : "bg-white text-gray-700"
                }`}
                onClick={() => setLevel("lower")}
              >
                Lower
              </button>
              <button
                className={`py-3 px-4 text-center ${
                  level === "basis" ? "bg-gray-400 text-white" : "bg-white text-gray-700"
                }`}
                onClick={() => setLevel("basis")}
              >
                Basis
              </button>
              <button
                className={`py-3 px-4 text-center ${
                  level === "upper" ? "bg-gray-400 text-white" : "bg-white text-gray-700"
                }`}
                onClick={() => setLevel("upper")}
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
                <label className="block text-base font-medium text-gray-700 mb-2">Time Period</label>
                <input
                  type="text"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded text-gray-700"
                />
              </div>

              {/* <div>
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
              </div> */}

              {/* <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Source</label>
                <div className="relative" ref={sourceDropdownRef}>
                  <button
                    className="w-full p-3 border border-gray-300 rounded text-gray-700 bg-white flex justify-between items-center"
                    onClick={()={() => setShowSourceDropdown(!showSourceDropdown)}
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
              </div> */}

              {/* <div>
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
              </div> */}
            </div>
          </div>

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
