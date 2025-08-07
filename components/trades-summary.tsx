"use client"

import React, { useState, useEffect } from 'react'
import { Download, BarChart3, TrendingUp, TrendingDown, DollarSign, Percent, AlertCircle } from 'lucide-react'
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
  const [csvError, setCsvError] = useState<string | null>(null)

  // Parse CSV data
  useEffect(() => {
    if (tradesCsv) {
      // Validate CSV data first
      const validation = validateTradesCSV(tradesCsv)
      if (!validation.isValid) {
        console.error('Invalid CSV data:', validation.error)
        setCsvError(validation.error || 'Invalid CSV data')
        setTrades([])
        setSummary({
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
        return
      }

      setCsvError(null)
      const parsedTrades = parseTradesCSV(tradesCsv)
      setTrades(parsedTrades)
      const calculatedSummary = calculateTradesSummary(parsedTrades)
      setSummary(calculatedSummary)
    } else {
      setCsvError('No trades data available')
      setTrades([])
      setSummary({
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

      {/* Error Message */}
      {csvError && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-md">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Trades Data Error</span>
          </div>
          <p className="text-red-300 text-sm mt-1">{csvError}</p>
          <p className="text-red-300 text-xs mt-2">
            This might be due to no trades being executed during the backtest period or an issue with the MetaAPI data.
          </p>
        </div>
      )}

      {/* Summary Statistics */}
      {!csvError && summary.totalTrades > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#141721] p-4 rounded-lg border border-[#2b2e38]">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-[#85e1fe]" />
              <span className="text-gray-400 text-sm">Total P&L</span>
            </div>
            <p className={`text-lg font-semibold ${summary.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(summary.totalPnL)}
            </p>
          </div>

          <div className="bg-[#141721] p-4 rounded-lg border border-[#2b2e38]">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-4 h-4 text-[#85e1fe]" />
              <span className="text-gray-400 text-sm">Win Rate</span>
            </div>
            <p className="text-lg font-semibold text-white">
              {formatPercent(summary.winRate)}
            </p>
          </div>

          <div className="bg-[#141721] p-4 rounded-lg border border-[#2b2e38]">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-gray-400 text-sm">Total Trades</span>
            </div>
            <p className="text-lg font-semibold text-white">
              {summary.totalTrades}
            </p>
          </div>

          <div className="bg-[#141721] p-4 rounded-lg border border-[#2b2e38]">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-gray-400 text-sm">Total Return</span>
            </div>
            <p className={`text-lg font-semibold ${summary.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatPercent(summary.totalReturn)}
            </p>
          </div>
        </div>
      )}

      {/* No Trades Message */}
      {!csvError && summary.totalTrades === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h4 className="text-lg font-medium">No Trades Found</h4>
            <p className="text-sm">No trades were executed during the backtest period.</p>
          </div>
        </div>
      )}

      {/* Trades Table */}
      {!csvError && trades.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#141721] text-gray-400">
                <th className="px-3 py-2 text-left">Entry Time</th>
                <th className="px-3 py-2 text-left">Exit Time</th>
                <th className="px-3 py-2 text-right">Size</th>
                <th className="px-3 py-2 text-right">Entry Price</th>
                <th className="px-3 py-2 text-right">Exit Price</th>
                <th className="px-3 py-2 text-right">P&L</th>
                <th className="px-3 py-2 text-right">Return %</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade, index) => (
                <tr key={index} className="border-b border-[#2b2e38] hover:bg-[#141721]">
                  <td className="px-3 py-2 text-gray-300">{trade.EntryTime}</td>
                  <td className="px-3 py-2 text-gray-300">{trade.ExitTime}</td>
                  <td className="px-3 py-2 text-right text-gray-300">{trade.Size}</td>
                  <td className="px-3 py-2 text-right text-gray-300">{trade.EntryPrice}</td>
                  <td className="px-3 py-2 text-right text-gray-300">{trade.ExitPrice}</td>
                  <td className={`px-3 py-2 text-right font-medium ${trade.PnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(trade.PnL)}
                  </td>
                  <td className={`px-3 py-2 text-right font-medium ${trade.ReturnPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPercent(trade.ReturnPct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Console Output */}
      {(stdout || stderr) && (
        <div className="mt-6">
          <h4 className="text-white font-medium mb-3">Console Output</h4>
          {stdout && (
            <div className="mb-3">
              <h5 className="text-green-400 text-sm font-medium mb-1">STDOUT:</h5>
              <pre className="bg-[#141721] p-3 rounded text-xs text-gray-300 overflow-x-auto">
                {stdout}
              </pre>
            </div>
          )}
          {stderr && (
            <div>
              <h5 className="text-red-400 text-sm font-medium mb-1">STDERR:</h5>
              <pre className="bg-[#141721] p-3 rounded text-xs text-red-300 overflow-x-auto">
                {stderr}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 