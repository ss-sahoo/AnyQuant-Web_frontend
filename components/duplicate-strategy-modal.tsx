"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import { X, ChevronDown } from "lucide-react"
import type { Algorithm } from "@/lib/types"

interface DuplicateStrategyModalProps {
  strategy: Algorithm
  onClose: () => void
  onSave: (name: string, instrument: string) => void
}

export function DuplicateStrategyModal({ strategy, onClose, onSave }: DuplicateStrategyModalProps) {
  const [strategyName, setStrategyName] = useState(strategy.name)
  const [instrument, setInstrument] = useState(strategy.instrument)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close the modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Only close if the click is outside the modal
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    // Add event listener to the document
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  // Handle click outside to close the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isDropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isDropdownOpen])

  // Handle ESC key to close the modal
  useEffect(() => {
    function handleEscKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    // Add event listener
    document.addEventListener("keydown", handleEscKey)
    return () => {
      document.removeEventListener("keydown", handleEscKey)
    }
  }, [onClose])

  const instrumentOptions = ["XAU/USD", "XAG/USD", "GBP/JPY", "USD/CAD", "GBP/USD", "EUR/USD", "USD/JPY"]

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent event from bubbling up
    onSave(strategyName, instrument)
    onClose()
  }

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent event from bubbling up
    setIsDropdownOpen(!isDropdownOpen)
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.stopPropagation()} // Prevent clicks from reaching document
    >
      <div
        ref={modalRef}
        className="bg-[#f5f5f5] rounded-xl shadow-lg w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()} // Prevent clicks from reaching document
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 pb-4">
          <h2 className="text-[#1e1e1e] text-2xl font-bold">Strategy Summary</h2>
          <button
            onClick={(e) => {
              e.stopPropagation() // Prevent event from bubbling up
              onClose()
            }}
            className="text-[#1e1e1e] hover:bg-gray-200 rounded-full p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 pt-2">
          <div className="mb-6">
            <label htmlFor="strategy-name" className="block text-[#1e1e1e] text-lg font-medium mb-2">
              Strategy Name
            </label>
            <input
              id="strategy-name"
              type="text"
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
              onClick={(e) => e.stopPropagation()} // Prevent event from bubbling up
              className="w-full p-3 border border-gray-300 rounded-lg text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#6BCAE2]"
            />
          </div>

          <div className="mb-8">
            <label htmlFor="instruments" className="block text-[#1e1e1e] text-lg font-medium mb-2">
              Instruments
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={toggleDropdown}
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-500 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-[#6BCAE2]"
              >
                <span>Currency Pairs, Commodities, Indices, Stock...</span>
                <ChevronDown className="w-5 h-5" />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {instrumentOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation() // Prevent event from bubbling up
                        setInstrument(option)
                        setIsDropdownOpen(false)
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-[#1e1e1e]"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation() // Prevent event from bubbling up
                onClose()
              }}
              className="px-8 py-3 border border-gray-300 rounded-full text-[#1e1e1e] hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-3 bg-[#6BCAE2] rounded-full text-[#1e1e1e] hover:bg-[#5AB9D1] transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
