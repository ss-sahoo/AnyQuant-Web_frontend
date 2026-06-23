"use client"

import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"
import { DraggableModal } from "./draggable-modal"
import { SOURCES } from "@/lib/indicator-contract"

interface RsiSettingsModalProps {
  onClose: () => void
  onSave: (settings: { rsiLength: string; source: string; timeframe: string }) => void
  initialSettings?: {
    rsiLength?: string
    source?: string
    timeframe?: string
  }
}

// RSI-only modal. The RSI_MA variant lives in rsi-ma-settings-modal.tsx — the
// two used to share one modal toggled by an indicator-type tab, which made
// "which input_params will be sent?" depend on hidden state. They're now
// separate so the contract is obvious from the call site.
export function RsiSettingsModal({ onClose, onSave, initialSettings }: RsiSettingsModalProps) {
  const [rsiLength, setRsiLength] = useState(initialSettings?.rsiLength || "14")
  const [source, setSource] = useState(initialSettings?.source || "Close")
  const [timeframe, setTimeframe] = useState(initialSettings?.timeframe || "3h")
  const [showSourceDropdown, setShowSourceDropdown] = useState(false)

  const sourceDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!initialSettings) return
    setRsiLength(initialSettings.rsiLength || "14")
    setSource(initialSettings.source || "Close")
    setTimeframe(initialSettings.timeframe || "3h")
  }, [initialSettings])

  useEffect(() => {
    if (initialSettings) return
    try {
      const saved = localStorage.getItem("rsiSettings")
      if (!saved) return
      const parsed = JSON.parse(saved)
      if (parsed.rsiLength !== undefined) setRsiLength(String(parsed.rsiLength))
      if (parsed.source) setSource(parsed.source)
      if (parsed.timeframe) setTimeframe(parsed.timeframe)
    } catch {
      // ignored
    }
  }, [initialSettings])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(event.target as Node)) {
        setShowSourceDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSave = () => {
    try {
      localStorage.setItem("rsiSettings", JSON.stringify({ rsiLength, source, timeframe }))
    } catch {
      // ignored
    }
    onSave({ rsiLength, source, timeframe })
  }

  const sources = [...SOURCES]

  return (
    <DraggableModal onClose={onClose} className="bg-[#f1f1f1] rounded-lg shadow-lg w-full max-w-md">
      <div>
        <div className="flex justify-between items-center p-6">
          <h2 className="text-2xl font-bold text-black">RSI Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div>
            <h3 className="text-xl font-medium text-gray-800 mb-4">Define Settings</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">RSI Length</label>
                <input
                  type="text"
                  value={rsiLength}
                  onChange={(e) => setRsiLength(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded text-gray-700"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Source</label>
                <div className="relative" ref={sourceDropdownRef}>
                  <button
                    className="w-full p-3 border border-gray-300 rounded text-gray-700 bg-white flex justify-between items-center"
                    onClick={() => setShowSourceDropdown(!showSourceDropdown)}
                  >
                    {source}
                    <span className="ml-2">▼</span>
                  </button>
                  {showSourceDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
                      {sources.map((src) => (
                        <button
                          key={src}
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => { setSource(src); setShowSourceDropdown(false) }}
                        >
                          {src}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
