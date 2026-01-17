"use client"

import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface HistoricalPriceLevelSettingsModalProps {
  onClose: () => void
  onSave: (settings: {
    period: string
    level: string
  }) => void
  initialSettings?: {
    period?: string
    level?: string
  }
}

export function HistoricalPriceLevelSettingsModal({ onClose, onSave, initialSettings }: HistoricalPriceLevelSettingsModalProps) {
  const [period, setPeriod] = useState(initialSettings?.period || "W")
  const [level, setLevel] = useState(initialSettings?.level || "High")
  const modalRef = useRef<HTMLDivElement>(null)

  // Load saved settings from localStorage on component mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('historicalPriceLevelSettings')
      if (savedSettings && !initialSettings) {
        const parsedSettings = JSON.parse(savedSettings)
        console.log('🔍 Loaded saved Historical Price Level settings:', parsedSettings)
        if (parsedSettings.period) {
          setPeriod(parsedSettings.period)
        }
        if (parsedSettings.level) {
          setLevel(parsedSettings.level)
        }
      }
    } catch (error) {
      console.log('Error reading saved Historical Price Level settings:', error)
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
      period,
      level,
    }

    // Save to localStorage
    try {
      localStorage.setItem('historicalPriceLevelSettings', JSON.stringify(settings))
      console.log('🔍 Saved Historical Price Level settings to localStorage:', settings)
    } catch (error) {
      console.log('Error saving Historical Price Level settings:', error)
    }

    onSave(settings)
  }

  const periodOptions = [
    { value: "D", label: "Daily" },
    { value: "W", label: "Weekly" },
    { value: "M", label: "Monthly" },
    { value: "Q", label: "Quarterly" },
    { value: "Y", label: "Yearly" },
  ]

  const levelOptions = [
    { value: "High", label: "High" },
    { value: "Low", label: "Low" },
    { value: "Open", label: "Open" },
    { value: "Close", label: "Close" },
  ]

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] bg-white p-0 border border-gray-200 shadow-lg rounded-lg overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <DialogTitle className="text-lg font-medium text-black">Historical Price Level Settings</DialogTitle>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Define Settings</h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-2">
                  Period
                </Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger id="period" className="w-full border border-gray-300 text-black bg-white">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    {periodOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  The historical period to reference (e.g., Weekly high/low)
                </p>
              </div>

              <div>
                <Label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-2">
                  Price Level
                </Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger id="level" className="w-full border border-gray-300 text-black bg-white">
                    <SelectValue placeholder="Select price level" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    {levelOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  The price level type (High, Low, Open, or Close)
                </p>
              </div>
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
