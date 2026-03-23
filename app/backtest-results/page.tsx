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
  [key: string]: any // Allow additional trade fields from backend
}

interface BacktestDetail {
  id: number
  strategy_statement: number
  strategy_statement_name: string
  account_username: string
  backtest_date: string
  execution_time_seconds: number
  chart_data: Record<string, any>[] | null // OHLC + indicator data from FullDF.csv
  final_equity: number
  return_percent: number
  return_ann_percent: number
  win_rate_percent: number
  max_drawdown_percent: number
  avg_drawdown_percent: number
  sharpe_ratio: number
  sortino_ratio: number
  calmar_ratio: number
  max_drawdown_duration: string | number
  avg_drawdown_duration: string | number
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
  // Additional stats that may come from backend
  exposure_time_percent?: number
  equity_peak?: number
  buy_hold_return_percent?: number
  volatility_ann_percent?: number
  avg_trade_percent?: number
  max_trade_duration?: string | number
  avg_trade_duration?: string | number
  profit_factor?: number
  expectancy_percent?: number
  sqn?: number
  [key: string]: any // Allow any additional fields from backend
}

function BacktestResultsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const backtestId = searchParams.get('id')

  const [backtestDetail, setBacktestDetail] = useState<BacktestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'chart_data' | 'trades' | 'summary'>('chart_data')
  const [isPlotExpanded, setIsPlotExpanded] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  useEffect(() => {
    if (backtestId) {
      loadBacktestDetail()
    } else {
      setError('No backtest ID provided')
      setLoading(false)
    }
  }, [backtestId])

  // Normalize raw API response to handle different field naming conventions
  // Backend may send e.g. `win_rate` (0.55) or `win_rate_percent` (55)
  const normalizeBacktestResult = (raw: any): BacktestDetail => {
    // Helper: if a field is a decimal ratio (0-1), convert to percent
    const toPercent = (val: number | undefined | null): number | undefined => {
      if (val == null) return undefined
      // If value is between -1 and 1 (exclusive), it's likely a ratio → convert to %
      // Exception: values like 0 should stay as 0
      if (val !== 0 && Math.abs(val) <= 1) return val * 100
      return val
    }

    // Helper: pick first defined value from candidate field names (case-insensitive)
    const pick = (...keys: string[]) => {
      // Find all keys in the raw object
      const rawKeys = Object.keys(raw)
      for (const key of keys) {
        // Try exact match
        if (raw[key] != null) return raw[key]
        // Try case-insensitive match
        const foundKey = rawKeys.find(rk => rk.toLowerCase() === key.toLowerCase())
        if (foundKey && raw[foundKey] != null) return raw[foundKey]
      }
      return undefined
    }

    return {
      ...raw,
      // Core identifiers
      id: raw.id ?? raw.backtest_result_id,
      strategy_statement_name: raw.strategy_statement_name ?? raw.name ?? raw._strategy ?? 'Unknown Strategy',

      // Chart & plot data
      chart_data: raw.chart_data ?? null,
      trades_data: raw.trades_data ?? [],
      plot_html: raw.plot_html ?? '',

      // Equity & returns
      final_equity: pick('final_equity', 'equity_final', 'balance'),
      return_percent: pick('return_percent', 'return_pct', 'total_return', 'return'),
      return_ann_percent: pick('return_ann_percent', 'return_ann', 'annual_return', 'return_ann_percent_value'),

      // Win rate
      win_rate_percent: (() => {
        const v = pick('win_rate_percent', 'win_rate', 'win_rate_pct')
        if (v == null) return undefined
        return (v > 0 && v <= 1) ? v * 100 : v
      })(),

      // Drawdown
      max_drawdown_percent: pick('max_drawdown_percent', 'max_drawdown', 'max_drawdown_pct'),
      avg_drawdown_percent: pick('avg_drawdown_percent', 'avg_drawdown', 'avg_drawdown_pct'),
      max_drawdown_duration: pick('max_drawdown_duration'),
      avg_drawdown_duration: pick('avg_drawdown_duration'),

      // Ratios
      sharpe_ratio: pick('sharpe_ratio', 'sharpe'),
      sortino_ratio: pick('sortino_ratio', 'sortino'),
      calmar_ratio: pick('calmar_ratio', 'calmar'),

      // Trade counts & stats
      num_trades: pick('num_trades', 'total_trades', 'trades_count'),
      best_trade_percent: pick('best_trade_percent', 'best_trade', 'best_trade_pct'),
      worst_trade_percent: pick('worst_trade_percent', 'worst_trade', 'worst_trade_pct'),

      // Additional stats
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

      // Meta
      data_source: raw.data_source ?? '',
      symbol: raw.symbol ?? '',
      data_start_date: raw.data_start_date ?? '',
      data_end_date: raw.data_end_date ?? '',
      status: raw.status ?? 'completed',
      error_message: raw.error_message ?? null,
    }
  }

  const loadBacktestDetail = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check sessionStorage cache first — instant load on revisit
      const cacheKey = `backtest_result_${backtestId}`
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        setBacktestDetail(JSON.parse(cached))
        setLoading(false)
        return
      }

      const raw = await getBacktestResultDetail(backtestId!)
      console.log('📊 Raw backtest API response:', raw)
      const normalized = normalizeBacktestResult(raw)
      console.log('📊 Normalized backtest data:', normalized)
      // Cache for this session
      try { sessionStorage.setItem(cacheKey, JSON.stringify(normalized)) } catch {}
      setBacktestDetail(normalized)
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

        <main className="flex-1 flex flex-col relative ml-[63px] w-0 min-w-0 min-h-screen">
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
          <div className="flex justify-center border-b border-gray-700 bg-[#121420] sticky top-0 z-20 overflow-x-auto no-scrollbar">
            <div className="flex space-x-8 px-6">
              <button
                className={`px-4 py-3 font-semibold whitespace-nowrap transition-all ${activeTab === 'chart_data' ? 'text-[#85e1fe] border-b-2 border-[#85e1fe]' : 'text-gray-400 hover:text-gray-200'}`}
                onClick={() => setActiveTab('chart_data')}
              >
                Chart Data
              </button>
              <button
                className={`px-4 py-3 font-semibold whitespace-nowrap transition-all ${activeTab === 'trades' ? 'text-[#85e1fe] border-b-2 border-[#85e1fe]' : 'text-gray-400 hover:text-gray-200'}`}
                onClick={() => setActiveTab('trades')}
              >
                Trades
              </button>
              <button
                className={`px-4 py-3 font-semibold whitespace-nowrap transition-all ${activeTab === 'summary' ? 'text-[#85e1fe] border-b-2 border-[#85e1fe]' : 'text-gray-400 hover:text-gray-200'}`}
                onClick={() => setActiveTab('summary')}
              >
                Summary
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <div className="p-6 space-y-6">
                {/* Three Column Statistics Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                        <span className="text-white font-semibold">
                          {backtestDetail.exposure_time_percent != null ? backtestDetail.exposure_time_percent.toFixed(8) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Equity Final ($):</span>
                        <span className="text-white font-semibold">{backtestDetail.final_equity != null ? backtestDetail.final_equity.toFixed(4) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Equity Peak ($):</span>
                        <span className="text-white font-semibold">
                          {backtestDetail.equity_peak != null ? backtestDetail.equity_peak.toFixed(4) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Return (%):</span>
                        <span className={`font-semibold ${(backtestDetail.return_percent || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {backtestDetail.return_percent != null ? backtestDetail.return_percent.toFixed(8) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Buy & Hold Return (%):</span>
                        <span className="text-white font-semibold">
                          {backtestDetail.buy_hold_return_percent != null ? backtestDetail.buy_hold_return_percent.toFixed(8) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Return (Ann.) (%):</span>
                        <span className={`font-semibold ${(backtestDetail.return_ann_percent || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {backtestDetail.return_ann_percent != null ? backtestDetail.return_ann_percent.toFixed(8) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Volatility (Ann.) (%):</span>
                        <span className="text-white font-semibold">
                          {backtestDetail.volatility_ann_percent != null ? backtestDetail.volatility_ann_percent.toFixed(8) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2 - Trades */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Trades</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Sharpe Ratio:</span>
                        <span className="text-white font-semibold">{backtestDetail.sharpe_ratio != null ? backtestDetail.sharpe_ratio.toFixed(9) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Sortino Ratio:</span>
                        <span className="text-white font-semibold">{backtestDetail.sortino_ratio != null ? backtestDetail.sortino_ratio.toFixed(9) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Calmar Ratio:</span>
                        <span className="text-white font-semibold">{backtestDetail.calmar_ratio != null ? backtestDetail.calmar_ratio.toFixed(9) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Max. Drawdown (%):</span>
                        <span className="text-red-500 font-semibold">{backtestDetail.max_drawdown_percent != null ? backtestDetail.max_drawdown_percent.toFixed(9) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Avg. Drawdown (%):</span>
                        <span className="text-red-500 font-semibold">{backtestDetail.avg_drawdown_percent != null ? backtestDetail.avg_drawdown_percent.toFixed(9) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Max. Drawdown Duration:</span>
                        <span className="text-white font-semibold">{backtestDetail.max_drawdown_duration ?? 'N/A'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Avg. Drawdown Duration:</span>
                        <span className="text-white font-semibold">{backtestDetail.avg_drawdown_duration ?? 'N/A'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400"># Trades:</span>
                        <span className="text-white font-semibold">{backtestDetail.num_trades ?? 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 3 - Summary */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Win Rate (%):</span>
                        <span className="text-white font-semibold">{backtestDetail.win_rate_percent != null ? backtestDetail.win_rate_percent.toFixed(8) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Best Trade (%):</span>
                        <span className="text-green-500 font-semibold">{backtestDetail.best_trade_percent != null ? backtestDetail.best_trade_percent.toFixed(8) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Worst Trade (%):</span>
                        <span className="text-red-500 font-semibold">{backtestDetail.worst_trade_percent != null ? backtestDetail.worst_trade_percent.toFixed(8) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Avg. Trade (%):</span>
                        <span className="text-white font-semibold">
                          {backtestDetail.avg_trade_percent != null ? backtestDetail.avg_trade_percent.toFixed(9) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Max. Trade Duration:</span>
                        <span className="text-white font-semibold">
                          {backtestDetail.max_trade_duration ?? 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Avg. Trade Duration:</span>
                        <span className="text-white font-semibold">
                          {backtestDetail.avg_trade_duration ?? 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Profit Factor:</span>
                        <span className="text-white font-semibold">
                          {backtestDetail.profit_factor != null ? backtestDetail.profit_factor.toFixed(9) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Expectancy (%):</span>
                        <span className="text-white font-semibold">
                          {backtestDetail.expectancy_percent != null ? backtestDetail.expectancy_percent.toFixed(7) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">SQN:</span>
                        <span className="text-white font-semibold">
                          {backtestDetail.sqn != null ? backtestDetail.sqn.toFixed(9) : 'N/A'}
                        </span>
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
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-white">Trades ({backtestDetail.trades_data.length})</h3>
                    </div>
                    <div className="bg-[#141721] rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-[#1A1D2D] text-white">
                            <tr>
                              <th className="px-4 py-3 text-left">#</th>
                              <th className="px-4 py-3 text-left">Entry Time</th>
                              <th className="px-4 py-3 text-left">Exit Time</th>
                              <th className="px-4 py-3 text-left">Size</th>
                              <th className="px-4 py-3 text-left">Entry Price</th>
                              <th className="px-4 py-3 text-left">Exit Price</th>
                              <th className="px-4 py-3 text-left">PnL</th>
                              <th className="px-4 py-3 text-left">Return (%)</th>
                              <th className="px-4 py-3 text-left">Duration</th>
                              <th className="px-4 py-3 text-left">Entry Bar</th>
                              <th className="px-4 py-3 text-left">Exit Bar</th>
                            </tr>
                          </thead>
                          <tbody>
                            {backtestDetail.trades_data.map((trade, index) => (
                              <tr key={index} className="border-t border-gray-700 hover:bg-[#1e2132]">
                                <td className="px-4 py-3 text-white">{index + 1}</td>
                                <td className="px-4 py-3 text-white">{trade.EntryTime || 'N/A'}</td>
                                <td className="px-4 py-3 text-white">{trade.ExitTime || 'N/A'}</td>
                                <td className="px-4 py-3 text-white">{trade.Size ?? 'N/A'}</td>
                                <td className="px-4 py-3 text-white">{trade.EntryPrice != null ? trade.EntryPrice.toFixed(5) : 'N/A'}</td>
                                <td className="px-4 py-3 text-white">{trade.ExitPrice != null ? trade.ExitPrice.toFixed(5) : 'N/A'}</td>
                                <td className={`px-4 py-3 font-semibold ${(trade.PnL || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {trade.PnL != null ? `$${trade.PnL.toFixed(2)}` : 'N/A'}
                                </td>
                                <td className={`px-4 py-3 font-semibold ${(trade.ReturnPct || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {trade.ReturnPct != null ? `${trade.ReturnPct.toFixed(4)}%` : 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-white">{trade.Duration || 'N/A'}</td>
                                <td className="px-4 py-3 text-gray-400">{trade.EntryBar ?? 'N/A'}</td>
                                <td className="px-4 py-3 text-gray-400">{trade.ExitBar ?? 'N/A'}</td>
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
                {backtestDetail.plot_html && (
                  <div className="bg-[#141721] rounded-lg p-4 mt-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Equity</h3>
                    <iframe
                      title="Equity Chart"
                      style={{ width: "100%", height: "300px", border: "none", backgroundColor: "#f8f8f8" }}
                      srcDoc={backtestDetail.plot_html}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Chart Data Tab */}
            {activeTab === 'chart_data' && (
              <div className="space-y-0">
                {/* Main Plot — full width, tall, expandable */}
                {backtestDetail.plot_html ? (
                  <div className="relative bg-[#121420]">
                    <div className="flex items-center justify-between px-4 py-2 bg-[#141721] border-b border-gray-700">
                      <span className="text-white font-semibold text-sm">Equity Curve</span>
                      <button
                        onClick={() => setIsPlotExpanded(!isPlotExpanded)}
                        className="text-gray-400 hover:text-white text-xs px-3 py-1 rounded border border-gray-600 hover:border-gray-400 transition-colors"
                      >
                        {isPlotExpanded ? '⊡ Collapse' : '⊞ Expand'}
                      </button>
                    </div>
                    {/* Dark placeholder shown while iframe loads */}
                    {!iframeLoaded && (
                      <div
                        className="absolute inset-0 top-[37px] flex items-center justify-center bg-[#121420] z-10"
                        style={{ height: isPlotExpanded ? "calc(100vh - 160px)" : "520px" }}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-6 h-6 border-2 border-gray-600 border-t-[#85e1fe] rounded-full animate-spin" />
                          <span className="text-gray-500 text-sm">Loading chart...</span>
                        </div>
                      </div>
                    )}
                    <iframe
                      title="Equity Curve"
                      onLoad={() => setIframeLoaded(true)}
                      style={{
                        width: "100%",
                        height: isPlotExpanded ? "calc(100vh - 160px)" : "520px",
                        border: "none",
                        backgroundColor: "#121420",
                        display: "block",
                        transition: "height 0.3s ease, opacity 0.4s ease",
                        opacity: iframeLoaded ? 1 : 0,
                      }}
                      srcDoc={backtestDetail.plot_html}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-400">
                    No chart available
                  </div>
                )}

                {/* Chart Data Table below the plot */}
                {backtestDetail.chart_data && backtestDetail.chart_data.length > 0 && (
                  <div className="p-6">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3">
                      Raw Chart Data ({backtestDetail.chart_data.length} rows)
                    </h3>
                    <div className="bg-[#141721] rounded-lg overflow-hidden">
                      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-[#1A1D2D] text-white sticky top-0 z-10">
                            <tr>
                              <th className="px-4 py-3 text-left">#</th>
                              {Object.keys(backtestDetail.chart_data[0]).map((colName) => (
                                <th key={colName} className="px-4 py-3 text-left whitespace-nowrap">{colName}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {backtestDetail.chart_data.map((row, index) => (
                              <tr key={index} className="border-t border-gray-700 hover:bg-[#1e2132]">
                                <td className="px-4 py-3 text-gray-400">{index + 1}</td>
                                {Object.keys(row).map((colName) => {
                                  const value = row[colName]
                                  return (
                                    <td key={colName} className="px-4 py-3 text-white whitespace-nowrap">
                                      {value != null ? (typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(5)) : String(value)) : 'N/A'}
                                    </td>
                                  )
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Expanded plot overlay */}
          {isPlotExpanded && backtestDetail.plot_html && (
            <div className="fixed inset-0 z-50 bg-[#121420] flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 bg-[#141721] border-b border-gray-700">
                <span className="text-white font-semibold">Equity Curve — {backtestDetail.strategy_statement_name}</span>
                <button
                  onClick={() => setIsPlotExpanded(false)}
                  className="text-gray-400 hover:text-white text-sm px-3 py-1 rounded border border-gray-600 hover:border-gray-400"
                >
                  ✕ Close
                </button>
              </div>
              <iframe
                title="Equity Curve Expanded"
                style={{ flex: 1, border: "none", backgroundColor: "#121420" }}
                srcDoc={backtestDetail.plot_html}
              />
            </div>
          )}

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
