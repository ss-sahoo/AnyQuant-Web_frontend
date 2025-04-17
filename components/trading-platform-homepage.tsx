"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { AlgorithmTable } from "@/components/algorithm-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { mockAlgorithms, mockShortlistedAlgorithms } from "@/lib/mock-data"

export function TradingPlatformHomepage() {
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
    <div className="flex min-h-screen bg-[#121420] text-white">
      <Sidebar currentPage="home" />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-normal">draft algorithms</h1>
            <div className="flex gap-4">
              <Link href="/dashboard">
                <Button variant="outline" className="border-[#6BCAE2] text-[#6BCAE2] hover:bg-[#6BCAE2]/10">
                  View Dashboard
                </Button>
              </Link>
              <Button className="bg-[#6BCAE2] hover:bg-[#5AB9D1] text-black rounded-full px-6">Create Algorithm</Button>
            </div>
          </div>

          <AlgorithmTable algorithms={algorithms} onDelete={(id) => handleDeleteAlgorithm(id, false)} />

          <h1 className="text-3xl font-normal mt-12 mb-8">shortlisted strategy variants</h1>

          <AlgorithmTable algorithms={shortlistedAlgorithms} onDelete={(id) => handleDeleteAlgorithm(id, true)} />
        </div>
      </main>
    </div>
  )
}
