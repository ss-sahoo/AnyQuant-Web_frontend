"use client"

import type React from "react"

interface BacktestTabProps {
  dateRange: string
  setDateRange: React.Dispatch<React.SetStateAction<string>>
  selectedInstruments: string[]
  toggleInstrument: (instrument: string) => void
  instruments: string[]
  accountDeposit: string
  handleAccountDepositChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  currency: string
  setCurrency: React.Dispatch<React.SetStateAction<string>>
  leverage: string
  leverageSliderValue: number
  handleSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  getThumbPosition: () => number
  selectedTradingMode: string
  setSelectedTradingMode: React.Dispatch<React.SetStateAction<string>>
  maxTrades: string
  setMaxTrades: React.Dispatch<React.SetStateAction<string>>
  saveBacktestSettings: () => Promise<void>
  isSaving: boolean
  lot: string
  setLot: React.Dispatch<React.SetStateAction<string>>
  commission: string
  setCommission: React.Dispatch<React.SetStateAction<string>>
  margin: string
  setMargin: React.Dispatch<React.SetStateAction<string>>
  initialCash: string
  setInitialCash: React.Dispatch<React.SetStateAction<string>>
  assetType: string
  setAssetType: React.Dispatch<React.SetStateAction<string>>
  showTradesSummary?: boolean
  onShowTradesSummary?: () => void
}

export function BacktestTab({
  dateRange,
  setDateRange,
  selectedInstruments,
  toggleInstrument,
  instruments,
  accountDeposit,
  handleAccountDepositChange,
  currency,
  setCurrency,
  leverage,
  leverageSliderValue,
  handleSliderChange,
  getThumbPosition,
  selectedTradingMode,
  setSelectedTradingMode,
  maxTrades,
  setMaxTrades,
  saveBacktestSettings,
  isSaving,
  lot,
  setLot,
  commission,
  setCommission,
  margin,
  setMargin,
  initialCash,
  setInitialCash,
  assetType,
  setAssetType,
  showTradesSummary = false,
  onShowTradesSummary,
}: BacktestTabProps) {
  return (
    <div className="p-6 ml-[63px]">
      <div className="flex justify-between items-start mb-6">
        {/* Left side - Dates */}
        <div className="w-[30%]">
          <label className="block text-sm text-gray-400 mb-2">Dates</label>
          <div className="flex items-center">
            <input
              type="text"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="flex-1 bg-[#141721] border border-[#2b2e38] rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-white"
            />
            <button className="ml-2 bg-[#141721] p-3 rounded-md border border-[#2b2e38]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="6" width="18" height="15" rx="2" stroke="white" strokeWidth="2" />
                <path d="M3 10H21" stroke="white" strokeWidth="2" />
                <path d="M8 3V7" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <path d="M16 3V7" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right side - Instruments */}
        <div className="w-[65%]">
          <label className="block text-sm text-gray-400 mb-2">Instruments</label>
          <div className="flex flex-wrap gap-2">
            {instruments.map((instrument) => (
              <button
                key={instrument}
                onClick={() => toggleInstrument(instrument)}
                className={`px-4 py-2 rounded-md ${
                  selectedInstruments.includes(instrument)
                    ? "bg-[#85e1fe] text-black"
                    : "bg-[#141721] text-white border border-[#2b2e38]"
                }`}
              >
                {instrument}
              </button>
            ))}
            <button className="px-4 py-2 rounded-md bg-[#141721] text-white border border-[#2b2e38]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-[#2b2e38] my-6"></div>

      <div className="flex justify-between items-start mb-6">
        {/* Account Deposit */}
        <div className="w-[30%]">
          <label className="block text-sm text-gray-400 mb-2">Account Deposit</label>
          <input
            type="text"
            value={accountDeposit}
            onChange={handleAccountDepositChange}
            className="w-full bg-[#141721] border border-[#2b2e38] rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-white"
          />
        </div>

        {/* Currency */}
        <div className="w-[30%]">
          <label className="block text-sm text-gray-400 mb-2">Currency</label>
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-[#141721] border border-[#2b2e38] rounded-md p-3 pr-10 appearance-none focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-white"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Leverage/Margin Assumptions */}
        <div className="w-[35%]">
          <label className="block text-sm text-gray-400 mb-2">Leverage/Margin Assumptions</label>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white">1:1</span>
            <span className="text-xs text-white">1:2</span>
            <span className="text-xs text-white">1:5</span>
            <span className="text-xs text-white">1:10</span>
            <span className="text-xs text-white">1:20</span>
            <span className="text-xs text-white">1:25</span>
            <span className="text-xs text-white">1:30</span>
            <span className="text-xs text-white">1:50</span>
            <span className="text-xs text-white">1:75</span>
            <span className="text-xs text-white">1:100</span>
          </div>
          <div className="relative w-full h-1 bg-[#2b2e38] rounded-full">
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={leverageSliderValue}
              onChange={handleSliderChange}
              className="absolute w-full h-1 opacity-0 cursor-pointer"
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#85e1fe] rounded-full transition-all duration-200 ease-out"
              style={{ left: `calc(${getThumbPosition()}% - 6px)` }}
            ></div>
          </div>
          <div className="mt-2 text-center">
            <span className="text-sm text-[#85e1fe] font-medium">{leverage}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-[#2b2e38] my-6"></div>

      {/* Trading Mode Section */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-4">Trading Mode</label>
        <div className="flex flex-wrap gap-3 mb-4">
          {[
            { value: "OOTAAT", label: "OOTAAT" },
            { value: "CLOSE & OPEN", label: "CLOSE & OPEN" },
            { value: "MTOOTAAT", label: "MTOOTAAT" },
          ].map((mode) => (
            <button
              key={mode.value}
              onClick={() => setSelectedTradingMode(mode.value)}
              className={`px-4 py-2 rounded-md transition-colors ${
                selectedTradingMode === mode.value
                  ? "bg-[#85e1fe] text-black"
                  : "bg-[#141721] text-white border border-[#2b2e38] hover:border-[#85e1fe]"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Max Trades Input for MTOOTAAT */}
        {selectedTradingMode === "MTOOTAAT" && (
          <div className="w-[30%]">
            <label className="block text-sm text-gray-400 mb-2">Max parallel trades</label>
            <input
              type="number"
              value={maxTrades}
              onChange={(e) => setMaxTrades(e.target.value)}
              placeholder="e.g., 2"
              min="1"
              className="w-full bg-[#141721] border border-[#2b2e38] rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-white"
            />
          </div>
        )}

        {/* Trading Mode Descriptions */}
        <div className="mt-4 p-3 bg-[#141721] rounded-md border border-[#2b2e38]">
          <div className="text-xs text-gray-400">
            {selectedTradingMode === "OOTAAT" && (
              <p>
                <strong>OOTAAT:</strong> One Order Type At A Time mode - Only one position can be open at any given
                time.
              </p>
            )}
            {selectedTradingMode === "CLOSE & OPEN" && (
              <p>
                <strong>CLOSE & OPEN:</strong> Allows closing existing and opening new positions simultaneously.
              </p>
            )}
            {selectedTradingMode === "MTOOTAAT" && (
              <p>
                <strong>MTOOTAAT:</strong> Multiple 'One Order Type At A Time' mode - System enforces the maximum number
                of parallel trades based on your input or margin requirements.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* TradingType Configuration Section */}
      <div className="border-t border-[#2b2e38] my-6"></div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium text-white mb-4">Trading Configuration</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {/* Commission */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Commission</label>
            <input
              type="number"
              step="0.0001"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              className="w-full bg-[#141721] border border-[#2b2e38] rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-white"
            />
          </div>

          {/* Margin */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Margin</label>
            <input
              type="number"
              step="0.1"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              className="w-full bg-[#141721] border border-[#2b2e38] rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-white"
            />
          </div>

          {/* Lot Size */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Lot Size</label>
            <div className="relative">
              <select
                value={lot}
                onChange={(e) => setLot(e.target.value)}
                className="w-full bg-[#141721] border border-[#2b2e38] rounded-md p-3 pr-10 appearance-none focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-white"
              >
                <option value="mini">Mini (0.01)</option>
                <option value="micro">Micro (0.001)</option>
                <option value="standard">Standard (1.0)</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Initial Cash */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Initial Cash</label>
            <input
              type="number"
              step="1000"
              value={initialCash}
              onChange={(e) => setInitialCash(e.target.value)}
              className="w-full bg-[#141721] border border-[#2b2e38] rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-white"
            />
          </div>

          {/* Max Trades (if not MTOOTAAT) */}
          {selectedTradingMode !== "MTOOTAAT" && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Max Trades</label>
              <input
                type="number"
                value={maxTrades}
                onChange={(e) => setMaxTrades(e.target.value)}
                min="1"
                className="w-full bg-[#141721] border border-[#2b2e38] rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-white"
              />
            </div>
          )}

          {/* Asset Type */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Asset Type</label>
            <div className="relative">
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                className="w-full bg-[#141721] border border-[#2b2e38] rounded-md p-3 pr-10 appearance-none focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-white"
              >
                <option value="gold">Gold</option>
                <option value="forex">Forex</option>
                <option value="crypto">Crypto</option>
                <option value="stocks">Stocks</option>
                <option value="indices">Indices</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full mt-6 flex justify-between items-center">
        {/* View Trades Summary Button */}
        {showTradesSummary && onShowTradesSummary && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm">Trades data available</span>
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-[#2b2e38] text-white rounded-md hover:bg-[#3a3e4a] transition-colors"
              onClick={onShowTradesSummary}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3 3v18h18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              View Trades Summary
            </button>
          </div>
        )}

        {/* Save Button */}
        <button
          className="bg-[#85e1fe] hover:bg-[#6bcae2] text-black rounded-full px-8 py-3 text-sm font-medium flex items-center"
          onClick={saveBacktestSettings}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16L21 8V19C21 20.1046 20.1046 21 19 21Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M17 21V13H7V21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 3V8H15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  )
} 