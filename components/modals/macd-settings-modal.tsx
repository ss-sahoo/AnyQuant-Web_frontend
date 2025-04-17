"use client"

import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"

interface MacdSettingsModalProps {
  onClose: () => void
  onSave: (settings: any) => void
}

export function MacdSettingsModal({ onClose, onSave }: MacdSettingsModalProps) {
  const [indicatorType, setIndicatorType] = useState("histogram")
  const [fastLength, setFastLength] = useState("12")
  const [slowLength, setSlowLength] = useState("26")
  const [source, setSource] = useState("close")
  const [signalSmoothing, setSignalSmoothing] = useState("9")
  const [oscillatorMaType, setOscillatorMaType] = useState("EMA")
  const [signalLineMaType, setSignalLineMaType] = useState("EMA")

  const [showSourceDropdown, setShowSourceDropdown] = useState(false)
  const [showOscillatorMaTypeDropdown, setShowOscillatorMaTypeDropdown] = useState(false)
  const [showSignalLineMaTypeDropdown, setShowSignalLineMaTypeDropdown] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)
  const sourceDropdownRef = useRef<HTMLDivElement>(null)
  const oscillatorMaTypeDropdownRef = useRef<HTMLDivElement>(null)
  const signalLineMaTypeDropdownRef = useRef<HTMLDivElement>(null)

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
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(event.target as Node)) {
        setShowSourceDropdown(false)
      }
      if (oscillatorMaTypeDropdownRef.current && !oscillatorMaTypeDropdownRef.current.contains(event.target as Node)) {
        setShowOscillatorMaTypeDropdown(false)
      }
      if (signalLineMaTypeDropdownRef.current && !signalLineMaTypeDropdownRef.current.contains(event.target as Node)) {
        setShowSignalLineMaTypeDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSave = () => {
    onSave({
      indicatorType,
      fastLength,
      slowLength,
      source,
      signalSmoothing,
      oscillatorMaType,
      signalLineMaType,
    })
  }

  const sources = ["close", "open", "high", "low", "hl2", "hlc3", "ohlc4"]
  const maTypes = ["SMA", "EMA", "WMA", "VWMA", "TEMA", "DEMA"]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-[#f1f1f1] rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-6">
          <h2 className="text-2xl font-bold text-black">MACD Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-800 mb-2">Indicator Type</label>
            <div className="grid grid-cols-3 gap-0 border border-gray-300 rounded-md overflow-hidden">
              <button
                className={`py-3 px-4 text-center ${
                  indicatorType === "histogram" ? "bg-gray-400 text-white" : "bg-white text-gray-700"
                }`}
                onClick={() => setIndicatorType("histogram")}
              >
                Histogram
              </button>
              <button
                className={`py-3 px-4 text-center ${
                  indicatorType === "macd" ? "bg-gray-400 text-white" : "bg-white text-gray-700"
                }`}
                onClick={() => setIndicatorType("macd")}
              >
                MACD
              </button>
              <button
                className={`py-3 px-4 text-center ${
                  indicatorType === "signal" ? "bg-gray-400 text-white" : "bg-white text-gray-700"
                }`}
                onClick={() => setIndicatorType("signal")}
              >
                Signal
              </button>
            </div>
          </div>

          <div className="border-t border-gray-300 my-6"></div>

          <div>
            <h3 className="text-xl font-medium text-gray-800 mb-4">Define Settings</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Fast Length</label>
                <input
                  type="text"
                  value={fastLength}
                  onChange={(e) => setFastLength(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded text-gray-700"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Slow Length</label>
                <input
                  type="text"
                  value={slowLength}
                  onChange={(e) => setSlowLength(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded text-gray-700"
                />
              </div>
            </div>

            <div className="mb-4">
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
                        onClick={() => {
                          setSource(src)
                          setShowSourceDropdown(false)
                        }}
                      >
                        {src}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-base font-medium text-gray-700 mb-2">Signal Smoothing</label>
              <input
                type="text"
                value={signalSmoothing}
                onChange={(e) => setSignalSmoothing(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded text-gray-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Oscillator MA Type</label>
                <div className="relative" ref={oscillatorMaTypeDropdownRef}>
                  <button
                    className="w-full p-3 border border-gray-300 rounded text-gray-700 bg-white flex justify-between items-center"
                    onClick={() => setShowOscillatorMaTypeDropdown(!showOscillatorMaTypeDropdown)}
                  >
                    {oscillatorMaType}
                    <span className="ml-2">▼</span>
                  </button>

                  {showOscillatorMaTypeDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
                      {maTypes.map((type) => (
                        <button
                          key={type}
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            setOscillatorMaType(type)
                            setShowOscillatorMaTypeDropdown(false)
                          }}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Signal Line MA Type</label>
                <div className="relative" ref={signalLineMaTypeDropdownRef}>
                  <button
                    className="w-full p-3 border border-gray-300 rounded text-gray-700 bg-white flex justify-between items-center"
                    onClick={() => setShowSignalLineMaTypeDropdown(!showSignalLineMaTypeDropdown)}
                  >
                    {signalLineMaType}
                    <span className="ml-2">▼</span>
                  </button>

                  {showSignalLineMaTypeDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
                      {maTypes.map((type) => (
                        <button
                          key={type}
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            setSignalLineMaType(type)
                            setShowSignalLineMaTypeDropdown(false)
                          }}
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
    </div>
  )
}
