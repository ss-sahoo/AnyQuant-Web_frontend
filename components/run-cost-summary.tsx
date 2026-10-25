"use client"

import { formatCost, formatDuration, formatStart, type RunCostTiming } from "@/lib/run-cost-timing"

interface RunCostSummaryProps {
  timing: RunCostTiming
  /** Tile background; the results pages and the tester use different panels. */
  tileClassName?: string
}

/** Estimated cost, actual cost, total time and start of one optimisation run. */
export function RunCostSummary({ timing, tileClassName = "bg-[#141721] rounded-lg p-4" }: RunCostSummaryProps) {
  // A running job's elapsed time; the parent's poll re-renders it.
  const elapsed = timing.running && timing.startedAt
    ? (Date.now() - new Date(timing.startedAt).getTime()) / 1000
    : null

  const tiles: [string, string][] = [
    ["Estimated Cost", timing.local ? "No cost (local run)" : formatCost(timing.estimatedCost)],
    ["Actual Cost", timing.local
      ? "No cost (local run)"
      : timing.running ? "Settled when the run ends" : formatCost(timing.actualCost)],
    ["Total Time", elapsed !== null && elapsed >= 0
      ? `${formatDuration(elapsed)} so far`
      : formatDuration(timing.durationSeconds)],
    ["Started", formatStart(timing.startedAt)],
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {tiles.map(([label, value]) => (
        <div key={label} className={tileClassName}>
          <p className="text-gray-400 text-sm">{label}</p>
          <p className="text-white font-semibold">{value}</p>
        </div>
      ))}
    </div>
  )
}
