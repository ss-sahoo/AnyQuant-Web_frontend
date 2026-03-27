"use client"

import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"

interface MaSettingsModalProps {
  onClose: () => void
  onSave: (settings: any) => void
  initialSettings?: {
    maType?: string
    maLength?: number | string
  }
}

export function MaSettingsModal({ onClose, onSave, initialSettings }: MaSettingsModalProps) {
  const [maType, setMaType] = useState(initialSettings?.maType || "SMA")
  const [maLength, setMaLength] = useState(String(initialSettings?.maLength || 20))
  const [showMaTypeDropdown, setShowMaTypeDropdown] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)
  const maTypeDropdownRef = useRef<HTMLDivElement>(null)

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
      if (maTypeDropdownRef.current && !maTypeDropdownRef.current.contains(event.target as Node)) {
        setShowMaTypeDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSave = () => {
    onSave({
      maType,
      maLength: Number(maLength),
    })
    onClose()
  }

  const maTypes = ["SMA", "EMA", "HMA"]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-[#f1f1f1] rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-6">
          <h2 className="text-2xl font-bold text-black">MA Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div>
            <h3 className="text-xl font-medium text-gray-800 mb-4">Define Settings</h3>

            <div className="mb-4">
              <label className="block text-base font-medium text-gray-700 mb-2">MA Type</label>
              <div className="relative" ref={maTypeDropdownRef}>
                <button
                  className="w-full p-3 border border-gray-300 rounded text-gray-700 bg-white flex justify-between items-center"
                  onClick={() => setShowMaTypeDropdown(!showMaTypeDropdown)}
                >
                  {maType}
                  <span className="ml-2">▼</span>
                </button>

                {showMaTypeDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
                    {maTypes.map((type) => (
                      <button
                        key={type}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setMaType(type)
                          setShowMaTypeDropdown(false)
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-base font-medium text-gray-700 mb-2">MA Length</label>
              <input
                type="number"
                value={maLength}
                onChange={(e) => setMaLength(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded text-gray-700"
                min="1"
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

