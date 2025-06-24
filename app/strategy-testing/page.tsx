"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import {
  fetchStatementDetail,
  runBacktest,
  runOptimisation,
  updateStrategyTradingType,
  saveOptimisationInput,
} from "../AllApiCalls" // Import saveOptimisationInput
import { X } from "lucide-react"
import AuthGuard from "@/hooks/useAuthGuard"
import { StrategyTab } from "@/components/strategy-tab"
import { BacktestTab } from "@/components/backtest-tab"
import { OptimisationTab } from "@/components/optimisation-tab"
import { PropertiesTab } from "@/components/properties-tab"
import { AdvancedSettingsModalContent } from "@/components/advanced-settings-modal-content"

export default function StrategyTestingPage() {
  const [activeTab, setActiveTab] = useState("strategy")
  const [showIframe, setShowIframe] = useState(false) // This state is not used in the provided code, keeping it for consistency.

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
  const [isLoading2, setIsLoading2] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [isDragging, setIsDragging] = useState(false)

  const [strID, setStrID] = useState<string | null>(null)
  const [strategy, setStrategy] = useState<string | null>(null)
  const [strategy_id, setStrategyId] = useState<string | null>(null)

  // API call related states (some are not used in the provided code, keeping for consistency)
  const [accountId, setAccountId] = useState(45)
  const [side, setSide] = useState("buy")
  const [saveResult, setSaveResult] = useState("true")
  const [nTradeMax, setNTradeMax] = useState(2)
  const [assetType, setAssetType] = useState("currency")
  const [lot, setLot] = useState("mini")
  const [parsedStatement, setParsedStatement] = useState<any>(null)

  // Add a state for tracking if the chart is expanded
  const [isChartExpanded, setIsChartExpanded] = useState(false)

  const [isLimitationsCollapsed, setIsLimitationsCollapsed] = useState(true)

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

  // New states for OptimisationTab
  const [selectedMaximiseOption, setSelectedMaximiseOption] = useState<string>("")
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>("")

  // Add new states for optimisation result and heatmap
  const [optimisationResult, setOptimisationResult] = useState<any>(null)
  const [plotHeatmapHtml, setPlotHeatmapHtml] = useState<string | null>(null)
  const [showOptimisationResults, setShowOptimisationResults] = useState(false)

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

      // Initialize optimisation settings from localStorage
      const optimisationFormString = localStorage.getItem("optimisation_form")
      if (optimisationFormString) {
        try {
          const optimisationForm = JSON.parse(optimisationFormString)
          setSelectedMaximiseOption(optimisationForm.maximise_options[0] || "")
          setSelectedAlgorithm(optimisationForm.default_algorithm || "")
          setPopulationSize(optimisationForm.algorithm_defaults.population_size.toString())
          setGenerations(optimisationForm.algorithm_defaults.generations.toString())
          setMutationRate(optimisationForm.algorithm_defaults.mutation_rate.toString())
          setTournamentSize(optimisationForm.algorithm_defaults.tournament_size.toString())
        } catch (error) {
          console.error("Error parsing optimisation_form from localStorage:", error)
        }
      }
    }
  }, [])

  useEffect(() => {
    const checkQueryParams = async () => {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search)
        const id = urlParams.get("id")

        if (id) {
          try {
            const strategyData = await fetchStatementDetail(id)

            // Store the fetched data in localStorage
            localStorage.setItem("savedStrategy", JSON.stringify(strategyData))

            // Check if timeframes_required exists in the response and store it
            if (strategyData.timeframes_required) {
              localStorage.setItem("timeframes_required", JSON.stringify(strategyData.timeframes_required))
              setRequiredTimeframes(strategyData.timeframes_required)
            }
            if (strategyData.optimisation_form) {
              localStorage.setItem("optimisation_form", JSON.stringify(strategyData.optimisation_form))
            }
            if (strategyData.id) {
              localStorage.setItem("strategy_id", strategyData.id)
            }

            // Update component state
            setStrID(JSON.stringify(strategyData))
            setStrategy(JSON.stringify(strategyData))
            setParsedStatement(strategyData)

            if (strategyData.optimisation_form) {
              localStorage.setItem("optimisation_form", JSON.stringify(strategyData.optimisation_form))
              const optimisationForm = strategyData.optimisation_form
              setSelectedMaximiseOption(optimisationForm.maximise_options[0] || "")
              setSelectedAlgorithm(optimisationForm.default_algorithm || "")
              setPopulationSize(optimisationForm.algorithm_defaults.population_size.toString())
              setGenerations(optimisationForm.algorithm_defaults.generations.toString())
              setMutationRate(optimisationForm.algorithm_defaults.mutation_rate.toString())
              setTournamentSize(optimisationForm.algorithm_defaults.tournament_size.toString())
            }
          } catch (error: any) {
            alert("Failed to fetch strategy details: " + error.message)
          }
        }
      }
    }

    checkQueryParams()
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

  const [requiredTimeframes, setRequiredTimeframes] = useState<string[]>([])

  useEffect(() => {
    const tf = JSON.parse(localStorage.getItem("timeframes_required") || "[]")
    setRequiredTimeframes(tf)
  }, [])

  // Helper function to match timeframes with filenames
  function matchesTimeframe(filename: string, timeframe: string) {
    // Convert filename to lowercase for case-insensitive matching
    const lowerFilename = filename.toLowerCase()
    const lowerTimeframe = timeframe.toLowerCase()

    // Direct matching (e.g., "3h" in filename)
    if (lowerFilename.includes(lowerTimeframe)) {
      console.log("✅ Direct match found")
      return true
    }

    // Handle numeric equivalents
    // Map common timeframes to their minute equivalents
    const timeframeToMinutes: { [key: string]: number } = {
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

    if (minutes) {
      // Check if the filename contains the minute value
      const minutesStr = minutes.toString()
      const containsMinutes = lowerFilename.includes(minutesStr)

      // Additional check: Make sure it's not part of another number
      // For example, "20" in "120" should not match "20m"
      const regex = new RegExp(`\\b${minutesStr}\\b`)
      const isStandaloneNumber = regex.test(lowerFilename)

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

      if (result?.plot_trades_html) {
        setPlotHtml(result.plot_trades_html)
      } else {
        alert("Backtest failed or no chart returned")
      }
    } catch (error: any) {
      alert("Backtest Error: " + (error.message || "Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleOptimisation = async () => {
    if (!parsedStatement) {
      alert("Strategy statement is missing or not parsed!")
      return
    }

    if (requiredTimeframes.length > uploadedFiles.length) {
      alert("Not enough files uploaded for the required timeframes")
      return
    }

    try {
      setIsLoading2(true)

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

      // Construct Hyper-parameters from state
      const hyperParameters = {
        population_size: Number(populationSize),
        generations: Number(generations),
        mutation_rate: Number(mutationRate),
        tournament_size: Number(tournamentSize),
      }

      // Construct Misc object
      const misc = {
        Algorithm: selectedAlgorithm,
        Maximise: selectedMaximiseOption,
        "Hyper-parameters": hyperParameters,
      }

      // Merge misc into statement for the API call
      const optimisationStatement = {
        ...parsedStatement,
        optimisation_misc: misc,
      }

      const result = await runOptimisation({
        statement: optimisationStatement,
        files: timeframeFiles,
      })

      // Store the result and heatmap
      setOptimisationResult(result)
      setShowOptimisationResults(true)
      setActiveTab("optimisation")
      if (result?.plot_heatmap_html) {
        setPlotHeatmapHtml(result.plot_heatmap_html)
      } else {
        setPlotHeatmapHtml(null)
      }
      // Optionally, also set plotHtml if you want to show the main plot elsewhere
      if (result?.plot_trades_html) {
        setPlotHtml(result.plot_trades_html)
      }
    } catch (error: any) {
      alert("Optimisation Error: " + (error.message || "Unknown error"))
    } finally {
      setIsLoading2(false)
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

      await updateStrategyTradingType(Number.parseInt(strategy_id), tradingtype)

      // Show success message
      // const successMessage = document.createElement("div")
      // successMessage.className =
      //   "fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg z-50"
      // successMessage.textContent = "Backtest settings saved successfully"
      // document.body.appendChild(successMessage)

      // setTimeout(() => {
      //   document.body.removeChild(successMessage)
      // }, 3000)
    } catch (error) {
      console.error("Error saving backtest settings:", error)
      alert("Failed to save backtest settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAdvancedSettings = () => {
    // Implement saving logic for advanced settings here
    console.log("Saving advanced settings:", {
      populationSize,
      generations,
      mutationRate,
      tournamentSize,
    })
    setShowAdvancedSettingsModal(false)
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
            {activeTab === "strategy" && (
              <StrategyTab
                selectedStrategy={selectedStrategy}
                setSelectedStrategy={setSelectedStrategy}
                requiredTimeframes={requiredTimeframes}
                uploadedFiles={uploadedFiles}
                matchesTimeframe={matchesTimeframe}
                handleFileChange={handleFileChange}
                handleDeleteFile={handleDeleteFile}
                fileInputRef={fileInputRef}
                handleClick={handleClick}
                isDragging={isDragging}
                handleDragOver={handleDragOver}
                handleDragLeave={handleDragLeave}
                handleDrop={handleDrop}
                setShowSuccessModal={setShowSuccessModal}
                currentFile={currentFile}
              />
            )}

            {activeTab === "backtest" && (
              <BacktestTab
                dateRange={dateRange}
                setDateRange={setDateRange}
                selectedInstruments={selectedInstruments}
                toggleInstrument={toggleInstrument}
                instruments={instruments}
                accountDeposit={accountDeposit}
                handleAccountDepositChange={handleAccountDepositChange}
                currency={currency}
                setCurrency={setCurrency}
                leverage={leverage}
                leverageSliderValue={leverageSliderValue}
                handleSliderChange={handleSliderChange}
                getThumbPosition={getThumbPosition}
                selectedTradingMode={selectedTradingMode}
                setSelectedTradingMode={setSelectedTradingMode}
                maxTrades={maxTrades}
                setMaxTrades={setMaxTrades}
                saveBacktestSettings={saveBacktestSettings}
                isSaving={isSaving}
              />
            )}

            {activeTab === "optimisation" && showOptimisationResults && optimisationResult && (
              <div className="p-6 bg-[#000000] text-white min-h-[600px]">
                {/* Results Table */}
                <div className="overflow-x-auto mb-8">
                  <table className="min-w-full text-xs border-separate border-spacing-y-2">
                    <thead>
                      <tr className="bg-[#1A1D2D] text-white">
                        <th className="px-2 py-2">Pass</th>
                        <th className="px-2 py-2">Profit</th>
                        <th className="px-2 py-2">Total trades</th>
                        <th className="px-2 py-2">Profit factor</th>
                        <th className="px-2 py-2">Expected Pay</th>
                        <th className="px-2 py-2">Drawdown $</th>
                        <th className="px-2 py-2">Drawdown %</th>
                        <th className="px-2 py-2">Inputs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {optimisationResult?.table?.map((row: any, idx: number) => (
                        <tr key={idx} className="bg-[#141721] text-white">
                          <td className="px-2 py-2">{row.pass || idx + 1}</td>
                          <td className="px-2 py-2">{row.profit}</td>
                          <td className="px-2 py-2">{row.total_trades}</td>
                          <td className="px-2 py-2">{row.profit_factor}</td>
                          <td className="px-2 py-2">{row.expected_pay}</td>
                          <td className="px-2 py-2">{row.drawdown_dollar}</td>
                          <td className="px-2 py-2">{row.drawdown_percent}</td>
                          <td className="px-2 py-2 max-w-[200px] truncate" title={row.inputs}>{row.inputs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Scatter Plot (if available) */}
                {optimisationResult?.plot_heatmap_html && (
                  <div className="mb-8">
                    <h3 className="mb-2 text-lg font-semibold text-white">Scatter Plot</h3>
                    <iframe
                      title="Scatter Plot"
                      style={{ width: "100%", height: "400px", border: "none", backgroundColor: "#f8f8f8" }}
                      srcDoc={optimisationResult.plot_heatmap_html}
                    />
                  </div>
                )}
                {/* Heatmap Plot (if available) */}
                {/* {plotHeatmapHtml && (
                  <div className="mb-8">
                    <h3 className="mb-2 text-lg font-semibold text-[#85e1fe]">Optimisation Heatmap</h3>
                    <iframe
                      title="Optimisation Heatmap"
                      style={{ width: "100%", height: "400px", border: "none", backgroundColor: "#f8f8f8" }}
                      srcDoc={plotHeatmapHtml}
                    />
                  </div>
                )} */}
              </div>
            )}
            {activeTab === "optimisation" && (!showOptimisationResults || !optimisationResult) && (
              <OptimisationTab
                isLimitationsCollapsed={isLimitationsCollapsed}
                setIsLimitationsCollapsed={setIsLimitationsCollapsed}
                setShowAdvancedSettingsModal={setShowAdvancedSettingsModal}
                populationSize={populationSize} // Pass advanced settings props
                setPopulationSize={setPopulationSize}
                generations={generations}
                setGenerations={setGenerations}
                mutationRate={mutationRate}
                setMutationRate={setMutationRate}
                tournamentSize={tournamentSize}
                setTournamentSize={setTournamentSize}
                selectedMaximiseOption={selectedMaximiseOption} // New prop
                setSelectedMaximiseOption={setSelectedMaximiseOption} // New prop
                selectedAlgorithm={selectedAlgorithm} // New prop
                setSelectedAlgorithm={setSelectedAlgorithm} // New prop
              />
            )}

            {activeTab === "properties" && (
              <PropertiesTab parsedStatement={parsedStatement} saveOptimisationInput={saveOptimisationInput} />
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
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Running Backtest...
                  </>
                ) : (
                  "Run Backtest"
                )}
              </button>
              <button
                onClick={handleOptimisation}
                className="flex-1 py-3 bg-[#141721] rounded-full text-white hover:bg-[#2B2E38]"
                disabled={isLoading2}
              >
                {isLoading2 ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Running Optimisation...
                  </>
                ) : (
                  "Run Optimisation"
                )}
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
                      d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
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
        {isLoading2 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#f5f5f5] rounded-lg shadow-lg w-full max-w-md p-6">
              <div className="flex flex-col items-center py-6">
                <div className="w-24 h-24 relative mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-[#e6f7ff]"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-[#85e1fe] border-t-transparent animate-spin"></div>
                </div>
                <p className="text-xl font-medium text-black">Running Optimisation...</p>
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
            <AdvancedSettingsModalContent
              populationSize={populationSize}
              setPopulationSize={setPopulationSize}
              generations={generations}
              setGenerations={setGenerations}
              mutationRate={mutationRate}
              setMutationRate={setMutationRate}
              tournamentSize={tournamentSize}
              setTournamentSize={setTournamentSize}
              onClose={() => setShowAdvancedSettingsModal(false)}
              onSave={handleSaveAdvancedSettings}
            />
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
