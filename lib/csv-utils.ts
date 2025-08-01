/**
 * Utility functions for CSV parsing and handling
 */

export interface Trade {
  Size: number
  EntryTime: string
  ExitTime: string
  EntryPrice: number
  ExitPrice: number
  PnL: number
  ReturnPct: number
  EntryBar: number
  ExitBar: number
  Duration: string
}

export interface TradesSummary {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  totalPnL: number
  winRate: number
  avgWin: number
  avgLoss: number
  maxWin: number
  maxLoss: number
  totalReturn: number
}

/**
 * Parse CSV string into array of trade objects
 */
export function parseTradesCSV(csvString: string): Trade[] {
  if (!csvString || typeof csvString !== 'string') {
    return []
  }

  const lines = csvString.trim().split('\n')
  if (lines.length < 2) {
    return []
  }

  const headers = lines[0].split(',').map(h => h.trim())
  const trades: Trade[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = line.split(',')
    if (values.length !== headers.length) continue

    const trade: any = {}
    headers.forEach((header, index) => {
      const value = values[index].trim()
      switch (header) {
        case 'Size':
        case 'EntryPrice':
        case 'ExitPrice':
        case 'PnL':
        case 'ReturnPct':
        case 'EntryBar':
        case 'ExitBar':
          trade[header] = parseFloat(value) || 0
          break
        default:
          trade[header] = value
      }
    })
    trades.push(trade as Trade)
  }

  return trades
}

/**
 * Calculate summary statistics from trades array
 */
export function calculateTradesSummary(trades: Trade[]): TradesSummary {
  const totalTrades = trades.length
  if (totalTrades === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalPnL: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      maxWin: 0,
      maxLoss: 0,
      totalReturn: 0
    }
  }

  const winningTrades = trades.filter(t => t.PnL > 0)
  const losingTrades = trades.filter(t => t.PnL < 0)
  const totalPnL = trades.reduce((sum, t) => sum + t.PnL, 0)
  const winRate = (winningTrades.length / totalTrades) * 100
  
  const avgWin = winningTrades.length > 0 
    ? winningTrades.reduce((sum, t) => sum + t.PnL, 0) / winningTrades.length 
    : 0
  const avgLoss = losingTrades.length > 0 
    ? losingTrades.reduce((sum, t) => sum + t.PnL, 0) / losingTrades.length 
    : 0
  
  const maxWin = Math.max(...trades.map(t => t.PnL), 0)
  const maxLoss = Math.min(...trades.map(t => t.PnL), 0)
  const totalReturn = trades.reduce((sum, t) => sum + t.ReturnPct, 0)

  return {
    totalTrades,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    totalPnL,
    winRate,
    avgWin,
    avgLoss,
    maxWin,
    maxLoss,
    totalReturn
  }
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(value)
}

/**
 * Format percentage value
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`
}

/**
 * Download CSV data as file
 */
export function downloadCSV(csvData: string, filename: string): void {
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

/**
 * Validate CSV data structure
 */
export function validateTradesCSV(csvString: string): { isValid: boolean; error?: string } {
  if (!csvString || typeof csvString !== 'string') {
    return { isValid: false, error: 'Invalid CSV data' }
  }

  const lines = csvString.trim().split('\n')
  if (lines.length < 2) {
    return { isValid: false, error: 'CSV must have at least header and one data row' }
  }

  const headers = lines[0].split(',').map(h => h.trim())
  const requiredHeaders = ['Size', 'EntryTime', 'ExitTime', 'EntryPrice', 'ExitPrice', 'PnL', 'ReturnPct']
  
  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      return { isValid: false, error: `Missing required header: ${required}` }
    }
  }

  return { isValid: true }
} 