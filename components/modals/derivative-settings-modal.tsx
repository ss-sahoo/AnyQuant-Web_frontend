"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { DraggableModal } from "./draggable-modal"

interface DerivativeSettingsModalProps {
  onClose: () => void
  onSave: (settings: any) => void
  currentIndicator?: any
}

export function DerivativeSettingsModal({ onClose, onSave, currentIndicator }: DerivativeSettingsModalProps) {
  const [order, setOrder] = useState("1")

  const handleSave = () => {
    const settings: any = {
      order: Number.parseInt(order),
    }

    onSave(settings)
  }

  return (
    <DraggableModal onClose={onClose} className="bg-[#f1f1f1] rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
      <div>
        <div className="flex justify-between items-center p-6">
          <h2 className="text-2xl font-bold text-black">Derivative Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6">
          {/* Derivative Order */}
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-800 mb-2">Derivative Order</label>
            <input
              type="text"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded text-gray-700"
              placeholder="Enter derivative order (e.g., 1, 2, 3)"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-8">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button onClick={handleSave} className="px-6 py-3 bg-[#85e1fe] rounded-full text-black hover:bg-[#6bcae2]">
              Save
            </button>
          </div>
        </div>
      </div>
    </DraggableModal>
  )
}
