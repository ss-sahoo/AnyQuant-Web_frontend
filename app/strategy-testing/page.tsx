"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { runBacktest, updateStrategyTradingType } from "../AllApiCalls"
import { X } from "lucide-react"
import AuthGuard from "@/hooks/useAuthGuard"

export default function StrategyTestingPage() {
  const [activeTab, setActiveTab] = useState("strategy")
  const [showIframe, setShowIframe] = useState(false)

  const [selectedStrategy, setSelectedStrategy] = useState("xauscalper.py")
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  // Add a state to store the actual File objects
  const [fileObjects, setFileObjects] = useState<Record<string, File>>({})
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [currentFile, setCurrentFile] = useState("")
  const [inputFile, setInputFile] = useState<File | null>(null)
  const [plotHtml, setPlotHtml] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [isDragging, setIsDragging] = useState(false)

  const [strID, setStrID] = useState<string | null>(null)
  const [strategy, setStrategy] = useState<string | null>(null)
  const [strategy_id, setStrategyId] = useState<string | null>(null)

  // API call related states
  const [accountId, setAccountId] = useState(45)
  const [side, setSide] = useState("buy")
  const [saveResult, setSaveResult] = useState("true")
  const [nTradeMax, setNTradeMax] = useState(2)
  const [assetType, setAssetType] = useState("currency")
  const [lot, setLot] = useState("mini")
  const [parsedStatement, setParsedStatement] = useState<any>(null)

  // Add a state for tracking if the chart is expanded
  const [isChartExpanded, setIsChartExpanded] = useState(false)

  const [isLimitationsCollapsed, setIsLimitationsCollapsed] = useState(false)

  // Add a new state variable for showing/hiding the Advanced Settings modal:
  const [showAdvancedSettingsModal, setShowAdvancedSettingsModal] = useState(false)

  // Add state variables for the Advanced Settings form values:
  const [populationSize, setPopulationSize] = useState("500")
  const [generations, setGenerations] = useState("100")
  const [mutationRate, setMutationRate] = useState("0.2")
  const [tournamentSize, setTournamentSize] = useState("5")

  // Add new state variables for trading modes
  const [selectedTradingMode, setSelectedTradingMode] = useState("OOTAAT")
  const [maxTrades, setMaxTrades] = useState("2")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedStrategy = localStorage.getItem("savedStrategy")
      setStrID(savedStrategy)
      setStrategy(savedStrategy)

      const id = localStorage.getItem("strategy_id")
      setStrategyId(id)

      if (savedStrategy) {
        try {
          const parsed = JSON.parse(savedStrategy)
          setParsedStatement(parsed)
        } catch (err) {
          console.error("Error parsing saved strategy:", err)
        }
      }
    }
  }, [])

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

      // Store the actual File object
      setFileObjects((prev) => ({
        ...prev,
        [file.name]: file,
      }))

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

  const [requiredTimeframes, setRequiredTimeframes] = useState([])

  useEffect(() => {
    const tf = JSON.parse(localStorage.getItem("timeframes_required") || "[]")
    setRequiredTimeframes(tf)
  }, [])

  // Helper function to match timeframes with filenames
  function matchesTimeframe(filename, timeframe) {
    // Convert filename to lowercase for case-insensitive matching
    const lowerFilename = filename.toLowerCase()
    const lowerTimeframe = timeframe.toLowerCase()

    console.log(`Checking if "${lowerFilename}" matches timeframe "${lowerTimeframe}"`)

    // Direct matching (e.g., "3h" in filename)
    if (lowerFilename.includes(lowerTimeframe)) {
      console.log("✅ Direct match found")
      return true
    }

    // Handle numeric equivalents
    // Map common timeframes to their minute equivalents
    const timeframeToMinutes = {
      "1min": 1,
      "5min": 5,
      "15min": 15,
      "20min": 20,
      "30min": 30,
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

    // Extract the minute value for the timeframe
    const minutes = timeframeToMinutes[lowerTimeframe]
    console.log(`Minutes value for ${lowerTimeframe}: ${minutes}`)

    if (minutes) {
      // Check if the filename contains the minute value
      const minutesStr = minutes.toString()
      const containsMinutes = lowerFilename.includes(minutesStr)
      console.log(`Checking if filename contains "${minutesStr}": ${containsMinutes}`)

      // Additional check: Make sure it's not part of another number
      // For example, "20" in "120" should not match "20m"
      const regex = new RegExp(`\\b${minutesStr}\\b`)
      const isStandaloneNumber = regex.test(lowerFilename)
      console.log(`Is "${minutesStr}" a standalone number: ${isStandaloneNumber}`)

      return containsMinutes
    }

    return false
  }

  // Updated handleRunBacktest function to use the new API structure
  const handleRunBacktest = async () => {
    if (!parsedStatement) {
      alert("Strategy statement is missing or not parsed!")
      return
    }

    if (requiredTimeframes.length > uploadedFiles.length) {
      alert("Not enough files uploaded for the required timeframes")
      return
    }

    try {
      setIsLoading(true)

      const timeframeFiles: Record<string, File> = {}

      // Directly map each required timeframe to the uploaded file in order
      requiredTimeframes.forEach((timeframe, index) => {
        const filename = uploadedFiles[index]
        if (filename && fileObjects[filename]) {
          timeframeFiles[timeframe] = fileObjects[filename]
        }
      })

      // Add unmatched remaining files to the form with filename as key (optional fallback)
      uploadedFiles.forEach((filename) => {
        if (!Object.values(timeframeFiles).includes(fileObjects[filename])) {
          const key = filename.split(".")[0]
          timeframeFiles[key] = fileObjects[filename]
        }
      })

      const result = await runBacktest({
        statement: parsedStatement,
        files: timeframeFiles,
      })

      if (result?.plot_html) {
        setPlotHtml(result.plot_html)
      } else {
        alert("Backtest failed or no chart returned")
      }
    } catch (error: any) {
      alert("Backtest Error: " + (error.message || "Unknown error"))
      console.error("Backtest API error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleDeleteFile = (fileName: string) => {
    setUploadedFiles(uploadedFiles.filter((file) => file !== fileName))

    // Also remove from fileObjects
    const newFileObjects = { ...fileObjects }
    delete newFileObjects[fileName]
    setFileObjects(newFileObjects)

    if (currentFile === fileName) {
      setCurrentFile("")
      setInputFile(null)
    }
  }

  const [dateRange, setDateRange] = useState("2024.01.02 - 2025.01.02")
  const [selectedInstruments, setSelectedInstruments] = useState(["USD/JPY"])
  const [accountDeposit, setAccountDeposit] = useState("1,000")
  const [currency, setCurrency] = useState("USD")
  const [leverage, setLeverage] = useState("1:1")
  const [leverageSliderValue, setLeverageSliderValue] = useState(1) // Add state for slider position

  // Handle account deposit change
  const handleAccountDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAccountDeposit(value)
  }

  // Get margin value from leverage string
  const getLeverageMargin = (leverageStr: string): number => {
    const ratio = Number.parseInt(leverageStr.split(":")[1])
    // For 1:1 leverage, margin should be 1.0 (100%)
    // For 1:2 leverage, margin should be 0.5 (50%)
    // For 1:10 leverage, margin should be 0.1 (10%)
    return ratio ? 1.0 / ratio : 0.09 // Default to 0.09 if parsing fails
  }

  // Handle leverage change
  const handleLeverageChange = (newLeverage: string) => {
    setLeverage(newLeverage)
  }

  // Handle slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    setLeverageSliderValue(value)

    const leverageMap: { [key: string]: string } = {
      "1": "1:1",
      "2": "1:2",
      "3": "1:5",
      "4": "1:10",
      "5": "1:20",
      "6": "1:25",
      "7": "1:30",
      "8": "1:50",
      "9": "1:75",
      "10": "1:100",
    }
    handleLeverageChange(leverageMap[value.toString()])
  }

  // Calculate thumb position as percentage
  const getThumbPosition = () => {
    return ((leverageSliderValue - 1) / (10 - 1)) * 100
  }

  const instruments = ["USD/JPY", "GBP/USD", "USD/CHF", "FTSE100", "US30", "NASDAQ"]

  const toggleInstrument = (instrument: string) => {
    if (selectedInstruments.includes(instrument)) {
      setSelectedInstruments(selectedInstruments.filter((i) => i !== instrument))
    } else {
      setSelectedInstruments([...selectedInstruments, instrument])
    }
  }

  // Function to save backtest settings via API
  const saveBacktestSettings = async () => {
    try {
      if (!strategy_id) {
        alert("No strategy ID found")
        return
      }

      setIsSaving(true)

      // Extract numeric value for API call
      const cash = Number.parseFloat(accountDeposit.replace(/,/g, ""))
      const margin = getLeverageMargin(leverage)

      // Create the data object with trading mode consideration
      const tradingtype: any = {
        margin: margin,
        lot: "mini",
        cash: cash,
        NewTrade: selectedTradingMode, // Add the selected trading mode
      }

      // Only add nTrade_max for MTOOTAAT mode
      if (selectedTradingMode === "MTOOTAAT") {
        tradingtype.nTrade_max = Number.parseInt(maxTrades)
      }

      console.log("Saving with margin:", margin, "from leverage:", leverage)
      console.log("Trading mode:", selectedTradingMode)
      console.log("Trading type data:", tradingtype)

      // Call the API
      await updateStrategyTradingType(Number.parseInt(strategy_id), tradingtype)

      // Show success message
      const successMessage = document.createElement("div")
      successMessage.className =
        "fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg z-50"
      successMessage.textContent = "Backtest settings saved successfully"
      document.body.appendChild(successMessage)

      setTimeout(() => {
        document.body.removeChild(successMessage)
      }, 3000)
    } catch (error) {
      console.error("Error saving backtest settings:", error)
      alert("Failed to save backtest settings")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#121420] text-white">
        <div className="hidden md:block">
          <Sidebar currentPage="home" />
        </div>

        <MobileSidebar currentPage="home" />

        <main className="flex-1 flex flex-col relative">
          {/* Chart area with light blue background */}
          {plotHtml ? (
            <div className="relative">
              <div
                className={`transition-all duration-500 ease-in-out ${isChartExpanded ? "fixed inset-0 z-50 bg-black" : "relative"}`}
              >
                <iframe
                  title="Plotly Chart"
                  style={{
                    width: "100%",
                    height: isChartExpanded ? "100vh" : "calc(100vh - 300px)",
                    border: "none",
                    backgroundColor: "#f8f8f8",
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
          ) : (
            <div className="w-full h-[calc(100vh-300px)] bg-[#f8f8f8]"></div>
          )}

          {/* Tabs */}
          <div className="flex w-full">
            {["strategy", "backtest", "optimisation", "properties"].map((tab) => (
              <button
                key={tab}
                className={`flex-1 py-3 text-center font-medium ${
                  activeTab === tab ? "bg-[#141721] text-[#85e1fe]" : "bg-[#1A1D2D] text-gray-400"
                }`}
                onClick={() => handleTabChange(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content area with overflow to allow scrolling */}
          <div className="flex-1 overflow-y-auto pb-[160px] bg-[#000000] ml-[63px]">
            {activeTab === "backtest" && (
              <div className="p-6 ml-[63px]">
                <div className="flex justify-between items-start mb-6">
                  {/* Left side - Dates */}
                  <div className="w-[30%]">
                    <label className="block text-sm text-gray-400 mb-2">Dates</label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="flex-1 bg-[#141721] border border-[#2b2e38] rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-white"
                      />
                      <button className="ml-2 bg-[#141721] p-3 rounded-md border border-[#2b2e38]">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="6" width="18" height="15" rx="2" stroke="white" strokeWidth="2" />
                          <path d="M3 10H21" stroke="white" strokeWidth="2" />
                          <path d="M8 3V7" stroke="white" strokeWidth="2" strokeLinecap="round" />
                          <path d="M16 3V7" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Right side - Instruments */}
                  <div className="w-[65%]">
                    <label className="block text-sm text-gray-400 mb-2">Instruments</label>
                    <div className="flex flex-wrap gap-2">
                      {instruments.map((instrument) => (
                        <button
                          key={instrument}
                          onClick={() => toggleInstrument(instrument)}
                          className={`px-4 py-2 rounded-md ${
                            selectedInstruments.includes(instrument)
                              ? "bg-[#85e1fe] text-black"
                              : "bg-[#141721] text-white border border-[#2b2e38]"
                          }`}
                        >
                          {instrument}
                        </button>
                      ))}
                      <button className="px-4 py-2 rounded-md bg-[#141721] text-white border border-[#2b2e38]">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M12 5V19"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M5 12H19"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#2b2e38] my-6"></div>

                <div className="flex justify-between items-start mb-6">
                  {/* Account Deposit */}
                  <div className="w-[30%]">
                    <label className="block text-sm text-gray-400 mb-2">Account Deposit</label>
                    <input
                      type="text"
                      value={accountDeposit}
                      onChange={handleAccountDepositChange}
                      className="w-full bg-[#141721] border border-[#2b2e38] rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-white"
                    />
                  </div>

                  {/* Currency */}
                  <div className="w-[30%]">
                    <label className="block text-sm text-gray-400 mb-2">Currency</label>
                    <div className="relative">
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full bg-[#141721] border border-[#2b2e38] rounded-md p-3 pr-10 appearance-none focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-white"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="JPY">JPY</option>
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

                  {/* Leverage/Margin Assumptions */}
                  <div className="w-[35%]">
                    <label className="block text-sm text-gray-400 mb-2">Leverage/Margin Assumptions</label>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white">1:1</span>
                      <span className="text-xs text-white">1:2</span>
                      <span className="text-xs text-white">1:5</span>
                      <span className="text-xs text-white">1:10</span>
                      <span className="text-xs text-white">1:20</span>
                      <span className="text-xs text-white">1:25</span>
                      <span className="text-xs text-white">1:30</span>
                      <span className="text-xs text-white">1:50</span>
                      <span className="text-xs text-white">1:75</span>
                      <span className="text-xs text-white">1:100</span>
                    </div>
                    <div className="relative w-full h-1 bg-[#2b2e38] rounded-full">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={leverageSliderValue}
                        onChange={handleSliderChange}
                        className="absolute w-full h-1 opacity-0 cursor-pointer"
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#85e1fe] rounded-full transition-all duration-200 ease-out"
                        style={{ left: `calc(${getThumbPosition()}% - 6px)` }}
                      ></div>
                    </div>
                    <div className="mt-2 text-center">
                      <span className="text-sm text-[#85e1fe] font-medium">{leverage}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#2b2e38] my-6"></div>

                {/* Trading Mode Section */}
                <div className="mb-6">
                  <label className="block text-sm text-gray-400 mb-4">Trading Mode</label>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {[
                      { value: "OOTAAT", label: "OOTAAT" },
                      { value: "CLOSE_AND_OPEN", label: "CLOSE & OPEN" },
                      { value: "MTOOTAAT", label: "MTOOTAAT" },
                    ].map((mode) => (
                      <button
                        key={mode.value}
                        onClick={() => setSelectedTradingMode(mode.value)}
                        className={`px-4 py-2 rounded-md transition-colors ${
                          selectedTradingMode === mode.value
                            ? "bg-[#85e1fe] text-black"
                            : "bg-[#141721] text-white border border-[#2b2e38] hover:border-[#85e1fe]"
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>

                  {/* Max Trades Input for MTOOTAAT */}
                  {selectedTradingMode === "MTOOTAAT" && (
                    <div className="w-[30%]">
                      <label className="block text-sm text-gray-400 mb-2">Max parallel trades</label>
                      <input
                        type="number"
                        value={maxTrades}
                        onChange={(e) => setMaxTrades(e.target.value)}
                        placeholder="e.g., 2"
                        min="1"
                        className="w-full bg-[#141721] border border-[#2b2e38] rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-white"
                      />
                    </div>
                  )}

                  {/* Trading Mode Descriptions */}
                  <div className="mt-4 p-3 bg-[#141721] rounded-md border border-[#2b2e38]">
                    <div className="text-xs text-gray-400">
                      {selectedTradingMode === "OOTAAT" && (
                        <p>
                          <strong>OOTAAT:</strong> One Order Type At A Time mode - Only one position can be open at any
                          given time.
                        </p>
                      )}
                      {selectedTradingMode === "CLOSE_AND_OPEN" && (
                        <p>
                          <strong>CLOSE & OPEN:</strong> Allows closing existing and opening new positions
                          simultaneously.
                        </p>
                      )}
                      {selectedTradingMode === "MTOOTAAT" && (
                        <p>
                          <strong>MTOOTAAT:</strong> Multiple 'One Order Type At A Time' mode - System enforces the
                          maximum number of parallel trades based on your input or margin requirements.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="w-full mt-6 flex justify-end">
                  <button
                    className="bg-[#85e1fe] hover:bg-[#6bcae2] text-black rounded-full px-8 py-3 text-sm font-medium flex items-center"
                    onClick={saveBacktestSettings}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 mr-2"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16L21 8V19C21 20.1046 20.1046 21 19 21Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M17 21V13H7V21"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M7 3V8H15"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Save Settings
                      </>
                    )}
                  </button>
                </div>

                {/* Required Timeframes Upload Section */}
              </div>
            )}

            {activeTab === "optimisation" && (
              <div className="p-4 bg-[#000000]">
                <div className="ml-[63px]">
                  {/* Defaults Section */}
                  <div className="mb-6">
                    <h3 className="text-white text-base font-medium mb-4">Defaults</h3>

                    <div className="flex justify-between items-center mb-4">
                      <div className="text-white">Optimized parameter</div>
                      <div className="relative">
                        <select
                          className="appearance-none bg-transparent text-white pr-8 focus:outline-none"
                          defaultValue="Balance"
                        >
                          <option value="Balance">Balance</option>
                          <option value="Profit">Profit</option>
                          <option value="Drawdown">Drawdown</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M6 9l6 6 6-6"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <input type="checkbox" id="genetic-algorithm" className="mr-2" />
                        <label htmlFor="genetic-algorithm" className="text-white">
                          Genetic algorithm
                        </label>
                      </div>
                      <button
                        className="bg-transparent border border-[#2b2e38] text-white rounded-full px-4 py-2 text-sm"
                        onClick={() => setShowAdvancedSettingsModal(true)}
                      >
                        Advanced Settings
                      </button>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <input type="checkbox" id="duration-limit" className="mr-2" />
                        <label htmlFor="duration-limit" className="text-white">
                          Duration Limit
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="text"
                          value="5h 30m"
                          className="bg-transparent border border-[#2b2e38] text-white rounded-md px-3 py-2 w-24 text-center"
                          readOnly
                        />
                        <button className="ml-2 bg-transparent border border-[#2b2e38] text-white rounded-md p-2">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <rect x="3" y="6" width="18" height="15" rx="2" stroke="white" strokeWidth="2" />
                            <path d="M3 10H21" stroke="white" strokeWidth="2" />
                            <path d="M8 3V7" stroke="white" strokeWidth="2" strokeLinecap="round" />
                            <path d="M16 3V7" stroke="white" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Limitations Section - Only show when not collapsed */}
                  {!isLimitationsCollapsed && (
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-white text-base font-medium">Limitations</h3>
                        <h3 className="text-white text-base font-medium">Value</h3>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <input type="checkbox" id="balance-minimum" className="mr-2" />
                            <label htmlFor="balance-minimum" className="text-white">
                              Balance minimum
                            </label>
                          </div>
                          <div className="text-white">200</div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <input type="checkbox" id="profit-maximum" className="mr-2" />
                            <label htmlFor="profit-maximum" className="text-white">
                              Profit maximum
                            </label>
                          </div>
                          <div className="text-white">10000</div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <input type="checkbox" id="minimal-margin" className="mr-2" />
                            <label htmlFor="minimal-margin" className="text-white">
                              Minimal margin level %
                            </label>
                          </div>
                          <div className="text-white">30</div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <input type="checkbox" id="maximal-drawdown" className="mr-2" />
                            <label htmlFor="maximal-drawdown" className="text-white">
                              Maximal drawdown
                            </label>
                          </div>
                          <div className="text-white">70</div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <input type="checkbox" id="consecutive-loss" className="mr-2" />
                            <label htmlFor="consecutive-loss" className="text-white">
                              Consecutive loss
                            </label>
                          </div>
                          <div className="text-white">500</div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <input type="checkbox" id="consecutive-loss-trades" className="mr-2" />
                            <label htmlFor="consecutive-loss-trades" className="text-white">
                              Consecutive loss trades
                            </label>
                          </div>
                          <div className="text-white">10</div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <input type="checkbox" id="consecutive-win" className="mr-2" />
                            <label htmlFor="consecutive-win" className="text-white">
                              Consecutive win
                            </label>
                          </div>
                          <div className="text-white">1000</div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <input type="checkbox" id="consecutive-win-trades" className="mr-2" />
                            <label htmlFor="consecutive-win-trades" className="text-white">
                              Consecutive win trades
                            </label>
                          </div>
                          <div className="text-white">30</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-6">
                    <button
                      className="text-white hover:text-gray-300"
                      onClick={() => setIsLimitationsCollapsed(!isLimitationsCollapsed)}
                    >
                      {isLimitationsCollapsed ? "Expand" : "Collapse"}
                    </button>
                    <div className="flex space-x-2">
                      <button className="bg-transparent border border-[#2b2e38] text-white rounded-full px-6 py-2">
                        Reset
                      </button>
                      <button className="bg-[#85e1fe] text-black rounded-full px-6 py-2">Save</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab !== "backtest" && activeTab !== "optimisation" && (
              <div className="p-4">
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
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            ></path>
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
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                  ></path>
                                </svg>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      <p className="text-xs text-gray-400">
                        Please upload data files for all required timeframes. Each filename should include the timeframe
                        (e.g., "data_3h.csv") or its minute equivalent (e.g., "180" for 3h).
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
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".py,.csv"
                      className="hidden"
                    />
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
                                      <span className="text-xs text-yellow-400">
                                        Doesn't match any required timeframe
                                      </span>
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
                              {
                                uploadedFiles.filter((file) =>
                                  requiredTimeframes.some((tf) => matchesTimeframe(file, tf)),
                                ).length
                              }{" "}
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
            )}
          </div>

          {/* Sticky footer with progress and buttons */}
          <div className="absolute bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-10 ml-[63px]">
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
                className="flex-1 py-3 bg-[#141721] rounded-full text-white hover:bg-[#2B2E38]"
                onClick={handleRunBacktest}
              >
                Run Backtest
              </button>
              <button className="flex-1 py-3 bg-[#141721] rounded-full text-white hover:bg-[#2B2E38]">
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
        {isChartExpanded && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggleChartExpansion} />
        )}

        {/* Advanced Settings Modal */}
        {showAdvancedSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#f5f5f5] rounded-lg shadow-lg w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-black">Advanced Settings</h2>
                <button
                  onClick={() => setShowAdvancedSettingsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Population size</label>
                  <input
                    type="text"
                    value={populationSize}
                    onChange={(e) => setPopulationSize(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Generations</label>
                  <input
                    type="text"
                    value={generations}
                    onChange={(e) => setGenerations(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Mutation rate</label>
                  <input
                    type="text"
                    value={mutationRate}
                    onChange={(e) => setMutationRate(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Tournament size</label>
                  <input
                    type="text"
                    value={tournamentSize}
                    onChange={(e) => setTournamentSize(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-black"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAdvancedSettingsModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-full text-black"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Save the settings here
                    setShowAdvancedSettingsModal(false)
                  }}
                  className="px-6 py-3 bg-[#85e1fe] rounded-full text-black"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
