"use client"

import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CandleSizeSettingsModalProps {
  onClose: () => void
  onSave: (settings: {
    assetType: string
    output: string
  }) => void
  initialSettings?: {
    assetType?: string
    output?: string
  }
}

export function CandleSizeSettingsModal({ onClose, onSave, initialSettings }: CandleSizeSettingsModalProps) {
  const [assetType, setAssetType] = useState(initialSettings?.assetType || "gold")
  const [output, setOutput] = useState(initialSettings?.output || "pips")
  const modalRef = useRef<HTMLDivElement>(null)

  // Load saved settings from localStorage on component mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('candleSizeSettings')
      if (savedSettings && !initialSettings) {
        const parsedSettings = JSON.parse(savedSettings)
        console.log('🔍 Loaded saved Candle Size settings:', parsedSettings)
        if (parsedSettings.assetType) {
          setAssetType(parsedSettings.assetType)
        }
        if (parsedSettings.output) {
          setOutput(parsedSettings.output)
        }
      }
    } catch (error) {
      console.log('Error reading saved Candle Size settings:', error)
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
      assetType,
      output,
    }

    // Save to localStorage
    try {
      localStorage.setItem('candleSizeSettings', JSON.stringify(settings))
      console.log('🔍 Saved Candle Size settings to localStorage:', settings)
    } catch (error) {
      console.log('Error saving Candle Size settings:', error)
    }

    onSave(settings)
  }

  const assetTypeOptions = [
    { value: "gold", label: "Gold" },
    { value: "forex", label: "Forex" },
    { value: "crypto", label: "Crypto" },
    { value: "stocks", label: "Stocks" },
    { value: "indices", label: "Indices" },
    { value: "commodities", label: "Commodities" },
  ]

  const outputOptions = [
    { value: "pips", label: "Pips" },
    { value: "points", label: "Points" },
    { value: "percent", label: "Percent" },
    { value: "absolute", label: "Absolute" },
  ]

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] bg-white p-0 border border-gray-200 shadow-lg rounded-lg overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <DialogTitle className="text-lg font-medium text-black">Candle Size Settings</DialogTitle>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Define Settings</h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="assetType" className="block text-sm font-medium text-gray-700 mb-2">
                  Asset Type
                </Label>
                <Select value={assetType} onValueChange={setAssetType}>
                  <SelectTrigger id="assetType" className="w-full border border-gray-300 text-black bg-white">
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    {assetTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  The type of asset being traded
                </p>
              </div>

              <div>
                <Label htmlFor="output" className="block text-sm font-medium text-gray-700 mb-2">
                  Output Format
                </Label>
                <Select value={output} onValueChange={setOutput}>
                  <SelectTrigger id="output" className="w-full border border-gray-300 text-black bg-white">
                    <SelectValue placeholder="Select output format" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    {outputOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  The format for candle size output
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
