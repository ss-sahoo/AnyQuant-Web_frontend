"use client"

import { useRef, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { SuccessModal } from "@/components/success-modal"
import { BacktestTab } from "@/components/backtest-tab"
import { OptimisationTab } from "@/components/optimisation-tab"
import { PropertiesTab } from "@/components/properties-tab"
import { StrategyTab } from "@/components/strategy-tab"
import { runBacktest } from "../AllApiCalls"

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

    const [isDragging, setIsDragging] = useState(false)

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(true)
    }
  
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
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
    if (file) setInputFile(file)
  }

  const handleRunBacktest = async () => {
    const statementJSON = localStorage.getItem("savedStrategy")
    if (!statementJSON || !inputFile) {
      alert("Statement or file is missing!")
      return
    }

    try {
      const statement = JSON.parse(statementJSON)
      const result = await runBacktest({ statement, file: inputFile })
      setPlotHtml(result.plot_html)
      alert("Backtest started: " + result.task_id)
      console.log("Response:", result)
    } catch (error: any) {
      alert("Error: " + error.message)
      console.error("Backtest Error:", error)
    }
  }
  const handleClick = () => {
    fileInputRef.current?.click()
  }


  return (
    <div className="flex min-h-screen bg-[#121420] text-white">
      <div className="hidden md:block">
        <Sidebar currentPage="home" />
      </div>

      <MobileSidebar currentPage="home" />
      

      <main className="flex-1 flex flex-col">

      {plotHtml && (
              <iframe
                title="Plotly Chart"
                style={{ width: "100%", height: "440px", border: "1px solid black" }}
                srcDoc={plotHtml}
              />
            )}

        
        {/* -- Chart area skipped for brevity -- */}

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
 

        {/* Tab Content */}
        <div className="flex-1 p-4">
          {activeTab === "strategy" && (
            <StrategyTab
              selectedStrategy={selectedStrategy}
              setSelectedStrategy={setSelectedStrategy}
              uploadedFiles={uploadedFiles}
              onFileUpload={handleFileUpload}
            />
          )}
          {activeTab === "backtest" && <BacktestTab />}
          {activeTab === "optimisation" && <OptimisationTab />}
          {activeTab === "properties" && <PropertiesTab />}
        </div>

        {/* Upload + Run */}
        <div className="p-4 border-t border-gray-800">
            {/* <div className="mb-4">
              <label className="block mb-2 text-sm">Upload CSV File for Backtest:</label>
              <input type="file" accept=".csv" onChange={handleFileChange} className="text-white" />
            </div> */}

<div
      className={`border-2 border-dashed ${
        isDragging ? "border-[#85e1fe] bg-[#85e1fe]/10" : "border-gray-700"
      } rounded-lg p-8 text-center cursor-pointer transition-colors`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      // onDrop={handleDrop}
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
  




          <div className="flex gap-4">
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

      {showSuccessModal && <SuccessModal fileName={currentFile} onClose={() => setShowSuccessModal(false)} />}
    </div>
  )
}
