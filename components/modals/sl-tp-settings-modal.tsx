"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface SLTPSettingsModalProps {
  type: "SL" | "TP"
  onClose: () => void
  onSave: (settings: SLTPSettings) => void
}

export interface SLTPSettings {
  type: "SL" | "TP"
  valueType: "pips" | "percentage" | "price"
  direction: "+" | "-" | "*"
  value: string
  useAdvanced: boolean
  inp1?: string
  inp2?: string
}

export function SLTPSettingsModal({ type, onClose, onSave }: SLTPSettingsModalProps) {
  const [settings, setSettings] = useState<SLTPSettings>({
    type,
    valueType: "pips",
    direction: type === "SL" ? "-" : "+",
    value: type === "SL" ? "900" : "1500",
    useAdvanced: false,
  })

  const handleSave = () => {
    onSave(settings)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1E2132] rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium">{type === "SL" ? "Stop Loss" : "Take Profit"} Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Format</label>
            <div className="flex gap-2">
              <button
                className={`px-3 py-1 rounded-md ${
                  !settings.useAdvanced ? "bg-blue-600 text-white" : "bg-[#2A2D42] text-gray-300"
                }`}
                onClick={() => setSettings({ ...settings, useAdvanced: false })}
              >
                Simple
              </button>
              <button
                className={`px-3 py-1 rounded-md ${
                  settings.useAdvanced ? "bg-blue-600 text-white" : "bg-[#2A2D42] text-gray-300"
                }`}
                onClick={() => setSettings({ ...settings, useAdvanced: true })}
              >
                Advanced
              </button>
            </div>
          </div>

          {!settings.useAdvanced ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Value Type</label>
                <div className="flex gap-2">
                  <button
                    className={`px-3 py-1 rounded-md ${
                      settings.valueType === "pips" ? "bg-blue-600 text-white" : "bg-[#2A2D42] text-gray-300"
                    }`}
                    onClick={() => setSettings({ ...settings, valueType: "pips" })}
                  >
                    Pips
                  </button>
                  <button
                    className={`px-3 py-1 rounded-md ${
                      settings.valueType === "percentage" ? "bg-blue-600 text-white" : "bg-[#2A2D42] text-gray-300"
                    }`}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        valueType: "percentage",
                        direction: "*",
                      })
                    }
                  >
                    Percentage
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Direction</label>
                <div className="flex gap-2">
                  {settings.valueType === "pips" ? (
                    <>
                      <button
                        className={`px-3 py-1 rounded-md ${
                          settings.direction === "+" ? "bg-blue-600 text-white" : "bg-[#2A2D42] text-gray-300"
                        }`}
                        onClick={() => setSettings({ ...settings, direction: "+" })}
                      >
                        +
                      </button>
                      <button
                        className={`px-3 py-1 rounded-md ${
                          settings.direction === "-" ? "bg-blue-600 text-white" : "bg-[#2A2D42] text-gray-300"
                        }`}
                        onClick={() => setSettings({ ...settings, direction: "-" })}
                      >
                        -
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className={`px-3 py-1 rounded-md ${
                          settings.direction === "*" ? "bg-blue-600 text-white" : "bg-[#2A2D42] text-gray-300"
                        }`}
                        onClick={() => setSettings({ ...settings, direction: "*" })}
                      >
                        ×
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Value</label>
                <input
                  type="text"
                  value={settings.value}
                  onChange={(e) => setSettings({ ...settings, value: e.target.value })}
                  className="w-full bg-[#2A2D42] px-3 py-2 rounded-md focus:outline-none"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Input 1 (Target)</label>
                <input
                  type="text"
                  value={settings.inp1 || settings.type}
                  onChange={(e) => setSettings({ ...settings, inp1: e.target.value })}
                  className="w-full bg-[#2A2D42] px-3 py-2 rounded-md focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Input 2 (Reference)</label>
                <input
                  type="text"
                  value={settings.inp2 || "Entry_Price"}
                  onChange={(e) => setSettings({ ...settings, inp2: e.target.value })}
                  className="w-full bg-[#2A2D42] px-3 py-2 rounded-md focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Operation</label>
                <div className="flex gap-2">
                  <button
                    className={`px-3 py-1 rounded-md ${
                      settings.direction === "+" ? "bg-blue-600 text-white" : "bg-[#2A2D42] text-gray-300"
                    }`}
                    onClick={() => setSettings({ ...settings, direction: "+" })}
                  >
                    +
                  </button>
                  <button
                    className={`px-3 py-1 rounded-md ${
                      settings.direction === "-" ? "bg-blue-600 text-white" : "bg-[#2A2D42] text-gray-300"
                    }`}
                    onClick={() => setSettings({ ...settings, direction: "-" })}
                  >
                    -
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Value</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={settings.value}
                    onChange={(e) => setSettings({ ...settings, value: e.target.value })}
                    className="w-full bg-[#2A2D42] px-3 py-2 rounded-md focus:outline-none"
                  />
                  <span className="ml-2">pips</span>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={onClose} className="px-4 py-2 bg-[#2A2D42] rounded-md hover:bg-gray-700">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
