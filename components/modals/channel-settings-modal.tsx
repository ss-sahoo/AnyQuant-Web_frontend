"use client"

import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"

interface ChannelSettingsModalProps {
  onClose: () => void
  onSave: (settings: any) => void
}

export function ChannelSettingsModal({ onClose, onSave }: ChannelSettingsModalProps) {
  const [upperBound, setUpperBound] = useState("")
  const [lowerBound, setLowerBound] = useState("")
  const [timeframe, setTimeframe] = useState("")
  const [periods, setPeriods] = useState("")
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)
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
      upperBound,
      lowerBound,
      timeframe,
      periods,
    })
  }

  const timeframes = [
    "1 minute",
    "5 minute",
    "15 minute",
    "30 minute",
    "45 minute",
    "1 hour",
    "3 Hourly",
    "4 hour",
    "1 day",
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-[#f1f1f1] rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-6">
          <h2 className="text-2xl font-bold text-black">Channel Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-lg font-medium text-gray-800 mb-2">Upper Bound</label>
              <input
                type="text"
                value={upperBound}
                onChange={(e) => setUpperBound(e.target.value)}
                placeholder="Set Value"
                className="w-full p-3 border border-gray-300 rounded text-gray-700"
              />
            </div>
            <div>
              <label className="block text-lg font-medium text-gray-800 mb-2">Lower Bound</label>
              <input
                type="text"
                value={lowerBound}
                onChange={(e) => setLowerBound(e.target.value)}
                placeholder="Set Value"
                className="w-full p-3 border border-gray-300 rounded text-gray-700"
              />
            </div>
          </div>

          <div className="border-t border-gray-300 my-6"></div>

          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-800 mb-2">Timeframe</label>
            <div className="relative" ref={timeframeDropdownRef}>
              <button
                className="w-full p-3 border border-gray-300 rounded text-gray-700 bg-white flex justify-between items-center"
                onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
              >
                {timeframe || "Select Timeframe"}
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

          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-800 mb-2">No. of Periods</label>
            <input
              type="text"
              value={periods}
              onChange={(e) => setPeriods(e.target.value)}
              placeholder="No. of periods"
              className="w-full p-3 border border-gray-300 rounded text-gray-700"
            />
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
