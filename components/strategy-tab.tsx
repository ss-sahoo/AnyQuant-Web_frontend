"use client"

import type React from "react"
import { useState } from "react"

export interface SlotAssignment {
  timeframe: string
  filename?: string
  detectedMinutes?: number
  // true = cadence matches slot, false = mismatch, undefined = not measured.
  cadenceOk?: boolean
}

interface StrategyTabProps {
  requiredTimeframes: string[]
  slotAssignments: SlotAssignment[]
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onSlotUpload: (timeframe: string) => void
  onSlotDrop: (e: React.DragEvent<HTMLDivElement>, timeframe: string) => void
  onClearSlot: (timeframe: string) => void
}

const minutesToLabel = (m?: number) => {
  if (!m || m <= 0) return ""
  if (m >= 1440) return `${Math.round(m / 1440)}d`
  if (m >= 60) return `${Math.round(m / 60)}h`
  return `${m}min`
}

// One upload zone per required timeframe. Each file is bound to the slot it is
// dropped into — the app submits exactly that file for that timeframe, so the
// upload order no longer matters. Cadence measured from the file cross-checks
// the slot and warns on a mismatch; it never reassigns the file.
export function StrategyTab({
  requiredTimeframes,
  slotAssignments,
  fileInputRef,
  handleFileChange,
  onSlotUpload,
  onSlotDrop,
  onClearSlot,
}: StrategyTabProps) {
  const [dragSlot, setDragSlot] = useState<string | null>(null)
  const filledCount = slotAssignments.filter((s) => s.filename).length

  return (
    <div className="p-4">
      <div className="p-4 bg-black">
        {/* Shared hidden picker; the active slot is set by onSlotUpload. */}
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".py,.csv" className="hidden" />

        {requiredTimeframes.length === 0 ? (
          <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 p-4 rounded-md">
            No timeframes required. Please create or select a strategy first.
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-medium">Upload data (one file per timeframe)</h3>
              <span className="text-sm text-gray-400">
                {filledCount}/{slotAssignments.length} files
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Drop the correct CSV into each slot. The file you place in a slot is submitted for that exact timeframe.
            </p>

            <div className="space-y-3">
              {slotAssignments.map((slot) => {
                const isDragging = dragSlot === slot.timeframe
                const filled = !!slot.filename
                const mismatch = slot.cadenceOk === false
                const verified = slot.cadenceOk === true

                let borderClass = "border-gray-700 bg-[#1E2132]"
                if (isDragging) borderClass = "border-[#85e1fe] bg-[#85e1fe]/10"
                else if (mismatch) borderClass = "border-yellow-500/50 bg-yellow-500/10"
                else if (filled) borderClass = "border-green-500/40 bg-green-500/10"

                return (
                  <div
                    key={slot.timeframe}
                    className={`border-2 rounded-lg p-4 transition-colors ${borderClass}`}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragSlot(slot.timeframe)
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault()
                      setDragSlot((s) => (s === slot.timeframe ? null : s))
                    }}
                    onDrop={(e) => {
                      setDragSlot(null)
                      onSlotDrop(e, slot.timeframe)
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center min-w-0">
                        <span className="text-xs font-semibold bg-[#85e1fe] text-black rounded-full px-2 py-1 mr-3 shrink-0">
                          {slot.timeframe}
                        </span>
                        {filled ? (
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm truncate">{slot.filename}</span>
                            {mismatch ? (
                              <span className="text-xs text-yellow-400">
                                Looks like {minutesToLabel(slot.detectedMinutes)} data. Submitting as {slot.timeframe}
                              </span>
                            ) : verified ? (
                              <span className="text-xs text-green-400">Verified {slot.timeframe} data</span>
                            ) : (
                              <span className="text-xs text-gray-400">Unable to determine the timeframe of file. Please verify it yourself.</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No file yet</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onSlotUpload(slot.timeframe)}
                          className="text-xs bg-[#1E2132] border border-gray-600 hover:border-[#85e1fe] text-white rounded-md px-3 py-1.5"
                        >
                          {filled ? "Replace" : "Upload"}
                        </button>
                        {filled && (
                          <button
                            onClick={() => onClearSlot(slot.timeframe)}
                            className="text-red-400 hover:text-red-300 p-1"
                            aria-label={`Remove file for ${slot.timeframe}`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {filledCount === slotAssignments.length && slotAssignments.length > 0 && (
              <div className="mt-4 bg-green-500/20 border border-green-500/50 text-green-200 p-3 rounded-md text-sm">
                All required timeframe files are in place.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
