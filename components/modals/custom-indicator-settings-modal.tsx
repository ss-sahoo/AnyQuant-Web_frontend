"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface CustomIndicatorSettingsModalProps {
  onClose: () => void
  onSave: (settings: CustomIndicatorSettings) => void
  componentName: string
  componentParameters?: Record<string, any>
  initialSettings?: Partial<CustomIndicatorSettings>
}

export interface CustomIndicatorSettings {
  name: string
  timeframe: string
  input_params: Record<string, any>
}

const TIMEFRAME_OPTIONS = [
  { value: "1m", label: "1 Minute" },
  { value: "5m", label: "5 Minutes" },
  { value: "15m", label: "15 Minutes" },
  { value: "30m", label: "30 Minutes" },
  { value: "1h", label: "1 Hour" },
  { value: "4h", label: "4 Hours" },
  { value: "1d", label: "1 Day" },
  { value: "1w", label: "1 Week" },
]

export function CustomIndicatorSettingsModal({
  onClose,
  onSave,
  componentName,
  componentParameters = {},
  initialSettings,
}: CustomIndicatorSettingsModalProps) {
  const [timeframe, setTimeframe] = useState(initialSettings?.timeframe || "1h")
  const [params, setParams] = useState<Record<string, any>>(
    initialSettings?.input_params || componentParameters || {}
  )

  // Initialize params from component parameters if not provided in initialSettings
  useEffect(() => {
    if (!initialSettings?.input_params && componentParameters) {
      setParams(componentParameters)
    }
  }, [componentParameters, initialSettings])

  const handleParamChange = (key: string, value: string) => {
    // Try to parse as number if it looks like a number
    const numValue = parseFloat(value)
    setParams(prev => ({
      ...prev,
      [key]: isNaN(numValue) ? value : numValue
    }))
  }

  const handleSave = () => {
    onSave({
      name: componentName,
      timeframe,
      input_params: params,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1A1D24] rounded-lg w-[450px] max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2D42]">
          <div>
            <h2 className="text-lg font-semibold text-white">Custom Indicator Settings</h2>
            <p className="text-sm text-[#85e1fe]">{componentName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Timeframe Selection */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Timeframe</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full px-3 py-2 bg-[#0D0F12] border border-[#2A2D42] rounded-lg text-white focus:outline-none focus:border-[#85e1fe]"
            >
              {TIMEFRAME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Parameters */}
          {Object.keys(params).length > 0 && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Parameters</label>
              <div className="space-y-3">
                {Object.entries(params).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <label className="text-sm text-gray-300 w-1/3 capitalize">
                      {key.replace(/_/g, " ")}
                    </label>
                    <input
                      type={typeof value === "number" ? "number" : "text"}
                      value={value}
                      onChange={(e) => handleParamChange(key, e.target.value)}
                      className="flex-1 px-3 py-2 bg-[#0D0F12] border border-[#2A2D42] rounded-lg text-white focus:outline-none focus:border-[#85e1fe]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(params).length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              This indicator has no configurable parameters.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-[#2A2D42]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-[#85e1fe] text-black rounded-lg hover:bg-[#5AB9D1] transition-colors"
          >
            Add to Strategy
          </button>
        </div>
      </div>
    </div>
  )
}
