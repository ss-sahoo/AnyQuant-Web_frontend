"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, XCircle, Code } from "lucide-react"

interface GuideSection {
  title: string
  description: string
  example: string
  supported: boolean
}

const guideSections: GuideSection[] = [
  {
    title: "Basic Class Structure (REQUIRED)",
    description: "Your strategy must inherit from CustomStrategyBase",
    example: `from custom_strategy_base import CustomStrategyBase

class MyStrategy(CustomStrategyBase):
    # Your strategy code here
    pass`,
    supported: true,
  },
  {
    title: "Class Attributes (Parameters)",
    description: "Define optimizable parameters as class attributes",
    example: `class MyStrategy(CustomStrategyBase):
    fast_period = 10
    slow_period = 30
    stop_loss_pips = 50
    take_profit_pips = 100
    risk_per_trade = 2.0
    use_trailing_stop = True`,
    supported: true,
  },
  {
    title: "init() Method",
    description: "Called once before backtest starts. Pre-calculate indicators here.",
    example: `def init(self):
    df = self.data._get_full_df()
    closes = df['Close'].values
    self.sma_fast = self._sma(closes, self.fast_period)
    self.sma_slow = self._sma(closes, self.slow_period)
    self.register_indicator('Fast SMA', self.sma_fast, overlay=True)`,
    supported: true,
  },
  {
    title: "on_bar() Method",
    description: "Called on each bar during backtest. Main trading logic goes here.",
    example: `def on_bar(self):
    bar_idx = len(self.data.Close) - 1
    if bar_idx < self.slow_period:
        return
    price = self.data.Close[-1]
    if not self.position and self.fast_sma[bar_idx] > self.slow_sma[bar_idx]:
        self.buy(sl_pips=50, tp_pips=100)`,
    supported: true,
  },
  {
    title: "Built-in Indicators",
    description: "Use pre-built indicator methods: _sma(), _ema(), _rsi()",
    example: `self.sma = self._sma(closes, 20)
self.ema = self._ema(closes, 20)
self.rsi = self._rsi(closes, 14)`,
    supported: true,
  },
  {
    title: "Order Methods",
    description: "Place and manage orders: buy(), sell(), close()",
    example: `self.buy(size=1.0, sl_pips=50, tp_pips=100, comment="Entry")
self.sell(size=1.0, sl=1950.50, tp=1980.00)
self.position.close()
self.close_all()`,
    supported: true,
  },
  {
    title: "Data Access",
    description: "Access OHLCV data and timestamps",
    example: `current_close = self.data.Close[-1]
current_high = self.data.High[-1]
df = self.data._get_full_df()
current_time = self.data.index[-1]`,
    supported: true,
  },
  {
    title: "Position Information",
    description: "Check position status and P&L",
    example: `if self.position:
    size = self.position.size
    entry_price = self.position.entry_price
    pl = self.position.pl
    if self.position.is_long:
        # Long position logic`,
    supported: true,
  },
  {
    title: "NumPy & Pandas Operations",
    description: "Use numpy and pandas for calculations",
    example: `import numpy as np
import pandas as pd

returns = np.diff(closes) / closes[:-1]
volatility = np.std(returns)
df['MA20'] = df['Close'].rolling(20).mean()`,
    supported: true,
  },
  {
    title: "Custom Helper Methods",
    description: "Create your own helper methods",
    example: `def _calculate_volatility(self, data):
    returns = np.diff(data) / data[:-1]
    return np.std(returns)

def on_bar(self):
    vol = self._calculate_volatility(self.data.Close)`,
    supported: true,
  },
  {
    title: "File I/O (NOT ALLOWED)",
    description: "Reading/writing files is not permitted for security",
    example: `# ❌ NOT ALLOWED
with open('file.txt', 'r') as f:
    data = f.read()`,
    supported: false,
  },
  {
    title: "Network Requests (NOT ALLOWED)",
    description: "Network requests are not available",
    example: `# ❌ NOT ALLOWED
import requests
response = requests.get('https://api.example.com')`,
    supported: false,
  },
  {
    title: "External Libraries (NOT ALLOWED)",
    description: "Only numpy, pandas, math, and talib are available",
    example: `# ❌ NOT ALLOWED
import sklearn
import tensorflow`,
    supported: false,
  },
  {
    title: "System Commands (NOT ALLOWED)",
    description: "System commands are not permitted",
    example: `# ❌ NOT ALLOWED
import os
os.system('ls -la')`,
    supported: false,
  },
  {
    title: "Multiple Classes (NOT ALLOWED)",
    description: "Only one strategy class is allowed per file",
    example: `# ❌ NOT ALLOWED
class Strategy1(CustomStrategyBase):
    pass
class Strategy2(CustomStrategyBase):
    pass`,
    supported: false,
  },
]

export function CustomStrategyGuide() {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0, 1, 2, 3]))

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSections(newExpanded)
  }

  const supportedCount = guideSections.filter((s) => s.supported).length
  const unsupportedCount = guideSections.filter((s) => !s.supported).length

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-[#0a0e27] text-white rounded-lg border border-[#2A2D42]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Code className="w-8 h-8 text-[#85e1fe]" />
          Custom Strategy Python Guide
        </h1>
        <p className="text-gray-400">
          Learn what Python patterns are supported when writing custom trading strategies
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#151718] rounded-lg p-4 border border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-400">Supported Patterns</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{supportedCount}</p>
        </div>
        <div className="bg-[#151718] rounded-lg p-4 border border-red-500/30">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <span className="text-sm text-gray-400">Not Allowed</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{unsupportedCount}</p>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-400 mb-1">Quick Tips</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Always inherit from <code className="bg-black/50 px-2 py-1 rounded">CustomStrategyBase</code></li>
              <li>• Implement both <code className="bg-black/50 px-2 py-1 rounded">init()</code> and <code className="bg-black/50 px-2 py-1 rounded">on_bar()</code> methods</li>
              <li>• Use <code className="bg-black/50 px-2 py-1 rounded">self.data._get_full_df()</code> to access historical data</li>
              <li>• Check for NaN values before using indicator values</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Guide Sections */}
      <div className="space-y-3">
        {guideSections.map((section, index) => (
          <div
            key={index}
            className={`border rounded-lg overflow-hidden transition-all ${
              section.supported
                ? "border-green-500/30 bg-green-500/5"
                : "border-red-500/30 bg-red-500/5"
            }`}
          >
            {/* Section Header */}
            <button
              onClick={() => toggleSection(index)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-black/30 transition-colors"
            >
              <div className="flex items-center gap-3 text-left">
                {section.supported ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                )}
                <div>
                  <h3 className="font-semibold text-white">{section.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{section.description}</p>
                </div>
              </div>
              {expandedSections.has(index) ? (
                <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
            </button>

            {/* Section Content */}
            {expandedSections.has(index) && (
              <div className="px-4 py-3 border-t border-current/20 bg-black/20">
                <pre className="bg-black/50 rounded p-3 overflow-x-auto text-xs text-gray-300 font-mono">
                  <code>{section.example}</code>
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Complete Example */}
      <div className="mt-8 bg-[#151718] rounded-lg p-4 border border-[#2A2D42]">
        <h3 className="text-lg font-semibold text-white mb-3">📋 Complete Working Example</h3>
        <pre className="bg-black/50 rounded p-3 overflow-x-auto text-xs text-gray-300 font-mono">
          <code>{`import numpy as np
from custom_strategy_base import CustomStrategyBase

class GoldTrendStrategy(CustomStrategyBase):
    # Parameters (optimizable)
    fast_period = 10
    slow_period = 30
    rsi_period = 14
    stop_loss_pips = 50
    take_profit_pips = 100

    def init(self):
        """Pre-calculate indicators"""
        df = self.data._get_full_df()
        closes = df['Close'].values
        
        self.fast_sma = self._sma(closes, self.fast_period)
        self.slow_sma = self._sma(closes, self.slow_period)
        self.rsi = self._rsi(closes, self.rsi_period)
        
        self.register_indicator('Fast SMA', self.fast_sma, overlay=True, color='blue')
        self.register_indicator('Slow SMA', self.slow_sma, overlay=True, color='orange')
        self.register_indicator('RSI', self.rsi, overlay=False, subplot='RSI')

    def on_bar(self):
        """Main trading logic"""
        bar_idx = len(self.data.Close) - 1
        
        if bar_idx < self.slow_period:
            return
        
        price = self.data.Close[-1]
        fast_ma = self.fast_sma[bar_idx]
        slow_ma = self.slow_sma[bar_idx]
        rsi = self.rsi[bar_idx]
        
        if np.isnan(fast_ma) or np.isnan(slow_ma) or np.isnan(rsi):
            return
        
        if not self.position:
            if fast_ma > slow_ma and rsi < 70:
                self.buy(size=1.0, sl_pips=self.stop_loss_pips, 
                        tp_pips=self.take_profit_pips, comment="MA Golden Cross")
            elif fast_ma < slow_ma and rsi > 30:
                self.sell(size=1.0, sl_pips=self.stop_loss_pips,
                         tp_pips=self.take_profit_pips, comment="MA Death Cross")
        else:
            if self.position.is_long and fast_ma < slow_ma:
                self.position.close()
            elif self.position.is_short and fast_ma > slow_ma:
                self.position.close()`}</code>
        </pre>
      </div>

      {/* Footer */}
      <div className="mt-6 p-4 bg-[#151718] rounded-lg border border-[#2A2D42]">
        <p className="text-sm text-gray-400">
          💡 <strong>Pro Tip:</strong> Start with the complete example above and modify it for your strategy. 
          Always test with small position sizes first!
        </p>
      </div>
    </div>
  )
}
