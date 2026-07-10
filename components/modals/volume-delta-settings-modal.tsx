"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DraggableModal } from "./draggable-modal"
import { CustomTimeframeModal } from "./custom-timeframe-modal"

interface VolumeDeltaSettingsModalProps {
  onClose: () => void
  onSave: (settings: { lowerTimeframe: string }) => void
  initialSettings?: { lowerTimeframe?: string }
}

// Lower timeframes accepted by the engine resampler (must be strictly lower
// than the chart timeframe).
const TIMEFRAME_OPTIONS = [
  { value: "1min", label: "1 min" },
  { value: "5min", label: "5 min" },
  { value: "15min", label: "15 min" },
  { value: "30min", label: "30 min" },
  { value: "45min", label: "45 min" },
  { value: "1h", label: "1 hour" },
  { value: "2h", label: "2 hours" },
  { value: "3h", label: "3 hours" },
  { value: "4h", label: "4 hours" },
]

const isPresetTimeframe = (tf?: string) => !!tf && TIMEFRAME_OPTIONS.some((o) => o.value === tf)

export function VolumeDeltaSettingsModal({ onClose, onSave, initialSettings }: VolumeDeltaSettingsModalProps) {
  const [lowerTimeframe, setLowerTimeframe] = useState(initialSettings?.lowerTimeframe || "1min")
  const [showCustomTimeframeModal, setShowCustomTimeframeModal] = useState(false)

  // Restore the user's last choice across opens, but never override an
  // explicit `initialSettings` (editing flow).
  useEffect(() => {
    if (initialSettings) return
    try {
      const saved = localStorage.getItem("volumeDeltaSettings")
      if (!saved) return
      const parsed = JSON.parse(saved)
      if (parsed.lowerTimeframe) setLowerTimeframe(parsed.lowerTimeframe)
    } catch {
      // ignored
    }
  }, [initialSettings])

  const handleSave = () => {
    const settings = { lowerTimeframe }
    try {
      localStorage.setItem("volumeDeltaSettings", JSON.stringify(settings))
    } catch {
      // ignored
    }
    onSave(settings)
  }

  return (
    <DraggableModal
      onClose={onClose}
      className="sm:max-w-[425px] w-full max-h-[90vh] bg-white p-0 border border-gray-200 shadow-lg rounded-lg overflow-hidden flex flex-col"
    >
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-black">Volume Delta Settings</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 overflow-y-auto flex-1">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">Define Settings</h3>

          <div>
            <Label htmlFor="vd-lower-timeframe" className="block text-sm font-medium text-gray-700 mb-2">
              Lower Timeframe
            </Label>
            <Select
              value={lowerTimeframe}
              onValueChange={(v) => {
                if (v === "add-custom") setShowCustomTimeframeModal(true)
                else setLowerTimeframe(v)
              }}
            >
              <SelectTrigger id="vd-lower-timeframe" className="w-full border border-gray-300 text-black bg-white">
                <SelectValue placeholder="Select lower timeframe" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                {TIMEFRAME_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
                {!isPresetTimeframe(lowerTimeframe) && (
                  <SelectItem value={lowerTimeframe}>{lowerTimeframe}</SelectItem>
                )}
                <SelectItem value="add-custom">Add Custom</SelectItem>
              </SelectContent>
            </Select>
            {showCustomTimeframeModal && (
              <CustomTimeframeModal
                onClose={() => setShowCustomTimeframeModal(false)}
                onSave={(tf) => setLowerTimeframe(tf)}
              />
            )}
            <p className="text-xs text-gray-500 mt-1">
              The timeframe used to calculate the signed volume delta — must be lower than the chart timeframe.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
        <Button
          variant="outline"
          onClick={onClose}
          className="rounded-full px-6 text-black border-gray-300 hover:bg-gray-100 hover:text-black"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          className="rounded-full px-6 bg-[#85e1fe] text-black hover:bg-[#6bc8e3] border-none"
        >
          Save
        </Button>
      </div>
    </DraggableModal>
  )
}
