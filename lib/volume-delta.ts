// Volume Delta / Cumulative Volume Delta read their volume from a second,
// lower timeframe (`input_params.lower_timeframe`), the way TradingView's
// indicators scan intrabars: each bar's delta sums the signed volume of the
// lower-timeframe bars inside it.

import { timeframeToMinutes } from "@/lib/timeframe-match"

// TradingView's default intrabar timeframe on an intraday chart.
export const DEFAULT_LOWER_TIMEFRAME = "1min"

const VOLUME_DELTA_NAMES = new Set(["VolumeDelta", "CumulativeVolumeDelta"])

// timeframeToMinutes lowercases, so "1M" (month) would read as one minute.
const minutes = (tf: string): number | null => {
  const month = tf.trim().match(/^(\d+)M$/)
  return month ? parseInt(month[1], 10) * 43200 : timeframeToMinutes(tf)
}

// A lower timeframe longer than the bar it feeds has no intrabars to sum.
// Unparseable values pass: the backend validates them.
export function isLowerTimeframeValid(lowerTimeframe: string, timeframe: string): boolean {
  const lower = minutes(lowerTimeframe)
  const chart = minutes(timeframe)
  return lower === null || chart === null || lower <= chart
}

// Every lower timeframe the statement's VD/CVD operands read, so the tester
// can ask for a dataset at each one.
export function volumeDeltaLowerTimeframes(statement: any): string[] {
  const found = new Set<string>()
  const visit = (operand: any) => {
    if (!operand || typeof operand !== "object" || !VOLUME_DELTA_NAMES.has(operand.name)) return
    const tf = operand.input_params?.lower_timeframe
    if (typeof tf === "string" && tf.trim()) found.add(tf.trim())
  }
  const conditions = [
    ...(Array.isArray(statement?.strategy) ? statement.strategy : []),
    ...(Array.isArray(statement?.statements) ? statement.statements.flatMap((s: any) => s?.strategy || []) : []),
  ]
  for (const condition of conditions) {
    visit(condition?.inp1)
    visit(condition?.inp2)
  }
  return [...found]
}
