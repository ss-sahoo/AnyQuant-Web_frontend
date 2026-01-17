"use client"

import { X } from "lucide-react"
import { CustomStrategyGuide } from "./custom-strategy-guide"

interface CustomStrategyGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CustomStrategyGuideModal({ isOpen, onClose }: CustomStrategyGuideModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 overflow-y-auto">
      <div className="w-full max-w-5xl my-8">
        <div className="relative bg-[#0a0e27] rounded-lg border border-[#2A2D42] shadow-2xl">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-[#2A2D42] rounded-lg transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[90vh]">
            <CustomStrategyGuide />
          </div>

          {/* Footer */}
          <div className="border-t border-[#2A2D42] p-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#85e1fe] text-black rounded-lg hover:bg-[#6bcae2] transition-colors font-medium"
            >
              Got it, Close Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
