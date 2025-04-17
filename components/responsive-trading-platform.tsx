"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { AlgorithmTable } from "@/components/algorithm-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { mockAlgorithms, mockShortlistedAlgorithms } from "@/lib/mock-data"
import type { Algorithm } from "@/lib/types"

export function ResponsiveTradingPlatform() {
  const [algorithms, setAlgorithms] = useState(mockAlgorithms)
  const [shortlistedAlgorithms, setShortlistedAlgorithms] = useState(mockShortlistedAlgorithms)

  const user_id = localStorage.getItem("user_id")
  console.log("user id ", user_id)
  const handleDeleteAlgorithm = (id: string, isShortlisted: boolean) => {
    if (isShortlisted) {
      setShortlistedAlgorithms(shortlistedAlgorithms.filter((algo) => algo.id !== id))
    } else {
      setAlgorithms(algorithms.filter((algo) => algo.id !== id))
    }
  }

  const handleDuplicateAlgorithm = (duplicatedAlgorithm: Algorithm, isShortlisted: boolean) => {
    if (isShortlisted) {
      setShortlistedAlgorithms([...shortlistedAlgorithms, duplicatedAlgorithm])
    } else {
      setAlgorithms([...algorithms, duplicatedAlgorithm])
    }
  }

  const handleEditAlgorithm = (updatedAlgorithm: Algorithm, isShortlisted: boolean) => {
    if (isShortlisted) {
      setShortlistedAlgorithms(
        shortlistedAlgorithms.map((algo) => (algo.id === updatedAlgorithm.id ? updatedAlgorithm : algo)),
      )
    } else {
      setAlgorithms(algorithms.map((algo) => (algo.id === updatedAlgorithm.id ? updatedAlgorithm : algo)))
    }
  }

  return (
    <div className="flex min-h-screen bg-[#121420] text-white">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar currentPage="home" />
      </div>

      {/* Mobile sidebar */}
      <MobileSidebar currentPage="home" />

      <main className="flex-1 p-4 md:p-8 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4 md:gap-0">
            <h1 className="text-2xl md:text-3xl font-normal">Draft Algorithms</h1>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="border-[#6BCAE2] text-[#6BCAE2] hover:bg-[#6BCAE2]/10 w-full sm:w-auto"
                >
                  View Dashboard
                </Button>
              </Link>
              <Button className="bg-[#6BCAE2] hover:bg-[#5AB9D1] text-black rounded-full px-4 md:px-6 w-full sm:w-auto">
                Create Algorithm
              </Button>
            </div>
          </div>

          <AlgorithmTable
            algorithms={algorithms}
            onDelete={(id) => handleDeleteAlgorithm(id, false)}
            onDuplicate={(algorithm) => handleDuplicateAlgorithm(algorithm, false)}
            onEdit={(algorithm) => handleEditAlgorithm(algorithm, false)}
          />

          <h1 className="text-2xl md:text-3xl font-normal mt-8 md:mt-12 mb-6 md:mb-8">shortlisted strategy variants</h1>

          <AlgorithmTable
            algorithms={shortlistedAlgorithms}
            onDelete={(id) => handleDeleteAlgorithm(id, true)}
            onDuplicate={(algorithm) => handleDuplicateAlgorithm(algorithm, true)}
            onEdit={(algorithm) => handleEditAlgorithm(algorithm, true)}
          />
        </div>
      </main>
    </div>
  )
}
