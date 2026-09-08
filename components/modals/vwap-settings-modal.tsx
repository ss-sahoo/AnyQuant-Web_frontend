"use client"

import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"
import { DraggableModal } from "./draggable-modal"
import { CVD_RESET_PERIODS } from "@/lib/indicator-contract"

interface VwapSettingsModalProps {
  onClose: () => void
  onSave: (settings: any) => void
  initialSettings?: {
    reset_period?: string | null
  }
}

export function VwapSettingsModal({ onClose, onSave, initialSettings }: VwapSettingsModalProps) {
  const [resetPeriod, setResetPeriod] = useState<string>(initialSettings?.reset_period || "D")
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSave = () => {
    onSave({
      reset_period: resetPeriod,
    })
    onClose()
  }

  const periodLabels: Record<string, string> = {
    D: "Daily Session (D)",
    W: "Weekly (W)",
    M: "Monthly (M)",
    Q: "Quarterly (Q)",
  }

  return (
    <DraggableModal onClose={onClose} className="bg-[#f1f1f1] rounded-lg shadow-lg w-full max-w-md">
      <div>
        <div className="flex justify-between items-center p-6">
          <h2 className="text-2xl font-bold text-black">VWAP Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-medium text-gray-800 mb-2">Reset Anchor Period</label>
              <div className="relative" ref={dropdownRef}>
                <button
                  className="w-full p-3 border border-gray-300 rounded text-gray-700 bg-white flex justify-between items-center"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  {periodLabels[resetPeriod] || resetPeriod}
                  <span className="ml-2">▼</span>
                </button>

                {showDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
                    {CVD_RESET_PERIODS.map((option) => (
                      <button
                        key={option}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setResetPeriod(option)
                          setShowDropdown(false)
                        }}
                      >
                        {periodLabels[option] || option}
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
    </DraggableModal>
  )
}
