"use client"

import type { MouseEvent } from "react"
import { ClipboardCopy } from "lucide-react"

interface CopyToDefaultsButtonProps {
  onCopy: () => void
  /** Why the set can't be copied. Disables the button and becomes its tooltip. */
  disabledReason?: string | null
  /** Omit for the icon-only button in table rows. */
  label?: string
  /** Tooltip while enabled. */
  title?: string
}

/**
 * Copies an optimised parameter set into the Properties tab's Value column.
 * Clicks don't reach the row underneath, whose own click selects it.
 */
export function CopyToDefaultsButton({ onCopy, disabledReason, label, title }: CopyToDefaultsButtonProps) {
  const disabled = !!disabledReason
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    if (!disabled) onCopy()
  }

  // A disabled button fires no mouse events, so the tooltip sits on a wrapper.
  return (
    <span title={disabledReason || title || "Copy to defaults"} className="inline-flex" onClick={(e) => e.stopPropagation()}>
      {label ? (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#85e1fe] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#6bcae2] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ClipboardCopy className="w-3 h-3" />
          {label}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          aria-label="Copy to defaults"
          className="p-1 text-gray-500 hover:text-[#85e1fe] transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-500"
        >
          <ClipboardCopy className="w-3.5 h-3.5" />
        </button>
      )}
    </span>
  )
}
