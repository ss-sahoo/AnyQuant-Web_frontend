"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { SuccessModal } from "@/components/success-modal"
import { BacktestTab } from "@/components/backtest-tab"
import { OptimisationTab } from "@/components/optimisation-tab"
import { PropertiesTab } from "@/components/properties-tab"
import { StrategyTab } from "@/components/strategy-tab"

export default function StrategyTestingPage() {
  const [activeTab, setActiveTab] = useState("strategy")
  const [selectedStrategy, setSelectedStrategy] = useState("xauscalper.py")
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [currentFile, setCurrentFile] = useState("")

  const handleFileUpload = (fileName: string) => {
    setCurrentFile(fileName)
    setUploadedFiles([...uploadedFiles, fileName])
    setShowSuccessModal(true)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  return (
    <div className="flex min-h-screen bg-[#121420] text-white">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar currentPage="home" />
      </div>

      {/* Mobile sidebar */}
      <MobileSidebar currentPage="home" />

      <main className="flex-1 flex flex-col">
        {/* Chart area */}
        <div className="bg-[#e6edf5] h-[500px] relative">
          {/* Candlestick chart would go here */}
          <div className="w-full h-full grid grid-cols-4 grid-rows-4">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="border border-gray-300"></div>
            ))}
          </div>

          {/* Candlestick chart mockup */}
          <div className="absolute inset-0 flex items-end">
            <div className="flex items-end h-1/2 w-full px-4">
              {Array.from({ length: 30 }).map((_, i) => {
                const height = Math.random() * 100 + 20
                const isGreen = Math.random() > 0.5
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end mx-0.5">
                    <div
                      className={`w-0.5 h-${Math.floor(Math.random() * 20) + 5} ${isGreen ? "bg-green-500" : "bg-red-500"}`}
                    ></div>
                    <div
                      className={`w-2 ${isGreen ? "bg-green-500" : "bg-red-500"}`}
                      style={{ height: `${height}px` }}
                    ></div>
                    <div
                      className={`w-0.5 h-${Math.floor(Math.random() * 20) + 5} ${isGreen ? "bg-green-500" : "bg-red-500"}`}
                    ></div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Dropdown arrow */}
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 rounded-full p-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 10L12 15L17 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex w-full">
          <button
            className={`flex-1 py-3 text-center font-medium ${
              activeTab === "strategy" ? "bg-[#121420] text-white" : "bg-[#1A1D2D] text-gray-400"
            }`}
            onClick={() => handleTabChange("strategy")}
          >
            Strategy
          </button>
          <button
            className={`flex-1 py-3 text-center font-medium ${
              activeTab === "backtest" ? "bg-[#121420] text-white" : "bg-[#1A1D2D] text-gray-400"
            }`}
            onClick={() => handleTabChange("backtest")}
          >
            Backtest
          </button>
          <button
            className={`flex-1 py-3 text-center font-medium ${
              activeTab === "optimisation" ? "bg-[#121420] text-white" : "bg-[#1A1D2D] text-gray-400"
            }`}
            onClick={() => handleTabChange("optimisation")}
          >
            Optimisation
          </button>
          <button
            className={`flex-1 py-3 text-center font-medium ${
              activeTab === "properties" ? "bg-[#121420] text-white" : "bg-[#1A1D2D] text-gray-400"
            }`}
            onClick={() => handleTabChange("properties")}
          >
            Properties
          </button>
        </div>

        {/* Tab content */}
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

        {/* Progress bar and buttons */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center mb-4">
            <div className="text-sm mr-2">Progress</div>
            <div className="flex-1 bg-gray-800 h-1 rounded-full">
              <div className="bg-[#85e1fe] h-1 w-0 rounded-full"></div>
            </div>
            <div className="text-sm ml-2">Time left: ---</div>
          </div>

          <div className="flex gap-4">
            <button className="flex-1 py-3 bg-[#1E2132] rounded-full text-white hover:bg-gray-700">Run Backtest</button>
            <button className="flex-1 py-3 bg-[#1E2132] rounded-full text-white hover:bg-gray-700">
              Run Optimisation
            </button>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      {showSuccessModal && <SuccessModal fileName={currentFile} onClose={() => setShowSuccessModal(false)} />}
    </div>
  )
}
