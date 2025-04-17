"use client"

import { useState } from "react"

export function BacktestTab() {
  const [dateRange, setDateRange] = useState("2024.01.02 - 2025.01.02")
  const [selectedInstruments, setSelectedInstruments] = useState(["USD/JPY"])
  const [accountDeposit, setAccountDeposit] = useState("1,000")
  const [currency, setCurrency] = useState("USD")
  const [leverage, setLeverage] = useState("1:1")

  const instruments = ["USD/JPY", "GBP/USD", "USD/CHF", "FTSE100", "US30", "NASDAQ"]

  const toggleInstrument = (instrument: string) => {
    if (selectedInstruments.includes(instrument)) {
      setSelectedInstruments(selectedInstruments.filter((i) => i !== instrument))
    } else {
      setSelectedInstruments([...selectedInstruments, instrument])
    }
  }

  return (
    <div>
      {/* Date Range */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Dates</label>
        <div className="flex items-center">
          <input
            type="text"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="flex-1 bg-[#1E2132] border border-gray-800 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#85e1fe]"
          />
          <button className="ml-2 bg-[#1E2132] p-3 rounded-md">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="6" width="18" height="15" rx="2" stroke="white" strokeWidth="2" />
              <path d="M3 10H21" stroke="white" strokeWidth="2" />
              <path d="M8 3V7" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M16 3V7" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Instruments */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Instruments</label>
        <div className="flex flex-wrap gap-2">
          {instruments.map((instrument) => (
            <button
              key={instrument}
              onClick={() => toggleInstrument(instrument)}
              className={`px-4 py-2 rounded-md ${
                selectedInstruments.includes(instrument) ? "bg-[#85e1fe] text-black" : "bg-[#1E2132] text-white"
              }`}
            >
              {instrument}
            </button>
          ))}
          <button className="px-4 py-2 rounded-md bg-[#1E2132] text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Account Deposit */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Account Deposit</label>
        <input
          type="text"
          value={accountDeposit}
          onChange={(e) => setAccountDeposit(e.target.value)}
          className="w-full bg-[#1E2132] border border-gray-800 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#85e1fe]"
        />
      </div>

      {/* Currency */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Currency</label>
        <div className="relative">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full bg-[#1E2132] border border-gray-800 rounded-md p-3 pr-10 appearance-none focus:outline-none focus:ring-1 focus:ring-[#85e1fe]"
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
      <div>
        <label className="block text-sm text-gray-400 mb-2">Leverage/Margin Assumptions</label>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs">1:1</span>
          <span className="text-xs">1:2</span>
          <span className="text-xs">1:5</span>
          <span className="text-xs">1:10</span>
          <span className="text-xs">1:20</span>
          <span className="text-xs">1:25</span>
          <span className="text-xs">1:30</span>
          <span className="text-xs">1:50</span>
          <span className="text-xs">1:75</span>
          <span className="text-xs">1:100</span>
        </div>
        <div className="relative w-full h-1 bg-gray-700 rounded-full">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#85e1fe] rounded-full"></div>
        </div>
      </div>
    </div>
  )
}
