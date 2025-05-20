"use client"

import { useEffect, useState } from "react"
import { MoreVertical } from 'lucide-react'
import type { Algorithm } from "@/lib/types"
import { AlgorithmMenu } from "@/components/algorithm-menu"
import { fetchStatement } from "@/app/AllApiCalls"

interface AlgorithmTableProps {
  algorithms: Algorithm[]
  loading: boolean
  onDelete: (id: string) => void
  onDuplicate?: (algorithm: Algorithm) => void
  onEdit: (id: string, name: string, instrument: string) => void
}

export function AlgorithmTable({algorithms, onDelete, onDuplicate, onEdit ,loading}: AlgorithmTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  
  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id)
  }

  const handleDuplicate = (id: string, name: string, instrument: string) => {
    if (onDuplicate) {
      const algorithm = algorithms.find((algo) => algo.id === id)
      if (algorithm) {
        const duplicatedAlgorithm: Algorithm = {
          ...algorithm,
          id: `${algorithm.id}-duplicate-${Date.now()}`,
          name,
          instrument,
        }
        onDuplicate(duplicatedAlgorithm)
      }
    }
  }

  const handleEdit = (id: string, name: string, instrument: string) => {
    if (onEdit) {
      const algorithm = algorithms.find((algo) => algo.id === id)
      if (algorithm) {
        const updatedAlgorithm: Algorithm = {
          ...algorithm,
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
              {algorithm.strategy && typeof algorithm.strategy === 'object' && algorithm.strategy.timeframe 
                ? algorithm.strategy.timeframe 
                : '-----------'}
            </div>
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
                onDelete={() => onDelete(algorithm.id)}
                onEdit={(name, instrument) => {
                  onEdit?.(algorithm.id, name, instrument)  // ✅ correct now
                }}
                onDuplicate={(name, instrument) => {
                  onDuplicate?.({ ...algorithm, name, instrument })
                }}
              />
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}