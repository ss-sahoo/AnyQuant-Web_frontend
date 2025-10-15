"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { getStrategyBacktestResults, deleteBacktestResult } from '../app/AllApiCalls'

interface BacktestResult {
  id: number
  strategy_statement: number
  strategy_statement_name: string
  backtest_date: string
  execution_time_seconds: number
  final_equity: number
  return_percent: number
  return_ann_percent: number
  win_rate_percent: number
  max_drawdown_percent: number
  num_trades: number
  data_source: string
  symbol: string
  status: string
}

interface BacktestHistoryListProps {
  strategyId: string
  onClose: () => void
}

export function BacktestHistoryList({ strategyId, onClose }: BacktestHistoryListProps) {
  const router = useRouter()
  const [backtestResults, setBacktestResults] = useState<BacktestResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBacktestResults()
  }, [strategyId])

  const loadBacktestResults = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getStrategyBacktestResults(strategyId, {
        page: 1,
        page_size: 50
      })
      setBacktestResults(response.results || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load backtest results')
      console.error('Error loading backtest results:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (backtestId: number) => {
    if (!confirm('Are you sure you want to delete this backtest result?')) {
      return
    }

    try {
      await deleteBacktestResult(backtestId.toString())
      await loadBacktestResults()
    } catch (err: any) {
      console.error('Error deleting backtest result:', err)
      alert('Failed to delete backtest result: ' + (err.message || 'Unknown error'))
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500 text-white'
      case 'failed':
        return 'bg-red-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
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
        <div className="bg-[#1A1D2D] rounded-lg shadow-lg w-full max-w-6xl max-h-[80vh] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">Backtest History</h2>
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
              <p className="text-gray-400">Loading backtest results...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1A1D2D] rounded-lg shadow-lg w-full max-w-6xl max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Backtest History</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error ? (
            <div className="text-center text-red-400 py-8">
              <p className="text-lg font-semibold mb-2">Error loading backtest results</p>
              <p className="text-sm">{error}</p>
              <button 
                onClick={loadBacktestResults}
                className="mt-4 bg-[#85e1fe] text-black px-4 py-2 rounded-md hover:bg-[#6bcae2]"
              >
                Retry
              </button>
            </div>
          ) : backtestResults.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-lg font-semibold mb-2">No backtest results found</p>
              <p className="text-sm">Run some backtests to see your results here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {backtestResults.map((result) => (
                <div key={result.id} className="bg-[#141721] rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          Backtest #{result.id}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(result.status)}`}>
                          {result.status}
                        </span>
                        <span className="text-sm text-gray-400 flex items-center gap-1">
                          {getDataSourceIcon(result.data_source)} {result.data_source}
                        </span>
                        {result.symbol && (
                          <span className="text-sm text-[#85e1fe] bg-[#85e1fe]/10 px-2 py-1 rounded">
                            {result.symbol}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Date</p>
                          <p className="text-white font-semibold">{formatDate(result.backtest_date)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Execution Time</p>
                          <p className="text-white font-semibold">{formatExecutionTime(result.execution_time_seconds)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Final Equity</p>
                          <p className="text-white font-semibold">
                            ${result.final_equity?.toFixed(2) || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Return</p>
                          <p className={`font-semibold ${(result.return_percent || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {result.return_percent?.toFixed(2) || "N/A"}%
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(result.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Delete backtest result"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {result.status === "completed" && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">Annual Return</p>
                        <p className={`font-semibold ${(result.return_ann_percent || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {result.return_ann_percent?.toFixed(2) || "N/A"}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">Win Rate</p>
                        <p className="text-white font-semibold">
                          {result.win_rate_percent?.toFixed(2) || "N/A"}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">Max Drawdown</p>
                        <p className="text-red-500 font-semibold">
                          {result.max_drawdown_percent?.toFixed(2) || "N/A"}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">Total Trades</p>
                        <p className="text-white font-semibold">
                          {result.num_trades || "N/A"}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        router.push(`/backtest-results?id=${result.id}`)
                        onClose()
                      }}
                      className="bg-[#85e1fe] text-black px-4 py-2 rounded-md hover:bg-[#6bcae2] text-sm font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
