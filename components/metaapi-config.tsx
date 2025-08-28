"use client"

import React, { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, RefreshCw } from "lucide-react"

export interface MetaAPIConfig {
  token: string
  accountId: string
  symbol: string
}

interface MetaAPIConfigProps {
  onConfigChange: (config: MetaAPIConfig) => void
  initialConfig?: MetaAPIConfig
}

export function MetaAPIConfig({ onConfigChange, initialConfig }: MetaAPIConfigProps) {
  const [config, setConfig] = useState<MetaAPIConfig>({
    token: process.env.NEXT_PUBLIC_METAAPI_ACCESS_TOKEN || "",
    accountId: process.env.NEXT_PUBLIC_METAAPI_ACCOUNT_ID || "",
    symbol: initialConfig?.symbol || "XAUUSD",
  })

  // Update config when initialConfig changes (e.g., when symbol is extracted from strategy)
  useEffect(() => {
    if (initialConfig?.symbol && initialConfig.symbol !== config.symbol) {
      const updatedConfig = { ...config, symbol: initialConfig.symbol }
      setConfig(updatedConfig)
      onConfigChange(updatedConfig)
    }
  }, [initialConfig?.symbol])

  // Default symbols available
  const defaultSymbols = [
    "XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "NZDUSD",
    "USDCAD", "BTCUSD", "ETHUSD", "LTCUSD", "XRPUSD"
  ]

  const updateSymbol = (newSymbol: string) => {
    const updatedConfig = { ...config, symbol: newSymbol }
    setConfig(updatedConfig)
    onConfigChange(updatedConfig)
  }

  // Check if credentials are configured
  const isConfigured = config.token && config.accountId && config.token.length > 100 && config.accountId.length > 20

  return (
    <div className="bg-black border border-gray-700 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">MetaAPI Configuration</h3>
        <div className="flex items-center space-x-2">
          {isConfigured ? (
            <div className="flex items-center text-green-400">
              <CheckCircle className="w-4 h-4 mr-1" />
              <span className="text-sm">Configured</span>
            </div>
          ) : (
            <div className="flex items-center text-red-400">
              <XCircle className="w-4 h-4 mr-1" />
              <span className="text-sm">Not Configured</span>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Status */}
      <div className="bg-gray-900 rounded-md p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Account ID:</span>
            <span className="text-white text-sm font-mono">
              {isConfigured ? `${config.accountId.substring(0, 8)}...` : "Not set"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Access Token:</span>
            <span className="text-white text-sm font-mono">
              {isConfigured ? `${config.token.substring(0, 20)}...` : "Not set"}
            </span>
          </div>
        </div>
      </div>

      {/* Symbol Selection */}
      <div className="space-y-2">
        <label className="text-white font-medium">Trading Symbol</label>
        <Select value={config.symbol} onValueChange={updateSymbol}>
          <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
            <SelectValue placeholder="Select a trading symbol" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-600">
            {defaultSymbols.map((symbol) => (
              <SelectItem 
                key={symbol} 
                value={symbol}
                className="text-white hover:bg-gray-800"
              >
                {symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          {initialConfig?.symbol ? 
            `Symbol extracted from strategy: ${initialConfig.symbol}` : 
            'Select the financial instrument for backtesting'
          }
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-md p-4">
        <h4 className="text-blue-400 font-medium mb-2">Configuration Status</h4>
        <p className="text-blue-300 text-sm">
          {isConfigured 
            ? "MetaAPI credentials are configured from environment variables. Ready for backtesting."
            : "MetaAPI credentials not found in environment variables. Please check your .env.local file."
          }
        </p>
      </div>
    </div>
  )
} 