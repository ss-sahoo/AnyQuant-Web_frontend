"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { X, Upload, Check, AlertTriangle, Clock } from "lucide-react"

interface TimeframeFile {
  timeframe: string
  uploaded: boolean
  filename?: string
  order: number
}

interface TimeframeUploadSectionProps {
  isDragging: boolean
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void
  handleClick: () => void
  fileInputRef: React.RefObject<HTMLInputElement>
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  uploadedFiles: string[]
  handleDeleteFile: (fileName: string) => void
}

export function TimeframeUploadSection({
  isDragging,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleClick,
  fileInputRef,
  handleFileChange,
  uploadedFiles,
  handleDeleteFile,
}: TimeframeUploadSectionProps) {
  const [timeframeFiles, setTimeframeFiles] = useState<TimeframeFile[]>([])
  const [activeTimeframeIndex, setActiveTimeframeIndex] = useState<number | null>(null)
  const uploadAreaRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    // Get required timeframes from localStorage
    try {
      const timeframesJson = localStorage.getItem("timeframes_required")
      if (timeframesJson) {
        const requiredTimeframes = JSON.parse(timeframesJson)

        // Initialize status for each required timeframe with order
        const initialTimeframes = requiredTimeframes.map((tf: string, index: number) => ({
          timeframe: tf,
          uploaded: false,
          order: index + 1,
        }))

        setTimeframeFiles(initialTimeframes)
      }
    } catch (error) {
      console.error("Error loading timeframes:", error)
    }
  }, [])

  // Helper function to match timeframes with filenames (same logic as main app)
  const matchesTimeframe = (filename: string, timeframe: string) => {
    const lowerFilename = filename.toLowerCase()
    const lowerTimeframe = timeframe.toLowerCase()

    // Direct matching (e.g., "3h" in filename)
    if (lowerFilename.includes(lowerTimeframe)) {
      return true
    }

    // Handle numeric equivalents
    const timeframeToMinutes: { [key: string]: number } = {
      "1min": 1,
      "5min": 5,
      "15min": 15,
      "20min": 20,
      "30min": 30,
      "36min": 36,
      "1h": 60,
      "2h": 120,
      "3h": 180,
      "4h": 240,
      "6h": 360,
      "8h": 480,
      "12h": 720,
      "1d": 1440,
      "1 day": 1440,
      "1w": 10080,
      "1 week": 10080,
    }

    const minutes = timeframeToMinutes[lowerTimeframe]
    if (minutes) {
      const minutesStr = minutes.toString()
      const regex = new RegExp(`\\b${minutesStr}\\b`)
      return regex.test(lowerFilename)
    }

    // Additional pattern matching
    const timeframePatterns = {
      "3h": ["3h", "180", "3 hour", "three hour"],
      "1h": ["1h", "60", "1 hour", "one hour"],
      "36min": ["36min", "36", "36 minute", "thirty six"],
      "30min": ["30min", "30", "30 minute", "thirty"],
      "15min": ["15min", "15", "15 minute", "fifteen"],
      "5min": ["5min", "5", "5 minute", "five"],
      "1min": ["1min", "1", "1 minute", "one minute"]
    }

    const patterns = timeframePatterns[lowerTimeframe as keyof typeof timeframePatterns]
    if (patterns) {
      return patterns.some(pattern => lowerFilename.includes(pattern.toLowerCase()))
    }

    return false
  }

  // Update status when files are uploaded or deleted
  useEffect(() => {
    if (timeframeFiles.length > 0) {
      const updatedTimeframes = timeframeFiles.map((tf) => {
        // Check if any uploaded file matches this timeframe using proper matching logic
        const matchingFile = uploadedFiles.find((file) => matchesTimeframe(file, tf.timeframe))

        return {
          ...tf,
          uploaded: !!matchingFile,
          filename: matchingFile,
        }
      })

      setTimeframeFiles(updatedTimeframes)

      // Set active timeframe to the first non-uploaded timeframe
      const firstNonUploaded = updatedTimeframes.findIndex((tf) => !tf.uploaded)
      setActiveTimeframeIndex(firstNonUploaded !== -1 ? firstNonUploaded : null)
    }
  }, [uploadedFiles, timeframeFiles.length])

  // Handle click on a specific timeframe upload area
  const handleTimeframeClick = (index: number) => {
    setActiveTimeframeIndex(index)
    handleClick()
  }

  // Calculate progress percentage
  const uploadProgress = timeframeFiles.length
    ? Math.round((timeframeFiles.filter((tf) => tf.uploaded).length / timeframeFiles.length) * 100)
    : 0

  return (
    <div className="p-4 bg-black rounded-lg">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Required Timeframes</h3>
          <div className="flex items-center">
            <div className="w-32 bg-gray-700 h-2 rounded-full overflow-hidden mr-3">
              <div
                className="bg-[#85e1fe] h-full transition-all duration-500 ease-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-400">
              {timeframeFiles.filter((tf) => tf.uploaded).length}/{timeframeFiles.length} files
            </span>
          </div>
        </div>

        {timeframeFiles.length === 0 ? (
          <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 p-4 rounded-md flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <p>No timeframes required. Please create or select a strategy first.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sequential upload instructions */}
            <div className="bg-blue-500/10 border border-blue-500/30 text-blue-200 p-3 rounded-md mb-4">
              <p className="text-sm">
                Please upload data files in the order shown below. Each file should include the timeframe in its name
                (e.g., "data_3h.csv").
              </p>
            </div>

            {/* Timeframe upload cards */}
            {timeframeFiles.map((tf, index) => (
              <div
                key={index}
                ref={(el) => (uploadAreaRefs.current[index] = el)}
                className={`border rounded-md transition-all duration-300 ${
                  tf.uploaded
                    ? "bg-green-500/10 border-green-500/30"
                    : index === activeTimeframeIndex
                      ? "bg-blue-500/20 border-blue-500/50 border-2"
                      : "bg-[#1E2132] border-gray-700"
                }`}
              >
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          tf.uploaded
                            ? "bg-green-500/20 text-green-400"
                            : index === activeTimeframeIndex
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-gray-700 text-gray-400"
                        }`}
                      >
                        {tf.uploaded ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <span className="text-sm font-medium">{tf.order}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Timeframe: {tf.timeframe}
                        </h4>
                        {tf.uploaded && tf.filename && (
                          <p className="text-xs text-gray-400 mt-1">Uploaded: {tf.filename}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      {tf.uploaded ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (tf.filename) handleDeleteFile(tf.filename)
                          }}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      ) : (
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            index === activeTimeframeIndex
                              ? "bg-blue-500/30 text-blue-200"
                              : "bg-gray-700 text-gray-400"
                          }`}
                        >
                          {index === activeTimeframeIndex ? "Active" : "Pending"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Upload area for this timeframe */}
                  {!tf.uploaded && index === activeTimeframeIndex && (
                    <div
                      className={`mt-2 border-2 border-dashed ${
                        isDragging ? "border-[#85e1fe] bg-[#85e1fe]/10" : "border-gray-700"
                      } rounded-lg p-4 text-center cursor-pointer transition-colors`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => handleTimeframeClick(index)}
                    >
                      <div className="flex flex-col items-center">
                        <Upload className="h-8 w-8 mb-2 text-gray-400" />
                        <p className="text-sm font-medium mb-1">Upload {tf.timeframe} data file</p>
                        <p className="text-xs text-gray-500">
                          Filename should include "{tf.timeframe}" (e.g., data_{tf.timeframe}.csv)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* All files uploaded message */}
            {timeframeFiles.length > 0 && timeframeFiles.every((tf) => tf.uploaded) && (
              <div className="bg-green-500/20 border border-green-500/50 text-green-200 p-3 rounded-md flex items-center">
                <Check className="h-5 w-5 mr-2" />
                <p>All required timeframe data files have been uploaded!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* File input (hidden) */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".py,.csv" className="hidden" />

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-md font-medium mb-3">All Uploaded Files</h3>
          <div className="bg-[#1E2132] rounded-md overflow-hidden">
            {uploadedFiles.map((file, index) => {
              // Check if this file matches a required timeframe using proper matching logic
              const matchingTimeframe = timeframeFiles.find((tf) =>
                matchesTimeframe(file, tf.timeframe),
              )

              return (
                <div
                  key={index}
                  className={`flex justify-between items-center py-3 px-4 ${
                    index !== uploadedFiles.length - 1 ? "border-b border-gray-800" : ""
                  }`}
                >
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      ></path>
                    </svg>
                    <div className="flex flex-col">
                      <span className="text-sm">{file}</span>
                      {matchingTimeframe ? (
                        <span className="text-xs text-green-400">
                          ✅ Matches required timeframe: {matchingTimeframe.timeframe}
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-400">
                          ⚠️ Doesn't match any required timeframe. This may cause incorrect backtest results.
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="text-red-500 hover:text-red-400 p-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteFile(file)
                    }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
