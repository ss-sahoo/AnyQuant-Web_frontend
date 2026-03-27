"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { HelpCircle, X, AlertCircle, CheckCircle, Zap } from "lucide-react"

interface MetaAPIHelpButtonProps {
  onOpenDebugModal?: () => void
}

export function MetaAPIHelpButton({ onOpenDebugModal }: MetaAPIHelpButtonProps) {
  const [showHelp, setShowHelp] = useState(false)

  return (
    <>
      {/* Help Button */}
      <Button
        onClick={() => setShowHelp(true)}
        variant="outline"
        size="sm"
        className="border-blue-500 text-blue-400 hover:bg-blue-900/20"
      >
        <HelpCircle className="w-4 h-4 mr-2" />
        MetaAPI Help
      </Button>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg border border-blue-500/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <HelpCircle className="w-6 h-6 text-blue-400" />
                  <div>
                    <h2 className="text-xl font-bold text-white">MetaAPI Quick Help</h2>
                    <p className="text-gray-400 text-sm mt-1">Common issues and solutions</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Issue 1: Symbol Not Found */}
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-red-400 font-semibold mb-2">
                      ❌ Symbol Not Found (e.g., "XAUUSD not found")
                    </h3>
                    <p className="text-gray-300 text-sm mb-3">
                      Your broker uses a different symbol name. For example, "XAUUSD" might be "XAUUSD.a" or "GOLD".
                    </p>
                    <div className="bg-gray-800 rounded p-3 text-sm space-y-2">
                      <p className="text-white font-semibold">✅ Solution:</p>
                      <ol className="list-decimal list-inside text-gray-300 space-y-1 ml-2">
                        <li>Click the "Find Symbols" button in the error modal</li>
                        <li>Find your asset in the list (e.g., Gold symbols section)</li>
                        <li>Copy the exact symbol name shown by your broker</li>
                        <li>Update your MetaAPI symbol configuration</li>
                        <li>Retry your backtest</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              {/* Issue 2: Timeframe Not Available */}
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-yellow-400 font-semibold mb-2">
                      ⚠️ Timeframe Not Available (e.g., "No candles for 1h")
                    </h3>
                    <p className="text-gray-300 text-sm mb-3">
                      Your broker doesn't provide data for that timeframe, or the symbol name is incorrect.
                    </p>
                    <div className="bg-gray-800 rounded p-3 text-sm space-y-2">
                      <p className="text-white font-semibold">✅ Solution:</p>
                      <ol className="list-decimal list-inside text-gray-300 space-y-1 ml-2">
                        <li>First, verify the symbol name is correct (see above)</li>
                        <li>Click "Check Timeframes" to see available timeframes</li>
                        <li>Either:
                          <ul className="list-disc list-inside ml-4 mt-1">
                            <li>Update your strategy to use an available timeframe (e.g., 4h instead of 1h)</li>
                            <li>Or switch to a different symbol that supports your timeframe</li>
                          </ul>
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              {/* Issue 3: Connection/Timeout */}
              <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-orange-400 font-semibold mb-2">
                      ⚠️ Connection Error or Timeout
                    </h3>
                    <p className="text-gray-300 text-sm mb-3">
                      Can't connect to MetaAPI or your broker account.
                    </p>
                    <div className="bg-gray-800 rounded p-3 text-sm space-y-2">
                      <p className="text-white font-semibold">✅ Solution:</p>
                      <ol className="list-decimal list-inside text-gray-300 space-y-1 ml-2">
                        <li>Check your MetaAPI dashboard: <a href="https://app.metaapi.cloud/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">app.metaapi.cloud</a></li>
                        <li>Ensure account status is "DEPLOYED" and "CONNECTED"</li>
                        <li>Wait 2-3 minutes and retry</li>
                        <li>Check your internet connection</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              {/* Common Symbol Mappings */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-blue-400 font-semibold mb-3">📋 Common Symbol Name Variations</h3>
                <div className="bg-gray-800 rounded p-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-700">
                        <th className="text-left py-2">Standard</th>
                        <th className="text-left py-2">Broker Variations</th>
                      </tr>
                    </thead>
                    <tbody className="text-white">
                      <tr className="border-b border-gray-700">
                        <td className="py-2 font-mono">XAUUSD</td>
                        <td className="py-2 font-mono text-gray-300">XAUUSD.a, GOLD, XAU/USD</td>
                      </tr>
                      <tr className="border-b border-gray-700">
                        <td className="py-2 font-mono">EURUSD</td>
                        <td className="py-2 font-mono text-gray-300">EURUSD.a, EURUSDm, EUR/USD</td>
                      </tr>
                      <tr className="border-b border-gray-700">
                        <td className="py-2 font-mono">BTCUSD</td>
                        <td className="py-2 font-mono text-gray-300">BTCUSD.a, Bitcoin, BTC/USD</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono">US30</td>
                        <td className="py-2 font-mono text-gray-300">US30.a, DJ30, DJIA</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-gray-400 text-xs mt-3">
                    💡 Tip: Use "Find Symbols" to see your broker's exact naming
                  </p>
                </div>
              </div>

              {/* Typical Timeframe Availability */}
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <h3 className="text-green-400 font-semibold mb-3">⏱️ Typical Timeframe Availability</h3>
                <div className="space-y-3">
                  <div className="bg-gray-800 rounded p-3">
                    <p className="text-white font-semibold text-sm mb-2">📈 Forex Major Pairs</p>
                    <div className="flex flex-wrap gap-2">
                      {["1m", "5m", "15m", "30m", "1h", "4h", "1d"].map((tf) => (
                        <span key={tf} className="bg-green-600 text-white px-2 py-1 rounded text-xs font-mono">
                          {tf}
                        </span>
                      ))}
                    </div>
                    <p className="text-gray-400 text-xs mt-2">Usually most timeframes available</p>
                  </div>

                  <div className="bg-gray-800 rounded p-3">
                    <p className="text-white font-semibold text-sm mb-2">🥇 Gold/Metals</p>
                    <div className="flex flex-wrap gap-2">
                      {["15m", "30m", "1h", "4h", "1d"].map((tf) => (
                        <span key={tf} className="bg-green-600 text-white px-2 py-1 rounded text-xs font-mono">
                          {tf}
                        </span>
                      ))}
                      <span className="bg-red-600/50 text-white px-2 py-1 rounded text-xs font-mono">
                        1m ❌
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mt-2">Often no 1-minute data (broker-dependent)</p>
                  </div>

                  <div className="bg-gray-800 rounded p-3">
                    <p className="text-white font-semibold text-sm mb-2">₿ Crypto</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs">
                        Varies by broker
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mt-2">Check with "Check Timeframes" button</p>
                  </div>
                </div>
              </div>

              {/* Debug Tools */}
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <h3 className="text-purple-400 font-semibold mb-3 flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Quick Debug Tools
                </h3>
                <p className="text-gray-300 text-sm mb-3">
                  When you encounter an error, a debug modal will automatically open with these tools:
                </p>
                <div className="space-y-2">
                  <div className="bg-gray-800 rounded p-3">
                    <p className="text-white font-semibold text-sm mb-1">🔍 Find Symbols</p>
                    <p className="text-gray-400 text-xs">
                      Discovers all symbols available on your broker, filtered by asset type
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <p className="text-white font-semibold text-sm mb-1">⚡ Check Timeframes</p>
                    <p className="text-gray-400 text-xs">
                      Tests which timeframes work for your specific symbol
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <p className="text-white font-semibold text-sm mb-1">✅ Validate Strategy</p>
                    <p className="text-gray-400 text-xs">
                      Comprehensive check of your entire strategy before running expensive operations
                    </p>
                  </div>
                </div>
              </div>

              {/* Best Practices */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">💡 Best Practices</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Always verify symbol names before creating strategies</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Use "Check Timeframes" to design strategies around available data</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Validate your strategy before running expensive optimizations</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Keep your MetaAPI account deployed and connected</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-4">
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setShowHelp(false)}
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-gray-800"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

