"use client"

import { useEffect, useMemo, useState } from "react"
import { X } from "lucide-react"
import {
  ParameterSchema,
  ParamRuntimeValue,
  isOptimizableValue,
  OHLCV_SOURCES,
  schemaToDefaults,
} from "@/lib/custom-component-schema"
import { getCustomComponent } from "@/app/AllApiCalls"
import { normalizeStoredParameters } from "@/lib/custom-component-schema"
import { DraggableModal } from "./draggable-modal"

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
  const isPresetTimeframe = TIMEFRAME_OPTIONS.some((o) => o.value === timeframe)
  const [useCustomTimeframe, setUseCustomTimeframe] = useState<boolean>(!!initialTimeframe && !isPresetTimeframe)

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

  // Seed values once we have schemas. Optimisation ranges are configured
  // later in the Properties tab on the strategy-testing page, not here.
  useEffect(() => {
    if (!open) return
    const defaults = schemaToDefaults(schemas)
    const merged: Record<string, ParamRuntimeValue> = { ...defaults, ...(initialValues || {}) }
    setValues(merged)
  }, [schemas, initialValues, open])

  const canSave = useMemo(() => !loadingSchemas && !schemaError, [loadingSchemas, schemaError])

  if (!open) return null

  const setParam = (name: string, v: ParamRuntimeValue) => {
    setValues((prev) => ({ ...prev, [name]: v }))
  }

  // When the existing value is an optimisable range (set later in Properties),
  // updating the single-value input should update only `.value` and preserve
  // the rest of the range so the user doesn't lose their configuration.
  const setNumericParam = (name: string, n: number) => {
    setValues((prev) => {
      const cur = prev[name]
      if (isOptimizableValue(cur)) {
        return { ...prev, [name]: { ...cur, value: n } }
      }
      return { ...prev, [name]: n }
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

    if (p.type === "int" || p.type === "float") {
      const num = isOptimizableValue(v)
        ? v.value
        : typeof v === "number"
          ? v
          : Number(v) || 0
      return (
        <input
          type="number"
          value={num}
          min={p.min}
          max={p.max}
          step={p.step ?? (p.type === "int" ? 1 : 0.1)}
          onChange={(e) => {
            const raw = e.target.value
            if (raw === "") return setNumericParam(p.name, 0)
            const n = p.type === "int" ? parseInt(raw, 10) : parseFloat(raw)
            setNumericParam(p.name, Number.isFinite(n) ? n : 0)
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
    <DraggableModal onClose={onClose} className="bg-[#1A1D24] rounded-lg w-[520px] max-h-[85vh] overflow-hidden flex flex-col">
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
              {useCustomTimeframe ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    placeholder="e.g. 3m, 45m, 2h, 12h"
                    className="flex-1 min-w-0 px-3 py-2 bg-[#0D0F12] border border-[#2A2D42] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#85e1fe]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomTimeframe(false)
                      if (!TIMEFRAME_OPTIONS.some((o) => o.value === timeframe)) {
                        setTimeframe("1h")
                      }
                    }}
                    className="shrink-0 px-3 py-2 text-xs text-gray-400 hover:text-white border border-[#2A2D42] rounded-lg transition-colors"
                  >
                    Use preset
                  </button>
                </div>
              ) : (
                <select
                  value={timeframe}
                  onChange={(e) => {
                    if (e.target.value === "__custom__") {
                      setUseCustomTimeframe(true)
                      setTimeframe("")
                    } else {
                      setTimeframe(e.target.value)
                    }
                  }}
                  className="w-full px-3 py-2 bg-[#0D0F12] border border-[#2A2D42] rounded-lg text-white focus:outline-none focus:border-[#85e1fe]"
                >
                  {TIMEFRAME_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                  <option value="__custom__">Add custom…</option>
                </select>
              )}
            </div>
          )}

          {!loadingSchemas && !schemaError && schemas.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              This component has no configurable parameters.
            </p>
          )}

          {!loadingSchemas && !schemaError && schemas.map((p) => {
            return (
              <div key={p.name} className="space-y-2">
                <label className="text-sm text-gray-300">
                  {p.name}
                </label>
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
    </DraggableModal>
  )
}
