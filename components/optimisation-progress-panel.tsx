"use client"

import React from "react"

// Shared by the Strategy Tester's local runs and the cloud run page
// (app/optimization-results), so both read `progress` the same way.

// "~6m remaining". Returns null when the backend has no estimate, so the
// caller can omit the row entirely rather than render a placeholder.
function formatEta(seconds: any): string | null {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return null
  if (seconds < 60) return `~${Math.round(seconds)}s remaining`
  if (seconds < 3600) return `~${Math.round(seconds / 60)}m remaining`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)
  return minutes > 0 ? `~${hours}h ${minutes}m remaining` : `~${hours}h remaining`
}

function minutesSince(timestamp: any): number | null {
  if (!timestamp) return null
  const then = new Date(timestamp).getTime()
  if (!Number.isFinite(then)) return null
  return Math.max(0, Math.floor((Date.now() - then) / 60000))
}

/**
 * Live progress for an optimisation run, from the `progress` block on
 * GET /api/job-status/<run_id>/. Every field is optional — the panel renders
 * whatever the backend reports and silently omits the rest.
 */
export function OptimisationProgressPanel({
  progress,
  stale,
  percent,
  label,
  onCancel,
}: {
  progress: any
  stale?: boolean
  percent: number
  label: string
  onCancel?: () => void
}) {
  const phaseTotal = Number(progress?.phase_total) || 0
  const phaseIndex = Number(progress?.phase_index) || 0
  const phaseLabel = progress?.phase_label || progress?.phase || null
  const done = Number(progress?.done)
  const total = Number(progress?.total)
  const hasCounts = Number.isFinite(done) && Number.isFinite(total) && total > 0
  const eta = formatEta(progress?.eta_seconds)
  const staleMinutes = stale ? minutesSince(progress?.updated_at) : null

  return (
    <div className="mb-8 rounded-lg border border-gray-800 bg-[#080A10] p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[#85e1fe]">{label}</div>
          {phaseLabel && (
            <div className="mt-2 text-sm font-semibold text-white">
              {phaseLabel}
              {phaseTotal > 0 && (
                <span className="ml-2 text-[11px] font-medium text-gray-500">
                  Phase {phaseIndex} of {phaseTotal}
                </span>
              )}
            </div>
          )}
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 px-4 py-1.5 rounded-full border border-red-500 text-red-500 bg-red-500/10 hover:bg-red-500/20 text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Phase stepper */}
      {phaseTotal > 0 && (
        <div className="flex items-center gap-1.5 mb-5">
          {Array.from({ length: phaseTotal }).map((_, idx) => {
            const step = idx + 1
            const isDone = step < phaseIndex
            const isCurrent = step === phaseIndex
            return (
              <div
                key={step}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  isCurrent ? 'bg-[#85e1fe]' : isDone ? 'bg-[#85e1fe]/40' : 'bg-gray-800'
                }`}
                title={isCurrent && phaseLabel ? phaseLabel : `Phase ${step}`}
              />
            )
          })}
        </div>
      )}

      {stale ? (
        <div className="rounded-md border border-yellow-600/40 bg-yellow-500/10 px-4 py-3 text-[11px] font-semibold text-yellow-400">
          Still running — no update
          {staleMinutes != null ? ` for ${staleMinutes}m` : ' recently'}
        </div>
      ) : (
        <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
          <div
            className="h-full bg-[#85e1fe] transition-all duration-500"
            style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px]">
        {hasCounts && (
          <span className="font-mono text-white">
            {progress?.phase === 'running_ga' ? 'Generation' : 'Step'} {done} of {total}
          </span>
        )}
        {typeof progress?.percent === 'number' && (
          <span className="font-mono text-gray-400">{Math.round(progress.percent)}%</span>
        )}
        {eta && <span className="text-gray-400">{eta}</span>}
      </div>

      {progress?.detail && (
        <div className="mt-3 text-[11px] text-gray-400 font-mono break-words">{progress.detail}</div>
      )}
    </div>
  )
}

