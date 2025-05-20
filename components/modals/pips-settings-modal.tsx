"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface PipsSettingsProps {
  initialValue?: number
  onClose: () => void
  onSave: (value: number) => void
}

export function PipsSettingsModal({ initialValue = 500, onClose, onSave }: PipsSettingsProps) {
  const [pipsValue, setPipsValue] = useState(initialValue)

  const handleSave = () => {
    onSave(pipsValue)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#f5f5f5] rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-black">Custom Pips Value</h2>
          <button onClick={onClose} className="text-black hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="border-t border-gray-200 my-4"></div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <label htmlFor="type" className="block text-lg font-medium text-black mb-2">
              Type
            </label>
            <div className="relative">
              <select
                id="type"
                className="w-full p-3 bg-white border border-gray-300 rounded-md appearance-none text-black"
                disabled
              >
                <option>Pips</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="value" className="block text-lg font-medium text-black mb-2">
              Value
            </label>
            <input
              type="number"
              id="value"
              value={pipsValue}
              onChange={(e) => setPipsValue(Number(e.target.value))}
              className="w-full p-3 bg-white border border-gray-300 rounded-md text-black"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-full text-black hover:bg-gray-100"
          >
            Cancel
          </button>
          <button onClick={handleSave} className="px-6 py-2 bg-[#85e1fe] rounded-full text-black hover:bg-[#6dcfe9]">
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
