# Error Handling Fix Summary

## Problem
When optimization failed, the application was showing "Waiting for optimisation result..." instead of displaying the actual error message. The error details (stderr, stdout) were available in the response but not being properly displayed to the user.

## Root Cause
The `PreviousOptimisationView` component was checking only for the presence of `previewRows` (optimization results), without checking if the optimization had failed. When an optimization failed, `previewRows` was empty, so it showed the "waiting" message instead of checking for error information.

## Solution

### 1. Enhanced Error Extraction (`lib/error-utils.ts`)
- **Fixed priority order**: Now checks `stderr` and `error_message` before checking `message`
- **Smart filtering**: Skips success messages like "Optimisation completed" when looking for errors
- **Better extraction**: Extracts clean error messages from AssertionError stack traces

**Example:**
```typescript
// Before: Would extract "Optimisation completed."
// After: Extracts "Invalid value: For Buy side, SL must be < 1..."
const errorMsg = extractErrorMessage(errorResponse)
```

### 2. Created Reusable Error Display Component (`components/optimization-error-display.tsx`)
- Displays structured error with title, message, and contextual help
- Technical details (stdout/stderr) are hidden by default but accessible via collapsible section
- Detects error types and provides specific guidance

**Error Types Detected:**
- **SL/TP Configuration Errors**: "Invalid Stop Loss / Take Profit Configuration"
- **MetaAPI Errors**: "MetaAPI Connection Error"
- **Timeout Errors**: "Optimization Timeout"
- **Parameter Errors**: "Parameter Configuration Error"

### 3. Updated PreviousOptimisationView Component
**Added error detection:**
```typescript
const hasError = selectedResult.stderr || selectedResult.error || selectedResult.error_message
const errorMessage = selectedResult.message
const errorStdout = selectedResult.stdout
const errorStderr = selectedResult.stderr
```

**Updated all tabs (Results, Graph, Report):**
- Check for errors before showing "Waiting for optimisation result..."
- Display `OptimizationErrorDisplay` component when errors are present
- Show clean, actionable error messages with helpful guidance

### 4. Updated Main Testing Page (`app/strategy-testing/page.tsx`)
- Replaced verbose error display with `OptimizationErrorDisplay` component
- Updated toast messages to use `formatErrorForDisplay()`
- Applied to both droplet and regular optimization flows

### 5. Enhanced Job Status Modal (`components/optimization-job-status.tsx`)
- Uses `extractOptimizationError()` to structure error information
- Displays error with title, message, and details
- Improved visual presentation with icons

## User Experience Improvements

### Before:
```
Modal Title: "Previous Optimisations"
Content: "Waiting for optimisation result..."
(Error hidden in background, not visible to user)
```

### After:
```
Modal Title: "Previous Optimisations"

┌─────────────────────────────────────────────────────┐
│ ⚠️ Invalid Stop Loss / Take Profit Configuration   │
│                                                      │
│ Invalid value: For Buy side, SL must be < 1 and    │
│ TP must be > 1; for Sell side, SL must be > 1      │
│ and TP must be < 1. Current: SL=Entry_Price-100    │
│                                                      │
│ ℹ️ Please check your SL/TP settings in the         │
│    strategy configuration.                          │
│                                                      │
│ ▼ Technical Details (Click to expand)               │
└─────────────────────────────────────────────────────┘
```

## Files Modified

1. **Created:**
   - `lib/error-utils.ts` - Error parsing and extraction utilities
   - `components/optimization-error-display.tsx` - Reusable error display component
   - `ERROR_DISPLAY_IMPROVEMENTS.md` - Full documentation

2. **Updated:**
   - `components/PreviousOptimisationView.tsx` - Added error handling to all tabs
   - `components/optimization-job-status.tsx` - Enhanced error display in modal
   - `app/strategy-testing/page.tsx` - Updated error handling and display

## Testing

To verify the fix:

1. **Create an optimization with invalid SL/TP**:
   - Set SL to `Entry_Price-100` (invalid format)
   - Run optimization
   - Expected: Clean error message with helpful guidance

2. **Check all tabs**:
   - Results tab: Shows error
   - Graph tab: Shows error (if no plots available)
   - Report tab: Shows error (if no data available)

3. **Verify technical details**:
   - Click "Technical Details" to expand
   - Verify stdout/stderr are still accessible for debugging

## Benefits

✅ **User-Friendly**: Clean, actionable error messages instead of stack traces  
✅ **Contextual Help**: Specific guidance for each error type  
✅ **Debug-Friendly**: Technical details still accessible via collapsible section  
✅ **Consistent**: Centralized error handling across the application  
✅ **Maintainable**: Single source of truth for error parsing logic  
✅ **No More "Waiting"**: Users immediately see what went wrong

## Example: Your Original Error

**API Response:**
```json
{
  "message": "Optimisation completed.",
  "stderr": "AssertionError: Invalid value: For Buy side, SL must be < 1 and TP must be > 1; for Sell side, SL must be > 1 and TP must be < 1. Current: SL=Entry_Price-100"
}
```

**Before Fix:**
- Modal showed: "Waiting for optimisation result..."
- User had no idea what went wrong

**After Fix:**
- **Title**: Invalid Stop Loss / Take Profit Configuration
- **Message**: Invalid value: For Buy side, SL must be < 1 and TP must be > 1; for Sell side, SL must be > 1 and TP must be < 1. Current: SL=Entry_Price-100
- **Help**: Please check your SL/TP settings in the strategy configuration.
- **Technical Details**: Available in collapsible section

## Next Steps

1. Test with various error types (MetaAPI errors, timeout errors, etc.)
2. Consider adding error reporting/logging functionality
3. Add more specific error type handlers as new patterns are discovered
4. Consider i18n support for error messages

