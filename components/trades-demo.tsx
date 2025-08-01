"use client"

import React, { useState } from 'react'
import { TradesSummary } from './trades-summary'

// Sample trades CSV data for demonstration
const sampleTradesCSV = `Size,EntryTime,ExitTime,EntryPrice,ExitPrice,PnL,ReturnPct,EntryBar,ExitBar,Duration
1,2023-01-01 10:00:00,2023-01-01 11:00:00,1800.50,1805.25,4.75,0.26,100,101,0 days 01:00:00
1,2023-01-01 14:00:00,2023-01-01 15:30:00,1802.00,1798.50,-3.50,-0.19,105,106,0 days 01:30:00
1,2023-01-02 09:00:00,2023-01-02 10:15:00,1795.00,1801.75,6.75,0.38,110,111,0 days 01:15:00
1,2023-01-02 13:00:00,2023-01-02 14:45:00,1803.25,1808.00,4.75,0.26,115,116,0 days 01:45:00
1,2023-01-03 08:00:00,2023-01-03 09:30:00,1806.50,1802.25,-4.25,-0.23,120,121,0 days 01:30:00
1,2023-01-03 12:00:00,2023-01-03 13:15:00,1801.00,1807.50,6.50,0.36,125,126,0 days 01:15:00
1,2023-01-04 10:00:00,2023-01-04 11:45:00,1805.75,1812.00,6.25,0.35,130,131,0 days 01:45:00
1,2023-01-04 15:00:00,2023-01-04 16:30:00,1810.25,1806.50,-3.75,-0.21,135,136,0 days 01:30:00
1,2023-01-05 09:00:00,2023-01-05 10:00:00,1804.00,1810.75,6.75,0.37,140,141,0 days 01:00:00
1,2023-01-05 14:00:00,2023-01-05 15:15:00,1808.50,1815.25,6.75,0.37,145,146,0 days 01:15:00`

export function TradesDemo() {
  const [showDemo, setShowDemo] = useState(false)

  return (
    <div className="p-6">
      <div className="bg-[#1A1D2D] rounded-lg p-6 border border-[#2b2e38]">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Trades CSV Integration Demo</h3>
            <p className="text-gray-400 text-sm">
              This demo shows how the trades CSV integration works with sample data.
            </p>
          </div>
          <button
            onClick={() => setShowDemo(!showDemo)}
            className="px-4 py-2 bg-[#85e1fe] text-black rounded-md hover:bg-[#6bcae2] transition-colors"
          >
            {showDemo ? 'Hide Demo' : 'Show Demo'}
          </button>
        </div>

        {showDemo && (
          <TradesSummary
            tradesCsv={sampleTradesCSV}
            tradesCsvFilename="demo_trades.csv"
            tradesCsvDownloadUrl=""
            stdout="Running backtest...\n✅ Backtest completed successfully\n📊 Generated trades.csv with 10 trades\n💰 Total P&L: $35.75"
            stderr=""
            onClose={() => setShowDemo(false)}
          />
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#141721] p-4 rounded-lg border border-[#2b2e38]">
            <h4 className="text-lg font-semibold text-white mb-3">Features</h4>
            <ul className="text-gray-300 space-y-2">
              <li>• Parse trades CSV data automatically</li>
              <li>• Calculate comprehensive statistics</li>
              <li>• Display trades summary with charts</li>
              <li>• Show console output (stdout/stderr)</li>
              <li>• Download trades CSV file</li>
              <li>• Responsive design for all devices</li>
            </ul>
          </div>

          <div className="bg-[#141721] p-4 rounded-lg border border-[#2b2e38]">
            <h4 className="text-lg font-semibold text-white mb-3">API Response Format</h4>
            <pre className="text-xs text-gray-300 bg-[#0a0b0f] p-3 rounded border border-[#2b2e38] overflow-x-auto">
{`{
  "message": "Backtest completed.",
  "plot_html": "...",
  "stdout": "Running backtest...",
  "stderr": "",
  "trades_csv": "Size,EntryTime,ExitTime...",
  "trades_csv_filename": "strategy_trades.csv",
  "trades_csv_download_url": "/api/download-trades/..."
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
} 