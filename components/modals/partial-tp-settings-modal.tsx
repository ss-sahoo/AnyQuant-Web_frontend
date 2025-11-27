"use client"

import { useState } from "react"
import { X, Plus, Trash2 } from "lucide-react"

interface PartialTPLevel {
  Price: string
  Close: string
  Action?: string
}

export interface PartialTPSettings {
  type: "partial_tp"
  partialTpList: PartialTPLevel[]
}

interface PartialTPSettingsModalProps {
  onClose: () => void
  onSave: (settings: PartialTPSettings) => void
  initialLevels?: PartialTPLevel[]
}

export function PartialTPSettingsModal({ onClose, onSave, initialLevels }: PartialTPSettingsModalProps) {
  const [levels, setLevels] = useState<PartialTPLevel[]>(
    initialLevels && initialLevels.length > 0
      ? initialLevels
      : [{ Price: "Entry_Price + 200pips", Close: "50%" }],
  )

  const addLevel = () => {
    setLevels((prev) => [...prev, { Price: "Entry_Price + 200pips", Close: "50%" }])
  }

  const updateLevel = (index: number, field: keyof PartialTPLevel, value: string) => {
    const next = [...levels]
    next[index] = { ...next[index], [field]: value }
    setLevels(next)
  }

  const removeLevel = (index: number) => {
    if (levels.length <= 1) return
    setLevels((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    onSave({ type: "partial_tp", partialTpList: levels })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white text-black rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium">Partial TP Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Levels</label>
            {levels.map((level, index) => (
              <div key={index} className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Level {index + 1}</span>
                  <button onClick={() => removeLevel(index)} className="text-red-400 hover:text-red-300">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="mb-2">
                  <label className="block text-xs mb-1">Price</label>
                  <input
                    type="text"
                    value={level.Price}
                    onChange={(e) => updateLevel(index, "Price", e.target.value)}
                    className="w-full bg-white border border-gray-300 px-3 py-2 rounded-md focus:outline-none"
                    placeholder="Entry_Price + 200pips"
                  />
                </div>

                <div className="mb-2">
                  <label className="block text-xs mb-1">Close Percentage</label>
                  <input
                    type="text"
                    value={level.Close}
                    onChange={(e) => updateLevel(index, "Close", e.target.value)}
                    className="w-full bg-white border border-gray-300 px-3 py-2 rounded-md focus:outline-none"
                    placeholder="50%"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">Action (Optional)</label>
                  <input
                    type="text"
                    value={level.Action || ""}
                    onChange={(e) => updateLevel(index, "Action", e.target.value)}
                    className="w-full bg-white border border-gray-300 px-3 py-2 rounded-md focus:outline-none"
                    placeholder="SL = Entry_Price"
                  />
                </div>
              </div>
            ))}
            <button onClick={addLevel} className="flex items-center justify-center w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-md">
              <Plus size={16} className="mr-1" /> Add Level
            </button>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700">Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}
















