"use client"

import { useState } from "react"
import { MoreVertical } from "lucide-react"
import type { Algorithm } from "@/lib/types"
import { AlgorithmMenu } from "@/components/algorithm-menu"

interface ResponsiveTableProps {
  algorithms: Algorithm[]
  onDelete: (id: string) => void
}

export function ResponsiveTable({ algorithms, onDelete }: ResponsiveTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id)
  }

  return (
    <div className="bg-[#1E2132] rounded-lg overflow-hidden">
      {/* Desktop header - hidden on mobile */}
      <div className="hidden md:grid grid-cols-12 p-4 border-b border-gray-800">
        <div className="col-span-4 font-medium text-gray-300">Strategy name</div>
        <div className="col-span-4 font-medium text-gray-300">Instruments</div>
        <div className="col-span-3 font-medium text-gray-300">TFs</div>
        <div className="col-span-1"></div>
      </div>

      {/* Responsive rows */}
      {algorithms.map((algorithm) => (
        <div key={algorithm.id} className="border-b border-gray-800 last:border-0">
          {/* Desktop view - hidden on mobile */}
          <div className="hidden md:grid grid-cols-12 p-4 items-center">
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
          <div className="md:hidden p-4 relative">
            <div className="flex justify-between items-center mb-2">
              <div className="font-medium">{algorithm.name}</div>
              <button
                onClick={() => toggleMenu(algorithm.id)}
                className="p-1 rounded-full hover:bg-gray-700 transition-colors"
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
