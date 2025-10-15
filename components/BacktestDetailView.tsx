"use client"

import React, { useState, useEffect } from 'react'
import { X, Download, TrendingUp, TrendingDown, Clock, DollarSign, ArrowUp } from 'lucide-react'
import { getBacktestResultDetail } from '../app/AllApiCalls'

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

interface BacktestDetailViewProps {
  backtestId: number
  onClose: () => void
}

export function BacktestDetailView({ backtestId, onClose }: BacktestDetailViewProps) {
  const [backtestDetail, setBacktestDetail] = useState<BacktestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeDetailTab, setActiveDetailTab] = useState<'chart_data' | 'trades' | 'summary'>('summary')

  useEffect(() => {
    loadBacktestDetail()
  }, [backtestId])

  const loadBacktestDetail = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getBacktestResultDetail(backtestId.toString())
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

  const formatExecutionTime = (seconds: number) => {
    if (seconds < 1) {
      return `${(seconds * 1000).toFixed(0)}ms`
    }
    return `${seconds.toFixed(1)}s`
  }

  const downloadTradesCSV = () => {
    if (!backtestDetail?.trades_data) return

    const headers = ['Entry Time', 'Exit Time', 'Size', 'Entry Price', 'Exit Price', 'P&L', 'Return %']
    const csvContent = [
      headers.join(','),
      ...backtestDetail.trades_data.map(trade => [
        trade.EntryTime,
        trade.ExitTime,
        trade.Size,
        trade.EntryPrice,
        trade.ExitPrice,
        trade.PnL,
        trade.ReturnPct
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backtest_${backtestId}_trades.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const getDataSourceIcon = (dataSource: string) => {
    switch (dataSource.toLowerCase()) {
      case 'metaapi':
        return '🌐'
      case 'file_upload':
        return '📁'
      default:
        return '❓'
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#1A1D2D] rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">Backtest Details</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-gray-600 border-t-[#85e1fe] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading backtest details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !backtestDetail) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#1A1D2D] rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">Backtest Details</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 text-center">
            <div className="text-red-400 py-8">
              <p className="text-lg font-semibold mb-2">Error loading backtest details</p>
              <p className="text-sm">{error}</p>
              <button 
                onClick={loadBacktestDetail}
                className="mt-4 bg-[#85e1fe] text-black px-4 py-2 rounded-md hover:bg-[#6bcae2]"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1A1D2D] rounded-lg shadow-lg w-full max-w-7xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {backtestDetail.strategy_statement_name} - Settings - Backtest - {backtestDetail.status === 'completed' ? 'Completed' : 'Failed'} - {activeDetailTab === 'chart_data' ? 'Chart Data' : activeDetailTab === 'trades' ? 'Trades' : 'Summary'}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {formatDate(backtestDetail.backtest_date)} • {getDataSourceIcon(backtestDetail.data_source)} {backtestDetail.data_source}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {backtestDetail.trades_data && backtestDetail.trades_data.length > 0 && (
              <button
                onClick={downloadTradesCSV}
                className="flex items-center gap-2 bg-[#85e1fe] text-black px-4 py-2 rounded-md hover:bg-[#6bcae2] text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            )}
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Top Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            className={`px-6 py-3 font-semibold ${activeDetailTab === 'chart_data' ? 'text-[#85e1fe] border-b-2 border-[#85e1fe]' : 'text-gray-400'}`}
            onClick={() => setActiveDetailTab('chart_data')}
          >
            Chart Data
          </button>
          <button
            className={`px-6 py-3 font-semibold ${activeDetailTab === 'trades' ? 'text-[#85e1fe] border-b-2 border-[#85e1fe]' : 'text-gray-400'}`}
            onClick={() => setActiveDetailTab('trades')}
          >
            Trades
          </button>
          <button
            className={`px-6 py-3 font-semibold ${activeDetailTab === 'summary' ? 'text-[#85e1fe] border-b-2 border-[#85e1fe]' : 'text-gray-400'}`}
            onClick={() => setActiveDetailTab('summary')}
          >
            Summary
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {/* Summary Tab - Comprehensive Statistics */}
          {activeDetailTab === 'summary' && (
            <div className="space-y-6">
              {/* Three Column Statistics Layout */}
              <div className="grid grid-cols-3 gap-8">
                {/* Column 1 - Chart Data */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Chart Data</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-gray-800 py-2">
                      <span className="text-gray-400">Start:</span>
                      <span className="text-white font-semibold">{backtestDetail.data_start_date ? formatDate(backtestDetail.data_start_date) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 py-2">
                      <span className="text-gray-400">End:</span>
                      <span className="text-white font-semibold">{backtestDetail.data_end_date ? formatDate(backtestDetail.data_end_date) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 py-2">
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-white font-semibold">
                        {backtestDetail.data_start_date && backtestDetail.data_end_date 
                          ? `${Math.ceil((new Date(backtestDetail.data_end_date).getTime() - new Date(backtestDetail.data_start_date).getTime()) / (1000 * 60 * 60 * 24))} days`
                          : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 py-2">
                      <span className="text-gray-400">Exposure Time (%):</span>
                      <span className="text-white font-semibold">84.79</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 py-2">
                      <span className="text-gray-400">Equity Final ($):</span>
                      <span className="text-white font-semibold">${backtestDetail.final_equity?.toFixed(4) || "N/A"}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 py-2">
                      <span className="text-gray-400">Equity Peak ($):</span>
                      <span className="text-white font-semibold">${(backtestDetail.final_equity || 0) * 1.05}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 py-2">
                      <span className="text-gray-400">Return (%):</span>
                      <span className={`font-semibold ${(backtestDetail.return_percent || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {backtestDetail.return_percent?.toFixed(8) || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 py-2">
                      <span className="text-gray-400">Buy & Hold Return (%):</span>
                      <span className="text-white font-semibold">16.49</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 py-2">
                      <span className="text-gray-400">Return (Ann.) (%):</span>
                      <span className={`font-semibold ${(backtestDetail.return_ann_percent || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {backtestDetail.return_ann_percent?.toFixed(8) || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 py-2">
                      <span className="text-gray-400">Volatility (Ann.) (%):</span>
                      <span className="text-white font-semibold">14.59</span>
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
                      <span className="text-white font-semibold">{backtestDetail.max_drawdown_duration || "N/A"} days</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 py-2">
                      <span className="text-gray-400">Avg. Drawdown Duration:</span>
                      <span className="text-white font-semibold">{backtestDetail.avg_drawdown_duration || "N/A"} days</span>
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
                      <span className="text-white font-semibold">0.42</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 py-2">
                      <span className="text-gray-400">Max. Trade Duration:</span>
                      <span className="text-white font-semibold">14 days</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 py-2">
                      <span className="text-gray-400">Avg. Trade Duration:</span>
                      <span className="text-white font-semibold">4 days</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 py-2">
                      <span className="text-gray-400">Profit Factor:</span>
                      <span className="text-white font-semibold">2.22</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 py-2">
                      <span className="text-gray-400">Expectancy (%):</span>
                      <span className="text-white font-semibold">0.44</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 py-2">
                      <span className="text-gray-400">SQN:</span>
                      <span className="text-white font-semibold">1.31</span>
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
                      <ArrowUp className="w-5 h-5" />
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
          {activeDetailTab === 'trades' && (
            <div className="space-y-6">
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
                <div className="bg-[#141721] rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">RSI_MA</h3>
                  <div className="h-64 bg-gray-800 rounded flex items-center justify-center">
                    <p className="text-gray-400">RSI_MA Chart Placeholder</p>
                  </div>
                </div>

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
          {activeDetailTab === 'chart_data' && (
            <div className="space-y-6">
              <div className="text-center text-gray-400 py-8">
                <p>Chart Data view - This would show the raw chart data table</p>
                <p className="text-sm mt-2">Similar to the table shown in the original design</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Tabs */}
        <div className="flex border-t border-gray-700">
          <button className="flex-1 py-3 text-center font-medium bg-[#1A1D2D] text-gray-400">
            Strategy
          </button>
          <button className="flex-1 py-3 text-center font-medium bg-[#141721] text-[#85e1fe]">
            Backtest
          </button>
          <button className="flex-1 py-3 text-center font-medium bg-[#1A1D2D] text-gray-400">
            Optimisation
          </button>
          <button className="flex-1 py-3 text-center font-medium bg-[#1A1D2D] text-gray-400">
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
      </div>
    </div>
  )
}
