"use client"

import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"

interface AtrSettingsModalProps {
  onClose: () => void
  onSave: (settings: any) => void
  initialSettings?: {
    atr_length: string
    atr_smoothing: string
  }
}

export function AtrSettingsModal({ onClose, onSave, initialSettings }: AtrSettingsModalProps) {
  const [length, setLength] = useState(initialSettings?.atr_length || "14")
  const [smoothing, setSmoothing] = useState(initialSettings?.atr_smoothing || "RMA")
  const [showSmoothingDropdown, setShowSmoothingDropdown] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const smoothingDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    function handleEscKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscKey)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscKey)
    }
  }, [onClose])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (smoothingDropdownRef.current && !smoothingDropdownRef.current.contains(event.target as Node)) {
        setShowSmoothingDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSave = () => {
    onSave({
      atr_length: length,
      atr_smoothing: smoothing,
    })
    onClose()
  }

  const smoothingOptions = ["RMA", "SMA", "EMA", "WMA", "VWMA"]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-[#f1f1f1] rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-6">
          <h2 className="text-2xl font-bold text-black">ATR Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-medium text-gray-800 mb-2">Length</label>
              <input
                type="text"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded text-gray-700"
              />
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-800 mb-2">Smoothing</label>
              <div className="relative" ref={smoothingDropdownRef}>
                <button
                  className="w-full p-3 border border-gray-300 rounded text-gray-700 bg-white flex justify-between items-center"
                  onClick={() => setShowSmoothingDropdown(!showSmoothingDropdown)}
                >
                  {smoothing}
                  <span className="ml-2">▼</span>
                </button>

                {showSmoothingDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
                    {smoothingOptions.map((option) => (
                      <button
                        key={option}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setSmoothing(option)
                          setShowSmoothingDropdown(false)
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
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
    </div>
  )
}
