"use client"

import { useState } from "react"
import { X, Code, Blocks, Layers } from "lucide-react"
import { DraggableModal } from "./draggable-modal"
import type { BuilderType } from "@/lib/builder-mode"

interface ChangeStrategyTypeModalProps {
  strategyName: string
  currentType: BuilderType
  /**
   * True for rows that come from the custom-strategies API. Those records hold
   * code and nothing else, so there is no no-code side to switch to — the only
   * way out is Convert to Hybrid, which creates the missing regular strategy.
   */
  locked?: boolean
  onClose: () => void
  onSave: (type: BuilderType) => void
  onConvertToHybrid?: () => void
}

const TYPE_OPTIONS: { type: BuilderType; label: string; description: string; Icon: typeof Code }[] = [
  {
    type: "nocode",
    label: "No-code",
    description: "Opens the visual builder. Conditions are assembled from indicator and operator blocks.",
    Icon: Blocks,
  },
  {
    type: "developer",
    label: "Developer",
    description: "Opens the code editor. The logic lives in Python, not in statements.",
    Icon: Code,
  },
  {
    type: "hybrid",
    label: "Hybrid",
    description: "Both sides in play: opens the code editor, keeps the no-code statements alongside it.",
    Icon: Layers,
  },
]

/**
 * Changes how a strategy is classified on the home table. The type is not
 * cosmetic: it decides which editor the strategy reopens in (ANY-308).
 */
export function ChangeStrategyTypeModal({
  strategyName,
  currentType,
  locked = false,
  onClose,
  onSave,
  onConvertToHybrid,
}: ChangeStrategyTypeModalProps) {
  const [selected, setSelected] = useState<BuilderType>(currentType)

  return (
    <DraggableModal onClose={onClose} className="bg-[#f5f5f5] rounded-lg w-full max-w-md p-6">
      <div>
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-2xl font-bold text-black">Change type</h2>
          <button onClick={(e) => { e.stopPropagation(); onClose() }} className="text-black hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          {locked ? (
            <>
              <span className="font-medium text-black">{strategyName}</span> is a code-only strategy, so it has no
              no-code side to open. Convert it to Hybrid to create one and keep the code linked to it.
            </>
          ) : (
            <>
              Sets the badge for <span className="font-medium text-black">{strategyName}</span> and the editor it
              reopens in.
            </>
          )}
        </p>

        <div className="space-y-3">
          {TYPE_OPTIONS.map(({ type, label, description, Icon }) => {
            const isSelected = selected === type
            const isDisabled = locked && type !== currentType
            return (
              <button
                key={type}
                disabled={isDisabled}
                onClick={(e) => { e.stopPropagation(); setSelected(type) }}
                className={`w-full flex items-start gap-4 p-4 bg-white border rounded-lg text-left transition-colors ${
                  isSelected ? "border-[#5AB9D1] ring-1 ring-[#5AB9D1]" : "border-gray-300"
                } ${isDisabled ? "opacity-50 cursor-not-allowed" : "hover:border-[#85e1fe]"}`}
              >
                <Icon className="w-6 h-6 text-[#5AB9D1] flex-shrink-0 mt-1" />
                <div>
                  <div className="text-base font-medium text-black">{label}</div>
                  <div className="text-sm text-gray-600">{description}</div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={(e) => { e.stopPropagation(); onClose() }}
            className="px-6 py-2 border border-gray-300 rounded-full text-[#1e1e1e] hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          {locked ? (
            <button
              onClick={(e) => { e.stopPropagation(); onConvertToHybrid?.() }}
              className="px-6 py-2 bg-[#6BCAE2] rounded-full text-[#1e1e1e] hover:bg-[#5AB9D1] transition-colors"
            >
              Convert to Hybrid
            </button>
          ) : (
            <button
              disabled={selected === currentType}
              onClick={(e) => { e.stopPropagation(); onSave(selected) }}
              className="px-6 py-2 bg-[#6BCAE2] rounded-full text-[#1e1e1e] hover:bg-[#5AB9D1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          )}
        </div>
      </div>
    </DraggableModal>
  )
}
