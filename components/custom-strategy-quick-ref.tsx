"use client"

import { AlertCircle, BookOpen } from "lucide-react"

interface CustomStrategyQuickRefProps {
  onViewFullGuide?: () => void
}

export function CustomStrategyQuickRef({ onViewFullGuide }: CustomStrategyQuickRefProps) {
  return (
    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4">
      <div className="flex gap-4">
        <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-blue-400 mb-2">Custom Strategy Requirements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300 mb-3">
            <div>
              <p className="font-medium text-white mb-1">✅ Required:</p>
              <ul className="space-y-1 text-xs">
                <li>• Inherit from <code className="bg-black/50 px-1.5 py-0.5 rounded">CustomStrategyBase</code></li>
                <li>• Implement <code className="bg-black/50 px-1.5 py-0.5 rounded">init()</code> method</li>
                <li>• Implement <code className="bg-black/50 px-1.5 py-0.5 rounded">on_bar()</code> method</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-white mb-1">❌ Not Allowed:</p>
              <ul className="space-y-1 text-xs">
                <li>• File I/O operations</li>
                <li>• Network requests</li>
                <li>• External libraries (except numpy, pandas, math)</li>
                <li>• System commands</li>
              </ul>
            </div>
          </div>
          <div className="flex gap-2">
            <code className="bg-black/50 px-2 py-1 rounded text-xs text-gray-300 flex-1">
              Available: numpy, pandas, math, talib
            </code>
            {onViewFullGuide && (
              <button
                onClick={onViewFullGuide}
                className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors text-sm font-medium"
              >
                <BookOpen className="w-4 h-4" />
                Full Guide
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
