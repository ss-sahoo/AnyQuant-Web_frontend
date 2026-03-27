"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { AlgorithmTable } from "@/components/algorithm-table"
import { ChartView } from "@/components/chart-view"
import { AccountsSection } from "@/components/accounts-section"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { mockAlgorithms } from "@/lib/mock-data"
import type { Algorithm } from "@/lib/types"
import AuthGuard from "@/hooks/useAuthGuard"

export function ResponsiveExpandedDashboard() {
  const [algorithms, setAlgorithms] = useState(mockAlgorithms)

  const handleDeleteAlgorithm = (id: string) => {
    setAlgorithms(algorithms.filter((algo) => algo.id !== id))
  }

  const handleDuplicateAlgorithm = (duplicatedAlgorithm: Algorithm) => {
    setAlgorithms([...algorithms, duplicatedAlgorithm])
  }

  return (
    <AuthGuard>
    <div className="flex min-h-screen bg-[#121420] text-white">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar currentPage="dashboard" />
      </div>

      {/* Mobile sidebar */}
      <MobileSidebar currentPage="dashboard" />

      <main className="flex-1 p-4 md:p-8 w-full">
        <div className="max-w-7xl mx-auto">
          {/* Navigation */}
          <div className="mb-4 flex justify-end">
            <Link href="/home">
              <Button variant="outline" className="border-[#6BCAE2] text-[#6BCAE2] hover:text-[#6BCAE2] hover:bg-[#6BCAE2]/10">
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Chart Section */}
          <div className="mb-6 md:mb-8">
            <ChartView />
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Draft Algorithms Section - Takes 2/3 of the width on large screens */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <div className="flex justify-between items-center mb-4">
                {/* <h1 className="text-xl md:text-2xl font-normal">Draft algorithms</h1> */}
                <Link href="/strategy-builder?new=1">
                <button
                  className="bg-[#6BCAE2] hover:bg-[#5AB9D1] text-black rounded-full px-4 md:px-6 py-1.5 md:py-2 text-xs md:text-sm"
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

              <AlgorithmTable
                algorithms={algorithms}
                onDelete={handleDeleteAlgorithm}
                onDuplicate={handleDuplicateAlgorithm}
              />
            </div>

            {/* Accounts Section - Takes 1/3 of the width on large screens */}
            <div className="lg:col-span-1 order-1 lg:order-2 mb-6 lg:mb-0">
              <AccountsSection />
            </div>
          </div>
        </div>
      </main>
    </div>
    </AuthGuard>
  )
}
