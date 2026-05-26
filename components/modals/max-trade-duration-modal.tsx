"use client"

import { useState } from "react"
import { Info, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DraggableModal } from "./draggable-modal"

interface MaxTradeDurationModalProps {
  onClose: () => void
  onSave: (durationOrNull: string | null) => void
  initialDuration?: string
}

const HELP_TEXT =
  "The backend checks this once per bar in the backtest loop, so a trade closes at the next bar boundary after the cap has elapsed since entry — not at the exact second. Use 00:00:00 to disable the limit."

// Parse "HH:MM:SS" or "HH:MM" into [h, m, s]. Malformed input falls back to zeros.
function parseInitial(raw?: string): [number, number, number] {
  if (!raw) return [0, 0, 0]
  const parts = raw.split(":").map((p) => parseInt(p, 10))
  if (parts.some((n) => !Number.isFinite(n) || n < 0)) return [0, 0, 0]
  const [h = 0, m = 0, s = 0] = parts
  return [h, m, s]
}

export function MaxTradeDurationModal({ onClose, onSave, initialDuration }: MaxTradeDurationModalProps) {
  const [hh0, mm0, ss0] = parseInitial(initialDuration)
  const [hh, setHh] = useState<string>(String(hh0))
  const [mm, setMm] = useState<string>(String(mm0))
  const [ss, setSs] = useState<string>(String(ss0))
  const [error, setError] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)

  const clampToInt = (raw: string): number => {
    const n = parseInt(raw, 10)
    return Number.isFinite(n) && n >= 0 ? n : 0
  }

  const handleSave = () => {
    const h = clampToInt(hh)
    const m = clampToInt(mm)
    const s = clampToInt(ss)

    if (h >= 1000) {
      setError("Hours must be less than 1000.")
      return
    }
    if (m >= 60) {
      setError("Minutes must be less than 60.")
      return
    }
    if (s >= 60) {
      setError("Seconds must be less than 60.")
      return
    }

    const assembled = `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    if (!/^\d+:\d+:\d+$/.test(assembled)) {
      setError("Could not assemble a valid HH:MM:SS string.")
      return
    }

    // All-zero means "no limit"; omit the key by passing null.
    if (h === 0 && m === 0 && s === 0) {
      onSave(null)
      return
    }
    onSave(assembled)
  }

  const handleClear = () => {
    setHh("0")
    setMm("0")
    setSs("0")
    setError(null)
    onSave(null)
  }

  return (
    <DraggableModal onClose={onClose} className="sm:max-w-[440px] w-full max-h-[90vh] bg-white p-0 border border-gray-200 shadow-lg rounded-lg overflow-hidden flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-black flex items-center gap-2">
          Max Trade Duration
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            className="text-gray-500 hover:text-gray-800"
            aria-label="Help"
            title={HELP_TEXT}
          >
            <Info className="h-4 w-4" />
          </button>
        </h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 overflow-y-auto flex-1 space-y-4">
        {showHelp && (
          <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded p-3">
            {HELP_TEXT}
          </div>
        )}

        <p className="text-sm text-gray-600">
          Sets the maximum time a trade can stay open. When the cap is reached, the backend
          auto-closes the trade on the next bar boundary.
        </p>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="mtd-hh" className="block text-sm font-medium text-gray-700 mb-1">Hours</Label>
            <Input
              id="mtd-hh"
              type="number"
              min={0}
              max={999}
              value={hh}
              onChange={(e) => { setHh(e.target.value); setError(null) }}
              className="text-black"
            />
          </div>
          <div>
            <Label htmlFor="mtd-mm" className="block text-sm font-medium text-gray-700 mb-1">Minutes</Label>
            <Input
              id="mtd-mm"
              type="number"
              min={0}
              max={59}
              value={mm}
              onChange={(e) => { setMm(e.target.value); setError(null) }}
              className="text-black"
            />
          </div>
          <div>
            <Label htmlFor="mtd-ss" className="block text-sm font-medium text-gray-700 mb-1">Seconds</Label>
            <Input
              id="mtd-ss"
              type="number"
              min={0}
              max={59}
              value={ss}
              onChange={(e) => { setSs(e.target.value); setError(null) }}
              className="text-black"
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}

        <div className="text-xs text-gray-500">
          Leave all fields at 0 (or click Clear) to remove the limit.
        </div>
      </div>

      <div className="flex justify-between gap-2 p-4 border-t border-gray-200">
        <Button variant="outline" onClick={handleClear} className="text-gray-700">
          Clear
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="text-gray-700">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-[#85e1fe] text-black hover:bg-[#5AB9D1]">
            Save
          </Button>
        </div>
      </div>
    </DraggableModal>
  )
}
