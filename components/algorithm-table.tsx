"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { MoreVertical } from "lucide-react"
import type { Algorithm } from "@/lib/types"
import { AlgorithmMenu } from "@/components/algorithm-menu"
import { builderRouteForRow } from "@/lib/builder-mode"

interface AlgorithmTableProps {
  algorithms: Algorithm[]
  loading: boolean
  onDelete: (id: string) => void
  onDuplicate?: (name: string, instrument: string) => void
  onEdit: (id: string, name: string) => void
  onAddToShortlist?: (id: string) => void
}

export function AlgorithmTable({
  algorithms,
  onDelete,
  onDuplicate,
  onEdit,
  loading,
  onAddToShortlist,
}: AlgorithmTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id)
  }

  // Fixed at creation and display-only: a strategy's type is which builder it
  // lives in (no-code vs Developer Mode) and never changes (ANY-308).
  const typeBadge: Record<NonNullable<Algorithm["type"]>, { label: string; className: string }> = {
    nocode: { label: "No-code", className: "bg-slate-500/20 text-slate-300" },
    developer: { label: "Developer", className: "bg-purple-500/20 text-purple-300" },
  }

  return (
    <div className="bg-[#1E2132] rounded-lg overflow-hidden">
      <div className="grid grid-cols-12 p-4 border-b border-gray-800">
        <div className="col-span-8 font-medium text-gray-300">Strategy name</div>
        <div className="col-span-3 font-medium text-gray-300">Type</div>
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
            {/* `truncate` also zeroes the grid item's automatic minimum size,
                so a long name shortens instead of squeezing the Type column. */}
            <Link
              href={builderRouteForRow(algorithm.id)}
              className="col-span-8 truncate pr-4 hover:text-[#6BCAE2] hover:underline transition-colors"
            >
              {algorithm.name}
            </Link>
            <div className="col-span-3">
              {algorithm.type && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${typeBadge[algorithm.type].className}`}>
                  {typeBadge[algorithm.type].label}
                </span>
              )}
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
              />
            )}
          </div>
        ))
      )}
    </div>
  )
}
