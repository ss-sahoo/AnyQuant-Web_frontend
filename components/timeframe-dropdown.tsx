"use client"

import { useRef, useEffect } from "react"

interface TimeframeDropdownProps {
  onSelect: (timeframe: string) => void
  onClose: () => void
}

export function TimeframeDropdown({ onSelect, onClose }: TimeframeDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  const timeframes = ["1 minute", "5 minute", "15 minute", "30 minute", "45 minute", "1 hour", "4 hour", "1 day"]

  return (
    <div ref={dropdownRef} className="absolute z-50 mt-1 w-48 bg-white rounded-md shadow-lg overflow-hidden">
      <div className="max-h-60 overflow-auto">
        {timeframes.map((timeframe) => (
          <button
            key={timeframe}
            className="w-full text-left px-4 py-2 text-black hover:bg-gray-100"
            onClick={() => onSelect(timeframe)}
          >
            {timeframe}
          </button>
        ))}
      </div>
    </div>
  )
}
