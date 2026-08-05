"use client"

import { X, Code, Blocks } from "lucide-react"
import { DraggableModal } from "./draggable-modal"
import type { BuilderMode } from "@/lib/builder-mode"

interface BuilderModePreferenceModalProps {
  onClose: () => void
  onSelect: (mode: BuilderMode) => void
}

/**
 * One-time dialog shown the first time the strategy creator opens for a new
 * strategy (ANY-308): lets the user pick their default view. The choice is
 * stored as `preferred_builder_mode` and can be changed anytime with the
 * Developer Mode toggle.
 */
export function BuilderModePreferenceModal({ onClose, onSelect }: BuilderModePreferenceModalProps) {
  return (
    <DraggableModal onClose={onClose} className="bg-[#f5f5f5] rounded-lg w-full max-w-md p-6">
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-black">How do you build strategies?</h2>
          <button onClick={onClose} className="text-black hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Pick your default view. You can switch anytime with the Developer Mode button.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => onSelect("nocode")}
            className="w-full flex items-start gap-4 p-4 bg-white border border-gray-300 rounded-lg text-left hover:border-[#85e1fe] transition-colors"
          >
            <Blocks className="w-8 h-8 text-[#5AB9D1] flex-shrink-0 mt-1" />
            <div>
              <div className="text-lg font-medium text-black">No-code builder</div>
              <div className="text-sm text-gray-600">
                Build strategies visually from indicators, operators and trade-management blocks.
              </div>
            </div>
          </button>
          <button
            onClick={() => onSelect("developer")}
            className="w-full flex items-start gap-4 p-4 bg-white border border-gray-300 rounded-lg text-left hover:border-[#85e1fe] transition-colors"
          >
            <Code className="w-8 h-8 text-[#5AB9D1] flex-shrink-0 mt-1" />
            <div>
              <div className="text-lg font-medium text-black">Developer mode</div>
              <div className="text-sm text-gray-600">
                Write strategies and custom components directly in Python or PineScript.
              </div>
            </div>
          </button>
        </div>
      </div>
    </DraggableModal>
  )
}
