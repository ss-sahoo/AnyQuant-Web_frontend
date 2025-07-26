"use client"

import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"

interface RsiSettingsModalProps {
  onClose: () => void
  onSave: (settings: any) => void
  initialSettings?: {
    indicatorType?: string
    rsiLength?: string
    source?: string
    maLength?: string
    maType?: string
    bbStdDev?: string
    timeframe?: string
  }
}

export function RsiSettingsModal({ onClose, onSave, initialSettings }: RsiSettingsModalProps) {
  const [indicatorType, setIndicatorType] = useState(initialSettings?.indicatorType || "rsi")
  const [rsiLength, setRsiLength] = useState(initialSettings?.rsiLength || "14")
  const [source, setSource] = useState(initialSettings?.source || "Close")
  const [maLength, setMaLength] = useState(initialSettings?.maLength || "14")
  const [maType, setMaType] = useState(initialSettings?.maType || "SMA")
  const [bbStdDev, setBbStdDev] = useState(initialSettings?.bbStdDev || "2.0")
  const [timeframe, setTimeframe] = useState(initialSettings?.timeframe || "3h")

  const [showSourceDropdown, setShowSourceDropdown] = useState(false)
  const [showMaTypeDropdown, setShowMaTypeDropdown] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)
  const sourceDropdownRef = useRef<HTMLDivElement>(null)
  const maTypeDropdownRef = useRef<HTMLDivElement>(null)

  // Update form when initialSettings change
  useEffect(() => {
    if (initialSettings) {
      console.log("RSI Modal initialSettings:", initialSettings)
      setIndicatorType(initialSettings.indicatorType || "rsi")
      setRsiLength(initialSettings.rsiLength || "14")
      setSource(initialSettings.source || "Close")
      setMaLength(initialSettings.maLength || "14")
      setMaType(initialSettings.maType || "SMA")
      setBbStdDev(initialSettings.bbStdDev || "2.0")
      setTimeframe(initialSettings.timeframe || "3h")
    }
  }, [initialSettings])

  // Load saved RSI settings from localStorage when modal opens
  useEffect(() => {
    try {
      const savedRsiSettings = localStorage.getItem('rsiSettings');
      console.log('🔍 Current localStorage rsiSettings:', savedRsiSettings);
      if (savedRsiSettings) {
        const parsedSettings = JSON.parse(savedRsiSettings);
        console.log('📖 Loading saved RSI settings on modal open:', parsedSettings);
        
        // Only load saved settings if no initialSettings are provided
        if (!initialSettings) {
          if (parsedSettings.indicatorType) {
            setIndicatorType(parsedSettings.indicatorType);
          }
          if (parsedSettings.rsiLength !== undefined) {
            setRsiLength(parsedSettings.rsiLength.toString());
          }
          if (parsedSettings.source) {
            setSource(parsedSettings.source);
          }
          if (parsedSettings.maLength !== undefined) {
            setMaLength(parsedSettings.maLength.toString());
          }
          if (parsedSettings.maType) {
            setMaType(parsedSettings.maType);
          }
          if (parsedSettings.bbStdDev !== undefined) {
            setBbStdDev(parsedSettings.bbStdDev.toString());
          }
          if (parsedSettings.timeframe) {
            setTimeframe(parsedSettings.timeframe);
          }
        }
      } else {
        console.log('📖 No saved RSI settings found in localStorage');
      }
    } catch (error) {
      console.log('Error loading saved RSI settings:', error);
    }
  }, [initialSettings]);

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
    // Save all RSI settings to localStorage for future use
    const rsiSettings = {
      indicatorType,
      rsiLength: Number(rsiLength), // Always save rsiLength
      source,
      maLength: Number(maLength), // Always save maLength
      maType, // Always save maType
      bbStdDev: Number(bbStdDev), // Always save bbStdDev
      timeframe,
      lastUpdated: Date.now()
    };
    
    // Save to localStorage with a unique key
    localStorage.setItem('rsiSettings', JSON.stringify(rsiSettings));
    console.log('💾 RSI Settings saved to localStorage:', rsiSettings);
    console.log('💾 RSI Length being saved:', rsiLength, 'as number:', Number(rsiLength));
    console.log('💾 MA Length being saved:', maLength, 'as number:', Number(maLength));
    console.log('💾 Indicator type being saved:', indicatorType);
    
    // Only send timeperiod and source for RSI, all fields for RSI MA
    if (indicatorType === "rsi") {
      onSave({
        indicatorType,
        rsiLength: Number(rsiLength),
        source,
        timeframe,
      });
    } else {
      onSave({
        indicatorType,
        rsiLength: Number(rsiLength),
        source,
        maLength: Number(maLength),
        maType,
        bbStdDev: Number(bbStdDev),
        timeframe,
      });
    }
  }

  const sources = ["Close", "Open", "High", "Low", "HL2", "HLC3", "OHLC4"]
  const maTypes = ["SMA", "EMA", "WMA", "VWMA", "TEMA", "DEMA"]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-[#f1f1f1] rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-6">
          <h2 className="text-2xl font-bold text-black">RSI Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="mb-6">
            <label className="block text-lg font-medium text-black mb-2">Indicator Type</label>
            <div className="grid grid-cols-2 gap-0 border border-gray-300 rounded-md overflow-hidden">
              <button
                className={`py-3 px-4 text-center ${
                  indicatorType === "rsi" ? "bg-gray-400 text-white" : "bg-white text-gray-700"
                }`}
                onClick={() => setIndicatorType("rsi")}
              >
                RSI
              </button>
              <button
                className={`py-3 px-4 text-center ${
                  indicatorType === "rsi-ma" ? "bg-gray-400 text-white" : "bg-white text-gray-700"
                }`}
                onClick={() => setIndicatorType("rsi-ma")}
              >
                RSI MA
              </button>
            </div>
          </div>

          <div className="border-t border-gray-300 my-6"></div>

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
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">BB Std Dev</label>
              <input
                type="text"
                value={bbStdDev}
                onChange={(e) => setBbStdDev(e.target.value)}
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
