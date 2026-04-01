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
  onClose?: () => void
  onSelect?: (id: string) => void
  isInline?: boolean
}

export function BacktestHistoryList({ strategyId, onClose, onSelect, isInline }: BacktestHistoryListProps) {
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500/20 text-green-400'
      case 'failed':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const listContent = (
    <div className={`${isInline ? 'w-full' : 'bg-[#1A1D2D] rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-hidden'}`}>
      {!isInline && (
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Backtest History</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      <div className={`${isInline ? '' : 'p-6 overflow-y-auto max-h-[75vh]'}`}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-[#85e1fe] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8 text-[10px] font-black uppercase tracking-widest">
            {error}
          </div>
        ) : backtestResults.length === 0 ? (
          <div className="text-center py-20 bg-[#141721] rounded-lg">
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em]">No previous backtest results</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-[10px] border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-[#141721] text-gray-400 font-black uppercase tracking-widest text-[9px]">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Symbol</th>
                  <th className="px-4 py-2 text-right">Return</th>
                  <th className="px-4 py-2 text-right">Drawdown</th>
                  <th className="px-4 py-2 text-right">Trades</th>
                  <th className="px-4 py-2 text-center">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {backtestResults.map((result) => (
                  <tr
                    key={result.id}
                    className="bg-[#080A10] text-[#85e1fe] cursor-pointer hover:bg-[#121420] border-t border-gray-900 transition-all font-medium"
                    onClick={() => onSelect ? onSelect(result.id.toString()) : router.push(`/backtest-results?id=${result.id}`)}
                  >
                    <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                      {formatDate(result.backtest_date)}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {result.symbol}
                    </td>
                    <td className={`px-4 py-3 text-right font-black ${(result.return_percent ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {result.return_percent != null ? result.return_percent.toFixed(2) : '0.00'}%
                    </td>
                    <td className="px-4 py-3 text-right text-red-400 font-mono">
                      {result.max_drawdown_percent != null ? result.max_drawdown_percent.toFixed(2) : '0.00'}%
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300 font-mono">
                      {result.num_trades}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${getStatusColor(result.status)} border border-current opacity-80`}>
                        {result.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelect ? onSelect(result.id.toString()) : router.push(`/backtest-results?id=${result.id}`)
                        }}
                        className="text-[#85e1fe] hover:text-[#fff] font-black uppercase text-[9px] tracking-widest"
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(result.id)
                        }}
                        className="text-red-500 hover:text-red-400 font-black uppercase text-[9px] tracking-widest"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )

  if (isInline) {
    return listContent
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      {listContent}
    </div>
  )
}
