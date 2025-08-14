"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

interface AccumulatorSettings {
  type: "exactly" | "at least" | "up to"
  value: number
}

interface AccumulatorSettingsModalProps {
  onClose: () => void
  onSave: (settings: AccumulatorSettings) => void
  initialSettings?: AccumulatorSettings
}

export function AccumulatorSettingsModal({ onClose, onSave, initialSettings }: AccumulatorSettingsModalProps) {
  const [type, setType] = useState<"exactly" | "at least" | "up to">("at least")
  const [value, setValue] = useState(6)

  useEffect(() => {
    if (initialSettings) {
      setType(initialSettings.type)
      setValue(initialSettings.value)
    }
  }, [initialSettings])

  const handleSave = () => {
    onSave({ type, value })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-black">Accumulator Settings</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-black transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">Condition Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "exactly" | "at least" | "up to")}
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="exactly">Exactly</option>
              <option value="at least">At least</option>
              <option value="up to">Up to</option>
            </select>
          </div>

          {/* Value Input */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">Number of Candles</label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              min="1"
              max="100"
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter number of candles"
            />
          </div>

         
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-black transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#85e1fe] text-black rounded-md hover:bg-[#5AB9D1] transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
