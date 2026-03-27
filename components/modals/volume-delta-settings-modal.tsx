"use client"

import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface VolumeDeltaSettingsModalProps {
  onClose: () => void
  onSave: (settings: {
    indicatorType: "volume-delta" | "cumulative-volume-delta"
    lowerTimeframe: string
    resetPeriod?: string
  }) => void
  initialSettings?: {
    indicatorType?: "volume-delta" | "cumulative-volume-delta"
    lowerTimeframe?: string
    resetPeriod?: string
  }
}

export function VolumeDeltaSettingsModal({ onClose, onSave, initialSettings }: VolumeDeltaSettingsModalProps) {
  const [indicatorType, setIndicatorType] = useState<"volume-delta" | "cumulative-volume-delta">(
    initialSettings?.indicatorType || "volume-delta"
  )
  const [lowerTimeframe, setLowerTimeframe] = useState(initialSettings?.lowerTimeframe || "1min")
  const [resetPeriod, setResetPeriod] = useState(initialSettings?.resetPeriod || "D")
  const modalRef = useRef<HTMLDivElement>(null)

  // Load saved settings from localStorage on component mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('volumeDeltaSettings')
      if (savedSettings && !initialSettings) {
        const parsedSettings = JSON.parse(savedSettings)
        console.log('🔍 Loaded saved Volume Delta settings:', parsedSettings)
        if (parsedSettings.indicatorType) {
          setIndicatorType(parsedSettings.indicatorType)
        }
        if (parsedSettings.lowerTimeframe) {
          setLowerTimeframe(parsedSettings.lowerTimeframe)
        }
        if (parsedSettings.resetPeriod) {
          setResetPeriod(parsedSettings.resetPeriod)
        }
      }
    } catch (error) {
      console.log('Error reading saved Volume Delta settings:', error)
    }
  }, [initialSettings])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    function handleEscKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscKey)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscKey)
    }
  }, [onClose])

  const handleSave = () => {
    const settings = {
      indicatorType,
      lowerTimeframe,
      ...(indicatorType === "cumulative-volume-delta" && { resetPeriod }),
    }

    // Save to localStorage
    try {
      localStorage.setItem('volumeDeltaSettings', JSON.stringify(settings))
      console.log('🔍 Saved Volume Delta settings to localStorage:', settings)
    } catch (error) {
      console.log('Error saving Volume Delta settings:', error)
    }

    onSave(settings)
  }

  const timeframeOptions = [
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

  const resetPeriodOptions = [
    { value: "D", label: "Daily" },
    { value: "W", label: "Weekly" },
    { value: "M", label: "Monthly" },
  ]

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] bg-white p-0 border border-gray-200 shadow-lg rounded-lg overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <DialogTitle className="text-lg font-medium text-black">Volume Delta Settings</DialogTitle>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <div className="mb-6">
            <Label className="block text-sm font-medium text-black mb-2">Indicator Type</Label>
            <div className="grid grid-cols-2 gap-0 border border-gray-300 rounded-md overflow-hidden">
              <button
                className={`py-3 px-4 text-center text-sm ${
                  indicatorType === "volume-delta" ? "bg-gray-400 text-white" : "bg-white text-gray-700"
                }`}
                onClick={() => setIndicatorType("volume-delta")}
              >
                Volume Delta
              </button>
              <button
                className={`py-3 px-4 text-center text-sm ${
                  indicatorType === "cumulative-volume-delta" ? "bg-gray-400 text-white" : "bg-white text-gray-700"
                }`}
                onClick={() => setIndicatorType("cumulative-volume-delta")}
              >
                Cumulative Volume Delta
              </button>
            </div>
          </div>

          <div className="border-t border-gray-300 my-6"></div>

          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Define Settings</h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="lowerTimeframe" className="block text-sm font-medium text-gray-700 mb-2">
                  Lower Timeframe
                </Label>
                <Select value={lowerTimeframe} onValueChange={setLowerTimeframe}>
                  <SelectTrigger id="lowerTimeframe" className="w-full border border-gray-300 text-black bg-white">
                    <SelectValue placeholder="Select lower timeframe" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    {timeframeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  The timeframe used to calculate volume delta (must be lower than the chart timeframe)
                </p>
              </div>

              {indicatorType === "cumulative-volume-delta" && (
                <div>
                  <Label htmlFor="resetPeriod" className="block text-sm font-medium text-gray-700 mb-2">
                    Reset Period
                  </Label>
                  <Select value={resetPeriod} onValueChange={setResetPeriod}>
                    <SelectTrigger id="resetPeriod" className="w-full border border-gray-300 text-black bg-white">
                      <SelectValue placeholder="Select reset period" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-black">
                      {resetPeriodOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    The period at which the cumulative volume delta resets
                  </p>
                </div>
              )}
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
      </DialogContent>
    </Dialog>
  )
}
