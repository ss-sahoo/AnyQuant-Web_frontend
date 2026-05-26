"use client"

import { useState } from "react"
import { Info, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DraggableModal } from "./draggable-modal"

export type TradeAt = "bar close" | "tick"

export interface TradeTimingSettings {
  entry_at: TradeAt
  exit_at: TradeAt
  // Required iff entry_at === "tick" or exit_at === "tick". Finer timeframe
  // (e.g. "6min", "1min", "30s") used to resolve sub-bar timing.
  execution_timeframe?: string
}

interface TradeTimingModalProps {
  onClose: () => void
  onSave: (settings: TradeTimingSettings) => void
  initialSettings?: TradeTimingSettings
}

const HELP_TEXT =
  "Tick-level entries/exits use a finer-timeframe dataset (e.g. 6-minute data alongside 36-minute strategy data) to determine the exact sub-bar timestamp when a trade opens or closes. The same finer timeframe is reused for both entry and exit."

const HINT_TICK_ENTRY =
  "Tick-level entries always pair with tick-level exits — exit was set accordingly."

export function TradeTimingModal({ onClose, onSave, initialSettings }: TradeTimingModalProps) {
  const [entryAt, setEntryAt] = useState<TradeAt>(initialSettings?.entry_at ?? "bar close")
  const [exitAt, setExitAt] = useState<TradeAt>(initialSettings?.exit_at ?? "bar close")
  const [executionTimeframe, setExecutionTimeframe] = useState<string>(initialSettings?.execution_timeframe ?? "")
  const [error, setError] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [coerceHint, setCoerceHint] = useState<string | null>(null)

  const needsTimeframe = entryAt === "tick" || exitAt === "tick"

  // Tick entry has no coherent meaning paired with bar-close exit — coerce.
  const handleEntryChange = (v: TradeAt) => {
    setEntryAt(v)
    setError(null)
    if (v === "tick" && exitAt !== "tick") {
      setExitAt("tick")
      setCoerceHint(HINT_TICK_ENTRY)
    } else {
      setCoerceHint(null)
    }
  }

  const handleExitChange = (v: TradeAt) => {
    setExitAt(v)
    setError(null)
    setCoerceHint(null)
    if (v === "bar close" && entryAt === "tick") {
      // Symmetrical coercion: dropping exit to bar close also drops entry.
      setEntryAt("bar close")
    }
    if (v === "bar close" && entryAt === "bar close") {
      setExecutionTimeframe("")
    }
  }

  const handleSave = () => {
    if (needsTimeframe) {
      const tf = executionTimeframe.trim()
      if (!tf) {
        setError("Execution timeframe is required when entry or exit runs on tick.")
        return
      }
      onSave({ entry_at: entryAt, exit_at: exitAt, execution_timeframe: tf })
    } else {
      onSave({ entry_at: entryAt, exit_at: exitAt })
    }
  }

  return (
    <DraggableModal onClose={onClose} className="sm:max-w-[520px] w-full max-h-[90vh] bg-white p-0 border border-gray-200 shadow-lg rounded-lg overflow-hidden flex flex-col">
      <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-black flex items-center gap-2">
          Trade Execution Timing
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

      <div className="px-5 py-5 overflow-y-auto flex-1 space-y-5">
        {showHelp && (
          <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-md p-3 leading-relaxed">
            {HELP_TEXT}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="entry_at" className="block text-sm font-medium text-gray-800 mb-1.5">
              Entry timing
            </Label>
            <Select value={entryAt} onValueChange={(v) => handleEntryChange(v as TradeAt)}>
              <SelectTrigger
                id="entry_at"
                className="w-full h-10 border border-gray-300 text-black bg-white rounded-md focus:ring-2 focus:ring-[#85e1fe] focus:ring-offset-0"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                <SelectItem value="bar close">Bar close</SelectItem>
                <SelectItem value="tick">Tick</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">When the engine opens a position.</p>
          </div>

          <div>
            <Label htmlFor="exit_at" className="block text-sm font-medium text-gray-800 mb-1.5">
              Exit timing
            </Label>
            <Select value={exitAt} onValueChange={(v) => handleExitChange(v as TradeAt)}>
              <SelectTrigger
                id="exit_at"
                className="w-full h-10 border border-gray-300 text-black bg-white rounded-md focus:ring-2 focus:ring-[#85e1fe] focus:ring-offset-0"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                <SelectItem value="bar close" disabled={entryAt === "tick"}>
                  Bar close
                </SelectItem>
                <SelectItem value="tick">Tick</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">When the engine closes a position (SL/TP/signal exit).</p>
          </div>
        </div>

        {coerceHint && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            {coerceHint}
          </div>
        )}

        <div className="border-t border-gray-100 pt-4">
          <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-700">
            <span className="font-medium text-gray-900">Resulting mode:</span>{" "}
            Entry on {entryAt} · Exit on {exitAt}
          </div>
        </div>

        {needsTimeframe && (
          <div>
            <Label htmlFor="execution_timeframe" className="block text-sm font-medium text-gray-800 mb-1.5">
              Execution timeframe <span className="text-red-500">*</span>
            </Label>
            <Input
              id="execution_timeframe"
              type="text"
              placeholder="e.g. 6min, 1min, 30s"
              value={executionTimeframe}
              onChange={(e) => {
                setExecutionTimeframe(e.target.value)
                if (error) setError(null)
              }}
              className={`w-full h-10 border text-black bg-white rounded-md ${
                error ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-2 focus:ring-[#85e1fe]"
              }`}
            />
            {error ? (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Finer timeframe used to resolve sub-bar timing — must be strictly finer than your strategy timeframe.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 bg-gray-50">
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
