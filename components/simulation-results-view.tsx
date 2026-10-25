"use client"

import React, { useMemo, useState } from "react"
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatDuration, formatStart } from "@/lib/run-cost-timing"

// Renders GET /api/simulation-results/<id>/. Numbers the backend can't compute
// arrive as null (never NaN), so every formatter falls back to "-".

interface SimulationResultsViewProps {
  result: any
  section: "results" | "graph"
}

interface MetricSpec {
  key: string
  label: string
  digits: number
  format: (value: number, digits: number) => string
}

const plain = (value: number, digits: number) => value.toFixed(digits)
const percent = (value: number, digits: number) => `${value.toFixed(digits)}%`
const money = (value: number, digits: number) =>
  `$${value.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`

// The engine floors Sharpe at 0, so a losing path reads 0, not negative.
// Labelled as such until the backend fixes the floor.
const METRICS: MetricSpec[] = [
  { key: "sharpe", label: "Sharpe (losses shown as 0)", digits: 2, format: plain },
  { key: "return_pct", label: "Return", digits: 2, format: percent },
  { key: "max_dd", label: "Max Drawdown", digits: 2, format: percent },
  { key: "n_trades", label: "# Trades", digits: 0, format: plain },
  { key: "final_equity", label: "Final Equity", digits: 2, format: money },
]

const isNumber = (value: any): value is number => typeof value === "number" && Number.isFinite(value)

const fmt = (value: any, spec: Pick<MetricSpec, "digits" | "format">) =>
  isNumber(value) ? spec.format(value, spec.digits) : "-"
const fmtNum = (value: any, digits = 2) => (isNumber(value) ? value.toFixed(digits) : "-")
const fmtPct = (value: any, digits = 2) => (isNumber(value) ? `${value.toFixed(digits)}%` : "-")
// Shares (0–1) shown as percentages.
const fmtShare = (value: any) => (isNumber(value) ? `${(value * 100).toFixed(0)}%` : "-")

const STATUS_STYLES: Record<string, string> = {
  PASS: "bg-green-500/10 text-green-400 border-green-500/40",
  WARN: "bg-yellow-500/10 text-yellow-400 border-yellow-500/40",
  FAIL: "bg-red-500/10 text-red-400 border-red-500/40",
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  const key = String(status || "").toUpperCase()
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${STATUS_STYLES[key] ?? "bg-gray-800 text-gray-400 border-gray-700"}`}
    >
      {key || "-"}
    </span>
  )
}

const sectionHeading = "text-xs font-black text-gray-500 uppercase tracking-[0.4em] mb-4"
const tableClass = "min-w-full text-[11px] border-separate border-spacing-y-1"
const headRowClass = "bg-[#141721] text-gray-400 font-black uppercase tracking-widest text-[9px]"
const rowClass = "bg-[#080A10] text-white"
const tile = "bg-[#141721] rounded-lg p-4"

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={tile}>
      <p className="text-gray-400 text-sm">{label}</p>
      <div className="text-white font-semibold">{children}</div>
    </div>
  )
}

function Warnings({ warnings }: { warnings: any }) {
  if (!Array.isArray(warnings) || warnings.length === 0) return null
  return (
    <div className="space-y-2">
      {warnings.map((warning: string, idx: number) => (
        <div
          key={idx}
          className="rounded-md border border-yellow-600/40 bg-yellow-500/10 px-4 py-3 text-[11px] font-semibold text-yellow-400"
        >
          {warning}
        </div>
      ))}
    </div>
  )
}

function RunSummary({ result }: { result: any }) {
  const settings = result?.settings || {}
  const paths = result?.paths
  const range = settings.start && settings.end
    ? `${formatStart(settings.start)} → ${formatStart(settings.end)}`
    : "-"
  const bars = isNumber(settings.bars_used)
    ? `${settings.bars_used.toLocaleString()}${settings.truncated && isNumber(settings.bars_input) ? ` of ${settings.bars_input.toLocaleString()} (cut to the most recent)` : ""}`
    : "-"

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Tile label="Verdict"><StatusBadge status={result?.verdict?.status ?? result?.status} /></Tile>
        <Tile label="Synthetic Paths">
          {paths
            ? `${paths.succeeded ?? "-"} of ${paths.requested ?? "-"} succeeded${paths.failed ? ` (${paths.failed} failed)` : ""}`
            : settings.n_paths ?? "-"}
        </Tile>
        <Tile label="Total Time">{formatDuration(isNumber(result?.execution_time_seconds) ? result.execution_time_seconds : null)}</Tile>
        <Tile label="Started">{formatStart(result?.created_at ?? null)}</Tile>
      </div>
      <div className="flex flex-wrap gap-x-8 gap-y-2 text-[11px] text-gray-400">
        <span>Timeframe: <span className="text-white">{settings.timeframe ?? "-"}</span></span>
        <span>Bars: <span className="text-white">{bars}</span></span>
        <span>History: <span className="text-white">{range}</span></span>
        <span>Seed: <span className="text-white">{settings.seed ?? "-"}</span></span>
        <span>Data: <span className="text-white">{settings.data_source === "file_upload" ? "Uploaded files" : settings.data_source ?? "-"}</span></span>
      </div>
    </div>
  )
}

function VerdictTable({ verdict }: { verdict: any }) {
  const criteria = Array.isArray(verdict?.criteria) ? verdict.criteria : []
  if (criteria.length === 0) return null
  return (
    <div>
      <h3 className={sectionHeading}>Verdict Criteria</h3>
      <div className="overflow-x-auto">
        <table className={tableClass}>
          <thead>
            <tr className={headRowClass}>
              <th className="px-4 py-3 text-left">Criterion</th>
              <th className="px-4 py-3 text-left">Threshold</th>
              <th className="px-4 py-3 text-left">Observed</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-left">Why it matters</th>
            </tr>
          </thead>
          <tbody>
            {criteria.map((criterion: any, idx: number) => (
              <tr key={idx} className={rowClass}>
                <td className="px-4 py-3 font-semibold">{criterion.name}</td>
                <td className="px-4 py-3 font-mono text-gray-300">{criterion.threshold}</td>
                <td className={`px-4 py-3 font-mono ${criterion.observed === "skipped" ? "text-gray-500 italic" : ""}`}>
                  {criterion.observed}
                </td>
                <td className="px-4 py-3 text-center"><StatusBadge status={criterion.status} /></td>
                <td className="px-4 py-3 text-gray-400">{criterion.explanation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DistributionTable({ result }: { result: any }) {
  const distributions = result?.distributions
  if (!distributions) return null
  return (
    <div>
      <h3 className={sectionHeading}>Real vs Synthetic Markets</h3>
      <div className="overflow-x-auto">
        <table className={tableClass}>
          <thead>
            <tr className={headRowClass}>
              <th className="px-4 py-3 text-left">Metric</th>
              <th className="px-4 py-3 text-right">Real</th>
              <th className="px-4 py-3 text-right" title="Share of synthetic paths at or below the real result">Real Percentile</th>
              <th className="px-4 py-3 text-right">P5</th>
              <th className="px-4 py-3 text-right">P25</th>
              <th className="px-4 py-3 text-right">Median</th>
              <th className="px-4 py-3 text-right">P75</th>
              <th className="px-4 py-3 text-right">P95</th>
              <th className="px-4 py-3 text-right">Mean</th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map((spec) => {
              const dist = distributions[spec.key]
              if (!dist) return null
              const real = dist.real_value ?? result?.real_metrics?.[spec.key]
              return (
                <tr key={spec.key} className={rowClass}>
                  <td className="px-4 py-3 font-semibold">{spec.label}</td>
                  <td className="px-4 py-3 text-right font-mono text-[#fbbf24]">{fmt(real, spec)}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmtNum(dist.real_percentile, 0)}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(dist.p5, spec)}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(dist.p25, spec)}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(dist.median, spec)}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(dist.p75, spec)}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(dist.p95, spec)}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(dist.mean, spec)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const REGIME_COLUMNS = 11

function RegimeTable({ regimes }: { regimes: any }) {
  const table = Array.isArray(regimes?.table) ? regimes.table : []
  if (table.length === 0) return null
  return (
    <div>
      <h3 className={sectionHeading}>Performance by Market Regime</h3>
      <p className="text-[11px] text-gray-500 mb-3">
        Monthly figures. A regime needs at least {regimes?.min_months ?? 20} synthetic months to be judged.
      </p>
      <div className="overflow-x-auto">
        <table className={tableClass}>
          <thead>
            <tr className={headRowClass}>
              <th className="px-4 py-3 text-left">Regime</th>
              <th className="px-4 py-3 text-right">Synthetic Months</th>
              <th className="px-4 py-3 text-right">Share</th>
              <th className="px-4 py-3 text-right">Median Return</th>
              <th className="px-4 py-3 text-right">P10 – P90 Return</th>
              <th className="px-4 py-3 text-right">Positive Months</th>
              <th className="px-4 py-3 text-right">Median Max DD</th>
              <th className="px-4 py-3 text-right">Trades / Month</th>
              <th className="px-4 py-3 text-right">Win Rate</th>
              <th className="px-4 py-3 text-right">Profit Factor</th>
              <th className="px-4 py-3 text-right">Real Months (Median Return)</th>
            </tr>
          </thead>
          <tbody>
            {table.map((row: any) => {
              const syn = row.synthetic || {}
              const real = row.real || {}
              const isTotal = row.regime === "All months"
              if (!row.enough_months) {
                return (
                  <tr key={row.regime} className="bg-[#080A10] text-gray-600">
                    <td className="px-4 py-3 font-semibold">{row.regime}</td>
                    <td className="px-4 py-3 text-right font-mono">{syn.months ?? 0}</td>
                    <td className="px-4 py-3 text-center italic" colSpan={REGIME_COLUMNS - 2}>not enough data</td>
                  </tr>
                )
              }
              return (
                <tr key={row.regime} className={`${rowClass} ${isTotal ? "font-semibold border-t border-gray-700" : ""}`}>
                  <td className={`px-4 py-3 ${isTotal ? "text-[#85e1fe]" : "font-semibold"}`}>{row.regime}</td>
                  <td className="px-4 py-3 text-right font-mono">{syn.months ?? "-"}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmtShare(syn.share)}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmtPct(syn.median_return)}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmtPct(syn.p10_return)} – {fmtPct(syn.p90_return)}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmtShare(syn.positive_share)}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmtPct(syn.median_max_dd)}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmtNum(syn.trades_per_month, 1)}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmtPct(syn.win_rate, 1)}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmtNum(syn.profit_factor)}</td>
                  <td className="px-4 py-3 text-right font-mono text-[#fbbf24]">
                    {real.months ?? 0}{isNumber(real.median_return) ? ` (${fmtPct(real.median_return)})` : ""}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RealMonthsTable({ months }: { months: any }) {
  if (!Array.isArray(months) || months.length === 0) return null
  return (
    <div>
      <h3 className={sectionHeading}>Real Months</h3>
      <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
        <table className={tableClass}>
          <thead>
            <tr className={headRowClass}>
              <th className="px-4 py-3 text-left">Month</th>
              <th className="px-4 py-3 text-left">Regime</th>
              <th className="px-4 py-3 text-right">Return</th>
              <th className="px-4 py-3 text-right">Max DD</th>
              <th className="px-4 py-3 text-right"># Trades</th>
              <th className="px-4 py-3 text-right" title="Where this month sits among synthetic months of the same regime">Synthetic Percentile</th>
            </tr>
          </thead>
          <tbody>
            {months.map((month: any) => (
              <tr key={month.month} className={rowClass}>
                <td className="px-4 py-3 font-mono">{month.month}</td>
                <td className="px-4 py-3 text-gray-300">{month.regime}</td>
                <td className="px-4 py-3 text-right font-mono">{fmtPct(month.return_pct)}</td>
                <td className="px-4 py-3 text-right font-mono">{fmtPct(month.max_dd)}</td>
                <td className="px-4 py-3 text-right font-mono">{month.n_trades ?? "-"}</td>
                <td className="px-4 py-3 text-right font-mono">{fmtNum(month.synthetic_percentile, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CalibrationPanel({ calibration }: { calibration: any }) {
  const [open, setOpen] = useState(false)
  if (!calibration) return null
  const candidates = Array.isArray(calibration.candidates) ? calibration.candidates : []
  return (
    <div className="rounded-lg border border-gray-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-white"
        aria-expanded={open}
      >
        Advanced: Market Model Calibration
        <span>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Tile label="Model">{calibration.model ?? "-"} ({calibration.distribution ?? "-"})</Tile>
            <Tile label="Persistence">{fmtNum(calibration.persistence, 3)}</Tile>
            <Tile label="BIC">{fmtNum(calibration.bic, 1)}</Tile>
            <Tile label="Diagnostics">{calibration.diagnostics_passed ? "Passed" : "Not passed"}</Tile>
            <Tile label="Ljung-Box p">{fmtNum(calibration.ljung_box_p, 3)}</Tile>
            <Tile label="ARCH-LM p">{fmtNum(calibration.arch_lm_p, 3)}</Tile>
            <Tile label="Path Rejection Rate">{fmtShare(calibration.rejection_rate)}</Tile>
          </div>
          {candidates.length > 0 && (
            <table className={tableClass}>
              <thead>
                <tr className={headRowClass}>
                  <th className="px-4 py-2 text-left">Candidate Model</th>
                  <th className="px-4 py-2 text-left">Distribution</th>
                  <th className="px-4 py-2 text-right">BIC</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate: any, idx: number) => (
                  <tr key={idx} className={rowClass}>
                    <td className="px-4 py-2">{candidate.model}</td>
                    <td className="px-4 py-2">{candidate.distribution}</td>
                    <td className="px-4 py-2 text-right font-mono">{fmtNum(candidate.bic, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

const tooltipStyle = {
  contentStyle: { background: "#0a0b12", border: "1px solid #2b2e38", fontSize: 11 },
  labelStyle: { color: "#9ca3af" },
}

function EquityBandChart({ band }: { band: any }) {
  const data = useMemo(() => {
    const timestamps: string[] = Array.isArray(band?.timestamps) ? band.timestamps : []
    return timestamps.map((timestamp, i) => ({
      t: new Date(timestamp).getTime(),
      outer: [band.p5?.[i] ?? null, band.p95?.[i] ?? null],
      inner: [band.p25?.[i] ?? null, band.p75?.[i] ?? null],
      p50: band.p50?.[i] ?? null,
      real: band.real?.[i] ?? null,
    }))
  }, [band])

  if (data.length === 0) return null
  const dateLabel = (value: number) => new Date(value).toLocaleDateString()
  const moneyLabel = (value: any) =>
    Array.isArray(value)
      ? value.map((v) => (isNumber(v) ? money(v, 0) : "-")).join(" – ")
      : isNumber(value) ? money(value, 0) : "-"

  return (
    <div>
      <h3 className={sectionHeading}>Equity: Real vs Synthetic Markets</h3>
      <div className="h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
            <CartesianGrid stroke="#1f2335" strokeDasharray="3 3" />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={dateLabel}
              stroke="#6b7280"
              fontSize={10}
            />
            <YAxis stroke="#6b7280" fontSize={10} tickFormatter={(v) => money(v, 0)} width={80} domain={["auto", "auto"]} />
            <Tooltip {...tooltipStyle} labelFormatter={(v) => dateLabel(Number(v))} formatter={(v: any) => moneyLabel(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area dataKey="outer" name="P5 – P95" stroke="none" fill="#85e1fe" fillOpacity={0.12} isAnimationActive={false} />
            <Area dataKey="inner" name="P25 – P75" stroke="none" fill="#85e1fe" fillOpacity={0.25} isAnimationActive={false} />
            <Line dataKey="p50" name="Median" stroke="#e5e7eb" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            <Line dataKey="real" name="Real" stroke="#fbbf24" strokeWidth={2.5} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const HISTOGRAM_BINS = 20

function histogram(values: number[], bins = HISTOGRAM_BINS) {
  const finite = values.filter(isNumber)
  if (finite.length === 0) return { rows: [], binOf: () => -1 }
  const min = Math.min(...finite)
  const max = Math.max(...finite)
  // All paths agreeing (e.g. every path trades the same count) is one bar.
  const count = max === min ? 1 : bins
  const width = max === min ? 1 : (max - min) / count
  const binOf = (value: number) => Math.min(count - 1, Math.max(0, Math.floor((value - min) / width)))
  const rows = Array.from({ length: count }, (_, i) => ({ bin: i, mid: min + width * (i + 0.5), paths: 0 }))
  for (const value of finite) rows[binOf(value)].paths++
  return { rows, binOf }
}

function DistributionHistogram({ spec, dist, real }: { spec: MetricSpec; dist: any; real: any }) {
  const { rows, binOf } = useMemo(() => histogram(Array.isArray(dist?.values) ? dist.values : []), [dist])
  if (rows.length === 0) return null
  const label = (bin: number) => fmt(rows[bin]?.mid, spec)
  const marker = (value: any) => (isNumber(value) ? binOf(value) : -1)

  return (
    <div className="bg-[#080A10] rounded-lg p-4">
      <div className="flex items-baseline justify-between mb-2">
        <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-300">{spec.label}</h4>
        <span className="text-[10px] text-gray-500">
          Real <span className="text-[#fbbf24] font-mono">{fmt(real, spec)}</span>
          {isNumber(dist?.real_percentile) ? ` · percentile ${dist.real_percentile.toFixed(0)}` : ""}
        </span>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 10, right: 10, bottom: 0, left: 0 }} barCategoryGap={1}>
            <CartesianGrid stroke="#1f2335" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="bin" tickFormatter={label} stroke="#6b7280" fontSize={9} interval="preserveStartEnd" />
            <YAxis stroke="#6b7280" fontSize={9} allowDecimals={false} width={30} />
            <Tooltip {...tooltipStyle} labelFormatter={(bin) => `≈ ${label(Number(bin))}`} formatter={(v: any) => [v, "Paths"]} />
            <Bar dataKey="paths" fill="#85e1fe" fillOpacity={0.7} isAnimationActive={false} />
            {marker(dist?.p5) >= 0 && (
              <ReferenceLine x={marker(dist.p5)} stroke="#9ca3af" strokeDasharray="4 3" label={{ value: "P5", fill: "#9ca3af", fontSize: 9, position: "top" }} />
            )}
            {marker(dist?.p95) >= 0 && (
              <ReferenceLine x={marker(dist.p95)} stroke="#9ca3af" strokeDasharray="4 3" label={{ value: "P95", fill: "#9ca3af", fontSize: 9, position: "top" }} />
            )}
            {marker(real) >= 0 && (
              <ReferenceLine x={marker(real)} stroke="#fbbf24" strokeWidth={2} label={{ value: "Real", fill: "#fbbf24", fontSize: 9, position: "top" }} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function Graphs({ result }: { result: any }) {
  const distributions = result?.distributions
  return (
    <div className="space-y-12">
      <EquityBandChart band={result?.equity_band} />
      {distributions && (
        <div>
          <h3 className={sectionHeading}>Distribution Across Synthetic Markets</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {METRICS.map((spec) => distributions[spec.key] ? (
              <DistributionHistogram
                key={spec.key}
                spec={spec}
                dist={distributions[spec.key]}
                real={distributions[spec.key].real_value ?? result?.real_metrics?.[spec.key]}
              />
            ) : null)}
          </div>
        </div>
      )}
    </div>
  )
}

/** Results or Graph tab content for one market simulation. */
export function SimulationResultsView({ result, section }: SimulationResultsViewProps) {
  const status = String(result?.status || "").toLowerCase()
  // A failed or cancelled run fills only the top-level fields, settings and error.
  const finished = status === "completed"

  if (!finished) {
    return (
      <div className="space-y-6">
        <RunSummary result={result} />
        <div className="rounded-md border border-red-600/40 bg-red-500/10 px-4 py-3 text-[11px] font-semibold text-red-400">
          {status === "cancelled"
            ? "This market simulation was cancelled."
            : result?.error || "This market simulation failed."}
        </div>
      </div>
    )
  }

  if (section === "graph") {
    return (
      <div className="space-y-8">
        <Warnings warnings={result?.warnings} />
        <Graphs result={result} />
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <Warnings warnings={result?.warnings} />
      <RunSummary result={result} />
      <VerdictTable verdict={result?.verdict} />
      <DistributionTable result={result} />
      <RegimeTable regimes={result?.regimes} />
      <RealMonthsTable months={result?.regimes?.real_months} />
      <CalibrationPanel calibration={result?.calibration} />
    </div>
  )
}
