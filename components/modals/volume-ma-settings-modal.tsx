"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { DraggableModal } from "./draggable-modal"

interface VolumeMaSettingsModalProps {
  onClose: () => void
  onSave: (settings: { maLength: string }) => void
  initialSettings?: { maLength?: string }
}

export function VolumeMaSettingsModal({ onClose, onSave, initialSettings }: VolumeMaSettingsModalProps) {
  const [maLength, setMaLength] = useState(initialSettings?.maLength || "20")

  useEffect(() => {
    if (!initialSettings) return
    if (initialSettings.maLength !== undefined) setMaLength(String(initialSettings.maLength))
  }, [initialSettings])

  // Remember the user's last choice across opens, but never override an
  // explicit caller-provided seed (editing flow).
  useEffect(() => {
    if (initialSettings) return
    try {
      const saved = localStorage.getItem("volumeMaSettings")
      if (!saved) return
      const parsed = JSON.parse(saved)
      if (parsed.maLength !== undefined) setMaLength(String(parsed.maLength))
    } catch {
      // ignored
    }
  }, [initialSettings])

  const handleSave = () => {
    try {
      localStorage.setItem("volumeMaSettings", JSON.stringify({ maLength }))
    } catch {
      // ignored
    }
    onSave({ maLength })
  }

  return (
    <DraggableModal onClose={onClose} className="bg-[#f1f1f1] rounded-lg shadow-lg w-full max-w-md">
      <div>
        <div className="flex justify-between items-center p-6">
          <h2 className="text-2xl font-bold text-black">Volume MA Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div>
            <h3 className="text-xl font-medium text-gray-800 mb-4">Define Settings</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">MA Length</label>
                <input
                  type="text"
                  value={maLength}
                  onChange={(e) => setMaLength(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded text-gray-700"
                />
              </div>
            </div>
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
