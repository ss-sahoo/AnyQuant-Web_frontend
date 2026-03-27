"use client"

import { useRef, useState } from "react"
import { MoreVertical } from "lucide-react"
import type { Algorithm } from "@/lib/types"
import { AlgorithmMenu } from "@/components/algorithm-menu"

interface AlgorithmTableProps {
  algorithm: Algorithm[]
  onDelete: (id: string) => void
  onDuplicate?: (name: string, instrument: string) => void
  onEdit?: (algorithm: Algorithm) => void
  onRemoveFromShortlist?: (id: string) => void
  loading?: boolean
}

export function AlgorithmShortTable({ algorithm, onDelete, onDuplicate, onEdit, onRemoveFromShortlist, loading = false }: AlgorithmTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const buttonRefs = useRef<Record<string, HTMLButtonElement>>({})

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id)
  }

  const handleDuplicate = (id: string, name: string, instrument: string) => {
    if (onDuplicate) {
      onDuplicate(name, instrument)
    }
  }

  const handleEdit = (id: string, name: string) => {
    if (onEdit) {
      const algorithms = algorithm.find((algo) => algo.id === id)
      if (algorithms) {
        const updatedAlgorithm: Algorithm = {
          ...algorithms,
          name,
        }
        onEdit(updatedAlgorithm)
      }
    }
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
        <div className="p-8 text-center text-gray-400">Loading shortlisted strategies...</div>
      ) : algorithm.length === 0 ? (
        <div className="p-8 text-center text-gray-400">No shortlisted strategies yet</div>
      ) : (
        algorithm.map((algo) => (
        <div key={algo.id} className="grid grid-cols-12 p-4 border-b border-gray-800 last:border-0 items-center">
          <div className="col-span-4">{algo.name}</div>
          <div className="col-span-4">{algo.instrument}</div>
          <div className="col-span-3">-----------</div>
          <div className="col-span-1 relative">
            <button
              ref={(el) => {
                if (el) buttonRefs.current[algo.id] = el
              }}
              onClick={() => toggleMenu(algo.id)}
              className="p-1 rounded-full hover:bg-gray-700 transition-colors"
              aria-label="Menu"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {openMenuId === algo.id && buttonRefs.current[algo.id] && (
              <AlgorithmMenu
                anchorRef={{ current: buttonRefs.current[algo.id] }}
                algorithm={algo}
                onClose={() => setOpenMenuId(null)}
                onDelete={() => {
                  onDelete(algo.id)
                  setOpenMenuId(null)
                }}
                onDuplicate={(name, instrument) => {
                  handleDuplicate(algo.id, name, instrument)
                  setOpenMenuId(null)
                }}
                onEdit={(name) => {
                  handleEdit(algo.id, name)
                  setOpenMenuId(null)
                }}
                onRemoveFromShortlist={onRemoveFromShortlist ? (id) => {
                  onRemoveFromShortlist(id)
                  setOpenMenuId(null)
                } : undefined}
                isShortlisted={true}
              />
            )}
          </div>
        </div>
        ))
      )}
    </div>
  )
}
