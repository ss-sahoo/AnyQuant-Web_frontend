/**
 * Formatting utilities for optimization results across the AnyQuant platform.
 * Ensures consistent precision: numbers formatted up to 2 decimals, or 4+ decimals
 * for statistical quantities like p-value, z-statistic, and near-zero returns.
 */

/**
 * Checks if a value can be treated as a finite number.
 */
export function isNumeric(value: any): boolean {
  if (value === null || value === undefined || value === '') return false;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return false;
    // Do not treat date/time strings (e.g. '2024-01-01', '00:05:23') as numbers
    if (trimmed.includes(':') || trimmed.includes('/') || (trimmed.includes('-') && !/^-?\d+(\.\d+)?(e[+-]?\d+)?$/i.test(trimmed))) {
      return false;
    }
    return !Number.isNaN(Number(trimmed));
  }
  return false;
}

/**
 * Formats a numeric value to a given number of decimal places.
 */
export function formatOptimizationNumber(value: any, digits = 2, fallback = '-'): string {
  if (!isNumeric(value)) return fallback;
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  return num.toFixed(digits);
}

/**
 * Formats percentage metrics with 2 decimals, or 4 decimals if near zero (< 0.1%).
 */
export function formatOptimizationPercent(value: any, fallback = '-'): string {
  if (!isNumeric(value)) return fallback;
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  const decimals = Math.abs(num) < 0.1 && num !== 0 ? 4 : 2;
  return `${num.toFixed(decimals)}%`;
}

/**
 * Key-aware formatter for any optimization metric.
 * - p-value: 4 decimals (or up to 6 if very small)
 * - z-statistic: 4 decimals
 * - percentages: 2 decimals (or 4 if < 0.1%)
 * - currency/equity: 2 decimals
 * - ratios (Sharpe, Sortino, Calmar, Profit Factor, SQN): 2 decimals
 * - counts (Trades, Generations, Folds, Bars): integer if whole number, else 2 decimals
 * - general floats: 2 decimals (or 4 if < 0.01)
 */
export function formatOptimizationValue(value: any, key?: string, fallback = '-'): string {
  if (value === undefined || value === null || value === '') return fallback;

  // Non-numeric strings (like dates, statuses, messages) should be preserved
  if (typeof value === 'string' && !isNumeric(value)) {
    return value;
  }

  // Non-primitive objects
  if (typeof value === 'object') {
    return String(value);
  }

  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) {
    return String(value ?? fallback);
  }

  const strKey = (key || '').toLowerCase();

  // p-value: 4 or more decimals
  if (
    strKey.includes('p_value') ||
    strKey.includes('p-value') ||
    strKey.includes('p value') ||
    strKey === 'pvalue' ||
    strKey === 'p'
  ) {
    if (Math.abs(num) < 0.0001 && num !== 0) {
      return num.toFixed(6);
    }
    return num.toFixed(4);
  }

  // z-statistic: 4 decimals
  if (
    strKey.includes('z_statistic') ||
    strKey.includes('z-statistic') ||
    strKey.includes('z statistic') ||
    strKey.includes('z_stat') ||
    strKey.includes('z-stat') ||
    strKey === 'z'
  ) {
    return num.toFixed(4);
  }

  // Integer counts / bars / passes / folds
  if (
    strKey.includes('# trades') ||
    strKey.includes('num_trades') ||
    strKey.includes('total trades') ||
    strKey.includes('training_trades') ||
    strKey.includes('validation_trades') ||
    strKey === 'trades' ||
    strKey === 'generation' ||
    strKey === 'fold' ||
    strKey === 'pass' ||
    strKey.endsWith('_bars') ||
    strKey.includes('bars')
  ) {
    if (Number.isInteger(num)) {
      return num.toString();
    }
    return num.toFixed(2);
  }

  // Percentage metrics
  if (
    strKey.includes('%') ||
    strKey.includes('percent') ||
    strKey.includes('return') ||
    strKey.includes('drawdown') ||
    strKey.includes('win rate') ||
    strKey.includes('exposure') ||
    strKey.includes('expectancy')
  ) {
    const decimals = Math.abs(num) < 0.1 && num !== 0 ? 4 : 2;
    return num.toFixed(decimals);
  }

  // Currency / Equity
  if (
    strKey.includes('[$]') ||
    strKey.includes('equity') ||
    strKey.includes('cost') ||
    strKey.includes('balance') ||
    strKey.includes('pnl')
  ) {
    return num.toFixed(2);
  }

  // Ratios
  if (
    strKey.includes('sharpe') ||
    strKey.includes('sortino') ||
    strKey.includes('calmar') ||
    strKey.includes('profit factor') ||
    strKey.includes('sqn')
  ) {
    return num.toFixed(2);
  }

  // General whole numbers
  if (Number.isInteger(num)) {
    return num.toString();
  }

  // Small fractions near zero
  if (Math.abs(num) < 0.01 && num !== 0) {
    return num.toFixed(4);
  }

  return num.toFixed(2);
}
