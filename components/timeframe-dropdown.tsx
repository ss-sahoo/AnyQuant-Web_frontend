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

  const timeframes = ["1 minute", "5 minute", "15 minute", "30 minute", "45 minute", "1h", "3h", "4h", "1 day"]

  return (
    <div
      ref={dropdownRef}
      className="fixed z-50 w-48 bg-white rounded-md shadow-lg overflow-hidden"
      style={{
        maxHeight: "300px",
      }}
    >
      <div className="overflow-auto">
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
