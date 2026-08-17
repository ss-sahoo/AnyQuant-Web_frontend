"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DraggableModal } from "./draggable-modal"
import { CustomTimeframeModal } from "./custom-timeframe-modal"

interface VolumeDeltaSettingsModalProps {
  onClose: () => void
  onSave: (settings: { timeframe: string }) => void
  initialSettings?: { timeframe?: string }
}

// The indicator's timeframe. `lower_timeframe` is bound to the same value by
// the builder, so there is a single control here.
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
  { value: "6h", label: "6 hours" },
  { value: "8h", label: "8 hours" },
  { value: "12h", label: "12 hours" },
  { value: "1d", label: "1 day" },
  { value: "3d", label: "3 days" },
  { value: "1w", label: "1 week" },
  { value: "1M", label: "1 month" },
]

const isPresetTimeframe = (tf?: string) => !!tf && TIMEFRAME_OPTIONS.some((o) => o.value === tf)

export function VolumeDeltaSettingsModal({ onClose, onSave, initialSettings }: VolumeDeltaSettingsModalProps) {
  // Seeded from the operand's current timeframe — the builder always passes it,
  // for both the create and the edit flow.
  const [timeframe, setTimeframe] = useState(initialSettings?.timeframe || "3h")
  const [showCustomTimeframeModal, setShowCustomTimeframeModal] = useState(false)

  const handleSave = () => {
    onSave({ timeframe })
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
            <Label htmlFor="vd-timeframe" className="block text-sm font-medium text-gray-700 mb-2">
              Timeframe
            </Label>
            <Select
              value={timeframe}
              onValueChange={(v) => {
                if (v === "add-custom") setShowCustomTimeframeModal(true)
                else setTimeframe(v)
              }}
            >
              <SelectTrigger id="vd-timeframe" className="w-full border border-gray-300 text-black bg-white">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                {TIMEFRAME_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
                {!isPresetTimeframe(timeframe) && <SelectItem value={timeframe}>{timeframe}</SelectItem>}
                <SelectItem value="add-custom">Add Custom</SelectItem>
              </SelectContent>
            </Select>
            {showCustomTimeframeModal && (
              <CustomTimeframeModal
                onClose={() => setShowCustomTimeframeModal(false)}
                onSave={(tf) => setTimeframe(tf)}
              />
            )}
            <p className="text-xs text-gray-500 mt-1">
              The signed volume delta is calculated on this timeframe — the indicator's lower timeframe is kept
              identical to it.
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
