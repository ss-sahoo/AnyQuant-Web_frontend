"use client"

import { useState } from "react"
import { X, Plus, Trash2 } from "lucide-react"
import { DraggableModal } from "./draggable-modal"

interface ManageExitItem {
  Price: string
  Close: string
  Action?: string
}

export interface ManageExitSettings {
  items: ManageExitItem[]
}

interface ManageExitSettingsModalProps {
  onClose: () => void
  onSave: (settings: ManageExitSettings) => void
  initialItems?: ManageExitItem[]
  /**
   * Trade direction of the owning statement. "B" = Buy / Long, "S" = Sell /
   * Short. Drives the default sign of seeded Price levels (above entry for
   * Buy, below for Sell). User-typed prices and edits flow through verbatim.
   */
  side?: "B" | "S"
}

// Backend regex (from spec):
//   <base>[<+|-><number>[pips]]
// where base ∈ {Entry_Price, SL, TP} or a numeric literal.
// We store and display exactly what the user types — no silent 1:10
// pips↔points conversion (it caused 10× drift round-tripping through the UI).
const PRICE_RE = /^[A-Za-z0-9_.]+(\s*[-+]\s*\d+(\.\d+)?(\s*pips)?)?$/
// Close is a percentage of the open position, e.g. "10%" or "100%".
const CLOSE_RE = /^\d+(\.\d+)?\s*%$/

export function ManageExitSettingsModal({ onClose, onSave, initialItems, side }: ManageExitSettingsModalProps) {
  // Buy (default): exit levels are above entry (+). Sell: below entry (−).
  const defaultSign = side === "S" ? "-" : "+"
  const defaultPrice = `Entry_Price ${defaultSign} 200pips`

  const [items, setItems] = useState<ManageExitItem[]>(
    initialItems && initialItems.length > 0
      ? initialItems.map(item => ({
          Price: item.Price,
          Close: item.Close || "100%",
          Action: item.Action,
        }))
      : [{ Price: defaultPrice, Close: "100%" }],
  )
  const [error, setError] = useState<string | null>(null)

  const addItem = () => {
    setItems(prev => [...prev, { Price: defaultPrice, Close: "100%" }])
  }

  const updateItem = (index: number, field: keyof ManageExitItem, value: string) => {
    const next = [...items]
    next[index] = { ...next[index], [field]: value }
    setItems(next)
  }

  const removeItem = (index: number) => {
    if (items.length <= 1) return
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    const trimmed: ManageExitItem[] = items.map(item => {
      const action = item.Action?.trim()
      return {
        Price: item.Price.trim(),
        Close: item.Close.trim(),
        ...(action ? { Action: action } : {}),
      }
    })
    for (let i = 0; i < trimmed.length; i++) {
      const it = trimmed[i]
      if (!PRICE_RE.test(it.Price)) {
        setError(`Rule ${i + 1}: Price must look like "Entry_Price + 200pips", "SL - 50pips", "TP - 100pips", or an absolute number.`)
        return
      }
      if (!CLOSE_RE.test(it.Close)) {
        setError(`Rule ${i + 1}: Close must be a percentage like "10%" or "100%".`)
        return
      }
    }
    setError(null)
    onSave({ items: trimmed })
    onClose()
  }

  return (
    <DraggableModal onClose={onClose} className="bg-white text-black rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium">Manage Exit</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-600 mb-4">
          Each rule closes the given percentage of the trade when its price level is touched, and can
          optionally apply an action (e.g. move SL to breakeven). The first matching rule wins.
        </p>

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
                  <label className="block text-xs mb-1">Price level</label>
                  <input
                    type="text"
                    value={item.Price}
                    onChange={(e) => updateItem(index, "Price", e.target.value)}
                    className="w-full bg-white border border-gray-300 px-3 py-2 rounded-md focus:outline-none"
                    placeholder={defaultPrice}
                  />
                </div>

                <div className="mb-2">
                  <label className="block text-xs mb-1">Close Percentage</label>
                  <input
                    type="text"
                    value={item.Close}
                    onChange={(e) => updateItem(index, "Close", e.target.value)}
                    className="w-full bg-white border border-gray-300 px-3 py-2 rounded-md focus:outline-none"
                    placeholder="100%"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">Action (Optional)</label>
                  <input
                    type="text"
                    value={item.Action || ""}
                    onChange={(e) => updateItem(index, "Action", e.target.value)}
                    className="w-full bg-white border border-gray-300 px-3 py-2 rounded-md focus:outline-none"
                    placeholder="SL = Entry_Price"
                  />
                </div>
              </div>
            ))}
            <button onClick={addItem} className="flex items-center justify-center w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-md">
              <Plus size={16} className="mr-1" /> Add Rule
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
          </div>
        </div>
      </div>
    </DraggableModal>
  )
}
