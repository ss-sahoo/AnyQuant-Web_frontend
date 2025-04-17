"use client"

import { useState } from "react"
import { MoreVertical } from "lucide-react"
import type { Algorithm } from "@/lib/types"
import { AlgorithmMenu } from "@/components/algorithm-menu"

interface ResponsiveAlgorithmTableProps {
  algorithms: Algorithm[]
  onDelete: (id: string) => void
}

export function ResponsiveAlgorithmTable({ algorithms, onDelete }: ResponsiveAlgorithmTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id)
  }

  return (
    <div className="bg-panel rounded-lg overflow-hidden">
      {/* Desktop header - hidden on mobile */}
      <div className="hidden md:grid grid-cols-12 px-6 py-4 border-b border-panel-dark">
        <div className="col-span-4 font-medium text-white">Strategy name</div>
        <div className="col-span-4 font-medium text-white">Instruments</div>
        <div className="col-span-3 font-medium text-white">TFs</div>
        <div className="col-span-1"></div>
      </div>

      {/* Responsive rows */}
      {algorithms.map((algorithm) => (
        <div key={algorithm.id} className="border-b border-panel-dark last:border-0">
          {/* Desktop view - hidden on mobile */}
          <div className="hidden md:grid grid-cols-12 px-6 py-4 items-center">
            <div className="col-span-4">{algorithm.name}</div>
            <div className="col-span-4">{algorithm.instrument}</div>
            <div className="col-span-3">-----------</div>
            <div className="col-span-1 relative flex justify-end">
              <button
                onClick={() => toggleMenu(algorithm.id)}
                className="p-1 rounded-full hover:bg-panel-dark transition-colors"
                aria-label="Menu"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {openMenuId === algorithm.id && (
                <AlgorithmMenu
                  onClose={() => setOpenMenuId(null)}
                  onDelete={() => {
                    onDelete(algorithm.id)
                    setOpenMenuId(null)
                  }}
                />
              )}
            </div>
          </div>

          {/* Mobile view - hidden on desktop */}
          <div className="md:hidden px-6 py-4 relative">
            <div className="flex justify-between items-center mb-2">
              <div className="font-medium">{algorithm.name}</div>
              <button
                onClick={() => toggleMenu(algorithm.id)}
                className="p-1 rounded-full hover:bg-panel-dark transition-colors"
                aria-label="Menu"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
              <div>Instruments:</div>
              <div className="text-white">{algorithm.instrument}</div>
              <div>TFs:</div>
              <div className="text-white">-----------</div>
            </div>

            {openMenuId === algorithm.id && (
              <AlgorithmMenu
                onClose={() => setOpenMenuId(null)}
                onDelete={() => {
                  onDelete(algorithm.id)
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
