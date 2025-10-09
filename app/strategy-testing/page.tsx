"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import {
  fetchStatementDetail,
  runBacktest,
  runBacktestWithMetaAPI,
  runOptimisation,
  updateStrategyTradingType,
  editStrategy,
  saveOptimisationInput,
  getOptimisationStatus,
  getOptimizationResults,
  getOptimizationResultDetail,
  deleteOptimizationResult,
  getStrategyOptimizationResults,
  runWalkForwardOptimisation,
  getWalkForwardOptimizationResults,
  getWalkForwardOptimizationResultDetail,
  deleteWalkForwardOptimizationResult,
  getStrategyWalkForwardOptimizationResults,
  // New optimization droplets API functions
  getOptimizationCosts,
  createOptimizationJob,
  getOptimizationJob,
  cancelOptimizationJob,
  getWalkForwardDropletResults,
  listStrategyWalkForwardJobs,
} from "../AllApiCalls" // Import new functions
import { X } from "lucide-react"
import AuthGuard from "@/hooks/useAuthGuard"
import { StrategyTab } from "@/components/strategy-tab"
import { BacktestTab } from "@/components/backtest-tab"
import { OptimisationTab } from "@/components/optimisation-tab"
import { PropertiesTab } from "@/components/properties-tab"
import { AdvancedSettingsModalContent } from "@/components/advanced-settings-modal-content"
import { PreviousOptimisationView } from '@/components/PreviousOptimisationView'
import { OptimisationHistoryList } from '@/components/OptimisationHistoryList'
import { WalkForwardOptimizationResults } from '@/components/walk-forward-optimization-results'
import { WalkForwardOptimisationView } from "@/components/walk-forward-optimization-results-view";
import { TradesSummary } from "@/components/trades-summary";
import { MetaAPIConfig, type MetaAPIConfig as MetaAPIConfigType } from "@/components/metaapi-config";
// New optimization droplets components
import { OptimizationCostDialog } from "@/components/optimization-cost-dialog"

export default function StrategyTestingPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("strategy")
  const [showIframe, setShowIframe] = useState(false) // This state is not used in the provided code, keeping it for consistency.

  const [selectedStrategy, setSelectedStrategy] = useState("xauscalper.py")
  // MetaAPI Configuration states (replacing file upload states)
  const [metaAPIConfig, setMetaAPIConfig] = useState<MetaAPIConfigType | null>(null)
  const [useMetaAPI, setUseMetaAPI] = useState(true) // Toggle between MetaAPI and file upload
  // Legacy file upload states (kept for backward compatibility)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
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
  const [selectedTradingMode, setSelectedTradingMode] = useState("MTOOTAAT")
  const [maxTrades, setMaxTrades] = useState("1")
  
  // Add state variables for TradingType configuration
  const [commission, setCommission] = useState(0.00007)
  const [assetType, setAssetType] = useState("gold")

  // New states for OptimisationTab
  const [selectedMaximiseOption, setSelectedMaximiseOption] = useState<string>("")
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>("")

  // Add new states for optimisation result and heatmap
  const [optimisationResult, setOptimisationResult] = useState<any>(null)
  const [plotHeatmapHtml, setPlotHeatmapHtml] = useState<string | null>(null)
  const [showOptimisationResults, setShowOptimisationResults] = useState(false)

  // Add new state variables for optimization results management
  const [optimizationResults, setOptimizationResults] = useState<any[]>([])
  const [currentOptimizationId, setCurrentOptimizationId] = useState<string | null>(null)
  const [optimizationStatus, setOptimizationStatus] = useState<string>("")
  const [optimisationMessage, setOptimisationMessage] = useState<string>("")
  const [optimisationStdout, setOptimisationStdout] = useState<string>("")
  const [optimisationStderr, setOptimisationStderr] = useState<string>("")
  const [optimizationTaskId, setOptimizationTaskId] = useState<string | null>(null)
  const [showOptimizationHistory, setShowOptimizationHistory] = useState(false)
  const [selectedOptimizationResult, setSelectedOptimizationResult] = useState<any>(null)

  // Add polling interval for optimization status
  const [statusPollingInterval, setStatusPollingInterval] = useState<NodeJS.Timeout | null>(null)

  // Add state for top-level optimisation tab and selected result
  const [optimisationTab, setOptimisationTab] = useState<'results' | 'graph' | 'report'>('results');
  const [selectedOptimisationRow, setSelectedOptimisationRow] = useState<any>(null);

  const [showPreviousOptimisationView, setShowPreviousOptimisationView] = useState(false);

  const [showOptimisationHistory, setShowOptimisationHistory] = useState(false);
  const [selectedOptimisationDetail, setSelectedOptimisationDetail] = useState(null);

  // Walk Forward Optimization states
  const [isLoading3, setIsLoading3] = useState(false);
  const [walkForwardOptimizationResults, setWalkForwardOptimizationResults] = useState<any[]>([]);
  const [showWalkForwardOptimizationResults, setShowWalkForwardOptimizationResults] = useState(false);
  const [selectedWalkForwardResult, setSelectedWalkForwardResult] = useState<any>(null);
  const [walkForwardDetailResult, setWalkForwardDetailResult] = useState<any>(null);

  // Add trades summary states
  const [showTradesSummary, setShowTradesSummary] = useState(false);
  const [tradesData, setTradesData] = useState({
    tradesCsv: '',
    tradesCsvFilename: '',
    tradesCsvDownloadUrl: '',
    stdout: '',
    stderr: ''
  });

  // Add progress bar states
  const [progress, setProgress] = useState(0); // For backtest
  const [progress2, setProgress2] = useState(0); // For optimisation
  const [progress3, setProgress3] = useState(0); // For walk forward optimisation

  // Animate progress bar for backtest
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isLoading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 95) return prev + Math.random() * 5 + 1; // Animate up to 95%
          return prev;
        });
      }, 120);
    } else if (!isLoading && progress > 0) {
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  // Animate progress bar for optimisation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isLoading2) {
      setProgress2(0);
      interval = setInterval(() => {
        setProgress2((prev) => {
          if (prev < 95) return prev + Math.random() * 5 + 1;
          return prev;
        });
      }, 120);
    } else if (!isLoading2 && progress2 > 0) {
      setProgress2(100);
      setTimeout(() => setProgress2(0), 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading2]);

  // Animate progress bar for walk forward optimisation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isLoading3) {
      setProgress3(0);
      interval = setInterval(() => {
        setProgress3((prev) => {
          if (prev < 95) return prev + Math.random() * 5 + 1;
          return prev;
        });
      }, 120);
    } else if (!isLoading3 && progress3 > 0) {
      setProgress3(100);
      setTimeout(() => setProgress3(0), 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading3]);

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
          console.log("🔍 DEBUG: Loaded strategy from localStorage:", parsed)
          console.log("🔍 DEBUG: TradingSession in loaded strategy:", parsed.TradingSession)
          setParsedStatement(parsed)
          
          // Load TradingType settings from the strategy
          if (parsed && parsed.TradingType) {
            console.log("🔍 Loading TradingType settings from strategy:", parsed.TradingType)
            setSelectedTradingMode(parsed.TradingType.NewTrade || "MTOOTAAT")
            setMaxTrades(parsed.TradingType.nTrade_max?.toString() || "1")
            setAccountDeposit(parsed.TradingType.cash?.toString() || "100000")
            setLot(parsed.TradingType.lot || "mini")
            
            // Load additional TradingType configuration values
            // Use dynamic commission from the strategy or default
            const currentCommission = parsed.TradingType.commission || 0.00007
            console.log("🔍 Commission update check:", { currentCommission })
            setCommission(currentCommission)
            setAssetType(parsed.TradingType.Asset_type || "gold")
            
            // Update the parsed statement with the dynamic commission value
            const updatedStatement = {
              ...parsed,
              TradingType: {
                ...parsed.TradingType,
                commission: Number.parseFloat(currentCommission),
                asset_type: parsed.TradingType.asset_type || "gold"
              }
            }
            setParsedStatement(updatedStatement)
            localStorage.setItem("savedStrategy", JSON.stringify(updatedStatement))
            console.log("🔍 Updated parsed statement with correct commission:", updatedStatement.TradingType)
            
            // Calculate leverage from margin
            if (parsed.TradingType.margin) {
              const margin = parsed.TradingType.margin
              const leverage = margin === 1.0 ? "1:1" : 
                             margin === 0.5 ? "1:2" : 
                             margin === 0.2 ? "1:5" : 
                             margin === 0.1 ? "1:10" : 
                             margin === 0.05 ? "1:20" : 
                             margin === 0.04 ? "1:25" : 
                             margin === 0.033 ? "1:30" : 
                             margin === 0.02 ? "1:50" : 
                             margin === 0.013 ? "1:75" : 
                             margin === 0.01 ? "1:100" : "1:1"
              setLeverage(leverage)
              
              // Set slider value based on leverage
              const leverageMap: { [key: string]: number } = {
                "1:1": 1, "1:2": 2, "1:5": 3, "1:10": 4, "1:20": 5,
                "1:25": 6, "1:30": 7, "1:50": 8, "1:75": 9, "1:100": 10
              }
              setLeverageSliderValue(leverageMap[leverage] || 1)
            }
          }
        } catch (err) {
          console.error("Error parsing saved strategy:", err)
        }
      }

      // Initialize optimisation settings from localStorage
      const optimisationFormString = localStorage.getItem("optimisation_form")
      if (optimisationFormString) {
        try {
          const optimisationForm = JSON.parse(optimisationFormString)
          
          // Add null checks and fallback values
          const maximiseOpts = optimisationForm.maximise_options || []
          const algorithmDefaults = optimisationForm.algorithm_defaults || {}
          
          if (maximiseOpts.length > 0) {
            setSelectedMaximiseOption(maximiseOpts[0] || "")
          }
          if (optimisationForm.default_algorithm) {
            setSelectedAlgorithm(optimisationForm.default_algorithm || "")
          }
          setPopulationSize(algorithmDefaults.population_size?.toString() || "100")
          setGenerations(algorithmDefaults.generations?.toString() || "50")
          setMutationRate(algorithmDefaults.mutation_rate?.toString() || "0.1")
          setTournamentSize(algorithmDefaults.tournament_size?.toString() || "3")
        } catch (error) {
          console.error("Error parsing optimisation_form from localStorage:", error)
          // Set default values if parsing fails
          setSelectedMaximiseOption("Return [%]")
          setSelectedAlgorithm("Genetic Algorithm")
          setPopulationSize("100")
          setGenerations("50")
          setMutationRate("0.1")
          setTournamentSize("3")
        }
      } else {
        // Set default values if no optimisation_form exists
        setSelectedMaximiseOption("Return [%]")
        setSelectedAlgorithm("Genetic Algorithm")
        setPopulationSize("100")
        setGenerations("50")
        setMutationRate("0.1")
        setTournamentSize("3")
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
              const optimisationForm = strategyData.optimisation_form
              
              // Add null checks and fallback values
              const maximiseOpts = optimisationForm.maximise_options || []
              const algorithmDefaults = optimisationForm.algorithm_defaults || {}
              
              if (maximiseOpts.length > 0) {
                setSelectedMaximiseOption(maximiseOpts[0] || "")
              }
              if (optimisationForm.default_algorithm) {
                setSelectedAlgorithm(optimisationForm.default_algorithm || "")
              }
              setPopulationSize(algorithmDefaults.population_size?.toString() || "100")
              setGenerations(algorithmDefaults.generations?.toString() || "50")
              setMutationRate(algorithmDefaults.mutation_rate?.toString() || "0.1")
              setTournamentSize(algorithmDefaults.tournament_size?.toString() || "3")
            }
            if (strategyData.id) {
              localStorage.setItem("strategy_id", strategyData.id)
            }

            // Update component state
            setStrID(JSON.stringify(strategyData))
            setStrategy(JSON.stringify(strategyData))
            setParsedStatement(strategyData)

            // Extract trading symbol from strategy name
            if (strategyData.name) {
              // Extract symbol from strategy name (e.g., "Strategyname" -> "XAUUSD")
              let symbol = "XAUUSD" // Default symbol
              
              // Try to extract symbol from strategy name
              const name = strategyData.name.toLowerCase()
              if (name.includes("xau") || name.includes("gold")) {
                symbol = "XAUUSD"
              } else if (name.includes("eur")) {
                symbol = "EURUSD"
              } else if (name.includes("gbp")) {
                symbol = "GBPUSD"
              } else if (name.includes("jpy")) {
                symbol = "USDJPY"
              } else if (name.includes("btc") || name.includes("bitcoin")) {
                symbol = "BTCUSD"
              } else if (name.includes("eth") || name.includes("ethereum")) {
                symbol = "ETHUSD"
              }
              
              console.log("🔍 Extracted trading symbol from strategy name:", strategyData.name, "->", symbol)
              
              // Update MetaAPI config with the extracted symbol
              const updatedConfig = {
                token: process.env.NEXT_PUBLIC_METAAPI_ACCESS_TOKEN || "",
                accountId: process.env.NEXT_PUBLIC_METAAPI_ACCOUNT_ID || "",
                symbol: symbol
              }
              setMetaAPIConfig(updatedConfig)
            }

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

  // Simple toast notification system
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const toast = document.createElement('div');
    let bgColor = 'bg-[#85e1fe]';
    if (type === 'error') bgColor = 'bg-red-600';
    if (type === 'warning') bgColor = 'bg-yellow-500';
    
    toast.className = `fixed bottom-10 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded shadow-lg z-50 text-black ${bgColor}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };

  const handleFile = (file: File) => {
    // Only allow .py and .csv files. Update here if you want to support more types.
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
      showToast("Only .py and .csv files are supported", 'error')
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

  // Updated handleRunBacktest function to support both MetaAPI and file upload
  const handleRunBacktest = async () => {
    if (!parsedStatement) {
      showToast("Strategy statement is missing or not parsed!", 'error')
      return
    }

    // Check requirements based on selected method
    if (!useMetaAPI && requiredTimeframes.length > uploadedFiles.length) {
      showToast("Not enough files uploaded for the required timeframes", 'error')
      return
    }

    try {
      setIsLoading(true)

      let result

      if (useMetaAPI) {
        // Use MetaAPI for backtesting with environment variables
        const symbol = metaAPIConfig?.symbol || "XAUUSD"
        const token = process.env.NEXT_PUBLIC_METAAPI_ACCESS_TOKEN || ""
        const accountId = process.env.NEXT_PUBLIC_METAAPI_ACCOUNT_ID || ""
        
        console.log("🔍 Using trading symbol for MetaAPI backtest:", symbol)
        console.log("🔍 MetaAPI Token available:", !!token)
        console.log("🔍 MetaAPI Account ID available:", !!accountId)
        
        if (!token || !accountId) {
          throw new Error("MetaAPI credentials not configured. Please check environment variables.")
        }
        
        result = await runBacktestWithMetaAPI(
          parsedStatement,
          token,
          accountId,
          symbol
        )
      } else {
        // Use traditional file upload method
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

        result = await runBacktest({
          statement: parsedStatement,
          files: timeframeFiles,
        })
      }

      console.log("Backtest result:", result)

      // Handle plot HTML
      if (result?.plot_html) {
        setPlotHtml(result.plot_html)
      }

      // Handle trades CSV data
      if (result?.trades_csv) {
        setTradesData({
          tradesCsv: result.trades_csv,
          tradesCsvFilename: result.trades_csv_filename || 'trades.csv',
          tradesCsvDownloadUrl: result.trades_csv_download_url || '',
          stdout: result.stdout || '',
          stderr: result.stderr || ''
        })
        setShowTradesSummary(true)
        
        // Check if trades CSV has actual data
        const csvLines = result.trades_csv.trim().split('\n')
        if (csvLines.length >= 2) {
          showToast("Trades data available! View summary for details.", 'success')
        } else {
          showToast("Backtest completed but no trades were executed.", 'warning')
        }
      } else {
        // No trades CSV data
        setTradesData({
          tradesCsv: '',
          tradesCsvFilename: '',
          tradesCsvDownloadUrl: '',
          stdout: result?.stdout || '',
          stderr: result?.stderr || ''
        })
        setShowTradesSummary(true)
        showToast("Backtest completed but no trades data available.", 'warning')
      }

      // Handle stdout/stderr
      if (result?.stdout) {
        console.log("Backtest stdout:", result.stdout)
      }
      if (result?.stderr) {
        console.log("Backtest stderr:", result.stderr)
      }

      if (!result?.plot_html && !result?.trades_csv) {
        showToast("Backtest completed but no data returned", 'error')
      }
    } catch (error: any) {
      showToast("Backtest Error: " + (error.message || "Unknown error"), 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOptimisation = async (wait = false) => {
    if (!parsedStatement) {
      showToast("Strategy statement is missing or not parsed!", 'error')
      return
    }

    // Only check for files if NOT using MetaAPI
    if (!useMetaAPI && requiredTimeframes.length > uploadedFiles.length) {
      showToast("Not enough files uploaded for the required timeframes", 'error')
      return
    }

    try {
      setIsLoading2(true)
      let timeframeFiles: Record<string, File> = {}

      // Only process files if NOT using MetaAPI
      if (!useMetaAPI) {
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
      }

      // Get optimisation form from localStorage to extract Parameters and Constraints
      const optimisationFormString = localStorage.getItem("optimisation_form")
      let parametersObject: Record<string, any> = {}
      let constraintsArray: string[] = []
      
      if (optimisationFormString) {
        try {
          const optimisationForm = JSON.parse(optimisationFormString)
          parametersObject = optimisationForm.Parameters || {}
          constraintsArray = optimisationForm.Constraints || []
        } catch (error) {
          console.error("Error parsing optimisation_form from localStorage:", error)
        }
      }

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

      // Construct optimiser_parameters structure
      const optimiserParameters = {
        Parameters: parametersObject,
        Misc: misc,
        Constraints: constraintsArray,
      }

      // Merge both structures into statement for the API call
      const optimisationStatement = {
        ...parsedStatement,
        optimisation_misc: misc,
        optimiser_parameters: optimiserParameters,
      }

      let result: any

      // Use MetaAPI or file upload based on the mode
      if (useMetaAPI) {
        // Use MetaAPI for optimization
        const symbol = metaAPIConfig?.symbol || "XAUUSD"
        const token = process.env.NEXT_PUBLIC_METAAPI_ACCESS_TOKEN || ""
        const accountId = process.env.NEXT_PUBLIC_METAAPI_ACCOUNT_ID || ""

        console.log("🔍 Using trading symbol for MetaAPI optimization:", symbol)
        console.log("🔍 MetaAPI Token available:", !!token)
        console.log("🔍 MetaAPI Account ID available:", !!accountId)

        if (!token || !accountId) {
          throw new Error("MetaAPI credentials not configured. Please check environment variables.")
        }

        result = await runOptimisation({
          statement: optimisationStatement,
          strategy_statement_id: strategy_id ? strategy_id : null,
          wait,
          metaapi_token: token,
          metaapi_account_id: accountId,
          symbol: symbol,
        })
      } else {
        // Use file upload for optimization
        result = await runOptimisation({
          statement: optimisationStatement,
          files: timeframeFiles,
          strategy_statement_id: strategy_id ? strategy_id : null,
          wait,
        })
      }

      console.log("Full optimization response:", result)

      // Capture optional message/stdout/stderr from response
      setOptimisationMessage(result?.message || "")
      setOptimisationStdout(result?.stdout || "")
      setOptimisationStderr(result?.stderr || "")

      // Handle the response based on whether it's sync or async
      if (wait && result?.result) {
        // Sync mode: use result.result directly
        setOptimisationResult(result.result)
        setActiveTab("optimisation")
        setShowPreviousOptimisationView(true)
        setOptimizationResults(prev => Array.isArray(prev) ? [...prev, result.result] : [result.result])
        if (result.result.heatmap_plot_html) {
          setPlotHeatmapHtml(result.result.heatmap_plot_html)
        } else {
          setPlotHeatmapHtml(null)
        }
        if (result.result.trades_plot_html) {
          setPlotHtml(result.result.trades_plot_html)
        }
        setOptimizationStatus("completed")
        setCurrentOptimizationId(result.optimization_id || null)
        return
      }

      // Async mode: Check if we have immediate results
      if (result?.result) {
        // We have results immediately (even in async mode)
        setOptimisationResult(result.result)
        setActiveTab("optimisation")
        setShowPreviousOptimisationView(true)
        setOptimizationResults(prev => Array.isArray(prev) ? [...prev, result.result] : [result.result])
        if (result.result.heatmap_plot_html) {
          setPlotHeatmapHtml(result.result.heatmap_plot_html)
        } else {
          setPlotHeatmapHtml(null)
        }
        if (result.result.trades_plot_html) {
          setPlotHtml(result.result.trades_plot_html)
        }
        setOptimizationStatus("completed")
        setCurrentOptimizationId(result.optimization_id || null)
        return
      }

      // Pure async mode: Start polling for optimisation status if optimization_id exists
      const pollId = result?.optimization_id
      if (pollId) {
        setCurrentOptimizationId(pollId)
        setOptimizationStatus("running")
        startStatusPolling(pollId)
      } else {
        showToast("No optimization ID received for polling", 'error')
      }
    } catch (error: any) {
      showToast("Optimisation Error: " + (error.message || "Unknown error"), 'error')
    } finally {
      setIsLoading2(false)
    }
  }

  const handleWalkForwardOptimisation = async (wait = false) => {
    if (!parsedStatement) {
      showToast("Strategy statement is missing or not parsed!", 'error')
      return
    }

    // Only check for files if NOT using MetaAPI
    if (!useMetaAPI && requiredTimeframes.length > uploadedFiles.length) {
      showToast("Not enough files uploaded for the required timeframes", 'error')
      return
    }

    try {
      setIsLoading3(true)
      let timeframeFiles: Record<string, File> = {}

      // Only process files if NOT using MetaAPI
      if (!useMetaAPI) {
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
      }

      // Get walk forward settings from localStorage
      const walkForwardSettingsString = localStorage.getItem("walk_forward_settings")
      let walkForwardSettings = {
        warmup_bars: 15,
        lookback_bars: 1000,
        validation_bars: 200,
        anchor: true,
      }

      if (walkForwardSettingsString) {
        try {
          walkForwardSettings = JSON.parse(walkForwardSettingsString)
        } catch (error) {
          console.error("Error parsing walk forward settings:", error)
        }
      }

      // Get optimisation form from localStorage to extract Parameters and Constraints
      const optimisationFormString = localStorage.getItem("optimisation_form")
      let parametersObject: Record<string, any> = {}
      let constraintsArray: string[] = []
      
      if (optimisationFormString) {
        try {
          const optimisationForm = JSON.parse(optimisationFormString)
          parametersObject = optimisationForm.Parameters || {}
          constraintsArray = optimisationForm.Constraints || []
        } catch (error) {
          console.error("Error parsing optimisation_form from localStorage:", error)
        }
      }

      // Construct Hyper-parameters from state
      const hyperParameters = {
        population_size: Number(populationSize),
        generations: Number(generations),
        mutation_rate: Number(mutationRate),
        tournament_size: Number(tournamentSize),
      }

      // Construct Misc object (without walk_forward_settings)
      const misc = {
        Algorithm: selectedAlgorithm,
        Maximise: selectedMaximiseOption,
        "Hyper-parameters": hyperParameters,
      }

      // Construct optimiser_parameters structure
      const optimiserParameters = {
        Parameters: parametersObject,
        Misc: misc,
        Constraints: constraintsArray,
      }

      // Merge both structures into statement for the API call
      const walkForwardStatement = {
        ...parsedStatement,
        optimisation_misc: misc,
        optimiser_parameters: optimiserParameters,
      }

      const apiParams: any = {
        statement: walkForwardStatement,
        walk_forward_setting: walkForwardSettings, // Pass as separate parameter
        wait,
      }
      
      if (strategy_id && !isNaN(Number(strategy_id))) {
        apiParams.strategy_statement_id = Number(strategy_id)
      }

      // Use MetaAPI or file upload based on the mode
      if (useMetaAPI) {
        // Use MetaAPI for walk forward optimization
        const symbol = metaAPIConfig?.symbol || "XAUUSD"
        const token = process.env.NEXT_PUBLIC_METAAPI_ACCESS_TOKEN || ""
        const accountId = process.env.NEXT_PUBLIC_METAAPI_ACCOUNT_ID || ""

        console.log("🔍 Using trading symbol for MetaAPI walk forward optimization:", symbol)
        console.log("🔍 MetaAPI Token available:", !!token)
        console.log("🔍 MetaAPI Account ID available:", !!accountId)

        if (!token || !accountId) {
          throw new Error("MetaAPI credentials not configured. Please check environment variables.")
        }

        apiParams.metaapi_token = token
        apiParams.metaapi_account_id = accountId
        apiParams.symbol = symbol
      } else {
        // Use file upload for walk forward optimization
        apiParams.files = timeframeFiles
      }

      const result = await runWalkForwardOptimisation(apiParams)

      console.log("Walk Forward optimization response:", result)
      console.log("Result status:", result?.status)
      console.log("Result message:", result?.message)

      // The API response structure is direct, not nested under 'result'
      const resultData = result;
      
      console.log("🔍 DEBUG: Full result data:", resultData);
      console.log("🔍 DEBUG: Available fields:", Object.keys(resultData || {}));
      
      if (resultData && (resultData.status === 'success' || resultData.message?.toLowerCase().includes('success'))) {
        console.log("Success detected, navigating to results page");
        // Store only the optimization ID in sessionStorage and navigate to results page
        const optimizationId = resultData.walkforward_optimization_id || resultData.optimization_id;
        console.log("🔍 DEBUG: Found optimization ID:", optimizationId);
        
        if (optimizationId) {
          console.log("✅ Storing optimization ID:", optimizationId);
          sessionStorage.setItem('walkForwardOptimizationId', optimizationId.toString());
          // Add a small delay to ensure sessionStorage is set
          setTimeout(() => {
            router.push('/walk-forward-results');
          }, 100);
        } else {
          // Fallback: store minimal data in sessionStorage
          const minimalData = {
            id: resultData.id || resultData.walkforward_optimization_id || resultData.optimization_id,
            status: resultData.status,
            message: resultData.message
          };
          console.log("⚠️ Storing minimal data:", minimalData);
          sessionStorage.setItem('walkForwardMinimalData', JSON.stringify(minimalData));
          // Add a small delay to ensure sessionStorage is set
          setTimeout(() => {
            router.push('/walk-forward-results');
          }, 100);
        }
        return;
      }

      // If we have any result data, navigate to details page
      if (resultData) {
        console.log("Result data found, navigating to results page");
        // Store only the optimization ID in sessionStorage
        const optimizationId = resultData.walkforward_optimization_id || resultData.optimization_id;
        console.log("🔍 DEBUG: Found optimization ID:", optimizationId);
        
        if (optimizationId) {
          console.log("✅ Storing optimization ID:", optimizationId);
          sessionStorage.setItem('walkForwardOptimizationId', optimizationId.toString());
          // Add a small delay to ensure sessionStorage is set
          setTimeout(() => {
            router.push('/walk-forward-results');
          }, 100);
      } else {
          // Fallback: store minimal data
          const minimalData = {
            id: resultData.id || resultData.walkforward_optimization_id || resultData.optimization_id,
            status: resultData.status,
            message: resultData.message
          };
          console.log("⚠️ Storing minimal data:", minimalData);
          sessionStorage.setItem('walkForwardMinimalData', JSON.stringify(minimalData));
          // Add a small delay to ensure sessionStorage is set
          setTimeout(() => {
            router.push('/walk-forward-results');
          }, 100);
        }
        return;
      }

      console.log("No result data found");
    } catch (error: any) {
      showToast("Walk Forward Optimisation Error: " + (error.message || "Unknown error"), 'error')
    } finally {
      setIsLoading3(false)
    }
  }

  // Add function to start status polling
  const startStatusPolling = (optimizationId: string) => {
    // Prevent multiple intervals
    if (statusPollingInterval) {
      clearInterval(statusPollingInterval);
      setStatusPollingInterval(null);
    }

    let stopped = false;
    const isFinalStatus = (status: string) => ["completed", "SUCCESS", "FAILED", "ERROR"].includes((status || "").toUpperCase());
    const interval = setInterval(async () => {
      if (stopped) return;
      try {
        const statusResult = await getOptimisationStatus(optimizationId);
        setOptimizationStatus(statusResult.status);
        // Update optional message/stdout/stderr when present during polling
        if (statusResult?.message) setOptimisationMessage(statusResult.message);
        if (statusResult?.stdout) setOptimisationStdout(statusResult.stdout);
        if (statusResult?.stderr) setOptimisationStderr(statusResult.stderr);
        if (isFinalStatus(statusResult.status)) {
          stopped = true;
          clearInterval(interval);
          setStatusPollingInterval(null);

          if (statusResult.result) {
            setOptimisationResult(statusResult.result);
            setOptimizationResults(prev => Array.isArray(prev) ? [...prev, statusResult.result] : [statusResult.result]);
            setShowPreviousOptimisationView(true);
          }
          // Optionally handle failed/error status
        }
      } catch (error) {
        stopped = true;
        clearInterval(interval);
        setStatusPollingInterval(null);
        console.error("Error polling optimization status:", error);
      }
    }, 5000);

    setStatusPollingInterval(interval);
  };

  // Add function to load optimization results
  const loadOptimizationResults = async () => {
    if (!strategy_id) return

    try {
      const results = await getStrategyOptimizationResults(strategy_id, {
        page: 1,
        page_size: 50
      })
      setOptimizationResults(results.results || [])
    
    } catch (error) {
      showToast("Error loading optimization results", 'error')
      console.error("Error loading optimization results:", error)
    }
  }

  // Add function to view optimization result details
  const viewOptimizationResult = async (optimizationId: string) => {
    try {
      const result = await getOptimizationResultDetail(optimizationId)
      setSelectedOptimizationResult(result)
      setShowOptimizationHistory(true)
      showToast("Optimization result loaded", 'success')
    } catch (error) {
      showToast("Failed to load optimization result details", 'error')
      console.error("Error loading optimization result details:", error)
    }
  }

  // Add function to delete optimization result
  const deleteOptimizationResultHandler = async (optimizationId: string) => {
    if (!confirm("Are you sure you want to delete this optimization result?")) {
      return
    }

    try {
      await deleteOptimizationResult(optimizationId)
      await loadOptimizationResults()
      showToast("Optimization result deleted successfully", 'success')
    } catch (error) {
      showToast("Failed to delete optimization result", 'error')
      console.error("Error deleting optimization result:", error)
    }
  }

  // Load optimization results when component mounts
  useEffect(() => {
    if (strategy_id) {
      loadOptimizationResults()
      loadWalkForwardOptimizationResults()
    }
  }, [strategy_id])

  // Add function to load walk forward optimization results
  const loadWalkForwardOptimizationResults = async () => {
    if (!strategy_id) return

    try {
      const results = await getStrategyWalkForwardOptimizationResults(strategy_id, {
        page: 1,
        page_size: 50
      })
      setWalkForwardOptimizationResults(results.results || [])
    
    } catch (error) {
      showToast("Error loading walk forward optimization results", 'error')
      console.error("Error loading walk forward optimization results:", error)
    }
  }

  // Add function to view walk forward optimization result details
  const viewWalkForwardOptimizationResult = async (optimizationId: number) => {
    try {
      console.log("Fetching WFO result detail for ID:", optimizationId)
      const result = await getWalkForwardOptimizationResultDetail(optimizationId)
      console.log("WFO result detail received:", result)
      
      showToast("Loading walk forward optimization result details...", 'success')
      
      // Navigate to the walk-forward-results page with the optimization ID
      // The page will fetch the data directly using the ID
      router.push(`/walk-forward-results?id=${optimizationId}`)
    } catch (error) {
      console.error("Error in viewWalkForwardOptimizationResult:", error)
      showToast("Failed to load walk forward optimization result details", 'error')
      console.error("Error loading walk forward optimization result details:", error)
    }
  }

  // Add function to delete walk forward optimization result
  const deleteWalkForwardOptimizationResultHandler = async (optimizationId: number) => {
    if (!confirm("Are you sure you want to delete this walk forward optimization result?")) {
      return
    }

    try {
      await deleteWalkForwardOptimizationResult(optimizationId)
      await loadWalkForwardOptimizationResults()
      showToast("Walk forward optimization result deleted successfully", 'success')
    } catch (error) {
      showToast("Failed to delete walk forward optimization result", 'error')
      console.error("Error deleting walk forward optimization result:", error)
    }
  }

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      if (statusPollingInterval) {
        clearInterval(statusPollingInterval)
      }
    }
  }, [statusPollingInterval])

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

  // MetaAPI Configuration Handlers
  const handleMetaAPIConfigChange = (config: MetaAPIConfigType) => {
    setMetaAPIConfig(config)
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
      const leverageMargin = getLeverageMargin(leverage)

      // Create the data object with trading mode consideration
      // Use dynamic commission from the form
      const tradingtype: any = {
        margin: leverageMargin,
        lot: lot,
        cash: cash,
        commission: commission, // Use dynamic commission from form
        NewTrade: selectedTradingMode, // Add the selected trading mode
        asset_type: assetType, // Add the asset type
      }
      
      console.log("🔍 Commission being sent to API:", { 
        commission, 
        commissionState: commission,
        parsedStatementCommission: parsedStatement?.TradingType?.commission
      })

      // Only add nTrade_max for MTOOTAAT mode
      if (selectedTradingMode === "MTOOTAAT") {
        tradingtype.nTrade_max = Number.parseInt(maxTrades)
      }

      // Get TradingSession from parsedStatement if it exists
      const tradingSession = parsedStatement?.TradingSession || null
      
      console.log("🔍 DEBUG: TradingSession being sent to API:", tradingSession)
      console.log("🔍 DEBUG: parsedStatement:", parsedStatement)
      console.log("🔍 DEBUG: parsedStatement.TradingSession:", parsedStatement?.TradingSession)
      
      // Use editStrategy to update the complete strategy including TradingSession
      const updatedStrategyData = {
        ...parsedStatement,
        TradingType: {
          ...parsedStatement.TradingType,
          ...tradingtype,
          lot: lot,
          commission: commission,
          asset_type: assetType,
        },
        // Preserve TradingSession if it exists
        ...(parsedStatement.TradingSession && { TradingSession: parsedStatement.TradingSession })
      }
      
      console.log("🔍 DEBUG: updatedStrategyData being sent to editStrategy:", updatedStrategyData)
      console.log("🔍 DEBUG: TradingSession in updatedStrategyData:", updatedStrategyData.TradingSession)
      
      const result = await editStrategy(strategy_id, updatedStrategyData)

      // Update the local strategy object with the response from the API
      if (result) {
        // Preserve the TradingSession from the original data since the API doesn't return it
        const finalResult = {
          ...result,
          TradingSession: updatedStrategyData.TradingSession
        }
        
        setParsedStatement(finalResult)
        localStorage.setItem("savedStrategy", JSON.stringify(finalResult))
        
        // Update strategy_id if it changed
        if (result.id && result.id.toString() !== strategy_id) {
          setStrategyId(result.id.toString())
          localStorage.setItem("strategy_id", result.id.toString())
          console.log("🔍 Strategy ID updated from", strategy_id, "to", result.id)
        }
        
        console.log("🔍 Updated strategy from API:", result)
        console.log("🔍 TradingSession preserved locally:", finalResult.TradingSession)
        showToast("Backtest settings saved successfully!", 'success')
      }
    } catch (error) {
      console.error("Error saving backtest settings:", error)
      alert("Failed to save backtest settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAdvancedSettings = async () => {
    try {
      if (!parsedStatement) {
        showToast("Strategy statement is missing!", 'error')
        return
      }

      // Get current optimisation form from localStorage
      const currentOptimisationFormString = localStorage.getItem("optimisation_form")
      let currentOptimisationForm = currentOptimisationFormString
        ? JSON.parse(currentOptimisationFormString)
        : {
            parameters: [],
            maximise_options: [],
            algorithm_options: [],
            default_algorithm: "",
            algorithm_defaults: {
              population_size: 100,
              generations: 50,
              mutation_rate: 0.1,
              tournament_size: 3,
            },
          }

      // Transform parameters array to Parameters object format for the API
      const parametersObject: Record<string, any> = {}
      if (currentOptimisationForm.parameters && Array.isArray(currentOptimisationForm.parameters)) {
        currentOptimisationForm.parameters.forEach((param: any) => {
          if (param.optimise && param.encoding) {
            parametersObject[param.encoding] = {
              value: param.default, // Changed from 'default' to 'value' for backend compatibility
              ...(param.range && { range: param.range }),
              ...(param.step && { step: param.step }),
              type: param.type,
            }
          }
        })
      }

      // Update the algorithm defaults with the new values from advanced settings
      currentOptimisationForm.algorithm_defaults = {
        population_size: Number(populationSize),
        generations: Number(generations),
        mutation_rate: Number(mutationRate),
        tournament_size: Number(tournamentSize),
      }

      // Add the transformed Parameters object
      currentOptimisationForm.Parameters = parametersObject

      // Save to localStorage first
      localStorage.setItem("optimisation_form", JSON.stringify(currentOptimisationForm))

      // Call the API to save the updated settings
      await saveOptimisationInput(parsedStatement, currentOptimisationForm)

      showToast("Advanced settings saved successfully!", 'success')
      setShowAdvancedSettingsModal(false)
    } catch (error: any) {
      console.error("Error saving advanced settings:", error)
      showToast("Failed to save advanced settings: " + (error.message || "Unknown error"), 'error')
    }
  }

  // When optimisation results load, set the first row as selected by default
  useEffect(() => {
    const rows = (optimisationResult?.convergence_data || optimisationResult?.full_optimization_results || optimisationResult?.table || []);
    if (rows.length > 0) {
      setSelectedOptimisationRow(rows[0]);
    }
  }, [optimisationResult]);

  // Helper function to generate convergence plot HTML
  const generateConvergencePlotHTML = (convergenceData: any[]) => {
    if (!convergenceData || convergenceData.length === 0) return null;
    
    // Extract generations and equity values
    const generations = convergenceData.map((d, idx) => d.generation ?? idx);
    const equityValues = convergenceData.map(d => d['Equity Final [$]']);
    
    const plotlyData = JSON.stringify([{
      x: generations,
      y: equityValues,
      type: 'scatter',
      mode: 'lines+markers',
      marker: { color: '#85e1fe' },
      line: { color: '#85e1fe', width: 2 },
      name: 'Equity Final'
    }]);
    
    const layout = JSON.stringify({
      title: 'Convergence Plot',
      xaxis: { title: 'Generation', gridcolor: '#333' },
      yaxis: { title: 'Equity Final [$]', gridcolor: '#333' },
      paper_bgcolor: '#0e1018',
      plot_bgcolor: '#0e1018',
      font: { color: '#fff' }
    });
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
      </head>
      <body style="margin:0;">
        <div id="plot" style="width:100%;height:100%;"></div>
        <script>
          Plotly.newPlot('plot', ${plotlyData}, ${layout}, {responsive: true});
        </script>
      </body>
      </html>
    `;
  };

  // Helper function to generate heatmap plot HTML
  const generateHeatmapPlotHTML = (heatmapData: any[]) => {
    if (!heatmapData || heatmapData.length === 0) return null;
    
    // Extract unique parameter values and create a matrix
    const param1Key = Object.keys(heatmapData[0]).find(k => k !== 'Equity Final [$]' && k !== 'Return [%]');
    const param2Key = Object.keys(heatmapData[0]).find(k => k !== 'Equity Final [$]' && k !== 'Return [%]' && k !== param1Key);
    
    if (!param1Key || !param2Key) {
      // If we can't find two parameters, create a simple scatter plot
      const x = heatmapData.map((d, idx) => idx);
      const y = heatmapData.map(d => d['Equity Final [$]']);
      
      const plotlyData = JSON.stringify([{
        x: x,
        y: y,
        mode: 'markers',
        type: 'scatter',
        marker: { 
          color: y,
          colorscale: 'Viridis',
          showscale: true,
          size: 10
        },
        name: 'Equity Final'
      }]);
      
      const layout = JSON.stringify({
        title: 'Optimization Results',
        xaxis: { title: 'Index', gridcolor: '#333' },
        yaxis: { title: 'Equity Final [$]', gridcolor: '#333' },
        paper_bgcolor: '#0e1018',
        plot_bgcolor: '#0e1018',
        font: { color: '#fff' }
      });
      
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
        </head>
        <body style="margin:0;">
          <div id="plot" style="width:100%;height:100%;"></div>
          <script>
            Plotly.newPlot('plot', ${plotlyData}, ${layout}, {responsive: true});
          </script>
        </body>
        </html>
      `;
    }
    
    const x = heatmapData.map(d => d[param1Key]);
    const y = heatmapData.map(d => d[param2Key]);
    const z = heatmapData.map(d => d['Equity Final [$]']);
    
    const plotlyData = JSON.stringify([{
      x: x,
      y: y,
      mode: 'markers',
      type: 'scatter',
      marker: { 
        color: z,
        colorscale: 'Viridis',
        showscale: true,
        size: 12,
        colorbar: { title: 'Equity Final [$]' }
      },
      text: z.map((val: number) => `$${val.toFixed(2)}`),
      hovertemplate: `${param1Key}: %{x}<br>${param2Key}: %{y}<br>Equity: %{text}<extra></extra>`
    }]);
    
    const layout = JSON.stringify({
      title: 'Parameter Optimization Heatmap',
      xaxis: { title: param1Key, gridcolor: '#333' },
      yaxis: { title: param2Key, gridcolor: '#333' },
      paper_bgcolor: '#0e1018',
      plot_bgcolor: '#0e1018',
      font: { color: '#fff' }
    });
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
      </head>
      <body style="margin:0;">
        <div id="plot" style="width:100%;height:100%;"></div>
        <script>
          Plotly.newPlot('plot', ${plotlyData}, ${layout}, {responsive: true});
        </script>
      </body>
      </html>
    `;
  };

  // Optimization Droplets states
  const [showCostDialog, setShowCostDialog] = useState(false)
  const [optimizationType, setOptimizationType] = useState<'regular' | 'walk_forward'>('regular')
  const [isCreatingOptimizationJob, setIsCreatingOptimizationJob] = useState(false)
  const [dropletJobId, setDropletJobId] = useState<number | null>(null)
  const [dropletJobStatus, setDropletJobStatus] = useState<string>("")
  const [dropletJobResults, setDropletJobResults] = useState<any>(null)
  const [dropletPollingInterval, setDropletPollingInterval] = useState<NodeJS.Timeout | null>(null)

  // New Optimization Droplets Flow Functions
  
  /**
   * Poll droplet job status (for droplet-based optimizations)
   */
  const startDropletJobPolling = (jobId: number) => {
    // Clear any existing polling
    if (dropletPollingInterval) {
      clearInterval(dropletPollingInterval)
      setDropletPollingInterval(null)
    }

    let stopped = false
    const isFinalStatus = (status: string) => 
      ["Completed", "Failed", "Cancelled", "completed", "failed", "cancelled"].includes(status)

    const interval = setInterval(async () => {
      if (stopped) return

      try {
        const jobData = await getOptimizationJob(jobId)
        console.log(`📊 Droplet Job ${jobId}: ${jobData.status} (Runtime: ${jobData.runtime_minutes} min)`)
        
        setDropletJobStatus(jobData.status)
        
        if (isFinalStatus(jobData.status)) {
          stopped = true
          clearInterval(interval)
          setDropletPollingInterval(null)

          if (jobData.status === 'Completed' || jobData.status === 'completed') {
            console.log('✅ Droplet job completed successfully:', jobData)
            setDropletJobResults(jobData)  // Store entire job data, not just results
            
            // Show results for walk forward optimization
            if (optimizationType === 'walk_forward') {
              console.log('📊 Walk Forward Results:')
              console.log(`   Strategy: ${jobData.strategy_name}`)
              console.log(`   Runtime: ${jobData.runtime_minutes} minutes`)
              console.log(`   Z-Statistic: ${jobData.results?.z_statistic?.toFixed(4)}`)
              console.log(`   P-Value: ${jobData.results?.p_value?.toFixed(4)}`)
              console.log(`   Decision: ${jobData.results?.hypothesis_decision}`)
              console.log(`   Avg Validation Return: ${jobData.results?.avg_validation_return?.toFixed(2)}%`)
              
              // Log plot files if available
              if (jobData.results?.plot_files) {
                console.log('📈 Plot Files:')
                Object.entries(jobData.results.plot_files).forEach(([type, info]: [string, any]) => {
                  console.log(`   ${type}: ${info.filename} (${(info.size / 1024 / 1024).toFixed(2)} MB)`)
                })
              }
              
              // Log cost information
              console.log('💰 Cost Information:')
              console.log(`   Estimated: $${jobData.estimated_cost}`)
              console.log(`   Actual: $${jobData.actual_cost}`)
              console.log(`   Droplet Size: ${jobData.droplet_size}`)
              
              const decision = jobData.results?.hypothesis_decision || 'Completed'
              const pValue = jobData.results?.p_value
              const isProfitable = pValue && pValue < 0.05
              
              showToast(
                `Walk Forward Optimization completed! ${isProfitable ? '✅ Profitable' : '⚠️ ' + decision.substring(0, 50)}`,
                isProfitable ? 'success' : 'warning'
              )
            } else {
              showToast('Optimization completed successfully!', 'success')
            }
          } else if (jobData.status === 'Failed' || jobData.status === 'failed') {
            showToast(`Optimization job failed: ${jobData.error_message || 'Unknown error'}`, 'error')
          }
        }
      } catch (error) {
        console.error('Error polling droplet job status:', error)
        stopped = true
        clearInterval(interval)
        setDropletPollingInterval(null)
      }
    }, 30000) // Poll every 30 seconds

    setDropletPollingInterval(interval)
  }

  /**
   * Step 1: Handle optimization with droplets - show cost dialog
   */
  const handleOptimizationWithDroplets = async (type: 'regular' | 'walk_forward') => {
    setOptimizationType(type)
    setShowCostDialog(true)
  }

  // Cleanup droplet polling interval on unmount
  useEffect(() => {
    return () => {
      if (dropletPollingInterval) {
        clearInterval(dropletPollingInterval)
      }
    }
  }, [dropletPollingInterval])

  /**
   * Open walk forward plot in new tab or display in iframe
   */
  const openWalkForwardPlot = (plotUrl: string, plotType: string) => {
    console.log(`Opening ${plotType} plot: ${plotUrl}`)
    window.open(plotUrl, '_blank')
  }

  /**
   * View walk forward droplet results
   */
  const viewWalkForwardDropletResults = async (jobId: number) => {
    try {
      const jobData = await getWalkForwardDropletResults(jobId)
      console.log('📊 Walk Forward Droplet Results:', jobData)
      
      setDropletJobResults(jobData.results)
      
      // Display results summary
      if (jobData.results) {
        console.log('📈 Results Summary:')
        console.log(`   Status: ${jobData.status}`)
        console.log(`   Runtime: ${jobData.runtime_minutes} minutes`)
        console.log(`   Z-Statistic: ${jobData.results.z_statistic?.toFixed(4)}`)
        console.log(`   P-Value: ${jobData.results.p_value?.toFixed(4)}`)
        console.log(`   Decision: ${jobData.results.hypothesis_decision}`)
        console.log(`   Avg Validation Return: ${jobData.results.avg_validation_return?.toFixed(2)}%`)
        
        // Display plot URLs
        if (jobData.results.plot_urls) {
          console.log('📈 Available Plots:')
          Object.entries(jobData.results.plot_urls).forEach(([type, url]: [string, any]) => {
            console.log(`   ${type}: ${url}`)
          })
        }
        
        showToast('Walk forward results loaded successfully!', 'success')
      }
    } catch (error: any) {
      console.error('Error fetching walk forward droplet results:', error)
      showToast(`Failed to load results: ${error.message}`, 'error')
    }
  }

  /**
   * Step 2 & 3: Handle cost confirmation and create optimization job
   */
  const handleCostConfirmation = async () => {
    setShowCostDialog(false)
    
    if (!parsedStatement) {
      showToast("Strategy statement is missing or not parsed!", 'error')
      return
    }

    // Only check for files if NOT using MetaAPI
    if (!useMetaAPI && requiredTimeframes.length > uploadedFiles.length) {
      showToast("Not enough files uploaded for the required timeframes", 'error')
      return
    }

    try {
      setIsCreatingOptimizationJob(true)
      // Prepare files only if NOT using MetaAPI
      let timeframeFiles: Record<string, File> = {}
      
      if (!useMetaAPI) {
        requiredTimeframes.forEach((timeframe, index) => {
          const filename = uploadedFiles[index]
          if (filename && fileObjects[filename]) {
            timeframeFiles[timeframe] = fileObjects[filename]
          }
        })

        // Add unmatched remaining files
        uploadedFiles.forEach((filename) => {
          if (!Object.values(timeframeFiles).includes(fileObjects[filename])) {
            const key = filename.split(".")[0]
            timeframeFiles[key] = fileObjects[filename]
          }
        })
      }

      // Get optimisation form settings
      const optimisationFormString = localStorage.getItem("optimisation_form")
      let parametersObject: Record<string, any> = {}
      let constraintsArray: string[] = []
      
      if (optimisationFormString) {
        try {
          const optimisationForm = JSON.parse(optimisationFormString)
          parametersObject = optimisationForm.Parameters || {}
          constraintsArray = optimisationForm.Constraints || []
          
          // Debug logging for parameters
          console.log("🔍 Optimisation form loaded from localStorage:", optimisationForm)
          console.log("🔍 Parameters object:", parametersObject)
          console.log("🔍 Parameters keys:", Object.keys(parametersObject))
          
          if (Object.keys(parametersObject).length === 0) {
            console.warn("⚠️ WARNING: Parameters object is empty! User needs to configure optimization parameters in Advanced Settings.")
            showToast("No optimization parameters configured. Please set parameters in Advanced Settings.", 'warning')
          }
        } catch (error) {
          console.error("Error parsing optimisation_form from localStorage:", error)
        }
      } else {
        console.warn("⚠️ WARNING: No optimisation_form found in localStorage!")
        showToast("Optimization settings not found. Please configure parameters in Advanced Settings.", 'warning')
      }

      // Construct optimisation statement
      const hyperParameters = {
        population_size: Number(populationSize),
        generations: Number(generations),
        mutation_rate: Number(mutationRate),
        tournament_size: Number(tournamentSize),
      }

      const misc = {
        Algorithm: selectedAlgorithm,
        Maximise: selectedMaximiseOption,
        "Hyper-parameters": hyperParameters,
      }

      const optimiserParameters = {
        Parameters: parametersObject,
        Misc: misc,
        Constraints: constraintsArray,
      }

      const optimisationStatement = {
        ...parsedStatement,
        optimisation_misc: misc,
        optimiser_parameters: optimiserParameters,
      }

      // Validate strategy_id is available
      if (!strategy_id || isNaN(Number(strategy_id))) {
        throw new Error("Strategy ID is required to create an optimization job")
      }

      // Prepare API call parameters
      // ❌ DO NOT send statement - backend fetches from database!
      const apiParams: any = {
        strategy_statement_id: Number(strategy_id), // ✅ REQUIRED - backend fetches strategy from DB
        type: optimizationType, // ✅ REQUIRED - 'regular' or 'walk_forward'
      }

      // Add walk forward settings if needed
      if (optimizationType === 'walk_forward') {
        const walkForwardSettingsString = localStorage.getItem("walk_forward_settings")
        let walkForwardSettings = {
          warmup_bars: 15,
          lookback_bars: 1000,
          validation_bars: 200,
          anchor: true,
        }

        if (walkForwardSettingsString) {
          try {
            walkForwardSettings = JSON.parse(walkForwardSettingsString)
          } catch (error) {
            console.error("Error parsing walk forward settings:", error)
          }
        }

        // Backend expects 'walk_forward_settings' (plural)
        apiParams.walk_forward_settings = walkForwardSettings
        console.log("🔍 Walk forward settings for droplet:", walkForwardSettings)
      }

      // Use MetaAPI or file upload based on the mode
      if (useMetaAPI) {
        // Use MetaAPI for optimization job
        const symbol = metaAPIConfig?.symbol || "XAUUSD"
        const token = process.env.NEXT_PUBLIC_METAAPI_ACCESS_TOKEN || ""
        const accountId = process.env.NEXT_PUBLIC_METAAPI_ACCOUNT_ID || ""

        console.log("🔍 Using trading symbol for MetaAPI optimization job:", symbol)
        console.log("🔍 MetaAPI Token available:", !!token)
        console.log("🔍 MetaAPI Account ID available:", !!accountId)

        if (!token || !accountId) {
          throw new Error("MetaAPI credentials not configured. Please check environment variables.")
        }

        apiParams.metaapi_token = token
        apiParams.metaapi_account_id = accountId
        apiParams.symbol = symbol
      } else {
        // Use file upload for optimization job
        apiParams.files = timeframeFiles
        
        // Add CSV file explicitly (use the first uploaded file)
        const firstFile = Object.values(timeframeFiles)[0]
        if (firstFile) {
          apiParams.csvFile = firstFile
        }
      }

      // Step 3: Create optimization job
      console.log("📤 Final API params being sent:", {
        ...apiParams,
        files: apiParams.files ? Object.keys(apiParams.files) : undefined,
        metaapi_token: apiParams.metaapi_token ? '***' : undefined
      })
      
      const jobResult = await createOptimizationJob(apiParams)
      
      console.log("Optimization job created:", jobResult)
      
      // Store job ID and start polling
      setDropletJobId(jobResult.job_id)
      setDropletJobStatus(jobResult.status || 'running')
      
      showToast(`Optimization job created! Job ID: ${jobResult.job_id}`, 'success')
      
      // Start polling for job status
      startDropletJobPolling(jobResult.job_id)
      
      // Navigate to results page with job_id parameter
      setTimeout(() => {
        router.push(`/optimization-results?job_id=${jobResult.job_id}&type=droplet`)
      }, 500)
      
    } catch (error: any) {
      // Error Handling: 403, 400, 500, Network errors
      if (error.message.includes('401') || error.message.includes('403')) {
        showToast("Authentication failed. Please login again.", 'error')
        // Redirect to login
        router.push('/auth')
      } else if (error.message.includes('400')) {
        showToast("Invalid parameters: " + (error.message || "Unknown error"), 'error')
      } else if (error.message.includes('500')) {
        showToast("Server error. Please try again later.", 'error')
      } else {
        showToast("Connection failed: " + (error.message || "Unknown error"), 'error')
      }
      console.error("Error creating optimization job:", error)
    } finally {
      setIsCreatingOptimizationJob(false)
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
          {/* Show PreviousOptimisationView if toggled */}
          {showPreviousOptimisationView ? (
            <PreviousOptimisationView
              optimisationResults={optimizationResults}
              onClose={() => setShowPreviousOptimisationView(false)}
              isFullScreen={true}
            />
          ) : (
            <>
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
                  <div className="p-6 space-y-6">
                    {/* Data Source Toggle */}
                    <div className="bg-black border border-gray-700 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Data Source</h3>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="dataSource"
                            checked={useMetaAPI}
                            onChange={() => setUseMetaAPI(true)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-white">MetaAPI (Recommended)</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="dataSource"
                            checked={!useMetaAPI}
                            onChange={() => setUseMetaAPI(false)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-white">File Upload (Legacy)</span>
                        </label>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        {useMetaAPI 
                          ? "Use MetaAPI to fetch real market data automatically"
                          : "Upload CSV files manually for backtesting"
                        }
                      </p>
                    </div>

                    {/* MetaAPI Configuration or File Upload */}
                    {useMetaAPI ? (
                      <MetaAPIConfig
                        onConfigChange={handleMetaAPIConfigChange}
                        initialConfig={metaAPIConfig || undefined}
                      />
                    ) : (
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
                  </div>
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
                    lot={lot}
                    setLot={setLot}
                    commission={commission}
                    setCommission={setCommission}
                    assetType={assetType}
                    setAssetType={setAssetType}
                    showTradesSummary={showTradesSummary}
                    onShowTradesSummary={() => setShowTradesSummary(true)}
                    initialTradingSession={parsedStatement?.TradingSession}
                    onTradingSessionSave={(session) => {
                      try {
                        const updated = { ...(parsedStatement || {}), TradingSession: session }
                        setParsedStatement(updated)
                        localStorage.setItem("savedStrategy", JSON.stringify(updated))
                        // optional toast
                        const toast = document.createElement('div');
                        toast.className = 'fixed bottom-10 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded shadow-lg z-50 text-black bg-[#85e1fe]';
                        toast.textContent = 'Trading Session saved';
                        document.body.appendChild(toast);
                        setTimeout(() => document.body.removeChild(toast), 2000);
                      } catch (e) {
                        console.error('Failed to save TradingSession:', e)
                      }
                    }}
                  />
                )}

                {activeTab === "optimisation" && showOptimisationResults && optimisationResult && (
                  <div className="p-6 bg-[#000000] text-white min-h-[600px]">
                    {/* Optimisation response info (message/stdout/stderr) */}
                    {(optimisationMessage || optimisationStdout || optimisationStderr) && (
                      <div className="mb-4 p-4 bg-[#141721] rounded-md border border-gray-700">
                        {optimisationMessage && (
                          <div className="mb-2">
                            <span className="font-semibold text-white mr-2">Message:</span>
                            <span className="text-gray-300 break-words">{optimisationMessage}</span>
                          </div>
                        )}
                        {optimisationStdout && (
                          <div className="mb-2">
                            <div className="font-semibold text-white mb-1">Stdout:</div>
                            <pre className="whitespace-pre-wrap break-words text-gray-300 text-xs bg-[#0e1018] p-3 rounded-md border border-gray-800 max-h-60 overflow-auto">{optimisationStdout}</pre>
                          </div>
                        )}
                        {optimisationStderr && (
                          <div className="mb-2">
                            <div className="font-semibold text-white mb-1">Stderr:</div>
                            <pre className="whitespace-pre-wrap break-words text-gray-300 text-xs bg-[#0e1018] p-3 rounded-md border border-gray-800 max-h-60 overflow-auto">{optimisationStderr}</pre>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Top-level tabs: Results | Graph | Report */}
                    <div className="flex border-b border-gray-700 mb-6">
                      <button
                        className={`px-6 py-3 font-semibold ${optimisationTab === 'results' ? 'text-[#85e1fe] border-b-2 border-[#85e1fe]' : 'text-gray-400'}`}
                        onClick={() => setOptimisationTab('results')}
                      >
                        Results
                      </button>
                      <button
                        className={`px-6 py-3 font-semibold ${optimisationTab === 'graph' ? 'text-[#85e1fe] border-b-2 border-[#85e1fe]' : 'text-gray-400'}`}
                        onClick={() => setOptimisationTab('graph')}
                      >
                        Graph
                      </button>
                      <button
                        className={`px-6 py-3 font-semibold ${optimisationTab === 'report' ? 'text-[#85e1fe] border-b-2 border-[#85e1fe]' : 'text-gray-400'}`}
                        onClick={() => setOptimisationTab('report')}
                      >
                        Report
                      </button>
                    </div>

                    {/* Results Tab */}
                    {optimisationTab === 'results' && (
                      <div>
                        <div className="overflow-x-auto mb-8">
                          <table className="min-w-full text-xs border-separate border-spacing-y-2">
                            <thead>
                              <tr className="bg-[#1A1D2D] text-white">
                                <th className="px-2 py-2">#</th>
                                <th className="px-2 py-2">Return [%]</th>
                                <th className="px-2 py-2">Equity Final [$]</th>
                                <th className="px-2 py-2"># Trades</th>
                                <th className="px-2 py-2">Win Rate [%]</th>
                                <th className="px-2 py-2">Profit Factor</th>
                                <th className="px-2 py-2">Max. Drawdown [%]</th>
                                <th className="px-2 py-2">Sharpe Ratio</th>
                                <th className="px-2 py-2">Parameters</th>
                                <th className="px-2 py-2"> </th>
                              </tr>
                            </thead>
                            <tbody>
                              {(optimisationResult.convergence_data || optimisationResult.full_optimization_results || optimisationResult.table || []).map((row: any, idx: number) => {
                                // Extract parameters (all fields that are not standard metrics)
                                const standardFields = ['Return [%]', 'Equity Final [$]', '# Trades', 'Win Rate [%]', 
                                  'Profit Factor', 'Max. Drawdown [%]', 'Sharpe Ratio', 'Sortino Ratio', 'Calmar Ratio',
                                  'Return (Ann.) [%]', 'Volatility (Ann.) [%]', 'Start', 'End', 'Duration', 'SQN',
                                  'Exposure Time [%]', 'Equity Peak [$]', 'Avg. Trade [%]', 'Best Trade [%]', 
                                  'Worst Trade [%]', 'Avg. Drawdown [%]', 'Avg. Drawdown Duration', 'Max. Drawdown Duration',
                                  'Avg. Trade Duration', 'Max. Trade Duration', 'Buy & Hold Return [%]', 'Expectancy [%]',
                                  'Unnamed: 0', 'generation'];
                                
                                const parameters = Object.keys(row)
                                  .filter(key => !standardFields.includes(key))
                                  .map(key => `${key}=${row[key]}`)
                                  .join(', ');
                                
                                return (
                                  <tr
                                    key={idx}
                                    className={`bg-[#141721] text-white cursor-pointer hover:bg-[#1e2132] ${selectedOptimisationRow === row ? 'bg-[#23263a]' : ''}`}
                                    onClick={() => {
                                      setSelectedOptimisationRow(row);
                                      setOptimisationTab('report');
                                    }}
                                  >
                                    <td className="px-2 py-2">{idx + 1}</td>
                                    <td className="px-2 py-2">{row['Return [%]']?.toFixed(2) || row.profit || '-'}</td>
                                    <td className="px-2 py-2">{row['Equity Final [$]']?.toFixed(2) || '-'}</td>
                                    <td className="px-2 py-2">{row['# Trades'] || row.total_trades || '-'}</td>
                                    <td className="px-2 py-2">{row['Win Rate [%]']?.toFixed(2) || row.win_rate_percent || row.win_rate || '-'}</td>
                                    <td className="px-2 py-2">{row['Profit Factor']?.toFixed(2) || row.profit_factor || '-'}</td>
                                    <td className="px-2 py-2">{row['Max. Drawdown [%]']?.toFixed(2) || row.drawdown_percent || '-'}</td>
                                    <td className="px-2 py-2">{row['Sharpe Ratio']?.toFixed(2) || '-'}</td>
                                    <td className="px-2 py-2 max-w-[200px] truncate" title={parameters || row.inputs}>{parameters || row.inputs || '-'}</td>
                                    <td className="px-2 py-2 text-right">
                                      <button
                                        className="text-[#85e1fe] hover:underline text-xs"
                                        onClick={e => { e.stopPropagation(); setSelectedOptimisationRow(row); setOptimisationTab('report'); }}
                                      >
                                        View Report
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Graph Tab */}
                    {optimisationTab === 'graph' && (
                      <div>
                        {/* Convergence Plot */}
                        {optimisationResult.convergence_data && optimisationResult.convergence_data.length > 0 && (() => {
                          const plotHTML = generateConvergencePlotHTML(optimisationResult.convergence_data);
                          return plotHTML ? (
                            <div className="mb-8">
                              <h3 className="mb-2 text-lg font-semibold text-white">Convergence Plot</h3>
                              <iframe
                                title="Convergence Plot"
                                style={{ width: "100%", height: "400px", border: "none", backgroundColor: "#0e1018" }}
                                srcDoc={plotHTML}
                              />
                            </div>
                          ) : null;
                        })()}
                        
                        {/* Heatmap Plot */}
                        {optimisationResult.optimization_heatmap_data && optimisationResult.optimization_heatmap_data.length > 0 && (() => {
                          const plotHTML = generateHeatmapPlotHTML(optimisationResult.optimization_heatmap_data);
                          return plotHTML ? (
                            <div className="mb-8">
                              <h3 className="mb-2 text-lg font-semibold text-white">Parameter Optimization Heatmap</h3>
                              <iframe
                                title="Optimization Heatmap"
                                style={{ width: "100%", height: "400px", border: "none", backgroundColor: "#0e1018" }}
                                srcDoc={plotHTML}
                              />
                            </div>
                          ) : null;
                        })()}
                        
                        {/* Legacy plots - still show if available */}
                        {optimisationResult.heatmap_plot_html && (
                          <div className="mb-8">
                            <h3 className="mb-2 text-lg font-semibold text-white">Scatter Plot (Legacy)</h3>
                            <iframe
                              title="Scatter Plot"
                              style={{ width: "100%", height: "400px", border: "none", backgroundColor: "#f8f8f8" }}
                              srcDoc={optimisationResult.heatmap_plot_html}
                            />
                          </div>
                        )}
                        {optimisationResult.trades_plot_html && (
                          <div className="mb-8">
                            <h3 className="mb-2 text-lg font-semibold text-white">Trades Plot</h3>
                            <iframe
                              title="Trades Plot"
                              style={{ width: "100%", height: "400px", border: "none", backgroundColor: "#f8f8f8" }}
                              srcDoc={optimisationResult.trades_plot_html}
                            />
                          </div>
                        )}
                        
                        {/* No data message */}
                        {!optimisationResult.convergence_data && 
                         !optimisationResult.optimization_heatmap_data && 
                         !optimisationResult.heatmap_plot_html && 
                         !optimisationResult.trades_plot_html && (
                          <div className="text-center text-gray-400 py-8">
                            No plot data available
                          </div>
                        )}
                      </div>
                    )}

                    {/* Report Tab */}
                    {optimisationTab === 'report' && selectedOptimisationRow && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <div className="mb-2 flex flex-col gap-1">
                            {Object.entries(selectedOptimisationRow).map(([key, value]) => (
                              typeof value === 'number' || typeof value === 'string' ? (
                                <div key={key} className="flex justify-between border-b border-gray-800 py-1 text-sm">
                                  <span className="text-gray-400">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                  <span className="text-white font-semibold">{value}</span>
                                </div>
                              ) : null
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === "optimisation" && (!showOptimisationResults || !optimisationResult) && (
                  <>
                    <div className="flex justify-end p-4">
                      <button
                        className="bg-[#85e1fe] text-black px-4 py-2 rounded-md hover:bg-[#6bcae2]"
                        onClick={() => setShowOptimisationHistory(true)}
                      >
                        See Previous Optimisation
                      </button>
                    </div>
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
                      saveOptimisationInput={saveOptimisationInput} // API function for saving
                      parsedStatement={parsedStatement} // Strategy statement for API calls
                      onShowWalkForwardResults={() => setShowWalkForwardOptimizationResults(true)}
                      onRunWalkForwardOptimisation={() => handleWalkForwardOptimisation(false)}
                      onRunWalkForwardOptimisationDroplets={() => handleOptimizationWithDroplets('walk_forward')}
                      isLoading3={isLoading3}
                    />
                  </>
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
                    <div
                      className="bg-green-500 h-full transition-all duration-300"
                      style={{
                        width: (isLoading
                          ? `${Math.min(progress, 100)}%`
                          : isLoading2
                          ? `${Math.min(progress2, 100)}%`
                          : isLoading3
                          ? `${Math.min(progress3, 100)}%`
                          : "0%"),
                        opacity: (isLoading || isLoading2 || isLoading3) ? 1 : 0,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 flex gap-4">
                  <button
                    className={`flex-1 py-3 rounded-full text-white transition-colors ${
                      isLoading || (!useMetaAPI && (requiredTimeframes.length > uploadedFiles.length))
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-[#141721] hover:bg-[#2B2E38]'
                    }`}
                    onClick={handleRunBacktest}
                    disabled={isLoading || (!useMetaAPI && (requiredTimeframes.length > uploadedFiles.length))}
                  >
                    {isLoading ? 'Running...' : 'Run Backtest'}
                  </button>
                  <button
                    onClick={() => handleOptimisation(false)}
                    className="flex-1 py-3 bg-[#141721] rounded-full text-white hover:bg-[#2B2E38]"
                    disabled={isLoading2}
                  >
                    Run Optimisation (Legacy)
                  </button>
                  <button
                    onClick={() => handleOptimizationWithDroplets('regular')}
                    className={`flex-1 py-3 rounded-full font-semibold ${
                      isLoading2 || isCreatingOptimizationJob
                        ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                        : 'bg-[#85e1fe] text-black hover:bg-[#6bcae2]'
                    }`}
                    disabled={isLoading2 || isCreatingOptimizationJob}
                  >
                    {isCreatingOptimizationJob ? 'Creating Job...' : 'Run Optimization (Droplets)'}
                  </button>
                </div>
              </div>
            </>
          )}
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

        {/* Optimization History Modal */}
        {showOptimizationHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1A1D2D] rounded-lg shadow-lg w-full max-w-6xl max-h-[80vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold text-white">Optimization History</h2>
                <button 
                  onClick={() => setShowOptimizationHistory(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {optimizationResults.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    No optimization results found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {optimizationResults.map((result) => (
                      <div key={result.id} className="bg-[#141721] rounded-lg p-4 border border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              Optimization #{result.id}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              Algorithm: {result.algorithm}
                            </p>
                            <p className="text-gray-400 text-sm">
                              Date: {new Date(result.optimization_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              result.status === "completed" ? "bg-green-500 text-white" :
                              result.status === "running" ? "bg-yellow-500 text-black" :
                              result.status === "failed" ? "bg-red-500 text-white" :
                              "bg-gray-500 text-white"
                            }`}>
                              {result.status}
                            </span>
                            <button
                              onClick={() => deleteOptimizationResultHandler(result.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {result.status === "completed" && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="text-center">
                              <p className="text-gray-400 text-sm">Final Equity</p>
                              <p className="text-white font-semibold">
                                ${result.final_equity?.toFixed(2) || "N/A"}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-400 text-sm">Return (Ann.)</p>
                              <p className="text-white font-semibold text-lg">
                                {result.return_ann_percent?.toFixed(2) || "N/A"}%
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-400 text-sm">Win Rate</p>
                              <p className="text-white font-semibold text-lg">
                                {result.win_rate_percent?.toFixed(2) || "N/A"}%
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-400 text-sm">Max Drawdown</p>
                              <p className="text-white font-semibold text-lg">
                                {result.max_drawdown_percent?.toFixed(2) || "N/A"}%
                              </p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => viewOptimizationResult(result.id)}
                            className="bg-[#85e1fe] text-black px-4 py-2 rounded-md hover:bg-[#6bcae2] text-sm"
                          >
                            View Details
                          </button>
                          {result.status === "completed" && (
                            <button
                              onClick={() => {
                                // Load this result into the main view
                                setOptimisationResult(result)
                                setShowOptimisationResults(true)
                                setShowOptimizationHistory(false)
                              }}
                              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
                            >
                              Load Result
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Optimization Result Details Modal */}
        {selectedOptimizationResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1A1D2D] rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold text-white">
                  Optimization Result Details
                </h2>
                <button 
                  onClick={() => setSelectedOptimizationResult(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Final Equity</p>
                    <p className="text-white font-semibold text-lg">
                      ${selectedOptimizationResult.final_equity?.toFixed(2) || "N/A"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Return (Ann.)</p>
                    <p className="text-white font-semibold text-lg">
                      {selectedOptimizationResult.return_ann_percent?.toFixed(2) || "N/A"}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Win Rate</p>
                    <p className="text-white font-semibold text-lg">
                      {selectedOptimizationResult.win_rate_percent?.toFixed(2) || "N/A"}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Max Drawdown</p>
                    <p className="text-white font-semibold text-lg">
                      {selectedOptimizationResult.max_drawdown_percent?.toFixed(2) || "N/A"}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Sharpe Ratio</p>
                    <p className="text-white font-semibold text-lg">
                      {selectedOptimizationResult.sharpe_ratio?.toFixed(2) || "N/A"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Number of Trades</p>
                    <p className="text-white font-semibold text-lg">
                      {selectedOptimizationResult.num_trades || "N/A"}
                    </p>
                  </div>
                </div>
                
                {selectedOptimizationResult.optimized_parameters && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Optimized Parameters</h3>
                    <div className="bg-[#141721] rounded-lg p-4">
                      <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                        {JSON.stringify(selectedOptimizationResult.optimized_parameters, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                
                {selectedOptimizationResult.trades_plot_html && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Trades Plot</h3>
                    <iframe
                      title="Trades Plot"
                      style={{ width: "100%", height: "400px", border: "none", backgroundColor: "#f8f8f8" }}
                      srcDoc={selectedOptimizationResult.trades_plot_html}
                    />
                  </div>
                )}
                
                {selectedOptimizationResult.heatmap_plot_html && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Heatmap Plot</h3>
                    <iframe
                      title="Heatmap Plot"
                      style={{ width: "100%", height: "400px", border: "none", backgroundColor: "#f8f8f8" }}
                      srcDoc={selectedOptimizationResult.heatmap_plot_html}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showOptimisationHistory && !selectedOptimisationDetail && (
          <OptimisationHistoryList
            strategyId={strategy_id || ''}
            onSelect={async (id) => {
              const detail = await getOptimizationResultDetail(id);
              setSelectedOptimisationDetail(detail);
            }}
            onClose={() => setShowOptimisationHistory(false)}
          />
        )}
        {selectedOptimisationDetail && (
          <PreviousOptimisationView
            optimisationResults={[selectedOptimisationDetail]}
            onClose={() => {
              setSelectedOptimisationDetail(null);
              setShowOptimisationHistory(false);
            }}
            isFullScreen={true}
          />
        )}

        {/* Walk Forward Optimization Results Modal */}
        {showWalkForwardOptimizationResults && (
          <WalkForwardOptimizationResults
            results={walkForwardOptimizationResults}
            onClose={() => setShowWalkForwardOptimizationResults(false)}
            onViewDetail={(result) => viewWalkForwardOptimizationResult(result.id)}
            onDelete={(id) => deleteWalkForwardOptimizationResultHandler(id)}
            onLoadResult={(result) => {
              setSelectedWalkForwardResult(result);
              setShowWalkForwardOptimizationResults(false);
              // Optionally display result in main view
              if (result.trades_plot_html) {
                setPlotHtml(result.trades_plot_html);
              }
              if (result.heatmap_plot_html) {
                setPlotHeatmapHtml(result.heatmap_plot_html);
              }
            }}
          />
        )}

        {/* Walk Forward Optimization Details Modal */}
        {walkForwardDetailResult && (
          <WalkForwardOptimisationView
            result={walkForwardDetailResult}
            onClose={() => setWalkForwardDetailResult(null)}
            isFullScreen={true}
          />
        )}

        {/* Trades Summary Modal */}
        {showTradesSummary && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1A1D2D] rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
              <div className="p-6 overflow-y-auto max-h-[90vh]">
                <TradesSummary
                  tradesCsv={tradesData.tradesCsv}
                  tradesCsvFilename={tradesData.tradesCsvFilename}
                  tradesCsvDownloadUrl={tradesData.tradesCsvDownloadUrl}
                  stdout={tradesData.stdout}
                  stderr={tradesData.stderr}
                  onClose={() => setShowTradesSummary(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Optimization Cost Dialog */}
        <OptimizationCostDialog
          isOpen={showCostDialog}
          onClose={() => setShowCostDialog(false)}
          onConfirm={handleCostConfirmation}
          optimizationType={optimizationType}
        />

        {/* Optimization Job Creation Loading Modal */}
        {isCreatingOptimizationJob && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-[#1A1D2D] rounded-lg shadow-lg p-8 max-w-md w-full">
              <div className="flex flex-col items-center">
                {/* Spinner */}
                <div className="relative w-20 h-20 mb-6">
                  <div className="absolute top-0 left-0 w-full h-full">
                    <div className="w-20 h-20 border-4 border-gray-600 border-t-[#85e1fe] rounded-full animate-spin"></div>
                  </div>
                </div>
                
                {/* Loading Text */}
                <h3 className="text-xl font-semibold text-white mb-2">
                  Creating Optimization Job
                </h3>
                <p className="text-gray-400 text-center">
                  {optimizationType === 'walk_forward' 
                    ? 'Setting up walk forward optimization with droplets...' 
                    : 'Setting up regular optimization with droplets...'}
                </p>
                <p className="text-sm text-gray-500 text-center mt-2">
                  Please wait, this may take a few moments
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Walk Forward Droplet Results Modal */}
        {dropletJobResults && dropletJobResults.results && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-[#1A1D2D] rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-700">
                <div>
                  <h2 className="text-2xl font-bold text-white">{dropletJobResults.strategy_name}</h2>
                  <p className="text-gray-400 text-sm mt-1">{dropletJobResults.type}</p>
                </div>
                <button 
                  onClick={() => setDropletJobResults(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[75vh]">
                {/* Hypothesis Testing Results */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Hypothesis Testing</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#141721] rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Z-Statistic</p>
                      <p className="text-white font-semibold text-lg">
                        {dropletJobResults.results.z_statistic?.toFixed(4) || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-[#141721] rounded-lg p-4">
                      <p className="text-gray-400 text-sm">P-Value</p>
                      <p className="text-white font-semibold text-lg">
                        {dropletJobResults.results.p_value?.toFixed(4) || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-[#141721] rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Avg Validation Return</p>
                      <p className={`font-semibold text-lg ${
                        (dropletJobResults.results.avg_validation_return || 0) > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {dropletJobResults.results.avg_validation_return?.toFixed(2) || 'N/A'}%
                      </p>
                    </div>
                    <div className="bg-[#141721] rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Decision</p>
                      <p className={`font-semibold text-sm ${
                        (dropletJobResults.results.p_value || 1) < 0.05 ? 'text-green-500' : 'text-yellow-500'
                      }`}>
                        {(dropletJobResults.results.p_value || 1) < 0.05 ? '✅ Profitable' : '⚠️ Not Profitable'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 bg-[#141721] rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-2">Hypothesis Decision:</p>
                    <p className="text-white text-sm">
                      {dropletJobResults.results.hypothesis_decision || 'No decision available'}
                    </p>
                  </div>
                </div>

                {/* Plot Files Information */}
                {dropletJobResults.results.plot_files && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Plot Files ({Object.keys(dropletJobResults.results.plot_files).length} available)
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {Object.entries(dropletJobResults.results.plot_files).map(([type, info]: [string, any]) => (
                        <div
                          key={type}
                          className="bg-[#141721] rounded-lg p-4 flex justify-between items-center"
                        >
                          <div>
                            <p className="text-white font-semibold">
                              {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            <p className="text-gray-400 text-sm">{info.filename}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[#85e1fe] font-semibold">
                              {(info.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <p className="text-gray-400 text-xs">
                              {info.available ? '✅ Available' : '❌ Not available'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-gray-400 text-sm mt-3">
                      ℹ️ Plots were generated on the droplet. Download from output directory: {dropletJobResults.results.output_dir}
                    </p>
                  </div>
                )}

                {/* Walk Forward Settings */}
                {dropletJobResults.job_parameters?.walk_forward_settings && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Walk Forward Settings</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-[#141721] rounded-lg p-4">
                        <p className="text-gray-400 text-sm">Warmup Bars</p>
                        <p className="text-white font-semibold">
                          {dropletJobResults.job_parameters.walk_forward_settings.warmup_bars}
                        </p>
                      </div>
                      <div className="bg-[#141721] rounded-lg p-4">
                        <p className="text-gray-400 text-sm">Lookback Bars</p>
                        <p className="text-white font-semibold">
                          {dropletJobResults.job_parameters.walk_forward_settings.lookback_bars}
                        </p>
                      </div>
                      <div className="bg-[#141721] rounded-lg p-4">
                        <p className="text-gray-400 text-sm">Validation Bars</p>
                        <p className="text-white font-semibold">
                          {dropletJobResults.job_parameters.walk_forward_settings.validation_bars}
                        </p>
                      </div>
                      <div className="bg-[#141721] rounded-lg p-4">
                        <p className="text-gray-400 text-sm">Anchor</p>
                        <p className="text-white font-semibold">
                          {dropletJobResults.job_parameters.walk_forward_settings.anchor ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Job Information */}
                <div className="bg-[#141721] rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Job Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Job ID:</span>
                        <span className="text-white font-semibold">{dropletJobResults.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className="text-green-500 font-semibold">{dropletJobResults.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Runtime:</span>
                        <span className="text-white font-semibold">{dropletJobResults.runtime_minutes} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Droplet Size:</span>
                        <span className="text-white font-semibold">{dropletJobResults.droplet_size}</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Estimated Cost:</span>
                        <span className="text-white font-semibold">${dropletJobResults.estimated_cost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Actual Cost:</span>
                        <span className="text-green-500 font-semibold">${dropletJobResults.actual_cost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Droplet ID:</span>
                        <span className="text-white font-semibold">{dropletJobResults.droplet_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Completed At:</span>
                        <span className="text-white font-semibold">
                          {new Date(dropletJobResults.completed_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}

