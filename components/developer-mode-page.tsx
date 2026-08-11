"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Code, FileCode, AlertCircle, CheckCircle, Loader2, Save, Play, ChevronDown, FlaskConical, Trash2, Edit3, List, Maximize2 } from "lucide-react"
import dynamic from "next/dynamic"
import { UnsavedChangesModal } from "./modals/unsaved-changes-modal"
import {
  ParameterSchema,
  ParameterType,
  OHLCV_SOURCES,
  coerceDefault,
  isValidPythonIdentifier,
  normalizeStoredParameters,
  validateSchemas,
} from "@/lib/custom-component-schema"
import {
  DataBinding,
  DATA_TIMEFRAME_OPTIONS,
  dataMappingTimeframes,
  defaultDataMapping,
  isPresetTimeframe,
  loadDataMapping,
  validateDataMapping,
} from "@/lib/dev-data-mapping"

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
  /** Persists the record and returns the id the backend allotted it. */
  onSave: (data: SaveData) => Promise<SaveResult | void>
  onGoToBacktest?: (strategyId: number) => void
  onLoadStrategies?: () => Promise<CustomStrategy[]>
  onDeleteStrategy?: (strategyId: number) => Promise<void>
  onLoadStrategy?: (strategyId: number) => Promise<{ code: string; name: string }>
  editingComponent?: EditingComponent | null
  /** Custom strategy to load on first mount (deep link / restored session, ANY-308). */
  initialStrategyId?: number | null
  initialCodeType?: "component" | "strategy"
  /** Notifies the parent whenever an existing custom strategy is loaded into the editor. */
  onStrategyLoaded?: (strategyId: number) => void
  /**
   * How the editor is being displayed (ANY-308). `inline` embeds it in the
   * builder where the no-code statements live and offers Expand; `fullscreen`
   * is the expanded overlay, whose Back collapses it again.
   */
  variant?: "fullscreen" | "inline"
  /** Expand the inline editor to fullscreen. Only used when `variant` is inline. */
  onExpand?: () => void
  /**
   * Whether the inline header carries a Back button. Fullscreen always has one;
   * inline only needs it when Back goes somewhere the builder's own
   * Developer/No-Code toggle can't reach (i.e. off the page).
   */
  showBack?: boolean
  /** Label of the back button — the destination depends on how the editor was opened. */
  backLabel?: string
  /**
   * True when `onBack` navigates off the page, destroying this editor. Every
   * other Back path only hides it (the instance stays mounted with its code),
   * so only this one warrants the unsaved-changes prompt.
   */
  backLeavesPage?: boolean
}

interface CompileData {
  code: string
  codeType: "component" | "strategy"
  language: string
  componentName?: string
  strategyName?: string
  componentType?: "indicator" | "behavior" | "trade_management"
  parameters?: ParameterSchema[]
  componentId?: number  // For editing existing components
  strategyId?: number   // For editing existing custom strategies
  /** Complete strategies only: which data variable is fed by which timeframe. */
  dataMapping?: DataBinding[]
}

interface SaveData extends CompileData {
  isDraft: boolean
}

interface SaveResult {
  strategyId?: number
  componentId?: number
}

interface CompileResult {
  success: boolean
  message: string
  errors?: CompileError[]
  warnings?: string[]
  strategyId?: number // For complete strategy, return the ID for backtesting
  // Row-indexed per-parameter errors from the backend, if any.
  parameterErrors?: Record<number, string[]>
}

interface CompileError {
  line?: number
  column?: number
  message: string
  type: "error" | "warning"
}

// Deprecated alias for the old flat-shape parameter. Kept so existing
// template code that referenced it still compiles, but the editor now
// operates on ParameterSchema.
type Parameter = ParameterSchema

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

// Custom strategy names become Python class/module identifiers on the backend.
const PYTHON_IDENTIFIER_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/** Coerces free typing into something the identifier check can accept. */
const sanitizeStrategyName = (value: string) =>
  value.replace(/[^a-zA-Z0-9_]/g, "_").replace(/^(\d)/, "_$1")

export function DeveloperModePage({ onBack, onCompile, onSave, onGoToBacktest, onLoadStrategies, onDeleteStrategy, onLoadStrategy, editingComponent, initialStrategyId, initialCodeType, onStrategyLoaded, variant = "fullscreen", onExpand, showBack = true, backLabel = "Back to Strategy Builder", backLeavesPage = false }: DeveloperModePageProps) {
  const [codeType, setCodeType] = useState<"component" | "strategy">("component")
  const [language, setLanguage] = useState<"python" | "pinescript">("python")
  const [componentName, setComponentName] = useState("")
  const [strategyName, setStrategyName] = useState("")
  const [componentType, setComponentType] = useState<"indicator" | "behavior" | "trade_management">("indicator")
  const [parameters, setParameters] = useState<ParameterSchema[]>([
    { name: "period", type: "int", default: 14 }
  ])
  const [parameterRowErrors, setParameterRowErrors] = useState<Record<number, string>>({})
  const [serverParamErrors, setServerParamErrors] = useState<Record<number, string[]>>({})
  // Complete-strategy data files: variable name -> timeframe of the file that
  // fills it. Code strategies declare nothing about their data, so this is what
  // the Strategy Tester turns into upload slots and sends with the backtest.
  const [dataMapping, setDataMapping] = useState<DataBinding[]>(defaultDataMapping)
  const [dataMappingRowErrors, setDataMappingRowErrors] = useState<Record<number, string>>({})
  const [code, setCode] = useState(PYTHON_COMPONENT_TEMPLATE)
  const [isCompiling, setIsCompiling] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null)
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [showComponentTypeDropdown, setShowComponentTypeDropdown] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [compiledStrategyId, setCompiledStrategyId] = useState<number | null>(null)

  // Monaco caches its measured size as inline pixel widths on its own DOM, so
  // collapsing back from fullscreen would otherwise leave the editor stuck at
  // the wider fullscreen size (ANY-308). Force a re-measure on every variant
  // change: shrink to zero first so the flex parents settle at the smaller
  // width, then let Monaco measure the real container.
  const editorRef = useRef<any>(null)
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    editor.layout({ width: 0, height: 0 })
    const frame = requestAnimationFrame(() => editorRef.current?.layout())
    return () => cancelAnimationFrame(frame)
  }, [variant])

  // Unsaved-work guard (ANY-308). `isDirty` is set by user edits only — loading
  // a strategy/component or swapping in a template replaces the buffer wholesale
  // and leaves nothing of the user's to lose, so those clear it instead.
  const [isDirty, setIsDirty] = useState(false)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  // Captured when the dialog opens so the name field can't vanish mid-typing.
  const [leaveNeedsName, setLeaveNeedsName] = useState(false)
  const [leaveNameError, setLeaveNameError] = useState<string | null>(null)
  const [leaveSaveError, setLeaveSaveError] = useState<string | null>(null)


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
      setCodeType("strategy")  // Set code type to strategy
      setCode(strategy.code)
      setStrategyName(strategy.name)
      setDataMapping(loadDataMapping(strategyId) ?? defaultDataMapping())
      setDataMappingRowErrors({})
      setEditingStrategyId(strategyId)
      setCompiledStrategyId(strategyId)
      setShowStrategiesList(false)
      setIsDirty(false)
      setCompileResult({
        success: true,
        message: `Loaded strategy "${strategy.name}". You can edit and recompile.`
      })
      onStrategyLoaded?.(strategyId)
    } catch (error) {
      console.error("Failed to load strategy:", error)
      // Deep links / restored sessions can point at a deleted strategy — fall
      // back to a fresh template instead of leaving stale editor state.
      setCodeType("strategy")
      setCode(PYTHON_STRATEGY_TEMPLATE)
      setStrategyName("")
      setDataMapping(defaultDataMapping())
      setDataMappingRowErrors({})
      setEditingStrategyId(null)
      setCompiledStrategyId(null)
      setIsDirty(false)
      setCompileResult({
        success: false,
        message: "Could not load the strategy (it may have been deleted). Starting from the template.",
        errors: [{ message: String(error), type: "error" }],
      })
    }
  }

  // Load the deep-linked / restored strategy once on mount (ANY-308).
  const initialLoadDoneRef = useRef(false)
  // True while the deep-linked strategy is still in flight. Switching codeType
  // to "strategy" retriggers the template effect below, which would otherwise
  // stamp a blank template into the editor for the length of the fetch.
  const initialStrategyPendingRef = useRef(false)
  useEffect(() => {
    if (initialLoadDoneRef.current) return
    initialLoadDoneRef.current = true
    if (initialCodeType) setCodeType(initialCodeType)
    if (initialStrategyId) {
      initialStrategyPendingRef.current = true
      handleLoadStrategy(initialStrategyId).finally(() => {
        initialStrategyPendingRef.current = false
      })
    }
  }, [])

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
        setDataMapping(defaultDataMapping())
        setDataMappingRowErrors({})
      }
    } catch (error) {
      console.error("Failed to delete strategy:", error)
    }
  }

  // Initialize from editingComponent if provided
  useEffect(() => {
    if (editingComponent) {
      setIsEditing(true)
      setCodeType("component")  // Ensure we're in component mode
      setComponentName(editingComponent.name)
      setLanguage(editingComponent.language as "python" | "pinescript")
      setComponentType(editingComponent.type as "indicator" | "behavior" | "trade_management")
      setCode(editingComponent.code || "")
      
      // Load parameter schema — handles both the new `{parameters: [...]}` shape
      // and the legacy flat `{name: value}` shape saved before this feature.
      const loaded = normalizeStoredParameters(editingComponent.parameters)
      setParameters(loaded.length > 0 ? loaded : [{ name: "period", type: "int", default: 14 }])
      setParameterRowErrors({})
      setServerParamErrors({})
      setIsDirty(false)
    } else {
      // Reset editing state when no component is being edited
      setIsEditing(false)
    }
  }, [editingComponent])

  // Update component template when language or component type changes (only for component code)
  useEffect(() => {
    // Don't load template if we're editing an existing component
    if (!isEditing && !editingComponent && codeType === "component") {
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
  }, [language, componentType, isEditing, codeType, editingComponent])

  // Update strategy template when language changes (only for strategy code)
  useEffect(() => {
    // Don't load template if we're editing an existing component or an
    // existing custom strategy — that would overwrite the loaded code. The
    // pending check covers the gap before a deep-linked strategy arrives, when
    // editingStrategyId is still null but the code is on its way.
    if (
      !isEditing &&
      !editingComponent &&
      editingStrategyId === null &&
      codeType === "strategy" &&
      !initialStrategyPendingRef.current
    ) {
      if (language === "python") {
        setCode(PYTHON_STRATEGY_TEMPLATE)
      } else {
        setCode(PINESCRIPT_STRATEGY_TEMPLATE)
      }
    }
  }, [language, isEditing, codeType, editingComponent, editingStrategyId])

  /**
   * One naming rule shared by compile, save and the leave dialog: a record is
   * only ever persisted under a name the user chose (ANY-308).
   */
  const validateEditorName = (): string | null => {
    if (codeType === "strategy") {
      const name = strategyName.trim()
      if (!name) return "Please enter a strategy name."
      if (!PYTHON_IDENTIFIER_RE.test(name)) {
        return "Strategy name must be a valid Python identifier (letters, numbers and underscores only, cannot start with a number)."
      }
      return null
    }
    if (!componentName.trim()) return "Please enter a component name."
    return null
  }

  const handleCompile = async () => {
    if (!code.trim()) {
      setCompileResult({
        success: false,
        message: "Please enter some code before compiling.",
        errors: [{ message: "No code provided", type: "error" }]
      })
      return
    }

    const nameError = validateEditorName()
    if (nameError) {
      setCompileResult({
        success: false,
        message: nameError,
        errors: [{ message: nameError, type: "error" }]
      })
      return
    }

    // Local parameter-schema validation before we hit the backend.
    if (codeType === "component") {
      const { rowErrors } = validateSchemas(parameters)
      setParameterRowErrors(rowErrors)
      if (Object.keys(rowErrors).length > 0) {
        setCompileResult({
          success: false,
          message: "Fix parameter errors before compiling.",
          errors: Object.values(rowErrors).map((m) => ({ message: m, type: "error" })),
        })
        return
      }
    } else if (!validateDataMappingRows()) {
      return
    }

    setIsCompiling(true)
    setCompileResult(null)
    setCompiledStrategyId(null)
    setServerParamErrors({})

    try {
      const result = await onCompile({
        code,
        codeType,
        language,
        componentName: codeType === "component" ? componentName : undefined,
        strategyName: codeType === "strategy" ? strategyName : undefined,
        componentType: codeType === "component" ? componentType : undefined,
        parameters: codeType === "component" ? parameters : undefined,
        componentId: isEditing && editingComponent ? editingComponent.id : undefined,  // Pass ID when editing
        strategyId: codeType === "strategy" ? (editingStrategyId ?? compiledStrategyId ?? undefined) : undefined,
        dataMapping: codeType === "strategy" ? dataMapping : undefined
      })
      setCompileResult(result)
      setServerParamErrors(result.parameterErrors || {})
      
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

  /** Returns whether the record actually reached the backend. */
  const handleSave = async (isDraft: boolean): Promise<boolean> => {
    const nameError = validateEditorName()
    if (nameError) {
      setCompileResult({
        success: false,
        message: nameError,
        errors: [{ message: nameError, type: "error" }],
      })
      return false
    }
    if (codeType === "component") {
      const { rowErrors } = validateSchemas(parameters)
      setParameterRowErrors(rowErrors)
      if (Object.keys(rowErrors).length > 0) {
        setCompileResult({
          success: false,
          message: "Fix parameter errors before saving.",
          errors: Object.values(rowErrors).map((m) => ({ message: m, type: "error" })),
        })
        return false
      }
    } else if (!validateDataMappingRows("saving")) {
      return false
    }
    setIsSaving(true)
    setServerParamErrors({})
    try {
      const saved = await onSave({
        code,
        codeType,
        language,
        componentName: codeType === "component" ? componentName.trim() : undefined,
        strategyName: codeType === "strategy" ? strategyName.trim() : undefined,
        componentType: codeType === "component" ? componentType : undefined,
        parameters: codeType === "component" ? parameters : undefined,
        componentId: isEditing && editingComponent ? editingComponent.id : undefined,  // Pass ID when editing
        strategyId: codeType === "strategy" ? (editingStrategyId ?? compiledStrategyId ?? undefined) : undefined,
        dataMapping: codeType === "strategy" ? dataMapping : undefined,
        isDraft
      })
      // Adopt the id the backend allotted so the next save updates this record
      // instead of creating a duplicate. Deliberately not `compiledStrategyId`:
      // a saved draft is persisted, not compiled, and must not unlock
      // "Go to Backtesting".
      if (codeType === "strategy" && saved?.strategyId) {
        setEditingStrategyId(saved.strategyId)
      }
      setIsDirty(false)
      if (isDraft) {
        setCompileResult({
          success: true,
          message: isEditing ? "Component updated successfully!" : "Draft saved successfully!"
        })
      }
      return true
    } catch (error) {
      setCompileResult({
        success: false,
        message: "Failed to save.",
        errors: [{ message: String(error), type: "error" }]
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  // Back with unsaved work opens the save/discard dialog rather than silently
  // dropping the edits (ANY-308).
  const requestBack = () => {
    if (!isDirty || !backLeavesPage) {
      onBack()
      return
    }
    setLeaveNeedsName(validateEditorName() !== null)
    setLeaveNameError(null)
    setLeaveSaveError(null)
    setShowUnsavedModal(true)
  }

  const handleSaveAndLeave = async () => {
    const nameError = validateEditorName()
    if (nameError) {
      setLeaveNameError(nameError)
      return
    }
    setLeaveNameError(null)
    setLeaveSaveError(null)
    if (!(await handleSave(true))) {
      // Stay put: the edits are still in the editor and the output panel has
      // the reason.
      setLeaveSaveError("Could not save — see the output panel for details. Your changes are still here.")
      return
    }
    setShowUnsavedModal(false)
    onBack()
  }

  const handleDiscardAndLeave = () => {
    setIsDirty(false)
    setShowUnsavedModal(false)
    onBack()
  }

  /**
   * Blocks compile/save on a malformed mapping — a bad row would otherwise
   * only surface as a missing dataset once the backtest is already running.
   */
  const validateDataMappingRows = (action: "compiling" | "saving" = "compiling"): boolean => {
    const { rowErrors, globalErrors } = validateDataMapping(dataMapping)
    setDataMappingRowErrors(rowErrors)
    const messages = [...Object.values(rowErrors), ...globalErrors]
    if (messages.length === 0) return true
    setCompileResult({
      success: false,
      message: `Fix the data files before ${action}.`,
      errors: messages.map((m) => ({ message: m, type: "error" })),
    })
    return false
  }

  const addDataBinding = () => {
    // Next unused preset, so a second row doesn't silently duplicate the first.
    const used = new Set(dataMapping.map((row) => row.timeframe))
    const timeframe = DATA_TIMEFRAME_OPTIONS.find((o) => !used.has(o.value))?.value ?? "1h"
    setDataMapping([...dataMapping, { name: "", timeframe }])
    setIsDirty(true)
  }

  const updateDataBinding = (index: number, patch: Partial<DataBinding>) => {
    setDataMapping(dataMapping.map((row, i) => (i === index ? { ...row, ...patch } : row)))
    setIsDirty(true)
    if (dataMappingRowErrors[index]) {
      const next = { ...dataMappingRowErrors }
      delete next[index]
      setDataMappingRowErrors(next)
    }
  }

  const removeDataBinding = (index: number) => {
    setDataMapping(dataMapping.filter((_, i) => i !== index))
    setIsDirty(true)
    setDataMappingRowErrors({})
  }

  const addParameter = () => {
    setParameters([...parameters, { name: "", type: "int", default: 0 }])
    setIsDirty(true)
  }

  const updateParameter = (index: number, patch: Partial<ParameterSchema>) => {
    const newParams = [...parameters]
    newParams[index] = { ...newParams[index], ...patch }
    setParameters(newParams)
    setIsDirty(true)
    // Any local edit invalidates the previous server error for this row.
    if (serverParamErrors[index]) {
      const next = { ...serverParamErrors }
      delete next[index]
      setServerParamErrors(next)
    }
  }

  const changeParameterType = (index: number, type: ParameterType) => {
    const cur = parameters[index]
    let def: number | string | boolean = cur.default
    if (type === "int") def = Number.isFinite(Number(cur.default)) ? Math.trunc(Number(cur.default)) : 0
    else if (type === "float") def = Number.isFinite(Number(cur.default)) ? Number(cur.default) : 0
    else if (type === "bool") def = typeof cur.default === "boolean" ? cur.default : String(cur.default) === "true"
    else if (type === "select") def = (cur.options && cur.options[0]) || ""
    else if (type === "source") def = OHLCV_SOURCES.includes(String(cur.default)) ? String(cur.default) : "Close"
    else def = String(cur.default ?? "")
    updateParameter(index, {
      type,
      default: def,
      min: type === "int" || type === "float" ? cur.min : undefined,
      max: type === "int" || type === "float" ? cur.max : undefined,
      step: type === "int" || type === "float" ? cur.step : undefined,
      options: type === "select" ? (cur.options && cur.options.length ? cur.options : [""]) : undefined,
    })
  }

  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index))
    setIsDirty(true)
    const next: Record<number, string[]> = {}
    Object.entries(serverParamErrors).forEach(([k, v]) => {
      const i = parseInt(k, 10)
      if (i < index) next[i] = v
      else if (i > index) next[i - 1] = v
    })
    setServerParamErrors(next)
  }

  // Get Monaco language based on selected language
  const getMonacoLanguage = () => {
    return language === "python" ? "python" : "javascript" // PineScript is similar to JS syntax
  }

  return (
    <div className={`${variant === "inline" ? "h-full" : "h-screen"} bg-[#141721] flex flex-col overflow-hidden`}>
      {/* Header */}
      <div className="bg-[#1A1D24] border-b border-[#2A2D42] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {(variant === "fullscreen" || showBack) && (
              <button
                onClick={requestBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>{backLabel}</span>
              </button>
            )}
            {variant === "inline" && (
              <button
                onClick={onExpand}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                title="Expand to fullscreen"
              >
                <Maximize2 className="w-5 h-5" />
                <span>Expand</span>
              </button>
            )}
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
        {/* Left Sidebar - Configuration. Fullscreen can afford a fixed 320px;
            inline has far less room, so it takes a share of the container
            instead — keeping roughly the fullscreen config/editor split rather
            than eating the code area. Clamped so it stays usable on narrow
            screens and never exceeds the fullscreen width. */}
        <div className={`${variant === "inline" ? "w-[22%] min-w-[200px] max-w-80 p-4" : "w-80 p-6"} bg-[#1A1D24] border-r border-[#2A2D42] overflow-y-auto flex-shrink-0`}>
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
                  setStrategyName(sanitizeStrategyName(e.target.value))
                  setIsDirty(true)
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
                  onChange={(e) => { setComponentName(e.target.value); setIsDirty(true) }}
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
                  {parameters.map((param, index) => {
                    const localErr = parameterRowErrors[index]
                    const serverErrs = serverParamErrors[index]
                    const isNumeric = param.type === "int" || param.type === "float"
                    const defaultInputType =
                      param.type === "int" || param.type === "float"
                        ? "number"
                        : param.type === "bool"
                        ? "checkbox"
                        : "text"
                    return (
                      <div
                        key={index}
                        className={`p-3 bg-[#151718] rounded-lg border ${
                          localErr || serverErrs ? "border-red-500/60" : "border-[#2A2D42]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-500">Parameter {index + 1}</span>
                          <button
                            onClick={() => removeParameter(index)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input
                            type="text"
                            value={param.name}
                            onChange={(e) => updateParameter(index, { name: e.target.value })}
                            placeholder="name (e.g., period)"
                            className="px-3 py-2 bg-[#0D0F12] border border-[#2A2D42] rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#85e1fe]"
                          />
                          <select
                            value={param.type}
                            onChange={(e) => changeParameterType(index, e.target.value as ParameterType)}
                            className="px-3 py-2 bg-[#0D0F12] border border-[#2A2D42] rounded text-white text-sm focus:outline-none focus:border-[#85e1fe]"
                          >
                            <option value="int">int</option>
                            <option value="float">float</option>
                            <option value="bool">bool</option>
                            <option value="string">string</option>
                            <option value="select">select</option>
                            <option value="source">source (OHLCV)</option>
                          </select>
                        </div>

                        {/* Default value — stacked layout so number inputs can't
                            overflow the narrow sidebar regardless of browser
                            min-width quirks. */}
                        <div className="mb-2">
                          <span className="block text-xs text-gray-500 mb-1">Default</span>
                          {param.type === "bool" ? (
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!param.default}
                                onChange={(e) => updateParameter(index, { default: e.target.checked })}
                                className="w-4 h-4 accent-[#85e1fe]"
                              />
                              <span className="text-xs text-gray-400">{param.default ? "true" : "false"}</span>
                            </label>
                          ) : param.type === "select" ? (
                            <select
                              value={String(param.default ?? "")}
                              onChange={(e) => updateParameter(index, { default: e.target.value })}
                              className="w-full min-w-0 px-3 py-2 bg-[#0D0F12] border border-[#2A2D42] rounded text-white text-sm focus:outline-none focus:border-[#85e1fe]"
                            >
                              {(param.options ?? []).map((opt, i) => (
                                <option key={`${opt}-${i}`} value={opt}>{opt || "(empty)"}</option>
                              ))}
                            </select>
                          ) : param.type === "source" ? (
                            <select
                              value={String(param.default ?? "Close")}
                              onChange={(e) => updateParameter(index, { default: e.target.value })}
                              className="w-full min-w-0 px-3 py-2 bg-[#0D0F12] border border-[#2A2D42] rounded text-white text-sm focus:outline-none focus:border-[#85e1fe]"
                            >
                              {OHLCV_SOURCES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={defaultInputType}
                              value={String(param.default ?? "")}
                              onChange={(e) =>
                                updateParameter(index, { default: coerceDefault(param.type, e.target.value) })
                              }
                              placeholder={param.type === "int" ? "14" : param.type === "float" ? "1.5" : "text"}
                              className="w-full min-w-0 px-3 py-2 bg-[#0D0F12] border border-[#2A2D42] rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#85e1fe]"
                            />
                          )}
                        </div>

                        {/* Numeric bounds — all optional */}
                        {isNumeric && (
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            <input
                              type="number"
                              value={param.min ?? ""}
                              onChange={(e) => {
                                const v = e.target.value
                                updateParameter(index, { min: v === "" ? undefined : Number(v) })
                              }}
                              placeholder="min (optional)"
                              className="min-w-0 px-2 py-1.5 bg-[#0D0F12] border border-[#2A2D42] rounded text-white text-[10px] placeholder-gray-500 focus:outline-none focus:border-[#85e1fe]"
                            />
                            <input
                              type="number"
                              value={param.max ?? ""}
                              onChange={(e) => {
                                const v = e.target.value
                                updateParameter(index, { max: v === "" ? undefined : Number(v) })
                              }}
                              placeholder="max (optional)"
                              className="min-w-0 px-2 py-1.5 bg-[#0D0F12] border border-[#2A2D42] rounded text-white text-[10px] placeholder-gray-500 focus:outline-none focus:border-[#85e1fe]"
                            />
                            <input
                              type="number"
                              value={param.step ?? ""}
                              onChange={(e) => {
                                const v = e.target.value
                                updateParameter(index, { step: v === "" ? undefined : Number(v) })
                              }}
                              placeholder="step (optional)"
                              className="min-w-0 px-2 py-1.5 bg-[#0D0F12] border border-[#2A2D42] rounded text-white text-[10px] placeholder-gray-500 focus:outline-none focus:border-[#85e1fe]"
                            />
                          </div>
                        )}

                        {/* Select options editor */}
                        {param.type === "select" && (
                          <div className="mb-2">
                            <div className="text-xs text-gray-500 mb-1">Options</div>
                            <textarea
                              rows={2}
                              value={(param.options ?? []).join("\n")}
                              onChange={(e) => {
                                const opts = e.target.value.split(/\n/).map((s) => s.trim()).filter(Boolean)
                                const patch: Partial<ParameterSchema> = { options: opts }
                                if (!opts.includes(String(param.default))) {
                                  patch.default = opts[0] ?? ""
                                }
                                updateParameter(index, patch)
                              }}
                              placeholder={"one per line\nsma\nema\nwma"}
                              className="w-full px-3 py-2 bg-[#0D0F12] border border-[#2A2D42] rounded text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#85e1fe]"
                            />
                          </div>
                        )}

                        <input
                          type="text"
                          value={param.description ?? ""}
                          onChange={(e) => updateParameter(index, { description: e.target.value || undefined })}
                          placeholder="Description (optional)"
                          className="w-full px-3 py-2 mb-2 bg-[#0D0F12] border border-[#2A2D42] rounded text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#85e1fe]"
                        />

                        <label className="inline-flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!param.optimizable}
                            onChange={(e) => updateParameter(index, { optimizable: e.target.checked })}
                            className="w-3.5 h-3.5 accent-[#85e1fe]"
                          />
                          Optimizable
                        </label>

                        {(localErr || serverErrs) && (
                          <div className="mt-2 text-xs text-red-400 space-y-0.5">
                            {localErr && <div>{localErr}</div>}
                            {serverErrs?.map((m, i) => <div key={i}>{m}</div>)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* Data Files (only for strategy type) — the declaration the code
              can't make for itself: which dataset the backtest loads into which
              variable. Sent with the backtest so the backend fills each one
              from the file uploaded for that timeframe. */}
          {codeType === "strategy" && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-400">Data Files</label>
                <button
                  onClick={addDataBinding}
                  className="text-xs text-[#85e1fe] hover:text-[#5AB9D1] transition-colors"
                >
                  + Add File
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Name each dataset your code reads and pick the timeframe of the file that fills it.
              </p>

              <div className="p-3 bg-[#151718] rounded-lg border border-[#2A2D42]">
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-1.5 text-[10px] uppercase tracking-wide text-gray-500">
                  <span>Variable</span>
                  <span>Timeframe</span>
                  <span className="w-5" />
                </div>

                <div className="space-y-2">
                  {dataMapping.map((row, index) => {
                    const rowError = dataMappingRowErrors[index]
                    // Also true for an empty timeframe: that is the state
                    // "Custom…" leaves the row in, waiting for the text input.
                    const custom = !isPresetTimeframe(row.timeframe)
                    return (
                      <div key={index}>
                        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) => updateDataBinding(index, { name: e.target.value.trim() })}
                            placeholder="data"
                            className={`min-w-0 px-2 py-2 bg-[#0D0F12] border rounded text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#85e1fe] ${
                              rowError ? "border-red-500/60" : "border-[#2A2D42]"
                            }`}
                          />
                          <select
                            value={custom ? "__custom__" : row.timeframe}
                            onChange={(e) => {
                              const value = e.target.value
                              // "Custom…" empties the row so the text input
                              // below takes over; anything else is a preset.
                              updateDataBinding(index, {
                                timeframe: value === "__custom__" ? "" : value,
                              })
                            }}
                            className={`min-w-0 px-2 py-2 bg-[#0D0F12] border rounded text-white text-xs focus:outline-none focus:border-[#85e1fe] ${
                              rowError ? "border-red-500/60" : "border-[#2A2D42]"
                            }`}
                          >
                            {DATA_TIMEFRAME_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.value}</option>
                            ))}
                            <option value="__custom__">Custom…</option>
                          </select>
                          <button
                            onClick={() => removeDataBinding(index)}
                            className="text-gray-500 hover:text-red-400 transition-colors p-0.5"
                            title="Remove data file"
                            aria-label={`Remove data file ${index + 1}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {custom && (
                          <input
                            type="text"
                            value={row.timeframe}
                            onChange={(e) => updateDataBinding(index, { timeframe: e.target.value.trim() })}
                            placeholder="e.g. 36min"
                            className="w-full mt-2 px-2 py-2 bg-[#0D0F12] border border-[#2A2D42] rounded text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#85e1fe]"
                          />
                        )}

                        {rowError && <p className="mt-1 text-xs text-red-400">{rowError}</p>}
                      </div>
                    )
                  })}

                  {dataMapping.length === 0 && (
                    <p className="text-xs text-gray-500 py-1">
                      No data files yet — add one so the backtest knows what to load.
                    </p>
                  )}
                </div>

                {dataMapping.length > 0 && (
                  <p className="mt-3 pt-3 border-t border-[#2A2D42] text-[11px] text-gray-500">
                    The Strategy Tester will ask for {dataMappingTimeframes(dataMapping).length} file
                    {dataMappingTimeframes(dataMapping).length === 1 ? "" : "s"}:{" "}
                    {dataMappingTimeframes(dataMapping).join(", ")}
                  </p>
                )}
              </div>
            </div>
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

        {/* Right Side - Code Editor. `min-w-0` keeps Monaco's inline pixel width
            from setting this column's minimum size — without it the editor can
            never shrink back after being laid out at fullscreen width. */}
        <div className="flex-1 min-w-0 flex flex-col">
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
          <div className="flex-1 min-w-0 overflow-hidden">
            <MonacoEditor
              height="100%"
              width="100%"
              onMount={(editor) => { editorRef.current = editor }}
              language={getMonacoLanguage()}
              value={code}
              onChange={(value) => { setCode(value || ""); setIsDirty(true) }}
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

      {showUnsavedModal && (
        <UnsavedChangesModal
          kind={codeType === "strategy" ? "strategy" : "component"}
          needsName={leaveNeedsName}
          name={codeType === "strategy" ? strategyName : componentName}
          onNameChange={(value) => {
            if (codeType === "strategy") setStrategyName(sanitizeStrategyName(value))
            else setComponentName(value)
            setLeaveNameError(null)
          }}
          nameError={leaveNameError}
          saveError={leaveSaveError}
          isSaving={isSaving}
          onSave={handleSaveAndLeave}
          onDiscard={handleDiscardAndLeave}
          onCancel={() => setShowUnsavedModal(false)}
        />
      )}
    </div>
  )
}