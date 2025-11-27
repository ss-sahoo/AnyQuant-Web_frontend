"use client"

import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"

interface StochasticSettingsModalProps {
  onClose: () => void
  onSave: (settings: any) => void
  initialSettings?: {
    // Support both parameter formats
    indicatorType?: string
    kLength?: string | number
    kSmoothing?: string | number
    dSmoothing?: string | number
    // Alternative format (Stochastic)
    fastk_period?: number
    slowk_period?: number
    slowd_period?: number
    output?: "slowk" | "slowd"
    timeframe?: string
  }
}

export function StochasticSettingsModal({ onClose, onSave, initialSettings }: StochasticSettingsModalProps) {
  // Support both parameter formats
  const [indicatorType, setIndicatorType] = useState(
    initialSettings?.indicatorType || 
    (initialSettings?.output === "slowd" ? "d" : "k")
  )
  const [kLength, setKLength] = useState(
    String(initialSettings?.kLength || initialSettings?.fastk_period || 12)
  )
  const [kSmoothing, setKSmoothing] = useState(
    String(initialSettings?.kSmoothing || initialSettings?.slowk_period || 26)
  )
  const [dSmoothing, setDSmoothing] = useState(
    String(initialSettings?.dSmoothing || initialSettings?.slowd_period || 9)
  )
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
    // Only close if clicking the backdrop itself, not its children
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleSave = () => {
    // Return both parameter formats for compatibility
    onSave({
      indicatorType,
      kLength,
      kSmoothing,
      dSmoothing,
      // Also include Stochastic format
      fastk_period: Number(kLength),
      slowk_period: Number(kSmoothing),
      slowd_period: Number(dSmoothing),
      output: indicatorType === "d" ? "slowd" : "slowk",
    })
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div ref={modalRef} className="bg-[#f1f1f1] rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-6">
          <h2 className="text-2xl font-bold text-black">Stochastic Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-800 mb-2">Indicator Type</label>
            <div className="grid grid-cols-2 gap-0 border border-gray-300 rounded-md overflow-hidden">
              <button
                className={`py-3 px-4 text-center ${
                  indicatorType === "k" ? "bg-gray-400 text-white" : "bg-white text-gray-700"
                }`}
                onClick={() => setIndicatorType("k")}
              >
                %K
              </button>
              <button
                className={`py-3 px-4 text-center ${
                  indicatorType === "d" ? "bg-gray-400 text-white" : "bg-white text-gray-700"
                }`}
                onClick={() => setIndicatorType("d")}
              >
                %D
              </button>
            </div>
          </div>

          <div className="border-t border-gray-300 my-6"></div>

          <div>
            <h3 className="text-xl font-medium text-gray-800 mb-4">Define Settings</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">%K Length</label>
                <input
                  type="text"
                  value={kLength}
                  onChange={(e) => setKLength(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded text-gray-700"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">%K Smoothing</label>
                <input
                  type="text"
                  value={kSmoothing}
                  onChange={(e) => setKSmoothing(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded text-gray-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">%D Smoothing</label>
              <input
                type="text"
                value={dSmoothing}
                onChange={(e) => setDSmoothing(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded text-gray-700"
              />
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
