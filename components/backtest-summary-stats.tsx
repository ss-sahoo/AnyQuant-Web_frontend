"use client"

/**
 * BacktestSummaryStats
 *
 * Renders the MT5-style "Extended Statistics" section for the Summary tab of the
 * backtest results. It reads values straight out of the backend `summary_stats`
 * object (a flat map of { "Metric Name": value }) by their exact keys — nothing is
 * hardcoded. Missing values or the strings "nan"/"null"/"none" render as an em-dash.
 *
 * The keys used here match exactly the strings produced by backtesting/_stats.py.
 */

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type StatsMap = Record<string, unknown> | null | undefined

const DASH = "—"

/** Coerce a raw stats value into a finite number, or null for nan/null/missing. */
function toNum(v: unknown): number | null {
  if (v == null) return null
  if (typeof v === "number") return Number.isFinite(v) ? v : null
  const s = String(v).trim()
  if (!s) return null
  const low = s.toLowerCase()
  if (
    low === "nan" ||
    low === "null" ||
    low === "none" ||
    low === "inf" ||
    low === "-inf" ||
    low === "infinity" ||
    low === "-infinity"
  ) {
    return null
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

// ── Formatters ────────────────────────────────────────────────────────────────
// [$]  -> 2 decimals (no currency symbol, matches the MT5-style report)
// [%]  -> 2 decimals + %
// count-> integer (thousands separated)
// ratio-> 2 decimals
const money = (v: unknown): string => {
  const n = toNum(v)
  return n == null ? DASH : n.toFixed(2)
}
const pct = (v: unknown): string => {
  const n = toNum(v)
  return n == null ? DASH : `${n.toFixed(2)}%`
}
const int = (v: unknown): string => {
  const n = toNum(v)
  return n == null ? DASH : Math.round(n).toLocaleString("en-US")
}
const ratio = (v: unknown): string => {
  const n = toNum(v)
  return n == null ? DASH : n.toFixed(2)
}

/** Combine a primary value with a companion shown in parentheses (MT5 style). */
function paired(primary: string, companion: string): string {
  if (primary === DASH) return DASH
  if (companion === DASH) return primary
  return `${primary} (${companion})`
}

type Formatter = (v: unknown) => string

interface Row {
  label: string
  tip: string
  value: (s: StatsMap) => string
}

interface Section {
  title: string
  /** Optional explanatory tooltip shown next to the section title. */
  tip?: string
  rows: Row[]
}

const read = (s: StatsMap, key: string): unknown =>
  s && typeof s === "object" ? (s as Record<string, unknown>)[key] : undefined

/** A single-key metric row. */
const single = (key: string, fmt: Formatter, label: string, tip: string): Row => ({
  label,
  tip,
  value: (s) => fmt(read(s, key)),
})

/** A metric row that shows a companion value in parentheses. */
const pair = (
  primaryKey: string,
  primaryFmt: Formatter,
  companionKey: string,
  companionFmt: Formatter,
  label: string,
  tip: string,
): Row => ({
  label,
  tip,
  value: (s) => paired(primaryFmt(read(s, primaryKey)), companionFmt(read(s, companionKey))),
})

// ── Metric configuration ────────────────────────────────────────────────────
// Keys below are read verbatim from `summary_stats`.
const SECTIONS: Section[] = [
  {
    title: "Overview",
    rows: [
      single("Bars", int, "Bars", "Number of price bars (candles) the backtest ran over."),
      single("# Trades", int, "Total Trades", "Number of positions opened and closed."),
      single(
        "Total Deals",
        int,
        "Total Deals",
        "All entry + exit transactions. Not simply 2×trades — partial take-profits / managed exits close a position in several deals, so one entry can map to multiple exits. = distinct entries + total closes.",
      ),
    ],
  },
  {
    title: "Profit / Loss",
    rows: [
      single(
        "Total Net Profit [$]",
        money,
        "Total Net Profit",
        "Gross Profit + Gross Loss = sum of all trade P/L. Equals Final Equity − Initial Balance.",
      ),
      single("Gross Profit [$]", money, "Gross Profit", "Sum of P/L of all winning trades (P/L > 0)."),
      single(
        "Gross Loss [$]",
        money,
        "Gross Loss",
        "Sum of P/L of all losing trades (P/L < 0), shown negative.",
      ),
      single(
        "Expected Payoff [$]",
        money,
        "Expected Payoff",
        "Average $ result per trade = Total Net Profit ÷ Total Trades.",
      ),
      single(
        "Profit Factor ($)",
        ratio,
        "Profit Factor",
        "Gross Profit ÷ |Gross Loss|. >1 is profitable; 2.0 = $2 earned per $1 lost.",
      ),
    ],
  },
  {
    title: "Ratios",
    rows: [
      single(
        "Recovery Factor",
        ratio,
        "Recovery Factor",
        "Total Net Profit ÷ Maximal Balance Drawdown ($). Profit earned per unit of worst drawdown.",
      ),
      single(
        "Sharpe Ratio (Ann.)",
        ratio,
        "Sharpe Ratio (Annualized)",
        "(Annualized return − risk-free) ÷ annualized volatility of daily equity returns.",
      ),
      single(
        "Sharpe Ratio (per trade)",
        ratio,
        "Sharpe Ratio (Per-Trade, MT5)",
        "Mean per-trade return ÷ std of per-trade returns (not annualized). Per-trade return = P/L ÷ balance before the trade.",
      ),
      single(
        "AHPR [%]",
        pct,
        "AHPR",
        "Average Holding-Period Return — arithmetic mean of per-trade growth (balanceᵢ/balanceᵢ₋₁). 0.45% = +0.45% average per trade.",
      ),
      single(
        "GHPR [%]",
        pct,
        "GHPR",
        "Geometric Holding-Period Return — compounded average per trade = (∏ HPRᵢ)^(1/N). Always ≤ AHPR.",
      ),
      single(
        "Z-Score",
        ratio,
        "Z-Score",
        "Whether wins/losses cluster (streaky) or are random. Z = (N(R−0.5)−P)/√(P(P−N)/(N−1)); N=trades, R=#streaks, P=2·wins·losses. |Z|>~2 ⇒ significant streakiness.",
      ),
      single(
        "Z-Score Probability [%]",
        pct,
        "Z-Score Probability",
        "Confidence (%) that the win/loss sequence is non-random.",
      ),
      single(
        "LR Correlation",
        ratio,
        "LR Correlation",
        "Correlation of the balance curve to its straight linear-regression line (−1..1). Near 1 = very steady, linear growth.",
      ),
      single(
        "LR Standard Error [$]",
        money,
        "LR Standard Error",
        "Std deviation of the balance curve around its regression line ($). Lower = smoother equity.",
      ),
    ],
  },
  {
    title: "Drawdown",
    tip: "Balance = realized cash, changes only at trade close. Equity = balance + floating P/L of open positions, changes every bar.",
    rows: [
      single(
        "Balance Drawdown Absolute [$]",
        money,
        "Balance DD Absolute",
        "How far balance ever fell below the initial deposit. 0 if it never dropped below the start.",
      ),
      pair(
        "Balance Drawdown Maximal [$]",
        money,
        "Balance Drawdown Maximal [%]",
        pct,
        "Balance DD Maximal",
        "Largest drop from a balance peak to a later trough, in $ (and % of that peak).",
      ),
      pair(
        "Balance Drawdown Relative [%]",
        pct,
        "Balance Drawdown Relative [$]",
        money,
        "Balance DD Relative",
        "Largest % drop from a balance peak to a later trough (and the $ at which it occurred).",
      ),
      single(
        "Equity Drawdown Absolute [$]",
        money,
        "Equity DD Absolute",
        "How far equity (incl. floating P/L) ever fell below the initial deposit.",
      ),
      pair(
        "Equity Drawdown Maximal [$]",
        money,
        "Equity Drawdown Maximal [%]",
        pct,
        "Equity DD Maximal",
        "Largest peak-to-trough equity drop in $ (and % of the peak).",
      ),
      pair(
        "Equity Drawdown Relative [%]",
        pct,
        "Equity Drawdown Relative [$]",
        money,
        "Equity DD Relative",
        "Largest % peak-to-trough equity drop (and the $ at which it occurred).",
      ),
    ],
  },
  {
    title: "Trade Breakdown",
    rows: [
      pair(
        "Long Trades",
        int,
        "Long Trades Won [%]",
        pct,
        "Long Trades (won %)",
        "Number of buy trades and the % that were profitable.",
      ),
      pair(
        "Short Trades",
        int,
        "Short Trades Won [%]",
        pct,
        "Short Trades (won %)",
        "Number of sell trades and the % profitable.",
      ),
      pair(
        "Profit Trades",
        int,
        "Profit Trades [%]",
        pct,
        "Profit Trades",
        "Number of winning trades and their share of all trades.",
      ),
      pair(
        "Loss Trades",
        int,
        "Loss Trades [%]",
        pct,
        "Loss Trades",
        "Number of losing trades and their share of all trades.",
      ),
      single("Largest Profit Trade [$]", money, "Largest Profit Trade", "The single most profitable trade."),
      single("Largest Loss Trade [$]", money, "Largest Loss Trade", "The single worst-losing trade."),
      single(
        "Average Profit Trade [$]",
        money,
        "Average Profit Trade",
        "Gross Profit ÷ number of winning trades.",
      ),
      single(
        "Average Loss Trade [$]",
        money,
        "Average Loss Trade",
        "Gross Loss ÷ number of losing trades.",
      ),
    ],
  },
  {
    title: "Consecutive Streaks",
    rows: [
      pair(
        "Max Consecutive Wins (count)",
        int,
        "Max Consecutive Wins Profit [$]",
        money,
        "Max Consecutive Wins ($)",
        "Longest run of consecutive winning trades, and the total $ that run made.",
      ),
      pair(
        "Max Consecutive Losses (count)",
        int,
        "Max Consecutive Losses Loss [$]",
        money,
        "Max Consecutive Losses ($)",
        "Longest run of consecutive losing trades, and its total $ loss.",
      ),
      pair(
        "Maximal Consecutive Profit [$]",
        money,
        "Maximal Consecutive Profit (count)",
        int,
        "Maximal Consecutive Profit (count)",
        "The winning run with the largest total $ profit, and how many trades it spanned (may differ from the longest run).",
      ),
      pair(
        "Maximal Consecutive Loss [$]",
        money,
        "Maximal Consecutive Loss (count)",
        int,
        "Maximal Consecutive Loss (count)",
        "The losing run with the largest total $ loss, and its length.",
      ),
      single(
        "Avg Consecutive Wins",
        ratio,
        "Average Consecutive Wins",
        "Average length of winning streaks.",
      ),
      single(
        "Avg Consecutive Losses",
        ratio,
        "Average Consecutive Losses",
        "Average length of losing streaks.",
      ),
    ],
  },
]

function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Metric explanation"
          className="inline-flex items-center text-gray-600 hover:text-[#85e1fe] focus:outline-none focus-visible:text-[#85e1fe]"
        >
          <Info className="h-3 w-3" />
        </button>
      </TooltipTrigger>
      <TooltipPrimitive.Portal>
        <TooltipContent
          side="top"
          align="start"
          className="max-w-[280px] border-gray-700 bg-[#11131f] text-[11px] font-normal leading-relaxed text-gray-200 shadow-xl"
        >
          {text}
        </TooltipContent>
      </TooltipPrimitive.Portal>
    </Tooltip>
  )
}

function StatRow({ row, stats }: { row: Row; stats: StatsMap }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-900 py-2 text-[11px]">
      <span className="flex items-center gap-1.5 text-gray-400">
        {row.label}
        <InfoTip text={row.tip} />
      </span>
      <span className="font-mono font-medium tabular-nums text-white text-right">
        {row.value(stats)}
      </span>
    </div>
  )
}

export function BacktestSummaryStats({ stats }: { stats: StatsMap }) {
  // Old backtests won't include summary_stats — render nothing so existing
  // behaviour is untouched.
  if (!stats || typeof stats !== "object" || Object.keys(stats).length === 0) {
    return null
  }

  return (
    <TooltipProvider delayDuration={150} skipDelayDuration={300}>
      <div className="mt-10 border-t border-gray-800/60 pt-8">
        <h3 className="mb-6 text-xs font-black uppercase tracking-widest text-gray-500">
          Extended Statistics
        </h3>
        <div className="grid grid-cols-1 items-start gap-x-8 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
          {SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="mb-3 flex items-center gap-1.5">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#85e1fe]/80">
                  {section.title}
                </h4>
                {section.tip ? <InfoTip text={section.tip} /> : null}
              </div>
              <div>
                {section.rows.map((row) => (
                  <StatRow key={row.label} row={row} stats={stats} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  )
}

export default BacktestSummaryStats
