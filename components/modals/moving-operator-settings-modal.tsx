"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { DraggableModal } from "./draggable-modal"
import { isOptimizableValue, scalarParamValue, type OptimizableValue } from "@/lib/custom-component-schema"

interface MovingOperatorSettingsModalProps {
  onClose: () => void
  onSave: (settings: {
    logical_operator: string
    // Carries the optimisation range straight back out when the param is being
    // optimised, so editing the threshold here does not discard it.
    value: number | OptimizableValue
    unit: string
  }) => void
  initialSettings?: {
    logical_operator: string
    // Once a param is marked optimisable in the Properties tab its stored value
    // is `{ start, step, stop, value }`, not a bare number.
    value: number | OptimizableValue
    unit: string
  }
  operatorType: "moving_up" | "moving_down"
}

export function MovingOperatorSettingsModal({
  onClose,
  onSave,
  initialSettings,
  operatorType,
}: MovingOperatorSettingsModalProps) {
  const [logicalOperator, setLogicalOperator] = useState(initialSettings?.logical_operator || ">=")
  // Edit the scalar only. `|| 20` would also swallow a legitimate 0, so fall
  // back only when there is genuinely nothing numeric to show.
  const [value, setValue] = useState<number>(() => {
    const scalar = scalarParamValue(initialSettings?.value)
    return typeof scalar === "number" && Number.isFinite(scalar) ? scalar : 20
  })
  const [unit, setUnit] = useState(initialSettings?.unit || "points")

  // Preserved verbatim so Save can put the threshold back inside the range the
  // user set up for optimisation instead of flattening it to a plain number.
  const optimisationRange = isOptimizableValue(initialSettings?.value)
    ? (initialSettings!.value as OptimizableValue)
    : null

  useEffect(() => {
    // Convert incoming 'pips' to 'points' for consistency
    if (initialSettings?.unit === "pips") {
      setUnit("points")
    }
  }, [initialSettings])

  const logicalOperators = [
    { value: ">=", label: "Greater than or equal (>=)" },
    { value: "<=", label: "Less than or equal (<=)" },
    { value: ">", label: "Greater than (>)" },
    { value: "<", label: "Less than (<)" },
    { value: "==", label: "Equal (==)" },
    { value: "!=", label: "Not equal (!=)" },
  ]

  const units = [
    { value: "%", label: "Percentage (%)" },
    { value: "points", label: "Points" },
    { value: "", label: "No unit" },
  ]

  const handleSave = () => {
    onSave({
      logical_operator: logicalOperator,
      value: optimisationRange ? { ...optimisationRange, value } : value,
      unit: unit,
    })
  }

  return (
    <DraggableModal onClose={onClose} className="bg-white rounded-lg p-6 w-full max-w-md">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-black">
            {operatorType === "moving_up" ? "Increasing Settings" : "Decreasing Settings"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Logical Operator */}
          <div>
            <label className="block text-sm font-medium mb-2 text-black">Logical Operator</label>
            <select
              value={logicalOperator}
              onChange={(e) => setLogicalOperator(e.target.value)}
              className="w-full text-black bg-white border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {logicalOperators.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          {/* Value */}
          <div>
            <label className="block text-sm font-medium mb-2 text-black">Value</label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="w-full text-black bg-white border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter value"
            />
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-medium mb-2 text-black">Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full bg-white text-black border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {units.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <div className="bg-gray-100 p-3 rounded-md">
            <p className="text-sm text-gray-600">
              <strong>Preview:</strong> {operatorType.replace("_", " ")} {logicalOperator} {value}{unit}
            </p>
            {optimisationRange && (
              <p className="text-xs text-gray-500 mt-1">
                Optimising over {optimisationRange.start} to {optimisationRange.stop} (step {optimisationRange.step}). This value is the starting point.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </DraggableModal>
  )
}