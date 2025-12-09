"use client"

import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"

interface SuperTrendSettingsModalProps {
  onClose: () => void
  onSave: (settings: any) => void
  initialSettings?: {
    period?: number | string
    multiplier?: number | string
    change_atr_method?: boolean
    output?: "BuySignal" | "SellSignal" | "trend" | "up" | "dn" | "atr"
  }
}

export function SuperTrendSettingsModal({ onClose, onSave, initialSettings }: SuperTrendSettingsModalProps) {
  const [period, setPeriod] = useState(String(initialSettings?.period || 10))
  const [multiplier, setMultiplier] = useState(String(initialSettings?.multiplier || 3.0))
  const [changeAtrMethod, setChangeAtrMethod] = useState(initialSettings?.change_atr_method ?? true)
  const [output, setOutput] = useState<"BuySignal" | "SellSignal" | "trend" | "up" | "dn" | "atr">(initialSettings?.output || "SellSignal")
  
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleEscKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscKey)

    return () => {
      document.removeEventListener("keydown", handleEscKey)
    }
  }, [onClose])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleSave = () => {
    onSave({
      period: Number(period),
      multiplier: Number(multiplier),
      change_atr_method: changeAtrMethod,
      output,
    })
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div ref={modalRef} className="bg-[#f1f1f1] rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-6">
          <h2 className="text-2xl font-bold text-black">SuperTrend Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div>
            <h3 className="text-xl font-medium text-gray-800 mb-4">Define Settings</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Period</label>
                <input
                  type="text"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded text-gray-700"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Multiplier</label>
                <input
                  type="text"
                  value={multiplier}
                  onChange={(e) => setMultiplier(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded text-gray-700"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={changeAtrMethod}
                  onChange={(e) => setChangeAtrMethod(e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-base font-medium text-gray-700">Change ATR Method</span>
              </label>
            </div>

            <div className="border-t border-gray-300 my-6"></div>

            <div className="mb-4">
              <label className="block text-base font-medium text-gray-700 mb-2">Output Type</label>
              <select
                value={output}
                onChange={(e) => setOutput(e.target.value as "BuySignal" | "SellSignal" | "trend" | "up" | "dn" | "atr")}
                className="w-full p-3 border border-gray-300 rounded text-gray-700 bg-white"
              >
                <option value="BuySignal">Buy Signal (boolean)</option>
                <option value="SellSignal">Sell Signal (boolean)</option>
                <option value="trend">Trend (1 for uptrend, -1 for downtrend)</option>
                <option value="up">Up (upper band value)</option>
                <option value="dn">Down (lower band value)</option>
                <option value="atr">ATR (volatility value)</option>
              </select>
              <p className="text-xs text-gray-600 mt-2">
                Lower period/multiplier = more sensitive (more signals, more noise)
              </p>
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
    </div>
  )
}
