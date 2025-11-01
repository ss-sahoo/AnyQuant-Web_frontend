"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { AlgorithmTable } from "@/components/algorithm-table"
import { ChartView } from "@/components/chart-view"
import { AccountsSection } from "@/components/accounts-section"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { mockAlgorithms } from "@/lib/mock-data"

export function ExpandedDashboard() {
  const [algorithms, setAlgorithms] = useState(mockAlgorithms)

  const handleDeleteAlgorithm = (id: string) => {
    setAlgorithms(algorithms.filter((algo) => algo.id !== id))
  }

  return (
    <div className="flex min-h-screen bg-[#121420] text-white">
      <Sidebar currentPage="dashboard" />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Navigation */}
          <div className="mb-4 flex justify-end">
            <Link href="/">
              <Button variant="outline" className="border-[#6BCAE2] text-[#6BCAE2] hover:bg-[#6BCAE2]/10">
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Chart Section */}
          <div className="mb-8">
            <ChartView />
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Draft Algorithms Section - Takes 2/3 of the width on large screens */}
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                {/* <h1 className="text-2xl font-normal">Draft algorithms</h1> */}
                <Link href="/strategy-builder?new=1">
                <button
                  className="bg-[#6BCAE2] hover:bg-[#5AB9D1] text-black rounded-full px-6 py-2 text-sm"
                  onClick={() => {
                    try {
                      if (typeof window !== 'undefined') {
                        window.localStorage.removeItem('strategy_id')
                        window.sessionStorage.removeItem('builder_saved')
                      }
                    } catch {}
                  }}
                >
                  Create Strategy
                </button>
                </Link>
              </div>

              <AlgorithmTable algorithms={algorithms} onDelete={handleDeleteAlgorithm} />
            </div>

            {/* Accounts Section - Takes 1/3 of the width on large screens */}
            <div className="lg:col-span-1">
              <AccountsSection />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
