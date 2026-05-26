"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react'
import { getStrategyBacktestResults, deleteBacktestResult } from '../app/AllApiCalls'
import { DraggableModal } from './modals/draggable-modal'

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
  const [expanded, setExpanded] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  useEffect(() => {
    if (!expanded) setPage(1)
  }, [expanded])

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
      // The backend creates a "running" placeholder row when a job starts and
      // a separate completed/failed row when it finishes. The running one is
      // an empty duplicate from the user's POV, so delete it on the backend
      // and never show it.
      const rows: BacktestResult[] = response.results || []
      const running = rows.filter(r => (r.status || '').toLowerCase() === 'running')
      if (running.length > 0) {
        await Promise.allSettled(
          running.map(r => deleteBacktestResult(r.id.toString()))
        )
      }
      setBacktestResults(rows.filter(r => (r.status || '').toLowerCase() !== 'running'))
    } catch (err: any) {
      setError(err.message || 'Failed to load backtest results')
      console.error('Error loading backtest results:', err)
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (pendingDeleteId == null) return
    setIsDeleting(true)
    try {
      await deleteBacktestResult(pendingDeleteId.toString())
      setPendingDeleteId(null)
      await loadBacktestResults()
    } catch (err: any) {
      console.error('Error deleting backtest result:', err)
      setPendingDeleteId(null)
      setDeleteError(err?.message || 'Unknown error')
    } finally {
      setIsDeleting(false)
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
                {(() => {
                  if (!expanded) return backtestResults.slice(0, 2)
                  const totalPages = Math.max(1, Math.ceil(backtestResults.length / PAGE_SIZE))
                  const currentPage = Math.min(page, totalPages)
                  const start = (currentPage - 1) * PAGE_SIZE
                  return backtestResults.slice(start, start + PAGE_SIZE)
                })().map((result) => (
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
                          setPendingDeleteId(result.id)
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
            {backtestResults.length > 2 && (
              <div className="flex flex-col items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141721] hover:bg-[#1f2335] border border-gray-700 text-gray-300 text-[9px] font-black uppercase tracking-widest transition-colors"
                  aria-expanded={expanded}
                  aria-label={expanded ? 'Show fewer backtests' : `Show all ${backtestResults.length} backtests`}
                >
                  {expanded ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {expanded ? `Show less` : `Show all (${backtestResults.length})`}
                </button>
                {expanded && backtestResults.length > PAGE_SIZE && (() => {
                  const totalPages = Math.max(1, Math.ceil(backtestResults.length / PAGE_SIZE))
                  const currentPage = Math.min(page, totalPages)
                  const start = (currentPage - 1) * PAGE_SIZE
                  const end = Math.min(start + PAGE_SIZE, backtestResults.length)
                  return (
                    <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest">
                      <span className="text-gray-500">
                        {start + 1}–{end} of {backtestResults.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#141721] hover:bg-[#1f2335] border border-gray-700 text-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="w-3 h-3" />
                        Prev
                      </button>
                      <span className="text-gray-400">
                        Page {currentPage} / {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#141721] hover:bg-[#1f2335] border border-gray-700 text-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Next page"
                      >
                        Next
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  const dialogs = (
    <>
      {pendingDeleteId != null && (
        <DraggableModal
          onClose={() => !isDeleting && setPendingDeleteId(null)}
          closeOnBackdrop={!isDeleting}
          className="bg-[#1A1D2D] rounded-lg shadow-lg w-full max-w-md border border-gray-700"
        >
          <div className="p-6">
            <h3 className="text-lg font-bold text-white mb-2">Delete backtest?</h3>
            <p className="text-sm text-gray-400 mb-6">
              This will permanently delete this backtest result. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-full border border-gray-600 text-gray-200 hover:bg-gray-800 text-xs font-black uppercase tracking-widest disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50"
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </DraggableModal>
      )}
      {deleteError && (
        <DraggableModal
          onClose={() => setDeleteError(null)}
          className="bg-[#1A1D2D] rounded-lg shadow-lg w-full max-w-md border border-red-500/50"
        >
          <div className="p-6">
            <h3 className="text-lg font-bold text-red-400 mb-2">Failed to delete backtest</h3>
            <p className="text-sm text-gray-300 mb-6 break-words">{deleteError}</p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setDeleteError(null)}
                className="px-4 py-2 rounded-full bg-[#85e1fe] text-black text-xs font-black uppercase tracking-widest hover:bg-[#6bc8e3]"
              >
                Close
              </button>
            </div>
          </div>
        </DraggableModal>
      )}
    </>
  )

  if (isInline) {
    return (
      <>
        {listContent}
        {dialogs}
      </>
    )
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        {listContent}
      </div>
      {dialogs}
    </>
  )
}
