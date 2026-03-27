"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface SaveStrategyModalProps {
  initialName?: string
  onClose: () => void
  onSaveDraft: (name: string) => void
  onProceedToTesting: (name: string) => void
  isSaving?: boolean
  isProceeding?: boolean
}

export function SaveStrategyModal({
  initialName = "",
  onClose,
  onSaveDraft,
  onProceedToTesting,
  isSaving = false,
  isProceeding = false,
}: SaveStrategyModalProps) {
  const [strategyName, setStrategyName] = useState(initialName || "Strategyname")

  // If either loading state is active, show the loading overlay
  if (isSaving || isProceeding) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#f5f5f5] rounded-lg w-full max-w-md p-6 flex flex-col items-center">
          <div className="w-24 h-24 mb-6 relative">
            <div className="absolute inset-0 rounded-full border-4 border-t-[#85e1fe] border-r-[#85e1fe] border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-medium text-black">
            {isSaving ? "Saving Strategy..." : "Loading Strategy Testing..."}
          </h2>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#f5f5f5] rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-black">Save strategy</h2>
          <button onClick={onClose} className="text-black hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-8">
          <input
            type="text"
            value={strategyName}
            onChange={(e) => setStrategyName(e.target.value)}
            className="w-full p-4 bg-white border border-gray-300 rounded-md text-black text-lg"
            placeholder="Strategyname.py"
          />
        </div>

        <div className="flex justify-between space-x-4">
          <button
            onClick={() => onSaveDraft(strategyName)}
            className="px-8 py-3 border border-gray-300 rounded-full text-black hover:bg-gray-100 flex-1"
          >
            Save draft
          </button>
          <button
            onClick={() => onProceedToTesting(strategyName)}
            className="px-8 py-3 bg-[#85e1fe] rounded-full text-black hover:bg-[#6dcfe9] flex-1 whitespace-nowrap"
          >
            Strategy Testing
          </button>
        </div>
      </div>
    </div>
  )
}
