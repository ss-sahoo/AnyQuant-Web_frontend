# Error Display Improvements

## Overview
Enhanced error message display throughout the AnyQuant frontend to show clean, user-friendly error messages instead of verbose stack traces.

## Changes Made

### 1. Error Utility Library (`lib/error-utils.ts`)
Created a comprehensive utility library for parsing and formatting error messages:

- **`extractErrorMessage(errorData)`**: Extracts clean error messages from various API response formats
- **`cleanErrorMessage(message)`**: Cleans raw error messages by extracting the most relevant information
- **`formatErrorForDisplay(errorData, defaultMessage)`**: Formats errors for UI display
- **`extractOptimizationError(errorData)`**: Extracts structured optimization errors with context

#### Key Features:
- Extracts `AssertionError` messages from Python stack traces
- Identifies specific error types (SL/TP errors, MetaAPI errors, timeout errors, parameter errors)
- Provides contextual help messages for common errors
- Handles multiple error response formats (message, error, error_message, stderr, stdout)

### 2. Optimization Error Display Component (`components/optimization-error-display.tsx`)
Created a reusable component for displaying optimization errors:

- **Main Error Card**: Shows structured error with title, message, and contextual help
- **Technical Details (Collapsible)**: Hides verbose stdout/stderr by default, expandable for debugging
- **Visual Indicators**: Uses icons and color coding for better UX
- **Responsive Design**: Handles long error messages with proper text wrapping

### 3. Optimization Job Status Component Updates (`components/optimization-job-status.tsx`)
Enhanced the job status modal to display cleaner error messages:

- Integrated `extractOptimizationError()` to parse error messages
- Shows structured error with title, message, and details
- Improved visual presentation with icons and better layout

### 4. Strategy Testing Page Updates (`app/strategy-testing/page.tsx`)
Updated main testing page to use the new error utilities:

- Imported `extractErrorMessage` and `formatErrorForDisplay`
- Updated error toast messages to show clean errors
- Replaced verbose error display with `OptimizationErrorDisplay` component
- Applied to both droplet optimization and regular optimization flows

## Error Types Handled

### 1. Stop Loss / Take Profit Configuration Errors
**Original:**
```
AssertionError: Invalid value: For Buy side, SL must be < 1 and TP must be > 1; for Sell side, SL must be > 1 and TP must be < 1. Current: SL=Entry_Price-100
```

**New Display:**
- **Title**: "Invalid Stop Loss / Take Profit Configuration"
- **Message**: "Invalid value: For Buy side, SL must be < 1 and TP must be > 1..."
- **Details**: "Please check your SL/TP settings in the strategy configuration."

### 2. MetaAPI Errors
- **Title**: "MetaAPI Connection Error"
- **Details**: "Please verify your MetaAPI credentials and account status."

### 3. Timeout Errors
- **Title**: "Optimization Timeout"
- **Details**: "The optimization took too long to complete. Try reducing the population size or generations."

### 4. Parameter Configuration Errors
- **Title**: "Parameter Configuration Error"
- **Details**: "Please review your optimization parameters."

## Example Usage

### In Components:
```tsx
import { OptimizationErrorDisplay } from '@/components/optimization-error-display'

<OptimizationErrorDisplay
  message={optimisationMessage}
  stdout={optimisationStdout}
  stderr={optimisationStderr}
  className="mb-4"
/>
```

### In Error Handlers:
```tsx
import { formatErrorForDisplay } from '@/lib/error-utils'

const errorMsg = formatErrorForDisplay(error.error_message || error, 'Unknown error')
showToast(`Optimization failed: ${errorMsg}`, 'error')
```

## Benefits

1. **Better UX**: Users see clean, actionable error messages instead of technical stack traces
2. **Contextual Help**: Specific error types include helpful suggestions for resolution
3. **Debug-Friendly**: Technical details remain accessible via collapsible sections
4. **Consistent**: Centralized error handling ensures consistent messaging across the app
5. **Maintainable**: Single source of truth for error parsing logic

## Testing

To test the improvements:

1. **SL/TP Error**: Create an optimization with invalid SL/TP settings (e.g., `SL=Entry_Price-100`)
2. **MetaAPI Error**: Run optimization with invalid MetaAPI credentials
3. **Parameter Error**: Submit optimization with missing or invalid parameters
4. **View Technical Details**: Expand the "Technical Details" section to verify stdout/stderr are still accessible

## Future Enhancements

- Add more specific error type handlers
- Implement error logging/reporting
- Add i18n support for error messages
- Create user-friendly error documentation links

