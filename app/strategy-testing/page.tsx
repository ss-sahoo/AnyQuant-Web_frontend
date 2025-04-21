"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { runBacktest } from "../AllApiCalls"
import { X } from "lucide-react"

export default function StrategyTestingPage() {
  const [activeTab, setActiveTab] = useState("strategy")
  const [showIframe, setShowIframe] = useState(false)

  const [selectedStrategy, setSelectedStrategy] = useState("xauscalper.py")
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [currentFile, setCurrentFile] = useState("")
  const [inputFile, setInputFile] = useState<File | null>(null)
  const [plotHtml, setPlotHtml] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [isDragging, setIsDragging] = useState(false)

  // Add a state for tracking if the chart is expanded
  const [isChartExpanded, setIsChartExpanded] = useState(false)

  // Add this function to handle expanding/collapsing the chart
  const toggleChartExpansion = () => {
    setIsChartExpanded(!isChartExpanded)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      handleFile(file)
    }
  }

  const handleFile = (file: File) => {
    // Check if file is .py or .csv
    const fileExtension = file.name.split(".").pop()?.toLowerCase()
    if (fileExtension === "py" || fileExtension === "csv") {
      setInputFile(file)
      setCurrentFile(file.name)
      setUploadedFiles([...uploadedFiles, file.name])
      setShowSuccessModal(true)
    } else {
      alert("Only .py and .csv files are supported")
    }
  }

  const handleFileUpload = (fileName: string) => {
    setCurrentFile(fileName)
    setUploadedFiles([...uploadedFiles, fileName])
    setShowSuccessModal(true)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setInputFile(file)
      handleFile(file)
    }
  }

  const handleRunBacktest = async () => {
    const statementJSON = localStorage.getItem("savedStrategy")
    if (!statementJSON || !inputFile) {
      alert("Statement or file is missing!")
      return
    }

    try {
      setIsLoading(true)
      const statement = JSON.parse(statementJSON)
      const result = await runBacktest({ statement, file: inputFile })
      setPlotHtml(result.plot_html)
      setIsLoading(false)
      console.log("Response:", result)
    } catch (error: any) {
      setIsLoading(false)
      alert("Error: " + error.message)
      console.error("Backtest Error:", error)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleDeleteFile = (fileName: string) => {
    setUploadedFiles(uploadedFiles.filter((file) => file !== fileName))
    if (currentFile === fileName) {
      setCurrentFile("")
      setInputFile(null)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#121420] text-white">
      <div className="hidden md:block">
        <Sidebar currentPage="home" />
      </div>

      <MobileSidebar currentPage="home" />

      <main className="flex-1 flex flex-col relative">
        {/* Reduced height of chart area from 440px to 300px */}
        {plotHtml && (
          <div className="relative">
            <div
              className={`transition-all duration-500 ease-in-out ${isChartExpanded ? "fixed inset-0 z-50 bg-black" : "relative"}`}
            >
              <iframe
                title="Plotly Chart"
                style={{
                  width: "100%",
                  height: isChartExpanded ? "100vh" : "300px",
                  border: "1px solid black",
                  transition: "height 0.5s ease-in-out",
                }}
                srcDoc={plotHtml}
              />
              <button
                onClick={toggleChartExpansion}
                className={`absolute ${isChartExpanded ? "top-4 right-4" : "top-2 right-2"} bg-[#1E2132] hover:bg-[#2B2E38] text-white p-2 rounded-full transition-all duration-300`}
                aria-label={isChartExpanded ? "Minimize chart" : "Expand chart"}
              >
                {isChartExpanded ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {!plotHtml && <div className="w-full h-[300px] bg-[#f1f1f1] relative">{/* Chart area placeholder */}</div>}

        {/* Tabs */}
        <div className="flex w-full">
          {["strategy", "backtest", "optimisation", "properties"].map((tab) => (
            <button
              key={tab}
              className={`flex-1 py-3 text-center font-medium ${
                activeTab === tab ? "bg-[#121420] text-white" : "bg-[#1A1D2D] text-gray-400"
              }`}
              onClick={() => handleTabChange(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content area with overflow to allow scrolling */}
        <div className="flex-1 overflow-y-auto pb-[160px]">
          {/* Strategy Selection */}
          <div className="p-4 bg-black">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div className="mb-2 md:mb-0">
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
              </div>
              <button className="bg-[#85e1fe] hover:bg-[#6bcae2] text-black rounded-full px-8 py-3 text-sm font-medium">
                Load
              </button>
            </div>
          </div>

          {/* File Upload Area */}
          <div className="p-4 bg-black">
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
                <p className="text-sm text-gray-400">Supported format: .py, .csv</p>
              </div>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex justify-between items-center py-2">
                    <div className="flex items-center">
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        ></path>
                      </svg>
                      <span>{file}</span>
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
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sticky footer with progress and buttons */}
        <div className="absolute bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-10">
          {/* Progress Bar */}
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span>Progress</span>
              <span>Time left: ---</span>
            </div>
            <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
              <div className="bg-[#85e1fe] h-full w-0"></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 flex gap-4">
            <button
              className="flex-1 py-3 bg-[#1E2132] rounded-full text-white hover:bg-gray-700"
              onClick={handleRunBacktest}
            >
              Run Backtest
            </button>
            <button className="flex-1 py-3 bg-[#1E2132] rounded-full text-white hover:bg-gray-700">
              Run Optimisation
            </button>
          </div>
        </div>
      </main>

      {/* File Upload Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#f5f5f5] rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-black">File Upload Successful</h2>
              <button onClick={() => setShowSuccessModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col items-center py-6">
              <div className="w-24 h-24 bg-[#85e1fe] rounded-full flex items-center justify-center mb-6">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M5 12L10 17L20 7"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="flex items-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M14 2V8H20" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="ml-2 text-black">{currentFile}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Modal */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#f5f5f5] rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex flex-col items-center py-6">
              <div className="w-24 h-24 relative mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-[#e6f7ff]"></div>
                <div className="absolute inset-0 rounded-full border-4 border-[#85e1fe] border-t-transparent animate-spin"></div>
              </div>
              <p className="text-xl font-medium text-black">Running Backtest...</p>
            </div>
          </div>
        </div>
      )}
      {isChartExpanded && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggleChartExpansion} />}
    </div>
  )
}
