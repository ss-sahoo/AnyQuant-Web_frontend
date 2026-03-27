"use client"

import { useRef, useState } from "react"
import { MoreVertical } from "lucide-react"
import type { Algorithm } from "@/lib/types"
import { AlgorithmMenu } from "@/components/algorithm-menu"

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

  return (
    <div className="bg-[#1E2132] rounded-lg overflow-hidden">
      <div className="grid grid-cols-12 p-4 border-b border-gray-800">
        <div className="col-span-4 font-medium text-gray-300">Strategy name</div>
        <div className="col-span-4 font-medium text-gray-300">Instruments</div>
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
            <div className="col-span-4">{algorithm.name}</div>
            <div className="col-span-4">{algorithm.instrument}</div>
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
              />
            )}
          </div>
        ))
      )}
    </div>
  )
}
