"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface CustomTimeframeModalProps {
  onClose: () => void
  onSave: (timeframe: string) => void
  setSelectedTimeframe?: (timeframe: string) => void 
  selectedTimeframe?: string
  handleTimeframeSelect?: (timeframe: string) => void
}

export function CustomTimeframeModal({
  onClose,
  onSave,
  handleTimeframeSelect
}: CustomTimeframeModalProps) {
  const [timeframeType, setTimeframeType] = useState("Minutes")
  const [timeframeValue, setTimeframeValue] = useState("")
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)

  const handleSave = () => {
    if (!timeframeValue || parseInt(timeframeValue) <= 0) return

    const formatted =
      timeframeType === "Minutes"
        ? `${timeframeValue}min`
        : timeframeType === "Seconds"
        ? `${timeframeValue}s`
        : timeframeType === "Hours"
        ? `${timeframeValue}h`
        : `${timeframeValue}d`

    onSave(formatted) // ✅ will trigger selection in parent
    handleTimeframeSelect?.(formatted) // ✅ will trigger selection in parent
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[400px] p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-black">Custom Timeframe</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-sm mb-1 text-black">Type</label>
            <div className="relative">
              <button
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-left flex justify-between items-center text-black"
              >
                <span>{timeframeType}</span>
                <span>▼</span>
              </button>
              {showTypeDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                  {["Seconds", "Minutes", "Hours", "Day"].map((type) => (
                    <button
                      key={type}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-black"
                      onClick={() => {
                        setTimeframeType(type)
                        setShowTypeDropdown(false)
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
            <label className="block text-sm mb-1 text-black">Value</label>
            <input
              type="number"
              value={timeframeValue}
              onChange={(e) => setTimeframeValue(e.target.value)}
              placeholder="Set Value"
              className="w-full text-black bg-white border border-gray-300 rounded px-3 py-2"
              min="1"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#85e1fe] rounded-full text-black hover:bg-[#5AB9D1]"
            disabled={!timeframeValue || parseInt(timeframeValue) <= 0}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
