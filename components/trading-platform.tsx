"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { AlgorithmTable } from "@/components/algorithm-table"
import { CreateAlgorithmButton } from "@/components/create-algorithm-button"
import { mockAlgorithms, mockShortlistedAlgorithms } from "@/lib/mock-data"
import { MobileSidebar } from "./mobile-sidebar"

export function TradingPlatform() {
  const [algorithms, setAlgorithms] = useState(mockAlgorithms)
  const [shortlistedAlgorithms, setShortlistedAlgorithms] = useState(mockShortlistedAlgorithms)

  const handleDeleteAlgorithm = (id: string, isShortlisted: boolean) => {
    if (isShortlisted) {
      setShortlistedAlgorithms(shortlistedAlgorithms.filter((algo) => algo.id !== id))
    } else {
      setAlgorithms(algorithms.filter((algo) => algo.id !== id))
    }
  }

  return (
    <div className="flex min-h-screen bg-background text-white">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      <div className="md:hidden">
        <MobileSidebar />
      </div>

      <main className="flex-1 px-4 py-6 md:px-8 md:py-8 w-full">
        <div className="max-w-7xl mx-auto">
          {/* Draft Algorithms Section */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-[28px] font-normal">draft algorithms</h1>
            <CreateAlgorithmButton />
          </div>

          <AlgorithmTable algorithms={algorithms} onDelete={(id) => handleDeleteAlgorithm(id, false)} />

          {/* Shortlisted Strategy Variants Section */}
          <h1 className="text-2xl md:text-[28px] font-normal mt-12 mb-6">shortlisted strategy variants</h1>

          <AlgorithmTable algorithms={shortlistedAlgorithms} onDelete={(id) => handleDeleteAlgorithm(id, true)} />
        </div>
      </main>
    </div>
  )
}
