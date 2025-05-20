"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import { X, ChevronDown } from "lucide-react"
import type { Algorithm } from "@/lib/types"
import { useRouter } from "next/navigation"

interface EditStrategyModalProps {
  strategy: Algorithm
  onClose: () => void
  onSave: (name: string, instrument: string) => void
  isEdit?: boolean
}

export function EditStrategyModal({ strategy, onClose, onSave, isEdit = false }: EditStrategyModalProps) {
  const [strategyName, setStrategyName] = useState(strategy.name)
  const [instrument, setInstrument] = useState(strategy.instrument)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Handle click outside modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  // Handle click outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isDropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isDropdownOpen])

  // Close modal on ESC key
  useEffect(() => {
    function handleEscKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }
    document.addEventListener("keydown", handleEscKey)
    return () => document.removeEventListener("keydown", handleEscKey)
  }, [onClose])

  const instrumentOptions = ["XAU/USD", "XAG/USD", "GBP/JPY", "USD/CAD", "GBP/USD", "EUR/USD", "USD/JPY"]

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDropdownOpen(!isDropdownOpen)
  }

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSave(strategyName, instrument) // ✅ Only send what's needed
    onClose()
  }

  const handleProceedToBuilder = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSave(strategyName, instrument) // ✅ Only send name and instrument
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={(e) => e.stopPropagation()}>
      <div ref={modalRef} className="bg-[#f5f5f5] rounded-xl shadow-lg w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 pb-4">
          <h2 className="text-[#1e1e1e] text-2xl font-bold">Strategy Summary</h2>
          <button onClick={(e) => { e.stopPropagation(); onClose() }} className="text-[#1e1e1e] hover:bg-gray-200 rounded-full p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

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
              onClick={(e) => e.stopPropagation()}
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
                <span>{instrument}</span>
                <ChevronDown className="w-5 h-5" />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {instrumentOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
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

          <div className="flex justify-end gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="px-8 py-3 border border-gray-300 rounded-full text-[#1e1e1e] hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            {isEdit ? (
              <button
                onClick={handleProceedToBuilder}
                className="px-8 py-3 bg-[#6BCAE2] rounded-full text-[#1e1e1e] hover:bg-[#5AB9D1] transition-colors"
              >
                Edit
              </button>
            ) : (
              <button
                onClick={handleSaveClick}
                className="px-8 py-3 bg-[#6BCAE2] rounded-full text-[#1e1e1e] hover:bg-[#5AB9D1] transition-colors"
              >
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
