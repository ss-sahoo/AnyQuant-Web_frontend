# MetaAPI Debugging & Error Handling Guide

## 🎯 Overview

This guide explains the comprehensive MetaAPI debugging system integrated into the AnyQuant platform. The system automatically detects MetaAPI errors and provides an interactive debugging interface to help users resolve issues.

## 🚀 Features

### 1. **Automatic Error Detection**
The system automatically detects MetaAPI-related errors in:
- ✅ Backtests
- ✅ Optimizations
- ✅ Walk-Forward Optimizations
- ✅ Droplet Optimization Jobs

### 2. **Interactive Debug Modal**
When a MetaAPI error occurs, users see a comprehensive debug modal with:
- 📋 **Error Analysis**: Smart detection of error type and root cause
- 💡 **Suggested Solutions**: Actionable recommendations
- 🔧 **Debug Tools**: One-click buttons to diagnose issues
- 📊 **Real-time Results**: Instant feedback from debugging APIs

### 3. **Available Debugging Tools**

#### 🔍 Find Symbols
- **Purpose**: Discover which symbols are available on your broker
- **Use Case**: When you get "Symbol XAUUSD not found" errors
- **Features**:
  - Filters for Gold/Silver symbols automatically
  - Shows Forex major pairs
  - One-click copy to clipboard
  - Displays symbol descriptions

#### ⚡ Check Timeframes
- **Purpose**: See which timeframes are available for your symbol
- **Use Case**: When you get "timeframe not available" errors
- **Features**:
  - Tests all standard timeframes (1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w, 1M)
  - Shows success rate
  - Displays data point counts
  - Shows date ranges for available timeframes
  - Visual indicators (✅ available, ❌ unavailable)

#### ✔️ Validate Strategy
- **Purpose**: Comprehensive validation of your entire strategy
- **Use Case**: Before running backtests to catch issues early
- **Features**:
  - Checks account connection
  - Verifies symbol availability
  - Validates all required timeframes
  - Suggests alternative symbols
  - Provides step-by-step recommendations

## 📝 Common Error Scenarios

### Error 1: Symbol Not Found

**Example Error:**
```
❌ Symbol XAUUSD not found on your broker
```

**What It Means:**
Your broker doesn't have a symbol named "XAUUSD" - they use a different name for Gold.

**Solution:**
1. Click **"Find Symbols"** in the debug modal
2. Look for Gold in the "Gold & Silver Symbols" section
3. Copy the correct symbol name (e.g., "XAUUSD.a" or "GOLD")
4. Update your MetaAPI configuration with the new symbol
5. Run your backtest again

**Common Symbol Variations:**
- `XAUUSD` → `XAUUSD.a` (Pepperstone, IC Markets)
- `XAUUSD` → `GOLD` (some brokers)
- `EURUSD` → `EURUSD.a` or `EURUSDm`

---

### Error 2: Timeframe Not Available

**Example Error:**
```
❌ All methods failed to fetch candles for timeframe 1h
```

**What It Means:**
Your broker doesn't provide 1-hour data for this symbol, OR the symbol name is incorrect.

**Solution Steps:**

**Step 1: Verify Symbol Name**
1. Click **"Find Symbols"** to confirm the symbol exists
2. If symbol is wrong, copy the correct one and update config

**Step 2: Check Available Timeframes**
1. Click **"Check Timeframes"** 
2. Review the "Available Timeframes" list
3. Note which timeframes work (e.g., 4h, 1d)

**Step 3: Update Your Strategy**
- **Option A**: Change your strategy to use an available timeframe
- **Option B**: Switch to a different symbol that supports 1h

**Typical Availability by Asset:**
- **Forex Major Pairs**: Usually 1m, 5m, 15m, 30m, 1h, 4h, 1d
- **Gold/Metals**: Often 15m, 30m, 1h, 4h, 1d (depends on broker)
- **Crypto**: Varies widely by broker

---

### Error 3: Connection Issues

**Example Error:**
```
❌ Failed to connect to MetaAPI or timeout
```

**What It Means:**
- MetaAPI account might not be deployed
- Account might be offline
- Network timeout

**Solution:**
1. Check your MetaAPI dashboard: https://app.metaapi.cloud/
2. Ensure your account status is **"DEPLOYED"**
3. Verify connection status is **"CONNECTED"**
4. Wait a few minutes and retry
5. Check your internet connection

---

## 🔧 API Endpoints Used

The debug modal uses these backend APIs:

### 1. Get All Broker Symbols
```javascript
POST /api/get-all-broker-symbols/

Request:
{
  "metaapi_token": "your_token",
  "metaapi_account_id": "your_account_id",
  "filter": "XAU"  // Optional: filter results
}

Response:
{
  "status": "success",
  "results": {
    "total_symbols": 250,
    "gold_silver_symbols": [...],
    "forex_major_symbols": [...],
    "all_symbols": [...]
  }
}
```

### 2. Get Symbol Timeframes
```javascript
POST /api/get-symbol-timeframes/

Request:
{
  "metaapi_token": "your_token",
  "metaapi_account_id": "your_account_id",
  "symbol": "EURUSD"
}

Response:
{
  "status": "success",
  "results": {
    "symbol": "EURUSD",
    "available_timeframes": ["5m", "15m", "1h", "4h", "1d"],
    "unavailable_timeframes": ["1m", "2h", "1w"],
    "detailed_results": {
      "1h": {
        "available": true,
        "data_points": 72,
        "date_range": {...}
      }
    }
  }
}
```

### 3. Validate Strategy
```javascript
POST /api/validate-strategy-metaapi/

Request:
{
  "statement": "JSON.stringify(strategy)",
  "metaapi_token": "your_token",
  "metaapi_account_id": "your_account_id",
  "symbol": "EURUSD"
}

Response:
{
  "status": "success" | "failed",
  "validation_results": {
    "symbol": "EURUSD",
    "required_timeframes": ["1h"],
    "tests": {
      "account_connection": {...},
      "symbol_availability": {...},
      "strategy_validation": {...}
    },
    "recommendation": [
      "✅ Strategy is ready for backtesting!",
      "Or specific issues to fix..."
    ],
    "alternative_symbols_suggestion": ["EURUSD", "GBPUSD"]
  }
}
```

### 4. Find Symbols With Timeframe
```javascript
POST /api/find-symbols-with-timeframe/

Request:
{
  "metaapi_token": "your_token",
  "metaapi_account_id": "your_account_id",
  "timeframe": "1h",
  "symbols": ["XAUUSD.a", "EURUSD", "GBPUSD"]
}

Response:
{
  "status": "success",
  "results": {
    "symbols_with_data": [
      {
        "symbol": "EURUSD",
        "data_points": 72,
        "date_range": {...}
      }
    ],
    "symbols_without_data": [
      {
        "symbol": "XAUUSD.a",
        "reason": "No data available"
      }
    ]
  }
}
```

---

## 🎨 UI Components

### MetaAPIDebugModal Component

**Location**: `/components/metaapi-debug-modal.tsx`

**Props**:
```typescript
interface MetaAPIDebugModalProps {
  isOpen: boolean
  onClose: () => void
  error: {
    message: string
    details?: any
    symbol?: string
    timeframes?: string[]
  }
  metaAPIConfig: {
    token: string
    accountId: string
    symbol: string
  }
}
```

**Features**:
- 🎨 Modern, dark-themed UI
- 📱 Fully responsive (mobile & desktop)
- 🔄 Real-time API calls with loading states
- 📋 Copy-to-clipboard functionality
- 🎯 Context-aware error analysis
- 💡 Smart recommendations

---

## 🔄 Integration Points

The debug modal is automatically triggered in these scenarios:

### 1. Backtest Errors
```typescript
try {
  result = await runBacktestWithMetaAPI(...)
} catch (error) {
  if (isMetaAPIError) {
    setMetaAPIError({ ... })
    setShowMetaAPIDebugModal(true)
  }
}
```

### 2. Optimization Errors
```typescript
try {
  result = await runOptimisation(...)
} catch (error) {
  if (isMetaAPIError) {
    // Show debug modal
  }
}
```

### 3. Walk-Forward Optimization Errors
```typescript
try {
  result = await runWalkForwardOptimisation(...)
} catch (error) {
  if (isMetaAPIError) {
    // Show debug modal
  }
}
```

### 4. Droplet Job Errors
```typescript
try {
  result = await createOptimizationJob(...)
} catch (error) {
  if (isMetaAPIError) {
    // Show debug modal
  }
}
```

---

## 🛠️ Error Detection Logic

The system detects MetaAPI errors using pattern matching:

```typescript
const isMetaAPIError = useMetaAPI && metaAPIConfig && (
  errorMessage.toLowerCase().includes("symbol") ||
  errorMessage.toLowerCase().includes("timeframe") ||
  errorMessage.toLowerCase().includes("metaapi") ||
  errorMessage.toLowerCase().includes("candles") ||
  errorMessage.toLowerCase().includes("broker")
)
```

When detected, it extracts:
- ✅ Error message
- ✅ Current symbol
- ✅ Required timeframes from strategy
- ✅ Full error details

---

## 📊 Debugging Workflow

### Recommended Debugging Steps:

```
1. Error Occurs
   ↓
2. Debug Modal Opens Automatically
   ↓
3. Read Error Analysis & Suggested Solution
   ↓
4. Click "Find Symbols" or "Check Timeframes"
   ↓
5. Review Results
   ↓
6. Copy Correct Symbol Name
   ↓
7. Update MetaAPI Config
   ↓
8. Close Modal & Retry
   ↓
9. Success! ✅
```

---

## 💡 Best Practices

### For Users:

1. **Always Start with Symbol Check**
   - Click "Find Symbols" first to verify your broker's symbol names
   - Don't assume standard names like "XAUUSD" will work

2. **Check Timeframes Before Creating Strategy**
   - Use "Check Timeframes" to see what's available
   - Design your strategy around available timeframes

3. **Use Validation**
   - Click "Validate Strategy" before running expensive optimizations
   - Fix issues early to save time and credits

4. **Keep Error Messages**
   - Copy error details if you need support
   - Use the detailed error view for troubleshooting

### For Developers:

1. **Error Handling**
   - Always wrap MetaAPI calls in try-catch
   - Use the standardized error detection logic
   - Pass full error context to the debug modal

2. **User Experience**
   - Show loading states during debug API calls
   - Provide copy-to-clipboard for symbol names
   - Keep error messages user-friendly

3. **Performance**
   - Cache symbol lists when possible
   - Use filters to reduce API response sizes
   - Implement timeouts for long-running requests

---

## 🐛 Troubleshooting the Debug System

### Modal Doesn't Show

**Check:**
1. Is `useMetaAPI` set to `true`?
2. Is `metaAPIConfig` populated?
3. Does the error message contain MetaAPI keywords?
4. Check browser console for JavaScript errors

### Debug API Calls Fail

**Check:**
1. MetaAPI credentials are valid
2. Backend endpoints are accessible
3. Network connectivity
4. CORS settings (if applicable)
5. Rate limiting on MetaAPI

### Incorrect Symbol Suggestions

**Check:**
1. Filter parameter in `getAllBrokerSymbols`
2. Broker account has correct symbols
3. Account is deployed and connected
4. Try without filter to see all symbols

---

## 📚 Additional Resources

- **MetaAPI Docs**: https://metaapi.cloud/docs/
- **Backend API Docs**: See `DEPLOYMENT_METAAPI_GUIDE.md`
- **Support**: Contact your platform admin

---

## 🎉 Summary

The MetaAPI debugging system provides:

✅ **Automatic error detection** - No manual debugging needed
✅ **Interactive tools** - One-click diagnosis and solutions
✅ **Clear guidance** - Step-by-step recommendations
✅ **Real-time validation** - Test before you run
✅ **Better UX** - Less frustration, faster resolution

**Result**: Users can self-diagnose and fix MetaAPI issues in minutes instead of hours!

---

**Created**: $(date +%Y-%m-%d)
**Version**: 1.0.0
**Last Updated**: $(date +%Y-%m-%d)





