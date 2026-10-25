"use client"

import React, { useEffect, useState } from "react"
import { Plus, Minus } from "lucide-react"
import { deleteSimulationResult, listSimulationResults } from "@/app/AllApiCalls"
import { formatDuration, formatStart } from "@/lib/run-cost-timing"

interface SimulationHistoryListProps {
  strategyId: string | number
  strategyType: "no_code" | "dev_mode"
  /** Opens a finished, failed or cancelled run. */
  onSelect: (simulationId: number) => void
  /** Called for a row that is still running, with its run_id so it can be followed. */
  onSelectRunning?: (runId: string) => void
  /** Any change refetches, so a finished run stops reading "running". */
  refreshToken?: string
  onDeleted?: (simulationId: number) => void
}

const COLLAPSED_ROWS = 2

const VERDICT_STYLES: Record<string, string> = {
  PASS: "bg-green-500/10 text-green-400 border-green-500/40",
  WARN: "bg-yellow-500/10 text-yellow-400 border-yellow-500/40",
  FAIL: "bg-red-500/10 text-red-400 border-red-500/40",
}

const statusColor = (status: string) => {
  switch (status) {
    case "completed": return "text-green-400"
    case "failed": return "text-red-400"
    case "cancelled": return "text-gray-400"
    default: return "text-[#85e1fe]"
  }
}

const fmtNum = (value: any, digits = 2) =>
  typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "-"

export function SimulationHistoryList({
  strategyId,
  strategyType,
  onSelect,
  onSelectRunning,
  refreshToken,
  onDeleted,
}: SimulationHistoryListProps) {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [reloadTick, setReloadTick] = useState(0)

  useEffect(() => {
    if (!strategyId) return
    let isCancelled = false
    setLoading(true)
    setError(null)
    listSimulationResults({ strategy_type: strategyType, strategy_id: strategyId, page: 1, page_size: 50 })
      .then((payload: any) => {
        if (isCancelled) return
        setRows(Array.isArray(payload) ? payload : payload?.results || [])
      })
      .catch((err: any) => {
        if (isCancelled) return
        console.error("Failed to load market simulations:", err)
        setError(err?.message || "Failed to load market simulations")
      })
      .finally(() => {
        if (!isCancelled) setLoading(false)
      })
    return () => {
      isCancelled = true
    }
  }, [strategyId, strategyType, refreshToken, reloadTick])

  const handleDelete = async (row: any) => {
    if (!window.confirm("Delete this market simulation result?")) return
    try {
      await deleteSimulationResult(row.id)
      onDeleted?.(row.id)
      setReloadTick((tick) => tick + 1)
    } catch (err: any) {
      console.error("Failed to delete market simulation:", err)
      setError(err?.message || "Failed to delete market simulation")
    }
  }

  const handleView = (row: any) => {
    if (String(row.status || "").toLowerCase() === "running") {
      onSelectRunning?.(row.run_id)
      return
    }
    onSelect(row.id)
  }

  const visibleRows = expanded ? rows : rows.slice(0, COLLAPSED_ROWS)

  return (
    <div>
      <h3 className="text-xs font-black text-gray-500 mb-6 uppercase tracking-[0.4em]">Market Simulation History</h3>
      {loading && rows.length === 0 ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-[#85e1fe] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-400 py-8 text-[10px] font-black uppercase tracking-widest">{error}</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-10 bg-[#141721] rounded-lg">
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em]">No previous market simulations</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-[10px] border-separate border-spacing-y-2">
            <thead>
              <tr className="bg-[#141721] text-gray-400 font-black uppercase tracking-widest text-[9px]">
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Paths</th>
                <th className="px-4 py-3 text-left">Timeframe</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Verdict</th>
                <th className="px-4 py-3 text-right">Real / Median Sharpe</th>
                <th className="px-4 py-3 text-right">Profitable Paths</th>
                <th className="px-4 py-3 text-right">Time</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const status = String(row.status || "").toLowerCase()
                const verdict = String(row.verdict_status || "").toUpperCase()
                return (
                  <tr
                    key={row.id}
                    className="bg-[#080A10] text-[#85e1fe] cursor-pointer hover:bg-[#121420] transition-all font-medium"
                    onClick={() => handleView(row)}
                  >
                    <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">{formatStart(row.created_at ?? null)}</td>
                    <td className="px-4 py-3 text-gray-300">{row.n_paths ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-300">{row.timeframe ?? "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${statusColor(status)} border border-current opacity-80`}>
                        {status || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {verdict ? (
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${VERDICT_STYLES[verdict] ?? "bg-gray-800 text-gray-400 border-gray-700"}`}>
                          {verdict}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-white whitespace-nowrap">
                      {fmtNum(row.real_sharpe)} / {fmtNum(row.median_sharpe)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-white">
                      {typeof row.positive_return_share === "number" ? `${(row.positive_return_share * 100).toFixed(0)}%` : "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-300 whitespace-nowrap">
                      {formatDuration(typeof row.execution_time_seconds === "number" ? row.execution_time_seconds : null)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleView(row)
                        }}
                        className="text-[#85e1fe] hover:text-white font-black uppercase text-[9px] tracking-widest"
                      >
                        {status === "running" ? "View progress" : "View"}
                      </button>
                      {status !== "running" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(row)
                          }}
                          className="ml-4 text-red-400 hover:text-red-300 font-black uppercase text-[9px] tracking-widest"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {rows.length > COLLAPSED_ROWS && (
            <div className="flex justify-center mt-2">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141721] hover:bg-[#1f2335] border border-gray-700 text-gray-300 text-[9px] font-black uppercase tracking-widest transition-colors"
                aria-expanded={expanded}
              >
                {expanded ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {expanded ? "Show less" : `Show all (${rows.length})`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
