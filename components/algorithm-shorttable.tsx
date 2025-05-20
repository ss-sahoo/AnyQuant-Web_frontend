"use client"

import { useState } from "react"
import { MoreVertical } from "lucide-react"
import type { Algorithm } from "@/lib/types"
import { AlgorithmMenu } from "@/components/algorithm-menu"

interface AlgorithmTableProps {
  algorithm: Algorithm[]
  onDelete: (id: string) => void
  onDuplicate?: (algorithm: Algorithm) => void
  onEdit?: (algorithm: Algorithm) => void
}

export function AlgorithmShortTable({ algorithm, onDelete, onDuplicate, onEdit }: AlgorithmTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id)
  }

  const handleDuplicate = (id: string, name: string, instrument: string) => {
    if (onDuplicate) {
      const algorithms = algorithm.find((algo) => algo.id === id)
      if (algorithms) {
        const duplicatedAlgorithm: Algorithm = {
          ...algorithms,
          id: `${algorithms.id}-duplicate-${Date.now()}`,
          name,
          instrument,
        }
        onDuplicate(duplicatedAlgorithm)
      }
    }
  }

  const handleEdit = (id: string, name: string, instrument: string) => {
    if (onEdit) {
      const algorithms = algorithm.find((algo) => algo.id === id)
      if (algorithms) {
        const updatedAlgorithm: Algorithm = {
          ...algorithms,
          name,
          instrument,
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

      {algorithm.map((algorithm) => (
        <div key={algorithm.id} className="grid grid-cols-12 p-4 border-b border-gray-800 last:border-0 items-center">
          <div className="col-span-4">{algorithm.name}</div>
          <div className="col-span-4">{algorithm.instrument}</div>
          <div className="col-span-3">-----------</div>
          <div className="col-span-1 relative">
            <button
              onClick={() => toggleMenu(algorithm.id)}
              className="p-1 rounded-full hover:bg-gray-700 transition-colors"
              aria-label="Menu"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {openMenuId === algorithm.id && (
              <AlgorithmMenu
                algorithm={algorithm}
                onClose={() => setOpenMenuId(null)}
                onDelete={() => {
                  onDelete(algorithm.id)
                  setOpenMenuId(null)
                }}
                onDuplicate={(name, instrument) => {
                  handleDuplicate(algorithm.id, name, instrument)
                  setOpenMenuId(null)
                }}
                onEdit={(name, instrument) => {
                  handleEdit(algorithm.id, name, instrument)
                  setOpenMenuId(null)
                }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
