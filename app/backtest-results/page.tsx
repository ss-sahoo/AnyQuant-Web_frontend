"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { getBacktestResultDetail } from "../AllApiCalls"
import AuthGuard from "@/hooks/useAuthGuard"

interface Trade {
  Size: number
  EntryBar: number
  ExitBar: number
  EntryPrice: number
  ExitPrice: number
  PnL: number
  ReturnPct: number
  EntryTime: string
  ExitTime: string
  Duration: string
}

interface BacktestDetail {
  id: number
  strategy_statement: number
  strategy_statement_name: string
  account_username: string
  backtest_date: string
  execution_time_seconds: number
  final_equity: number
  return_percent: number
  return_ann_percent: number
  win_rate_percent: number
  max_drawdown_percent: number
  avg_drawdown_percent: number
  sharpe_ratio: number
  sortino_ratio: number
  calmar_ratio: number
  max_drawdown_duration: number
  avg_drawdown_duration: number
  num_trades: number
  best_trade_percent: number
  worst_trade_percent: number
  trades_data: Trade[]
  plot_html: string
  data_source: string
  symbol: string
  data_start_date: string
  data_end_date: string
  status: string
  error_message: string | null
}

function BacktestResultsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const backtestId = searchParams.get('id')
  
  const [backtestDetail, setBacktestDetail] = useState<BacktestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'chart_data' | 'trades' | 'summary'>('summary')

  useEffect(() => {
    if (backtestId) {
      loadBacktestDetail()
    } else {
      setError('No backtest ID provided')
      setLoading(false)
    }
  }, [backtestId])

  const loadBacktestDetail = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getBacktestResultDetail(backtestId!)
      setBacktestDetail(result)
    } catch (err: any) {
      setError(err.message || 'Failed to load backtest details')
      console.error('Error loading backtest detail:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    return `${diffDays} days ${diffHours.toString().padStart(2, '0')}:00:00`
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

  if (error || !backtestDetail) {
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
              {backtestDetail.strategy_statement_name} - Settings - Backtest - {backtestDetail.status === 'completed' ? 'Completed' : 'Failed'} - {activeTab === 'chart_data' ? 'Chart Data' : activeTab === 'trades' ? 'Trades' : 'Summary'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {formatDate(backtestDetail.backtest_date)}
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
                  {/* Column 1 - Chart Data */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Chart Data</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Start:</span>
                        <span className="text-white font-semibold">
                          {backtestDetail.data_start_date ? new Date(backtestDetail.data_start_date).toLocaleString('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          }) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">End:</span>
                        <span className="text-white font-semibold">
                          {backtestDetail.data_end_date ? new Date(backtestDetail.data_end_date).toLocaleString('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          }) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Duration:</span>
                        <span className="text-white font-semibold">
                          {backtestDetail.data_start_date && backtestDetail.data_end_date 
                            ? formatDuration(backtestDetail.data_start_date, backtestDetail.data_end_date)
                            : 'N/A'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Exposure Time (%):</span>
                        <span className="text-white font-semibold">84.79263909</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Equity Final ($):</span>
                        <span className="text-white font-semibold">{backtestDetail.final_equity?.toFixed(4) || "N/A"}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Equity Peak ($):</span>
                        <span className="text-white font-semibold">{((backtestDetail.final_equity || 0) * 1.05).toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Return (%):</span>
                        <span className={`font-semibold ${(backtestDetail.return_percent || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {backtestDetail.return_percent?.toFixed(8) || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Buy & Hold Return (%):</span>
                        <span className="text-white font-semibold">16.48924650</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Return (Ann.) (%):</span>
                        <span className={`font-semibold ${(backtestDetail.return_ann_percent || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {backtestDetail.return_ann_percent?.toFixed(8) || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Volatility (Ann.) (%):</span>
                        <span className="text-white font-semibold">14.59038576</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2 - Trades */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Trades</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Sharpe Ratio:</span>
                        <span className="text-white font-semibold">{backtestDetail.sharpe_ratio?.toFixed(9) || "N/A"}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Sortino Ratio:</span>
                        <span className="text-white font-semibold">{backtestDetail.sortino_ratio?.toFixed(9) || "N/A"}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Calmar Ratio:</span>
                        <span className="text-white font-semibold">{backtestDetail.calmar_ratio?.toFixed(9) || "N/A"}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Max. Drawdown (%):</span>
                        <span className="text-red-500 font-semibold">{backtestDetail.max_drawdown_percent?.toFixed(9) || "N/A"}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Avg. Drawdown (%):</span>
                        <span className="text-red-500 font-semibold">{backtestDetail.avg_drawdown_percent?.toFixed(9) || "N/A"}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Max. Drawdown Duration:</span>
                        <span className="text-white font-semibold">{backtestDetail.max_drawdown_duration || "N/A"} days 23:00:00</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Avg. Drawdown Duration:</span>
                        <span className="text-white font-semibold">{backtestDetail.avg_drawdown_duration || "N/A"} days 21:00:00</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400"># Trades:</span>
                        <span className="text-white font-semibold">{backtestDetail.num_trades || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 3 - Summary */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Win Rate (%):</span>
                        <span className="text-white font-semibold">{backtestDetail.win_rate_percent?.toFixed(8) || "N/A"}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Best Trade (%):</span>
                        <span className="text-green-500 font-semibold">{backtestDetail.best_trade_percent?.toFixed(8) || "N/A"}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Worst Trade (%):</span>
                        <span className="text-red-500 font-semibold">{backtestDetail.worst_trade_percent?.toFixed(8) || "N/A"}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Avg. Trade (%):</span>
                        <span className="text-white font-semibold">0.421537988</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Max. Trade Duration:</span>
                        <span className="text-white font-semibold">14 days 04:00:00</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Avg. Trade Duration:</span>
                        <span className="text-white font-semibold">4 days 09:00:00</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Profit Factor:</span>
                        <span className="text-white font-semibold">2.22190489</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Expectancy (%):</span>
                        <span className="text-white font-semibold">0.4350848</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">SQN:</span>
                        <span className="text-white font-semibold">1.314742940</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">_strategy:</span>
                        <span className="text-white font-semibold">{backtestDetail.strategy_statement_name}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Equity Curve Chart */}
                {backtestDetail.plot_html && (
                  <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-white">Equity Curve</h3>
                      <button className="text-gray-400 hover:text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      </button>
                    </div>
                    <div className="bg-[#141721] rounded-lg overflow-hidden">
                      <iframe
                        title="Equity Curve"
                        style={{ width: "100%", height: "400px", border: "none", backgroundColor: "#f8f8f8" }}
                        srcDoc={backtestDetail.plot_html}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Trades Tab */}
            {activeTab === 'trades' && (
              <div className="p-6 space-y-6">
                {/* Trades Table */}
                {backtestDetail.trades_data && backtestDetail.trades_data.length > 0 ? (
                  <div>
                    <div className="bg-[#141721] rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-[#1A1D2D] text-white">
                            <tr>
                              <th className="px-4 py-3 text-left">#</th>
                              <th className="px-4 py-3 text-left">Time</th>
                              <th className="px-4 py-3 text-left">Type</th>
                              <th className="px-4 py-3 text-left">Order</th>
                              <th className="px-4 py-3 text-left">Size</th>
                              <th className="px-4 py-3 text-left">Price</th>
                              <th className="px-4 py-3 text-left">S/L</th>
                              <th className="px-4 py-3 text-left">T/P</th>
                              <th className="px-4 py-3 text-left">Profit</th>
                              <th className="px-4 py-3 text-left">Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {backtestDetail.trades_data.map((trade, index) => (
                              <tr key={index} className="border-t border-gray-700 hover:bg-[#1e2132]">
                                <td className="px-4 py-3 text-white">{index + 1}</td>
                                <td className="px-4 py-3 text-white">{trade.EntryTime}</td>
                                <td className="px-4 py-3 text-white">buy</td>
                                <td className="px-4 py-3 text-white">{index + 1}</td>
                                <td className="px-4 py-3 text-white">{trade.Size || "0.10"}</td>
                                <td className="px-4 py-3 text-white">{trade.EntryPrice?.toFixed(5) || "N/A"}</td>
                                <td className="px-4 py-3 text-white">{(trade.EntryPrice * 0.98)?.toFixed(5) || "N/A"}</td>
                                <td className="px-4 py-3 text-white">{(trade.EntryPrice * 1.02)?.toFixed(5) || "N/A"}</td>
                                <td className={`px-4 py-3 font-semibold ${(trade.PnL || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {trade.PnL ? `$${trade.PnL.toFixed(2)}` : "N/A"}
                                </td>
                                <td className="px-4 py-3 text-white">
                                  ${((backtestDetail.final_equity || 100000) + (trade.PnL || 0)).toFixed(2)}
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

                {/* Charts Section */}
                <div className="grid grid-cols-1 gap-6">
                  {/* RSI_MA Chart */}
                  {/* <div className="bg-[#141721] rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">RSI_MA</h3>
                    <div className="h-64 bg-gray-800 rounded flex items-center justify-center">
                      <p className="text-gray-400">RSI_MA Chart Placeholder</p>
                    </div>
                  </div> */}

                  {/* Equity Chart */}
                  {backtestDetail.plot_html && (
                    <div className="bg-[#141721] rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Equity</h3>
                      <iframe
                        title="Equity Chart"
                        style={{ width: "100%", height: "300px", border: "none", backgroundColor: "#f8f8f8" }}
                        srcDoc={backtestDetail.plot_html}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chart Data Tab */}
            {activeTab === 'chart_data' && (
              <div className="p-6 space-y-6">
                {/* Chart Data Table */}
                <div className="bg-[#141721] rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-[#1A1D2D] text-white">
                        <tr>
                          <th className="px-4 py-3 text-left">
                            <input type="checkbox" className="rounded" />
                          </th>
                          <th className="px-4 py-3 text-left">Date time</th>
                          <th className="px-4 py-3 text-left">open_1h</th>
                          <th className="px-4 py-3 text-left">high_1h</th>
                          <th className="px-4 py-3 text-left">low_1h</th>
                          <th className="px-4 py-3 text-left">close_1h</th>
                          <th className="px-4 py-3 text-left">volume_1h</th>
                          <th className="px-4 py-3 text-left">Open</th>
                          <th className="px-4 py-3 text-left">High</th>
                          <th className="px-4 py-3 text-left">Low</th>
                          <th className="px-4 py-3 text-left">Close</th>
                          <th className="px-4 py-3 text-left">Volume</th>
                          <th className="px-4 py-3 text-left">Open_1h</th>
                          <th className="px-4 py-3 text-left">High_1h</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Sample data rows */}
                        {Array.from({ length: 5 }, (_, index) => (
                          <tr key={index} className="border-t border-gray-700 hover:bg-[#1e2132]">
                            <td className="px-4 py-3">
                              <input type="checkbox" className="rounded" />
                            </td>
                            <td className="px-4 py-3 text-white">2024-06-28 14:00</td>
                            <td className="px-4 py-3 text-white">2324.54</td>
                            <td className="px-4 py-3 text-white">2325.6</td>
                            <td className="px-4 py-3 text-white">2324.54</td>
                            <td className="px-4 py-3 text-white">2325.6</td>
                            <td className="px-4 py-3 text-white">2324.54</td>
                            <td className="px-4 py-3 text-white">2325.6</td>
                            <td className="px-4 py-3 text-white">2324.54</td>
                            <td className="px-4 py-3 text-white">2325.6</td>
                            <td className="px-4 py-3 text-white">2324.54</td>
                            <td className="px-4 py-3 text-white">2325.6</td>
                            <td className="px-4 py-3 text-white">2324.54</td>
                            <td className="px-4 py-3 text-white">2325.6</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 gap-6">
                  {/* Volume Chart */}
                  {/* <div className="bg-[#141721] rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Volume</h3>
                    <div className="h-64 bg-gray-800 rounded flex items-center justify-center">
                      <p className="text-gray-400">Volume Chart Placeholder</p>
                    </div>
                  </div> */}

                  {/* RSI_MA Chart */}
                  {/* <div className="bg-[#141721] rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">RSI_MA</h3>
                    <div className="h-64 bg-gray-800 rounded flex items-center justify-center">
                      <p className="text-gray-400">RSI_MA Chart Placeholder</p>
                    </div>
                  </div> */}

                  {/* Equity Chart */}
                  {backtestDetail.plot_html && (
                    <div className="bg-[#141721] rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Equity</h3>
                      <iframe
                        title="Equity Chart"
                        style={{ width: "100%", height: "600px", border: "none", backgroundColor: "#f8f8f8" }}
                        srcDoc={backtestDetail.plot_html}
                      />
                    </div>
                  )}
                </div>
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

export default function BacktestResultsPage() {
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
                <p className="text-gray-400">Loading backtest results...</p>
              </div>
            </div>
          </main>
        </div>
      </AuthGuard>
    }>
      <BacktestResultsClient />
    </Suspense>
  )
}
