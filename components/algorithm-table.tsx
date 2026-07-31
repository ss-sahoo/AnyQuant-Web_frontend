"use client"

import { useRef, useState } from "react"
import { MoreVertical } from "lucide-react"
import type { Algorithm } from "@/lib/types"
import { isCustomStrategyRow, type BuilderType } from "@/lib/builder-mode"
import { AlgorithmMenu } from "@/components/algorithm-menu"

interface AlgorithmTableProps {
  algorithms: Algorithm[]
  loading: boolean
  onDelete: (id: string) => void
  onDuplicate?: (name: string, instrument: string) => void
  onEdit: (id: string, name: string) => void
  onAddToShortlist?: (id: string) => void
  onChangeType?: (id: string, type: BuilderType) => void
  onConvertToHybrid?: (id: string) => void
}

export function AlgorithmTable({
  algorithms,
  onDelete,
  onDuplicate,
  onEdit,
  loading,
  onAddToShortlist,
  onChangeType,
  onConvertToHybrid,
}: AlgorithmTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id)
  }

  const typeBadge: Record<NonNullable<Algorithm["type"]>, { label: string; className: string }> = {
    nocode: { label: "No-code", className: "bg-slate-500/20 text-slate-300" },
    developer: { label: "Developer", className: "bg-purple-500/20 text-purple-300" },
    hybrid: { label: "Hybrid", className: "bg-teal-500/20 text-teal-300" },
  }

  // Click order matches the badge's meaning rather than the enum order: from
  // pure no-code, through the mixed state, to pure code.
  const TYPE_CYCLE: BuilderType[] = ["nocode", "hybrid", "developer"]
  const nextType = (type: BuilderType) => TYPE_CYCLE[(TYPE_CYCLE.indexOf(type) + 1) % TYPE_CYCLE.length]

  return (
    <div className="bg-[#1E2132] rounded-lg overflow-hidden">
      <div className="grid grid-cols-12 p-4 border-b border-gray-800">
        <div className="col-span-3 font-medium text-gray-300">Strategy name</div>
        <div className="col-span-2 font-medium text-gray-300">Type</div>
        <div className="col-span-3 font-medium text-gray-300">Instruments</div>
        <div className="col-span-3 font-medium text-gray-300">TFs</div>
        <div className="col-span-1"></div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-4">Loading strategies...</div>
      ) : algorithms.length === 0 ? (
        <div className="text-center text-gray-400 py-4">No strategies found.</div>
      ) : (
        algorithms.map((algorithm) => (
          <div
            key={algorithm.id}
            className="grid grid-cols-12 p-4 border-b border-gray-800 last:border-0 items-center"
          >
            <div className="col-span-3">{algorithm.name}</div>
            <div className="col-span-2">
              {algorithm.type && (
                // Code-only rows have no no-code side, so their type is fixed —
                // "Change type" in the menu offers the conversion instead.
                isCustomStrategyRow(algorithm.id) || !onChangeType ? (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${typeBadge[algorithm.type].className}`}
                    title={isCustomStrategyRow(algorithm.id) ? "Code-only strategy — convert it to Hybrid to add a no-code side" : undefined}
                  >
                    {typeBadge[algorithm.type].label}
                  </span>
                ) : (
                  <button
                    onClick={() => onChangeType(algorithm.id, nextType(algorithm.type!))}
                    title={`Change type (currently ${typeBadge[algorithm.type].label})`}
                    className={`px-2 py-0.5 rounded-full text-xs transition-opacity hover:opacity-80 ${typeBadge[algorithm.type].className}`}
                  >
                    {typeBadge[algorithm.type].label}
                  </button>
                )
              )}
            </div>
            <div className="col-span-3">{algorithm.instrument}</div>
            <div className="col-span-3">
              {algorithm.strategy?.timeframe || "-----------"}
            </div>
            <div className="col-span-1 relative">
              <button
                ref={(el) => (menuButtonRefs.current[algorithm.id] = el)}
                onClick={() => toggleMenu(algorithm.id)}
                className="p-1 rounded-full hover:bg-gray-700 transition-colors"
                aria-label="Menu"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            {openMenuId === algorithm.id && (
              <AlgorithmMenu
                anchorRef={{ current: menuButtonRefs.current[algorithm.id] }}
                algorithm={algorithm}
                onClose={() => setOpenMenuId(null)}
                onDelete={() => onDelete(algorithm.id)}
                onEdit={(name) =>
                  onEdit(algorithm.id, name)
                }
                onDuplicate={(name, instrument) =>
                  onDuplicate?.(name, instrument)
                }
                onAddToShortlist={onAddToShortlist}
                onChangeType={
                  onChangeType && !isCustomStrategyRow(algorithm.id)
                    ? (type) => onChangeType(algorithm.id, type)
                    : undefined
                }
                onConvertToHybrid={
                  onConvertToHybrid && isCustomStrategyRow(algorithm.id)
                    ? () => onConvertToHybrid(algorithm.id)
                    : undefined
                }
              />
            )}
          </div>
        ))
      )}
    </div>
  )
}
