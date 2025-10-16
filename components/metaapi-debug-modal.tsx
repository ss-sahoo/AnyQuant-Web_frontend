"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Search, Zap, Bug } from "lucide-react"
import {
  getAllBrokerSymbols,
  findSymbolsWithTimeframe,
  getSymbolTimeframes,
  validateStrategyMetaapi,
} from "@/app/AllApiCalls"

interface MetaAPIDebugModalProps {
  isOpen: boolean
  onClose: () => void
  error: {
    message: string
    details?: any
    symbol?: string
    timeframes?: string[]
  }
  metaAPIConfig: {
    token: string
    accountId: string
    symbol: string
  }
}

export function MetaAPIDebugModal({ isOpen, onClose, error, metaAPIConfig }: MetaAPIDebugModalProps) {
  const [debugStep, setDebugStep] = useState<"error" | "symbols" | "timeframes" | "validation">("error")
  const [isLoading, setIsLoading] = useState(false)
  const [brokerSymbols, setBrokerSymbols] = useState<any>(null)
  const [timeframeData, setTimeframeData] = useState<any>(null)
  const [validationData, setValidationData] = useState<any>(null)

  if (!isOpen) return null

  const analyzeError = () => {
    const errorMessage = error.message.toLowerCase()
    
    if (errorMessage.includes("symbol") && errorMessage.includes("not found")) {
      return {
        issue: "Symbol Not Found",
        icon: <XCircle className="w-6 h-6 text-red-500" />,
        description: `The symbol "${error.symbol || metaAPIConfig.symbol}" doesn't exist on your broker.`,
        solution: "Your broker uses different symbol names. Click 'Find Symbols' to see available symbols.",
        action: "symbols",
      }
    }
    
    if (errorMessage.includes("timeframe") || errorMessage.includes("candles")) {
      return {
        issue: "Timeframe Not Available",
        icon: <AlertCircle className="w-6 h-6 text-yellow-500" />,
        description: `The requested timeframe(s) are not available for this symbol.`,
        solution: "Click 'Check Timeframes' to see which timeframes are available for your symbol.",
        action: "timeframes",
      }
    }
    
    if (errorMessage.includes("connection") || errorMessage.includes("timeout")) {
      return {
        issue: "Connection Issue",
        icon: <AlertCircle className="w-6 h-6 text-orange-500" />,
        description: "Failed to connect to MetaAPI or your broker account.",
        solution: "Check your MetaAPI credentials and ensure your broker account is connected and deployed.",
        action: null,
      }
    }
    
    return {
      issue: "Unknown Error",
      icon: <Bug className="w-6 h-6 text-gray-500" />,
      description: error.message,
      solution: "Use the debugging tools below to diagnose the issue.",
      action: "validation",
    }
  }

  const errorAnalysis = analyzeError()

  const handleFindSymbols = async () => {
    setIsLoading(true)
    try {
      // Try to find symbols with a filter first (XAU for gold, EUR for forex)
      const symbolFilter = error.symbol?.toUpperCase().substring(0, 3) || ""
      const result = await getAllBrokerSymbols({
        metaapi_token: metaAPIConfig.token,
        metaapi_account_id: metaAPIConfig.accountId,
        filter: symbolFilter || undefined,
      })
      setBrokerSymbols(result)
      setDebugStep("symbols")
    } catch (err: any) {
      console.error("Error fetching symbols:", err)
      alert(`Failed to fetch symbols: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckTimeframes = async () => {
    setIsLoading(true)
    try {
      const result = await getSymbolTimeframes({
        metaapi_token: metaAPIConfig.token,
        metaapi_account_id: metaAPIConfig.accountId,
        symbol: metaAPIConfig.symbol,
      })
      setTimeframeData(result)
      setDebugStep("timeframes")
    } catch (err: any) {
      console.error("Error checking timeframes:", err)
      alert(`Failed to check timeframes: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleValidateStrategy = async () => {
    setIsLoading(true)
    try {
      // Get strategy from localStorage
      const savedStrategy = localStorage.getItem("savedStrategy")
      if (!savedStrategy) {
        alert("No strategy found. Please load a strategy first.")
        return
      }
      
      const strategy = JSON.parse(savedStrategy)
      const result = await validateStrategyMetaapi({
        statement: strategy,
        metaapi_token: metaAPIConfig.token,
        metaapi_account_id: metaAPIConfig.accountId,
        symbol: metaAPIConfig.symbol,
      })
      setValidationData(result)
      setDebugStep("validation")
    } catch (err: any) {
      console.error("Error validating strategy:", err)
      alert(`Failed to validate strategy: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-red-500/30 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {errorAnalysis.icon}
              <div>
                <h2 className="text-xl font-bold text-white">{errorAnalysis.issue}</h2>
                <p className="text-gray-400 text-sm mt-1">MetaAPI Debugging Tool</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Details */}
          {debugStep === "error" && (
            <div className="space-y-4">
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <h3 className="text-red-400 font-semibold mb-2">Error Details</h3>
                <p className="text-white text-sm mb-2">{errorAnalysis.description}</p>
                <div className="bg-black rounded p-3 mt-2">
                  <code className="text-xs text-red-300">{error.message}</code>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-blue-400 font-semibold mb-2">💡 Suggested Solution</h3>
                <p className="text-white text-sm">{errorAnalysis.solution}</p>
              </div>

              {/* Configuration Info */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Current Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Symbol:</span>
                    <span className="text-white font-mono">{metaAPIConfig.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Account ID:</span>
                    <span className="text-white font-mono">
                      {metaAPIConfig.accountId.substring(0, 8)}...
                    </span>
                  </div>
                  {error.timeframes && error.timeframes.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Required Timeframes:</span>
                      <span className="text-white font-mono">{error.timeframes.join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Debug Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button
                  onClick={handleFindSymbols}
                  disabled={isLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  Find Symbols
                </Button>
                <Button
                  onClick={handleCheckTimeframes}
                  disabled={isLoading}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  Check Timeframes
                </Button>
                <Button
                  onClick={handleValidateStrategy}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Validate Strategy
                </Button>
              </div>
            </div>
          )}

          {/* Broker Symbols Results */}
          {debugStep === "symbols" && brokerSymbols && (
            <div className="space-y-4">
              <Button
                onClick={() => setDebugStep("error")}
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                ← Back
              </Button>

              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <h3 className="text-green-400 font-semibold mb-2">
                  ✅ Found {brokerSymbols.results?.total_symbols || 0} Symbols on Your Broker
                </h3>
                <p className="text-gray-300 text-sm">{brokerSymbols.message}</p>
              </div>

              {/* Gold/Silver Symbols */}
              {brokerSymbols.results?.gold_silver_symbols?.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-yellow-400 font-semibold mb-3">🥇 Gold & Silver Symbols</h4>
                  <div className="space-y-2">
                    {brokerSymbols.results.gold_silver_symbols.map((sym: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-gray-900 rounded p-3 hover:bg-gray-700 transition-colors"
                      >
                        <div>
                          <span className="text-white font-mono font-bold">{sym.symbol}</span>
                          <p className="text-gray-400 text-xs mt-1">{sym.description}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(sym.symbol)
                            alert(`Copied "${sym.symbol}" to clipboard!`)
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Copy
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Forex Major Symbols */}
              {brokerSymbols.results?.forex_major_symbols?.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-blue-400 font-semibold mb-3">💱 Forex Major Pairs</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {brokerSymbols.results.forex_major_symbols.slice(0, 8).map((sym: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-gray-900 rounded p-2 text-sm"
                      >
                        <span className="text-white font-mono">{sym.symbol}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(sym.symbol)
                            alert(`Copied "${sym.symbol}"`)
                          }}
                          className="text-xs"
                        >
                          Copy
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-blue-400 font-semibold mb-2">📝 Next Steps</h4>
                <ol className="list-decimal list-inside text-white text-sm space-y-1">
                  <li>Copy the correct symbol name from above</li>
                  <li>Update your MetaAPI configuration with the new symbol</li>
                  <li>Click "Check Timeframes" to verify timeframe availability</li>
                  <li>Run your backtest again</li>
                </ol>
              </div>
            </div>
          )}

          {/* Timeframe Results */}
          {debugStep === "timeframes" && timeframeData && (
            <div className="space-y-4">
              <Button
                onClick={() => setDebugStep("error")}
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                ← Back
              </Button>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">
                  Timeframe Availability for {timeframeData.results?.symbol}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-400">Total Tested:</span>
                    <span className="text-white ml-2">{timeframeData.results?.total_timeframes_tested}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Success Rate:</span>
                    <span className="text-white ml-2">{timeframeData.results?.availability_rate}</span>
                  </div>
                </div>
              </div>

              {/* Available Timeframes */}
              {timeframeData.results?.available_timeframes?.length > 0 && (
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <h4 className="text-green-400 font-semibold mb-3">
                    ✅ Available Timeframes ({timeframeData.results.available_timeframes.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {timeframeData.results.available_timeframes.map((tf: string) => (
                      <span
                        key={tf}
                        className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-mono"
                      >
                        {tf}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Unavailable Timeframes */}
              {timeframeData.results?.unavailable_timeframes?.length > 0 && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <h4 className="text-red-400 font-semibold mb-3">
                    ❌ Unavailable Timeframes ({timeframeData.results.unavailable_timeframes.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {timeframeData.results.unavailable_timeframes.map((tf: string) => (
                      <span
                        key={tf}
                        className="bg-red-600/50 text-white px-3 py-1 rounded-full text-sm font-mono"
                      >
                        {tf}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Results */}
              {timeframeData.results?.detailed_results && (
                <div className="bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <h4 className="text-white font-semibold mb-3">Detailed Timeframe Data</h4>
                  <div className="space-y-3">
                    {Object.entries(timeframeData.results.detailed_results).map(([tf, data]: [string, any]) => (
                      <div
                        key={tf}
                        className={`border rounded p-3 ${
                          data.available ? "border-green-500/30 bg-green-900/10" : "border-red-500/30 bg-red-900/10"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-mono font-bold">{tf}</span>
                          {data.available ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                        {data.available && (
                          <div className="text-xs text-gray-300 space-y-1">
                            <div>Data Points: {data.data_points}</div>
                            {data.date_range && (
                              <div>
                                Range: {data.date_range.start} → {data.date_range.end}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Validation Results */}
          {debugStep === "validation" && validationData && (
            <div className="space-y-4">
              <Button
                onClick={() => setDebugStep("error")}
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                ← Back
              </Button>

              <div
                className={`rounded-lg p-4 border ${
                  validationData.status === "success"
                    ? "bg-green-900/20 border-green-500/30"
                    : "bg-red-900/20 border-red-500/30"
                }`}
              >
                <h3
                  className={`font-semibold mb-2 ${
                    validationData.status === "success" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {validationData.status === "success" ? "✅ Validation Passed" : "❌ Validation Failed"}
                </h3>
                <p className="text-white text-sm">{validationData.message}</p>
              </div>

              {/* Recommendations */}
              {validationData.validation_results?.recommendation && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-blue-400 font-semibold mb-3">📋 Recommendations</h4>
                  <ul className="space-y-2">
                    {validationData.validation_results.recommendation.map((rec: string, idx: number) => (
                      <li key={idx} className="text-white text-sm flex items-start">
                        <span className="mr-2">{rec.startsWith("✅") ? "✅" : rec.startsWith("❌") ? "❌" : "•"}</span>
                        <span>{rec.replace(/^[✅❌]\s*/, "")}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Alternative Symbols */}
              {validationData.validation_results?.alternative_symbols_suggestion && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3">💡 Alternative Symbols</h4>
                  <div className="flex flex-wrap gap-2">
                    {validationData.validation_results.alternative_symbols_suggestion.map((sym: string) => (
                      <Button
                        key={sym}
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(sym)
                          alert(`Copied "${sym}" to clipboard!`)
                        }}
                        className="bg-purple-600 hover:bg-purple-700 font-mono"
                      >
                        {sym}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-4">
          <div className="flex justify-end space-x-3">
            <Button onClick={onClose} variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

