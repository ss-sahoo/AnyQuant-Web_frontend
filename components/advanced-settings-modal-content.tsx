"use client"

import type React from "react"
import { X } from "lucide-react"

interface AdvancedSettingsModalContentProps {
  populationSize: string
  setPopulationSize: React.Dispatch<React.SetStateAction<string>>
  generations: string
  setGenerations: React.Dispatch<React.SetStateAction<string>>
  mutationRate: string
  setMutationRate: React.Dispatch<React.SetStateAction<string>>
  tournamentSize: string
  setTournamentSize: React.Dispatch<React.SetStateAction<string>>
  onClose: () => void
  onSave: () => void
}

export function AdvancedSettingsModalContent({
  populationSize,
  setPopulationSize,
  generations,
  setGenerations,
  mutationRate,
  setMutationRate,
  tournamentSize,
  setTournamentSize,
  onClose,
  onSave,
}: AdvancedSettingsModalContentProps) {
  return (
    <div className="bg-[#f5f5f5] rounded-lg shadow-lg w-full max-w-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-black">Advanced Settings</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-sm text-gray-600 mb-2">Population size</label>
          <input
            type="text"
            value={populationSize}
            onChange={(e) => setPopulationSize(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-black"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-2">Generations</label>
          <input
            type="text"
            value={generations}
            onChange={(e) => setGenerations(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-black"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-2">Mutation rate</label>
          <input
            type="text"
            value={mutationRate}
            onChange={(e) => setMutationRate(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-black"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-2">Tournament size</label>
          <input
            type="text"
            value={tournamentSize}
            onChange={(e) => setTournamentSize(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-black"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button onClick={onClose} className="px-6 py-3 border border-gray-300 rounded-full text-black">
          Cancel
        </button>
        <button onClick={onSave} className="px-6 py-3 bg-[#85e1fe] rounded-full text-black">
          Save
        </button>
      </div>
    </div>
  )
}
