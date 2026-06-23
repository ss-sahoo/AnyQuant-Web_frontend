"use client"

import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"
import { DraggableModal } from "./draggable-modal"
import { MA_TYPES, SOURCES } from "@/lib/indicator-contract"

interface RsiMaSettingsModalProps {
  onClose: () => void
  onSave: (settings: {
    rsiLength: string
    source: string
    maLength: string
    maType: string
    timeframe: string
  }) => void
  initialSettings?: {
    rsiLength?: string
    source?: string
    maLength?: string
    maType?: string
    timeframe?: string
  }
}

export function RsiMaSettingsModal({ onClose, onSave, initialSettings }: RsiMaSettingsModalProps) {
  const [rsiLength, setRsiLength] = useState(initialSettings?.rsiLength || "14")
  const [source, setSource] = useState(initialSettings?.source || "Close")
  const [maLength, setMaLength] = useState(initialSettings?.maLength || "14")
  const [maType, setMaType] = useState(initialSettings?.maType || "SMA")
  const [timeframe, setTimeframe] = useState(initialSettings?.timeframe || "3h")

  const [showSourceDropdown, setShowSourceDropdown] = useState(false)
  const [showMaTypeDropdown, setShowMaTypeDropdown] = useState(false)

  const sourceDropdownRef = useRef<HTMLDivElement>(null)
  const maTypeDropdownRef = useRef<HTMLDivElement>(null)

  // Keep the form in sync when the caller reopens with new initialSettings
  // (editing an existing chip). Skipping this caused the prior chip's values
  // to stick when switching between two RSI_MA chips in the same statement.
  useEffect(() => {
    if (!initialSettings) return
    setRsiLength(initialSettings.rsiLength || "14")
    setSource(initialSettings.source || "Close")
    setMaLength(initialSettings.maLength || "14")
    setMaType(initialSettings.maType || "SMA")
    setTimeframe(initialSettings.timeframe || "3h")
  }, [initialSettings])

  // Restore last-used settings when the modal is opened fresh (no
  // initialSettings) — never override an explicit caller-provided seed.
  useEffect(() => {
    if (initialSettings) return
    try {
      const saved = localStorage.getItem("rsiMaSettings")
      if (!saved) return
      const parsed = JSON.parse(saved)
      if (parsed.rsiLength !== undefined) setRsiLength(String(parsed.rsiLength))
      if (parsed.source) setSource(parsed.source)
      if (parsed.maLength !== undefined) setMaLength(String(parsed.maLength))
      if (parsed.maType) setMaType(parsed.maType)
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
      if (maTypeDropdownRef.current && !maTypeDropdownRef.current.contains(event.target as Node)) {
        setShowMaTypeDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSave = () => {
    try {
      localStorage.setItem(
        "rsiMaSettings",
        JSON.stringify({ rsiLength, source, maLength, maType, timeframe }),
      )
    } catch {
      // ignored
    }
    onSave({ rsiLength, source, maLength, maType, timeframe })
  }

  const sources = [...SOURCES]
  const maTypes = [...MA_TYPES]

  return (
    <DraggableModal onClose={onClose} className="bg-[#f1f1f1] rounded-lg shadow-lg w-full max-w-md">
      <div>
        <div className="flex justify-between items-center p-6">
          <h2 className="text-2xl font-bold text-black">RSI MA Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div>
            <h3 className="text-xl font-medium text-gray-800 mb-4">RSI Settings</h3>

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

            <div className="border-t border-gray-300 my-6"></div>

            <h3 className="text-xl font-medium text-gray-800 mb-4">MA Settings</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">MA Length</label>
                <input
                  type="text"
                  value={maLength}
                  onChange={(e) => setMaLength(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded text-gray-700"
                />
              </div>
              <div>
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
                          onClick={() => { setMaType(type); setShowMaTypeDropdown(false) }}
                        >
                          {type}
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
