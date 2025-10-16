"use client"

import React, { useEffect, useState } from "react"

interface TradingSessionModalProps {
  onClose: () => void
  onSave: (config: {
    timezone: string
    startTime: string
    endTime: string
    selectedDays: string[]
  }) => void
  initial?: {
    timezone?: string
    startTime?: string
    endTime?: string
    selectedDays?: string[]
  }
}

const DAY_ORDER: Array<{ code: "M" | "t" | "W" | "T" | "F" | "S" | "U"; label: string }> = [
  { code: "M", label: "Mon" }, // Monday
  { code: "t", label: "Tue" }, // Tuesday (lowercase t)
  { code: "W", label: "Wed" }, // Wednesday
  { code: "T", label: "Thu" }, // Thursday
  { code: "F", label: "Fri" }, // Friday
  { code: "S", label: "Sat" }, // Saturday
  { code: "U", label: "Sun" }, // Sunday
]

// Minimal timezone options; values are canonical TZ IDs, labels are user friendly
const TIMEZONES: Array<{ value: string; label: string }> = [
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "America/New_York", label: "EST (Eastern Standard Time)" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata" },
]

export function TradingSessionModal({ onClose, onSave, initial }: TradingSessionModalProps) {
  const [timezone, setTimezone] = useState<string>(initial?.timezone || "UTC")
  const [startTime, setStartTime] = useState<string>(initial?.startTime || "09:00")
  const [endTime, setEndTime] = useState<string>(initial?.endTime || "17:00")
  const [selectedDays, setSelectedDays] = useState<string[]>(initial?.selectedDays || ["M", "t", "W", "T", "F"]) // default weekdays

  // Keep local state in sync if initial changes
  useEffect(() => {
    if (initial) {
      if (initial.timezone) setTimezone(initial.timezone)
      if (initial.startTime) setStartTime(initial.startTime)
      if (initial.endTime) setEndTime(initial.endTime)
      if (initial.selectedDays) setSelectedDays(initial.selectedDays)
    }
  }, [initial])

  const toggleDay = (code: string) => {
    setSelectedDays((prev) =>
      prev.includes(code) ? prev.filter((d) => d !== code) : [...prev, code]
    )
  }

  const handleSave = () => {
    onSave({ timezone, startTime, endTime, selectedDays })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[380px] max-w-[90vw] text-black">
        <h2 className="text-lg font-semibold mb-4">Configure Session Window</h2>

        {/* Days row */}
        <div className="flex gap-2 mb-4">
          {DAY_ORDER.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => toggleDay(code)}
              className={`px-2 py-1 rounded-md text-xs border ${selectedDays.includes(code) ? "bg-[#85e1fe] text-black border-[#85e1fe]" : "bg-white text-black border-gray-300"}`}
              title={`${label} (${code})`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs mb-1">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-2 py-2"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-2 py-2"
            />
          </div>
        </div>

        {/* Timezone */}
        <div className="mb-4">
          <label className="block text-xs mb-1">Timezone</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-2"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-black">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-[#85e1fe] text-black rounded-md hover:bg-[#5AB9D1]">
            Ok
          </button>
        </div>
      </div>
    </div>
  )
} 