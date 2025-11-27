"use client"

import { useState } from "react"
import { X, Plus, Trash2 } from "lucide-react"

interface ManageExitItem {
  Price: string
  Action: string
}

export interface ManageExitSettings {
  items: ManageExitItem[]
}

interface ManageExitSettingsModalProps {
  onClose: () => void
  onSave: (settings: ManageExitSettings) => void
  initialItems?: ManageExitItem[]
}

export function ManageExitSettingsModal({ onClose, onSave, initialItems }: ManageExitSettingsModalProps) {
  const [items, setItems] = useState<ManageExitItem[]>(
    initialItems && initialItems.length > 0
      ? initialItems
      : [
          { Price: "Entry_Price + 200pips", Action: "SL = Entry_Price + 350pips" },
        ],
  )

  const addItem = () => {
    setItems((prev) => [...prev, { Price: "Entry_Price + 200pips", Action: "SL = Entry_Price" }])
  }

  const updateItem = (index: number, field: keyof ManageExitItem, value: string) => {
    const next = [...items]
    next[index] = { ...next[index], [field]: value }
    setItems(next)
  }

  const removeItem = (index: number) => {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    onSave({ items })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white text-black rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium">Manage Exit</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Rules</label>
            {items.map((item, index) => (
              <div key={index} className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Rule {index + 1}</span>
                  <button onClick={() => removeItem(index)} className="text-red-400 hover:text-red-300">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="mb-2">
                  <label className="block text-xs mb-1">Level</label>
                  <input
                    type="text"
                    value={item.Price}
                    onChange={(e) => updateItem(index, "Price", e.target.value)}
                    className="w-full bg-white border border-gray-300 px-3 py-2 rounded-md focus:outline-none"
                    placeholder="Entry_Price + 200pips"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">Action</label>
                  <input
                    type="text"
                    value={item.Action}
                    onChange={(e) => updateItem(index, "Action", e.target.value)}
                    className="w-full bg-white border border-gray-300 px-3 py-2 rounded-md focus:outline-none"
                    placeholder="SL = Entry_Price + 350pips"
                  />
                </div>
              </div>
            ))}
            <button onClick={addItem} className="flex items-center justify-center w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-md">
              <Plus size={16} className="mr-1" /> Add Rule
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
















