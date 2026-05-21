"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { X } from "lucide-react"
import type { Algorithm } from "@/lib/types"
import { useRouter } from "next/navigation"
import { DraggableModal } from "./modals/draggable-modal"

interface EditStrategyModalProps {
  strategy: Algorithm
  onClose: () => void
  onSave: (name: string) => void
  isEdit?: boolean
}

export function EditStrategyModal({ strategy, onClose, onSave, isEdit = false }: EditStrategyModalProps) {
  const [strategyName, setStrategyName] = useState(strategy.name)
  const router = useRouter()

  // Update strategy name when prop changes
  useEffect(() => {
    setStrategyName(strategy.name)
  }, [strategy.name])

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSave(strategyName)
    onClose()
  }

  const handleProceedToBuilder = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSave(strategyName)
    const id = strategy.id.toString().split("-")[0]
    router.push(`/strategy-builder/${id}/`)
    onClose()
  }

  return (
    <DraggableModal onClose={onClose} className="bg-[#f5f5f5] rounded-xl shadow-lg w-full max-w-md relative">
        <div className="flex justify-between items-center p-6 pb-4">
          <h2 className="text-[#1e1e1e] text-2xl font-bold">Strategy Summary</h2>
          <button onClick={(e) => { e.stopPropagation(); onClose() }} className="text-[#1e1e1e] hover:bg-gray-200 rounded-full p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 pt-2">
          <div className="mb-8">
            <label htmlFor="strategy-name" className="block text-[#1e1e1e] text-lg font-medium mb-2">
              Strategy Name
            </label>
            <input
              id="strategy-name"
              type="text"
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-full p-3 border border-gray-300 rounded-lg text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#6BCAE2]"
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="px-8 py-3 border border-gray-300 rounded-full text-[#1e1e1e] hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            {isEdit ? (
              <button
                onClick={handleProceedToBuilder}
                className="px-8 py-3 bg-[#6BCAE2] rounded-full text-[#1e1e1e] hover:bg-[#5AB9D1] transition-colors"
              >
                Edit
              </button>
            ) : (
              <button
                onClick={handleSaveClick}
                className="px-8 py-3 bg-[#6BCAE2] rounded-full text-[#1e1e1e] hover:bg-[#5AB9D1] transition-colors"
              >
                Save
              </button>
            )}
          </div>
        </div>
    </DraggableModal>
  )
}
