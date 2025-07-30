"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface AtCandleModalProps {
  onClose: () => void
  onSave: (candleNumber: number) => void
  initialValue?: number
}

export function AtCandleModal({ onClose, onSave, initialValue = 1 }: AtCandleModalProps) {
  const [selectedCandle, setSelectedCandle] = useState<string>(initialValue ? initialValue.toString() : "")

  const handleSave = () => {
    if (selectedCandle && !isNaN(Number(selectedCandle)) && Number(selectedCandle) > 0) {
      onSave(Number(selectedCandle))
    }
    onClose()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow positive integers
    if (value === "" || (/^\d+$/.test(value) && Number(value) > 0)) {
      setSelectedCandle(value)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-[#f1f1f1] rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl text-black font-bold">At Candle</h2>
          <button onClick={onClose} className="text-black">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg text-black font-medium mb-2">Enter Candle Number</h3>
          <div className="relative">
            <div className="flex items-center">
              <span className="text-black text-lg font-medium mr-2">-</span>
              <input
                type="text"
                className="w-full p-3 border rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#85e1fe]"
                placeholder="Enter candle number (e.g., 1, 2, 3...)"
                value={selectedCandle}
                onChange={handleInputChange}
                min="1"
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Enter a positive integer. The negative sign will be added automatically.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-6 text-black py-2 bg-white border border-gray-300 rounded-full">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-[#85e1fe] rounded-full text-black"
            disabled={!selectedCandle || isNaN(Number(selectedCandle)) || Number(selectedCandle) <= 0}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
