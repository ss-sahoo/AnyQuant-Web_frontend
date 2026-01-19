"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Code, FileCode, AlertCircle, CheckCircle, Loader2, Save, Play, ChevronDown, FlaskConical, Trash2, Edit3, List } from "lucide-react"
import dynamic from "next/dynamic"

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

interface CustomStrategy {
  id: number
  name: string
  status: string
  created_at: string
  updated_at: string
}

interface EditingComponent {
  id: number
  name: string
  type: string
  language: string
  code: string
  parameters?: Record<string, any>
}

interface DeveloperModePageProps {
  onBack: () => void
  onCompile: (data: CompileData) => Promise<CompileResult>
  onSave: (data: SaveData) => Promise<void>
  onGoToBacktest?: (strategyId: number) => void
  onLoadStrategies?: () => Promise<CustomStrategy[]>
  onDeleteStrategy?: (strategyId: number) => Promise<void>
  onLoadStrategy?: (strategyId: number) => Promise<{ code: string; name: string }>
  editingComponent?: EditingComponent | null
}

interface CompileData {
  code: string
  codeType: "component" | "strategy"
  language: string
  componentName?: string
  strategyName?: string
  componentType?: "indicator" | "behavior" | "trade_management"
  parameters?: Parameter[]
}

interface SaveData extends CompileData {
  isDraft: boolean
}

interface CompileResult {
  success: boolean
  message: string
  errors?: CompileError[]
  warnings?: string[]
  strategyId?: number // For complete strategy, return the ID for backtesting
}

interface CompileError {
  line?: number
  column?: number
  message: string
  type: "error" | "warning"
}

interface Parameter {
  name: string
  defaultValue: string
  type: "number" | "string" | "boolean"
}

const PYTHON_COMPONENT_TEMPLATE = `# ============================================================================
# ⚠️ CRITICAL: CUSTOM INDICATOR COMPONENT - Required Function
# ============================================================================
#
# ALL custom indicator code MUST have a calculate(data, **kwargs) function
# as the entry point. This is the function the system calls to execute
# your indicator.
#
# ============================================================================
# CORE RULES FOR WRITING CUSTOM INDICATORS:
# ============================================================================
#
# Rule 1: Required Function Signature
#   - MUST have a function named 'calculate'
#   - MUST accept 'data' as first parameter
#   - MUST accept '**kwargs' for additional parameters
#   - MUST return NumPy array
#
# Rule 2: Input Data Type
#   - Input: Pandas DataFrame with columns: Open, High, Low, Close, Volume
#   - NOT a NumPy array (different from strategy indicators!)
#   - Access columns: data['Close'].values, data['High'].values, etc.
#
# Rule 3: Output Data Type
#   - MUST return NumPy array
#   - MUST be same length as input data
#   - MUST use np.nan for insufficient data (not 0, not None)
#
# Rule 4: NaN Handling
#   - MUST fill first period-1 values with np.nan
#   - MUST start calculations from index period-1
#   - MUST handle NaN values in calculations
#
# Rule 5: Parameter Handling via kwargs
#   - Extract parameters from **kwargs
#   - Use .get() with default values
#   - Common parameters: period, threshold, multiplier, etc.
#
# Rule 6: Registration for Plotting
#   - Return indicator data as NumPy array
#   - System automatically registers for plotting
#   - NaN/Inf values are automatically cleaned
#
# ============================================================================

import numpy as np

def calculate(data, **kwargs):
    """
    Required entry point for custom indicators.
    
    Args:
        data: DataFrame with OHLCV columns (Open, High, Low, Close, Volume)
        **kwargs: Additional parameters (period, threshold, etc.)
    
    Returns:
        NumPy array of indicator values (same length as input data)
    
    IMPORTANT:
    - Input is a DataFrame, NOT a NumPy array
    - Output MUST be a NumPy array with same length as input
    - First period-1 values MUST be np.nan
    - Start calculations from index period-1
    """
    
    # Extract parameters with defaults
    period = kwargs.get('period', 14)
    threshold = kwargs.get('threshold', 0.5)
    
    # Get price data from DataFrame
    closes = data['Close'].values  # Convert to NumPy array
    highs = data['High'].values
    lows = data['Low'].values
    
    # Initialize result array with NaN
    result = np.full_like(closes, np.nan, dtype=float)
    
    # Example: Simple Moving Average
    # First period-1 values are NaN (insufficient data)
    # Start from index period-1
    for i in range(period - 1, len(closes)):
        # Calculate only when we have enough data
        result[i] = np.mean(closes[i - period + 1:i + 1])
    
    return result  # Automatically plotted by system


# ============================================================================
# COMMON MISTAKES TO AVOID:
# ============================================================================
#
# ❌ MISTAKE 1: Wrong function name or signature
#   def my_indicator(data):  # WRONG! Must be 'calculate' with **kwargs
#       pass
#
# ✅ CORRECT:
#   def calculate(data, **kwargs):
#       pass
#
# ❌ MISTAKE 2: Treating input as NumPy array
#   def calculate(data, **kwargs):
#       result = np.mean(data)  # WRONG! data is DataFrame, not array
#
# ✅ CORRECT:
#   def calculate(data, **kwargs):
#       closes = data['Close'].values  # Convert to NumPy array
#       result = np.mean(closes)
#
# ❌ MISTAKE 3: Wrong output length
#   result = []
#   for i in range(period - 1, len(closes)):
#       result.append(calculate_value(closes, i, period))
#   return np.array(result)  # WRONG! Length is len(closes) - period + 1
#
# ✅ CORRECT:
#   result = np.full_like(closes, np.nan)
#   for i in range(period - 1, len(closes)):
#       result[i] = calculate_value(closes, i, period)
#   return result  # CORRECT! Length is len(closes)
#
# ❌ MISTAKE 4: Using 0 instead of NaN
#   result = np.zeros_like(closes)  # WRONG! Distorts calculations
#
# ✅ CORRECT:
#   result = np.full_like(closes, np.nan)  # CORRECT! NaN indicates insufficient data
#
# ❌ MISTAKE 5: Starting from index 0
#   for i in range(len(closes)):  # WRONG! Not enough data for calculation
#       result[i] = np.mean(closes[0:i+1])
#
# ✅ CORRECT:
#   for i in range(period - 1, len(closes)):  # CORRECT! Start from period-1
#       result[i] = np.mean(closes[i - period + 1:i + 1])
#
# ❌ MISTAKE 6: Not extracting parameters from kwargs
#   def calculate(data, **kwargs):
#       period = 14  # WRONG! Hardcoded, not from kwargs
#
# ✅ CORRECT:
#   def calculate(data, **kwargs):
#       period = kwargs.get('period', 14)  # CORRECT! From kwargs with default
#
# ============================================================================
`

const PYTHON_BEHAVIOR_TEMPLATE = `# ============================================================================
# ⚠️ CRITICAL: CUSTOM BEHAVIOR - Required Structure
# ============================================================================
#
# ALL custom behavior code MUST inherit from CustomBehaviorBase and implement
# required methods. This defines how your strategy enters and manages trades.
#
# ============================================================================
# CORE RULES FOR WRITING CUSTOM BEHAVIORS:
# ============================================================================
#
# Rule 1: Required Base Class
#   - MUST inherit from CustomBehaviorBase
#   - MUST import: from AnyQuantDiracAI.helper.custom_behavior_base import CustomBehaviorBase
#
# Rule 2: Required Methods (MUST IMPLEMENT)
#   - get_trade_config(self, price, equity, volatility=None) -> dict
#   - should_enter_trade(self, signal, price, indicators) -> bool
#
# Rule 3: Optional Methods (CAN OVERRIDE)
#   - should_exit_trade(self, position, price, indicators) -> bool
#   - calculate_position_size(self, equity, risk_pct, stop_distance) -> float
#   - get_behavior_config(self) -> BehaviorConfig
#   - And 5 more optional methods...
#
# Rule 4: Parameters
#   - Define as class variables (e.g., risk_per_trade = 2.0)
#   - Can be optimized during backtesting
#
# ============================================================================

from AnyQuantDiracAI.helper.custom_behavior_base import CustomBehaviorBase

class MyBehavior(CustomBehaviorBase):
    """
    Custom behavior for trade entry and management.
    
    Define class attributes as parameters that can be optimized:
    - risk_per_trade = 2.0
    - base_sl_pips = 50
    - base_tp_pips = 100
    """
    
    # Parameters (can be optimized)
    risk_per_trade = 2.0
    base_sl_pips = 50
    base_tp_pips = 100
    
    def get_trade_config(self, price, equity, volatility=None):
        """
        REQUIRED METHOD - Return trade configuration.
        
        Args:
            price: Current market price
            equity: Current account equity
            volatility: Optional volatility measure
        
        Returns:
            Dictionary with trade configuration:
            {
                'stop_loss_pips': 50,
                'take_profit_pips': 100,
                'position_size': 1.0,
                'trailing_stop_pips': 30,  # Optional
                'breakeven_pips': 20        # Optional
            }
        """
        # Dynamic SL/TP based on volatility
        if volatility and volatility > 0.02:
            sl_pips = self.base_sl_pips * 2
            tp_pips = self.base_tp_pips * 2
        else:
            sl_pips = self.base_sl_pips
            tp_pips = self.base_tp_pips
        
        return {
            'stop_loss_pips': sl_pips,
            'take_profit_pips': tp_pips,
            'position_size': 1.0
        }
    
    def should_enter_trade(self, signal, price, indicators):
        """
        REQUIRED METHOD - Determine if trade should be entered.
        
        Args:
            signal: Trade signal ('BUY' or 'SELL')
            price: Current market price
            indicators: Dictionary of indicator values
        
        Returns:
            Boolean - True to enter trade, False to skip
        """
        if signal != 'BUY':
            return False
        
        # Check RSI confirmation
        rsi = indicators.get('rsi', 50)
        if rsi > 70 or rsi < 30:
            return False
        
        return True
    
    # ========================================================================
    # OPTIONAL METHODS (Can override for advanced features)
    # ========================================================================
    
    def should_exit_trade(self, position, price, indicators):
        """
        OPTIONAL - Custom exit logic.
        
        Args:
            position: Current position object
            price: Current market price
            indicators: Dictionary of indicator values
        
        Returns:
            Boolean - True to exit, False to hold
        """
        # Exit if RSI becomes extreme
        rsi = indicators.get('rsi', 50)
        return rsi > 80 or rsi < 20


# ============================================================================
# MINIMAL EXAMPLE (Only Required Methods):
# ============================================================================
#
# from AnyQuantDiracAI.helper.custom_behavior_base import CustomBehaviorBase
#
# class SimpleBehavior(CustomBehaviorBase):
#     def get_trade_config(self, price, equity, volatility=None):
#         return {
#             'stop_loss_pips': 50,
#             'take_profit_pips': 100,
#             'position_size': 1.0
#         }
#     
#     def should_enter_trade(self, signal, price, indicators):
#         return signal == 'BUY'
#
# ============================================================================
`

const PYTHON_TRADE_MANAGEMENT_TEMPLATE = `# ============================================================================
# ⚠️ CRITICAL: CUSTOM TRADE MANAGEMENT - Required Structure
# ============================================================================
#
# ALL custom trade management code MUST inherit from CustomBehaviorBase and
# implement required methods. This defines how your trades are managed.
#
# ============================================================================
# CORE RULES FOR WRITING CUSTOM TRADE MANAGEMENT:
# ============================================================================
#
# Rule 1: Required Base Class
#   - MUST inherit from CustomBehaviorBase
#   - MUST import: from AnyQuantDiracAI.helper.custom_behavior_base import CustomBehaviorBase
#
# Rule 2: Required Method (MUST IMPLEMENT)
#   - get_trade_config(self, price, equity, volatility=None) -> dict
#
# Rule 3: Optional Methods (CAN OVERRIDE)
#   - should_apply_trailing_stop(self, position, price, profit_pct) -> bool
#   - should_apply_breakeven(self, position, price, profit_pct) -> bool
#   - should_exit_trade(self, position, price, indicators) -> bool
#   - And 6 more optional methods...
#
# Rule 4: Parameters
#   - Define as class variables (e.g., trailing_stop_pips = 30)
#   - Can be optimized during backtesting
#
# ============================================================================

from AnyQuantDiracAI.helper.custom_behavior_base import CustomBehaviorBase

class MyTradeManagement(CustomBehaviorBase):
    """
    Custom trade management for position handling.
    
    Define class attributes as parameters that can be optimized:
    - trailing_stop_pips = 30
    - breakeven_pips = 20
    - partial_tp_pct = 50
    """
    
    # Parameters (can be optimized)
    trailing_stop_pips = 30
    breakeven_pips = 20
    partial_tp_pct = 50
    
    def get_trade_config(self, price, equity, volatility=None):
        """
        REQUIRED METHOD - Return trade configuration.
        
        Args:
            price: Current market price
            equity: Current account equity
            volatility: Optional volatility measure
        
        Returns:
            Dictionary with trade configuration:
            {
                'stop_loss_pips': 30,
                'take_profit_pips': 90,
                'trailing_stop_pips': 20,
                'breakeven_pips': 15
            }
        """
        return {
            'stop_loss_pips': 30,
            'take_profit_pips': 90,
            'trailing_stop_pips': self.trailing_stop_pips,
            'breakeven_pips': self.breakeven_pips
        }
    
    # ========================================================================
    # OPTIONAL METHODS (Can override for advanced features)
    # ========================================================================
    
    def should_apply_trailing_stop(self, position, price, profit_pct):
        """
        OPTIONAL - Determine when to apply trailing stop.
        
        Args:
            position: Current position object
            price: Current market price
            profit_pct: Current profit percentage
        
        Returns:
            Boolean - True to apply trailing stop
        """
        # Apply trailing stop when profit > 1%
        return profit_pct > 1.0
    
    def should_apply_breakeven(self, position, price, profit_pct):
        """
        OPTIONAL - Determine when to move stop to breakeven.
        
        Args:
            position: Current position object
            price: Current market price
            profit_pct: Current profit percentage
        
        Returns:
            Boolean - True to move to breakeven
        """
        # Move to breakeven at 2% profit
        return profit_pct >= 2.0
    
    def should_exit_trade(self, position, price, indicators):
        """
        OPTIONAL - Custom exit logic.
        
        Args:
            position: Current position object
            price: Current market price
            indicators: Dictionary of indicator values
        
        Returns:
            Boolean - True to exit, False to hold
        """
        # Exit if profit exceeds 5%
        return position.profit_pct > 5.0


# ============================================================================
# MINIMAL EXAMPLE (Only Required Method):
# ============================================================================
#
# from AnyQuantDiracAI.helper.custom_behavior_base import CustomBehaviorBase
#
# class SimpleTradeManagement(CustomBehaviorBase):
#     def get_trade_config(self, price, equity, volatility=None):
#         return {
#             'stop_loss_pips': 30,
#             'take_profit_pips': 90,
#             'trailing_stop_pips': 20
#         }
#
# ============================================================================
`

const PYTHON_STRATEGY_TEMPLATE = `# ============================================================================
# CUSTOM STRATEGY TEMPLATE - Complete Trading Strategy
# ============================================================================
# 
# REQUIREMENTS:
# 1. Must inherit from CustomStrategyBase
# 2. Must implement init() method - called once before backtest starts
# 3. Must implement on_bar() method - called on each bar during backtest
# 4. Use self.data to access OHLCV data
# 5. Use self.buy(), self.sell(), self.position.close() for orders
#
# AVAILABLE LIBRARIES: numpy, pandas, math, talib
# NOT ALLOWED: File I/O, network requests, external libraries, system commands
# ============================================================================

import numpy as np
from custom_strategy_base import CustomStrategyBase

class MyStrategy(CustomStrategyBase):
    """
    Your custom trading strategy.
    
    Define class attributes as parameters that can be optimized:
    - int: fast_period = 10
    - float: threshold = 0.02
    - bool: use_trailing_stop = True
    """
    
    # Strategy Parameters (these can be optimized)
    fast_period = 10
    slow_period = 30
    rsi_period = 14
    stop_loss_pips = 50
    take_profit_pips = 100
    
    def init(self):
        """
        Called once before backtest starts.
        Pre-calculate all indicators here for better performance.
        
        Available methods:
        - self.data._get_full_df() - Get full historical DataFrame
        - self._sma(data, period) - Simple Moving Average
        - self._ema(data, period) - Exponential Moving Average
        - self._rsi(data, period) - Relative Strength Index
        - self.register_indicator(name, values, overlay=True, color='blue')
        """
        
        # Get full historical data
        df = self.data._get_full_df()
        closes = df['Close'].values
        
        # Calculate indicators
        self.fast_sma = self._sma(closes, self.fast_period)
        self.slow_sma = self._sma(closes, self.slow_period)
        self.rsi = self._rsi(closes, self.rsi_period)
        
        # Register indicators for plotting (optional)
        self.register_indicator('Fast SMA', self.fast_sma, overlay=True, color='blue')
        self.register_indicator('Slow SMA', self.slow_sma, overlay=True, color='orange')
        self.register_indicator('RSI', self.rsi, overlay=False, subplot='RSI', color='purple')
    
    def on_bar(self):
        """
        Called on each bar during backtest.
        Implement your main trading logic here.
        
        Available data access:
        - self.data.Close[-1] - Current close price
        - self.data.High[-1] - Current high price
        - self.data.Low[-1] - Current low price
        - self.data.Open[-1] - Current open price
        - self.data.Volume[-1] - Current volume
        - self.data.index[-1] - Current timestamp
        
        Available position methods:
        - self.position - Current position object (None if no position)
        - self.position.is_long - Boolean, True if long position
        - self.position.is_short - Boolean, True if short position
        - self.position.size - Position size
        - self.position.entry_price - Entry price
        - self.position.pl - Profit/Loss in currency
        - self.position.pl_pct - Profit/Loss in percentage
        
        Available order methods:
        - self.buy(size=1.0, sl_pips=50, tp_pips=100, comment="Entry")
        - self.sell(size=1.0, sl_pips=50, tp_pips=100, comment="Entry")
        - self.position.close() - Close current position
        - self.close_all() - Close all positions
        
        Available properties:
        - self.equity - Current account equity
        """
        
        # Get current bar index
        bar_idx = len(self.data.Close) - 1
        
        # Skip if not enough data for indicators
        if bar_idx < self.slow_period:
            return
        
        # Get current values
        price = self.data.Close[-1]
        fast_ma = self.fast_sma[bar_idx]
        slow_ma = self.slow_sma[bar_idx]
        rsi = self.rsi[bar_idx]
        
        # Skip if NaN values (not enough data yet)
        if np.isnan(fast_ma) or np.isnan(slow_ma) or np.isnan(rsi):
            return
        
        # ENTRY LOGIC
        if not self.position:  # No position open
            # Buy signal: Fast MA crosses above Slow MA + RSI confirmation
            if fast_ma > slow_ma and rsi < 70:
                self.buy(
                    size=1.0,
                    sl_pips=self.stop_loss_pips,
                    tp_pips=self.take_profit_pips,
                    comment="MA Golden Cross"
                )
            
            # Sell signal: Fast MA crosses below Slow MA + RSI confirmation
            elif fast_ma < slow_ma and rsi > 30:
                self.sell(
                    size=1.0,
                    sl_pips=self.stop_loss_pips,
                    tp_pips=self.take_profit_pips,
                    comment="MA Death Cross"
                )
        
        # EXIT LOGIC
        else:  # Position is open
            # Close long position if MA crossover reverses
            if self.position.is_long and fast_ma < slow_ma:
                self.position.close()
            
            # Close short position if MA crossover reverses
            elif self.position.is_short and fast_ma > slow_ma:
                self.position.close()
`

const PINESCRIPT_COMPONENT_TEMPLATE = `//@version=5
indicator("My Custom Indicator", overlay=false)

// Input parameters
length = input.int(14, "Length", minval=1)
source = input.source(close, "Source")

// Calculate indicator
myIndicator = ta.sma(source, length)

// Plot
plot(myIndicator, "My Indicator", color=color.blue)
`

const PINESCRIPT_STRATEGY_TEMPLATE = `//@version=5
strategy("My Strategy", overlay=true, default_qty_type=strategy.percent_of_equity, default_qty_value=100)

// Input parameters
fastLength = input.int(12, "Fast MA Length")
slowLength = input.int(26, "Slow MA Length")

// Calculate indicators
fastMA = ta.sma(close, fastLength)
slowMA = ta.sma(close, slowLength)

// Strategy logic
longCondition = ta.crossover(fastMA, slowMA)
shortCondition = ta.crossunder(fastMA, slowMA)

if (longCondition)
    strategy.entry("Long", strategy.long)

if (shortCondition)
    strategy.entry("Short", strategy.short)

// Plot
plot(fastMA, "Fast MA", color=color.blue)
plot(slowMA, "Slow MA", color=color.red)
`

export function DeveloperModePage({ onBack, onCompile, onSave, onGoToBacktest, onLoadStrategies, onDeleteStrategy, onLoadStrategy, editingComponent }: DeveloperModePageProps) {
  const [codeType, setCodeType] = useState<"component" | "strategy">("component")
  const [language, setLanguage] = useState<"python" | "pinescript">("python")
  const [componentName, setComponentName] = useState("")
  const [strategyName, setStrategyName] = useState("")
  const [componentType, setComponentType] = useState<"indicator" | "behavior" | "trade_management">("indicator")
  const [parameters, setParameters] = useState<Parameter[]>([
    { name: "period", defaultValue: "14", type: "number" }
  ])
  const [code, setCode] = useState(PYTHON_COMPONENT_TEMPLATE)
  const [isCompiling, setIsCompiling] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null)
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [showComponentTypeDropdown, setShowComponentTypeDropdown] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [compiledStrategyId, setCompiledStrategyId] = useState<number | null>(null)
  
  // Custom strategies list state
  const [customStrategies, setCustomStrategies] = useState<CustomStrategy[]>([])
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(false)
  const [showStrategiesList, setShowStrategiesList] = useState(false)
  const [editingStrategyId, setEditingStrategyId] = useState<number | null>(null)

  // Load custom strategies when strategy type is selected
  useEffect(() => {
    if (codeType === "strategy" && onLoadStrategies) {
      loadStrategies()
    }
  }, [codeType])

  const loadStrategies = async () => {
    if (!onLoadStrategies) return
    setIsLoadingStrategies(true)
    try {
      const strategies = await onLoadStrategies()
      setCustomStrategies(strategies)
    } catch (error) {
      console.error("Failed to load custom strategies:", error)
    } finally {
      setIsLoadingStrategies(false)
    }
  }

  const handleLoadStrategy = async (strategyId: number) => {
    if (!onLoadStrategy) return
    try {
      const strategy = await onLoadStrategy(strategyId)
      setCode(strategy.code)
      setStrategyName(strategy.name)
      setEditingStrategyId(strategyId)
      setCompiledStrategyId(strategyId)
      setShowStrategiesList(false)
      setCompileResult({
        success: true,
        message: `Loaded strategy "${strategy.name}". You can edit and recompile.`
      })
    } catch (error) {
      console.error("Failed to load strategy:", error)
    }
  }

  const handleDeleteStrategy = async (strategyId: number) => {
    if (!onDeleteStrategy) return
    if (!confirm("Are you sure you want to delete this strategy?")) return
    try {
      await onDeleteStrategy(strategyId)
      await loadStrategies()
      if (editingStrategyId === strategyId) {
        setEditingStrategyId(null)
        setCompiledStrategyId(null)
        setCode(PYTHON_STRATEGY_TEMPLATE)
        setStrategyName("")
      }
    } catch (error) {
      console.error("Failed to delete strategy:", error)
    }
  }

  // Initialize from editingComponent if provided
  useEffect(() => {
    if (editingComponent) {
      setIsEditing(true)
      setComponentName(editingComponent.name)
      setLanguage(editingComponent.language as "python" | "pinescript")
      setComponentType(editingComponent.type as "indicator" | "behavior" | "trade_management")
      setCode(editingComponent.code || "")
      
      // Convert parameters from {name: value} to Parameter[]
      if (editingComponent.parameters) {
        const params: Parameter[] = Object.entries(editingComponent.parameters).map(([name, value]) => ({
          name,
          defaultValue: String(value),
          type: typeof value === "number" ? "number" : typeof value === "boolean" ? "boolean" : "string"
        }))
        setParameters(params.length > 0 ? params : [{ name: "period", defaultValue: "14", type: "number" }])
      }
    }
  }, [editingComponent])

  // Update component template when language or component type changes (only for component code)
  useEffect(() => {
    if (!isEditing && codeType === "component") {
      if (language === "python") {
        // Select template based on component type
        if (componentType === "indicator") {
          setCode(PYTHON_COMPONENT_TEMPLATE)
        } else if (componentType === "behavior") {
          setCode(PYTHON_BEHAVIOR_TEMPLATE)
        } else if (componentType === "trade_management") {
          setCode(PYTHON_TRADE_MANAGEMENT_TEMPLATE)
        }
      } else {
        setCode(PINESCRIPT_COMPONENT_TEMPLATE)
      }
    }
  }, [language, componentType, isEditing, codeType])

  // Update strategy template when language changes (only for strategy code)
  useEffect(() => {
    if (!isEditing && codeType === "strategy") {
      if (language === "python") {
        setCode(PYTHON_STRATEGY_TEMPLATE)
      } else {
        setCode(PINESCRIPT_STRATEGY_TEMPLATE)
      }
    }
  }, [language, isEditing, codeType])

  const handleCompile = async () => {
    if (!code.trim()) {
      setCompileResult({
        success: false,
        message: "Please enter some code before compiling.",
        errors: [{ message: "No code provided", type: "error" }]
      })
      return
    }

    if (codeType === "component" && !componentName.trim()) {
      setCompileResult({
        success: false,
        message: "Please enter a component name.",
        errors: [{ message: "Component name is required", type: "error" }]
      })
      return
    }

    if (codeType === "strategy" && !strategyName.trim()) {
      setCompileResult({
        success: false,
        message: "Please enter a strategy name.",
        errors: [{ message: "Strategy name is required", type: "error" }]
      })
      return
    }

    // Validate strategy name is a valid Python identifier (no spaces, starts with letter/underscore)
    if (codeType === "strategy" && strategyName.trim()) {
      const pythonIdentifierRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/
      if (!pythonIdentifierRegex.test(strategyName.trim())) {
        setCompileResult({
          success: false,
          message: "Invalid strategy name format.",
          errors: [{ message: "Strategy name must be a valid Python identifier (letters, numbers, underscores only, cannot start with a number)", type: "error" }]
        })
        return
      }
    }

    setIsCompiling(true)
    setCompileResult(null)
    setCompiledStrategyId(null)

    try {
      const result = await onCompile({
        code,
        codeType,
        language,
        componentName: codeType === "component" ? componentName : undefined,
        strategyName: codeType === "strategy" ? strategyName : undefined,
        componentType: codeType === "component" ? componentType : undefined,
        parameters: codeType === "component" ? parameters : undefined
      })
      setCompileResult(result)
      
      // If complete strategy compiled successfully, store the ID for backtesting
      if (result.success && codeType === "strategy" && result.strategyId) {
        setCompiledStrategyId(result.strategyId)
      }
    } catch (error) {
      setCompileResult({
        success: false,
        message: "Compilation failed unexpectedly.",
        errors: [{ message: String(error), type: "error" }]
      })
    } finally {
      setIsCompiling(false)
    }
  }

  const handleSave = async (isDraft: boolean) => {
    setIsSaving(true)
    try {
      await onSave({
        code,
        codeType,
        language,
        componentName: codeType === "component" ? componentName : undefined,
        strategyName: codeType === "strategy" ? strategyName : undefined,
        componentType: codeType === "component" ? componentType : undefined,
        parameters: codeType === "component" ? parameters : undefined,
        isDraft
      })
      if (isDraft) {
        setCompileResult({
          success: true,
          message: "Draft saved successfully!"
        })
      }
    } catch (error) {
      setCompileResult({
        success: false,
        message: "Failed to save.",
        errors: [{ message: String(error), type: "error" }]
      })
    } finally {
      setIsSaving(false)
    }
  }

  const addParameter = () => {
    setParameters([...parameters, { name: "", defaultValue: "", type: "number" }])
  }

  const updateParameter = (index: number, field: keyof Parameter, value: string) => {
    const newParams = [...parameters]
    newParams[index] = { ...newParams[index], [field]: value }
    setParameters(newParams)
  }

  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index))
  }

  // Get Monaco language based on selected language
  const getMonacoLanguage = () => {
    return language === "python" ? "python" : "javascript" // PineScript is similar to JS syntax
  }

  return (
    <div className="h-screen bg-[#141721] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-[#1A1D24] border-b border-[#2A2D42] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Strategy Builder</span>
            </button>
            <div className="h-6 w-px bg-[#2A2D42]" />
            <div className="flex items-center gap-2">
              <Code className="w-6 h-6 text-[#85e1fe]" />
              <h1 className="text-xl font-semibold text-white">Developer Mode</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-[#2A2D42] text-white rounded-lg hover:bg-[#3A3D52] transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </button>
            <button
              onClick={handleCompile}
              disabled={isCompiling}
              className="flex items-center gap-2 px-6 py-2 bg-[#85e1fe] text-black rounded-lg hover:bg-[#5AB9D1] transition-colors disabled:opacity-50"
            >
              {isCompiling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isCompiling ? "Compiling..." : "Compile"}
            </button>
            {/* Go to Backtesting button - only shown for complete strategy after successful compile */}
            {codeType === "strategy" && compiledStrategyId && compileResult?.success && onGoToBacktest && (
              <button
                onClick={() => onGoToBacktest(compiledStrategyId)}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FlaskConical className="w-4 h-4" />
                Go to Backtesting
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Configuration */}
        <div className="w-80 bg-[#1A1D24] border-r border-[#2A2D42] p-6 overflow-y-auto flex-shrink-0">
          {/* Code Type Selection */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-3">Code Type</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-[#151718] rounded-lg cursor-pointer border border-transparent hover:border-[#3A3D52] transition-colors">
                <input
                  type="radio"
                  name="codeType"
                  checked={codeType === "component"}
                  onChange={() => setCodeType("component")}
                  className="w-4 h-4 text-[#85e1fe] bg-[#2A2D42] border-[#4A4D62] focus:ring-[#85e1fe] focus:ring-offset-0"
                />
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-[#85e1fe]" />
                  <span className="text-white">Component Code</span>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 bg-[#151718] rounded-lg cursor-pointer border border-transparent hover:border-[#3A3D52] transition-colors">
                <input
                  type="radio"
                  name="codeType"
                  checked={codeType === "strategy"}
                  onChange={() => setCodeType("strategy")}
                  className="w-4 h-4 text-[#85e1fe] bg-[#2A2D42] border-[#4A4D62] focus:ring-[#85e1fe] focus:ring-offset-0"
                />
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-[#85e1fe]" />
                  <span className="text-white">Complete Strategy</span>
                </div>
              </label>
            </div>
          </div>

          {/* Language Selection */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-3">Language</label>
            <div className="relative">
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#151718] border border-[#2A2D42] rounded-lg text-white hover:border-[#4A4D62] transition-colors"
              >
                <span>{language === "python" ? "Python" : "PineScript"}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showLanguageDropdown ? "rotate-180" : ""}`} />
              </button>
              {showLanguageDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1D24] border border-[#2A2D42] rounded-lg overflow-hidden z-10">
                  <button
                    onClick={() => { setLanguage("python"); setShowLanguageDropdown(false) }}
                    className={`w-full px-4 py-3 text-left hover:bg-[#2A2D42] transition-colors ${language === "python" ? "text-[#85e1fe]" : "text-white"}`}
                  >
                    Python
                  </button>
                  <button
                    onClick={() => { setLanguage("pinescript"); setShowLanguageDropdown(false) }}
                    className={`w-full px-4 py-3 text-left hover:bg-[#2A2D42] transition-colors ${language === "pinescript" ? "text-[#85e1fe]" : "text-white"}`}
                  >
                    PineScript
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Strategy Name (only for strategy type) */}
          {codeType === "strategy" && (
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-3">Strategy Name</label>
              <input
                type="text"
                value={strategyName}
                onChange={(e) => {
                  // Auto-convert to valid Python identifier format
                  const value = e.target.value.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^(\d)/, '_$1')
                  setStrategyName(value)
                }}
                placeholder="e.g., my_rsi_strategy"
                className="w-full px-4 py-3 bg-[#151718] border border-[#2A2D42] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#85e1fe] transition-colors"
              />
              <p className="mt-2 text-xs text-gray-500">
                Use letters, numbers, and underscores only. Cannot start with a number.
              </p>
            </div>
          )}

          {/* My Custom Strategies (only for strategy type) */}
          {codeType === "strategy" && onLoadStrategies && (
            <div className="mb-6">
              <button
                onClick={() => setShowStrategiesList(!showStrategiesList)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#151718] border border-[#2A2D42] rounded-lg text-white hover:border-[#4A4D62] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4 text-[#85e1fe]" />
                  <span>My Custom Strategies</span>
                  {customStrategies.length > 0 && (
                    <span className="bg-[#85e1fe] text-black text-xs px-2 py-0.5 rounded-full">
                      {customStrategies.length}
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${showStrategiesList ? "rotate-180" : ""}`} />
              </button>
              
              {showStrategiesList && (
                <div className="mt-2 bg-[#151718] border border-[#2A2D42] rounded-lg overflow-hidden">
                  {isLoadingStrategies ? (
                    <div className="p-4 text-center text-gray-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Loading strategies...
                    </div>
                  ) : customStrategies.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No custom strategies yet. Create one above!
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {customStrategies.map((strategy) => (
                        <div
                          key={strategy.id}
                          className={`p-3 border-b border-[#2A2D42] last:border-b-0 hover:bg-[#1A1D24] transition-colors ${
                            editingStrategyId === strategy.id ? "bg-[#85e1fe]/10" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">{strategy.name}</p>
                              <p className="text-xs text-gray-500">
                                {strategy.status === "compiled" ? (
                                  <span className="text-green-400">● Compiled</span>
                                ) : strategy.status === "active" ? (
                                  <span className="text-[#85e1fe]">● Active</span>
                                ) : (
                                  <span className="text-yellow-400">● Draft</span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={() => handleLoadStrategy(strategy.id)}
                                className="p-1.5 text-gray-400 hover:text-[#85e1fe] transition-colors"
                                title="Edit strategy"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              {onGoToBacktest && (strategy.status === "compiled" || strategy.status === "active") && (
                                <button
                                  onClick={() => onGoToBacktest(strategy.id)}
                                  className="p-1.5 text-gray-400 hover:text-green-400 transition-colors"
                                  title="Run backtest"
                                >
                                  <FlaskConical className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteStrategy(strategy.id)}
                                className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                                title="Delete strategy"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={loadStrategies}
                    className="w-full p-2 text-xs text-[#85e1fe] hover:bg-[#1A1D24] transition-colors border-t border-[#2A2D42]"
                  >
                    Refresh List
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Component Configuration (only for component type) */}
          {codeType === "component" && (
            <>
              {/* Component Name */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-3">Component Name</label>
                <input
                  type="text"
                  value={componentName}
                  onChange={(e) => setComponentName(e.target.value)}
                  placeholder="e.g., My Custom RSI"
                  className="w-full px-4 py-3 bg-[#151718] border border-[#2A2D42] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#85e1fe] transition-colors"
                />
              </div>

              {/* Component Type */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-3">Component Type</label>
                <div className="relative">
                  <button
                    onClick={() => setShowComponentTypeDropdown(!showComponentTypeDropdown)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#151718] border border-[#2A2D42] rounded-lg text-white hover:border-[#4A4D62] transition-colors"
                  >
                    <span>
                      {componentType === "indicator" ? "Indicator" : 
                       componentType === "behavior" ? "Behavior" : "Trade Management"}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showComponentTypeDropdown ? "rotate-180" : ""}`} />
                  </button>
                  {showComponentTypeDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1D24] border border-[#2A2D42] rounded-lg overflow-hidden z-10">
                      <button
                        onClick={() => { setComponentType("indicator"); setShowComponentTypeDropdown(false) }}
                        className={`w-full px-4 py-3 text-left hover:bg-[#2A2D42] transition-colors ${componentType === "indicator" ? "text-[#85e1fe]" : "text-white"}`}
                      >
                        Indicator
                      </button>
                      <button
                        onClick={() => { setComponentType("behavior"); setShowComponentTypeDropdown(false) }}
                        className={`w-full px-4 py-3 text-left hover:bg-[#2A2D42] transition-colors ${componentType === "behavior" ? "text-[#85e1fe]" : "text-white"}`}
                      >
                        Behavior
                      </button>
                      <button
                        onClick={() => { setComponentType("trade_management"); setShowComponentTypeDropdown(false) }}
                        className={`w-full px-4 py-3 text-left hover:bg-[#2A2D42] transition-colors ${componentType === "trade_management" ? "text-[#85e1fe]" : "text-white"}`}
                      >
                        Trade Management
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Parameters */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-gray-400">Parameters</label>
                  <button
                    onClick={addParameter}
                    className="text-xs text-[#85e1fe] hover:text-[#5AB9D1] transition-colors"
                  >
                    + Add Parameter
                  </button>
                </div>
                <div className="space-y-3">
                  {parameters.map((param, index) => (
                    <div key={index} className="p-3 bg-[#151718] rounded-lg border border-[#2A2D42]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Parameter {index + 1}</span>
                        <button
                          onClick={() => removeParameter(index)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        type="text"
                        value={param.name}
                        onChange={(e) => updateParameter(index, "name", e.target.value)}
                        placeholder="Name (e.g., period)"
                        className="w-full px-3 py-2 mb-2 bg-[#0D0F12] border border-[#2A2D42] rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#85e1fe]"
                      />
                      <input
                        type="text"
                        value={param.defaultValue}
                        onChange={(e) => updateParameter(index, "defaultValue", e.target.value)}
                        placeholder="Default value (e.g., 14)"
                        className="w-full px-3 py-2 bg-[#0D0F12] border border-[#2A2D42] rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#85e1fe]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Help Text */}
          <div className="p-4 bg-[#151718] rounded-lg border border-[#2A2D42]">
            <h4 className="text-sm font-medium text-white mb-2">
              {codeType === "component" ? "Component Guidelines" : "Strategy Guidelines"}
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              {codeType === "component" 
                ? "Define a function that takes data and parameters, then returns calculated values. Your component will be available in the strategy builder after successful compilation."
                : "Define initialize() for setup and handle_data() for trading logic. After successful compilation, you can go directly to backtesting."}
            </p>
          </div>
        </div>

        {/* Right Side - Code Editor */}
        <div className="flex-1 flex flex-col">
          {/* Editor Header */}
          <div className="bg-[#1A1D24] border-b border-[#2A2D42] px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-3 text-sm text-gray-400">
                {codeType === "component" ? (componentName || "untitled") : "strategy"}.{language === "python" ? "py" : "pine"}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {code.split("\n").length} lines
            </span>
          </div>

          {/* Monaco Code Editor */}
          <div className="flex-1 overflow-hidden">
            <MonacoEditor
              height="100%"
              language={getMonacoLanguage()}
              value={code}
              onChange={(value) => setCode(value || "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                insertSpaces: true,
                wordWrap: "on",
                padding: { top: 16, bottom: 16 },
                renderLineHighlight: "line",
                cursorBlinking: "smooth",
                smoothScrolling: true,
                fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
                fontLigatures: true,
              }}
            />
          </div>

          {/* Compilation Feedback */}
          {compileResult && (
            <div className={`border-t ${compileResult.success ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"} max-h-64 overflow-y-auto`}>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {compileResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${compileResult.success ? "text-green-400" : "text-red-400"}`}>
                      {compileResult.message}
                    </p>
                    
                    {/* Success message for complete strategy */}
                    {compileResult.success && codeType === "strategy" && compiledStrategyId && (
                      <p className="mt-2 text-sm text-gray-400">
                        Your strategy is ready! Click "Go to Backtesting" to test it.
                      </p>
                    )}
                    
                    {/* Errors */}
                    {compileResult.errors && compileResult.errors.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {compileResult.errors.map((error, index) => (
                          <div 
                            key={index} 
                            className={`p-2 rounded ${error.type === "error" ? "bg-red-500/10 border border-red-500/20" : "bg-yellow-500/10 border border-yellow-500/20"}`}
                          >
                            <div className={`flex items-start gap-2 text-sm ${error.type === "error" ? "text-red-300" : "text-yellow-300"}`}>
                              {error.line && (
                                <span className="font-mono bg-red-500/20 px-2 py-0.5 rounded text-xs">
                                  Line {error.line}
                                </span>
                              )}
                              <span className="flex-1">{error.message}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Warnings */}
                    {compileResult.warnings && compileResult.warnings.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs text-yellow-400 font-medium">Warnings:</p>
                        {compileResult.warnings.map((warning, index) => (
                          <p key={index} className="text-sm text-yellow-300 font-mono">• {warning}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}