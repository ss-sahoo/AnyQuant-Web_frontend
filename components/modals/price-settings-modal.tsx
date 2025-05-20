import { useState } from "react"
import { ChevronDown, X } from 'lucide-react'

interface PriceSettingsModalProps {
  onClose: () => void
  onSave: (priceType: string) => void
}

export function PriceSettingsModal({ onClose, onSave }: PriceSettingsModalProps) {
  const [selectedPrice, setSelectedPrice] = useState("")

  const handleSave = () => {
    if (selectedPrice) {
      onSave(selectedPrice)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-[#f1f1f1] rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl text-black font-bold">Price Settings</h2>
          <button onClick={onClose} className="text-black">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg text-black font-medium mb-2">Price Level</h3>
          <div className="relative">
            <select
              className="w-full p-3 border rounded-lg appearance-none bg-white text-gray-700"
              onChange={(e) => setSelectedPrice(e.target.value)}
              value={selectedPrice}
            >
              <option value="" disabled>
                Select Level
              </option>
              <option value="open">Price Open</option>
              <option value="close">Price Close</option>
              <option value="low">Price Low</option>
              <option value="high">Price High</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500" />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 text-black py-2 bg-white border border-gray-300 rounded-full"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-[#85e1fe] rounded-full text-black"
            disabled={!selectedPrice}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
