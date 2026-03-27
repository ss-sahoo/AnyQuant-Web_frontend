"use client"

import React, { useState } from 'react'
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { extractOptimizationError } from '@/lib/error-utils'

interface OptimizationErrorDisplayProps {
  message?: string
  stdout?: string
  stderr?: string
  className?: string
}

export function OptimizationErrorDisplay({
  message,
  stdout,
  stderr,
  className = ''
}: OptimizationErrorDisplayProps) {
  const [showDetails, setShowDetails] = useState(false)

  // Extract structured error from stderr or message
  const errorSource = stderr || message || ''
  const errorInfo = errorSource ? extractOptimizationError(errorSource) : null

  if (!message && !stdout && !stderr) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Error Card */}
      {errorInfo && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-red-400 font-semibold mb-1">{errorInfo.title}</h4>
              <p className="text-red-200 text-sm break-words">{errorInfo.message}</p>
              {errorInfo.details && (
                <p className="text-red-300 text-xs mt-2 italic">{errorInfo.details}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generic message fallback (if no structured error extracted) */}
      {!errorInfo && message && (
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-yellow-200 text-sm break-words">{message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Technical Details (Collapsible) */}
      {(stdout || stderr) && (
        <div className="bg-[#141721] border border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between p-3 hover:bg-[#1a1f2e] transition-colors"
          >
            <span className="text-gray-300 text-sm font-medium">
              Technical Details
            </span>
            {showDetails ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {showDetails && (
            <div className="p-4 pt-0 space-y-3 border-t border-gray-700">
              {stdout && (
                <div>
                  <h5 className="text-green-400 text-xs font-medium mb-2">STDOUT:</h5>
                  <pre className="bg-[#0e1018] p-3 rounded text-xs text-gray-300 overflow-x-auto max-h-60 overflow-y-auto border border-gray-800">
                    {stdout}
                  </pre>
                </div>
              )}
              {stderr && (
                <div>
                  <h5 className="text-red-400 text-xs font-medium mb-2">STDERR:</h5>
                  <pre className="bg-[#0e1018] p-3 rounded text-xs text-red-300 overflow-x-auto max-h-60 overflow-y-auto border border-gray-800">
                    {stderr}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

