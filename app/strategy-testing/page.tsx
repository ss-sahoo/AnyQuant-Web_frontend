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
  getSymbolTimeframes,
  getAllBrokerSymbols,
  findSymbolsWithTimeframe,
  // Cancel API functions
  cancelBacktest,
  cancelOptimisationRun,
  pollJobStatus,
  // Custom strategy API
  getCustomStrategy,
  runCustomStrategyBacktest,
  // Backtest result API
  getBacktestResultDetail,
  getStrategyBacktestResults,
  deleteBacktestResult,
} from "../AllApiCalls" // Import new functions
import { X, ArrowLeft, Layout, Maximize2 } from "lucide-react"
import AuthGuard from "@/hooks/useAuthGuard"
import { extractErrorMessage, formatErrorForDisplay } from "@/lib/error-utils"
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
import { OptimizationErrorDisplay } from "@/components/optimization-error-display"
// Backtest history components
import { BacktestHistoryList } from "@/components/BacktestHistoryList"
// MetaAPI debugging
import { MetaAPIDebugModal } from "@/components/metaapi-debug-modal"
// Custom strategy backtest results
import { CustomStrategyBacktestResults } from "@/components/custom-strategy-backtest-results"

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

  // Abort controllers for cancellation
  const backtestAbortRef = useRef<AbortController | null>(null)
  const optimisationAbortRef = useRef<AbortController | null>(null)
  const walkForwardAbortRef = useRef<AbortController | null>(null)

  // run_id refs for server-side cancellation
  const backtestRunIdRef = useRef<string | null>(null)
  const optimisationRunIdRef = useRef<string | null>(null)
  const walkForwardRunIdRef = useRef<string | null>(null)

  // poller stop refs
  const backtestPollerRef = useRef<(() => void) | null>(null)
  const optimisationPollerRef = useRef<(() => void) | null>(null)
  const walkForwardPollerRef = useRef<(() => void) | null>(null)

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
  const [selectedTradingMode, setSelectedTradingMode] = useState("CLOSE & OPEN")
  const [maxTrades, setMaxTrades] = useState("1")

  // Add state variables for TradingType configuration
  const [commission, setCommission] = useState(0.00007)
  const [assetType, setAssetType] = useState("gold")
  const [positionSize, setPositionSize] = useState("1") // Default value is 1

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
  const [optimisationTab, setOptimisationTab] = useState<'results' | 'graph' | 'report' | 'trades'>('results');
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

  // Add backtest history states
  const [showBacktestHistory, setShowBacktestHistory] = useState(false);

  // MetaAPI Debug Modal states
  const [showMetaAPIDebugModal, setShowMetaAPIDebugModal] = useState(false);
  const [metaAPIError, setMetaAPIError] = useState<any>(null);

  // Custom strategy backtest results state
  const [showCustomStrategyBacktestResults, setShowCustomStrategyBacktestResults] = useState(false);
  const [customStrategyBacktestResult, setCustomStrategyBacktestResult] = useState<any>(null);

  // Add progress bar states
  const [progress, setProgress] = useState(0); // For backtest
  const [progress2, setProgress2] = useState(0); // For optimisation
  const [progress3, setProgress3] = useState(0); // For walk forward optimisation

  // Timezone state (moved from TradingSessionModal to Strategy tab)
  const [timezone, setTimezone] = useState<string>("UTC")

  // Add backtest detail state for showing results in the same page
  const [backtestDetail, setBacktestDetail] = useState<any>(null)
  const [backtestResultTab, setBacktestResultTab] = useState<'graph' | 'chart_data' | 'summary' | 'trades' | 'results' | 'report'>('graph')
  const [iframeLoadedResult, setIframeLoadedResult] = useState(false)
  const [isPlotExpandedResult, setIsPlotExpandedResult] = useState(false)

  // Normalize raw API response to handle different field naming conventions
  const normalizeBacktestResult = (raw: any): any => {
    const pick = (...keys: string[]) => {
      const rawKeys = Object.keys(raw)
      for (const key of keys) {
        if (raw[key] != null) return raw[key]
        const foundKey = rawKeys.find(rk => rk.toLowerCase() === key.toLowerCase())
        if (foundKey && raw[foundKey] != null) return raw[foundKey]
      }
      return undefined
    }

    return {
      ...raw,
      id: raw.id ?? raw.backtest_result_id,
      strategy_statement_name: raw.strategy_statement_name ?? raw.name ?? raw._strategy ?? 'Unknown Strategy',
      chart_data: raw.chart_data ?? null,
      trades_data: raw.trades_data ?? [],
      plot_html: raw.plot_html ?? '',
      final_equity: pick('final_equity', 'equity_final', 'balance'),
      return_percent: pick('return_percent', 'return_pct', 'total_return', 'return'),
      return_ann_percent: pick('return_ann_percent', 'return_ann', 'annual_return', 'return_ann_percent_value'),
      win_rate_percent: (() => {
        const v = pick('win_rate_percent', 'win_rate', 'win_rate_pct')
        if (v == null) return undefined
        return (v > 0 && v <= 1) ? v * 100 : v
      })(),
      max_drawdown_percent: pick('max_drawdown_percent', 'max_drawdown', 'max_drawdown_pct'),
      avg_drawdown_percent: pick('avg_drawdown_percent', 'avg_drawdown', 'avg_drawdown_pct'),
      max_drawdown_duration: pick('max_drawdown_duration'),
      avg_drawdown_duration: pick('avg_drawdown_duration'),
      sharpe_ratio: pick('sharpe_ratio', 'sharpe'),
      sortino_ratio: pick('sortino_ratio', 'sortino'),
      calmar_ratio: pick('calmar_ratio', 'calmar'),
      num_trades: pick('num_trades', 'total_trades', 'trades_count'),
      best_trade_percent: pick('best_trade_percent', 'best_trade', 'best_trade_pct'),
      worst_trade_percent: pick('worst_trade_percent', 'worst_trade', 'worst_trade_pct'),
      exposure_time_percent: pick('exposure_time_percent', 'exposure_time', 'exposure'),
      equity_peak: pick('equity_peak', 'peak_equity', 'peak'),
      buy_hold_return_percent: pick('buy_hold_return_percent', 'buy_hold_return'),
      volatility_ann_percent: pick('volatility_ann_percent', 'volatility_ann', 'volatility'),
      avg_trade_percent: pick('avg_trade_percent', 'avg_trade', 'avg_trade_pct'),
      max_trade_duration: pick('max_trade_duration'),
      avg_trade_duration: pick('avg_trade_duration'),
      profit_factor: pick('profit_factor'),
      expectancy_percent: pick('expectancy_percent', 'expectancy'),
      sqn: pick('sqn', 'SQN'),
      data_source: raw.data_source ?? '',
      symbol: raw.symbol ?? '',
      data_start_date: raw.data_start_date ?? '',
      data_end_date: raw.data_end_date ?? '',
      status: raw.status ?? 'completed',
      error_message: raw.error_message ?? null,
    }
  }

  const loadBacktestResult = async (backtestId: string) => {
    try {
      setIsLoading(true)
      const raw = await getBacktestResultDetail(backtestId)
      const normalized = normalizeBacktestResult(raw)
      setBacktestDetail(normalized)
      setBacktestResultTab('graph')
      if (normalized.plot_html) {
        setPlotHtml(normalized.plot_html)
      }
      setActiveTab('backtest')
      showToast("Backtest details loaded successfully", 'success')
    } catch (err: any) {
      showToast("Failed to load backtest results: " + err.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDateForResult = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (e) {
      return dateString
    }
  }

  const formatDurationForResult = (startDate: string, endDate: string) => {
    try {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      return `${diffDays} days ${diffHours.toString().padStart(2, '0')}:00:00`
    } catch (e) {
      return 'N/A'
    }
  }

  // Helper function to map MetaAPI symbols to Backtest instruments
  const mapSymbolToInstrument = (symbol: string): string | null => {
    const symbolUpper = symbol.toUpperCase().replace(/\./g, '') // Remove dots like in XAUUSD.a

    // Map to the exact instrument names in the instruments list
    if (symbolUpper.includes('XAUUSD') || symbolUpper.includes('GOLD')) return 'XAUUSD'
    if (symbolUpper.includes('GBPUSD')) return 'GBP/USD'
    if (symbolUpper.includes('USDJPY')) return 'USD/JPY'
    if (symbolUpper.includes('USDCHF')) return 'USD/CHF'
    if (symbolUpper.includes('FTSE') || symbolUpper.includes('UK100')) return 'FTSE100'
    if (symbolUpper.includes('US30') || symbolUpper.includes('DJ30') || symbolUpper.includes('DJIA')) return 'US30'
    if (symbolUpper.includes('NAS100') || symbolUpper.includes('NASDAQ')) return 'NASDAQ'

    return null
  }

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

  // Load last backtest result on mount
  useEffect(() => {
    let isCancelled = false

    if (strategy_id) {
      // Reset result states when switching strategies to avoid showing stale data
      setBacktestDetail(null)
      setPlotHtml(null)
      setOptimisationResult(null)
      setShowOptimisationResults(false)
      setPlotHeatmapHtml(null)
      setWalkForwardOptimizationResults([])
      setWalkForwardDetailResult(null)
      setShowWalkForwardOptimizationResults(false)
      setBacktestResultTab('graph')
      setOptimisationTab('results')
      setOptimisationStdout("")
      setOptimisationStderr("")
      setTradesData({
        tradesCsv: '',
        tradesCsvFilename: '',
        tradesCsvDownloadUrl: '',
        stdout: '',
        stderr: ''
      })

      getStrategyBacktestResults(strategy_id)
        .then((response: any) => {
          if (isCancelled) return

          // Response might be direct array or paginated object { results: [] }
          const results = Array.isArray(response) ? response : (response?.results || [])
          if (results.length > 0) {
            // Sort by date descending
            const sorted = [...results].sort((a, b) =>
              new Date(b.backtest_date || b.created_at || b.date).getTime() -
              new Date(a.backtest_date || a.created_at || a.date).getTime()
            )
            loadBacktestResult(sorted[0].id.toString())
          }
        })
        .catch(err => console.error("Error fetching initial backtest results:", err))

      // Also load last optimization result
      getStrategyOptimizationResults(strategy_id)
        .then(async (response: any) => {
          if (isCancelled) return

          const results = Array.isArray(response) ? response : (response?.results || [])
          if (results.length > 0) {
            // Sort by date descending
            const sorted = [...results].sort((a, b) =>
              new Date(b.optimization_date || b.created_at || b.date).getTime() -
              new Date(a.optimization_date || a.created_at || a.date).getTime()
            )
            const latestId = sorted[0].id;
            console.log("🚀 Auto-loading latest optimization result:", latestId);
            try {
              const detail = await getOptimizationResultDetail(latestId);
              if (isCancelled) return

              setOptimisationResult(detail);
              setShowOptimisationResults(true);
              setOptimisationTab('results');
            } catch (err) {
              console.error("❌ Failed to load latest optimization detail:", err);
            }
          }
        })
        .catch(err => console.error("Error fetching initial optimization results:", err))
    }

    return () => {
      isCancelled = true
    }
  }, [strategy_id])

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

          // Load timezone from TradingSession if available
          if (parsed.TradingSession?.Timezone) {
            setTimezone(parsed.TradingSession.Timezone)
          }

          // Load date range if available
          if (parsed.date_range) {
            setDateRange(parsed.date_range)
          }

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
            setAssetType(parsed.TradingType.asset_type || "gold")
            setPositionSize(parsed.TradingType.position_size?.toString() || "1")

            // Update the parsed statement with the dynamic commission value
            const updatedStatement = {
              ...parsed,
              TradingType: {
                ...parsed.TradingType,
                commission: Number.parseFloat(currentCommission),
                asset_type: parsed.TradingType.asset_type || "gold",
                position_size: parsed.TradingType.position_size || 1
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
                                margin === 0.01 ? "1:100" :
                                  margin === 0.005 ? "1:200" :
                                    margin === 0.002 ? "1:500" : "1:1"
              setLeverage(leverage)
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
        let id = urlParams.get("id")
        const isCustomStrategy = urlParams.get("custom") === "true"

        if (!id) {
          try {
            id = localStorage.getItem("strategy_id")
          } catch { }
        }

        if (id) {
          try {
            let strategyData

            if (isCustomStrategy) {
              // Fetch custom strategy from CustomComponent model
              const customStrategy = await getCustomStrategy(Number(id))
              console.log("🔍 Loaded custom strategy:", customStrategy)

              // Transform custom strategy data to match expected format
              strategyData = {
                id: customStrategy.id,
                name: customStrategy.name,
                code: customStrategy.code,
                compiled_code: customStrategy.compiled_code,
                parameters: customStrategy.parameters,
                status: customStrategy.status,
                type: "custom_strategy",
                // Set default values for backtesting
                side: "buy",
                saveresult: "true",
                strategy: [], // Custom strategies don't use the visual builder format
                instrument: "XAUUSD",
                TradingType: {
                  NewTrade: "MTOOTAAT",
                  commission: 0.00007,
                  margin: 1,
                  lot: "mini",
                  cash: 100000,
                  nTrade_max: 1,
                },
                // Mark as custom strategy for backtest handling
                is_custom_strategy: true,
                custom_strategy_id: customStrategy.id,
              }
            } else {
              // Fetch regular strategy
              strategyData = await fetchStatementDetail(id)
            }

            // Store the fetched data in localStorage
            localStorage.setItem("savedStrategy", JSON.stringify(strategyData))
            // Ensure the id is persisted for future back/forward flows
            localStorage.setItem("strategy_id", String(id))
            if (isCustomStrategy) {
              localStorage.setItem("is_custom_strategy", "true")
            } else {
              localStorage.removeItem("is_custom_strategy")
            }

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
              const resolvedId = String(strategyData.id)
              localStorage.setItem("strategy_id", resolvedId)
              setStrategyId(resolvedId)
            } else if (id) {
              const resolvedId = String(id)
              localStorage.setItem("strategy_id", resolvedId)
              setStrategyId(resolvedId)
            }

            // Update component state
            setStrID(JSON.stringify(strategyData))
            setStrategy(JSON.stringify(strategyData))
            setParsedStatement(strategyData)

            // Load date range if available
            if (strategyData.date_range) {
              setDateRange(strategyData.date_range)
            }

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

              // Auto-select the corresponding instrument in Backtest tab
              const mappedInstrument = mapSymbolToInstrument(symbol)
              if (mappedInstrument) {
                setSelectedInstruments([mappedInstrument])
              }
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

  // Helper function to detect timeframe from CSV timestamps
  const detectTimeframeFromTimestamps = (csvContent: string): { detected: boolean; timeframeMinutes: number; timeframeLabel: string; matchesRequired: boolean } => {
    const lines = csvContent.split('\n')
    if (lines.length < 3) {
      return { detected: false, timeframeMinutes: 0, timeframeLabel: '', matchesRequired: false }
    }

    // Get headers to find the time/timestamp column
    const headers = lines[0].toLowerCase().split(',').map(col => col.trim())
    const timeColumnIndex = headers.findIndex(h =>
      h === 'time' || h === 'timestamp' || h === 'datetime' || h === 'date' || h === 'unix' || h === 'epoch'
    )

    // If no time column header found, assume first column is timestamp
    const colIndex = timeColumnIndex >= 0 ? timeColumnIndex : 0
    console.log("🔍 Using column index for timestamps:", colIndex, "Header:", headers[colIndex])

    // Get timestamps from first few rows (skip header)
    const timestamps: number[] = []
    for (let i = 1; i < Math.min(5, lines.length); i++) {
      const row = lines[i].split(',')
      if (row[colIndex]) {
        const val = row[colIndex].trim()
        // Check if it's a Unix timestamp (number)
        const timestamp = parseInt(val, 10)
        if (!isNaN(timestamp) && timestamp > 1000000000) { // Valid Unix timestamp
          timestamps.push(timestamp)
        }
      }
    }

    console.log("🔍 Extracted timestamps:", timestamps)

    if (timestamps.length < 2) {
      return { detected: false, timeframeMinutes: 0, timeframeLabel: '', matchesRequired: false }
    }

    // Calculate differences between consecutive timestamps
    const differences: number[] = []
    for (let i = 1; i < timestamps.length; i++) {
      differences.push(timestamps[i] - timestamps[i - 1])
    }

    // Get the most common difference (in case of gaps)
    const avgDiff = differences.reduce((a, b) => a + b, 0) / differences.length
    const timeframeSeconds = Math.round(avgDiff)
    const timeframeMinutes = Math.round(timeframeSeconds / 60)

    console.log("🔍 Timestamp differences (seconds):", differences)
    console.log("🔍 Average difference:", avgDiff, "seconds =", timeframeMinutes, "minutes")

    // Convert minutes to human-readable label
    let timeframeLabel = ''
    if (timeframeMinutes >= 1440) {
      timeframeLabel = `${Math.round(timeframeMinutes / 1440)}d`
    } else if (timeframeMinutes >= 60) {
      timeframeLabel = `${Math.round(timeframeMinutes / 60)}h`
    } else {
      timeframeLabel = `${timeframeMinutes}min`
    }

    console.log("🔍 Detected timeframe:", timeframeLabel, `(${timeframeMinutes} minutes)`)

    // Check if detected timeframe matches any required timeframe
    const timeframeToMinutes: { [key: string]: number } = {
      "1min": 1, "5min": 5, "15min": 15, "20min": 20, "30min": 30, "36min": 36, "45min": 45,
      "1h": 60, "2h": 120, "3h": 180, "4h": 240, "6h": 360, "8h": 480, "12h": 720,
      "1d": 1440, "1 day": 1440, "1w": 10080, "1 week": 10080
    }

    const matchesRequired = requiredTimeframes.some(tf => {
      const requiredMinutes = timeframeToMinutes[tf.toLowerCase()]
      if (requiredMinutes) {
        // Allow some tolerance (±5% or ±1 minute for small timeframes)
        const tolerance = Math.max(1, requiredMinutes * 0.05)
        const matches = Math.abs(timeframeMinutes - requiredMinutes) <= tolerance
        if (matches) {
          console.log(`✅ Timeframe ${timeframeLabel} matches required ${tf}`)
        }
        return matches
      }
      return false
    })

    return {
      detected: true,
      timeframeMinutes,
      timeframeLabel,
      matchesRequired
    }
  }

  // Helper function to check CSV columns for timeframe patterns (legacy fallback)
  const checkCsvColumnsForTimeframe = (csvContent: string): boolean => {
    // Get the first line (headers)
    const firstLine = csvContent.split('\n')[0]
    if (!firstLine) return false

    const columns = firstLine.toLowerCase().split(',').map(col => col.trim())
    console.log("🔍 CSV columns found:", columns)

    // Pattern to match timeframe columns like open_45min, close_30min, high_1h, etc.
    const timeframeColumnPattern = /^(open|close|high|low|volume|datetime|date|time)_\d+(min|h|d|w)?$/i

    // Also check for any column containing timeframe patterns
    const hasTimeframeColumn = columns.some(col => {
      if (timeframeColumnPattern.test(col)) {
        console.log("✅ Found timeframe column:", col)
        return true
      }

      const generalTimeframePattern = /_\d+(min|h|d|w)$/i
      if (generalTimeframePattern.test(col)) {
        console.log("✅ Found column with timeframe suffix:", col)
        return true
      }

      return false
    })

    return hasTimeframeColumn
  }

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

      // For CSV files, check timestamps to detect timeframe
      if (fileExtension === "csv") {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          if (content) {
            console.log("🔍 File upload validation:", {
              filename: file.name,
              requiredTimeframes,
              fileExtension
            })

            // Primary check: detect timeframe from timestamps
            const timestampResult = detectTimeframeFromTimestamps(content)

            // Fallback checks
            const hasValidTimeframeColumn = checkCsvColumnsForTimeframe(content)
            const matchesFilename = requiredTimeframes.some(timeframe =>
              matchesTimeframe(file.name, timeframe)
            )

            console.log("🔍 Validation results:", {
              timestampResult,
              hasValidTimeframeColumn,
              matchesFilename
            })

            if (timestampResult.detected && timestampResult.matchesRequired) {
              // Best case: timestamp analysis confirms matching timeframe
              setShowSuccessModal(true)
              showToast(`File uploaded successfully! Detected ${timestampResult.timeframeLabel} timeframe data.`, 'success')
            } else if (timestampResult.detected && !timestampResult.matchesRequired) {
              // Timestamp detected but doesn't match required
              showToast(`File contains ${timestampResult.timeframeLabel} data but required timeframes are: ${requiredTimeframes.join(', ')}. You may get incorrect results.`, 'warning')
            } else if (hasValidTimeframeColumn || matchesFilename) {
              // Fallback: column names or filename match
              setShowSuccessModal(true)
              showToast(`File uploaded successfully! Valid timeframe pattern found.`, 'success')
            } else {
              // No valid timeframe detected
              showToast(`File uploaded but couldn't detect timeframe. Required: ${requiredTimeframes.join(', ')}. You may get incorrect results.`, 'warning')
            }
          }
        }
        reader.onerror = () => {
          // If we can't read the file, fall back to filename matching
          const matchesAnyTimeframe = requiredTimeframes.some(timeframe =>
            matchesTimeframe(file.name, timeframe)
          )
          if (matchesAnyTimeframe) {
            setShowSuccessModal(true)
            showToast(`File uploaded successfully! Matches required timeframe.`, 'success')
          } else {
            showToast(`File uploaded but couldn't verify timeframe data.`, 'warning')
          }
        }
        reader.readAsText(file)
      } else {
        // For .py files, just accept them
        setShowSuccessModal(true)
        showToast(`Python file uploaded successfully!`, 'success')
      }
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

    console.log("🔍 Checking timeframe match:", { filename, timeframe, lowerFilename, lowerTimeframe })

    // Direct matching (e.g., "3h" in filename)
    if (lowerFilename.includes(lowerTimeframe)) {
      console.log("✅ Direct match found for", timeframe)
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

    // Extract the minute value for the timeframe
    const minutes = timeframeToMinutes[lowerTimeframe]

    if (minutes) {
      // Check if the filename contains the minute value
      const minutesStr = minutes.toString()

      // Use word boundary regex to avoid partial matches
      // For example, "20" in "120" should not match "20m"
      const regex = new RegExp(`\\b${minutesStr}\\b`)
      const isStandaloneNumber = regex.test(lowerFilename)

      console.log("🔍 Minute check:", {
        timeframe,
        minutes,
        minutesStr,
        lowerFilename,
        isStandaloneNumber,
        regex: regex.toString()
      })

      if (isStandaloneNumber) {
        console.log("✅ Minute match found for", timeframe, "(" + minutes + " minutes)")
        return true
      }
    }

    // Additional check: Look for common timeframe patterns in filename
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
      for (const pattern of patterns) {
        if (lowerFilename.includes(pattern.toLowerCase())) {
          console.log("✅ Pattern match found for", timeframe, "using pattern:", pattern)
          return true
        }
      }
    }

    console.log("❌ No match found for", timeframe, "in", filename)
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

      let result: any

      // Check if this is a custom strategy
      const isCustomStrategy = parsedStatement?.is_custom_strategy ||
        localStorage.getItem("is_custom_strategy") === "true"

      if (isCustomStrategy) {
        // Use custom strategy backtest API
        const customStrategyId = parsedStatement?.custom_strategy_id || parsedStatement?.id
        const symbol = metaAPIConfig?.symbol || "XAUUSD"

        console.log("🔍 Running custom strategy backtest:", {
          customStrategyId,
          symbol,
          isCustomStrategy
        })

        result = await runCustomStrategyBacktest({
          strategy_id: customStrategyId,
          params: parsedStatement?.parameters || {},
          initial_equity: Number(accountDeposit.replace(/,/g, "")) || 10000,
          symbol: symbol
        })

        console.log("Custom strategy backtest result:", result)

        // Handle custom strategy backtest result
        if (result) {
          // Normalize the response to match expected format
          const normalizedResult = {
            message: result.message || "Custom strategy backtest completed.",
            custom_strategy_id: result.custom_strategy_id || customStrategyId,
            custom_strategy_name: result.custom_strategy_name || parsedStatement?.name || "Custom Strategy",
            data_source: result.data_source || result.metadata?.data_source || "custom",
            symbol: result.symbol || result.metadata?.symbol || symbol,
            initial_equity: result.initial_equity || Number(accountDeposit.replace(/,/g, "")) || 10000,
            final_equity: result.final_equity || 0,
            return_percent: result.return_percent ?? result.total_return ?? 0,
            num_trades: result.num_trades || 0,
            win_rate_percent: result.win_rate_percent ?? result.win_rate ?? 0,
            max_drawdown_percent: result.max_drawdown_percent ?? result.max_drawdown ?? 0,
            sharpe_ratio: result.sharpe_ratio || 0,
            equity_curve: result.equity_curve || [],
            trades: result.trades || [],
            statistics: result.statistics || {
              win_rate: result.win_rate ?? result.win_rate_percent ?? 0,
              max_drawdown: result.max_drawdown ?? result.max_drawdown_percent ?? 0,
              sharpe_ratio: result.sharpe_ratio || 0,
              total_trades: result.num_trades || 0,
              total_return: result.total_return ?? result.return_percent ?? 0,
              profit_factor: result.profit_factor || 0
            },
            plot_html: result.plot_html || null,
            csv_url: result.csv_url || null,
            metadata: result.metadata || {}
          }

          // Store the result in sessionStorage for the results page
          sessionStorage.setItem('customBacktestResult', JSON.stringify(normalizedResult))

          // Set backtest detail for in-page display
          setBacktestDetail(normalizeBacktestResult(normalizedResult))
          setBacktestResultTab('chart_data')

          // Also set plot HTML if available
          if (normalizedResult.plot_html) {
            setPlotHtml(normalizedResult.plot_html)
          }

          showToast("Custom strategy backtest completed!", 'success')
        }
      } else if (useMetaAPI) {
        const symbol = metaAPIConfig?.symbol || "XAUUSD"
        const token = process.env.NEXT_PUBLIC_METAAPI_ACCESS_TOKEN || ""
        const accountId = process.env.NEXT_PUBLIC_METAAPI_ACCOUNT_ID || ""

        console.log("🔍 Using trading symbol for MetaAPI backtest:", symbol)
        console.log("🔍 MetaAPI Token available:", !!token)
        console.log("🔍 MetaAPI Account ID available:", !!accountId)

        if (!token || !accountId) {
          throw new Error("MetaAPI credentials not configured. Please check environment variables.")
        }

        // Fire the request — if backend is async it returns {run_id} immediately,
        // if sync it blocks until done. Either way we handle both.
        const backtestPromise = runBacktestWithMetaAPI(
          parsedStatement,
          token,
          accountId,
          symbol,
          null as any
        )

        // Wait for response — async backend resolves fast with run_id, sync backend blocks
        const startData = await backtestPromise
        console.log("Backtest response:", startData)
        console.log("run_id:", startData?.run_id, "| status:", startData?.status)

        if (startData?.run_id && startData?.status === 'started') {
          backtestRunIdRef.current = startData.run_id
          console.log("✅ Async mode — stored run_id:", startData.run_id)
          const { promise, stop } = (pollJobStatus as any)(startData.run_id, { intervalMs: 3000 })
          backtestPollerRef.current = stop
          try {
            result = await promise
          } catch (e: any) {
            if (e?.message === 'cancelled') return // user cancelled — stop processing
            throw e
          }
          backtestPollerRef.current = null
        } else {
          console.log("ℹ️ Sync mode — full result returned directly (cancel not supported in sync mode)")
          result = startData
        }

        // Handle plot HTML
        if (result?.plot_html) {
          setPlotHtml(result.plot_html)
        }

        // Handle trades CSV data — redirect to results page
        const resultId = result?.backtest_result_id || result?.backtest_id || result?.result?.backtest_result_id
        if (resultId) {
          showToast("Backtest completed!", 'success')
          loadBacktestResult(resultId)
        } else if (result?.trades_csv) {
          showToast("Backtest completed but no result ID returned.", 'warning')
        } else if (!result?.plot_html) {
          showToast("Backtest completed but no data returned", 'error')
        }
      } else {
        // File upload method
        const timeframeFiles: Record<string, File> = {}
        requiredTimeframes.forEach((timeframe, index) => {
          const filename = uploadedFiles[index]
          if (filename && fileObjects[filename]) timeframeFiles[timeframe] = fileObjects[filename]
        })
        uploadedFiles.forEach((filename) => {
          if (!Object.values(timeframeFiles).includes(fileObjects[filename])) {
            timeframeFiles[filename.split(".")[0]] = fileObjects[filename]
          }
        })

        // Step 1: start the job
        const startData = await (runBacktest as any)({ statement: parsedStatement, files: timeframeFiles })
        console.log("Backtest response:", startData)
        console.log("run_id:", startData?.run_id, "| status:", startData?.status)

        if (startData?.run_id && startData?.status === 'started') {
          backtestRunIdRef.current = startData.run_id
          console.log("✅ Async mode — stored run_id:", startData.run_id)
          const { promise, stop } = (pollJobStatus as any)(startData.run_id, { intervalMs: 3000 })
          backtestPollerRef.current = stop
          try {
            result = await promise
          } catch (e: any) {
            if (e?.message === 'cancelled') return
            throw e
          }
          backtestPollerRef.current = null
        } else {
          console.log("ℹ️ Sync mode — full result returned directly")
          result = startData
        }

        if (result?.plot_html) setPlotHtml(result.plot_html)

        const resultId2 = result?.backtest_result_id || result?.backtest_id || result?.result?.backtest_result_id
        if (resultId2) {
          showToast("Backtest completed!", 'success')
          loadBacktestResult(resultId2)
        } else if (result?.trades_csv) {
          showToast("Backtest completed but no result ID returned.", 'warning')
        } else if (!result?.plot_html) {
          showToast("Backtest completed but no data returned", 'error')
        }
      }
    } catch (error: any) {
      console.error("Backtest Error:", error)

      // Check if this is a MetaAPI-related error
      const errorMessage = error.message || "Unknown error"
      const isMetaAPIError = useMetaAPI && metaAPIConfig && (
        errorMessage.toLowerCase().includes("symbol") ||
        errorMessage.toLowerCase().includes("timeframe") ||
        errorMessage.toLowerCase().includes("metaapi") ||
        errorMessage.toLowerCase().includes("candles") ||
        errorMessage.toLowerCase().includes("broker")
      )

      if (isMetaAPIError) {
        // Extract required timeframes from the strategy
        const requiredTimeframes = parsedStatement?.strategy
          ?.filter((step: any) => step.function && step.vars && step.vars.timeframe)
          .map((step: any) => step.vars.timeframe) || []

        // Show detailed MetaAPI debug modal
        setMetaAPIError({
          message: errorMessage,
          details: error,
          symbol: metaAPIConfig?.symbol || parsedStatement?.instrument,
          timeframes: requiredTimeframes,
        })
        setShowMetaAPIDebugModal(true)
      } else {
        // Show normal error toast for non-MetaAPI errors
        showToast("Backtest Error: " + errorMessage, 'error')
      }
    } finally {
      setIsLoading(false)
      backtestRunIdRef.current = null
    }
  }

  const cancelBacktestRun = () => {
    backtestPollerRef.current?.()
    backtestPollerRef.current = null
    const runId = backtestRunIdRef.current
    backtestRunIdRef.current = null
    if (runId) {
      cancelBacktest(runId as any)
        .then((r) => console.log("✅ cancel-backtest:", r))
        .catch((e) => console.error("❌ cancel-backtest failed:", e))
    }
    setIsLoading(false)
    showToast("Backtest cancelled", 'warning')
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

      let startData: any = null;
      // Use MetaAPI or file upload based on the mode
      if (useMetaAPI) {
        const symbol = metaAPIConfig?.symbol || "XAUUSD"
        const token = process.env.NEXT_PUBLIC_METAAPI_ACCESS_TOKEN || ""
        const accountId = process.env.NEXT_PUBLIC_METAAPI_ACCOUNT_ID || ""

        console.log("🔍 Using trading symbol for MetaAPI optimization:", symbol)
        if (!token || !accountId) {
          throw new Error("MetaAPI credentials not configured. Please check environment variables.")
        }

        startData = await (runOptimisation as any)({
          statement: optimisationStatement,
          strategy_statement_id: strategy_id ? strategy_id : null,
          wait,
          metaapi_token: token,
          metaapi_account_id: accountId,
          symbol: symbol,
        })

        if (startData?.run_id && startData?.status === 'started') {
          optimisationRunIdRef.current = startData.run_id
          console.log("✅ Stored optimisation run_id for cancel:", startData.run_id)
          const { promise, stop } = (pollJobStatus as any)(startData.run_id, { intervalMs: 3000 })
          optimisationPollerRef.current = stop
          try {
            result = await promise
          } catch (e: any) {
            if (e?.message === 'cancelled') return
            throw e
          }
          optimisationPollerRef.current = null
        } else {
          result = startData
        }
      } else {
        startData = await (runOptimisation as any)({
          statement: optimisationStatement,
          files: timeframeFiles,
          strategy_statement_id: strategy_id ? strategy_id : null,
          wait,
        })

        if (startData?.run_id && startData?.status === 'started') {
          optimisationRunIdRef.current = startData.run_id
          console.log("✅ Stored optimisation run_id for cancel:", startData.run_id)
          const { promise, stop } = (pollJobStatus as any)(startData.run_id, { intervalMs: 3000 })
          optimisationPollerRef.current = stop
          try {
            result = await promise
          } catch (e: any) {
            if (e?.message === 'cancelled') return
            throw e
          }
          optimisationPollerRef.current = null
        } else {
          result = startData
        }
      }

      console.log("Full optimization response:", result)

      // Unwrap polled result — pollJobStatus resolves with { status, result: {...} }
      const polledResult = result?.result ?? result

      // Capture optional message/stdout/stderr from response
      setOptimisationMessage(polledResult?.message || result?.message || "")
      setOptimisationStdout(polledResult?.stdout || result?.stdout || "")
      setOptimisationStderr(polledResult?.stderr || result?.stderr || "")
      // Handle the response — treat polledResult as the actual result data
      if (polledResult) {
        // If we have a run_id, fetch the full detail to ensure we have previewRows/table data
        const runId = result?.run_id || startData?.run_id || polledResult?.id || polledResult?.run_id || result?.id || result?.runId;

        // Add a small delay and a retry mechanism to ensure backend has finished processing
        const fetchWithRetry = async (retryCount = 0) => {
          try {
            console.log(`🔄 Fetching full optimization detail (Attempt ${retryCount + 1}) for ID:`, runId);
            const fullDetail = await getOptimizationResultDetail(runId);

            // Verify if the result is actually "full" (has table or preview rows)
            const hasTableData = fullDetail?.optimisation_preview?.length > 0 ||
              fullDetail?.full_optimization_results?.length > 0 ||
              fullDetail?.table?.length > 0 ||
              fullDetail?.results?.length > 0;

            if (hasTableData || retryCount >= 3) {
              console.log("✅ Successfully fetched full optimization data");
              setOptimisationResult(fullDetail);
              if (fullDetail.heatmap_plot_html) {
                setPlotHeatmapHtml(fullDetail.heatmap_plot_html);
              }
            } else {
              console.log("⏳ Data not yet available, retrying in 2s...");
              setTimeout(() => fetchWithRetry(retryCount + 1), 2000);
            }
          } catch (fetchErr) {
            console.error("❌ Failed to fetch full detail, using polled result:", fetchErr);
            setOptimisationResult(polledResult);
          }
        };

        if (runId) {
          // Start the fetch process after a small initial delay
          setTimeout(() => fetchWithRetry(0), 1000);
        } else {
          setOptimisationResult(polledResult);
        }

        setActiveTab("optimisation");
        setShowOptimisationResults(true);
        setOptimisationTab('results');
        setOptimizationResults(prev => Array.isArray(prev) ? [...prev, polledResult] : [polledResult])
        if (polledResult.heatmap_plot_html) {
          setPlotHeatmapHtml(polledResult.heatmap_plot_html)
        } else {
          setPlotHeatmapHtml(null)
        }
        if (polledResult.trades_plot_html) {
          setPlotHtml(polledResult.trades_plot_html)
        }
        setOptimizationStatus("completed")
        setCurrentOptimizationId(result?.optimization_id || polledResult?.optimization_id || null)
        return
      }

      showToast("No optimisation result received", 'error')
    } catch (error: any) {
      console.error("Optimisation Error:", error)

      // Check if this is a MetaAPI-related error
      const errorMessage = error.message || "Unknown error"
      const isMetaAPIError = useMetaAPI && metaAPIConfig && (
        errorMessage.toLowerCase().includes("symbol") ||
        errorMessage.toLowerCase().includes("timeframe") ||
        errorMessage.toLowerCase().includes("metaapi") ||
        errorMessage.toLowerCase().includes("candles") ||
        errorMessage.toLowerCase().includes("broker")
      )

      if (isMetaAPIError) {
        // Extract required timeframes from the strategy
        const requiredTimeframes = parsedStatement?.strategy
          ?.filter((step: any) => step.function && step.vars && step.vars.timeframe)
          .map((step: any) => step.vars.timeframe) || []

        // Show detailed MetaAPI debug modal
        setMetaAPIError({
          message: errorMessage,
          details: error,
          symbol: metaAPIConfig?.symbol || parsedStatement?.instrument,
          timeframes: requiredTimeframes,
        })
        setShowMetaAPIDebugModal(true)
      } else {
        // Show normal error toast for non-MetaAPI errors
        showToast("Optimisation Error: " + errorMessage, 'error')
      }
    } finally {
      setIsLoading2(false)
      optimisationRunIdRef.current = null
    }
  }

  const cancelOptimisation = () => {
    optimisationPollerRef.current?.()
    optimisationPollerRef.current = null
    const runId = optimisationRunIdRef.current
    optimisationRunIdRef.current = null
    if (runId) {
      cancelOptimisationRun(runId as any)
        .then((r) => console.log("✅ cancel-optimisation:", r))
        .catch((e) => console.error("❌ cancel-optimisation failed:", e))
    }
    setIsLoading2(false)
    showToast("Optimisation cancelled", 'warning')
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

      const startData = await runWalkForwardOptimisation(apiParams)

      let result: any
      if (startData?.run_id && startData?.status === 'started') {
        walkForwardRunIdRef.current = startData.run_id
        console.log("✅ Stored walk forward run_id for cancel:", startData.run_id)
        const { promise, stop } = (pollJobStatus as any)(startData.run_id, { intervalMs: 3000 })
        walkForwardPollerRef.current = stop
        try {
          result = await promise
        } catch (e: any) {
          if (e?.message === 'cancelled') return
          throw e
        }
        walkForwardPollerRef.current = null
      } else {
        result = startData
      }

      console.log("Walk Forward optimization response:", result)
      console.log("Result status:", result?.status)
      console.log("Result message:", result?.message)

      // Unwrap polled result — pollJobStatus resolves with { status, result: {...} }
      const resultData = result?.result ?? result;

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
      console.error("Walk Forward Optimisation Error:", error)

      // Check if this is a MetaAPI-related error
      const errorMessage = error.message || "Unknown error"
      const isMetaAPIError = useMetaAPI && metaAPIConfig && (
        errorMessage.toLowerCase().includes("symbol") ||
        errorMessage.toLowerCase().includes("timeframe") ||
        errorMessage.toLowerCase().includes("metaapi") ||
        errorMessage.toLowerCase().includes("candles") ||
        errorMessage.toLowerCase().includes("broker")
      )

      if (isMetaAPIError) {
        // Extract required timeframes from the strategy
        const requiredTimeframes = parsedStatement?.strategy
          ?.filter((step: any) => step.function && step.vars && step.vars.timeframe)
          .map((step: any) => step.vars.timeframe) || []

        // Show detailed MetaAPI debug modal
        setMetaAPIError({
          message: errorMessage,
          details: error,
          symbol: metaAPIConfig?.symbol || parsedStatement?.instrument,
          timeframes: requiredTimeframes,
        })
        setShowMetaAPIDebugModal(true)
      } else {
        // Show normal error toast for non-MetaAPI errors
        showToast("Walk Forward Optimisation Error: " + errorMessage, 'error')
      }
    } finally {
      setIsLoading3(false)
      walkForwardRunIdRef.current = null
    }
  }

  const cancelWalkForward = () => {
    walkForwardPollerRef.current?.()
    walkForwardPollerRef.current = null
    const runId = walkForwardRunIdRef.current
    walkForwardRunIdRef.current = null
    if (runId) {
      cancelOptimisationRun(runId as any)
        .then((r) => console.log("✅ cancel-walk-forward:", r))
        .catch((e) => console.error("❌ cancel-walk-forward failed:", e))
    }
    setIsLoading3(false)
    showToast("Walk Forward Optimisation cancelled", 'warning')
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

    // Auto-select the corresponding instrument in Backtest tab
    if (config.symbol) {
      const mappedInstrument = mapSymbolToInstrument(config.symbol)
      if (mappedInstrument && !selectedInstruments.includes(mappedInstrument)) {
        setSelectedInstruments([mappedInstrument])
      }
    }
  }

  const [dateRange, setDateRange] = useState("2024.02.01 - 2024.08.01")
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>(["XAUUSD"])
  const [accountDeposit, setAccountDeposit] = useState("1,000")
  const [currency, setCurrency] = useState("USD")
  const [leverage, setLeverage] = useState("1:1")
  const [customLeverage, setCustomLeverage] = useState("")

  // Handle account deposit change
  const handleAccountDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAccountDeposit(value)
  }

  // Get margin value from leverage string
  const getLeverageMargin = (leverageStr: string): number => {
    // Handle custom leverage
    if (leverageStr === "custom" && customLeverage.trim()) {
      leverageStr = customLeverage.trim()
    }

    const ratio = Number.parseInt(leverageStr.split(":")[1])
    // For 1:1 leverage, margin should be 1.0 (100%)
    // For 1:2 leverage, margin should be 0.5 (50%)
    // For 1:10 leverage, margin should be 0.1 (10%)
    return ratio ? 1.0 / ratio : 0.09 // Default to 0.09 if parsing fails
  }

  // Handle leverage change from dropdown
  const handleLeverageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value
    if (selectedValue === "custom") {
      // Keep the dropdown on "custom" and don't change the leverage state
      setLeverage("custom")
    } else {
      // Set the predefined leverage value
      setLeverage(selectedValue)
      setCustomLeverage("") // Clear custom input
    }
  }

  // Handle custom leverage input
  const handleCustomLeverageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    console.log("🔍 Custom leverage input:", value)
    setCustomLeverage(value)
    // Don't update the main leverage state here - keep it as "custom"
    // The actual leverage value will be used from customLeverage when needed
  }

  const instruments = ["XAUUSD", "USD/JPY", "GBP/USD", "USD/CHF", "FTSE100", "US30", "NASDAQ"]

  const toggleInstrument = (instrument: string) => {
    // Only allow one instrument selection at a time
    setSelectedInstruments([instrument])
  }

  // Auto-select instrument when MetaAPI config changes
  useEffect(() => {
    if (metaAPIConfig?.symbol) {
      const mappedInstrument = mapSymbolToInstrument(metaAPIConfig.symbol)
      if (mappedInstrument) {
        // Always update to match current MetaAPI symbol
        setSelectedInstruments([mappedInstrument])
      }
    }
  }, [metaAPIConfig])  // Watch entire config object, not just symbol

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
      // Use custom leverage if available, otherwise use the selected leverage
      const actualLeverage = (leverage === "custom" && customLeverage.trim()) ? customLeverage.trim() : leverage
      const leverageMargin = getLeverageMargin(actualLeverage)

      console.log("🔍 Saving leverage settings:", {
        leverage,
        customLeverage,
        actualLeverage,
        leverageMargin
      })

      // Create the data object with trading mode consideration
      // Use dynamic commission from the form
      const tradingtype: any = {
        margin: leverageMargin,
        lot: lot,
        cash: cash,
        commission: commission, // Use dynamic commission from form
        NewTrade: selectedTradingMode, // Add the selected trading mode
        asset_type: assetType, // Add the asset type
        position_size: Number.parseFloat(positionSize) || 1, // Add position size with default value of 1
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
          position_size: Number.parseFloat(positionSize) || 1,
        },
        // Add date range
        date_range: dateRange,
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
  const [isPollingActive, setIsPollingActive] = useState(false)
  const isPollingRequestPendingRef = useRef(false)
  const hasFinalStatusRef = useRef(false)

  // New Optimization Droplets Flow Functions

  /**
   * Poll droplet job status (for droplet-based optimizations)
   */
  const startDropletJobPolling = async (jobId: number) => {
    // Prevent multiple polling instances for the same job
    if (isPollingActive && dropletJobId === jobId) {
      console.log(`⚠️ Polling already active for job ${jobId} - skipping`)
      return
    }

    // Don't start polling if we've already reached a final status
    if (hasFinalStatusRef.current) {
      console.log(`⚠️ Job ${jobId} already reached final status - skipping polling`)
      return
    }

    // Clear any existing polling
    if (dropletPollingInterval) {
      clearInterval(dropletPollingInterval)
      setDropletPollingInterval(null)
    }

    const isFinalStatus = (status: string) =>
      ["Completed", "Failed", "Cancelled", "completed", "failed", "cancelled"].includes(status)

    // Reset final status flag for new polling session
    hasFinalStatusRef.current = false

    // Check initial status before starting polling
    try {
      isPollingRequestPendingRef.current = true
      const initialJobData = await getOptimizationJob(jobId)
      isPollingRequestPendingRef.current = false
      console.log(`📊 Droplet Job ${jobId} Initial Check: ${initialJobData.status}`)

      setDropletJobStatus(initialJobData.status)

      // If job is already in a final state, don't start polling
      if (isFinalStatus(initialJobData.status)) {
        console.log(`✅ Job ${jobId} already ${initialJobData.status} - skipping polling`)
        hasFinalStatusRef.current = true
        setDropletJobResults(initialJobData)
        setIsPollingActive(false)

        if (initialJobData.status === 'Completed' || initialJobData.status === 'completed') {
          console.log('✅ Droplet job already completed:', initialJobData)
          // Don't show toast if we're just loading existing results
          // showToast('Optimization already completed!', 'success')
        } else if (initialJobData.status === 'Failed' || initialJobData.status === 'failed') {
          const errorMsg = formatErrorForDisplay(initialJobData.error_message || initialJobData, 'Unknown error')
          showToast(`Optimization failed: ${errorMsg}`, 'error')
        }
        return // Exit early - no need to poll
      }
    } catch (error) {
      isPollingRequestPendingRef.current = false
      console.error('Error checking initial job status:', error)
      // Continue with polling even if initial check fails
    }

    // Start polling only if job is not in final state
    setIsPollingActive(true)
    let stopped = false

    const interval = setInterval(async () => {
      // Early exit if polling has been stopped
      if (stopped) {
        console.log(`🛑 Polling stopped for job ${jobId}`)
        return
      }

      // Skip this polling cycle if previous request is still pending
      if (isPollingRequestPendingRef.current) {
        console.log(`⏳ Skipping poll for job ${jobId} - previous request still pending`)
        return
      }

      try {
        isPollingRequestPendingRef.current = true
        const jobData = await getOptimizationJob(jobId)
        isPollingRequestPendingRef.current = false
        console.log(`📊 Droplet Job ${jobId}: ${jobData.status} (Runtime: ${jobData.runtime_minutes} min)`)

        setDropletJobStatus(jobData.status)

        // Check if job has reached a final state
        if (isFinalStatus(jobData.status)) {
          console.log(`🛑 Job ${jobId} reached final status: ${jobData.status} - stopping polling`)

          // Set all flags to stop polling completely
          stopped = true
          hasFinalStatusRef.current = true
          clearInterval(interval)
          setDropletPollingInterval(null)
          setIsPollingActive(false)
          isPollingRequestPendingRef.current = false

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
            const errorMsg = formatErrorForDisplay(jobData.error_message || jobData, 'Unknown error')
            console.log(`❌ Droplet job failed:`, errorMsg)
            showToast(`Optimization failed: ${errorMsg}`, 'error')
          } else if (jobData.status === 'Cancelled' || jobData.status === 'cancelled') {
            console.log(`⚠️ Droplet job cancelled`)
            showToast('Optimization job was cancelled', 'warning')
          }

          // Ensure polling has fully stopped
          console.log(`✅ Polling cleanup complete for job ${jobId}`)
          return // Exit the interval callback after final status
        }
      } catch (error) {
        isPollingRequestPendingRef.current = false
        console.error(`❌ Error polling droplet job status for job ${jobId}:`, error)

        // Stop polling on error to prevent infinite error loops
        stopped = true
        clearInterval(interval)
        setDropletPollingInterval(null)
        setIsPollingActive(false)

        console.log(`🛑 Polling stopped due to error for job ${jobId}`)
      }
    }, 60000) // Poll every 1 minute (60 seconds)

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
        setIsPollingActive(false)
        isPollingRequestPendingRef.current = false
        hasFinalStatusRef.current = false
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

      // Backend returns { status: 'creating', run_id: 'droplet_272_xxx' }
      // The run_id is the job identifier
      const runId = jobResult.run_id
      const jobId = jobResult.job_id || jobResult.id // Try multiple fields

      if (!runId) {
        throw new Error("No run_id returned from optimization job creation")
      }

      // Use run_id as the job identifier if job_id is not available
      const jobIdentifier = jobId || runId

      setDropletJobId(jobId || null)
      setDropletJobStatus(jobResult.status || 'creating')
      // Store run_id for cancel
      optimisationRunIdRef.current = runId

      showToast(`Optimization job created! Redirecting to results page...`, 'success')

      // Redirect immediately to optimization results page
      // The results page will handle polling and showing progress
      // Use run_id as the job identifier in the URL
      setTimeout(() => {
        router.push(`/optimization-results?job_id=${jobIdentifier}&type=droplet`)
      }, 500)

    } catch (error: any) {
      console.error("Error creating optimization job:", error)

      // Error Handling: 403, 400, 500, Network errors
      if (error.message.includes('401') || error.message.includes('403')) {
        showToast("Authentication failed. Please login again.", 'error')
        // Redirect to login
        router.push('/auth')
      } else if (error.message.includes('400')) {
        // Check if this is a MetaAPI-related error
        const errorMessage = error.message || "Unknown error"
        const isMetaAPIError = useMetaAPI && metaAPIConfig && (
          errorMessage.toLowerCase().includes("symbol") ||
          errorMessage.toLowerCase().includes("timeframe") ||
          errorMessage.toLowerCase().includes("metaapi") ||
          errorMessage.toLowerCase().includes("candles") ||
          errorMessage.toLowerCase().includes("broker")
        )

        if (isMetaAPIError) {
          // Extract required timeframes from the strategy
          const requiredTimeframes = parsedStatement?.strategy
            ?.filter((step: any) => step.function && step.vars && step.vars.timeframe)
            .map((step: any) => step.vars.timeframe) || []

          // Show detailed MetaAPI debug modal
          setMetaAPIError({
            message: errorMessage,
            details: error,
            symbol: metaAPIConfig?.symbol || parsedStatement?.instrument,
            timeframes: requiredTimeframes,
          })
          setShowMetaAPIDebugModal(true)
        } else {
          showToast("Invalid parameters: " + errorMessage, 'error')
        }
      } else if (error.message.includes('500')) {
        showToast("Server error. Please try again later.", 'error')
      } else {
        // Check if this is a MetaAPI-related error for connection failures
        const errorMessage = error.message || "Unknown error"
        const isMetaAPIError = useMetaAPI && metaAPIConfig && (
          errorMessage.toLowerCase().includes("symbol") ||
          errorMessage.toLowerCase().includes("timeframe") ||
          errorMessage.toLowerCase().includes("metaapi") ||
          errorMessage.toLowerCase().includes("candles") ||
          errorMessage.toLowerCase().includes("broker")
        )

        if (isMetaAPIError) {
          // Extract required timeframes from the strategy
          const requiredTimeframes = parsedStatement?.strategy
            ?.filter((step: any) => step.function && step.vars && step.vars.timeframe)
            .map((step: any) => step.vars.timeframe) || []

          // Show detailed MetaAPI debug modal
          setMetaAPIError({
            message: errorMessage,
            details: error,
            symbol: metaAPIConfig?.symbol || parsedStatement?.instrument,
            timeframes: requiredTimeframes,
          })
          setShowMetaAPIDebugModal(true)
        } else {
          showToast("Connection failed: " + errorMessage, 'error')
        }
      }
    } finally {
      setIsCreatingOptimizationJob(false)
      setIsLoading2(false)
      optimisationRunIdRef.current = null
    }
  }


  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#121420] text-white">
        <div className="hidden md:block">
          <Sidebar currentPage="home" />
        </div>

        <MobileSidebar currentPage="home" />

        <main className="flex-1 flex flex-col relative ml-[63px] min-w-0 overflow-x-hidden">
          {/* Show PreviousOptimisationView if toggled (legacy full-screen) */}
          {showPreviousOptimisationView ? (
            <PreviousOptimisationView
              optimisationResults={optimizationResults}
              onClose={() => setShowPreviousOptimisationView(false)}
              isFullScreen={true}
            />
          ) : (
            <>
              {/* Top Result Tabs - Professional Workstation Design */}
              <div className="flex bg-[#0a0b12] border-b border-gray-800/50 sticky top-0 z-30 w-full overflow-hidden">
                <div className={`grid ${activeTab === 'optimisation' ? 'grid-cols-4' : 'grid-cols-6'} w-full`}>
                  {(activeTab === 'optimisation' ? ['results', 'graph', 'report', 'trades'] : ['graph', 'chart_data', 'summary', 'trades', 'results', 'report']).map(tab => (
                    <button
                      key={tab}
                      className={`py-4 text-center text-[9px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${(activeTab === 'optimisation' ? optimisationTab === tab : backtestResultTab === tab)
                        ? 'text-[#85e1fe] bg-[#121420] border-[#85e1fe]'
                        : 'text-gray-500 hover:text-white hover:bg-[#121420] border-transparent'
                        }`}
                      onClick={() => {
                        if (activeTab === 'optimisation') {
                          setOptimisationTab(tab as any);
                        } else {
                          setBacktestResultTab(tab as any);
                        }
                      }}
                    >
                      {tab === 'chart_data' ? 'Chart Data' : tab}
                    </button>
                  ))}
                </div>
              </div>
              {/* Result Content Area - Reduced height further to keep settings tabs visible */}
              <div className="h-[670px] overflow-y-auto bg-[#000000] border-b border-gray-800/10">
                {activeTab === 'optimisation' ? (
                  <div className="w-full min-h-full flex flex-col">
                    {(() => {
                      // 1. Data extraction and normalization
                      const previewRows = (() => {
                        if (!optimisationResult) return [];
                        return (
                          optimisationResult.optimisation_preview ||
                          optimisationResult.full_optimization_results ||
                          optimisationResult.table ||
                          optimisationResult.results ||
                          optimisationResult.data ||
                          optimisationResult.result?.table ||
                          optimisationResult.result?.results ||
                          optimisationResult.result?.optimisation_preview ||
                          []
                        );
                      })();

                      if (!optimisationResult) {
                        return (
                          <div className="flex-1 bg-[#0a0b12] flex flex-col items-center justify-center min-h-[400px]">
                            <div className="text-gray-600 text-[10px] font-black uppercase tracking-[0.5em]">No optimization data</div>
                            <div className="text-gray-800 text-[8px] font-bold mt-4 uppercase tracking-[0.3em]">Configure and run optimization below</div>
                          </div>
                        );
                      }

                      // 2. Tab rendering
                      return (
                        <div className="p-6 bg-[#000] text-white">
                          {/* Save Button */}
                          <div className="flex justify-end mb-6">
                            <button
                              onClick={() => setShowOptimisationResults(false)}
                              className="bg-[#85e1fe] text-black px-4 py-1.5 rounded-md hover:bg-[#6bcae2] font-black uppercase tracking-widest text-[10px] shadow-[0_0_15px_rgba(133,225,254,0.3)] transition-all"
                            >
                              Save results of optimisation
                            </button>
                          </div>

                          {/* Error Box Suppression */}
                          {(() => {
                            const isFatalError = (msg: string) => {
                              if (!msg) return false;
                              const nonFatalKeywords = ['UserWarning', 'Available cash', 'leverage', 'enough for this trade', 'No optimization results found for this generation'];
                              return !nonFatalKeywords.some(kw => msg.includes(kw));
                            };
                            const hasOutput = (optimisationStdout && optimisationStdout.length > 0) || isFatalError(optimisationMessage) || isFatalError(optimisationStderr);
                            const isCompleted = optimizationStatus === "completed";
                            if (!previewRows.length && !isCompleted && hasOutput) {
                              return (
                                <OptimizationErrorDisplay
                                  message={optimisationMessage}
                                  stdout={optimisationStdout}
                                  stderr={optimisationStderr}
                                  className="mb-8"
                                />
                              );
                            }
                            return null;
                          })()}

                          {/* Sub-Tabs Grid */}
                          {optimisationTab === 'results' && (
                            <div className="space-y-8">
                              <div className="overflow-x-auto">
                                <table className="min-w-full text-[10px] border-separate border-spacing-y-2">
                                  <thead>
                                    <tr className="bg-[#000] text-gray-500 font-black uppercase tracking-widest">
                                      <th className="px-4 py-3 text-left">Pass</th>
                                      <th className="px-4 py-3 text-left">Equity Final [$]</th>
                                      <th className="px-4 py-3 text-left">Return [%]</th>
                                      <th className="px-4 py-3 text-left">Profit Factor</th>
                                      <th className="px-4 py-3 text-left">Drawdown %</th>
                                      <th className="px-4 py-3 text-left">Win Rate [%]</th>
                                      <th className="px-4 py-3 text-left"># Trades</th>
                                      <th className="px-4 py-3 text-left">Generation</th>
                                      <th className="px-4 py-3 text-left">Inputs</th>
                                      <th className="px-4 py-3 text-left"></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {previewRows.map((row: any, idx: number) => (
                                      <tr
                                        key={idx}
                                        className={`bg-[#080A10] text-[#85e1fe] cursor-pointer hover:bg-[#121420] border-l-2 ${selectedOptimisationRow === row ? 'border-[#85e1fe] bg-[#121420]' : 'border-transparent'}`}
                                        onClick={() => { setSelectedOptimisationRow(row); setOptimisationTab('report'); }}
                                      >
                                        <td className="px-4 py-3 font-black">{idx + 1}</td>
                                        <td className="px-4 py-3 font-mono text-white">${row['Equity Final [$]'] ?? '-'}</td>
                                        <td className="px-4 py-3 font-mono">{row['Return [%]'] ?? '-'}%</td>
                                        <td className="px-4 py-3 font-mono">{row['Profit Factor'] ?? '-'}</td>
                                        <td className="px-4 py-3 font-mono text-red-500">{row['Max. Drawdown [%]'] ?? '-'}%</td>
                                        <td className="px-4 py-3 font-mono text-white">{row['Win Rate [%]'] ?? '-'}%</td>
                                        <td className="px-4 py-3 font-mono text-white">{row['# Trades'] ?? '-'}</td>
                                        <td className="px-4 py-3 font-mono text-white">{row['generation'] ?? '-'}</td>
                                        <td className="px-4 py-3 max-w-[250px] truncate text-gray-400" title={JSON.stringify(row)}>
                                          {Object.entries(row)
                                            .filter(([k]) => k.startsWith('param_'))
                                            .map(([k, v]) => `${k}: ${v}`)
                                            .join(', ') || Object.keys(row)
                                              .filter(key => !['Return [%]', 'Equity Final [$]', '# Trades', 'Win Rate [%]', 'Profit Factor', 'Max. Drawdown [%]', 'Sharpe Ratio', 'Sortino Ratio', 'Calmar Ratio', 'Return (Ann.) [%]', 'Volatility (Ann.) [%]', 'Start', 'End', 'Duration', 'SQN', 'Exposure Time [%]', 'Equity Peak [$]', 'Avg. Trade [%]', 'Best Trade [%]', 'Worst Trade [%]', 'Avg. Drawdown [%]', 'Avg. Drawdown Duration', 'Max. Drawdown Duration', 'Avg. Trade Duration', 'Max. Trade Duration', 'Buy & Hold Return [%]', 'Expectancy [%]', 'Unnamed: 0', 'generation'].includes(key))
                                              .map(key => `${key}=${row[key]}`)
                                              .join(', ')}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                          <button className="text-gray-500 hover:text-white transition-colors">
                                            <Maximize2 className="w-3 h-3" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              {/* Scatter Plot Inline */}
                              {(optimisationResult?.heatmap_plot_html || optimisationResult?.plots_html?.['optimise_plot.html']) && (
                                <div className="space-y-4 pt-10 border-t border-gray-900">
                                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Scatter Plot</h3>
                                  <div className="w-full bg-[#000] border border-gray-900 rounded-lg overflow-hidden">
                                    <iframe
                                      title="Scatter Plot"
                                      className="w-full h-[450px]"
                                      style={{ border: 'none' }}
                                      srcDoc={optimisationResult?.heatmap_plot_html || optimisationResult?.plots_html?.['optimise_plot.html']}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {optimisationTab === 'graph' && (
                            <div className="space-y-12 pb-10">
                              {[
                                { title: 'Scatter Plot', html: optimisationResult?.heatmap_plot_html || optimisationResult?.plots_html?.['optimise_plot.html'] },
                                { title: 'Trades Plot', html: optimisationResult?.trades_plot_html || optimisationResult?.plots_html?.['Plotly.html'] },
                                { title: 'Convergence Plot', html: optimisationResult?.convergence_data?.length > 0 ? generateConvergencePlotHTML(optimisationResult.convergence_data) : null },
                                { title: 'Optimization Heatmap', html: optimisationResult?.optimization_heatmap_data?.length > 0 ? generateHeatmapPlotHTML(optimisationResult.optimization_heatmap_data) : null }
                              ].map((g, idx) => g.html ? (
                                <div key={idx} className="space-y-4">
                                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">{g.title}</h3>
                                  <div className="w-full bg-[#000] border border-gray-900 rounded-lg overflow-hidden">
                                    <iframe
                                      title={g.title}
                                      className="w-full h-[500px]"
                                      style={{ border: 'none' }}
                                      srcDoc={g.html}
                                    />
                                  </div>
                                </div>
                              ) : null)}
                            </div>
                          )}

                          {optimisationTab === 'report' && (() => {
                            const preview = selectedOptimisationRow || previewRows[0] || null;
                            if (preview) {
                              return (
                                <div className="space-y-12">
                                  <h3 className="text-[10px] font-black text-[#85e1fe] text-center uppercase tracking-[0.8em]">Detailed Report</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                    <div className="space-y-6">
                                      <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-900 pb-2">Execution</h4>
                                      {[
                                        ['Start', preview['Start']],
                                        ['End', preview['End']],
                                        ['Duration', preview['Duration']],
                                        ['Exposure %', preview['Exposure Time [%]']],
                                        ['Equity Final', preview['Equity Final [$]']],
                                        ['Equity Peak', preview['Equity Peak [$]']],
                                      ].map(([l, v]) => (
                                        <div key={l} className="flex justify-between text-[11px] border-b border-gray-900/50 py-1">
                                          <span className="text-gray-500 font-medium">{l}</span>
                                          <span className="text-white font-mono">{v ?? '-'}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="space-y-6">
                                      <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-900 pb-2">Performance</h4>
                                      {[
                                        ['Sharpe', preview['Sharpe Ratio']],
                                        ['Sortino', preview['Sortino Ratio']],
                                        ['Max DD %', preview['Max. Drawdown [%]']],
                                        ['Return %', preview['Return [%]']],
                                        ['Profit Factor', preview['Profit Factor']],
                                        ['# Trades', preview['# Trades']],
                                      ].map(([l, v]) => (
                                        <div key={l} className="flex justify-between text-[11px] border-b border-gray-900/50 py-1">
                                          <span className="text-gray-500 font-medium">{l}</span>
                                          <span className="text-[#85e1fe] font-mono">{v ?? '-'}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="space-y-6">
                                      <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-900 pb-2">Trade Metrics</h4>
                                      {[
                                        ['Win Rate %', preview['Win Rate [%]']],
                                        ['Best Trade %', preview['Best Trade [%]']],
                                        ['Worst Trade %', preview['Worst Trade [%]']],
                                        ['Avg Trade %', preview['Avg. Trade [%]']],
                                        ['Expectancy %', preview['Expectancy [%]']],
                                        ['SQN', preview['SQN']],
                                      ].map(([l, v]) => (
                                        <div key={l} className="flex justify-between text-[11px] border-b border-gray-800/50 py-1">
                                          <span className="text-gray-500 font-medium">{l}</span>
                                          <span className="text-white font-mono">{v ?? '-'}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <div className="text-center text-gray-500 py-10 uppercase tracking-widest text-[9px]">Select a result pass to view detailed report</div>
                            );
                          })()}

                          {optimisationTab === 'trades' && (
                            <div className="p-6 space-y-8">
                              <h3 className="text-xs font-black text-gray-500 mb-6 uppercase tracking-[0.4em]">Previous Optimisation Results</h3>
                              <OptimisationHistoryList
                                strategyId={strategy_id || ''}
                                onSelect={async (id) => {
                                  const detail = await getOptimizationResultDetail(id as any);
                                  setOptimisationResult(detail);
                                  setShowOptimisationResults(true);
                                  setOptimisationTab('results');
                                }}
                                isInline={true}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : backtestDetail ? (
                  <div className="w-full">
                    {/* Graph Tab */}
                    {backtestResultTab === 'graph' && (
                      <div className={`w-full relative group transition-all duration-500 ${isChartExpanded ? 'fixed inset-0 z-[200] bg-black p-10 overflow-auto' : ''}`}>
                        <div className={`bg-[#000000] ${isChartExpanded ? '' : 'p-6'}`}>
                          {plotHtml ? (
                            <div className="relative">
                              <div className="absolute right-4 top-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setIsChartExpanded(!isChartExpanded)}
                                  className="bg-[#1A1D2D] border border-gray-700 p-2 rounded hover:bg-gray-800 text-[#85e1fe] transition-all"
                                  title={isChartExpanded ? "Exit Full Page" : "View Full Page"}
                                >
                                  <Maximize2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    const win = window.open('', '_blank');
                                    if (win) {
                                      win.document.write(`<html><body style="margin:0;padding:0;background:#000;">${plotHtml}</body></html>`);
                                      win.document.close();
                                    }
                                  }}
                                  className="bg-[#1A1D2D] border border-gray-700 p-2 rounded hover:bg-gray-800 text-[#85e1fe] transition-all"
                                  title="Open in New Tab"
                                >
                                  <Layout className="w-4 h-4" />
                                </button>
                              </div>
                              <iframe
                                title="Equity Plot"
                                style={{ width: "100%", height: isChartExpanded ? "calc(100vh - 120px)" : "550px", border: "none", backgroundColor: "#000" }}
                                srcDoc={plotHtml}
                              />
                            </div>
                          ) : (
                            <div className="text-center text-gray-400 py-20 font-medium uppercase tracking-widest text-[10px]">Run backtest to view results</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Chart Data Tab */}
                    {backtestResultTab === 'chart_data' && (
                      <div className="p-6">
                        {backtestDetail.chart_data && backtestDetail.chart_data.length > 0 ? (
                          <div className="bg-[#080A10] rounded-lg overflow-hidden border border-gray-800">
                            <div className="overflow-x-auto max-h-[600px]">
                              <table className="min-w-full text-[10px]">
                                <thead className="bg-[#000000] text-gray-400 sticky top-0 uppercase tracking-widest font-black">
                                  <tr>
                                    <th className="px-4 py-3 text-left">#</th>
                                    {Object.keys(backtestDetail.chart_data[0]).map((col) => (
                                      <th key={col} className="px-4 py-3 text-left whitespace-nowrap">{col}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {backtestDetail.chart_data.slice(0, 100).map((row: any, i: number) => (
                                    <tr key={i} className="border-t border-gray-900 hover:bg-[#121420]">
                                      <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                                      {Object.values(row).map((val: any, j: number) => (
                                        <td key={j} className="px-4 py-2 text-white whitespace-nowrap">
                                          {typeof val === 'number' ? val.toFixed(2) : String(val)}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-20 font-bold uppercase tracking-widest text-xs">No chart data available</div>
                        )}
                      </div>
                    )}

                    {/* Trades Tab with History */}
                    {backtestResultTab === 'trades' && (
                      <div className="p-6 space-y-12">
                        {/* History Section - Only Backtest History here */}
                        <div>
                          <h3 className="text-xs font-black text-gray-500 mb-6 uppercase tracking-[0.4em]">Backtest History</h3>
                          <BacktestHistoryList
                            strategyId={strategy_id || ''}
                            onSelect={loadBacktestResult}
                            isInline={true}
                          />
                        </div>

                        {/* Current Results Section */}
                        <div>
                          <h3 className="text-xs font-black text-gray-500 mb-6 uppercase tracking-[0.4em]">Current Trades</h3>
                          {backtestDetail.trades_data && backtestDetail.trades_data.length > 0 ? (
                            <div className="bg-[#080A10] rounded-lg overflow-hidden border border-gray-800">
                              <div className="overflow-x-auto max-h-[500px]">
                                <table className="min-w-full text-[10px]">
                                  <thead className="bg-[#000000] text-gray-400 sticky top-0 uppercase tracking-widest font-black">
                                    <tr>
                                      <th className="px-4 py-3 text-left">#</th>
                                      <th className="px-4 py-3 text-left">Time</th>
                                      <th className="px-4 py-3 text-left">Type</th>
                                      <th className="px-4 py-3 text-left">Size</th>
                                      <th className="px-4 py-3 text-left">Price</th>
                                      <th className="px-4 py-3 text-left">Profit</th>
                                      <th className="px-4 py-3 text-left">Balance</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {backtestDetail.trades_data.map((trade: any, index: number) => (
                                      <tr key={index} className="border-t border-gray-900 hover:bg-[#121420]">
                                        <td className="px-4 py-3 text-white">{index + 1}</td>
                                        <td className="px-4 py-3 text-white">{trade.EntryTime || trade.Time || 'N/A'}</td>
                                        <td className="px-4 py-3 text-white">{trade.Type || 'N/A'}</td>
                                        <td className="px-4 py-3 text-white">{trade.Size ?? 'N/A'}</td>
                                        <td className="px-4 py-3 text-white">{trade.EntryPrice != null ? trade.EntryPrice.toFixed(5) : trade.Price != null ? trade.Price.toFixed(5) : 'N/A'}</td>
                                        <td className={`px-4 py-3 font-semibold ${(trade.PnL || trade.Profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                          {trade.PnL != null ? `$${trade.PnL.toFixed(2)}` : trade.Profit != null ? `$${trade.Profit.toFixed(2)}` : 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-white">{trade.Balance != null ? `$${trade.Balance.toFixed(2)}` : 'N/A'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-gray-500 py-20 font-bold uppercase tracking-widest text-xs">No trades data available</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Summary / Report Tab */}
                    {(backtestResultTab === 'summary' || backtestResultTab === 'report') && (
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          {/* Column 1 */}
                          <div className="space-y-4">
                            <h3 className="text-xs font-black text-gray-500 mb-4 uppercase tracking-widest">General</h3>
                            <div className="space-y-3">
                              <div className="flex justify-between border-b border-gray-900 py-2 text-[11px]">
                                <span className="text-gray-400">Start:</span>
                                <span className="text-white font-medium">{formatDateForResult(backtestDetail.data_start_date)}</span>
                              </div>
                              <div className="flex justify-between border-b border-gray-900 py-2 text-[11px]">
                                <span className="text-gray-400">End:</span>
                                <span className="text-white font-medium">{formatDateForResult(backtestDetail.data_end_date)}</span>
                              </div>
                              <div className="flex justify-between border-b border-gray-900 py-2 text-[11px]">
                                <span className="text-gray-400">Return (%):</span>
                                <span className={`font-bold ${(backtestDetail.return_percent || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {backtestDetail.return_percent != null ? backtestDetail.return_percent.toFixed(4) : 'N/A'}%
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* Column 2 */}
                          <div className="space-y-4">
                            <h3 className="text-xs font-black text-gray-500 mb-4 uppercase tracking-widest">Risk/Reward</h3>
                            <div className="space-y-3">
                              <div className="flex justify-between border-b border-gray-900 py-2 text-[11px]">
                                <span className="text-gray-400">Sharpe Ratio:</span>
                                <span className="text-white font-medium">{backtestDetail.sharpe_ratio != null ? backtestDetail.sharpe_ratio.toFixed(4) : 'N/A'}</span>
                              </div>
                              <div className="flex justify-between border-b border-gray-900 py-2 text-[11px]">
                                <span className="text-gray-400">Max DD (%):</span>
                                <span className="text-red-500 font-bold">{backtestDetail.max_drawdown_percent != null ? backtestDetail.max_drawdown_percent.toFixed(4) : 'N/A'}%</span>
                              </div>
                              <div className="flex justify-between border-b border-gray-900 py-2 text-[11px]">
                                <span className="text-gray-400">Win Rate (%):</span>
                                <span className="text-white font-medium">{backtestDetail.win_rate_percent != null ? backtestDetail.win_rate_percent.toFixed(2) : 'N/A'}%</span>
                              </div>
                            </div>
                          </div>
                          {/* Column 3 */}
                          <div className="space-y-4">
                            <h3 className="text-xs font-black text-gray-500 mb-4 uppercase tracking-widest">Strategy</h3>
                            <div className="space-y-3">
                              <div className="flex justify-between border-b border-gray-900 py-2 text-[11px]">
                                <span className="text-gray-400">Trades:</span>
                                <span className="text-white font-medium">{backtestDetail.num_trades ?? 'N/A'}</span>
                              </div>
                              <div className="flex justify-between border-b border-gray-900 py-2 text-[11px]">
                                <span className="text-gray-400">Final Equity:</span>
                                <span className="text-white font-medium">${backtestDetail.final_equity != null ? backtestDetail.final_equity.toFixed(2) : 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-[400px] bg-[#000000] flex items-center justify-center">
                    <p className="text-gray-800 font-black uppercase tracking-[0.5em] text-[10px]">Run backtest to view results</p>
                  </div>
                )}
              </div>


              {/* Bottom Navigation Tabs - Sticky above footer */}
              <div className="flex bg-[#0a0b12] border-y border-gray-800 sticky bottom-[90px] z-40 w-full overflow-hidden">
                <div className="grid grid-cols-4 w-full">
                  {["strategy", "backtest", "optimisation", "properties"].map((tab) => (
                    <button
                      key={tab}
                      className={`py-4 text-center text-[10px] font-black uppercase tracking-widest transition-all border-t-2 ${activeTab === tab ? "bg-[#121420] text-[#85e1fe] border-[#85e1fe]" : "bg-[#0a0b12] text-gray-500 hover:text-gray-300 hover:bg-[#161927] border-transparent"
                        }`}
                      onClick={() => handleTabChange(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content area with overflow to allow scrolling */}
              <div className="flex-1 overflow-y-auto pb-[160px] bg-[#000000]">
                {/* Back Button - Sticky */}
                {strategy_id && (
                  <div className="sticky top-4 z-50 w-fit ml-5 mt-4 md:ml-10">
                    <button
                      onClick={() => {
                        router.push(`/strategy-builder/${strategy_id}`)
                      }}
                      className="flex items-center gap-2 bg-[#1A1D2D] hover:bg-[#2B2E38] text-white px-4 py-2 rounded-full transition-colors border border-gray-700 shadow-lg"
                      title="Back to Strategy Editor"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Back to Editor</span>
                    </button>
                  </div>
                )}
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
                      <div className="space-y-3">
                        <MetaAPIConfig
                          onConfigChange={handleMetaAPIConfigChange}
                          initialConfig={metaAPIConfig || undefined}
                        />

                        {/* Timezone Selector */}
                        <div className="bg-black border border-gray-700 rounded-lg p-4">
                          <label className="block text-white font-medium mb-2">Timezone</label>
                          <select
                            value={timezone}
                            onChange={(e) => {
                              setTimezone(e.target.value)
                              // Update TradingSession immediately when timezone changes
                              if (parsedStatement?.TradingSession) {
                                const updated = {
                                  ...parsedStatement,
                                  TradingSession: {
                                    ...parsedStatement.TradingSession,
                                    Timezone: e.target.value
                                  }
                                }
                                setParsedStatement(updated)
                                localStorage.setItem("savedStrategy", JSON.stringify(updated))
                              }
                            }}
                            className="w-full bg-gray-900 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#85e1fe]"
                          >
                            <option value="UTC">UTC</option>
                            <option value="Europe/London">Europe/London</option>
                            <option value="America/New_York">EST (Eastern Standard Time)</option>
                            <option value="Asia/Kolkata">Asia/Kolkata</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            Select the timezone for trading session configuration
                          </p>
                        </div>

                        <div className="flex gap-3">
                        </div>
                      </div>
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
                    handleLeverageChange={handleLeverageChange}
                    customLeverage={customLeverage}
                    handleCustomLeverageChange={handleCustomLeverageChange}
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
                    positionSize={positionSize}
                    setPositionSize={setPositionSize}
                    assetType={assetType}
                    setAssetType={setAssetType}
                    showTradesSummary={showTradesSummary}
                    onShowTradesSummary={() => setShowTradesSummary(true)}
                    initialTradingSession={parsedStatement?.TradingSession}
                    timezone={timezone}
                    onTradingSessionSave={(session) => {
                      try {
                        // Ensure timezone from state is included in the session
                        const sessionWithTimezone = {
                          ...session,
                          Timezone: timezone
                        }
                        const updated = { ...(parsedStatement || {}), TradingSession: sessionWithTimezone }
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

                {activeTab === "optimisation" && (
                  <>
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
                      onCancelWalkForward={cancelWalkForward}
                      isLoading3={isLoading3}
                    />
                  </>
                )}

                {activeTab === "properties" && (
                  <PropertiesTab parsedStatement={parsedStatement} saveOptimisationInput={saveOptimisationInput} />
                )}
              </div>

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
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.status === "completed" ? "bg-green-500 text-white" :
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

              {/* Custom Strategy Backtest Results Modal */}
              {showCustomStrategyBacktestResults && customStrategyBacktestResult && (
                <CustomStrategyBacktestResults
                  result={customStrategyBacktestResult}
                  onClose={() => {
                    setShowCustomStrategyBacktestResults(false)
                    setCustomStrategyBacktestResult(null)
                  }}
                  onViewFullResults={() => {
                    setShowCustomStrategyBacktestResults(false)
                    router.push('/custom-backtest-results')
                  }}
                />
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
                      <button
                        onClick={cancelOptimisation}
                        className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Backtest History Modal */}
              {showBacktestHistory && (
                <BacktestHistoryList
                  strategyId={strategy_id || ''}
                  onClose={() => setShowBacktestHistory(false)}
                  onSelect={loadBacktestResult}
                />
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
                            <p className={`font-semibold text-lg ${(dropletJobResults.results.avg_validation_return || 0) > 0 ? 'text-green-500' : 'text-red-500'
                              }`}>
                              {dropletJobResults.results.avg_validation_return?.toFixed(2) || 'N/A'}%
                            </p>
                          </div>
                          <div className="bg-[#141721] rounded-lg p-4">
                            <p className="text-gray-400 text-sm">Decision</p>
                            <p className={`font-semibold text-sm ${(dropletJobResults.results.p_value || 1) < 0.05 ? 'text-green-500' : 'text-yellow-500'
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
            </>
          )}
        </main>
      </div>

      <footer className="fixed bottom-0 left-[63px] right-0 bg-[#000000] border-t border-gray-900 z-[100] h-[90px] flex items-center shadow-[0_-10px_30px_rgba(0,0,0,0.5)] px-10">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gray-900 overflow-hidden">
          {(progress > 0 || progress2 > 0 || backtestDetail || optimisationResult || dropletJobResults) && (
            <div
              className="h-full bg-[#00ff9d] shadow-[0_0_10px_rgba(0,255,157,0.8)] transition-all duration-300"
              style={{ width: `${(progress > 0 || progress2 > 0) ? Math.max(progress, progress2) : (backtestDetail || optimisationResult || dropletJobResults) ? 100 : 0}%` }}
            />
          )}
        </div>

        <div className="flex items-center gap-4 w-full">
          {/* Run Backtest - only shown outside optimisation tab */}

          <button
            onClick={isLoading ? () => cancelBacktestRun() : () => handleRunBacktest()}
            className={`flex-1 h-11 border rounded-full transition-all text-sm font-medium ${(activeTab === 'strategy' || activeTab === 'backtest') && !isLoading
              ? "border-[#85e1fe] text-[#85e1fe] bg-[#85e1fe]/10 shadow-[0_0_15px_rgba(133,225,254,0.1)]"
              : "border-white text-white hover:bg-white/10"
              } ${isLoading ? "border-red-500 text-red-500 bg-red-500/10" : ""}`}
          >
            {isLoading ? "Cancel Backtest" : "Run Backtest"}
          </button>

          <button
            onClick={isLoading2 ? () => cancelOptimisation() : () => handleOptimisation()}
            className={`flex-1 h-11 border rounded-full transition-all text-sm font-medium ${(activeTab === 'optimisation' || activeTab === 'properties') && !isLoading2
              ? "border-[#85e1fe] text-[#85e1fe] bg-[#85e1fe]/10 shadow-[0_0_15px_rgba(133,225,254,0.1)]"
              : "border-white text-white hover:bg-white/10"
              } ${isLoading2 ? "border-red-500 text-red-500 bg-red-500/10" : ""}`}
          >
            {isLoading2 ? "Cancel Legacy" : "Run Optimisation (Legacy)"}
          </button>
          <button
            onClick={() => handleOptimizationWithDroplets('regular')}
            disabled={isCreatingOptimizationJob || isLoading2}
            className={`flex-1 h-11 border rounded-full transition-all text-sm font-medium ${(activeTab === 'optimisation' || activeTab === 'properties') && !isCreatingOptimizationJob
              ? "border-purple-400 text-purple-400 bg-purple-400/10 shadow-[0_0_15px_rgba(192,132,252,0.1)]"
              : "border-white text-white hover:bg-white/10"
              } ${isCreatingOptimizationJob ? "border-yellow-500 text-yellow-500 bg-yellow-500/10" : ""} disabled:opacity-50`}
          >
            {isCreatingOptimizationJob ? "Creating Job..." : "Run Optimisation (Droplets)"}
          </button>
        </div>
      </footer>

      {
        showMetaAPIDebugModal && metaAPIError && metaAPIConfig && (
          <MetaAPIDebugModal
            isOpen={showMetaAPIDebugModal}
            onClose={() => setShowMetaAPIDebugModal(false)}
            error={metaAPIError}
            metaAPIConfig={metaAPIConfig}
          />
        )
      }

      {
        showBacktestHistory && (
          <BacktestHistoryList
            strategyId={strategy_id || ""}
            onClose={() => setShowBacktestHistory(false)}
            onSelect={loadBacktestResult}
          />
        )
      }
    </AuthGuard >
  )
}
