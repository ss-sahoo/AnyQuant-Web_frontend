"use client"

import { useEffect, useMemo, useState } from "react"
import { X } from "lucide-react"
import {
  ParameterSchema,
  ParamRuntimeValue,
  OptimizableValue,
  isOptimizableValue,
  OHLCV_SOURCES,
  schemaToDefaults,
} from "@/lib/custom-component-schema"
import { getCustomComponent } from "@/app/AllApiCalls"
import { normalizeStoredParameters } from "@/lib/custom-component-schema"

export type CustomComponentKind = "indicator" | "behavior" | "trade_management"

interface Props {
  open: boolean
  componentName: string
  componentType: CustomComponentKind
  // Either pass schemas directly, or pass componentId to fetch them.
  parameterSchemas?: ParameterSchema[]
  componentId?: number
  initialValues?: Record<string, ParamRuntimeValue>
  initialTimeframe?: string
  initialInput?: string
  onClose: () => void
  onSave: (payload: {
    values: Record<string, ParamRuntimeValue>
    timeframe?: string
    input?: string
  }) => void
}

const TIMEFRAME_OPTIONS = [
  { value: "1m", label: "1 Minute" },
  { value: "5m", label: "5 Minutes" },
  { value: "15m", label: "15 Minutes" },
  { value: "30m", label: "30 Minutes" },
  { value: "1h", label: "1 Hour" },
  { value: "4h", label: "4 Hours" },
  { value: "1d", label: "1 Day" },
  { value: "1w", label: "1 Week" },
]

const DEFAULT_RANGE = { start: 0, step: 1, stop: 100 }

function toOptimizable(current: ParamRuntimeValue, p: ParameterSchema): OptimizableValue {
  if (isOptimizableValue(current)) return current
  const num = Number(current)
  const value = Number.isFinite(num) ? num : Number(p.default) || 0
  const min = p.min ?? DEFAULT_RANGE.start
  const max = p.max ?? Math.max(min + 1, value * 2 || DEFAULT_RANGE.stop)
  const step = p.step ?? DEFAULT_RANGE.step
  return { start: min, step, stop: max, value }
}

function fromOptimizable(v: OptimizableValue): number {
  return v.value
}

export function CustomComponentPropertiesDialog({
  open,
  componentName,
  componentType,
  parameterSchemas,
  componentId,
  initialValues,
  initialTimeframe,
  initialInput,
  onClose,
  onSave,
}: Props) {
  const [schemas, setSchemas] = useState<ParameterSchema[]>(parameterSchemas ?? [])
  const [loadingSchemas, setLoadingSchemas] = useState(false)
  const [schemaError, setSchemaError] = useState<string | null>(null)

  const [values, setValues] = useState<Record<string, ParamRuntimeValue>>({})
  const [timeframe, setTimeframe] = useState<string>(initialTimeframe || "1h")
  const [source, setSource] = useState<string>(initialInput || "Close")
  const [optRangeOn, setOptRangeOn] = useState<Record<string, boolean>>({})

  // Fetch schema if only componentId was passed.
  useEffect(() => {
    if (!open) return
    if (parameterSchemas && parameterSchemas.length >= 0 && !componentId) {
      setSchemas(parameterSchemas)
      return
    }
    if (componentId && (!parameterSchemas || parameterSchemas.length === 0)) {
      setLoadingSchemas(true)
      setSchemaError(null)
      getCustomComponent(componentId)
        .then((c: any) => {
          setSchemas(normalizeStoredParameters(c?.parameters))
        })
        .catch((err: any) => {
          setSchemaError(err?.message || "Failed to load component schema")
        })
        .finally(() => setLoadingSchemas(false))
    }
  }, [open, componentId, parameterSchemas])

  // Seed values + optRange flags once we have schemas.
  useEffect(() => {
    if (!open) return
    const defaults = schemaToDefaults(schemas)
    const merged: Record<string, ParamRuntimeValue> = { ...defaults, ...(initialValues || {}) }
    setValues(merged)

    const rangeFlags: Record<string, boolean> = {}
    for (const p of schemas) {
      rangeFlags[p.name] = isOptimizableValue(merged[p.name])
    }
    setOptRangeOn(rangeFlags)
  }, [schemas, initialValues, open])

  const canSave = useMemo(() => !loadingSchemas && !schemaError, [loadingSchemas, schemaError])

  if (!open) return null

  const setParam = (name: string, v: ParamRuntimeValue) => {
    setValues((prev) => ({ ...prev, [name]: v }))
  }

  const toggleRange = (p: ParameterSchema) => {
    const on = !optRangeOn[p.name]
    setOptRangeOn((prev) => ({ ...prev, [p.name]: on }))
    setValues((prev) => {
      if (on) {
        return { ...prev, [p.name]: toOptimizable(prev[p.name], p) }
      } else {
        const cur = prev[p.name]
        return { ...prev, [p.name]: isOptimizableValue(cur) ? fromOptimizable(cur) : cur }
      }
    })
  }

  const handleSave = () => {
    const payload: {
      values: Record<string, ParamRuntimeValue>
      timeframe?: string
      input?: string
    } = { values }
    if (componentType === "indicator") {
      payload.timeframe = timeframe
      // Only include `input` if the schema has a `source` param OR the caller
      // seeded one. We don't invent one.
      const hasSourceParam = schemas.some((s) => s.type === "source")
      if (!hasSourceParam && initialInput !== undefined) payload.input = source
    }
    onSave(payload)
  }

  const renderValueControl = (p: ParameterSchema) => {
    const v = values[p.name]
    const rangeOn = !!optRangeOn[p.name]

    if (rangeOn && (p.type === "int" || p.type === "float")) {
      const ov = isOptimizableValue(v) ? v : toOptimizable(v, p)
      const step = p.type === "int" ? (p.step ?? 1) : (p.step ?? 0.1)
      return (
        <div className="grid grid-cols-4 gap-2">
          {(["start", "step", "stop", "value"] as const).map((k) => (
            <div key={k}>
              <label className="block text-[10px] uppercase text-gray-500 mb-1">{k}</label>
              <input
                type="number"
                value={ov[k]}
                step={step}
                onChange={(e) => {
                  const n = parseFloat(e.target.value)
                  setParam(p.name, { ...ov, [k]: Number.isFinite(n) ? n : 0 })
                }}
                className="w-full px-2 py-1 bg-[#0D0F12] border border-[#2A2D42] rounded text-white text-sm focus:outline-none focus:border-[#85e1fe]"
              />
            </div>
          ))}
        </div>
      )
    }

    if (p.type === "int" || p.type === "float") {
      const num = typeof v === "number" ? v : Number(v) || 0
      return (
        <input
          type="number"
          value={num}
          min={p.min}
          max={p.max}
          step={p.step ?? (p.type === "int" ? 1 : 0.1)}
          onChange={(e) => {
            const raw = e.target.value
            if (raw === "") return setParam(p.name, 0)
            const n = p.type === "int" ? parseInt(raw, 10) : parseFloat(raw)
            setParam(p.name, Number.isFinite(n) ? n : 0)
          }}
          className="w-full px-3 py-2 bg-[#0D0F12] border border-[#2A2D42] rounded-lg text-white focus:outline-none focus:border-[#85e1fe]"
        />
      )
    }

    if (p.type === "bool") {
      const checked = typeof v === "boolean" ? v : String(v) === "true"
      return (
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setParam(p.name, e.target.checked)}
            className="w-4 h-4 accent-[#85e1fe]"
          />
          <span className="text-sm text-gray-300">{checked ? "True" : "False"}</span>
        </label>
      )
    }

    if (p.type === "select") {
      const options = p.options || []
      const sv = v === undefined ? "" : String(v)
      return (
        <select
          value={sv}
          onChange={(e) => setParam(p.name, e.target.value)}
          className="w-full px-3 py-2 bg-[#0D0F12] border border-[#2A2D42] rounded-lg text-white focus:outline-none focus:border-[#85e1fe]"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )
    }

    if (p.type === "source") {
      const sv = v === undefined ? "Close" : String(v)
      return (
        <select
          value={sv}
          onChange={(e) => setParam(p.name, e.target.value)}
          className="w-full px-3 py-2 bg-[#0D0F12] border border-[#2A2D42] rounded-lg text-white focus:outline-none focus:border-[#85e1fe]"
        >
          {OHLCV_SOURCES.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )
    }

    // string
    return (
      <input
        type="text"
        value={typeof v === "string" ? v : String(v ?? "")}
        onChange={(e) => setParam(p.name, e.target.value)}
        className="w-full px-3 py-2 bg-[#0D0F12] border border-[#2A2D42] rounded-lg text-white focus:outline-none focus:border-[#85e1fe]"
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1A1D24] rounded-lg w-[520px] max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#2A2D42]">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {componentType === "indicator" ? "Custom Indicator" :
               componentType === "behavior" ? "Custom Behavior" :
               "Custom Trade Management"} Settings
            </h2>
            <p className="text-sm text-[#85e1fe]">{componentName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">
          {loadingSchemas && (
            <p className="text-sm text-gray-400 text-center py-4">Loading parameters…</p>
          )}
          {schemaError && (
            <p className="text-sm text-red-400 text-center py-4">{schemaError}</p>
          )}

          {!loadingSchemas && !schemaError && componentType === "indicator" && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Timeframe</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full px-3 py-2 bg-[#0D0F12] border border-[#2A2D42] rounded-lg text-white focus:outline-none focus:border-[#85e1fe]"
              >
                {TIMEFRAME_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}

          {!loadingSchemas && !schemaError && schemas.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              This component has no configurable parameters.
            </p>
          )}

          {!loadingSchemas && !schemaError && schemas.map((p) => {
            const label = p.display_name || p.name
            const showRangeToggle = !!p.optimizable && (p.type === "int" || p.type === "float")
            return (
              <div key={p.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300">
                    {label}
                    {p.name !== label && (
                      <span className="ml-2 text-xs text-gray-500">({p.name})</span>
                    )}
                  </label>
                  {showRangeToggle && (
                    <button
                      type="button"
                      onClick={() => toggleRange(p)}
                      className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                        optRangeOn[p.name]
                          ? "bg-[#85e1fe]/10 border-[#85e1fe] text-[#85e1fe]"
                          : "bg-transparent border-[#2A2D42] text-gray-400 hover:text-white"
                      }`}
                    >
                      {optRangeOn[p.name] ? "Range mode" : "Optimize range"}
                    </button>
                  )}
                </div>
                {renderValueControl(p)}
                {p.description && (
                  <p className="text-xs text-gray-500">{p.description}</p>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-[#2A2D42]">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="px-6 py-2 bg-[#85e1fe] text-black rounded-lg hover:bg-[#5AB9D1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add to Strategy
          </button>
        </div>
      </div>
    </div>
  )
}
