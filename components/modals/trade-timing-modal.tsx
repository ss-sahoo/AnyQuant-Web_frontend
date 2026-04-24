"use client"

import { useEffect, useRef, useState } from "react"
import { Info, X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type TradeAt = "bar close" | "tick"

export interface TradeTimingSettings {
  trade_at: TradeAt
  exit_timeframe?: string
}

interface TradeTimingModalProps {
  onClose: () => void
  onSave: (settings: TradeTimingSettings) => void
  initialSettings?: TradeTimingSettings
}

const HELP_TEXT =
  "Tick-level mode uses a finer-timeframe dataset (e.g. 6-minute data alongside 36-minute strategy data) to determine the exact sub-bar timestamp when a trade exits. Useful when you need precise entry/exit timing for slippage analysis."

export function TradeTimingModal({ onClose, onSave, initialSettings }: TradeTimingModalProps) {
  const [tradeAt, setTradeAt] = useState<TradeAt>(initialSettings?.trade_at ?? "bar close")
  const [exitTimeframe, setExitTimeframe] = useState<string>(initialSettings?.exit_timeframe ?? "")
  const [error, setError] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [onClose])

  const handleSave = () => {
    if (tradeAt === "tick") {
      const tf = exitTimeframe.trim()
      if (!tf) {
        setError("Exit timeframe is required when Trade execution timing is set to Tick level.")
        return
      }
      onSave({ trade_at: "tick", exit_timeframe: tf })
    } else {
      onSave({ trade_at: "bar close" })
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px] max-h-[90vh] bg-white p-0 border border-gray-200 shadow-lg rounded-lg overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <DialogTitle className="text-lg font-medium text-black flex items-center gap-2">
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
          </DialogTitle>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={modalRef} className="p-4 overflow-y-auto flex-1 space-y-4">
          {showHelp && (
            <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded p-3">
              {HELP_TEXT}
            </div>
          )}

          <div>
            <Label htmlFor="trade_at" className="block text-sm font-medium text-gray-700 mb-2">
              Trade execution timing
            </Label>
            <Select
              value={tradeAt}
              onValueChange={(v) => {
                setTradeAt(v as TradeAt)
                setError(null)
                if (v === "bar close") setExitTimeframe("")
              }}
            >
              <SelectTrigger id="trade_at" className="w-full border border-gray-300 text-black bg-white">
                <SelectValue placeholder="Select timing" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                <SelectItem value="bar close">Bar close (default)</SelectItem>
                <SelectItem value="tick">Tick level</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Bar close exits trades at the end of the strategy bar. Tick level uses a finer-timeframe dataset to record
              sub-bar exit timestamps.
            </p>
          </div>

          {tradeAt === "tick" && (
            <div>
              <Label htmlFor="exit_timeframe" className="block text-sm font-medium text-gray-700 mb-2">
                Exit timeframe <span className="text-red-500">*</span>
              </Label>
              <Input
                id="exit_timeframe"
                type="text"
                placeholder="e.g. 6min, 1min, 30s"
                value={exitTimeframe}
                onChange={(e) => {
                  setExitTimeframe(e.target.value)
                  if (error) setError(null)
                }}
                className={`w-full border text-black bg-white ${
                  error ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                }`}
              />
              {error ? (
                <p className="text-xs text-red-500 mt-1">{error}</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Finer timeframe used to resolve exact sub-bar exit timing (must be finer than your strategy timeframe).
                </p>
              )}
            </div>
          )}
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
      </DialogContent>
    </Dialog>
  )
}
