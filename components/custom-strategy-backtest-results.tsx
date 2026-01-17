"use client"

import { useState } from "react"
import { X, TrendingUp, TrendingDown, BarChart3, DollarSign, Target, Activity, ChevronDown, ChevronUp, Download } from "lucide-react"

// Trade can have different formats from the API
interface Trade {
  id?: number
  type?: string
  entry_bar?: number
  entry_price?: number
  exit_bar?: number
  exit_price?: number
  size?: number | null
  sl?: number | null
  tp?: number | null
  pnl?: number
  return_pct?: number
  status?: string
  entry_time?: string
  exit_time?: string
  duration?: string
}

// Equity curve point can be a number or an object
interface EquityCurvePoint {
  timestamp?: string
  equity?: number
  drawdown_pct?: number
}

interface Statistics {
  win_rate?: number
  max_drawdown?: number
  sharpe_ratio?: number
  total_trades?: number
  total_return?: number
  profit_factor?: number
  equity_final?: number
  equity_peak?: number
  return_pct?: number
  buy_hold_return?: number
  return_ann?: number
  volatility_ann?: number
  sortino_ratio?: number
  calmar_ratio?: number
  avg_drawdown?: number
  max_drawdown_duration?: string
  num_trades?: number
  best_trade?: number
  worst_trade?: number
  avg_trade?: number
  expectancy?: number
  sqn?: number
}

interface CustomStrategyBacktestResult {
  message?: string
  custom_strategy_id?: number
  custom_strategy_name?: string
  data_source?: string
  symbol?: string
  initial_equity?: number
  final_equity?: number
  return_percent?: number
  total_return?: number
  num_trades?: number
  win_rate_percent?: number
  win_rate?: number
  max_drawdown_percent?: number
  max_drawdown?: number
  sharpe_ratio?: number
  profit_factor?: number
  equity_curve?: (number | EquityCurvePoint)[]
  trades?: Trade[]
  statistics?: Statistics
  plot_html?: string | null
  csv_url?: string
  error?: string | null
  metadata?: {
    symbol?: string
    timeframe?: string
    bars?: number
    data_source?: string
    start_date?: string
    end_date?: string
    commission?: number
    slippage?: number
  }
}

interface CustomStrategyBacktestResultsProps {
  result: CustomStrategyBacktestResult
  onClose: () => void
  onViewFullResults?: () => void
}

// Helper function to extract equity value from equity curve point
const getEquityValue = (point: number | EquityCurvePoint): number => {
  if (typeof point === 'number') {
    return point
  }
  return point.equity ?? 0
}

export function CustomStrategyBacktestResults({ result, onClose, onViewFullResults }: CustomStrategyBacktestResultsProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "chart" | "trades">("summary")
  const [showAllTrades, setShowAllTrades] = useState(false)

  // Safely get values with defaults - handle multiple possible field names
  const returnPercent = result.return_percent ?? result.total_return ?? result.statistics?.return_pct ?? 0
  const finalEquity = result.final_equity ?? result.statistics?.equity_final ?? 0
  const initialEquity = result.initial_equity ?? 100000
  const winRatePercent = result.win_rate_percent ?? result.win_rate ?? result.statistics?.win_rate ?? 0
  const numTrades = result.num_trades ?? result.statistics?.num_trades ?? 0
  const maxDrawdownPercent = result.max_drawdown_percent ?? result.max_drawdown ?? result.statistics?.max_drawdown ?? 0
  const sharpeRatio = result.sharpe_ratio ?? result.statistics?.sharpe_ratio ?? 0
  const profitFactor = result.profit_factor ?? result.statistics?.profit_factor ?? 0
  const strategyName = result.custom_strategy_name ?? "Custom Strategy"
  const symbol = result.symbol ?? result.metadata?.symbol ?? "N/A"
  const dataSource = result.data_source ?? result.metadata?.data_source ?? "N/A"
  const rawEquityCurve = result.equity_curve ?? []
  const trades = result.trades ?? []

  // Extract numeric equity values from equity curve
  const equityValues = rawEquityCurve.map(getEquityValue)

  const isPositive = returnPercent >= 0

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const displayedTrades = showAllTrades 
    ? trades 
    : trades.slice(0, 5)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#1A1D24] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2D42]">
          <div>
            <h2 className="text-xl font-semibold text-white">Custom Strategy Backtest Results</h2>
            <p className="text-sm text-gray-400 mt-1">
              {strategyName} • {symbol} • {dataSource}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#2A2D42] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2A2D42]">
          {["summary", "chart", "trades"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "text-[#85e1fe] border-b-2 border-[#85e1fe]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "summary" && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Return */}
                <div className="bg-[#151718] rounded-lg p-4 border border-[#2A2D42]">
                  <div className="flex items-center gap-2 mb-2">
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-xs text-gray-400">Total Return</span>
                  </div>
                  <p className={`text-2xl font-bold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                    {formatPercent(returnPercent)}
                  </p>
                </div>

                {/* Final Equity */}
                <div className="bg-[#151718] rounded-lg p-4 border border-[#2A2D42]">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-[#85e1fe]" />
                    <span className="text-xs text-gray-400">Final Equity</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(finalEquity)}
                  </p>
                </div>

                {/* Win Rate */}
                <div className="bg-[#151718] rounded-lg p-4 border border-[#2A2D42]">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-[#85e1fe]" />
                    <span className="text-xs text-gray-400">Win Rate</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {winRatePercent.toFixed(1)}%
                  </p>
                </div>

                {/* Total Trades */}
                <div className="bg-[#151718] rounded-lg p-4 border border-[#2A2D42]">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-[#85e1fe]" />
                    <span className="text-xs text-gray-400">Total Trades</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {numTrades}
                  </p>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#151718] rounded-lg p-4 border border-[#2A2D42]">
                  <span className="text-xs text-gray-400">Initial Equity</span>
                  <p className="text-lg font-semibold text-white mt-1">
                    {formatCurrency(initialEquity)}
                  </p>
                </div>

                <div className="bg-[#151718] rounded-lg p-4 border border-[#2A2D42]">
                  <span className="text-xs text-gray-400">Max Drawdown</span>
                  <p className="text-lg font-semibold text-red-400 mt-1">
                    {maxDrawdownPercent.toFixed(2)}%
                  </p>
                </div>

                <div className="bg-[#151718] rounded-lg p-4 border border-[#2A2D42]">
                  <span className="text-xs text-gray-400">Sharpe Ratio</span>
                  <p className="text-lg font-semibold text-white mt-1">
                    {sharpeRatio.toFixed(2)}
                  </p>
                </div>

                <div className="bg-[#151718] rounded-lg p-4 border border-[#2A2D42]">
                  <span className="text-xs text-gray-400">Profit Factor</span>
                  <p className="text-lg font-semibold text-white mt-1">
                    {profitFactor.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Equity Curve Mini Preview */}
              {equityValues.length > 0 && (
                <div className="bg-[#151718] rounded-lg p-4 border border-[#2A2D42]">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Equity Curve ({equityValues.length} points)</h3>
                  <div className="h-32 flex items-end gap-px">
                    {(() => {
                      // Sample data if too many points (max 100 bars for visibility)
                      const maxBars = 100
                      let displayValues = equityValues
                      if (equityValues.length > maxBars) {
                        const step = Math.ceil(equityValues.length / maxBars)
                        displayValues = equityValues.filter((_, i) => i % step === 0)
                      }
                      
                      const min = Math.min(...displayValues)
                      const max = Math.max(...displayValues)
                      const range = max - min || 1
                      
                      return displayValues.map((value, index) => {
                        const height = ((value - min) / range) * 100
                        return (
                          <div
                            key={index}
                            className={`flex-1 min-w-[2px] rounded-t ${isPositive ? "bg-green-500/70" : "bg-red-500/70"}`}
                            style={{ height: `${Math.max(height, 2)}%` }}
                            title={`$${value.toFixed(2)}`}
                          />
                        )
                      })
                    })()}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>${Math.min(...equityValues).toFixed(0)}</span>
                    <span>${Math.max(...equityValues).toFixed(0)}</span>
                  </div>
                </div>
              )}

              {/* CSV Download */}
              {result.csv_url && (
                <div className="flex justify-end">
                  <a
                    href={result.csv_url.startsWith('http') ? result.csv_url : `${process.env.NEXT_PUBLIC_API_URL || ''}${result.csv_url}`}
                    download
                    className="flex items-center gap-2 px-4 py-2 bg-[#2A2D42] text-white rounded-lg hover:bg-[#3A3D52] transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Trades CSV
                  </a>
                </div>
              )}
            </div>
          )}

          {activeTab === "chart" && (
            <div>
              {result.plot_html ? (
                <iframe
                  srcDoc={result.plot_html}
                  className="w-full h-[500px] border-0 rounded-lg bg-[#0e1018]"
                  title="Backtest Chart"
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  No chart data available
                </div>
              )}
            </div>
          )}

          {activeTab === "trades" && (
            <div>
              {trades.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs text-gray-400 border-b border-[#2A2D42]">
                          <th className="pb-3 pr-4">#</th>
                          <th className="pb-3 pr-4">Size</th>
                          <th className="pb-3 pr-4">Entry Bar</th>
                          <th className="pb-3 pr-4">Entry Price</th>
                          <th className="pb-3 pr-4">Exit Bar</th>
                          <th className="pb-3 pr-4">Exit Price</th>
                          <th className="pb-3 pr-4">Return %</th>
                          <th className="pb-3">P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedTrades.map((trade, index) => (
                          <tr key={trade.id ?? index} className="border-b border-[#2A2D42]/50 text-sm">
                            <td className="py-3 pr-4 text-white">{trade.id ?? index + 1}</td>
                            <td className="py-3 pr-4 text-white">{trade.size?.toFixed(2) ?? '-'}</td>
                            <td className="py-3 pr-4 text-white">{trade.entry_bar ?? '-'}</td>
                            <td className="py-3 pr-4 text-white">{trade.entry_price?.toFixed(2) ?? '-'}</td>
                            <td className="py-3 pr-4 text-white">{trade.exit_bar ?? '-'}</td>
                            <td className="py-3 pr-4 text-white">{trade.exit_price?.toFixed(2) ?? '-'}</td>
                            <td className={`py-3 pr-4 ${(trade.return_pct ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {trade.return_pct !== undefined ? `${trade.return_pct.toFixed(2)}%` : '-'}
                            </td>
                            <td className={`py-3 ${(trade.pnl ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {trade.pnl !== undefined ? formatCurrency(trade.pnl) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {trades.length > 5 && (
                    <button
                      onClick={() => setShowAllTrades(!showAllTrades)}
                      className="mt-4 flex items-center gap-2 text-[#85e1fe] hover:text-[#5AB9D1] transition-colors text-sm"
                    >
                      {showAllTrades ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Show All {trades.length} Trades
                        </>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  No trades executed
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2A2D42] flex justify-between">
          {onViewFullResults && (
            <button
              onClick={onViewFullResults}
              className="px-6 py-2 bg-[#2A2D42] text-white rounded-lg hover:bg-[#3A3D52] transition-colors font-medium"
            >
              View Full Results
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#85e1fe] text-black rounded-lg hover:bg-[#5AB9D1] transition-colors font-medium ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
