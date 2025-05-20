"use client"

import { useState } from "react"
import { ChevronDown, X } from "lucide-react"

interface AtCandleModalProps {
  onClose: () => void
  onSave: (candleNumber: number) => void
  initialValue?: number
}

export function AtCandleModal({ onClose, onSave, initialValue = 1 }: AtCandleModalProps) {
  const [selectedCandle, setSelectedCandle] = useState<string>(initialValue ? initialValue.toString() : "")

  const handleSave = () => {
    if (selectedCandle) {
      onSave(Number(selectedCandle))
    }
    onClose()
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
          <h3 className="text-lg text-black font-medium mb-2">Select Candle</h3>
          <div className="relative">
            <select
              className="w-full p-3 border rounded-lg appearance-none bg-white text-gray-700"
              onChange={(e) => setSelectedCandle(e.target.value)}
              value={selectedCandle}
            >
              <option value="" disabled>
                Select Candle
              </option>
              <option value="1">Candle 1</option>
              <option value="2">Candle 2</option>
              <option value="3">Candle 3</option>
              <option value="4">Candle 4</option>
              <option value="5">Candle 5</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500" />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-6 text-black py-2 bg-white border border-gray-300 rounded-full">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-[#85e1fe] rounded-full text-black"
            disabled={!selectedCandle}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
