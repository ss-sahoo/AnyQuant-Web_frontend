"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import AuthGuard from "@/hooks/useAuthGuard"

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
  num_trades?: number
}

interface CustomBacktestResult {
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
  }
}

// Helper function to extract equity value from equity curve point
const getEquityValue = (point: number | EquityCurvePoint): number => {
  if (typeof point === 'number') {
    return point
  }
  return point.equity ?? 0
}

function CustomBacktestResultsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [backtestResult, setBacktestResult] = useState<CustomBacktestResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'chart_data' | 'trades' | 'summary'>('summary')

  useEffect(() => {
    // Load result from sessionStorage
    const storedResult = sessionStorage.getItem('customBacktestResult')
    if (storedResult) {
      try {
        const parsed = JSON.parse(storedResult)
        setBacktestResult(parsed)
        setLoading(false)
      } catch (err) {
        setError('Failed to parse backtest result')
        setLoading(false)
      }
    } else {
      setError('No backtest result found. Please run a backtest first.')
      setLoading(false)
    }
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value)
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen bg-[#121420] text-white">
          <div className="hidden md:block">
            <Sidebar currentPage="home" />
          </div>
          <MobileSidebar currentPage="home" />
          <main className="flex-1 flex flex-col relative ml-[63px]">
            <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-gray-600 border-t-[#85e1fe] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading backtest results...</p>
              </div>
            </div>
          </main>
        </div>
      </AuthGuard>
    )
  }

  if (error || !backtestResult) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen bg-[#121420] text-white">
          <div className="hidden md:block">
            <Sidebar currentPage="home" />
          </div>
          <MobileSidebar currentPage="home" />
          <main className="flex-1 flex flex-col relative ml-[63px]">
            <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                <p className="text-red-400 text-lg font-semibold mb-2">Error loading backtest results</p>
                <p className="text-gray-400 text-sm mb-4">{error}</p>
                <button 
                  onClick={() => router.push('/strategy-testing')}
                  className="bg-[#85e1fe] text-black px-4 py-2 rounded-md hover:bg-[#6bcae2]"
                >
                  Back to Strategy Testing
                </button>
              </div>
            </div>
          </main>
        </div>
      </AuthGuard>
    )
  }

  // Extract values with fallbacks for different response formats
  const returnPercent = backtestResult.return_percent ?? backtestResult.total_return ?? backtestResult.statistics?.return_pct ?? 0
  const finalEquity = backtestResult.final_equity ?? backtestResult.statistics?.equity_final ?? 0
  const initialEquity = backtestResult.initial_equity ?? 100000
  const winRatePercent = backtestResult.win_rate_percent ?? backtestResult.win_rate ?? backtestResult.statistics?.win_rate ?? 0
  const numTrades = backtestResult.num_trades ?? backtestResult.statistics?.num_trades ?? 0
  const maxDrawdownPercent = backtestResult.max_drawdown_percent ?? backtestResult.max_drawdown ?? backtestResult.statistics?.max_drawdown ?? 0
  const sharpeRatio = backtestResult.sharpe_ratio ?? backtestResult.statistics?.sharpe_ratio ?? 0
  const profitFactor = backtestResult.profit_factor ?? backtestResult.statistics?.profit_factor ?? 0
  const symbol = backtestResult.symbol ?? backtestResult.metadata?.symbol ?? "N/A"
  const dataSource = backtestResult.data_source ?? backtestResult.metadata?.data_source ?? "N/A"
  const strategyName = backtestResult.custom_strategy_name ?? "Custom Strategy"
  const trades = backtestResult.trades ?? []
  
  // Extract equity values from equity curve (handles both number[] and object[] formats)
  const rawEquityCurve = backtestResult.equity_curve ?? []
  const equityValues = rawEquityCurve.map(getEquityValue)

  const isPositive = returnPercent >= 0

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#121420] text-white">
        <div className="hidden md:block">
          <Sidebar currentPage="home" />
        </div>
        <MobileSidebar currentPage="home" />
        
        <main className="flex-1 flex flex-col relative ml-[63px]">
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <h1 className="text-2xl font-bold text-white">
              {strategyName} - Custom Strategy Backtest - Completed - {activeTab === 'chart_data' ? 'Chart Data' : activeTab === 'trades' ? 'Trades' : 'Summary'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {symbol} • {dataSource}
            </p>
          </div>

          {/* Top Tabs */}
          <div className="flex justify-around border-b border-gray-700">
            <button
              className={`px-6 py-3 font-semibold ${activeTab === 'chart_data' ? 'text-[#85e1fe] border-b-2 border-[#85e1fe]' : 'text-gray-400'}`}
              onClick={() => setActiveTab('chart_data')}
            >
              Chart Data
            </button>
            <button
              className={`px-6 py-3 font-semibold ${activeTab === 'trades' ? 'text-[#85e1fe] border-b-2 border-[#85e1fe]' : 'text-gray-400'}`}
              onClick={() => setActiveTab('trades')}
            >
              Trades
            </button>
            <button
              className={`px-6 py-3 font-semibold ${activeTab === 'summary' ? 'text-[#85e1fe] border-b-2 border-[#85e1fe]' : 'text-gray-400'}`}
              onClick={() => setActiveTab('summary')}
            >
              Summary
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <div className="p-6 space-y-6">
                {/* Three Column Statistics Layout */}
                <div className="grid grid-cols-3 gap-8">
                  {/* Column 1 - Performance */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Performance</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Initial Equity ($):</span>
                        <span className="text-white font-semibold">{initialEquity.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Final Equity ($):</span>
                        <span className="text-white font-semibold">{finalEquity.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Return (%):</span>
                        <span className={`font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {returnPercent.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Symbol:</span>
                        <span className="text-white font-semibold">{symbol}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Data Source:</span>
                        <span className="text-white font-semibold">{dataSource}</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2 - Risk Metrics */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Risk Metrics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Sharpe Ratio:</span>
                        <span className="text-white font-semibold">{sharpeRatio.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Max. Drawdown (%):</span>
                        <span className="text-red-500 font-semibold">{maxDrawdownPercent.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Profit Factor:</span>
                        <span className="text-white font-semibold">{profitFactor.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400"># Trades:</span>
                        <span className="text-white font-semibold">{numTrades}</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 3 - Trade Statistics */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Trade Statistics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Win Rate (%):</span>
                        <span className="text-white font-semibold">{winRatePercent.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Total Trades:</span>
                        <span className="text-white font-semibold">{numTrades}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Total Return (%):</span>
                        <span className={`font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {returnPercent.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Strategy:</span>
                        <span className="text-white font-semibold">{strategyName}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Equity Curve Chart */}
                {backtestResult.plot_html && (
                  <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-white">Equity Curve</h3>
                    </div>
                    <div className="bg-[#141721] rounded-lg overflow-hidden">
                      <iframe
                        title="Equity Curve"
                        style={{ width: "100%", height: "400px", border: "none", backgroundColor: "#f8f8f8" }}
                        srcDoc={backtestResult.plot_html}
                      />
                    </div>
                  </div>
                )}

                {/* Equity Curve Mini Chart (if no plot_html) */}
                {!backtestResult.plot_html && equityValues.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Equity Curve ({equityValues.length} points)</h3>
                    <div className="bg-[#141721] rounded-lg p-4">
                      <div className="h-48 flex items-end gap-px">
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
                                className={`flex-1 min-w-[3px] rounded-t ${isPositive ? "bg-green-500/70" : "bg-red-500/70"}`}
                                style={{ height: `${Math.max(height, 2)}%` }}
                                title={`$${value.toFixed(2)}`}
                              />
                            )
                          })
                        })()}
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>Min: ${Math.min(...equityValues).toFixed(0)}</span>
                        <span>Max: ${Math.max(...equityValues).toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Trades Tab */}
            {activeTab === 'trades' && (
              <div className="p-6 space-y-6">
                {/* Trades Table */}
                {trades.length > 0 ? (
                  <div>
                    <div className="bg-[#141721] rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-[#1A1D2D] text-white">
                            <tr>
                              <th className="px-4 py-3 text-left">#</th>
                              <th className="px-4 py-3 text-left">Size</th>
                              <th className="px-4 py-3 text-left">Entry Bar</th>
                              <th className="px-4 py-3 text-left">Entry Price</th>
                              <th className="px-4 py-3 text-left">Exit Bar</th>
                              <th className="px-4 py-3 text-left">Exit Price</th>
                              <th className="px-4 py-3 text-left">Return %</th>
                              <th className="px-4 py-3 text-left">P&L</th>
                            </tr>
                          </thead>
                          <tbody>
                            {trades.map((trade, index) => (
                              <tr key={trade.id ?? index} className="border-t border-gray-700 hover:bg-[#1e2132]">
                                <td className="px-4 py-3 text-white">{trade.id ?? index + 1}</td>
                                <td className="px-4 py-3 text-white">{trade.size?.toFixed(2) ?? '-'}</td>
                                <td className="px-4 py-3 text-white">{trade.entry_bar ?? '-'}</td>
                                <td className="px-4 py-3 text-white">{trade.entry_price?.toFixed(2) ?? '-'}</td>
                                <td className="px-4 py-3 text-white">{trade.exit_bar ?? '-'}</td>
                                <td className="px-4 py-3 text-white">{trade.exit_price?.toFixed(2) ?? '-'}</td>
                                <td className={`px-4 py-3 ${(trade.return_pct ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {trade.return_pct !== undefined ? `${trade.return_pct.toFixed(2)}%` : '-'}
                                </td>
                                <td className={`px-4 py-3 font-semibold ${(trade.pnl ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {trade.pnl !== undefined ? formatCurrency(trade.pnl) : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <p>No trades data available</p>
                  </div>
                )}

                {/* Equity Chart */}
                {backtestResult.plot_html && (
                  <div className="bg-[#141721] rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Equity</h3>
                    <iframe
                      title="Equity Chart"
                      style={{ width: "100%", height: "300px", border: "none", backgroundColor: "#f8f8f8" }}
                      srcDoc={backtestResult.plot_html}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Chart Data Tab */}
            {activeTab === 'chart_data' && (
              <div className="p-6 space-y-6">
                {/* Equity Curve Data */}
                {rawEquityCurve.length > 0 && (
                  <div className="bg-[#141721] rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-[#1A1D2D] text-white">
                          <tr>
                            <th className="px-4 py-3 text-left">#</th>
                            <th className="px-4 py-3 text-left">Timestamp</th>
                            <th className="px-4 py-3 text-left">Equity Value</th>
                            <th className="px-4 py-3 text-left">Drawdown %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rawEquityCurve.map((point, index) => {
                            const isObject = typeof point === 'object'
                            const equity = isObject ? (point as EquityCurvePoint).equity ?? 0 : point
                            const timestamp = isObject ? (point as EquityCurvePoint).timestamp ?? '-' : '-'
                            const drawdown = isObject ? (point as EquityCurvePoint).drawdown_pct ?? 0 : 0
                            return (
                              <tr key={index} className="border-t border-gray-700 hover:bg-[#1e2132]">
                                <td className="px-4 py-3 text-white">{index + 1}</td>
                                <td className="px-4 py-3 text-white">{timestamp}</td>
                                <td className="px-4 py-3 text-white">{formatCurrency(equity)}</td>
                                <td className={`px-4 py-3 ${drawdown < 0 ? 'text-red-500' : 'text-white'}`}>
                                  {drawdown.toFixed(2)}%
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Equity Chart */}
                {backtestResult.plot_html && (
                  <div className="bg-[#141721] rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Equity</h3>
                    <iframe
                      title="Equity Chart"
                      style={{ width: "100%", height: "600px", border: "none", backgroundColor: "#f8f8f8" }}
                      srcDoc={backtestResult.plot_html}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Navigation Tabs */}
          <div className="flex border-t border-gray-700">
            <button 
              onClick={() => router.push('/strategy-testing')}
              className="flex-1 py-3 text-center font-medium bg-[#1A1D2D] text-gray-400 hover:text-white"
            >
              Strategy
            </button>
            <button className="flex-1 py-3 text-center font-medium bg-[#141721] text-[#85e1fe]">
              Backtest
            </button>
            <button 
              onClick={() => router.push('/strategy-testing')}
              className="flex-1 py-3 text-center font-medium bg-[#1A1D2D] text-gray-400 hover:text-white"
            >
              Optimisation
            </button>
            <button 
              onClick={() => router.push('/strategy-testing')}
              className="flex-1 py-3 text-center font-medium bg-[#1A1D2D] text-gray-400 hover:text-white"
            >
              Properties
            </button>
          </div>

          {/* Progress Bar */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Progress</span>
              <span className="text-sm text-green-500">Completed</span>
            </div>
            <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full w-full"></div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}

export default function CustomBacktestResultsPage() {
  return (
    <Suspense fallback={
      <AuthGuard>
        <div className="flex min-h-screen bg-[#121420] text-white">
          <div className="hidden md:block">
            <Sidebar currentPage="home" />
          </div>
          <MobileSidebar currentPage="home" />
          <main className="flex-1 flex flex-col relative ml-[63px]">
            <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-gray-600 border-t-[#85e1fe] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading...</p>
              </div>
            </div>
          </main>
        </div>
      </AuthGuard>
    }>
      <CustomBacktestResultsClient />
    </Suspense>
  )
}
