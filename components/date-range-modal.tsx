"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Calendar } from "lucide-react"

interface DateRangeModalProps {
  isOpen: boolean
  onClose: () => void
  currentDateRange: string
  onSave: (dateRange: string) => void
}

export function DateRangeModal({ isOpen, onClose, currentDateRange, onSave }: DateRangeModalProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  React.useEffect(() => {
    if (isOpen && currentDateRange) {
      // Parse current date range (format: YYYY.MM.DD - YYYY.MM.DD)
      const parts = currentDateRange.split(" - ")
      if (parts.length === 2) {
        setStartDate(parts[0].replace(/\./g, "-"))
        setEndDate(parts[1].replace(/\./g, "-"))
      }
    }
  }, [isOpen, currentDateRange])

  if (!isOpen) return null

  const handleSave = () => {
    if (startDate && endDate) {
      const formattedRange = `${startDate.replace(/-/g, ".")} - ${endDate.replace(/-/g, ".")}`
      onSave(formattedRange)
      onClose()
    }
  }

  const handlePreset = (preset: string) => {
    const today = new Date()
    let start = new Date()
    
    switch (preset) {
      case "1month":
        start.setMonth(today.getMonth() - 1)
        break
      case "3months":
        start.setMonth(today.getMonth() - 3)
        break
      case "6months":
        start.setMonth(today.getMonth() - 6)
        break
      case "1year":
        start.setFullYear(today.getFullYear() - 1)
        break
      case "ytd":
        start = new Date(today.getFullYear(), 0, 1)
        break
      case "2024_feb_aug":
        start = new Date(2024, 1, 1) // Feb 1, 2024
        const end2024Aug = new Date(2024, 7, 1) // Aug 1, 2024
        setStartDate(start.toISOString().split('T')[0])
        setEndDate(end2024Aug.toISOString().split('T')[0])
        return
    }
    
    setStartDate(start.toISOString().split('T')[0])
    setEndDate(today.toISOString().split('T')[0])
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Select Date Range</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Preset Ranges */}
          <div>
            <label className="block text-sm text-gray-400 mb-3">Quick Select</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handlePreset("1month")}
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                Last Month
              </Button>
              <Button
                onClick={() => handlePreset("3months")}
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                Last 3 Months
              </Button>
              <Button
                onClick={() => handlePreset("6months")}
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                Last 6 Months
              </Button>
              <Button
                onClick={() => handlePreset("1year")}
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                Last Year
              </Button>
              <Button
                onClick={() => handlePreset("ytd")}
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                Year to Date
              </Button>
              <Button
                onClick={() => handlePreset("2024_feb_aug")}
                variant="outline"
                className="border-blue-600 text-blue-400 hover:bg-blue-900/20"
              >
                Feb - Aug 2024
              </Button>
            </div>
          </div>

          <div className="border-t border-gray-700"></div>

          {/* Custom Date Selection */}
          <div>
            <label className="block text-sm text-gray-400 mb-3">Custom Range</label>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#141721] border border-[#2b2e38] rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#141721] border border-[#2b2e38] rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-white"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          {startDate && endDate && (
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Preview</p>
              <p className="text-white font-mono">
                {startDate.replace(/-/g, ".")} - {endDate.replace(/-/g, ".")}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-700">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-gray-600 text-white hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!startDate || !endDate}
            className="bg-[#85e1fe] hover:bg-[#6bcae2] text-black"
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  )
}

