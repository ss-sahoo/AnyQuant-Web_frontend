"use client"

import { X } from "lucide-react"
import { DraggableModal } from "./draggable-modal"

interface VolumeSettingsModalProps {
  onClose: () => void
  onSave: () => void
}

// Volume is a raw OHLCV column (type "C", input "volume") — it carries no
// engine-side parameters. This modal is a confirmation step so the add path
// has the same flow as every other indicator. The Volume_MA variant has its
// own dedicated modal (volume-ma-settings-modal.tsx).
export function VolumeSettingsModal({ onClose, onSave }: VolumeSettingsModalProps) {
  return (
    <DraggableModal onClose={onClose} className="bg-[#f1f1f1] rounded-lg shadow-lg w-full max-w-md">
      <div>
        <div className="flex justify-between items-center p-6">
          <h2 className="text-2xl font-bold text-black">Volume</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <p className="text-base text-gray-700">
            The Volume column has no additional parameters. To use a moving
            average of volume, add <span className="font-medium">Volume_MA</span> instead.
          </p>

          <div className="flex justify-end space-x-3 mt-8">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-6 py-3 bg-[#85e1fe] rounded-full text-black hover:bg-[#6bcae2]"
            >
              Add Volume
            </button>
          </div>
        </div>
      </div>
    </DraggableModal>
  )
}
