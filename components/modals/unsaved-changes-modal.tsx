"use client"

import { useEffect } from "react"
import { AlertTriangle, Loader2, Save, Trash2 } from "lucide-react"

interface UnsavedChangesModalProps {
  /** What the pending edits belong to — drives the copy and the name label. */
  kind: "strategy" | "component"
  /** Collect a name before saving: true when the editor has none or an invalid one. */
  needsName: boolean
  name: string
  onNameChange: (name: string) => void
  /** Set when the name is missing or malformed. */
  nameError: string | null
  /** Set when the save itself failed — leaving stays blocked until it succeeds. */
  saveError: string | null
  isSaving: boolean
  onSave: () => void
  onDiscard: () => void
  onCancel: () => void
}

/**
 * Confirmation shown when leaving Developer Mode with unsaved code (ANY-308).
 * Saving here goes through the same backend create/update as the Save Draft
 * button, so the record is really persisted and gets an id — it never lives
 * only in the editor's memory. Dark-themed to match the Developer Mode surface
 * it renders over.
 */
export function UnsavedChangesModal({
  kind,
  needsName,
  name,
  onNameChange,
  nameError,
  saveError,
  isSaving,
  onSave,
  onDiscard,
  onCancel,
}: UnsavedChangesModalProps) {
  const noun = kind === "strategy" ? "strategy" : "component"

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) onCancel()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onCancel, isSaving])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-lg border border-[#2A2D42] bg-[#1A1D24] p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-6 w-6 flex-shrink-0 text-yellow-400" />
          <div>
            <h2 className="text-xl font-semibold text-white">Unsaved changes</h2>
            <p className="mt-1 text-sm text-gray-400">
              Your {noun} code hasn't been saved. Save it to keep your work, or discard it and leave.
            </p>
          </div>
        </div>

        {needsName && (
          <div className="mt-5">
            <label className="mb-2 block text-sm text-gray-400">
              {kind === "strategy" ? "Strategy Name" : "Component Name"}
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={kind === "strategy" ? "e.g., my_rsi_strategy" : "e.g., My Indicator"}
              className="w-full rounded-lg border border-[#2A2D42] bg-[#151718] px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-[#85e1fe] focus:outline-none"
            />
            <p className="mt-2 text-xs text-gray-500">
              {kind === "strategy"
                ? "Use letters, numbers, and underscores only. Cannot start with a number."
                : "This is how the component appears in the components sidebar."}
            </p>
          </div>
        )}

        {(nameError || saveError) && (
          <p className="mt-4 text-sm text-red-400">{nameError || saveError}</p>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2 text-gray-400 transition-colors hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onDiscard}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg border border-red-500/40 px-4 py-2 text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Discard changes
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-[#85e1fe] px-4 py-2 text-black transition-colors hover:bg-[#5AB9D1] disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? "Saving..." : "Save & leave"}
          </button>
        </div>
      </div>
    </div>
  )
}
