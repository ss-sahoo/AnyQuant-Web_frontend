"use client"

import { useState } from "react"

export function OptimisationTab() {
  const [optimizedParameter, setOptimizedParameter] = useState("Balance")
  const [geneticAlgorithm, setGeneticAlgorithm] = useState(false)
  const [durationLimit, setDurationLimit] = useState(false)
  const [durationValue, setDurationValue] = useState("5h 30m")
  const [balanceMinimum, setBalanceMinimum] = useState(true)
  const [balanceValue, setBalanceValue] = useState("200")
  const [profitMaximum, setProfitMaximum] = useState(true)
  const [profitValue, setProfitValue] = useState("10000")
  const [marginLevel, setMarginLevel] = useState(true)
  const [marginValue, setMarginValue] = useState("30")
  const [maxDrawdown, setMaxDrawdown] = useState(true)
  const [drawdownValue, setDrawdownValue] = useState("70")
  const [consecutiveLoss, setConsecutiveLoss] = useState(true)
  const [lossValue, setLossValue] = useState("500")
  const [consecutiveLossTrades, setConsecutiveLossTrades] = useState(true)
  const [lossTradesValue, setLossTradesValue] = useState("10")
  const [consecutiveWin, setConsecutiveWin] = useState(true)
  const [winValue, setWinValue] = useState("1000")
  const [consecutiveWinTrades, setConsecutiveWinTrades] = useState(true)
  const [winTradesValue, setWinTradesValue] = useState("30")

  return (
    <div>
      {/* Defaults Section */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">Defaults</h2>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Optimized parameter</label>
          <div className="relative">
            <select
              value={optimizedParameter}
              onChange={(e) => setOptimizedParameter(e.target.value)}
              className="w-full bg-[#1E2132] border border-gray-800 rounded-md p-3 pr-10 appearance-none focus:outline-none focus:ring-1 focus:ring-[#85e1fe]"
            >
              <option value="Balance">Balance</option>
              <option value="Profit">Profit</option>
              <option value="Drawdown">Drawdown</option>
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

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="genetic-algorithm"
              checked={geneticAlgorithm}
              onChange={() => setGeneticAlgorithm(!geneticAlgorithm)}
              className="w-4 h-4 bg-[#1E2132] border border-gray-800 rounded focus:ring-[#85e1fe]"
            />
            <label htmlFor="genetic-algorithm" className="ml-2">
              Genetic algorithm
            </label>
          </div>
          <button className="bg-[#1E2132] text-white px-4 py-1 rounded-full text-sm">Advanced Settings</button>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="duration-limit"
              checked={durationLimit}
              onChange={() => setDurationLimit(!durationLimit)}
              className="w-4 h-4 bg-[#1E2132] border border-gray-800 rounded focus:ring-[#85e1fe]"
            />
            <label htmlFor="duration-limit" className="ml-2">
              Duration Limit
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="text"
              value={durationValue}
              onChange={(e) => setDurationValue(e.target.value)}
              className="w-24 bg-[#1E2132] border border-gray-800 rounded-md p-1 text-right focus:outline-none focus:ring-1 focus:ring-[#85e1fe]"
            />
            <button className="ml-2 bg-[#1E2132] p-1 rounded-md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="6" width="18" height="15" rx="2" stroke="white" strokeWidth="2" />
                <path d="M3 10H21" stroke="white" strokeWidth="2" />
                <path d="M8 3V7" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <path d="M16 3V7" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Limitations Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Limitations</h2>
          <h2 className="text-lg font-medium">Value</h2>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-gray-800 pb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="balance-minimum"
                checked={balanceMinimum}
                onChange={() => setBalanceMinimum(!balanceMinimum)}
                className="w-4 h-4 bg-[#1E2132] border border-gray-800 rounded focus:ring-[#85e1fe]"
              />
              <label htmlFor="balance-minimum" className="ml-2">
                Balance minimum
              </label>
            </div>
            <input
              type="text"
              value={balanceValue}
              onChange={(e) => setBalanceValue(e.target.value)}
              className="w-24 bg-transparent border-none text-right focus:outline-none"
            />
          </div>

          <div className="flex justify-between items-center border-b border-gray-800 pb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="profit-maximum"
                checked={profitMaximum}
                onChange={() => setProfitMaximum(!profitMaximum)}
                className="w-4 h-4 bg-[#1E2132] border border-gray-800 rounded focus:ring-[#85e1fe]"
              />
              <label htmlFor="profit-maximum" className="ml-2">
                Profit maximum
              </label>
            </div>
            <input
              type="text"
              value={profitValue}
              onChange={(e) => setProfitValue(e.target.value)}
              className="w-24 bg-transparent border-none text-right focus:outline-none"
            />
          </div>

          <div className="flex justify-between items-center border-b border-gray-800 pb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="margin-level"
                checked={marginLevel}
                onChange={() => setMarginLevel(!marginLevel)}
                className="w-4 h-4 bg-[#1E2132] border border-gray-800 rounded focus:ring-[#85e1fe]"
              />
              <label htmlFor="margin-level" className="ml-2">
                Minimal margin level %
              </label>
            </div>
            <input
              type="text"
              value={marginValue}
              onChange={(e) => setMarginValue(e.target.value)}
              className="w-24 bg-transparent border-none text-right focus:outline-none"
            />
          </div>

          <div className="flex justify-between items-center border-b border-gray-800 pb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="max-drawdown"
                checked={maxDrawdown}
                onChange={() => setMaxDrawdown(!maxDrawdown)}
                className="w-4 h-4 bg-[#1E2132] border border-gray-800 rounded focus:ring-[#85e1fe]"
              />
              <label htmlFor="max-drawdown" className="ml-2">
                Maximal drawdown
              </label>
            </div>
            <input
              type="text"
              value={drawdownValue}
              onChange={(e) => setDrawdownValue(e.target.value)}
              className="w-24 bg-transparent border-none text-right focus:outline-none"
            />
          </div>

          {/* More limitation items */}
          <div className="flex justify-between items-center border-b border-gray-800 pb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="consecutive-loss"
                checked={consecutiveLoss}
                onChange={() => setConsecutiveLoss(!consecutiveLoss)}
                className="w-4 h-4 bg-[#1E2132] border border-gray-800 rounded focus:ring-[#85e1fe]"
              />
              <label htmlFor="consecutive-loss" className="ml-2">
                Consecutive loss
              </label>
            </div>
            <input
              type="text"
              value={lossValue}
              onChange={(e) => setLossValue(e.target.value)}
              className="w-24 bg-transparent border-none text-right focus:outline-none"
            />
          </div>

          <div className="flex justify-between items-center border-b border-gray-800 pb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="consecutive-loss-trades"
                checked={consecutiveLossTrades}
                onChange={() => setConsecutiveLossTrades(!consecutiveLossTrades)}
                className="w-4 h-4 bg-[#1E2132] border border-gray-800 rounded focus:ring-[#85e1fe]"
              />
              <label htmlFor="consecutive-loss-trades" className="ml-2">
                Consecutive loss trades
              </label>
            </div>
            <input
              type="text"
              value={lossTradesValue}
              onChange={(e) => setLossTradesValue(e.target.value)}
              className="w-24 bg-transparent border-none text-right focus:outline-none"
            />
          </div>

          <div className="flex justify-between items-center border-b border-gray-800 pb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="consecutive-win"
                checked={consecutiveWin}
                onChange={() => setConsecutiveWin(!consecutiveWin)}
                className="w-4 h-4 bg-[#1E2132] border border-gray-800 rounded focus:ring-[#85e1fe]"
              />
              <label htmlFor="consecutive-win" className="ml-2">
                Consecutive win
              </label>
            </div>
            <input
              type="text"
              value={winValue}
              onChange={(e) => setWinValue(e.target.value)}
              className="w-24 bg-transparent border-none text-right focus:outline-none"
            />
          </div>

          <div className="flex justify-between items-center border-b border-gray-800 pb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="consecutive-win-trades"
                checked={consecutiveWinTrades}
                onChange={() => setConsecutiveWinTrades(!consecutiveWinTrades)}
                className="w-4 h-4 bg-[#1E2132] border border-gray-800 rounded focus:ring-[#85e1fe]"
              />
              <label htmlFor="consecutive-win-trades" className="ml-2">
                Consecutive win trades
              </label>
            </div>
            <input
              type="text"
              value={winTradesValue}
              onChange={(e) => setWinTradesValue(e.target.value)}
              className="w-24 bg-transparent border-none text-right focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <button className="text-gray-400 hover:text-white">Collapse</button>
          <div className="flex gap-3">
            <button className="px-6 py-2 bg-[#1E2132] rounded-full text-white hover:bg-gray-700">Reset</button>
            <button className="px-6 py-2 bg-[#85e1fe] rounded-full text-black hover:bg-[#6bcae2]">Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}
