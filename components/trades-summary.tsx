"use client"

import React, { useState, useEffect } from 'react'
import { Download, BarChart3, TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react'
import { 
  parseTradesCSV, 
  calculateTradesSummary, 
  formatCurrency, 
  formatPercent, 
  downloadCSV,
  validateTradesCSV,
  type Trade,
  type TradesSummary as TradesSummaryType
} from '@/lib/csv-utils'

interface TradesSummaryProps {
  tradesCsv: string
  tradesCsvFilename: string
  tradesCsvDownloadUrl: string
  stdout?: string
  stderr?: string
  onClose?: () => void
}

export function TradesSummary({ 
  tradesCsv, 
  tradesCsvFilename, 
  tradesCsvDownloadUrl, 
  stdout, 
  stderr, 
  onClose 
}: TradesSummaryProps) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [summary, setSummary] = useState<TradesSummaryType>({
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    totalPnL: 0,
    winRate: 0,
    avgWin: 0,
    avgLoss: 0,
    maxWin: 0,
    maxLoss: 0,
    totalReturn: 0
  })

  // Parse CSV data
  useEffect(() => {
    if (tradesCsv) {
      // Validate CSV data first
      const validation = validateTradesCSV(tradesCsv)
      if (!validation.isValid) {
        console.error('Invalid CSV data:', validation.error)
        return
      }

      const parsedTrades = parseTradesCSV(tradesCsv)
      setTrades(parsedTrades)
      const calculatedSummary = calculateTradesSummary(parsedTrades)
      setSummary(calculatedSummary)
    }
  }, [tradesCsv])

  const handleDownload = () => {
    if (tradesCsvDownloadUrl) {
      window.open(tradesCsvDownloadUrl, '_blank')
    } else {
      // Fallback: create download from CSV data
      downloadCSV(tradesCsv, tradesCsvFilename || 'trades.csv')
    }
  }

  return (
    <div className="bg-[#1A1D2D] rounded-lg p-6 border border-[#2b2e38]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-[#85e1fe]" />
          <h3 className="text-xl font-semibold text-white">Trades Summary</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-[#85e1fe] text-black rounded-md hover:bg-[#6bcae2] transition-colors"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#2b2e38] text-white rounded-md hover:bg-[#3a3e4a] transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#141721] p-4 rounded-lg border border-[#2b2e38]">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-[#85e1fe]" />
            <span className="text-gray-400 text-sm">Total Trades</span>
          </div>
          <div className="text-2xl font-bold text-white">{summary.totalTrades}</div>
        </div>

        <div className="bg-[#141721] p-4 rounded-lg border border-[#2b2e38]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-gray-400 text-sm">Win Rate</span>
          </div>
          <div className="text-2xl font-bold text-green-500">{formatPercent(summary.winRate)}</div>
        </div>

        <div className="bg-[#141721] p-4 rounded-lg border border-[#2b2e38]">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-[#85e1fe]" />
            <span className="text-gray-400 text-sm">Total P&L</span>
          </div>
          <div className={`text-2xl font-bold ${summary.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(summary.totalPnL)}
          </div>
        </div>

        <div className="bg-[#141721] p-4 rounded-lg border border-[#2b2e38]">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-4 h-4 text-[#85e1fe]" />
            <span className="text-gray-400 text-sm">Total Return</span>
          </div>
          <div className={`text-2xl font-bold ${summary.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatPercent(summary.totalReturn)}
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#141721] p-4 rounded-lg border border-[#2b2e38]">
          <div className="text-gray-400 text-sm mb-1">Winning Trades</div>
          <div className="text-lg font-semibold text-green-500">{summary.winningTrades}</div>
          <div className="text-xs text-gray-500">Avg: {formatCurrency(summary.avgWin)}</div>
        </div>

        <div className="bg-[#141721] p-4 rounded-lg border border-[#2b2e38]">
          <div className="text-gray-400 text-sm mb-1">Losing Trades</div>
          <div className="text-lg font-semibold text-red-500">{summary.losingTrades}</div>
          <div className="text-xs text-gray-500">Avg: {formatCurrency(summary.avgLoss)}</div>
        </div>

        <div className="bg-[#141721] p-4 rounded-lg border border-[#2b2e38]">
          <div className="text-gray-400 text-sm mb-1">Max Win/Loss</div>
          <div className="text-sm">
            <div className="text-green-500">+{formatCurrency(summary.maxWin)}</div>
            <div className="text-red-500">{formatCurrency(summary.maxLoss)}</div>
          </div>
        </div>
      </div>

      {/* Console Output */}
      {(stdout || stderr) && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-white mb-3">Console Output</h4>
          <div className="bg-[#141721] rounded-lg p-4 border border-[#2b2e38]">
            {stdout && (
              <div className="mb-3">
                <div className="text-green-500 text-sm font-semibold mb-1">STDOUT:</div>
                <pre className="text-sm text-gray-300 whitespace-pre-wrap bg-[#0a0b0f] p-3 rounded border border-[#2b2e38] overflow-x-auto">
                  {stdout}
                </pre>
              </div>
            )}
            {stderr && (
              <div>
                <div className="text-red-500 text-sm font-semibold mb-1">STDERR:</div>
                <pre className="text-sm text-gray-300 whitespace-pre-wrap bg-[#0a0b0f] p-3 rounded border border-[#2b2e38] overflow-x-auto">
                  {stderr}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Trades Table */}
      {trades.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">Recent Trades</h4>
          <div className="bg-[#141721] rounded-lg border border-[#2b2e38] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#0a0b0f]">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-400">#</th>
                    <th className="px-4 py-3 text-left text-gray-400">Entry Time</th>
                    <th className="px-4 py-3 text-left text-gray-400">Exit Time</th>
                    <th className="px-4 py-3 text-left text-gray-400">Entry Price</th>
                    <th className="px-4 py-3 text-left text-gray-400">Exit Price</th>
                    <th className="px-4 py-3 text-left text-gray-400">P&L</th>
                    <th className="px-4 py-3 text-left text-gray-400">Return %</th>
                    <th className="px-4 py-3 text-left text-gray-400">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.slice(0, 10).map((trade, index) => (
                    <tr key={index} className="border-t border-[#2b2e38] hover:bg-[#23263a]">
                      <td className="px-4 py-3 text-white">{index + 1}</td>
                      <td className="px-4 py-3 text-gray-300">{trade.EntryTime}</td>
                      <td className="px-4 py-3 text-gray-300">{trade.ExitTime}</td>
                      <td className="px-4 py-3 text-gray-300">{trade.EntryPrice}</td>
                      <td className="px-4 py-3 text-gray-300">{trade.ExitPrice}</td>
                      <td className={`px-4 py-3 font-semibold ${trade.PnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatCurrency(trade.PnL)}
                      </td>
                      <td className={`px-4 py-3 ${trade.ReturnPct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatPercent(trade.ReturnPct)}
                      </td>
                      <td className="px-4 py-3 text-gray-300">{trade.Duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {trades.length > 10 && (
              <div className="px-4 py-3 text-center text-gray-400 text-sm border-t border-[#2b2e38]">
                Showing first 10 of {trades.length} trades
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 