"use client"

import type React from "react"
import { X } from "lucide-react"

interface WalkForwardSettingsModalContentProps {
  warmupBars: string
  setWarmupBars: React.Dispatch<React.SetStateAction<string>>
  lookbackBars: string
  setLookbackBars: React.Dispatch<React.SetStateAction<string>>
  validationBars: string
  setValidationBars: React.Dispatch<React.SetStateAction<string>>
  anchor: boolean
  setAnchor: React.Dispatch<React.SetStateAction<boolean>>
  onClose: () => void
  onSave: () => void
}

export function WalkForwardSettingsModalContent({
  warmupBars,
  setWarmupBars,
  lookbackBars,
  setLookbackBars,
  validationBars,
  setValidationBars,
  anchor,
  setAnchor,
  onClose,
  onSave,
}: WalkForwardSettingsModalContentProps) {
  return (
    <div className="bg-[#f5f5f5] rounded-lg shadow-lg w-full max-w-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-black">Walk Forward Optimisation Settings</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm text-gray-600 mb-2">Warmup Bars</label>
          <input
            type="text"
            value={warmupBars}
            onChange={(e) => setWarmupBars(e.target.value)}
            placeholder="15"
            className="w-full bg-white border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-black"
          />
          <p className="text-xs text-gray-500 mt-1">Optional buffer before the first training segment begins</p>
        </div>
        
        <div>
          <label className="block text-sm text-gray-600 mb-2">Lookback Bars</label>
          <input
            type="text"
            value={lookbackBars}
            onChange={(e) => setLookbackBars(e.target.value)}
            placeholder="1000"
            className="w-full bg-white border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-black"
          />
          <p className="text-xs text-gray-500 mt-1">Size of the training window (in-sample data)</p>
        </div>
        
        <div>
          <label className="block text-sm text-gray-600 mb-2">Validation Bars</label>
          <input
            type="text"
            value={validationBars}
            onChange={(e) => setValidationBars(e.target.value)}
            placeholder="200"
            className="w-full bg-white border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-black"
          />
          <p className="text-xs text-gray-500 mt-1">Size of the validation window (out-of-sample)</p>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Anchor</label>
            <p className="text-xs text-gray-500">Keep training window fixed or expand cumulatively</p>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="anchor-toggle"
              checked={anchor}
              onChange={(e) => setAnchor(e.target.checked)}
              className="w-4 h-4 text-[#85e1fe] bg-white border-gray-300 rounded focus:ring-[#85e1fe] focus:ring-2"
            />
            <label htmlFor="anchor-toggle" className="ml-2 text-sm text-gray-600">
              {anchor ? "ON" : "OFF"}
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button onClick={onClose} className="px-6 py-3 border border-gray-300 rounded-full text-black">
          Cancel
        </button>
        <button onClick={onSave} className="px-6 py-3 bg-[#85e1fe] rounded-full text-black">
          Save
        </button>
      </div>
    </div>
  )
} 