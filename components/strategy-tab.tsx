"use client"

import type React from "react"

interface StrategyTabProps {
  selectedStrategy: string
  setSelectedStrategy: React.Dispatch<React.SetStateAction<string>>
  requiredTimeframes: string[]
  uploadedFiles: string[]
  matchesTimeframe: (filename: string, timeframe: string) => boolean
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleDeleteFile: (fileName: string) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleClick: () => void
  isDragging: boolean
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void
  setShowSuccessModal: React.Dispatch<React.SetStateAction<boolean>>
  currentFile: string
}

export function StrategyTab({
  selectedStrategy,
  setSelectedStrategy,
  requiredTimeframes,
  uploadedFiles,
  matchesTimeframe,
  handleFileChange,
  handleDeleteFile,
  fileInputRef,
  handleClick,
  isDragging,
  handleDragOver,
  handleDragLeave,
  handleDrop,
}: StrategyTabProps) {
  return (
    <div className="p-4">
      {/* Strategy Selection */}
      {/* <div className="p-4 bg-black"> */}
        {/* <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4"> */}
          {/* <div className="mb-2 md:mb-0">
            <label className="block text-sm text-gray-400 mb-2">Select Strategy</label>
            <div className="relative">
              <select
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
                className="w-full md:w-64 bg-[#1E2132] border border-gray-800 rounded-md p-3 pr-10 appearance-none focus:outline-none focus:ring-1 focus:ring-[#85e1fe]"
              >
                <option value="xauscalper.py">xauscalper.py</option>
                <option value="strategy2.py">strategy2.py</option>
                <option value="strategy3.py">strategy3.py</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div> */}
          {/* <button className="ml-auto bg-[#85e1fe] hover:bg-[#6bcae2] text-black rounded-full px-8 py-3 text-sm font-medium">
            Load
          </button> */}
        {/* </div> */}
      {/* </div> */}

      {/* File Upload Area */}
      <div className="p-4 bg-black">
        {/* Required Timeframes Section */}
        {requiredTimeframes.length > 0 && (
          <div className="mb-4 p-3 bg-[#1E2132] rounded-md">
            <h3 className="text-md font-medium mb-2 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              Required Timeframes
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
              {requiredTimeframes.map((timeframe, index) => {
                // Check if this timeframe has been uploaded
                const isUploaded = uploadedFiles.some((file) => matchesTimeframe(file, timeframe))

                return (
                  <div
                    key={index}
                    className={`p-2 rounded-md border flex items-center ${
                      isUploaded
                        ? "bg-green-500/20 border-green-500/30 text-green-200"
                        : "bg-blue-500/20 border-blue-500/30 text-blue-200"
                    }`}
                  >
                    <span className="mr-2">{index + 1}.</span>
                    <span className="font-medium">{timeframe}</span>
                    {isUploaded && (
                      <svg
                        className="w-4 h-4 ml-auto text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-gray-400">
              Please upload data files for all required timeframes. Each filename should include the timeframe (e.g.,
              "data_3h.csv") or its minute equivalent (e.g., "180" for 3h).
            </p>
          </div>
        )}

        <div
          className={`border-2 border-dashed ${
            isDragging ? "border-[#85e1fe] bg-[#85e1fe]/10" : "border-gray-700"
          } rounded-lg p-8 text-center cursor-pointer transition-colors`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".py,.csv" className="hidden" />
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-[#1E2132] rounded-full flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 15V3M12 3L7 8M12 3L17 8"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 15V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V15"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-lg font-medium mb-2">Click here to upload a file or drag and drop</p>
            <p className="text-sm text-gray-400 mb-2">Supported format: .py, .csv</p>
            {requiredTimeframes.length > 0 && (
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {requiredTimeframes.map((tf, idx) => (
                  <span key={idx} className="text-xs bg-[#1E2132] text-[#85e1fe] px-2 py-1 rounded-full">
                    {tf}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Uploaded Files List with Timeframe Matching */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <h3 className="text-md font-medium mb-2">Uploaded Files</h3>
            <div className="bg-[#1E2132] rounded-md overflow-hidden">
              {uploadedFiles.map((file, index) => {
                // Check if this file matches a required timeframe
                const matchingTimeframe = requiredTimeframes.find((tf) => matchesTimeframe(file, tf))

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
                            Matches required timeframe: {matchingTimeframe}
                          </span>
                        ) : (
                          requiredTimeframes.length > 0 && (
                            <span className="text-xs text-yellow-400">Doesn't match any required timeframe</span>
                          )
                        )}
                      </div>
                    </div>
                    <button
                      className="text-red-500 hover:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteFile(file)
                      }}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        ></path>
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Upload Progress */}
            {requiredTimeframes.length > 0 && (
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-400">Upload Progress</span>
                  <span className="text-sm text-gray-400">
                    {uploadedFiles.filter((file) => requiredTimeframes.some((tf) => matchesTimeframe(file, tf))).length}{" "}
                    / {requiredTimeframes.length}
                  </span>
                </div>
                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#85e1fe] h-full transition-all duration-500 ease-out"
                    style={{
                      width: `${
                        requiredTimeframes.length
                          ? (
                              uploadedFiles.filter((file) =>
                                requiredTimeframes.some((tf) => matchesTimeframe(file, tf)),
                              ).length / requiredTimeframes.length
                            ) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
