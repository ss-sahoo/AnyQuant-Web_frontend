/**
 * Utility functions for parsing and displaying user-friendly error messages
 */

/**
 * Extract a clean, user-friendly error message from API error responses
 * @param errorData - The error data from the API response
 * @returns A clean error message string
 */
export function extractErrorMessage(errorData: any): string {
  // If it's a simple string, return it
  if (typeof errorData === 'string') {
    return cleanErrorMessage(errorData)
  }

  // If it's an Error object
  if (errorData instanceof Error) {
    return cleanErrorMessage(errorData.message)
  }

  // Try to extract from various possible structures
  // Prioritize stderr/error_message as they typically contain actual errors
  const possibleMessages = [
    errorData?.error_message,
    errorData?.error,
    errorData?.result?.error,
    errorData?.stderr,
    errorData?.stdout,
    errorData?.message,
  ]

  // Find the first non-empty message that looks like an error
  for (const msg of possibleMessages) {
    if (msg && typeof msg === 'string' && msg.trim()) {
      const cleaned = cleanErrorMessage(msg)
      // Only return if it looks like an error (not a success message)
      if (cleaned && !cleaned.toLowerCase().includes('completed') && !cleaned.toLowerCase().includes('success')) {
        return cleaned
      }
    }
  }

  // If no clear error found, try to extract any meaningful message
  for (const msg of possibleMessages) {
    if (msg && typeof msg === 'string' && msg.trim()) {
      const cleaned = cleanErrorMessage(msg)
      if (cleaned) return cleaned
    }
  }

  return 'An unknown error occurred'
}

/**
 * Clean an error message by extracting the most relevant information
 * @param message - The raw error message
 * @returns A cleaned error message
 */
function cleanErrorMessage(message: string): string {
  if (!message) return ''

  // Extract AssertionError messages
  const assertionMatch = message.match(/AssertionError:\s*(.+?)(?:\n|$)/)
  if (assertionMatch) {
    return assertionMatch[1].trim()
  }

  // Extract "Error: " prefixed messages
  const errorMatch = message.match(/Error:\s*(.+?)(?:\n|$)/)
  if (errorMatch) {
    return errorMatch[1].trim()
  }

  // Extract lines that start with "Invalid" or "Failed"
  const lines = message.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (
      trimmed.startsWith('Invalid') ||
      trimmed.startsWith('Failed') ||
      trimmed.startsWith('Error:') ||
      trimmed.startsWith('AssertionError:')
    ) {
      return trimmed.replace(/^(Error:|AssertionError:)\s*/, '')
    }
  }

  // If message has "=== BACKTEST RUN FAILED ===" extract the error after it
  if (message.includes('=== BACKTEST RUN FAILED ===')) {
    const afterFailed = message.split('=== BACKTEST RUN FAILED ===')[1]
    if (afterFailed) {
      const errorLine = afterFailed.match(/Error:\s*(.+?)(?:\n|$)/)
      if (errorLine) {
        return errorLine[1].trim()
      }
    }
  }

  // Return first meaningful line (skip empty lines and common headers)
  for (const line of lines) {
    const trimmed = line.trim()
    if (
      trimmed &&
      !trimmed.startsWith('Traceback') &&
      !trimmed.startsWith('File ') &&
      !trimmed.startsWith('===') &&
      !trimmed.match(/^\s*at\s+/) &&
      trimmed.length > 10
    ) {
      return trimmed
    }
  }

  // If all else fails, return the first 200 characters
  return message.substring(0, 200).trim()
}

/**
 * Format an error message for display in the UI
 * @param errorData - The error data from the API
 * @param defaultMessage - Default message if no error is found
 * @returns Formatted error message
 */
export function formatErrorForDisplay(
  errorData: any,
  defaultMessage: string = 'An error occurred'
): string {
  const message = extractErrorMessage(errorData)
  return message || defaultMessage
}

/**
 * Extract optimization-specific errors with context
 * @param errorData - The optimization error response
 * @returns A structured error object
 */
export function extractOptimizationError(errorData: any): {
  title: string
  message: string
  details?: string
} {
  const fullMessage = extractErrorMessage(errorData)

  // Check for specific error types
  if (fullMessage.includes('SL must be') || fullMessage.includes('TP must be')) {
    return {
      title: 'Invalid Stop Loss / Take Profit Configuration',
      message: fullMessage,
      details: 'Please check your SL/TP settings in the strategy configuration.',
    }
  }

  if (fullMessage.includes('MetaAPI')) {
    return {
      title: 'MetaAPI Connection Error',
      message: fullMessage,
      details: 'Please verify your MetaAPI credentials and account status.',
    }
  }

  if (fullMessage.includes('timeout') || fullMessage.includes('timed out')) {
    return {
      title: 'Optimization Timeout',
      message: fullMessage,
      details: 'The optimization took too long to complete. Try reducing the population size or generations.',
    }
  }

  if (fullMessage.includes('parameter') || fullMessage.includes('Parameter')) {
    return {
      title: 'Parameter Configuration Error',
      message: fullMessage,
      details: 'Please review your optimization parameters.',
    }
  }

  // Default structured error
  return {
    title: 'Optimization Error',
    message: fullMessage,
  }
}

